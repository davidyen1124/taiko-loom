from __future__ import annotations

import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

import librosa
import numpy as np

from .schemas import ChartMode, ChartPayload, ChartStats, TaikoNote

HOP_LENGTH = 512


@dataclass
class AnalysisResult:
    notes: list[TaikoNote]
    beat_times: list[float]
    stats: ChartStats


@dataclass(frozen=True)
class ChartConfig:
    min_gap_ms: float
    per_beat_cap: int
    big_quantile: float
    subdivisions_override: int | None = None
    min_subdivisions: int = 0
    max_subdivisions: int | None = None


@dataclass
class GridAssignment:
    frame: int
    time: float
    strength: float


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
    y_h, y_p = librosa.effects.hpss(y)

    onset_envelope = librosa.onset.onset_strength(
        y=y_p,
        sr=sr,
        hop_length=HOP_LENGTH,
    )
    tempo, beat_frames = librosa.beat.beat_track(
        y=y_p,
        sr=sr,
        hop_length=HOP_LENGTH,
        trim=False,
    )
    if beat_frames.size == 0:
        beat_frames = librosa.onset.onset_detect(
            y=y_p,
            sr=sr,
            hop_length=HOP_LENGTH,
            units="frames",
        )

    beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=HOP_LENGTH)
    if beat_times.size == 0:
        beat_times = np.linspace(0.0, max(duration, 1.0), num=max(int(duration), 1), endpoint=False)

    tempo = _ensure_tempo(tempo, beat_times)
    config = _chart_config(mode)
    subdivisions = _resolve_subdivisions(tempo, config)
    grid_times, grid_slots = _build_grid(beat_times, tempo, subdivisions)

    onset_frames = librosa.onset.onset_detect(
        onset_envelope=onset_envelope,
        sr=sr,
        hop_length=HOP_LENGTH,
        backtrack=True,
    )
    onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=HOP_LENGTH)
    onset_strengths = onset_envelope[onset_frames] if onset_frames.size else np.array([], dtype=float)

    centroid = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=HOP_LENGTH)[0]
    centroid_norm = _normalize_feature(centroid)
    centroid_median = float(np.median(centroid)) if centroid.size else 0.0

    assignments = _assign_onsets_to_grid(
        grid_times=grid_times,
        onset_frames=onset_frames,
        onset_times=onset_times,
        onset_strengths=onset_strengths,
        min_gap_ms=config.min_gap_ms,
    )
    kept_assignments = _apply_per_beat_cap(assignments, grid_slots, config.per_beat_cap)

    notes = _build_notes(
        kept_assignments,
        centroid,
        centroid_norm,
        centroid_median,
        onset_envelope,
        onset_strengths,
        config,
    )

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


def _chart_config(mode: ChartMode) -> ChartConfig:
    if mode is ChartMode.DENSE:
        return ChartConfig(
            min_gap_ms=70.0,
            per_beat_cap=3,
            big_quantile=0.8,
            min_subdivisions=4,
        )
    if mode is ChartMode.SPARSE:
        return ChartConfig(
            min_gap_ms=120.0,
            per_beat_cap=1,
            big_quantile=0.9,
            subdivisions_override=2,
        )
    return ChartConfig(
        min_gap_ms=90.0,
        per_beat_cap=2,
        big_quantile=0.85,
    )


def _ensure_tempo(tempo: float, beat_times: np.ndarray) -> float:
    if tempo > 0:
        return float(tempo)
    if beat_times.size >= 2:
        spacing = float(np.median(np.diff(beat_times)))
        if spacing > 0:
            return 60.0 / spacing
    return 120.0


def _auto_subdivisions(tempo: float) -> int:
    if tempo >= 170:
        return 2
    if tempo <= 95:
        return 8
    return 4


def _resolve_subdivisions(tempo: float, config: ChartConfig) -> int:
    subdivisions = config.subdivisions_override or _auto_subdivisions(tempo)
    if config.min_subdivisions:
        subdivisions = max(subdivisions, config.min_subdivisions)
    if config.max_subdivisions:
        subdivisions = min(subdivisions, config.max_subdivisions)
    return max(1, subdivisions)


