from __future__ import annotations

import logging
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .jobs import JobStore
from .schemas import JobResponse

logger = logging.getLogger(__name__)

app = FastAPI(title="Taiko Beat Analyzer", version="0.1.0")

job_store = JobStore()
MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20 MB

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_store() -> JobStore:
    return job_store


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


async def _enqueue_audio(file: UploadFile, store: JobStore, *, source: str) -> JobResponse:
    payload = await file.read(MAX_UPLOAD_BYTES + 1)
    if not payload:
        raise HTTPException(status_code=400, detail="Empty file upload")
    if len(payload) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 20 MB)")
    job = await store.create_job(data=payload, filename=file.filename or "song.mp3")
    logger.info("Queued analysis job %s for %s via %s", job.job_id, file.filename, source)
    return job


@app.post("/audio", response_model=JobResponse, status_code=202, tags=["audio"])
async def upload_audio(
    file: UploadFile = File(...),
    store: JobStore = Depends(get_store),
) -> JobResponse:
    """Upload an audio file and enqueue audio analysis."""
    return await _enqueue_audio(file, store, source="/audio")


@app.get("/audio/{job_id}", response_model=JobResponse, tags=["audio"])
async def get_audio_job(job_id: str, store: JobStore = Depends(get_store)) -> JobResponse:
    """Poll for job status and results of an uploaded audio file."""
    job = await store.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
