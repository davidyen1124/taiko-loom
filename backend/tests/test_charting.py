import numpy as np
import pytest

from taiko_backend import analysis, charting

HITS = {"don", "ka", "bigDon", "bigKa"}
HOLDS = {"roll", "bigRoll", "balloon"}


@pytest.fixture(scope="module")
def chart(loop_factory):
    return charting.generate(analysis.extract(loop_factory(120, 0.25, 96)))


def test_document_shape(chart):
    assert chart["version"] == charting.CHART_VERSION
    assert set(chart["charts"]) == {"easy", "medium", "hard"}
    assert len(chart["waveform"]) == 180
    assert chart["measures"] == sorted(chart["measures"])
    assert all(b > a for a, b in chart["gogo"])


def test_difficulties_get_harder(chart):
    easy, medium, hard = (chart["charts"][k] for k in ("easy", "medium", "hard"))
    assert easy["stats"]["hits"] < medium["stats"]["hits"] < hard["stats"]["hits"]
    assert easy["stars"] <= medium["stars"] <= hard["stars"]
    assert 0.6 < easy["stats"]["density"] < 1.6
    assert 1.4 < medium["stats"]["density"] < 2.6
    assert 2.5 < hard["stats"]["density"] < 4.2


@pytest.mark.parametrize("name", charting.DIFFICULTIES)
def test_notes_are_ordered_valid_and_playable(chart, name):
    notes = chart["charts"][name]["notes"]
    profile = charting.PROFILES[name]
    times = [n["time"] for n in notes]
    assert times == sorted(times)
    assert all(0 < n["time"] < chart["duration"] for n in notes)
    assert all(n["type"] in HITS | HOLDS for n in notes)
    hits = [n["time"] for n in notes if n["type"] in HITS]
    assert np.diff(hits).min() >= profile.floor - 1e-3
    for hold in (n for n in notes if n["type"] in HOLDS):
        assert hold["end"] > hold["time"] + 0.3
        assert not any(hold["time"] - 1e-3 <= t <= hold["end"] + 1e-3 for t in hits), "holds never overlap notes"
        if hold["type"] == "balloon":
            assert hold["hits"] >= 4


@pytest.mark.parametrize("name", charting.DIFFICULTIES)
def test_notes_sit_on_the_grid(chart, name):
    beat = 60 / chart["bpm"]
    finest = beat / 4
    origin = chart["beats"][0]
    for note in chart["charts"][name]["notes"]:
        offset = (note["time"] - origin) / finest
        assert abs(offset - round(offset)) < 0.02


def test_easy_only_uses_whole_beats(chart):
    beat = 60 / chart["bpm"]
    for note in chart["charts"]["easy"]["notes"]:
        if note["type"] in HITS:
            offset = (note["time"] - chart["beats"][0]) / beat
            assert abs(offset - round(offset)) < 0.02


def test_every_chart_has_every_note_family(chart):
    for name in charting.DIFFICULTIES:
        kinds = {n["type"] for n in chart["charts"][name]["notes"]}
        assert {"don", "ka"} <= kinds
        assert kinds & {"bigDon", "bigKa"}
        assert kinds & {"roll", "bigRoll"}


def test_gogo_sits_inside_the_loud_sections(chart):
    # The fixture is loud in measures 8-15, 24-31 and 40-47 (2 s per measure).
    loud = [(0.25 + 2 * a, 0.25 + 2 * b) for a, b in ((8, 16), (24, 32), (40, 48))]
    assert chart["gogo"]
    for start, end in chart["gogo"]:
        assert end - start >= 7.99
        assert any(a - 0.1 <= start and end <= b + 0.1 for a, b in loud)
    assert sum(b - a for a, b in chart["gogo"]) <= 0.45 * chart["duration"]


def test_generation_is_deterministic(loop_factory):
    path = loop_factory(120, 0.25, 96)
    assert charting.generate(analysis.extract(path)) == charting.generate(analysis.extract(path))
