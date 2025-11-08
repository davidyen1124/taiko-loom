from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field

NoteColor = Literal["red", "blue"]
NoteWeight = Literal["half", "full"]
NoteType = Literal[
    "red_half",
    "red_full",
    "blue_half",
    "blue_full",
]


class ChartMode(str, Enum):
    BALANCED = "balanced"
    DENSE = "dense"
    SPARSE = "sparse"


class TaikoNote(BaseModel):
    time: float = Field(..., description="Timestamp of the hit in seconds from the start of the song.")
    note_type: NoteType = Field(..., description="One of red/blue combined with half/full weight.")
    intensity: float = Field(..., ge=0.0, description="Normalized RMS energy for the beat.")
    brightness: float = Field(..., ge=0.0, description="Normalized spectral centroid for the beat.")


class ChartStats(BaseModel):
    bpm: float
    duration: float
    total_beats: int
    total_notes: int
    notes_per_second: float
    red_ratio: float
    blue_ratio: float


class ChartPayload(BaseModel):
    notes: list[TaikoNote]
    beat_times: list[float]
    stats: ChartStats
    mode: ChartMode


class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    created_at: datetime
    updated_at: datetime
    payload: Optional[ChartPayload] = None
    error: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "384c23b6-4d0d-4de1-b9a7-0589c9dc3172",
                "status": "processing",
                "created_at": "2025-11-08T19:40:00Z",
                "updated_at": "2025-11-08T19:40:00Z",
                "payload": None,
            }
        }
