"""Background analysis jobs. Uploads return immediately; the client polls."""
from __future__ import annotations

import logging
import shutil
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path

from . import analysis, charting, library

logger = logging.getLogger(__name__)
KEEP_FINISHED_SECONDS = 60 * 60

STAGES = {
    "queued": "Waiting for the stage",
    "decoding": "Tuning the drums",
    "listening": "Listening to your song",
    "finding the beat": "Finding the beat",
    "finding the bar": "Counting the bars",
    "charting": "Writing Easy, Medium and Hard",
    "saving": "Hanging the lanterns",
    "done": "Ready to play",
}


@dataclass
class Job:
    id: str
    filename: str
    status: str = "queued"          # queued | processing | done | error
    stage: str = "queued"
    progress: float = 0.0
    song: dict | None = None
    error: str | None = None
    updated: float = field(default_factory=time.time)

    def view(self) -> dict:
        return {"id": self.id, "status": self.status, "stage": self.stage, "message": STAGES.get(self.stage, self.stage),
                "progress": round(self.progress, 3), "song": self.song, "error": self.error}


class JobStore:
    def __init__(self, workers: int = 2) -> None:
        self._jobs: dict[str, Job] = {}
        self._lock = threading.Lock()
        self._pool = ThreadPoolExecutor(max_workers=workers, thread_name_prefix="analysis")

    def submit(self, upload: Path, workdir: Path, filename: str, title: str, artist: str) -> dict:
        job = Job(id=uuid.uuid4().hex, filename=filename)
        with self._lock:
            self._prune()
            self._jobs[job.id] = job
        self._pool.submit(self._run, job, upload, workdir, title, artist)
        return job.view()

    def get(self, job_id: str) -> dict | None:
        with self._lock:
            job = self._jobs.get(job_id)
            return job.view() if job else None

    def _update(self, job: Job, **changes) -> None:
        with self._lock:
            for key, value in changes.items():
                setattr(job, key, value)
            job.updated = time.time()

    def _prune(self) -> None:
        cutoff = time.time() - KEEP_FINISHED_SECONDS
        for key in [k for k, j in self._jobs.items() if j.status in ("done", "error") and j.updated < cutoff]:
            del self._jobs[key]

    def _run(self, job: Job, upload: Path, workdir: Path, title: str, artist: str) -> None:
        try:
            self._update(job, status="processing", stage="decoding", progress=0.03)
            info = analysis.probe(upload)
            if info["duration"] and info["duration"] > analysis.MAX_SECONDS + 1:
                raise analysis.AnalysisError("Choose a song shorter than 15 minutes.")
            song_id = library.song_id_for(upload)
            names = library.guess_names(job.filename, info)
            title = library.clean_text(title) or names[0]
            artist = library.clean_text(artist) or names[1]

            playable = workdir / library.AUDIO_NAME
            analysis.transcode_for_playback(upload, playable)
            features = analysis.extract(playable, lambda stage, p: self._update(job, stage=stage, progress=p))
            self._update(job, stage="charting", progress=0.8)
            chart = charting.generate(features)
            if chart["charts"]["medium"]["stats"]["hits"] < 8:
                raise analysis.AnalysisError("No clear beat found. Try a more rhythmic song.")
            self._update(job, stage="saving", progress=0.95)
            meta = library.save(song_id, playable, chart, title, artist)
            self._update(job, status="done", stage="done", progress=1.0, song=library.summary(meta))
        except analysis.AnalysisError as exc:
            self._update(job, status="error", error=str(exc))
        except Exception:  # noqa: BLE001
            logger.exception("Analysis job %s failed", job.id)
            self._update(job, status="error", error="Something went wrong while analysing this song.")
        finally:
            shutil.rmtree(workdir, ignore_errors=True)
