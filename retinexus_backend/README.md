---
title: RetiNexus Backend
emoji: 👁️
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# RetiNexus AI — Backend

FastAPI service running the RetiNexus multi-model diabetic retinopathy screening
pipeline (vessel segmentation, lesion detection, DR grading, multi-organ risk
scoring, and LLM-generated clinical report text).

## Endpoints

- `GET /` — service status
- `GET /health` — health check
- `POST /analyze` — multipart image upload, returns full clinical report JSON
- `GET /images/{filename}` — serves generated output images

## Required Space secret

Set this under **Settings → Repository secrets** for `/analyze`'s clinical
report generation to work:

- `GROQ_API_KEY`
