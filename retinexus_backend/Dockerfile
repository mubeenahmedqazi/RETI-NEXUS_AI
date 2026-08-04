FROM python:3.10-slim

WORKDIR /app

# System libs needed by opencv / scikit-image at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# CPU-only PyTorch build — HF's free Space hardware has no GPU, and the
# default PyPI wheel pulls in unused CUDA libs that bloat the image.
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p output_results

# HF Spaces (Docker SDK) route traffic to port 7860 by default.
EXPOSE 7860

CMD ["uvicorn", "app_backend:app", "--host", "0.0.0.0", "--port", "7860"]
