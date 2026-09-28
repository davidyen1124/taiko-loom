"""Audio feature extraction: decoding, tempo, beat grid, band onsets and energy.

Everything here is about *listening* to the song. Turning the features into
playable notes lives in ``charting.py``.
"""
from __future__ import annotations

import json
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

import librosa
import numpy as np
from scipy.ndimage import maximum_filter1d, percentile_filter, uniform_filter1d

SR = 22050
HOP = 256
N_FFT = 1024
FRAME_RATE = SR / HOP
MIN_SECONDS = 5.0
MAX_SECONDS = 15 * 60
BPM_RANGE = (85.0, 175.0)
BEATS_PER_MEASURE = 4
# A centred analysis window sees an attack before its centre reaches it, so
# spectral-flux peaks lead the true attack. Measured against synthetic drum
# loops with known timing in tests/test_analysis.py.
ONSET_LEAD = 0.006
KICK_HZ = 115.0

Progress = Callable[[str, float], None]


class AnalysisError(ValueError):
    """The audio could not be decoded or has no usable rhythm."""


@dataclass
class Features:
    duration: float
    bpm: float
    steady: bool
    beats: np.ndarray
    downbeat: int
    env: np.ndarray
    low: np.ndarray
    high: np.ndarray
    rms: np.ndarray
    onsets: np.ndarray
    onset_strength: np.ndarray
    rms_floor: float
    waveform: list[float] = field(default_factory=list)

    def frame(self, time: float) -> int:
        return int(min(len(self.env) - 1, max(0, round(time * FRAME_RATE))))


def require_ffmpeg() -> None:
    for tool in ("ffmpeg", "ffprobe"):
        if shutil.which(tool) is None:
            raise AnalysisError(f"{tool} is not installed. Install FFmpeg and try again.")


def probe(path: Path) -> dict:
    """Return duration and tags for an audio file, or raise if it is not audio."""
    require_ffmpeg()
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)],
        capture_output=True, text=True, check=False,
    )
    if result.returncode != 0:
        raise AnalysisError("This file could not be read as audio.")
    info = json.loads(result.stdout or "{}")
    streams = [s for s in info.get("streams", []) if s.get("codec_type") == "audio"]
    if not streams:
        raise AnalysisError("This file has no audio track.")
    fmt = info.get("format", {})
    try:
        duration = float(fmt.get("duration") or streams[0].get("duration") or 0)
    except (TypeError, ValueError):
        duration = 0.0
    tags = {k.lower(): str(v).strip() for k, v in {**streams[0].get("tags", {}), **fmt.get("tags", {})}.items()}
    return {"duration": duration, "title": tags.get("title", ""), "artist": tags.get("artist", ""),
            "codec": streams[0].get("codec_name", "")}


def transcode_for_playback(source: Path, target: Path) -> None:
    """Write the file the browser will play. Analysis reads this same file,
    so chart times and playback share one sample-accurate timeline."""
    require_ffmpeg()
    result = subprocess.run(
        ["ffmpeg", "-v", "error", "-nostdin", "-y", "-i", str(source), "-t", str(MAX_SECONDS), "-vn",
         "-map_metadata", "-1", "-ac", "2", "-ar", "44100", "-sample_fmt", "s16", "-c:a", "flac", str(target)],
        capture_output=True, text=True, check=False,
    )
    if result.returncode != 0 or not target.exists() or target.stat().st_size == 0:
        raise AnalysisError("This audio format could not be converted.")


