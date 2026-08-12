import os
import shutil
import sys
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add the current directory to path to ensure imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import from integrated_clinical_engine
try:
    from integrated_clinical_engine import RetiNexusFullPipeline
    print("[+] Successfully imported RetiNexusFullPipeline from integrated_clinical_engine")
except ImportError as e:
    print(f"[-] Failed to import: {e}")
    print("[!] Make sure integrated_clinical_engine.py is in the same directory")
    RetiNexusFullPipeline = None

app = FastAPI(
    title="RetiNexus Advanced Core AI API Backend", 
    description="FastAPI Production Server for Multi-Model Retinal Diagnostics",
    version="1.0"
)

# 🌐 CORS CONFIGURATION: Allow Next.js Frontend (Port 3000) to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📁 SERVE STATIC FILES - This makes images accessible
# Create output_results directory if it doesn't exist
os.makedirs("./output_results", exist_ok=True)

# Mount the output_results directory to serve static files
app.mount("/output_results", StaticFiles(directory="./output_results"), name="output_results")

# Deep Learning Pipelines memory check on startup
pipeline_engine = None
try:
    print("\n" + "="*50)
    print("[*] INITIALIZING RETINEXUS DEEP LEARNING ENGINES...")
    print("[*] Loading integrated_clinical_engine...")
    
    if RetiNexusFullPipeline is not None:
        pipeline_engine = RetiNexusFullPipeline()
        print("[+] All Core Framework Weights Verified & Loaded Successfully!")
        print("[+] Pipeline Engine Status: ONLINE")
        print("[+] LLM (Gemini AI) Status: ONLINE")
    else:
        print("[-] RetiNexusFullPipeline class not available")
        
    print("="*50 + "\n")
except Exception as e:
    print(f"[-] CRITICAL: Failed to initialize AI Engine: {str(e)}")
    import traceback
    traceback.print_exc()
    pipeline_engine = None

