from __future__ import annotations

import math
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

import librosa
import numpy as np

from .schemas import ChartMode, ChartPayload, ChartStats, TaikoNote

HOP_LENGTH = 512
FRAME_LENGTH = 2048


@dataclass
class AnalysisResult:
    notes: list[TaikoNote]
    beat_times: list[float]
    stats: ChartStats


def analyze_audio_bytes(data: bytes, filename: str, *, mode: ChartMode) -> AnalysisResult:
    suffix = Path(filename).suffix or ".mp3"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_file:
        tmp_path = Path(tmp_file.name)
        tmp_file.write(data)
        tmp_file.flush()
    try:
        return _analyze_audio_path(tmp_path, mode=mode)
    finally:
        try:
            tmp_path.unlink(missing_ok=True)
        except FileNotFoundError:
            pass


def _analyze_audio_path(path: Path, *, mode: ChartMode) -> AnalysisResult:
    y, sr = librosa.load(path, sr=None, mono=True)
    duration = float(librosa.get_duration(y=y, sr=sr))

    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, trim=True, hop_length=HOP_LENGTH)
    if beat_frames.size == 0:
        beat_frames = librosa.onset.onset_detect(y=y, sr=sr, hop_length=HOP_LENGTH, units="frames")
    beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=HOP_LENGTH)
    if beat_times.size == 0:
        beat_times = np.linspace(0, max(duration, 1.0), num=max(int(duration), 1), endpoint=False)

    rms = librosa.feature.rms(
        y=y,
        frame_length=FRAME_LENGTH,
        hop_length=HOP_LENGTH,
        center=True,
    )[0]
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=HOP_LENGTH)[0]

    rms_norm = _normalize_feature(rms)
    centroid_norm = _normalize_feature(centroid)

    intensities = np.interp(beat_times, _frame_time_axis(rms_norm.size, sr), rms_norm, left=0.0, right=0.0)
    brightness = np.interp(
        beat_times,
        _frame_time_axis(centroid_norm.size, sr),
        centroid_norm,
        left=0.0,
        right=0.0,
    )

    notes = _generate_notes(beat_times, intensities, brightness, tempo, mode)

    stats = ChartStats(
        bpm=float(tempo) if tempo > 0 else 0.0,
        duration=duration,
        total_beats=len(beat_times),
        total_notes=len(notes),
        notes_per_second=(len(notes) / duration) if duration else 0.0,
        red_ratio=_ratio(notes, prefix="red"),
        blue_ratio=_ratio(notes, prefix="blue"),
    )

    return AnalysisResult(notes=notes, beat_times=beat_times.tolist(), stats=stats)


def _frame_time_axis(length: int, sr: int) -> np.ndarray:
    frames = np.arange(length)
    return librosa.frames_to_time(frames, sr=sr, hop_length=HOP_LENGTH)


def _normalize_feature(values: Sequence[float]) -> np.ndarray:
    arr = np.asarray(values, dtype=float)
    peak = np.max(arr)
    if peak <= 0:
        return np.zeros_like(arr)
    return arr / peak


def _ratio(notes: Sequence[TaikoNote], prefix: str) -> float:
    if not notes:
        return 0.0
    count = sum(1 for note in notes if note.note_type.startswith(prefix))
    return count / len(notes)


def _generate_notes(
    beat_times: np.ndarray,
    intensities: np.ndarray,
    brightness: np.ndarray,
    tempo: float,
    mode: ChartMode,
) -> list[TaikoNote]:
    if beat_times.size == 0:
        return []

    intensity_high = 0.7 if mode is ChartMode.BALANCED else (0.6 if mode is ChartMode.DENSE else 0.85)
    intensity_low = 0.3 if mode is ChartMode.BALANCED else (0.2 if mode is ChartMode.DENSE else 0.45)
    dense_overlay_threshold = 0.65

    brightness_median = float(np.median(brightness)) if brightness.size else 0.5

    notes: list[TaikoNote] = []

    for idx, beat_time in enumerate(beat_times):
        intensity = float(np.clip(intensities[idx], 0.0, 1.0))
        bright = float(np.clip(brightness[idx], 0.0, 1.0))

        if mode is ChartMode.SPARSE and intensity < intensity_low:
            continue

        color = "blue" if bright > brightness_median else "red"
        weight = "full" if intensity >= intensity_high else "half"
        note_type = f"{color}_{weight}"

        notes.append(
            TaikoNote(
                time=float(beat_time),
                note_type=note_type, 
                intensity=intensity,
                brightness=bright,
            )
        )

        if mode is ChartMode.DENSE and intensity >= dense_overlay_threshold:
            next_time = (
                beat_times[idx + 1]
                if idx + 1 < beat_times.size
                else beat_times[idx] + (60.0 / tempo if tempo else 0.25)
            )
            gap = next_time - beat_time
            if gap > 0.1:
                notes.append(
                    TaikoNote(
                        time=float(beat_time + gap / 2),
                        note_type=f"{color}_half",
                        intensity=max(intensity - 0.1, 0.0),
                        brightness=bright,
                    )
                )

    notes.sort(key=lambda note: note.time)
    return notes


def to_payload(result: AnalysisResult, *, mode: ChartMode) -> ChartPayload:
    return ChartPayload(
        notes=result.notes,
        beat_times=result.beat_times,
        stats=result.stats,
        mode=mode,
    )