def _build_grid(beat_times: np.ndarray, tempo: float, subdivisions: int) -> tuple[np.ndarray, list[tuple[int, int]]]:
    if beat_times.size == 0 or subdivisions <= 0:
        return np.array([], dtype=float), []

    grid_times: list[float] = []
    grid_slots: list[tuple[int, int]] = []
    default_step = 60.0 / tempo if tempo > 0 else 0.5

    for idx, start in enumerate(beat_times):
        if idx + 1 < beat_times.size:
            end = beat_times[idx + 1]
        else:
            end = start + default_step
        span = max(end - start, default_step / subdivisions)
        for sub_idx in range(subdivisions):
            grid_times.append(start + (span * sub_idx) / subdivisions)
            grid_slots.append((idx, sub_idx))

    return np.asarray(grid_times), grid_slots


def _assign_onsets_to_grid(
    *,
    grid_times: np.ndarray,
    onset_frames: np.ndarray,
    onset_times: np.ndarray,
    onset_strengths: np.ndarray,
    min_gap_ms: float,
) -> dict[int, GridAssignment]:
    assignments: dict[int, GridAssignment] = {}
    if grid_times.size == 0 or onset_times.size == 0:
        return assignments

    last_time = -1e9
    for frame, time, strength in sorted(zip(onset_frames, onset_times, onset_strengths), key=lambda item: item[1]):
        if (time - last_time) * 1000.0 < min_gap_ms:
            continue
        grid_idx = int(np.argmin(np.abs(grid_times - time)))
        existing = assignments.get(grid_idx)
        if existing and strength <= existing.strength:
            continue
        assignments[grid_idx] = GridAssignment(frame=int(frame), time=float(time), strength=float(strength))
        last_time = time
    return assignments


def _apply_per_beat_cap(
    assignments: dict[int, GridAssignment],
    grid_slots: list[tuple[int, int]],
    per_beat_cap: int,
) -> dict[int, GridAssignment]:
    if per_beat_cap <= 0:
        return assignments

    kept: dict[int, GridAssignment] = {}
    beat_counts: dict[int, int] = {}
    for grid_idx in sorted(assignments.keys()):
        if grid_idx >= len(grid_slots):
            continue
        beat_idx, _ = grid_slots[grid_idx]
        current = beat_counts.get(beat_idx, 0)
        if current >= per_beat_cap:
            continue
        kept[grid_idx] = assignments[grid_idx]
        beat_counts[beat_idx] = current + 1
    return kept


def _build_notes(
    assignments: dict[int, GridAssignment],
    centroid: np.ndarray,
    centroid_norm: np.ndarray,
    centroid_median: float,
    onset_envelope: np.ndarray,
    onset_strengths: np.ndarray,
    config: ChartConfig,
) -> list[TaikoNote]:
    if not assignments:
        return []

    envelope_norm = _normalize_feature(onset_envelope)
    big_threshold = float(np.quantile(onset_strengths, config.big_quantile)) if onset_strengths.size else float("inf")

    notes: list[TaikoNote] = []
    for grid_idx in sorted(assignments.keys()):
        assignment = assignments[grid_idx]
        frame = min(assignment.frame, envelope_norm.size - 1) if envelope_norm.size else 0
        centroid_idx = min(assignment.frame, centroid.size - 1) if centroid.size else 0
        centroid_norm_idx = min(assignment.frame, centroid_norm.size - 1) if centroid_norm.size else 0

        brightness_raw = centroid[centroid_idx] if centroid.size else 0.0
        brightness_norm = centroid_norm[centroid_norm_idx] if centroid_norm.size else 0.0
        intensity = envelope_norm[frame] if envelope_norm.size else 0.0
        color = "blue" if brightness_raw >= centroid_median else "red"
        is_big = assignment.strength >= big_threshold if np.isfinite(big_threshold) else False
        weight = "full" if is_big else "half"

        notes.append(
            TaikoNote(
                time=assignment.time,
                note_type=f"{color}_{weight}",
                intensity=float(intensity),
                brightness=float(brightness_norm),
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