def decode_mono(path: Path) -> np.ndarray:
    require_ffmpeg()
    result = subprocess.run(
        ["ffmpeg", "-v", "error", "-nostdin", "-i", str(path), "-t", str(MAX_SECONDS), "-vn",
         "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True, check=False,
    )
    if result.returncode != 0 or not result.stdout:
        raise AnalysisError("This audio could not be decoded.")
    return np.frombuffer(result.stdout, dtype="<f4").astype(np.float32)


def _band_flux(log_mel: np.ndarray, lo: int, hi: int) -> np.ndarray:
    band = log_mel[lo:hi]
    flux = np.maximum(0.0, band[:, 1:] - band[:, :-1]).mean(axis=0)
    return np.concatenate([[0.0], flux])


def _sample(env: np.ndarray, times: np.ndarray) -> np.ndarray:
    return np.interp(times * FRAME_RATE, np.arange(len(env)), env, left=0.0, right=0.0)


def _fit_grid(beats: np.ndarray) -> tuple[float, float, bool]:
    """Fit ``time = offset + index * period`` to tracked beats, tolerating
    beats the tracker skipped or doubled."""
    period = float(np.median(np.diff(beats)))
    offset = float(beats[0])
    index = np.zeros(len(beats))
    for _ in range(3):
        steps = np.maximum(1, np.rint(np.diff(beats) / period))
        index[1:] = np.cumsum(steps)
        design = np.vstack([index, np.ones_like(index)]).T
        weight = np.ones(len(beats))
        for _ in range(5):
            solution = np.linalg.lstsq(design * weight[:, None], beats * weight, rcond=None)[0]
            residual = beats - design @ solution
            scale = max(1e-3, 1.4826 * float(np.median(np.abs(residual))))
            weight = 1.0 / (1.0 + (residual / (2.5 * scale)) ** 2)
        period, offset = float(solution[0]), float(solution[1])
    residual = np.abs(beats - (offset + index * period))
    steady = float(np.percentile(residual, 85)) < 0.04
    return period, offset, steady


def _refine_grid(period: float, offset: float, env: np.ndarray, duration: float) -> tuple[float, float]:
    """Nudge the fitted grid onto the actual attacks in the onset envelope."""
    best = (-1.0, period, offset)
    smooth = uniform_filter1d(env, size=3)
    for span_p, span_o, steps_p, steps_o in ((6e-4, 0.035, 25, 29), (6e-5, 0.006, 13, 13)):
        _, centre_p, centre_o = best
        for dp in np.linspace(-span_p, span_p, steps_p) * centre_p:
            p = centre_p + dp
            count = int(duration / p) + 2
            base = np.arange(count) * p
            for do in np.linspace(-span_o, span_o, steps_o):
                times = centre_o + do + base
                times = times[(times >= 0) & (times < duration)]
                score = float(_sample(smooth, times).sum()) / max(1, len(times))
                if score > best[0]:
                    best = (score, p, centre_o + do)
    return best[1], best[2]


# Tempos a beat tracker commonly confuses with the real one.
TEMPO_RATIOS = (1.0, 2 / 3, 3 / 2, 0.5, 2.0, 3 / 4, 4 / 3)
# A related tempo must explain the attacks this much better to replace the
# tracker's own answer. Keeps shuffle rhythms from being read as 3:2 faster.
OVERRIDE_MARGIN = 1.2


def _choose_tempo(period: float, env: np.ndarray, duration: float) -> tuple[float, float] | None:
    """Judge the tracked tempo against its look-alikes by laying each grid
    over the attacks. The real beat catches a drum hit on every line."""
    smooth = uniform_filter1d(env, size=3)
    chosen: tuple[float, float, float] | None = None
    for ratio in TEMPO_RATIOS:
        centre = period * ratio
        bpm = 60.0 / centre
        if not BPM_RANGE[0] - 1 <= bpm < BPM_RANGE[1] + 1:
            continue
        best = (-1.0, centre, 0.0)
        for candidate in centre * (1 + np.linspace(-6e-4, 6e-4, 13)):
            base = np.arange(int(duration / candidate) + 2) * candidate
            for offset in np.arange(0.0, candidate, 0.008):
                times = offset + base
                times = times[times < duration]
                score = float(_sample(smooth, times).mean()) if len(times) else 0.0
                if score > best[0]:
                    best = (score, float(candidate), float(offset))
        prior = float(np.exp(-0.5 * (np.log2(bpm / 120.0) / 1.1) ** 2))
        weighted = best[0] * np.sqrt(bpm) * prior / (1.0 if ratio == 1.0 else OVERRIDE_MARGIN)
        if chosen is None or weighted > chosen[0]:
            chosen = (float(weighted), best[1], best[2])
    return (chosen[1], chosen[2]) if chosen else None


def _normalise_tempo(period: float, offset: float, low: np.ndarray, env: np.ndarray, duration: float) -> tuple[float, float]:
    bpm = 60.0 / period
    while bpm < BPM_RANGE[0]:
        period /= 2
        bpm *= 2
    while bpm >= BPM_RANGE[1]:
        period *= 2
        bpm /= 2
        # Halving leaves two candidate phases. Kicks mark the beat.
        a = np.arange(offset, duration, period)
        b = a + period / 2
        strength = low + 0.5 * env
        if _sample(strength, b).sum() > _sample(strength, a).sum():
            offset += period / 2
    return period, offset


def _fix_offbeat(period: float, offset: float, low: np.ndarray, duration: float) -> float:
    """Trackers sometimes lock onto the off-beat. Bass drums rarely do."""
    on = np.arange(offset, duration, period)
    off = on + period / 2
    if _sample(low, off).sum() > 1.35 * _sample(low, on).sum():
        return offset + period / 2
    return offset


def _repair_beats(beats: np.ndarray, duration: float) -> np.ndarray:
    """For songs whose tempo moves: fill gaps, drop doubles, extend to both ends."""
    period = float(np.median(np.diff(beats)))
    out = [float(beats[0])]
    for t in beats[1:]:
        gap = float(t) - out[-1]
        if gap < 0.6 * period:
            continue
        parts = max(1, int(round(gap / period)))
        for k in range(1, parts + 1):
            out.append(out[-1] + (float(t) - out[-1]) / (parts - k + 1))
    first = float(np.mean(np.diff(out[:5]))) if len(out) > 5 else period
    while out[0] - first > 0.02:
        out.insert(0, out[0] - first)
    last = float(np.mean(np.diff(out[-5:]))) if len(out) > 5 else period
    while out[-1] + last < duration - 0.02:
        out.append(out[-1] + last)
    return np.array(out)


def _find_downbeat(beats: np.ndarray, low: np.ndarray, chroma: np.ndarray) -> int:
    """Pick which of the four beat phases starts the bar, using bass attacks
    and harmonic change (chords tend to move on the downbeat)."""
    if len(beats) < 8:
        return 0
    bass = _sample(low, beats)
    frames = np.clip(np.rint(beats * FRAME_RATE).astype(int), 0, chroma.shape[1] - 1)
    per_beat = np.stack([
        chroma[:, a:max(a + 1, b)].mean(axis=1)
        for a, b in zip(frames[:-1], frames[1:])
    ], axis=1)
    per_beat /= np.linalg.norm(per_beat, axis=0, keepdims=True) + 1e-9
    change = np.zeros(len(beats))
    change[1:len(beats) - 1] = 1.0 - np.sum(per_beat[:, 1:] * per_beat[:, :-1], axis=0)

    def z(values: np.ndarray) -> np.ndarray:
        return (values - values.mean()) / (values.std() + 1e-9)

    score = z(bass) + 1.2 * z(change)
    totals = [float(score[phase::BEATS_PER_MEASURE].mean()) for phase in range(BEATS_PER_MEASURE)]
    return int(np.argmax(totals))


def extract(path: Path, progress: Progress | None = None) -> Features:
    """Decode ``path`` and measure everything the chart generator needs."""
    report = progress or (lambda stage, fraction: None)
    report("decoding", 0.05)
    y = decode_mono(path)
    duration = len(y) / SR
    if duration < MIN_SECONDS:
        raise AnalysisError("Choose a song at least 5 seconds long.")
    if not np.isfinite(y).all() or float(np.max(np.abs(y))) < 1e-4:
        raise AnalysisError("This audio is silent. Try another file.")

    report("listening", 0.2)
    spectrum = np.abs(librosa.stft(y, n_fft=N_FFT, hop_length=HOP))
    _, percussive = librosa.decompose.hpss(spectrum, margin=(1.0, 2.0))
    mel_basis = librosa.filters.mel(sr=SR, n_fft=N_FFT, n_mels=64)
    centres = librosa.mel_frequencies(n_mels=64, fmin=0.0, fmax=SR / 2)
    log_mel = librosa.power_to_db(mel_basis @ (percussive ** 2), ref=np.max, top_db=70.0)
    high_lo = int(np.searchsorted(centres, 2200.0))
    env = _band_flux(log_mel, 0, log_mel.shape[0])
    kick_bins = max(2, int(KICK_HZ / (SR / N_FFT)) + 1)
    kick = (percussive[1:kick_bins] ** 2).sum(axis=0, keepdims=True)
    low = _band_flux(librosa.power_to_db(kick, ref=float(kick.max()) or 1.0, top_db=50.0), 0, 1)
    high = _band_flux(log_mel, high_lo, log_mel.shape[0])
    rms = librosa.feature.rms(S=spectrum, frame_length=N_FFT, hop_length=HOP)[0]
    chroma = librosa.feature.chroma_stft(S=spectrum ** 2, sr=SR, n_fft=N_FFT, hop_length=HOP)
    size = min(len(env), len(rms), chroma.shape[1])
    env, low, high, rms, chroma = env[:size], low[:size], high[:size], rms[:size], chroma[:, :size]

    report("finding the beat", 0.45)
    _, frames = librosa.beat.beat_track(onset_envelope=env, sr=SR, hop_length=HOP, trim=False)
    tracked = librosa.frames_to_time(np.asarray(frames), sr=SR, hop_length=HOP)
    if len(tracked) < 8:
        raise AnalysisError("No clear beat found. Try a more rhythmic song.")

    period, offset, steady = _fit_grid(tracked)
    if steady:
        picked = _choose_tempo(period, env, duration)
        if picked:
            period, offset = picked
        period, offset = _refine_grid(period, offset, env, duration)
        period, offset = _normalise_tempo(period, offset, low, env, duration)
        offset = _fix_offbeat(period, offset, low, duration)
        offset += ONSET_LEAD
        offset -= np.floor(offset / period) * period
        beats = np.arange(offset, duration - 0.02, period)
    else:
        beats = _repair_beats(tracked, duration) + ONSET_LEAD
        local = float(np.median(np.diff(beats)))
        while 60.0 / local < BPM_RANGE[0]:
            beats = np.sort(np.concatenate([beats, (beats[:-1] + beats[1:]) / 2]))
            local /= 2
        while 60.0 / local >= BPM_RANGE[1]:
            beats = beats[::2]
            local *= 2
        beats = beats[(beats >= 0) & (beats < duration)]
        period = local
    bpm = 60.0 / period

    report("finding the bar", 0.6)
    downbeat = _find_downbeat(beats, low, chroma)

    # Salience relative to how loud the song is around each moment, so a quiet
    # verse still gets notes on its clear attacks.
    reference = percentile_filter(env, 92, size=int(4 * FRAME_RATE) | 1, mode="nearest")
    relative = np.clip(env / (reference + 0.25 * float(np.percentile(env, 90)) + 1e-9), 0.0, 2.0)
    peaks = (relative == maximum_filter1d(relative, size=5)) & (relative > 0.18)
    onset_frames = np.flatnonzero(peaks)
    onsets = onset_frames / FRAME_RATE + ONSET_LEAD

    loud = float(np.percentile(rms, 95))
    rms_floor = max(loud * 0.06, 1e-4)
    blocks = np.array_split(y, 180)
    wave = np.array([float(np.sqrt(np.mean(block ** 2))) if len(block) else 0.0 for block in blocks])
    wave = wave / (wave.max() or 1.0)

    return Features(
        duration=duration, bpm=bpm, steady=bool(steady), beats=beats, downbeat=downbeat,
        env=relative, low=low, high=high, rms=rms, onsets=onsets,
        onset_strength=relative[onset_frames], rms_floor=rms_floor,
        waveform=[round(float(v), 3) for v in wave],
    )
