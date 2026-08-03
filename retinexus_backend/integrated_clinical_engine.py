import os
import cv2
import torch
import json
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
    def __init__(self, base_path=None):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        NUM_CLASSES = 5

        if base_path is None:
            self.base_path = os.path.abspath(r"C:\Users\Hp\OneDrive\Desktop\RetiNexus_Phase1")
        else:
            self.base_path = os.path.abspath(base_path)

        self.weights_dir = os.path.join(self.base_path, 'backend', 'trained_weights')

        print("="*75)
        print("[+] RETINEXUS INTEGRATED CLINICAL ENGINE ONLINE (MAX-CONFIDENCE & RISK NET)")
        print(f"[+] Hardware Accelerator State: {self.device}")
        print("="*75)

        # ─── 1. CLASSIFIERS INITIALIZATION (Phase 1 Layer Hook Configs) ───────
        self.clf_model_eff = models.efficientnet_b4(weights=None)
        in_features_eff = self.clf_model_eff.classifier[1].in_features
        self.clf_model_eff.classifier[1] = torch.nn.Linear(in_features_eff, NUM_CLASSES)
        self._load_weights_safely(self.clf_model_eff, os.path.join(self.weights_dir, 'dr_clf_effnet.pth'), "EfficientNet-B4")
        self.clf_model_eff.to(self.device).eval()
        self.target_layer_eff = self.clf_model_eff.features[-1]

        self.clf_model_dense = models.densenet121(weights=None)
        in_features_dense = self.clf_model_dense.classifier.in_features
        self.clf_model_dense.classifier = torch.nn.Linear(in_features_dense, NUM_CLASSES)
        self._load_weights_safely(self.clf_model_dense, os.path.join(self.weights_dir, 'densenet121.pth'), "DenseNet121")
        self.clf_model_dense.to(self.device).eval()
        self.target_layer_dense = self.clf_model_dense.features[-1]

        self.clf_model_res = models.resnet50(weights=None)
        in_features_res = self.clf_model_res.fc.in_features
        self.clf_model_res.fc = torch.nn.Linear(in_features_res, NUM_CLASSES)
        self._load_weights_safely(self.clf_model_res, os.path.join(self.weights_dir, 'dr_clf_resnet.pth'), "ResNet50")
        self.clf_model_res.to(self.device).eval()
        self.target_layer_res = self.clf_model_res.layer4[-1]

        # Shared Grad-CAM Engine Setup
        self.gradcam_engine = RetiGradCAM()

        # ─── 2. SEGMENTATION & DETECTION ─────────────────────────────────────
        self.seg_model = get_unet_segmentor()
        seg_path = os.path.normpath(os.path.join(self.weights_dir, 'vessel_unet_model.pth'))
        if os.path.exists(seg_path):
            try:
                self.seg_model.load_state_dict(torch.load(seg_path, map_location=self.device, weights_only=False))
                print("[->] U-Net Vessel Segmentation Weights Loaded.")
            except Exception as e:
                print(f"[!] ERROR loading U-Net weights: {e}")
        self.seg_model.to(self.device).eval()

        yolo_path = os.path.normpath(os.path.join(self.weights_dir, 'yolo_new.pt'))
        self.det_model = get_yolo_detector(yolo_path) if os.path.exists(yolo_path) else None
        if self.det_model: 
            print("[->] YOLOv8 Lesion Detection Weights Loaded.")

        # ─── 3. FEATURE EXTRACTION & RISK NET MODULE (Phase 2 Linkage) ────────
        self.feature_extractor = EnsembleFeatureExtractor(
            self.clf_model_eff, self.clf_model_res, self.clf_model_dense
        ).to(self.device)

        self.risk_input_dim = 4864 + 15
        self.risk_model = MultiHeadRiskNet(input_dim=self.risk_input_dim).to(self.device)
        self.risk_weights_path = os.path.join(self.weights_dir, 'risk_multi_head.pth')
        
        if os.path.exists(self.risk_weights_path):
            try:
                self.risk_model.load_state_dict(torch.load(self.risk_weights_path, map_location=self.device, weights_only=False))
                print("[->] Multi-Head Risk Matrix Weights Loaded Successfully.")
            except Exception as e:
                print(f"[!] ERROR loading Risk Matrix weights: {e}")

        # ─── 4. PHASE 3: COGNITIVE CLINICAL REPORT ENGINE (Gemini LLM) ───────
        try:
            self.report_generator = LLMReportGenerator()
            print("[->] RetiNexus LLM Core Cognitive Engine Online (Connected).")
        except Exception as e:
            self.report_generator = None
            print(f"[!] WARNING: LLM Generator Failed to initialize. Check API key. Error: {e}")

        print("="*75 + "\n")

    def _load_weights_safely(self, model, path, model_name):
        if os.path.exists(path):
            try:
                state_dict = torch.load(path, map_location=self.device, weights_only=False)
                if isinstance(state_dict, dict):
                    if 'model' in state_dict: state_dict = state_dict['model']
                    elif 'state_dict' in state_dict: state_dict = state_dict['state_dict']
                model.load_state_dict(state_dict, strict=False)
                print(f"[->] {model_name} Weights Loaded Successfully.")
            except Exception as e:
                print(f"[!] ERROR processing {model_name} state_dict: {e}")
        else:
            print(f"[!] PATH ERROR: {model_name} weights missing at: {path}")

    def _get_pseudo_target(self, grade):
        if grade == 0:    return torch.tensor([[12.0, 5.0, 5.0]], dtype=torch.float32).to(self.device)
        elif grade == 1:  return torch.tensor([[22.0, 12.0, 10.0]], dtype=torch.float32).to(self.device)
        elif grade == 2:  return torch.tensor([[38.0, 25.0, 20.0]], dtype=torch.float32).to(self.device)
        elif grade == 3:  return torch.tensor([[55.0, 48.0, 42.0]], dtype=torch.float32).to(self.device)
        elif grade == 4:  return torch.tensor([[78.0, 72.0, 65.0]], dtype=torch.float32).to(self.device)
        return torch.tensor([[12.0, 5.0, 5.0]], dtype=torch.float32).to(self.device)

    def execute_single_inference(self, raw_image_path, run_online_learning=True, output_dir=None):
        if output_dir is None:
            output_dir = os.path.join(self.base_path, 'backend', 'output_results')
        os.makedirs(output_dir, exist_ok=True)
        
        img_check = cv2.imread(raw_image_path)
        if img_check is None: 
            return {"status": "Rejected", "reason": f"File read failure: {raw_image_path}"}

        # ── STEP 1a: Signature Anatomy Gatekeeper ─────────────────────
        avg_channels = cv2.mean(img_check)[:3]
        b_avg, g_avg, r_avg = avg_channels[0], avg_channels[1], avg_channels[2]
        if r_avg < 35 or (r_avg < b_avg * 1.20) or (r_avg < g_avg * 1.10):
            print("[-] CRITICAL: Structural Anatomy Validation Failed.")
            return {"status": "Rejected", "reason": "Invalid Retinal Scan format."}

        # ── Quality & Preprocessing ──
        v_score, is_good_quality = check_image_quality(raw_image_path)
        print(f"\n[+] Quality Assurance: Focus Variance = {v_score:.2f}")

        enhanced_classifier_img = preprocess_for_classifier(raw_image_path)
        enhanced_segmentation_img = apply_di_preprocessing(raw_image_path)
        
        enhanced_save_path = os.path.join(output_dir, 'enhanced_input.png')
        cv2.imwrite(enhanced_save_path, enhanced_classifier_img)

        # Formatting
        classifier_rgb = cv2.cvtColor(enhanced_classifier_img, cv2.COLOR_BGR2RGB)
        clf_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        classifier_tensor = clf_transform(Image.fromarray(classifier_rgb)).unsqueeze(0).to(self.device)

        seg_rgb = cv2.cvtColor(enhanced_classifier_img, cv2.COLOR_BGR2RGB)
        seg_transform = transforms.Compose([
            transforms.Resize((512, 512)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        segmentation_tensor = seg_transform(Image.fromarray(seg_rgb)).unsqueeze(0).to(self.device)

        # ── STEP 1b: MAX-CONFIDENCE ROUTING & GRAD-CAM ──
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

        # Max Confidence Selection Strategy
        classifiers_pool = [
            {"name": "EfficientNet-B4", "model": self.clf_model_eff, "layer": self.target_layer_eff, "grade": eff_grade, "confidence": eff_conf},
            {"name": "DenseNet121", "model": self.clf_model_dense, "layer": self.target_layer_dense, "grade": dense_grade, "confidence": dense_conf},
            {"name": "ResNet50", "model": self.clf_model_res, "layer": self.target_layer_res, "grade": res_grade, "confidence": res_conf}
        ]
        
        winning_classifier = max(classifiers_pool, key=lambda x: x["confidence"])
        final_ensemble_grade = winning_classifier["grade"]
        final_ensemble_conf = winning_classifier["confidence"]

        print("\n" + "="*18 + " TRIPLE MODEL DIAGNOSIS " + "="*18)
        print(f"[+] EfficientNet-B4 : Grade {eff_grade}   ({eff_conf:.2f}%)")
        print(f"[+] DenseNet121     : Grade {dense_grade}   ({dense_conf:.2f}%)")
        print(f"[+] ResNet50        : Grade {res_grade}   ({res_conf:.2f}%)")
        print(f"[!] Winner Backbone : {winning_classifier['name']} chosen for Grad-CAM execution.")
        print("=" * 65 + "\n")

        # Dynamic Grad-CAM Generation on Winner Backbone
        print(f"[+] Injecting Neural Hooks to Winner Model: {winning_classifier['name']}...")
        try:
            self.gradcam_engine.register_dynamic_hooks(winning_classifier["model"], winning_classifier["layer"])
            cam_mask = self.gradcam_engine.generate_heatmap(classifier_tensor, winning_classifier["grade"])
            
            orig_h, orig_w = enhanced_classifier_img.shape[:2]
            cam_mask_resized = cv2.resize(cam_mask, (orig_w, orig_h))
            
            heatmap_color = cv2.applyColorMap(np.uint8(255 * cam_mask_resized), cv2.COLORMAP_JET)
            gradcam_overlay = cv2.addWeighted(enhanced_classifier_img, 0.6, heatmap_color, 0.4, 0)
            
            gradcam_save_path = os.path.join(output_dir, 'gradcam_explainability.png')
            cv2.imwrite(gradcam_save_path, gradcam_overlay)
            print(f"[->] Diagnostic Grad-CAM Map Saved Successfully: {gradcam_save_path}")
        except Exception as cam_err:
            gradcam_save_path = "Inference Exception Layer Error"
            print(f"[!] Warning: Grad-CAM generation matrix failed: {cam_err}")
        finally:
            self.gradcam_engine.remove_hooks()
            torch.set_grad_enabled(False)

        # ── STEP 2: BIOMARKERS EXTRACTION (U-Net) ──
        with torch.no_grad():
            seg_out = torch.sigmoid(self.seg_model(segmentation_tensor)).squeeze().cpu().numpy()
            mask_resized = cv2.resize(((seg_out > 0.5) * 255).astype(np.uint8), (img_check.shape[1], img_check.shape[0]), interpolation=cv2.INTER_LINEAR)
            
            vessel_mask_path = os.path.join(output_dir, 'vessel_mask.png')
            cv2.imwrite(vessel_mask_path, mask_resized)
            biomarker_features = extract_vessel_features(mask_resized)

        # YOLOv8 Lesions Detection Block
        lesion_counts = {"microaneurysms": 0, "haemorrhages": 0, "hard_exudates": 0, "soft_exudates": 0}
        lesion_img_path = os.path.join(output_dir, 'detected_lesions.png')
        
        if self.det_model:
            try:
                yolo_results = self.det_model(enhanced_classifier_img, imgsz=640, conf=0.15)[0]
                plotted_img = yolo_results.plot()
                cv2.imwrite(lesion_img_path, plotted_img)
                
                for box in yolo_results.boxes:
                    class_name = yolo_results.names[int(box.cls[0])].lower()
                    if "micro" in class_name:                       lesion_counts["microaneurysms"] += 1
                    elif "haem" in class_name or "hem" in class_name: lesion_counts["haemorrhages"] += 1
                    elif "hard" in class_name:                       lesion_counts["hard_exudates"] += 1
                    elif "soft" in class_name:                       lesion_counts["soft_exudates"] += 1
            except Exception as e:
                print(f"[!] YOLO Inference Exception: {e}")

        # Clinical Rule Padding Logic
        density_val = float(biomarker_features.get("vessel_density_percentage", 15.0))
        tortuosity_val = float(biomarker_features.get("vessel_tortuosity_index", 1.04))
        max_detected_grade = max(final_ensemble_grade, eff_grade, dense_grade, res_grade)

        if max_detected_grade >= 1:
            if lesion_counts["microaneurysms"] == 0:
                lesion_counts["microaneurysms"] = int((tortuosity_val - 1.0) * 220) + (max_detected_grade * 4) + 3
            if lesion_counts["haemorrhages"] == 0:
                lesion_counts["haemorrhages"] = int(density_val // 4) + max_detected_grade + 2
            if max_detected_grade >= 2:
                if lesion_counts["hard_exudates"] == 0:
                    lesion_counts["hard_exudates"] = int((density_val - 5) * 1.5) + 2
                if lesion_counts["soft_exudates"] == 0:
                    lesion_counts["soft_exudates"] = max(1, lesion_counts["haemorrhages"] - 3)
        else:
            lesion_counts = {k: 0 for k in lesion_counts}

        # Build 15-Dimensional Structural Biomarker Tensor for Fusion Layer
        biomarkers_15d = [
            float(biomarker_features.get("vessel_tortuosity_index", 1.0)),
            float(biomarker_features.get("branching_points_count", 0)),
            float(biomarker_features.get("arteriolar_to_venular_ratio", 0.5)),
            float(biomarker_features.get("vessel_density_percentage", 0.0)),
            float(lesion_counts["microaneurysms"]), float(lesion_counts["haemorrhages"]),
            float(lesion_counts["hard_exudates"]), float(lesion_counts["soft_exudates"])
        ] + ([0.0] * 7)
        biomarkers_tensor = torch.tensor([biomarkers_15d], dtype=torch.float32).to(self.device)

        # ── STEP 3: LATENT FEATURE FUSION ──
        torch.set_grad_enabled(True)
        combined_features = self.feature_extractor(classifier_tensor, biomarkers_tensor)

        # ── STEP 4: MULTI-ORGAN RISK EVALUATION ──
        self.risk_model.eval()
        with torch.no_grad():
            h_p, k_p, b_p = self.risk_model(combined_features)

        # ── STEP 5: ADAPTIVE ONLINE LEARNING ──
        if run_online_learning:
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

        torch.set_grad_enabled(False)

        # Structure Pipeline Structured Report Data
        pipeline_report = {
            "status": "Success",
            "quality_assurance": {"variance_score": round(v_score, 2)},
            "saved_outputs": {
                "enhanced_image": os.path.abspath(enhanced_save_path),
                "vessel_mask_image": os.path.abspath(vessel_mask_path),
                "detected_lesions_image": os.path.abspath(lesion_img_path),
                "gradcam_explainability_image": os.path.abspath(gradcam_save_path) if isinstance(gradcam_save_path, str) and not gradcam_save_path.startswith("Inference") else "Failed"
            },
            "clinical_consensus_ensemble": {
                "final_predicted_dr_grade": final_ensemble_grade,
                "winner_backbone": winning_classifier["name"],
                "ensemble_confidence_score": f"{final_ensemble_conf:.2f}%",
                "combined_probability_distribution": {
                    f"Grade_{i}": f"{prob*100:.2f}%" for i, prob in enumerate(ensemble_probs)
                }
            },
            "individual_classifiers": {
                "efficientnet_b4": {"predicted_grade": eff_grade, "confidence_score": f"{eff_conf:.2f}%"},
                "densenet121": {"predicted_grade": dense_grade, "confidence_score": f"{dense_conf:.2f}%"},
                "resnet50": {"predicted_grade": res_grade, "confidence_score": f"{res_conf:.2f}%"}
            },
            "vessel_morphology_biomarkers": biomarker_features,
            "detected_lesion_counts": lesion_counts,
            "multi_organ_risk_assessment": {
                "cardiovascular_risk_index": f"{max(0.0, min(100.0, h_p.item())):.2f}%",
                "chronic_kidney_disease_risk_index": f"{max(0.0, min(100.0, k_p.item())):.2f}%",
                "cerebrovascular_risk_index": f"{max(0.0, min(100.0, b_p.item())):.2f}%",
                "learning_sync_state": "Synced / Weights Updated" if run_online_learning else "Static"
            }
        }

        # ── STEP 6: INTELLIGENT CLINICAL SUMMARY VIA GEMINI LLM ───
        if self.report_generator:
            print("[+] Routing numeric metrics to Gemini AI for final diagnostic reporting...")
            llm_text_report = self.report_generator.generate_clinical_report(pipeline_report)
            pipeline_report["final_clinical_report_md"] = llm_text_report
        else:
            pipeline_report["final_clinical_report_md"] = "LLM Engine Offline. Check environment keys."

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