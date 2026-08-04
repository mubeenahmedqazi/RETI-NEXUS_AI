import os
from dotenv import load_dotenv
from huggingface_hub import HfApi

# 1. .env file se token load karein
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    raise ValueError("HF_TOKEN .env file mein nahi mila! Pehle .env file check karein.")

# 2. Target Space
SPACE_ID = "mubeenahmedqazi/retinexus_backend"

api = HfApi()

print(f"Uploading backend to Space: {SPACE_ID} ...")
api.upload_folder(
    folder_path=".",
    repo_id=SPACE_ID,
    repo_type="space",
    token=HF_TOKEN,
    ignore_patterns=[
        ".env",
        "*.env",
        "__pycache__/*",
        "**/__pycache__/*",
        "*.pyc",
        "output_results/*",
        "upload_to_hf.py",
        "upload_space.py",
        "157_right.jpeg",
    ],
)

print("[+] Upload Complete! Space will now build automatically on Hugging Face.")
print(f"    https://huggingface.co/spaces/{SPACE_ID}")
