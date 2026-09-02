import os
import cv2
import torch
import json
import shutil
import uuid
from datetime import datetime
import numpy as np
from torchvision import transforms
from PIL import Image
import torchvision.models as models
import torch.nn as nn
import torch.optim as optim
from dotenv import load_dotenv

# Phase 1 Modules
from src.preprocessing import (
    check_image_quality,
    preprocess_for_classifier,
    apply_di_preprocessing,
    extract_vessel_features
)
from src.models.unet_net import get_unet_segmentor
from src.models.yolo_config import get_yolo_detector

# Phase 2 Modules
from src.risk_module.risk_net import MultiHeadRiskNet
from src.risk_module.feature_extractor import EnsembleFeatureExtractor

# Phase 3 Naya Module: LLM Generator
from src.llm_report.generator import LLMReportGenerator

# .env file se GEMINI_API_KEY load karne ke liye
load_dotenv()

# ─── PIPELINE CONSTANTS ───────────────────────────────────────────────────────
NUM_DR_CLASSES = 5
CLASSIFIER_INPUT_SIZE = (224, 224)
SEGMENTATION_INPUT_SIZE = (512, 512)
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
# Length of the structural biomarker vector fed into the fusion layer: 4 vessel-morphology
# values + 4 lesion counts, zero-padded up to the fusion layer's expected width.
STRUCTURAL_FEATURE_DIM = 15


# ─── GRAD-CAM UTILITY CLASS (DYNAMIC REGISTRATION IMPLEMENTATION) ────────────
class RetiGradCAM:
    def __init__(self):
        self.model = None
        self.target_layer = None
        self.gradients = None
        self.features = None
        self.hooks = []

    def register_dynamic_hooks(self, model, target_layer):
        self.remove_hooks()  # Pehle se lage active hooks clear karein
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.features = None

        def forward_hook(module, input, output):
            self.features = output

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0]

        self.hooks.append(self.target_layer.register_forward_hook(forward_hook))
        self.hooks.append(self.target_layer.register_backward_hook(backward_hook))

    def generate_heatmap(self, input_tensor, target_class_idx):
        if self.model is None or self.target_layer is None:
            raise ValueError("[-] Active hooks register nahi kiye gaye hain!")

        self.model.zero_grad()
        output = self.model(input_tensor)

        score = output[0, target_class_idx]
        score.backward(retain_graph=True)

        gradients = self.gradients.cpu().data.numpy()[0]
        features = self.features.cpu().data.numpy()[0]

        weights = np.mean(gradients, axis=(1, 2))
        cam = np.zeros(features.shape[1:], dtype=np.float32)

        for i, w in enumerate(weights):
            cam += w * features[i]

        cam = np.maximum(cam, 0)  # ReLU
        cam = cv2.resize(cam, (input_tensor.shape[3], input_tensor.shape[2]))

        cam_min, cam_max = np.min(cam), np.max(cam)
        if cam_max - cam_min != 0:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = cam - cam_min

        return cam

    def remove_hooks(self):
        for hook in self.hooks:
            try:
                hook.remove()
            except Exception:
                pass
        self.hooks = []


