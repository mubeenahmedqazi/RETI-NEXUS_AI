import os
from dotenv import load_dotenv
from huggingface_hub import HfApi, create_repo

# 1. .env file se variables load karein
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

# 2. Apni details yahan set karein
HF_USERNAME = "mubeenahmedqazi"  # <-- Yahan apna Hugging Face exact username likhein
REPO_NAME = "retinexus-trained-weights" # Hugging Face repo ka jo bhi naam rakhna chahein

# Check karein ke token mila ya nahi
if not HF_TOKEN:
    raise ValueError("HF_TOKEN .env file mein nahi mila! Pehle .env file check karein.")

api = HfApi()
repo_id = f"{HF_USERNAME}/{REPO_NAME}"

# 3. Private Repo create karein (agar pehle se nahi bani hui)
print("Creating/Checking repository on Hugging Face...")
create_repo(
    repo_id=repo_id,
    token=HF_TOKEN,
    private=True,
    exist_ok=True
)

# 4. Local 'trained_weights' folder ko upload karein
print(f"Uploading 'trained_weights' folder to {repo_id}...")
api.upload_folder(
    folder_path="trained_weights",
    repo_id=repo_id,
    token=HF_TOKEN
)

print("✅ Upload Complete! Models HF Private Repo par push ho chukay hain.")