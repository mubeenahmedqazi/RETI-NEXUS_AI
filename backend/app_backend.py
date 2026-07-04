import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Direct current directory se pipeline module import karna
from phase1_inference import RetiNexusPhase1Pipeline

app = FastAPI(
    title="RetiNexus Advanced Core AI API Backend", 
    description="FastAPI Production Server for Multi-Model Retinal Diagnostics",
    version="1.0"
)

# 🌐 CORS CONFIGURATION: Allow Next.js Frontend (Port 3000) to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js local development url
    allow_credentials=True,
    allow_methods=["*"],                      # Allows GET, POST, OPTIONS, etc.
    allow_headers=["*"],                      # Allows all headers
)

# Deep Learning Pipelines memory check on startup
try:
    print("\n" + "="*50)
    print("[*] INITIALIZING RETINEXUS DEEP LEARNING ENGINES...")
    pipeline_engine = RetiNexusPhase1Pipeline()
    print("[+] All Core Framework Weights Verified & Loaded Successfully!")
    print("="*50 + "\n")
except Exception as e:
    print(f"[-] CRITICAL: Failed to initialize AI Engine: {str(e)}")
    pipeline_engine = None

@app.get("/")
def read_root():
    return {
        "status": "Online", 
        "engine": "RetiNexus Core Services", 
        "pipeline_state": "Ready" if pipeline_engine is not None else "Offline"
    }

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
        
    # Generate unique temporary file track token to prevent collision
    temp_input_path = f"temp_upload_stream_{file.filename}"
    
    try:
        # 1. Write uploaded bytes from memory stream directly to disk space
        with open(temp_input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 2. Trigger primary unified AI model routing tracker
        output_directory = "./output_results"
        report = pipeline_engine.run_inference(temp_input_path, output_dir=output_directory)
        
        # 3. IO Clean up layer
        if os.path.exists(temp_input_path):
            os.remove(temp_input_path)
            
        # 4. GATEKEEPER EXCEPTION TRACKER: Catch invalid/meme/blurry rejections
        if report.get("status") == "Rejected":
            raise HTTPException(status_code=400, detail=report.get("reason"))
            
        return JSONResponse(content=report)
        
    except HTTPException as http_err:
        # Re-raise HTTP exceptions so FastAPI handles them properly
        raise http_err
    except Exception as e:
        # Emergency exception cleanup sequence
        if os.path.exists(temp_input_path):
            os.remove(temp_input_path)
        raise HTTPException(status_code=500, detail=f"Core Processing Fault: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Live reload tracking active on Local Host Address Loop
    uvicorn.run("app_backend.py:app", host="127.0.0.1", port=8000, reload=True)