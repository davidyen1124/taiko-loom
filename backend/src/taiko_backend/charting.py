"""Turn audio features into Easy / Medium / Hard taiko charts.

The generator works on a musical grid instead of raw onset times, the way a
human chart author would: notes sit on beats and subdivisions, each difficulty
is allowed a finer subdivision than the one before, and the song's loudest
sections become Go-Go Time.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .analysis import BEATS_PER_MEASURE, FRAME_RATE, Features

CHART_VERSION = 2
DIFFICULTIES = ("easy", "medium", "hard")


@dataclass(frozen=True)
class Profile:
    name: str
    level: int            # finest subdivision level allowed: 0 beat, 1 half-beat, 2 quarter-beat
    density: float        # target notes per second while the music is active
    floor: float          # never place notes closer than this many seconds
    max_run: int          # longest chain at the tightest spacing
    ka_ratio: float
    big_gap: float        # a big note needs this many beats of room on both sides
    big_every: int        # at most one big note per this many measures
    roll_beats: int
    balloon_rate: float   # required hits per second
    stars: tuple[int, int]
    star_base: float
    star_slope: float


PROFILES = {
    "easy": Profile("easy", 0, 1.15, 0.30, 16, 0.28, 1.0, 4, 4, 3.0, (1, 5), 0.5, 2.4),
    "medium": Profile("medium", 1, 2.05, 0.17, 7, 0.38, 1.0, 3, 3, 4.5, (2, 7), 1.0, 1.9),
    "hard": Profile("hard", 2, 3.40, 0.095, 5, 0.44, 0.5, 2, 2, 6.5, (3, 8), 1.5, 1.5),
}


@dataclass
class Slot:
    index: int
    time: float
    length: float         # seconds until the next slot
    beat: int             # beat number counted from the first downbeat
    sub: int              # position inside the beat
    level: int            # 0 on the beat, 1 half-beat, 2 finer
    measure: int
    beat_in_measure: int
    salience: float = 0.0
    bright: float = 0.0
    active: bool = False
    intensity: float = 1.0
    gogo: bool = False


def detect_feel(features: Features) -> int:
    """Return 3 for shuffle / triplet songs, otherwise 4 subdivisions per beat."""
    beats = features.beats
    if len(beats) < 8 or len(features.onsets) < 16:
        return 4
    which = np.clip(np.searchsorted(beats, features.onsets, side="right") - 1, 0, len(beats) - 2)
    phase = (features.onsets - beats[which]) / (beats[which + 1] - beats[which])
    keep = (phase >= 0) & (phase < 1)
    phase, weight = phase[keep], features.onset_strength[keep]

    def near(targets: tuple[float, ...]) -> float:
        distance = np.min(np.abs(phase[:, None] - np.array(targets)[None, :]), axis=1)
        return float(weight[distance < 0.055].sum())

    straight = near((0.25, 0.5, 0.75))
    triplet = near((1 / 3, 2 / 3))
    return 3 if triplet > 1.25 * straight else 4


def build_slots(features: Features, division: int) -> list[Slot]:
    beats = features.beats
    levels = {4: (0, 2, 1, 2), 3: (0, 2, 1)}[division]
    slots: list[Slot] = []
    for i in range(len(beats)):
        length = beats[i + 1] - beats[i] if i + 1 < len(beats) else beats[i] - beats[i - 1]
        number = i - features.downbeat
        for sub in range(division):
            slots.append(Slot(
                index=len(slots), time=float(beats[i] + length * sub / division), length=float(length / division),
                beat=number, sub=sub, level=levels[sub],
                measure=number // BEATS_PER_MEASURE, beat_in_measure=number % BEATS_PER_MEASURE,
            ))
    times = np.array([s.time for s in slots])

    # Give every detected attack to the single slot it is closest to.
    nearest = np.clip(np.searchsorted(times, features.onsets), 1, len(times) - 1)
    nearest -= (features.onsets - times[nearest - 1]) < (times[nearest] - features.onsets)
    for onset, strength, k in zip(features.onsets, features.onset_strength, nearest):
        slot = slots[int(k)]
        if abs(onset - slot.time) <= 0.42 * slot.length:
            slot.salience = max(slot.salience, float(strength))

    low_scale = float(np.percentile(features.low, 95)) + 1e-9
    high_scale = float(np.percentile(features.high, 95)) + 1e-9
    reach = max(1, int(round(0.03 * FRAME_RATE)))
    quiet = max(2, int(round(0.12 * FRAME_RATE)))
    for slot in slots:
        f = features.frame(slot.time)
        lo = float(features.low[max(0, f - reach):f + reach + 1].max()) / low_scale
        hi = float(features.high[max(0, f - reach):f + reach + 1].max()) / high_scale
        slot.bright = hi / (lo + hi + 1e-6)
        loud = float(features.rms[max(0, f - quiet):f + quiet + 1].max())
        slot.active = loud > features.rms_floor and 0.4 <= slot.time <= features.duration - 0.6
    return slots


def measure_energy(features: Features, slots: list[Slot]) -> dict[int, float]:
    """Loudness of each measure in decibels, lightly smoothed."""
    spans: dict[int, list[float]] = {}
    for slot in slots:
        span = spans.setdefault(slot.measure, [slot.time, slot.time])
        span[1] = slot.time + slot.length
    numbers = sorted(spans)
    levels = []
    for m in numbers:
        a, b = features.frame(spans[m][0]), max(features.frame(spans[m][1]), features.frame(spans[m][0]) + 1)
        levels.append(float(np.sqrt(np.mean(features.rms[a:b] ** 2))))
    values = 20 * np.log10(np.maximum(np.array(levels), 1e-6))
    values = np.maximum(values, values.max() - 40.0)
    if len(values) >= 3:
        values = np.convolve(np.pad(values, 1, mode="edge"), [0.2, 0.6, 0.2], mode="valid")
    return {m: float(v) for m, v in zip(numbers, values)}


def _rank(energy: dict[int, float]) -> dict[int, float]:
    numbers = sorted(energy)
    values = np.array([energy[m] for m in numbers])
    order = values.argsort().argsort() / max(1, len(values) - 1)
    return {m: float(r) for m, r in zip(numbers, order)}


def _loud_threshold(values: np.ndarray) -> float:
    """Split measures into quiet and loud. Songs with a clear verse / chorus
    contrast split at the gap between them (Otsu); flat songs fall back to
    their top third."""
    candidates = np.unique(values)
    best, best_score = float(np.quantile(values, 0.7)), 0.0
    for cut in (candidates[:-1] + candidates[1:]) / 2:
        quiet, loud = values[values < cut], values[values >= cut]
        score = len(quiet) * len(loud) * (loud.mean() - quiet.mean()) ** 2
        if score > best_score:
            best, best_score = float(cut), score
    quiet, loud = values[values < best], values[values >= best]
    if len(quiet) == 0 or loud.mean() - quiet.mean() < 1.5:
        return float(np.quantile(values, 0.7))
    return max(best, float(np.quantile(values, 0.45)))


def find_gogo(energy: dict[int, float], active: dict[int, bool]) -> list[tuple[int, int]]:
    """Pick the loudest stretches of whole measures. Returns [start, end) pairs."""
    numbers = [m for m in sorted(energy) if m >= 0]
    if len(numbers) < 8:
        return []
    threshold = _loud_threshold(np.array([energy[m] for m in numbers]))
    hot = {m: energy[m] >= threshold and active.get(m, False) for m in numbers}
    for m in numbers[1:-1]:                       # bridge single-measure dips
        if not hot[m] and hot[m - 1] and hot.get(m + 1, False) and active.get(m, False):
            hot[m] = True
    runs: list[tuple[int, int]] = []
    start = None
    for m in numbers + [numbers[-1] + 1]:
        if hot.get(m, False):
            start = m if start is None else start
        elif start is not None:
            runs.append((start, m))
            start = None
    sections: list[tuple[int, int]] = []
    for a, b in runs:
        a += (-a) % 2                             # phrases start on even measures
        while b - a >= 4:
            length = min(16, (b - a) // 4 * 4)
            sections.append((a, a + length))
            a += length
    if not sections:
        window = min(8, len(numbers) // 2 // 4 * 4)
        if window < 4:
            return []
        best = max(range(numbers[0], numbers[-1] - window + 2),
                   key=lambda s: sum(energy.get(m, 0) for m in range(s, s + window)))
        sections = [(best, best + window)]

    def mean(section: tuple[int, int]) -> float:
        return sum(energy.get(m, 0) for m in range(*section)) / (section[1] - section[0])

    budget = 0.4 * len(numbers)
    sections.sort(key=mean, reverse=True)
    kept, used = [], 0
    for section in sections:
        if used + section[1] - section[0] <= budget or not kept:
            kept.append(section)
            used += section[1] - section[0]
    merged: list[tuple[int, int]] = []
    for a, b in sorted(kept):
        if merged and a == merged[-1][1] and b - merged[-1][0] <= 16:
            merged[-1] = (merged[-1][0], b)
        else:
            merged.append((a, b))
    return merged


METRIC = {0: 1.0, 2: 0.92, 1: 0.85, 3: 0.85}      # weight of beats 1, 3, 2, 4
LEVEL_WEIGHT = {0: 1.0, 1: 0.62, 2: 0.42}


def _score(slot: Slot) -> float:
    weight = METRIC[slot.beat_in_measure] if slot.level == 0 else LEVEL_WEIGHT[slot.level]
    pulse = 0.3 if slot.level == 0 else 0.0       # keep the beat going under sustained sounds
    return (pulse + slot.salience) * weight * slot.intensity


def _select(slots: list[Slot], profile: Profile) -> np.ndarray:
    chosen = np.zeros(len(slots), dtype=bool)
    allowed = [s for s in slots if s.level <= profile.level and s.active]
    if not allowed:
        return chosen
    division = 4 if any(s.sub == 3 for s in slots) else 3
    step = {0: division, 1: max(1, division // 2), 2: 1}[profile.level]

    def fits(slot: Slot) -> bool:
        gap = max(profile.floor, 0.0)
        k = slot.index - 1
        while k >= 0 and slot.time - slots[k].time < gap - 1e-6:
            if chosen[k]:
                return False
            k -= 1
        k = slot.index + 1
        while k < len(slots) and slots[k].time - slot.time < gap - 1e-6:
            if chosen[k]:
                return False
            k += 1
        run = 1
        k = slot.index - step
        while k >= 0 and chosen[k] and run <= profile.max_run:
            run, k = run + 1, k - step
        k = slot.index + step
        while k < len(slots) and chosen[k] and run <= profile.max_run:
            run, k = run + 1, k + step
        return run <= profile.max_run

    windows: dict[int, list[Slot]] = {}
    for slot in allowed:
        windows.setdefault(slot.measure // 4, []).append(slot)
    for _, group in sorted(windows.items()):
        seconds = sum(s.length for s in slots if s.active and s.measure // 4 == group[0].measure // 4)
        lift = 0.78 + 0.44 * float(np.mean([s.intensity for s in group]) - 0.8) / 0.4
        target = int(round(profile.density * seconds * lift))
        taken = 0
        for slot in sorted(group, key=_score, reverse=True):
            if taken >= target or _score(slot) < 0.2:
                break
            if fits(slot):
                chosen[slot.index] = True
                taken += 1
    return chosen


def _tidy_runs(slots: list[Slot], chosen: np.ndarray, profile: Profile) -> None:
    """Fast chains should begin and end on a half-beat, so they read as
    'do-ko-don' figures. Lone notes on the finest subdivision are dropped."""
    if profile.level < 2:
        return
    i = 0
    while i < len(slots):
        if not chosen[i]:
            i += 1
            continue
        j = i
        while j + 1 < len(slots) and chosen[j + 1]:
            j += 1
        if slots[i].level == 2:
            chosen[i] = False
            i += 1
            continue
        if j > i and slots[j].level == 2:
            chosen[j] = False
        i = j + 1


def _assign_types(slots: list[Slot], chosen: np.ndarray, profile: Profile) -> dict[int, str]:
    picked = [s for s in slots if chosen[s.index]]
    if not picked:
        return {}
    bright = np.array([s.bright for s in picked])
    threshold = float(np.quantile(bright, 1 - profile.ka_ratio))
    kinds = ["ka" if s.bright > threshold and s.bright > 0.35 else "don" for s in picked]

    if profile.name == "easy":
        # Rim hits only answer on beats 2 and 4, like a snare.
        kinds = [k if s.beat_in_measure in (1, 3) else "don" for k, s in zip(kinds, picked)]
    # Remove one-note flickers inside quick passages.
    quick = {"easy": 0.0, "medium": 0.30, "hard": 0.16}[profile.name]
    for i in range(1, len(picked) - 1):
        before = picked[i].time - picked[i - 1].time
        after = picked[i + 1].time - picked[i].time
        if before < quick and after < quick and kinds[i - 1] == kinds[i + 1] != kinds[i]:
            if i >= 2 and kinds[i - 2] != kinds[i - 1]:
                continue                           # keep genuine alternation (don-ka-don-ka)
            kinds[i] = kinds[i - 1]
    return {s.index: k for s, k in zip(picked, kinds)}


def _assign_big(slots: list[Slot], chosen: np.ndarray, kinds: dict[int, str], profile: Profile,
                gogo_starts: set[int]) -> None:
    picked = [s for s in slots if chosen[s.index]]
    if len(picked) < 8:
        return
    strong = float(np.quantile([s.salience for s in picked], 0.9))
    last_measure = -10 ** 6
    times = np.array([s.time for s in picked])
    for i, slot in enumerate(picked):
        if slot.level != 0 or slot.beat_in_measure not in (0, 2):
            continue
        beat = slot.length * (4 if any(s.sub == 3 for s in slots) else 3)
        room = profile.big_gap * beat - 1e-6
        left = slot.time - times[i - 1] if i else 9.0
        right = times[i + 1] - slot.time if i + 1 < len(picked) else 9.0
        opening = slot.measure in gogo_starts and slot.beat_in_measure == 0
        if left < room or right < room:
            continue
        if opening or (slot.salience >= strong and slot.measure - last_measure >= profile.big_every):
            kinds[slot.index] = "bigKa" if kinds[slot.index] == "ka" else "bigDon"
            last_measure = slot.measure


def _holds(slots: list[Slot], chosen: np.ndarray, profile: Profile, gogo: list[tuple[int, int]],
           duration: float) -> list[dict]:
    """Place drumrolls leading into Go-Go Time and balloons right after it."""
    by_measure: dict[int, list[Slot]] = {}
    for slot in slots:
        by_measure.setdefault(slot.measure, []).append(slot)
    holds: list[dict] = []

    def span(measure: int, first_beat: int, beats: int) -> tuple[float, float, float] | None:
        group = [s for s in by_measure.get(measure, []) if s.level == 0]
        if len(group) < BEATS_PER_MEASURE or not all(s.active for s in group):
            return None
        start = group[first_beat]
        beat = group[1].time - group[0].time
        end = start.time + beats * beat - beat / 2
        return (start.time, end, beat) if end < duration - 0.5 else None

    def clear(start: float, end: float, beat: float) -> None:
        # Leave breathing room after the hold: the next note is the following beat.
        for slot in slots:
            if start - 1e-6 <= slot.time <= end + 0.4 * beat:
                chosen[slot.index] = False

    for n, (a, b) in enumerate(gogo[:4]):
        lead = span(a - 1, BEATS_PER_MEASURE - profile.roll_beats, profile.roll_beats) if a >= 1 else None
        if lead and lead[0] > (holds[-1]["end"] if holds else -1) + 0.5:
            clear(*lead)
            holds.append({"time": lead[0], "end": lead[1], "type": "bigRoll" if n % 2 else "roll"})
        if n < 2:
            rest = span(b, 0, 3)
            if rest and rest[0] > (holds[-1]["end"] if holds else -1) + 0.5:
                clear(*rest)
                hits = max(4, int(round((rest[1] - rest[0]) * profile.balloon_rate)))
                holds.append({"time": rest[0], "end": rest[1], "type": "balloon", "hits": hits})
    return holds


def _stars(profile: Profile, notes: list[dict], seconds: float) -> tuple[int, float, float]:
    times = np.array([n["time"] for n in notes if "end" not in n])
    if len(times) == 0 or seconds <= 0:
        return profile.stars[0], 0.0, 0.0
    average = len(times) / seconds
    peak = max(float(np.sum((times >= t) & (times < t + 4.0))) / 4.0 for t in times[:: max(1, len(times) // 200)])
    level = profile.star_base + profile.star_slope * (0.7 * average + 0.3 * peak / 1.5)
    return int(np.clip(round(level), *profile.stars)), average, peak


def generate(features: Features) -> dict:
    """Build the complete chart document for one song."""
    division = detect_feel(features)
    slots = build_slots(features, division)
    energy = measure_energy(features, slots)
    rank = _rank(energy)
    for slot in slots:
        slot.intensity = 0.8 + 0.4 * rank.get(slot.measure, 0.5)
    active_measures = {m: any(s.active for s in slots if s.measure == m) for m in energy}
    gogo = find_gogo(energy, active_measures)
    starts = {a for a, _ in gogo}
    for slot in slots:
        slot.gogo = any(a <= slot.measure < b for a, b in gogo)
    active_seconds = sum(s.length for s in slots if s.active)

    charts = {}
    for name in DIFFICULTIES:
        profile = PROFILES[name]
        chosen = _select(slots, profile)
        _tidy_runs(slots, chosen, profile)
        holds = _holds(slots, chosen, profile, gogo, features.duration)
        kinds = _assign_types(slots, chosen, profile)
        _assign_big(slots, chosen, kinds, profile, starts)
        notes = [{"time": round(s.time, 4), "type": kinds[s.index]} for s in slots if chosen[s.index]]
        notes += [{**h, "time": round(h["time"], 4), "end": round(h["end"], 4)} for h in holds]
        notes.sort(key=lambda n: n["time"])
        stars, average, peak = _stars(profile, notes, active_seconds)
        charts[name] = {
            "stars": stars,
            "notes": notes,
            "stats": {
                "hits": sum(1 for n in notes if "end" not in n),
                "rolls": sum(1 for n in notes if n["type"] in ("roll", "bigRoll")),
                "balloons": sum(1 for n in notes if n["type"] == "balloon"),
                "density": round(average, 2),
                "peakDensity": round(peak, 2),
            },
        }

    bar_times = [round(s.time, 4) for s in slots if s.level == 0 and s.sub == 0 and s.beat_in_measure == 0]
    first = {m: min(s.time for s in slots if s.measure == m) for m in {s.measure for s in slots}}
    last_end = slots[-1].time + slots[-1].length
    sections = [[round(first[a], 4), round(first.get(b, last_end), 4)] for a, b in gogo if a in first]
    return {
        "version": CHART_VERSION,
        "bpm": round(features.bpm, 2),
        "duration": round(features.duration, 3),
        "steadyTempo": features.steady,
        "feel": "shuffle" if division == 3 else "straight",
        "beats": [round(float(t), 4) for t in features.beats],
        "measures": bar_times,
        "gogo": sections,
        "waveform": features.waveform,
        "charts": charts,
        "analysis": "Percussive onset flux, regularised beat grid, band-split don/ka, energy-ranked Go-Go Time",
    }
