from __future__ import annotations

import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

import librosa
import numpy as np

from .schemas import AudioPayload, AudioStats, TaikoNote

HOP_LENGTH = 512
MIN_GAP_MS = 90.0
LOCAL_WINDOW_S = 0.6
BIG_QUANTILE = 0.85
LOW_BAND_HZ = 400.0
HIGH_BAND_HZ = 1200.0


@dataclass
class AnalysisResult:
    notes: list[TaikoNote]
    beat_times: list[float]
    stats: AudioStats


def analyze_audio_bytes(data: bytes, filename: str) -> AnalysisResult:
    suffix = Path(filename).suffix or ".mp3"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_file:
        tmp_path = Path(tmp_file.name)
        tmp_file.write(data)
        tmp_file.flush()
    try:
        return _analyze_audio_path(tmp_path)
    finally:
        try:
            tmp_path.unlink(missing_ok=True)
        except FileNotFoundError:
            pass


def _analyze_audio_path(path: Path) -> AnalysisResult:
    y, sr = librosa.load(path, sr=None, mono=True)
    duration = float(librosa.get_duration(y=y, sr=sr))
    y_h, y_p = librosa.effects.hpss(y)

    onset_envelope = librosa.onset.onset_strength(y=y_p, sr=sr, hop_length=HOP_LENGTH)
    onset_frames = librosa.onset.onset_detect(
        onset_envelope=onset_envelope,
        sr=sr,
        hop_length=HOP_LENGTH,
        backtrack=False,
    )
    onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=HOP_LENGTH)
    onset_strengths = onset_envelope[onset_frames] if onset_frames.size else np.array([], dtype=float)

    # Keep beat tracking only for stats/visualization; notes won't be snapped to it.
    tempo, beat_frames = librosa.beat.beat_track(y=y_p, sr=sr, hop_length=HOP_LENGTH, trim=False)
    if beat_frames.size == 0:
        beat_frames = librosa.onset.onset_detect(y=y_p, sr=sr, hop_length=HOP_LENGTH, units="frames")
    beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=HOP_LENGTH)
    if beat_times.size == 0:
        beat_times = np.linspace(0.0, max(duration, 1.0), num=max(int(duration), 1), endpoint=False)
    tempo = _ensure_tempo(tempo, beat_times)

    centroid = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=HOP_LENGTH)[0]
    centroid_norm = _normalize_feature(centroid)

    kept_frames, kept_times, kept_strengths = _filter_onsets(
        onset_frames, onset_times, onset_strengths, min_gap_ms=MIN_GAP_MS
    )
    notes = _build_energy_notes(
        kept_frames=kept_frames,
        kept_times=kept_times,
        kept_strengths=kept_strengths,
        onset_envelope=onset_envelope,
        centroid=centroid,
        centroid_norm=centroid_norm,
        sample_rate=sr,
    )

    stats = AudioStats(
        bpm=float(tempo) if tempo > 0 else 0.0,
        duration=duration,
        total_beats=len(beat_times),
        total_notes=len(notes),
        notes_per_second=(len(notes) / duration) if duration else 0.0,
        red_ratio=_ratio(notes, prefix="red"),
        blue_ratio=_ratio(notes, prefix="blue"),
    )

    return AnalysisResult(notes=notes, beat_times=beat_times.tolist(), stats=stats)


