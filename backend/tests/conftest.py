"""Shared fixtures. Test audio is synthesised on the fly; nothing is committed."""
from __future__ import annotations

import numpy as np
import pytest
import soundfile as sf

SR = 44100


def drum_loop(bpm: float, offset: float, seconds: float, swing: bool = False) -> np.ndarray:
    rng = np.random.default_rng(7)
    out = np.zeros(int(seconds * SR))
    beat = 60.0 / bpm

    def put(time: float, sound: np.ndarray, gain: float) -> None:
        start = int(round(time * SR))
        if 0 <= start and start + len(sound) <= len(out):
            out[start:start + len(sound)] += sound * gain

    def kick() -> np.ndarray:
        t = np.arange(int(0.18 * SR)) / SR
        return np.sin(2 * np.pi * (55 + 90 * np.exp(-t * 30)) * t) * np.exp(-t * 18)

    def snare() -> np.ndarray:
        t = np.arange(int(0.14 * SR)) / SR
        return rng.standard_normal(len(t)) * np.exp(-t * 28) * 0.7 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.4

    def hat() -> np.ndarray:
        t = np.arange(int(0.04 * SR)) / SR
        return np.diff(rng.standard_normal(len(t)) * np.exp(-t * 90) * 0.25, prepend=0)

    for b in range(int((seconds - offset - 1) / beat)):
        time, measure = offset + b * beat, b // 4
        loud = 1.0 if (measure // 8) % 2 else 0.55
        put(time, kick() if b % 4 in (0, 2) else snare(), loud)
        put(time, hat(), loud)
        put(time + beat * (2 / 3 if swing else 0.5), hat(), loud)
        if b % 4 == 0:                              # bass and a chord that change every bar
            t = np.arange(int(beat * 4 * SR)) / SR
            root = (110.0, 130.8, 146.8, 98.0)[measure % 4]
            fade = np.minimum(1.0, (t[-1] - t) / 0.05) * np.exp(-t * 0.4)
            chord = sum(np.sin(2 * np.pi * root * ratio * t) for ratio in (2, 2.52, 3, 4))
            put(time, (np.sin(2 * np.pi * root / 2 * t) * 0.25 + chord * 0.05) * fade, loud)
    return out / np.max(np.abs(out)) * 0.8


@pytest.fixture(scope="session")
def loop_factory(tmp_path_factory):
    folder = tmp_path_factory.mktemp("audio")

    def make(bpm: float, offset: float = 0.25, seconds: float = 64.0, swing: bool = False):
        path = folder / f"loop-{bpm}-{offset}-{seconds}-{swing}.wav"
        if not path.exists():
            sf.write(path, drum_loop(bpm, offset, seconds, swing), SR)
        return path

    return make


@pytest.fixture()
def data_dir(tmp_path, monkeypatch):
    monkeypatch.setenv("TAIKO_DATA_DIR", str(tmp_path / "data"))
    return tmp_path / "data"