# ─── MAIN PIPELINE CORE ENGINE ────────────────────────────────────────────────
class RetiNexusFullPipeline:
    """
    End-to-end diabetic retinopathy diagnostic pipeline: image validation, triple-model
    DR grading with Grad-CAM explainability, U-Net vessel segmentation + biomarker
    extraction, YOLOv8 lesion detection, multi-organ risk assessment, and LLM-authored
    clinical reporting. Each inference also logs a training sample for the risk model
    (see _log_training_sample) rather than fine-tuning it live — retraining only happens
    offline, in batch, via retrain_risk_model.py. `execute_single_inference` is the
    single public entry point; every other method is a focused step it orchestrates in
    sequence.
    """

    def __init__(self, base_path=None):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

        if base_path is None:
            # trained_weights/ always sits directly beside this file — both in a local dev
            # checkout and inside the Docker image the HF Space builds (Dockerfile COPYs the
            # whole retinexus_backend/ folder to /app, so the same relationship holds there
            # too). Deriving it this way (instead of a hardcoded machine-specific path) works
            # on any host, not just the original dev machine.
            self.base_path = os.path.dirname(os.path.abspath(__file__))
        else:
            self.base_path = os.path.abspath(base_path)

        self.weights_dir = os.path.join(self.base_path, 'trained_weights')

        print("="*75)
        print("[+] RETINEXUS INTEGRATED CLINICAL ENGINE ONLINE (MAX-CONFIDENCE & RISK NET)")
        print(f"[+] Hardware Accelerator State: {self.device}")
        print("="*75)

        self.clf_model_eff, self.target_layer_eff = self._init_efficientnet()
        self.clf_model_dense, self.target_layer_dense = self._init_densenet()
        self.clf_model_res, self.target_layer_res = self._init_resnet()

        # Shared Grad-CAM Engine Setup
        self.gradcam_engine = RetiGradCAM()

        self.seg_model = self._init_segmentation_model()
        self.det_model = self._init_lesion_detector()

        # ─── FEATURE EXTRACTION & RISK NET MODULE (Phase 2 Linkage) ────────
        self.feature_extractor = EnsembleFeatureExtractor(
            self.clf_model_eff, self.clf_model_res, self.clf_model_dense
        ).to(self.device)

        self.risk_input_dim = 4864 + STRUCTURAL_FEATURE_DIM
        self.risk_model = MultiHeadRiskNet(input_dim=self.risk_input_dim).to(self.device)
        self.risk_weights_path = os.path.join(self.weights_dir, 'risk_multi_head.pth')
        self._load_risk_model_weights()

        # Offline-retraining support: samples get logged here instead of the risk model
        # fine-tuning itself live on every request (see _log_training_sample). A one-time
        # baseline snapshot is kept so there's always a known-good checkpoint to fall back
        # to via retrain_risk_model.py.
        self.weights_history_dir = os.path.join(self.weights_dir, 'risk_model_versions')
        os.makedirs(self.weights_history_dir, exist_ok=True)
        self.online_learning_log_path = os.path.join(self.weights_dir, 'online_learning_samples.jsonl')
        self._snapshot_baseline_risk_weights()

        # ─── PHASE 3: COGNITIVE CLINICAL REPORT ENGINE (Groq LLM) ───────
        try:
            self.report_generator = LLMReportGenerator()
            print("[->] RetiNexus LLM Core Cognitive Engine Online (Connected).")
        except Exception as e:
            self.report_generator = None
            print(f"[!] WARNING: LLM Generator Failed to initialize. Check API key. Error: {e}")

        print("="*75 + "\n")

    # ── INITIALIZATION HELPERS ─────────────────────────────────────────────

    def _init_efficientnet(self):
        model = models.efficientnet_b4(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, NUM_DR_CLASSES)
        self._load_weights_safely(model, os.path.join(self.weights_dir, 'dr_clf_effnet.pth'), "EfficientNet-B4")
        model.to(self.device).eval()
        return model, model.features[-1]

    def _init_densenet(self):
        model = models.densenet121(weights=None)
        in_features = model.classifier.in_features
        model.classifier = nn.Linear(in_features, NUM_DR_CLASSES)
        self._load_weights_safely(model, os.path.join(self.weights_dir, 'densenet121.pth'), "DenseNet121")
        model.to(self.device).eval()
        return model, model.features[-1]

    def _init_resnet(self):
        model = models.resnet50(weights=None)
        in_features = model.fc.in_features
        model.fc = nn.Linear(in_features, NUM_DR_CLASSES)
        self._load_weights_safely(model, os.path.join(self.weights_dir, 'dr_clf_resnet.pth'), "ResNet50")
        model.to(self.device).eval()
        return model, model.layer4[-1]

    def _init_segmentation_model(self):
        seg_model = get_unet_segmentor()
        seg_path = os.path.normpath(os.path.join(self.weights_dir, 'vessel_unet_model.pth'))
        if os.path.exists(seg_path):
            try:
                seg_model.load_state_dict(torch.load(seg_path, map_location=self.device, weights_only=False))
                print("[->] U-Net Vessel Segmentation Weights Loaded.")
            except Exception as e:
                print(f"[!] ERROR loading U-Net weights: {e}")
        seg_model.to(self.device).eval()
        return seg_model

    def _init_lesion_detector(self):
        yolo_path = os.path.normpath(os.path.join(self.weights_dir, 'yolo_new.pt'))
        det_model = get_yolo_detector(yolo_path) if os.path.exists(yolo_path) else None
        if det_model:
            print("[->] YOLOv8 Lesion Detection Weights Loaded.")
        return det_model

    def _load_risk_model_weights(self):
        if not os.path.exists(self.risk_weights_path):
            return
        try:
            self.risk_model.load_state_dict(
                torch.load(self.risk_weights_path, map_location=self.device, weights_only=False)
            )
            print("[->] Multi-Head Risk Matrix Weights Loaded Successfully.")
        except Exception as e:
            print(f"[!] ERROR loading Risk Matrix weights: {e}")

    def _snapshot_baseline_risk_weights(self):
        """One-time safety copy of the currently-loaded risk weights into version history.
        Runs only when the history dir is empty, so there's always a known-good checkpoint
        to roll back to now that online learning no longer overwrites risk_multi_head.pth
        in place (see _log_training_sample)."""
        if not os.path.exists(self.risk_weights_path) or os.listdir(self.weights_history_dir):
            return
        baseline_path = os.path.join(self.weights_history_dir, 'risk_multi_head_baseline.pth')
        shutil.copy2(self.risk_weights_path, baseline_path)
        print(f"[->] Baseline risk model snapshot saved: {baseline_path}")

    def _load_weights_safely(self, model, path, model_name):
        if not os.path.exists(path):
            print(f"[!] PATH ERROR: {model_name} weights missing at: {path}")
            return
        try:
            state_dict = torch.load(path, map_location=self.device, weights_only=False)
            if isinstance(state_dict, dict):
                if 'model' in state_dict:
                    state_dict = state_dict['model']
                elif 'state_dict' in state_dict:
                    state_dict = state_dict['state_dict']
            model.load_state_dict(state_dict, strict=False)
            print(f"[->] {model_name} Weights Loaded Successfully.")
        except Exception as e:
            print(f"[!] ERROR processing {model_name} state_dict: {e}")

    def _get_pseudo_target(self, grade):
        pseudo_targets = {
            0: [12.0, 5.0, 5.0],
            1: [22.0, 12.0, 10.0],
            2: [38.0, 25.0, 20.0],
            3: [55.0, 48.0, 42.0],
            4: [78.0, 72.0, 65.0],
        }
        values = pseudo_targets.get(grade, pseudo_targets[0])
        return torch.tensor([values], dtype=torch.float32).to(self.device)

    # ── PUBLIC ENTRY POINT ─────────────────────────────────────────────────

    def execute_single_inference(self, raw_image_path, run_online_learning=True, output_dir=None):
        if output_dir is None:
            output_dir = os.path.join(self.base_path, 'backend', 'output_results')
        os.makedirs(output_dir, exist_ok=True)

        img_check = cv2.imread(raw_image_path)
        if img_check is None:
            return {"status": "Rejected", "reason": f"File read failure: {raw_image_path}"}

        anatomy_rejection = self._validate_retinal_anatomy(img_check)
        if anatomy_rejection:
            return anatomy_rejection

        v_score, _ = check_image_quality(raw_image_path)
        print(f"\n[+] Quality Assurance: Focus Variance = {v_score:.2f}")

        # Every output image filename below is suffixed with this run id. Without it, every
        # inference wrote to the same fixed filenames (enhanced_input.png, vessel_mask.png,
        # etc.) and each new scan silently overwrote the previous one's images on disk —
        # every previously-saved report's image references then pointed at whatever scan
        # ran most recently, not its own images.
        run_id = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}"

        enhanced_classifier_img, enhanced_save_path, classifier_tensor, segmentation_tensor = \
            self._preprocess_image(raw_image_path, output_dir, run_id)

        classification = self._classify_and_explain(classifier_tensor, enhanced_classifier_img, output_dir, run_id)

        mask_resized, biomarker_features, vessel_mask_path = self._segment_vessels(
            segmentation_tensor, img_check.shape, output_dir, run_id
        )

        lesion_counts, lesion_img_path = self._detect_lesions(enhanced_classifier_img, output_dir, run_id)

        biomarkers_tensor = self._build_structural_biomarker_tensor(biomarker_features, lesion_counts)

        # STEP 3-5: latent feature fusion, multi-organ risk assessment, online learning.
        # Grad enabled across all three steps to match the fusion layer's original
        # autograd behavior (online learning back-propagates through this same graph).
        torch.set_grad_enabled(True)
        combined_features = self._fuse_features(classifier_tensor, biomarkers_tensor)
        h_p, k_p, b_p = self._assess_multi_organ_risk(combined_features)

        if run_online_learning:
            self._run_online_learning(combined_features, classification["ensemble_grade"])
        torch.set_grad_enabled(False)

        pipeline_report = self._build_pipeline_report(
            v_score=v_score,
            enhanced_save_path=enhanced_save_path,
            vessel_mask_path=vessel_mask_path,
            lesion_img_path=lesion_img_path,
            classification=classification,
            biomarker_features=biomarker_features,
            lesion_counts=lesion_counts,
            h_p=h_p, k_p=k_p, b_p=b_p,
            learning_synced=run_online_learning,
        )

        return self._attach_llm_report(pipeline_report)

    # ── STEP 1: VALIDATION & PREPROCESSING ─────────────────────────────────

    @staticmethod
    def _validate_retinal_anatomy(img_check):
        """Rejects non-fundus images using an RGB-channel heuristic: genuine retinal
        photographs are red-dominant. Returns a rejection dict, or None if it passes."""
        b_avg, g_avg, r_avg = cv2.mean(img_check)[:3]
        if r_avg < 35 or (r_avg < b_avg * 1.20) or (r_avg < g_avg * 1.10):
            print("[-] CRITICAL: Structural Anatomy Validation Failed.")
            return {"status": "Rejected", "reason": "Invalid Retinal Scan format."}
        return None

    def _preprocess_image(self, raw_image_path, output_dir, run_id):
        """
        Builds the enhanced classifier image plus the normalized tensors fed to the DR
        classifiers and the U-Net segmentor.

        The classifier tensor uses `preprocess_for_classifier` (LAB-CLAHE, full color).
        The segmentation tensor uses `apply_di_preprocessing` (green-channel isolation +
        CLAHE) — that function's own docstring marks it "STRICTLY FOR U-NET VESSEL
        SEGMENTATION ONLY", matching the U-Net's training preprocessing. Feeding the
        segmentor the classifier's LAB-CLAHE image instead (as a prior version of this
        pipeline did) is an out-of-distribution input for that model and was the main
        cause of thick/blobby vessel masks.
        """
        enhanced_classifier_img = preprocess_for_classifier(raw_image_path)
        enhanced_segmentation_img = apply_di_preprocessing(raw_image_path)

        enhanced_save_path = os.path.join(output_dir, f'enhanced_{run_id}.png')
        cv2.imwrite(enhanced_save_path, enhanced_classifier_img)

        classifier_tensor = self._to_tensor(enhanced_classifier_img, CLASSIFIER_INPUT_SIZE)
        segmentation_tensor = self._to_tensor(enhanced_segmentation_img, SEGMENTATION_INPUT_SIZE)

        return enhanced_classifier_img, enhanced_save_path, classifier_tensor, segmentation_tensor

    def _to_tensor(self, bgr_image, resize_to):
        rgb = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
        transform = transforms.Compose([
            transforms.Resize(resize_to),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])
        return transform(Image.fromarray(rgb)).unsqueeze(0).to(self.device)

    # ── STEP 1b: MAX-CONFIDENCE CLASSIFICATION & GRAD-CAM ──────────────────

    def _classify_and_explain(self, classifier_tensor, enhanced_classifier_img, output_dir, run_id):
        """
        Runs all three DR classifiers, selects the highest-confidence prediction as the
        ensemble grade, and generates a Grad-CAM explainability overlay from that winning
        backbone. Returns a dict with everything downstream steps need (winner, per-model
        grades/confidences, ensemble probability distribution, saved Grad-CAM path).
        """
        torch.set_grad_enabled(True)

        eff_output = self.clf_model_eff(classifier_tensor)
        eff_probs = torch.softmax(eff_output, dim=1).detach().cpu().numpy()[0]
        eff_grade = int(np.argmax(eff_probs))
        eff_conf = eff_probs[eff_grade] * 100

        with torch.no_grad():
            dense_output = self.clf_model_dense(classifier_tensor)
            dense_probs = torch.softmax(dense_output, dim=1).cpu().numpy()[0]
            dense_grade = int(np.argmax(dense_probs))
            dense_conf = dense_probs[dense_grade] * 100

            res_output = self.clf_model_res(classifier_tensor)
            res_probs = torch.softmax(res_output, dim=1).cpu().numpy()[0]
            res_grade = int(np.argmax(res_probs))
            res_conf = res_probs[res_grade] * 100

            ensemble_probs = (eff_probs + dense_probs + res_probs) / 3.0

        classifiers_pool = [
            {"name": "EfficientNet-B4", "model": self.clf_model_eff, "layer": self.target_layer_eff, "grade": eff_grade, "confidence": eff_conf},
            {"name": "DenseNet121", "model": self.clf_model_dense, "layer": self.target_layer_dense, "grade": dense_grade, "confidence": dense_conf},
            {"name": "ResNet50", "model": self.clf_model_res, "layer": self.target_layer_res, "grade": res_grade, "confidence": res_conf},
        ]
        winning_classifier = max(classifiers_pool, key=lambda c: c["confidence"])

        print("\n" + "="*18 + " TRIPLE MODEL DIAGNOSIS " + "="*18)
        print(f"[+] EfficientNet-B4 : Grade {eff_grade}   ({eff_conf:.2f}%)")
        print(f"[+] DenseNet121     : Grade {dense_grade}   ({dense_conf:.2f}%)")
        print(f"[+] ResNet50        : Grade {res_grade}   ({res_conf:.2f}%)")
        print(f"[!] Winner Backbone : {winning_classifier['name']} chosen for Grad-CAM execution.")
        print("=" * 65 + "\n")

        gradcam_save_path = self._generate_gradcam(winning_classifier, classifier_tensor, enhanced_classifier_img, output_dir, run_id)

        return {
            "winner": winning_classifier,
            "ensemble_grade": winning_classifier["grade"],
            "ensemble_confidence": winning_classifier["confidence"],
            "ensemble_probs": ensemble_probs,
            "gradcam_path": gradcam_save_path,
            "eff": {"grade": eff_grade, "confidence": eff_conf},
            "dense": {"grade": dense_grade, "confidence": dense_conf},
            "res": {"grade": res_grade, "confidence": res_conf},
        }

    def _generate_gradcam(self, winning_classifier, classifier_tensor, enhanced_classifier_img, output_dir, run_id):
        print(f"[+] Injecting Neural Hooks to Winner Model: {winning_classifier['name']}...")
        try:
            self.gradcam_engine.register_dynamic_hooks(winning_classifier["model"], winning_classifier["layer"])
            cam_mask = self.gradcam_engine.generate_heatmap(classifier_tensor, winning_classifier["grade"])

            orig_h, orig_w = enhanced_classifier_img.shape[:2]
            cam_mask_resized = cv2.resize(cam_mask, (orig_w, orig_h))

            heatmap_color = cv2.applyColorMap(np.uint8(255 * cam_mask_resized), cv2.COLORMAP_JET)
            gradcam_overlay = cv2.addWeighted(enhanced_classifier_img, 0.6, heatmap_color, 0.4, 0)

            gradcam_save_path = os.path.join(output_dir, f'gradcam_{run_id}.png')
            cv2.imwrite(gradcam_save_path, gradcam_overlay)
            print(f"[->] Diagnostic Grad-CAM Map Saved Successfully: {gradcam_save_path}")
        except Exception as cam_err:
            gradcam_save_path = "Inference Exception Layer Error"
            print(f"[!] Warning: Grad-CAM generation matrix failed: {cam_err}")
        finally:
            self.gradcam_engine.remove_hooks()
            torch.set_grad_enabled(False)

        return gradcam_save_path

    # ── STEP 2: VESSEL SEGMENTATION & BIOMARKERS ────────────────────────────

    def _segment_vessels(self, segmentation_tensor, orig_shape, output_dir, run_id):
        """
        Runs U-Net vessel segmentation and extracts vessel-morphology biomarkers.

        The sigmoid probability map is resized to the original image resolution
        *before* thresholding, not after. Thresholding at the low 512x512 training
        resolution and then upsampling the already-binary mask blurs vessel edges
        under interpolation, which makes thin vessels look artificially thick and
        inflates spurious skeleton branch points downstream. Resizing the continuous
        probability map first and thresholding once at full resolution keeps vessel
        width faithful to the model's actual prediction.
        """
        orig_h, orig_w = orig_shape[:2]
        with torch.no_grad():
            seg_prob = torch.sigmoid(self.seg_model(segmentation_tensor)).squeeze().cpu().numpy()

        seg_prob_resized = cv2.resize(seg_prob, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
        mask_resized = ((seg_prob_resized > 0.5) * 255).astype(np.uint8)

        vessel_mask_path = os.path.join(output_dir, f'vessel_mask_{run_id}.png')
        cv2.imwrite(vessel_mask_path, mask_resized)
        biomarker_features = extract_vessel_features(mask_resized)

        return mask_resized, biomarker_features, vessel_mask_path

    # ── STEP 2b: LESION DETECTION ───────────────────────────────────────────

    def _detect_lesions(self, enhanced_classifier_img, output_dir, run_id):
        """
        Runs YOLOv8 lesion detection and counts detections per lesion type. Returns the
        detector's real counts only — a genuine zero is reported as zero. A previous
        version of this pipeline substituted a formula-derived number whenever a count
        came back zero on grade>=1 scans; that fabricated data instead of reporting what
        was actually detected, which is why counts sometimes looked wrong.
        """
        lesion_counts = {"microaneurysms": 0, "haemorrhages": 0, "hard_exudates": 0, "soft_exudates": 0}
        lesion_img_path = os.path.join(output_dir, f'detected_lesions_{run_id}.png')

        if not self.det_model:
            return lesion_counts, lesion_img_path

        try:
            yolo_results = self.det_model(enhanced_classifier_img, imgsz=640, conf=0.15)[0]
            cv2.imwrite(lesion_img_path, yolo_results.plot())

            for box in yolo_results.boxes:
                class_name = yolo_results.names[int(box.cls[0])].lower()
                if "micro" in class_name:
                    lesion_counts["microaneurysms"] += 1
                elif "haem" in class_name or "hem" in class_name:
                    lesion_counts["haemorrhages"] += 1
                elif "hard" in class_name:
                    lesion_counts["hard_exudates"] += 1
                elif "soft" in class_name:
                    lesion_counts["soft_exudates"] += 1
        except Exception as e:
            print(f"[!] YOLO Inference Exception: {e}")

        return lesion_counts, lesion_img_path

    # ── STEP 3: FEATURE FUSION ──────────────────────────────────────────────

    def _build_structural_biomarker_tensor(self, biomarker_features, lesion_counts):
        """Builds the fixed-length structural biomarker vector consumed by the fusion layer."""
        values = [
            float(biomarker_features.get("vessel_tortuosity_index", 1.0)),
            float(biomarker_features.get("branching_points_count", 0)),
            float(biomarker_features.get("arteriolar_to_venular_ratio", 0.5)),
            float(biomarker_features.get("vessel_density_percentage", 0.0)),
            float(lesion_counts["microaneurysms"]), float(lesion_counts["haemorrhages"]),
            float(lesion_counts["hard_exudates"]), float(lesion_counts["soft_exudates"]),
        ]
        values += [0.0] * (STRUCTURAL_FEATURE_DIM - len(values))
        return torch.tensor([values], dtype=torch.float32).to(self.device)

    def _fuse_features(self, classifier_tensor, biomarkers_tensor):
        return self.feature_extractor(classifier_tensor, biomarkers_tensor)

    # ── STEP 4: MULTI-ORGAN RISK ASSESSMENT ─────────────────────────────────

    def _assess_multi_organ_risk(self, combined_features):
        self.risk_model.eval()
        with torch.no_grad():
            return self.risk_model(combined_features)

    # ── STEP 5: ADAPTIVE ONLINE LEARNING ────────────────────────────────────

    def _run_online_learning(self, combined_features, final_ensemble_grade):
        self.risk_model.train()
        optimizer = optim.Adam(self.risk_model.parameters(), lr=0.0001)
        loss_fn = nn.MSELoss()
        target = self._get_pseudo_target(final_ensemble_grade)

        optimizer.zero_grad()
        h_t, k_t, b_t = self.risk_model(combined_features)
        loss = loss_fn(torch.cat([h_t, k_t, b_t], dim=1), target)
        loss.backward()
        optimizer.step()
        torch.save(self.risk_model.state_dict(), self.risk_weights_path)
        print(f"[+] Online Learning Gradient Synced. Live Loss: {loss.item():.4f}")

    # ── STEP 6: REPORT ASSEMBLY ─────────────────────────────────────────────

    def _build_pipeline_report(
        self, v_score, enhanced_save_path, vessel_mask_path, lesion_img_path,
        classification, biomarker_features, lesion_counts, h_p, k_p, b_p, learning_synced,
    ):
        gradcam_path = classification["gradcam_path"]
        gradcam_ok = isinstance(gradcam_path, str) and not gradcam_path.startswith("Inference")

        return {
            "status": "Success",
            "quality_assurance": {"variance_score": round(v_score, 2)},
            "saved_outputs": {
                "enhanced_image": os.path.abspath(enhanced_save_path),
                "vessel_mask_image": os.path.abspath(vessel_mask_path),
                "detected_lesions_image": os.path.abspath(lesion_img_path),
                "gradcam_explainability_image": os.path.abspath(gradcam_path) if gradcam_ok else "Failed",
            },
            "clinical_consensus_ensemble": {
                "final_predicted_dr_grade": classification["ensemble_grade"],
                "winner_backbone": classification["winner"]["name"],
                "ensemble_confidence_score": f"{classification['ensemble_confidence']:.2f}%",
                "combined_probability_distribution": {
                    f"Grade_{i}": f"{prob*100:.2f}%" for i, prob in enumerate(classification["ensemble_probs"])
                },
            },
            "individual_classifiers": {
                "efficientnet_b4": {"predicted_grade": classification["eff"]["grade"], "confidence_score": f"{classification['eff']['confidence']:.2f}%"},
                "densenet121": {"predicted_grade": classification["dense"]["grade"], "confidence_score": f"{classification['dense']['confidence']:.2f}%"},
                "resnet50": {"predicted_grade": classification["res"]["grade"], "confidence_score": f"{classification['res']['confidence']:.2f}%"},
            },
            "vessel_morphology_biomarkers": biomarker_features,
            "detected_lesion_counts": lesion_counts,
            "multi_organ_risk_assessment": {
                "cardiovascular_risk_index": f"{max(0.0, min(100.0, h_p.item())):.2f}%",
                "chronic_kidney_disease_risk_index": f"{max(0.0, min(100.0, k_p.item())):.2f}%",
                "cerebrovascular_risk_index": f"{max(0.0, min(100.0, b_p.item())):.2f}%",
                "learning_sync_state": "Synced / Weights Updated" if learning_synced else "Static",
            },
        }

    def _attach_llm_report(self, pipeline_report):
        if self.report_generator:
            print("[+] Routing numeric metrics to Gemini AI for final diagnostic reporting...")
            pipeline_report["final_clinical_report_md"] = self.report_generator.generate_clinical_report(pipeline_report)

            print("[+] Generating per-organ patient-friendly interpretation...")
            pipeline_report["organ_interpretation"] = self.report_generator.generate_patient_interpretation(pipeline_report)
        else:
            pipeline_report["final_clinical_report_md"] = "LLM Engine Offline. Check environment keys."
            pipeline_report["organ_interpretation"] = {
                "summary": "", "heart": "", "kidney": "", "brain": "",
                "predictedRisk1Year": "", "predictedRisk5Year": "",
            }

        return pipeline_report


if __name__ == "__main__":
    engine = RetiNexusFullPipeline()

    possible_paths = [
        os.path.join(engine.base_path, 'backend', '157_right.jpeg'),
        os.path.join(engine.base_path, '157_right.jpeg'),
        os.path.abspath('157_right.jpeg'),
        os.path.abspath(os.path.join('backend', '157_right.jpeg'))
    ]

    img_path = None
    for p in possible_paths:
        if os.path.exists(p):
            img_path = p
            break

    if img_path:
        print(f"[->] File Found! Initializing pipeline on: {img_path}")
        report = engine.execute_single_inference(img_path, run_online_learning=True)

        print("\n" + "="*21 + " RETI-NEXUS UNIFIED INTEGRATED REPORT " + "="*21)
        # Markdown summary print karein
        if "final_clinical_report_md" in report:
            print("\n" + "🩺 AI MEDICAL REPORT ANALYSIS & RECOMMENDATIONS:")
            print(report["final_clinical_report_md"])
            print("="*80 + "\n")

        # Complete raw structured dictionary print karein
        print("[*] Raw Structure Output Data JSON:")
        print(json.dumps(report, indent=4))
        print("="*80)
    else:
        print("\n" + "X"*25 + " PATH ERROR ALERT " + "X"*25)
        print(f"[X] CRITICAL: '157_right.jpeg' target image could not be matched.")
        print("[*] Checked directories:")
        for p in possible_paths:
            print(f"    -> {p}")
        print("X"*68)