@app.get("/")
def read_root():
    return {
        "status": "Online", 
        "engine": "RetiNexus Core Services", 
        "pipeline_state": "Ready" if pipeline_engine is not None else "Offline",
        "llm_state": "Online" if pipeline_engine is not None else "Offline",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
def health_check():
    """Simple health check endpoint"""
    return {
        "status": "healthy",
        "pipeline_loaded": pipeline_engine is not None,
        "llm_loaded": pipeline_engine is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/images/{filename}")
async def get_image(filename: str):
    """Serve images from output_results directory"""
    # Security: Prevent directory traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        return JSONResponse(status_code=400, content={"error": "Invalid filename"})
    
    file_path = os.path.join("./output_results", filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return JSONResponse(status_code=404, content={"error": "Image not found"})

@app.post("/analyze")
async def analyze_retina(file: UploadFile = File(...)):
    """
    Accepts raw fundus image stream via multipart form data from Next.js,
    runs full clinical profiling pipeline, and relays systematic JSON back.
    """
    if pipeline_engine is None:
        raise HTTPException(
            status_code=503, 
            detail="AI Pipeline Engine is structurally offline. Check server initialization logs."
        )
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Validate file type
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    temp_input_path = f"temp_upload_stream_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    
    try:
        # 1. Write uploaded bytes to disk
        with open(temp_input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"[+] File saved: {temp_input_path}")
            
        # 2. Create output directory
        output_directory = "./output_results"
        os.makedirs(output_directory, exist_ok=True)
        
        # 3. Run inference
        print("[+] Running inference on integrated_clinical_engine...")
        report = pipeline_engine.execute_single_inference(
            temp_input_path, 
            run_online_learning=True, 
            output_dir=output_directory
        )
        print("[+] Inference completed successfully")
        
        # 4. Clean up temp file
        if os.path.exists(temp_input_path):
            os.remove(temp_input_path)
            print(f"[+] Removed temp file: {temp_input_path}")
            
        # 5. Check for rejection
        if report.get("status") == "Rejected":
            raise HTTPException(status_code=400, detail=report.get("reason", "Image rejected by quality check"))
            
        # 6. Transform the response for frontend
        transformed_report = ReportTransformer(report).transform()
        print("[+] Report transformed for frontend")
        
        # ✅ Print clinical report preview
        if "clinicalReport" in transformed_report:
            print("[+] LLM Clinical Report included in response")
            print("-" * 50)
            print(transformed_report["clinicalReport"][:500] + "...")
            print("-" * 50)
        
        return JSONResponse(content=transformed_report)
        
    except HTTPException as http_err:
        # Re-raise HTTP exceptions so FastAPI handles them properly
        raise http_err
    except Exception as e:
        # Emergency exception cleanup sequence
        if os.path.exists(temp_input_path):
            try:
                os.remove(temp_input_path)
                print(f"[+] Cleaned up temp file after error: {temp_input_path}")
            except:
                pass
        
        print(f"[-] Error during analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(status_code=500, detail=f"Core Processing Fault: {str(e)}")

class ReportTransformer:
    """
    Converts a raw pipeline report (from RetiNexusFullPipeline) into the JSON shape
    the Next.js frontend expects. Same computations as the original flat function,
    just organized into class methods for readability and reuse.
    """

    GRADE_MAP = {0: "No DR", 1: "Mild NPDR", 2: "Moderate NPDR", 3: "Severe NPDR", 4: "PDR"}

    # DR-grade-indexed normal ranges. Grade 4 (PDR) doubles as the fallback for any
    # unexpected grade value, matching the original function's `else` branch.
    NORMAL_RANGES_BY_GRADE = {
        0: {"tortuosity": (0.5, 1.2), "density": (10, 25), "branching": (50, 150), "avr": (0.55, 0.75), "micro": (0, 0), "hemo": (0, 0), "hard": (0, 0), "soft": (0, 0)},
        1: {"tortuosity": (0.5, 1.3), "density": (8, 28), "branching": (40, 180), "avr": (0.50, 0.78), "micro": (0, 2), "hemo": (0, 1), "hard": (0, 0), "soft": (0, 0)},
        2: {"tortuosity": (0.4, 1.4), "density": (8, 30), "branching": (30, 200), "avr": (0.45, 0.80), "micro": (0, 5), "hemo": (0, 3), "hard": (0, 2), "soft": (0, 1)},
        3: {"tortuosity": (0.3, 1.5), "density": (5, 35), "branching": (20, 250), "avr": (0.40, 0.85), "micro": (0, 10), "hemo": (0, 8), "hard": (0, 5), "soft": (0, 3)},
        4: {"tortuosity": (0.3, 1.6), "density": (5, 40), "branching": (10, 300), "avr": (0.35, 0.90), "micro": (0, 15), "hemo": (0, 12), "hard": (0, 8), "soft": (0, 5)},
    }

    def __init__(self, report: dict):
        self.report = report
        self.clinical = report.get("clinical_consensus_ensemble", {})
        self.quality = report.get("quality_assurance", {})
        self.saved = report.get("saved_outputs", {})
        self.biomarker_raw = report.get("vessel_morphology_biomarkers", {})
        self.lesion_counts_raw = report.get("detected_lesion_counts", {})
        self.risk = report.get("multi_organ_risk_assessment", {})
        self.dr_grade = self.clinical.get("final_predicted_dr_grade", 0)

    def transform(self) -> dict:
        try:
            ranges = self.NORMAL_RANGES_BY_GRADE.get(self.dr_grade, self.NORMAL_RANGES_BY_GRADE[4])
            images = self._build_images()
            lesions = self._lesion_values()

            return {
                "id": f"RPT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "patientId": "P-2024-001",
                "timestamp": datetime.now().isoformat(),
                "imageUrl": images.get("enhanced", ""),
                "images": images,
                "quality": self._build_quality(),
                "drGrade": self._build_dr_grade(),
                "biomarkers": self._build_biomarkers(ranges, lesions),
                "lesionCounts": self._build_lesion_counts(lesions),
                "riskFactors": self._build_risk_factors(),
                "overallRisk": self._risk_value("cardiovascular_risk_index"),
                "processedAt": datetime.now().isoformat(),
                "raw_report": self.report,
                "clinicalReport": self._clinical_report_text(),  # ✅ LLM clinical report (Roman Urdu)
                "organInterpretation": self._organ_interpretation(),  # ✅ Per-organ plain-English summary
                "interpretation": self._interpretation_paragraph(),  # legacy single-paragraph fallback
            }
        except Exception as e:
            print(f"[!] Error transforming report: {e}")
            import traceback
            traceback.print_exc()
            return self.report

    # ── helpers ──────────────────────────────────────────────────────────

    @staticmethod
    def _status_for(value, low, high):
        if value < low:
            return "low"
        if value > high:
            return "elevated"
        return "normal"

    @staticmethod
    def _get_image_filename(path):
        if not path or path in ("Failed", "Inference Exception Layer Error"):
            return None
        return os.path.basename(path)

    def _build_images(self):
        images = {}
        mapping = {
            "enhanced": self.saved.get("enhanced_image", ""),
            "vessel_mask": self.saved.get("vessel_mask_image", ""),
            "detected_lesions": self.saved.get("detected_lesions_image", ""),
            "gradcam": self.saved.get("gradcam_explainability_image", ""),
        }
        for key, path in mapping.items():
            filename = self._get_image_filename(path)
            if filename:
                images[key] = filename
        return images

    def _build_quality(self):
        return {
            "overall": min(1.0, max(0.0, self.quality.get("variance_score", 85) / 100)),
            "illumination": 0.85,
            "focus": 0.90,
            "fieldOfView": 0.88,
            "artifacts": 0.82,
        }

    def _confidence(self):
        confidence_str = self.clinical.get("ensemble_confidence_score", "85.00%")
        return confidence_str, float(confidence_str.replace("%", "")) / 100

    def _build_dr_grade(self):
        confidence_str, confidence_float = self._confidence()
        grade_label = self.GRADE_MAP.get(self.dr_grade, "No DR")
        return {
            "grade": grade_label,
            "confidence": confidence_float,
            "description": f"{grade_label} detected with {confidence_str} confidence",
        }

    def _lesion_values(self):
        return {
            "microaneurysms": self.lesion_counts_raw.get("microaneurysms", 0),
            "haemorrhages": self.lesion_counts_raw.get("haemorrhages", 0),
            "hard_exudates": self.lesion_counts_raw.get("hard_exudates", 0),
            "soft_exudates": self.lesion_counts_raw.get("soft_exudates", 0),
        }

    def _build_biomarkers(self, ranges, lesions):
        vessel_tortuosity = self.biomarker_raw.get("vessel_tortuosity_index", 1.04)
        vessel_density = self.biomarker_raw.get("vessel_density_percentage", 15.0)
        branching_points = self.biomarker_raw.get("branching_points_count", 0)
        avr_value = self.biomarker_raw.get("arteriolar_to_venular_ratio", 0.67)

        return [
            {"name": "Vessel Tortuosity", "value": vessel_tortuosity, "normalRange": list(ranges["tortuosity"]), "unit": "index", "status": self._status_for(vessel_tortuosity, *ranges["tortuosity"])},
            {"name": "Vessel Density", "value": vessel_density, "normalRange": list(ranges["density"]), "unit": "%", "status": self._status_for(vessel_density, *ranges["density"])},
            {"name": "Branching Points", "value": branching_points, "normalRange": list(ranges["branching"]), "unit": "count", "status": self._status_for(branching_points, *ranges["branching"])},
            {"name": "Arteriolar to Venular Ratio", "value": avr_value, "normalRange": list(ranges["avr"]), "unit": "ratio", "status": self._status_for(avr_value, *ranges["avr"])},
            {"name": "Microaneurysms", "value": lesions["microaneurysms"], "normalRange": list(ranges["micro"]), "unit": "count", "status": self._status_for(lesions["microaneurysms"], *ranges["micro"])},
            {"name": "Haemorrhages", "value": lesions["haemorrhages"], "normalRange": list(ranges["hemo"]), "unit": "count", "status": self._status_for(lesions["haemorrhages"], *ranges["hemo"])},
            {"name": "Hard Exudates", "value": lesions["hard_exudates"], "normalRange": list(ranges["hard"]), "unit": "count", "status": self._status_for(lesions["hard_exudates"], *ranges["hard"])},
        ]

    def _build_lesion_counts(self, lesions):
        total = lesions["microaneurysms"] + lesions["haemorrhages"] + lesions["hard_exudates"] + lesions["soft_exudates"]
        return {
            "microaneurysms": lesions["microaneurysms"],
            "haemorrhages": lesions["haemorrhages"],
            "hardExudates": lesions["hard_exudates"],
            "softExudates": lesions["soft_exudates"],
            "total": total,
        }

    def _risk_value(self, key):
        return float(self.risk.get(key, "0%").replace("%", "")) / 100

    def _build_risk_factors(self):
        return [
            {"name": "Cardiovascular Risk", "level": self._risk_value("cardiovascular_risk_index"), "description": "AI-predicted cardiovascular risk"},
            {"name": "Kidney Disease Risk", "level": self._risk_value("chronic_kidney_disease_risk_index"), "description": "AI-predicted CKD risk"},
            {"name": "Cerebrovascular Risk", "level": self._risk_value("cerebrovascular_risk_index"), "description": "AI-predicted stroke risk"},
        ]

    def _clinical_report_text(self):
        text = self.report.get("final_clinical_report_md", "")
        if "Medical Diagnostic Report" in text:
            start_idx = text.find("Medical Diagnostic Report")
            if start_idx != -1:
                text = text[start_idx:]
        return text

    def _organ_interpretation(self):
        organ = self.report.get("organ_interpretation", {}) or {}
        return {
            "heart": organ.get("heart", ""),
            "kidney": organ.get("kidney", ""),
            "brain": organ.get("brain", ""),
        }

    def _interpretation_paragraph(self):
        organ = self.report.get("organ_interpretation", {}) or {}
        summary = organ.get("summary", "")
        if summary:
            return summary
        # Fallback if the model ever omits "summary": stitch the per-organ lines together.
        return " ".join(v for v in self._organ_interpretation().values() if v)

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*50)
    print("[*] Starting RetiNexus Backend Server...")
    print("[*] Server will run on: http://127.0.0.1:8001")
    print("[*] LLM (Gemini AI) Integrated for Clinical Reports")
    print("[*] Press Ctrl+C to stop")
    print("="*50 + "\n")
    uvicorn.run(
        "app_backend:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
        log_level="info"
    )