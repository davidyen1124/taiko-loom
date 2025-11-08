from __future__ import annotations

import logging
from typing import Annotated

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .jobs import JobStore
from .schemas import ChartMode, JobResponse

logger = logging.getLogger(__name__)

app = FastAPI(title="Taiko Beat Analyzer", version="0.1.0")

job_store = JobStore()

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


@app.post("/charts", response_model=JobResponse, status_code=202, tags=["charts"])
async def create_chart(
    mode: Annotated[ChartMode, Form()] = ChartMode.BALANCED,
    file: UploadFile = File(...),
    store: JobStore = Depends(get_store),
) -> JobResponse:
    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="Empty file upload")
    job = await store.create_job(data=payload, filename=file.filename or "song.mp3", mode=mode)
    logger.info("Queued analysis job %s for %s", job.job_id, file.filename)
    return job


@app.get("/charts/{job_id}", response_model=JobResponse, tags=["charts"])
async def get_chart(job_id: str, store: JobStore = Depends(get_store)) -> JobResponse:
    job = await store.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