def _filter_onsets(
    frames: np.ndarray, times: np.ndarray, strengths: np.ndarray, *, min_gap_ms: float
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    if times.size == 0:
        return frames, times, strengths

    kept_frames: list[int] = []
    kept_times: list[float] = []
    kept_strengths: list[float] = []
    last_time = -1e9

    for frame, time, strength in sorted(zip(frames, times, strengths), key=lambda item: item[1]):
        if (time - last_time) * 1000.0 < min_gap_ms:
            continue
        kept_frames.append(int(frame))
        kept_times.append(float(time))
        kept_strengths.append(float(strength))
        last_time = time

    return (
        np.asarray(kept_frames, dtype=int),
        np.asarray(kept_times, dtype=float),
        np.asarray(kept_strengths, dtype=float),
    )


def _build_energy_notes(
    *,
    kept_frames: np.ndarray,
    kept_times: np.ndarray,
    kept_strengths: np.ndarray,
    onset_envelope: np.ndarray,
    centroid: np.ndarray,
    centroid_norm: np.ndarray,
    sample_rate: int,
) -> list[TaikoNote]:
    if kept_times.size == 0:
        return []

    envelope_norm = _normalize_feature(onset_envelope)
    strength_max = float(np.max(kept_strengths)) if kept_strengths.size else 1.0
    centroid_median_global = float(np.median(centroid)) if centroid.size else 0.0

    notes: list[TaikoNote] = []
    for idx, (frame, time, strength) in enumerate(zip(kept_frames, kept_times, kept_strengths)):
        local_mask = np.abs(kept_times - time) <= LOCAL_WINDOW_S
        local_strengths = kept_strengths[local_mask] if kept_strengths.size else np.array([], dtype=float)
        big_threshold = float(np.quantile(local_strengths, BIG_QUANTILE)) if local_strengths.size else strength_max

        color_threshold = _local_centroid_threshold(time, centroid, sample_rate, LOCAL_WINDOW_S, centroid_median_global)

        frame_idx = min(int(frame), envelope_norm.size - 1) if envelope_norm.size else 0
        centroid_idx = min(int(frame), centroid.size - 1) if centroid.size else 0
        centroid_norm_idx = min(int(frame), centroid_norm.size - 1) if centroid_norm.size else 0

        brightness_raw = centroid[centroid_idx] if centroid.size else 0.0
        brightness_norm = centroid_norm[centroid_norm_idx] if centroid_norm.size else 0.0
        intensity = envelope_norm[frame_idx] if envelope_norm.size else 0.0
        color = "blue" if brightness_raw >= color_threshold else "red"
        weight = "full" if strength >= big_threshold else "half"

        notes.append(
            TaikoNote(
                time=float(time),
                note_type=f"{color}_{weight}",
                intensity=float(intensity),
                brightness=float(brightness_norm),
            )
        )

    notes.sort(key=lambda note: note.time)
    return notes


def _local_centroid_threshold(
    time: float, centroid: np.ndarray, sample_rate: int, window_s: float, fallback: float
) -> float:
    if centroid.size == 0:
        return fallback
    # Convert time window to frame window (centroid is per frame with hop length)
    hop_seconds = HOP_LENGTH / float(sample_rate)
    half_window_frames = int(window_s / hop_seconds)
    center_frame = int(time / hop_seconds)
    start = max(center_frame - half_window_frames, 0)
    end = min(center_frame + half_window_frames + 1, centroid.size)
    window_vals = centroid[start:end]
    if window_vals.size == 0:
        return fallback
    return float(np.median(window_vals))


def _normalize_feature(values: Sequence[float]) -> np.ndarray:
    arr = np.asarray(values, dtype=float)
    peak = np.max(arr) if arr.size else 0.0
    if peak <= 0:
        return np.zeros_like(arr)
    return arr / peak


def _ratio(notes: Sequence[TaikoNote], prefix: str) -> float:
    if not notes:
        return 0.0
    count = sum(1 for note in notes if note.note_type.startswith(prefix))
    return count / len(notes)


def _ensure_tempo(tempo: float, beat_times: np.ndarray) -> float:
    if tempo > 0:
        return float(tempo)
    if beat_times.size >= 2:
        spacing = float(np.median(np.diff(beat_times)))
        if spacing > 0:
            return 60.0 / spacing
    return 0.0


def to_payload(result: AnalysisResult) -> AudioPayload:
    return AudioPayload(notes=result.notes, beat_times=result.beat_times, stats=result.stats)
