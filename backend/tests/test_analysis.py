import numpy as np
import pytest
import soundfile as sf

from taiko_backend import analysis, charting


@pytest.mark.parametrize("bpm,offset", [(120, 0.25), (96, 0.10), (150, 0.40), (138, 0.45), (110, 0.33), (165, 0.20)])
def test_tempo_and_beat_phase_match_known_audio(loop_factory, bpm, offset):
    features = analysis.extract(loop_factory(bpm, offset))
    assert features.steady
    assert abs(features.bpm - bpm) < 0.05
    period = 60 / bpm
    error = ((features.beats - offset + period / 2) % period) - period / 2
    assert np.abs(error).max() < 0.008, "beats must land within 8 ms of the real attacks"


def test_downbeat_lands_on_the_bar(loop_factory):
    features = analysis.extract(loop_factory(120, 0.25))
    bar = 4 * 60 / 120
    first = features.beats[features.downbeat]
    assert abs(((first - 0.25 + bar / 2) % bar) - bar / 2) < 0.01


def test_slow_songs_are_charted_at_double_time(loop_factory):
    features = analysis.extract(loop_factory(70, 0.3, 80))
    assert abs(features.bpm - 140) < 0.1


def test_shuffle_keeps_its_own_tempo(loop_factory):
    # a shuffle has attacks two thirds of the way through each beat, which
    # must not be mistaken for a tempo one and a half times faster
    features = analysis.extract(loop_factory(128, 0.33, swing=True))
    assert abs(features.bpm - 128) < 0.1


def test_shuffle_is_detected(loop_factory):
    straight = charting.generate(analysis.extract(loop_factory(120, 0.25)))
    shuffle = charting.generate(analysis.extract(loop_factory(128, 0.33, swing=True)))
    assert straight["feel"] == "straight"
    assert shuffle["feel"] == "shuffle"


def test_silence_and_short_audio_are_rejected(tmp_path):
    silent = tmp_path / "silent.wav"
    sf.write(silent, np.zeros(44100 * 10), 44100)
    with pytest.raises(analysis.AnalysisError, match="silent"):
        analysis.extract(silent)
    short = tmp_path / "short.wav"
    sf.write(short, np.random.default_rng(1).standard_normal(44100 * 2) * 0.1, 44100)
    with pytest.raises(analysis.AnalysisError, match="at least 5 seconds"):
        analysis.extract(short)


def test_not_audio_is_rejected(tmp_path):
    fake = tmp_path / "notes.mp3"
    fake.write_text("this is not audio")
    with pytest.raises(analysis.AnalysisError):
        analysis.probe(fake)
