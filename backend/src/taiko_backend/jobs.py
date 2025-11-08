from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Optional
from uuid import uuid4

from . import audio
from .schemas import ChartMode, ChartPayload, JobResponse, JobStatus


@dataclass
class JobRecord:
    job_id: str
    status: JobStatus
    payload: Optional[ChartPayload] = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_response(self) -> JobResponse:
        return JobResponse(
            job_id=self.job_id,
            status=self.status,
            created_at=self.created_at,
            updated_at=self.updated_at,
            payload=self.payload,
            error=self.error,
        )


class JobStore:
    def __init__(self) -> None:
        self._jobs: Dict[str, JobRecord] = {}
        self._lock = asyncio.Lock()

    async def create_job(self, *, data: bytes, filename: str, mode: ChartMode) -> JobResponse:
        job_id = str(uuid4())
        record = JobRecord(job_id=job_id, status=JobStatus.QUEUED)
        async with self._lock:
            self._jobs[job_id] = record
        asyncio.create_task(self._run_job(job_id, data, filename, mode))
        return record.to_response()

    async def get_job(self, job_id: str) -> Optional[JobResponse]:
        async with self._lock:
            record = self._jobs.get(job_id)
        if record is None:
            return None
        return record.to_response()

    async def _run_job(self, job_id: str, data: bytes, filename: str, mode: ChartMode) -> None:
        await self._set_status(job_id, JobStatus.PROCESSING)
        try:
            result = await asyncio.to_thread(audio.analyze_audio_bytes, data, filename, mode=mode)
            payload = audio.to_payload(result, mode=mode)
            await self._set_result(job_id, payload)
        except Exception as exc:  # noqa: BLE001
            await self._set_error(job_id, str(exc))

    async def _set_status(self, job_id: str, status: JobStatus) -> None:
        async with self._lock:
            record = self._jobs.get(job_id)
            if record:
                record.status = status
                record.updated_at = datetime.now(timezone.utc)

    async def _set_result(self, job_id: str, payload: ChartPayload) -> None:
        async with self._lock:
            record = self._jobs.get(job_id)
            if record:
                record.status = JobStatus.COMPLETED
                record.payload = payload
                record.updated_at = datetime.now(timezone.utc)

    async def _set_error(self, job_id: str, message: str) -> None:
        async with self._lock:
            record = self._jobs.get(job_id)
            if record:
                record.status = JobStatus.FAILED
                record.error = message
                record.updated_at = datetime.now(timezone.utc)
