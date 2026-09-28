"""HTTP API: upload a song, poll the analysis job, browse and play the library."""
from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from . import library
from .charting import CHART_VERSION
from .jobs import JobStore

MAX_UPLOAD_BYTES = 100 * 1024 * 1024
AUDIO_SUFFIXES = {".mp3", ".wav", ".flac", ".ogg", ".oga", ".opus", ".m4a", ".aac", ".aiff", ".aif", ".wma", ".webm", ".mp4"}

app = FastAPI(title="Taiko Nights backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.environ.get("TAIKO_CORS_ORIGINS", "*").split(",") if o.strip()],
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)
jobs = JobStore()


class Rename(BaseModel):
    title: str | None = None
    artist: str | None = None


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "chartVersion": CHART_VERSION, "songs": len(library.list_songs())}


@app.get("/api/songs")
def list_songs() -> dict:
    return {"songs": library.list_songs()}


@app.post("/api/songs", status_code=202)
async def upload_song(file: UploadFile = File(...), title: str = Form(""), artist: str = Form("")) -> dict:
    name = Path(file.filename or "song").name
    suffix = Path(name).suffix.lower()
    if suffix not in AUDIO_SUFFIXES:
        raise HTTPException(415, "Choose an audio file such as MP3, WAV, FLAC, OGG or M4A.")
    workdir = Path(tempfile.mkdtemp(prefix="taiko-upload-"))
    upload = workdir / f"upload{suffix}"
    size = 0
    try:
        with upload.open("wb") as out:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    raise HTTPException(413, "Choose audio smaller than 100 MB.")
                out.write(chunk)
        if size == 0:
            raise HTTPException(400, "That file is empty.")
    except HTTPException:
        shutil.rmtree(workdir, ignore_errors=True)
        raise
    return jobs.submit(upload, workdir, name, title, artist)


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str) -> dict:
    job = jobs.get(job_id)
    if job is None:
        raise HTTPException(404, "Job not found.")
    return job


@app.get("/api/songs/{song_id}")
def get_song(song_id: str) -> dict:
    song = library.load(song_id)
    if song is None:
        raise HTTPException(404, "Song not found.")
    return song


@app.get("/api/songs/{song_id}/audio")
def get_audio(song_id: str) -> FileResponse:
    folder = library.song_dir(song_id)
    if folder is None or not (folder / library.AUDIO_NAME).is_file():
        raise HTTPException(404, "Song not found.")
    return FileResponse(folder / library.AUDIO_NAME, media_type="audio/flac",
                        headers={"Cache-Control": "private, max-age=86400"})


@app.patch("/api/songs/{song_id}")
def rename_song(song_id: str, body: Rename) -> dict:
    song = library.rename(song_id, body.title, body.artist)
    if song is None:
        raise HTTPException(404, "Song not found.")
    return song


@app.delete("/api/songs/{song_id}", status_code=204)
def delete_song(song_id: str) -> None:
    if not library.delete(song_id):
        raise HTTPException(404, "Song not found.")
