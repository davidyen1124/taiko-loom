// Turns audio features into Easy / Medium / Hard charts.
//
// This is a port of backend/src/taiko_backend/charting.py, kept function for
// function so the browser and the server write the same kind of chart. If you
// change one, change the other.
//
// The generator works on a musical grid, the way a chart author would: notes
// sit on beats and subdivisions, each difficulty is allowed a finer
// subdivision than the one before, and the loudest sections become Go-Go Time.

export const CHART_VERSION = 2;
export const DIFFICULTIES = ['easy', 'medium', 'hard'];
const BEATS_PER_MEASURE = 4;

// level: finest subdivision allowed (0 beat, 1 half-beat, 2 quarter-beat)
// density: target notes per second while the music is active
// floor: never place notes closer than this many seconds
// maxRun: longest chain at the tightest spacing
// bigGap: a big note needs this many beats of room on both sides
// bigEvery: at most one big note per this many measures
export const PROFILES = {
  easy: { name: 'easy', level: 0, density: 1.15, floor: 0.30, maxRun: 16, kaRatio: 0.28, bigGap: 1, bigEvery: 4, rollBeats: 4, balloonRate: 3.0, stars: [1, 5], starBase: 0.5, starSlope: 2.4 },
  medium: { name: 'medium', level: 1, density: 2.05, floor: 0.17, maxRun: 7, kaRatio: 0.38, bigGap: 1, bigEvery: 3, rollBeats: 3, balloonRate: 4.5, stars: [2, 7], starBase: 1.0, starSlope: 1.9 },
  hard: { name: 'hard', level: 2, density: 3.40, floor: 0.095, maxRun: 5, kaRatio: 0.44, bigGap: 0.5, bigEvery: 2, rollBeats: 2, balloonRate: 6.5, stars: [3, 8], starBase: 1.5, starSlope: 1.5 },
};

const LEVELS = { 4: [0, 2, 1, 2], 3: [0, 2, 1] };
const METRIC = [1.0, 0.85, 0.92, 0.85];           // weight of beats 1, 2, 3, 4
const LEVEL_WEIGHT = [1.0, 0.62, 0.42];

const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));
const mean = values => values.reduce((sum, v) => sum + v, 0) / (values.length || 1);
const floorDiv = (a, b) => Math.floor(a / b);
const mod = (a, b) => ((a % b) + b) % b;

// Rounds halves to the even neighbour, as Python does, so both generators
// make the same choice on the rare exact half.
export function roundEven(value, digits = 0) {
  const scale = 10 ** digits;
  const scaled = value * scale;
  const floor = Math.floor(scaled);
  const diff = scaled - floor;
  let rounded;
  if (Math.abs(diff - 0.5) < 1e-9) rounded = floor % 2 === 0 ? floor : floor + 1;
  else rounded = Math.round(scaled);
  return rounded / scale;
}

// Linear-interpolated quantile, matching numpy's default.
export function quantile(values, q) {
  if (!values.length) return 0;
  const sorted = Float64Array.from(values).sort();
  const at = clamp(q, 0, 1) * (sorted.length - 1);
  const lo = Math.floor(at);
  const hi = Math.min(sorted.length - 1, lo + 1);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (at - lo);
}

function maxIn(values, from, to) {
  let best = -Infinity;
  for (let i = Math.max(0, from); i < Math.min(values.length, to); i++) if (values[i] > best) best = values[i];
  return best === -Infinity ? 0 : best;
}

// 3 for shuffle / triplet songs, otherwise 4 subdivisions per beat.
export function detectFeel(features) {
  const { beats, onsets, onsetStrength } = features;
  if (beats.length < 8 || onsets.length < 16) return 4;
  let straight = 0;
  let triplet = 0;
  let b = 0;
  for (let i = 0; i < onsets.length; i++) {
    while (b + 1 < beats.length - 1 && beats[b + 1] <= onsets[i]) b++;
    const phase = (onsets[i] - beats[b]) / (beats[b + 1] - beats[b]);
    if (phase < 0 || phase >= 1) continue;
    const near = targets => Math.min(...targets.map(t => Math.abs(phase - t))) < 0.055;
    if (near([0.25, 0.5, 0.75])) straight += onsetStrength[i];
    if (near([1 / 3, 2 / 3])) triplet += onsetStrength[i];
  }
  return triplet > 1.25 * straight ? 3 : 4;
}

export function buildSlots(features, division) {
  const { beats, downbeat, onsets, onsetStrength, low, high, rms, rmsFloor, duration } = features;
  const levels = LEVELS[division];
  const slots = [];
  for (let i = 0; i < beats.length; i++) {
    const length = i + 1 < beats.length ? beats[i + 1] - beats[i] : beats[i] - beats[i - 1];
    const number = i - downbeat;
    for (let sub = 0; sub < division; sub++) {
      slots.push({
        index: slots.length, time: beats[i] + (length * sub) / division, length: length / division,
        beat: number, sub, level: levels[sub],
        measure: floorDiv(number, BEATS_PER_MEASURE), beatInMeasure: mod(number, BEATS_PER_MEASURE),
        salience: 0, bright: 0, active: false, intensity: 1, gogo: false,
      });
    }
  }
  if (!slots.length) return slots;

  // give every detected attack to the single slot it is closest to
  let k = 1;
  for (let i = 0; i < onsets.length; i++) {
    while (k < slots.length - 1 && slots[k].time < onsets[i]) k++;
    const nearest = onsets[i] - slots[k - 1].time < slots[k].time - onsets[i] ? k - 1 : k;
    const slot = slots[nearest];
    if (Math.abs(onsets[i] - slot.time) <= 0.42 * slot.length) slot.salience = Math.max(slot.salience, onsetStrength[i]);
  }

  const lowScale = quantile(low, 0.95) + 1e-9;
  const highScale = quantile(high, 0.95) + 1e-9;
  const reach = Math.max(1, Math.round(0.03 * features.fps));
  const quiet = Math.max(2, Math.round(0.12 * features.fps));
  for (const slot of slots) {
    const f = features.frame(slot.time);
    const lo = maxIn(low, f - reach, f + reach + 1) / lowScale;
    const hi = maxIn(high, f - reach, f + reach + 1) / highScale;
    slot.bright = hi / (lo + hi + 1e-6);
    const loud = maxIn(rms, f - quiet, f + quiet + 1);
    slot.active = loud > rmsFloor && slot.time >= 0.4 && slot.time <= duration - 0.6;
  }
  return slots;
}

// Loudness of each measure in decibels, lightly smoothed.
export function measureEnergy(features, slots) {
  const spans = new Map();
  for (const slot of slots) {
    const span = spans.get(slot.measure) || [slot.time, slot.time];
    span[1] = slot.time + slot.length;
    spans.set(slot.measure, span);
  }
  const numbers = [...spans.keys()].sort((a, b) => a - b);
  const levels = numbers.map(m => {
    const a = features.frame(spans.get(m)[0]);
    const b = Math.max(features.frame(spans.get(m)[1]), a + 1);
    let sum = 0;
    for (let f = a; f < b; f++) sum += features.rms[f] ** 2;
    return Math.sqrt(sum / (b - a));
  });
  let values = levels.map(v => 20 * Math.log10(Math.max(v, 1e-6)));
  const top = Math.max(...values);
  values = values.map(v => Math.max(v, top - 40));
  if (values.length >= 3) {
    values = values.map((v, i) => 0.2 * (values[i - 1] ?? v) + 0.6 * v + 0.2 * (values[i + 1] ?? v));
  }
  const energy = new Map();
  numbers.forEach((m, i) => energy.set(m, values[i]));
  return { energy, spans, numbers };
}

function rank(energy) {
  const numbers = [...energy.keys()].sort((a, b) => a - b);
  const order = numbers.map(m => energy.get(m)).map((v, i) => [v, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const ranks = new Map();
  order.forEach(([, i], position) => ranks.set(numbers[i], position / Math.max(1, numbers.length - 1)));
  return ranks;
}

// Splits measures into quiet and loud. Songs with a clear verse / chorus
// contrast split at the gap between them (Otsu); flat songs fall back to their
// top third.
export function loudThreshold(values) {
  const candidates = [...new Set(values)].sort((a, b) => a - b);
  let best = quantile(values, 0.7);
  let bestScore = 0;
  for (let i = 0; i + 1 < candidates.length; i++) {
    const cut = (candidates[i] + candidates[i + 1]) / 2;
    const quiet = values.filter(v => v < cut);
    const loud = values.filter(v => v >= cut);
    const score = quiet.length * loud.length * (mean(loud) - mean(quiet)) ** 2;
    if (score > bestScore) { best = cut; bestScore = score; }
  }
  const quiet = values.filter(v => v < best);
  const loud = values.filter(v => v >= best);
  if (!quiet.length || mean(loud) - mean(quiet) < 1.5) return quantile(values, 0.7);
  return Math.max(best, quantile(values, 0.45));
}

// Picks the loudest stretches of whole measures. Returns [start, end) pairs.
export function findGogo(energy, active) {
  const numbers = [...energy.keys()].filter(m => m >= 0).sort((a, b) => a - b);
  if (numbers.length < 8) return [];
  const threshold = loudThreshold(numbers.map(m => energy.get(m)));
  const hot = new Map(numbers.map(m => [m, energy.get(m) >= threshold && Boolean(active.get(m))]));
  for (const m of numbers.slice(1, -1)) {           // bridge single-measure dips
    if (!hot.get(m) && hot.get(m - 1) && hot.get(m + 1) && active.get(m)) hot.set(m, true);
  }
  const runs = [];
  let start = null;
  for (const m of [...numbers, numbers.at(-1) + 1]) {
    if (hot.get(m)) { if (start === null) start = m; } else if (start !== null) { runs.push([start, m]); start = null; }
  }
  let sections = [];
  for (let [a, b] of runs) {
    a += mod(-a, 2);                                 // phrases start on even measures
    while (b - a >= 4) {
      const length = Math.min(16, floorDiv(b - a, 4) * 4);
      sections.push([a, a + length]);
      a += length;
    }
  }
  const total = (from, to) => { let s = 0; for (let m = from; m < to; m++) s += energy.get(m) ?? 0; return s; };
  if (!sections.length) {
    const window = Math.min(8, floorDiv(floorDiv(numbers.length, 2), 4) * 4);
    if (window < 4) return [];
    let best = numbers[0];
    for (let s = numbers[0]; s < numbers.at(-1) - window + 2; s++) if (total(s, s + window) > total(best, best + window)) best = s;
    sections = [[best, best + window]];
  }
  const average = ([a, b]) => total(a, b) / (b - a);
  const budget = 0.4 * numbers.length;
  sections = sections.map((s, i) => [s, i]).sort((x, y) => average(y[0]) - average(x[0]) || x[1] - y[1]).map(x => x[0]);
  const kept = [];
  let used = 0;
  for (const section of sections) {
    if (used + section[1] - section[0] <= budget || !kept.length) { kept.push(section); used += section[1] - section[0]; }
  }
  const merged = [];
  for (const [a, b] of kept.sort((x, y) => x[0] - y[0] || x[1] - y[1])) {
    const last = merged.at(-1);
    if (last && a === last[1] && b - last[0] <= 16) last[1] = b; else merged.push([a, b]);
  }
  return merged;
}

const score = slot => {
  const weight = slot.level === 0 ? METRIC[slot.beatInMeasure] : LEVEL_WEIGHT[slot.level];
  const pulse = slot.level === 0 ? 0.3 : 0;         // keep the beat going under sustained sounds
  return (pulse + slot.salience) * weight * slot.intensity;
};

function select(slots, profile, division) {
  const chosen = new Uint8Array(slots.length);
  const allowed = slots.filter(s => s.level <= profile.level && s.active);
  if (!allowed.length) return chosen;
  const step = [division, Math.max(1, floorDiv(division, 2)), 1][profile.level];

  const fits = slot => {
    for (let k = slot.index - 1; k >= 0 && slot.time - slots[k].time < profile.floor - 1e-6; k--) if (chosen[k]) return false;
    for (let k = slot.index + 1; k < slots.length && slots[k].time - slot.time < profile.floor - 1e-6; k++) if (chosen[k]) return false;
    let run = 1;
    for (let k = slot.index - step; k >= 0 && chosen[k] && run <= profile.maxRun; k -= step) run++;
    for (let k = slot.index + step; k < slots.length && chosen[k] && run <= profile.maxRun; k += step) run++;
    return run <= profile.maxRun;
  };

  const seconds = new Map();
  for (const slot of slots) {
    if (slot.active) seconds.set(floorDiv(slot.measure, 4), (seconds.get(floorDiv(slot.measure, 4)) || 0) + slot.length);
  }
  const windows = new Map();
  for (const slot of allowed) {
    const key = floorDiv(slot.measure, 4);
    if (!windows.has(key)) windows.set(key, []);
    windows.get(key).push(slot);
  }
  for (const key of [...windows.keys()].sort((a, b) => a - b)) {
    const group = windows.get(key);
    const lift = 0.78 + (0.44 * (mean(group.map(s => s.intensity)) - 0.8)) / 0.4;
    const target = roundEven(profile.density * (seconds.get(key) || 0) * lift);
    let taken = 0;
    for (const slot of [...group].sort((a, b) => score(b) - score(a))) {
      if (taken >= target || score(slot) < 0.2) break;
      if (fits(slot)) { chosen[slot.index] = 1; taken++; }
    }
  }
  return chosen;
}

// Fast chains should begin and end on a half-beat, so they read as
// 'do-ko-don' figures. Lone notes on the finest subdivision are dropped.
function tidyRuns(slots, chosen, profile) {
  if (profile.level < 2) return;
  let i = 0;
  while (i < slots.length) {
    if (!chosen[i]) { i++; continue; }
    let j = i;
    while (j + 1 < slots.length && chosen[j + 1]) j++;
    if (slots[i].level === 2) { chosen[i] = 0; i++; continue; }
    if (j > i && slots[j].level === 2) chosen[j] = 0;
    i = j + 1;
  }
}

function assignTypes(slots, chosen, profile) {
  const picked = slots.filter(s => chosen[s.index]);
  const kinds = new Map();
  if (!picked.length) return kinds;
  const threshold = quantile(picked.map(s => s.bright), 1 - profile.kaRatio);
  let list = picked.map(s => (s.bright > threshold && s.bright > 0.35 ? 'ka' : 'don'));
  // on Easy, rim hits only answer on beats 2 and 4, like a snare
  if (profile.name === 'easy') list = list.map((kind, i) => (picked[i].beatInMeasure % 2 === 1 ? kind : 'don'));
  // remove one-note flickers inside quick passages
  const quick = { easy: 0, medium: 0.30, hard: 0.16 }[profile.name];
  for (let i = 1; i < picked.length - 1; i++) {
    const before = picked[i].time - picked[i - 1].time;
    const after = picked[i + 1].time - picked[i].time;
    if (before < quick && after < quick && list[i - 1] === list[i + 1] && list[i] !== list[i - 1]) {
      if (i >= 2 && list[i - 2] !== list[i - 1]) continue;   // keep genuine alternation
      list[i] = list[i - 1];
    }
  }
  picked.forEach((s, i) => kinds.set(s.index, list[i]));
  return kinds;
}

function assignBig(slots, chosen, kinds, profile, gogoStarts, division) {
  const picked = slots.filter(s => chosen[s.index]);
  if (picked.length < 8) return;
  const strong = quantile(picked.map(s => s.salience), 0.9);
  let lastMeasure = -1e6;
  picked.forEach((slot, i) => {
    if (slot.level !== 0 || (slot.beatInMeasure !== 0 && slot.beatInMeasure !== 2)) return;
    const beat = slot.length * division;
    const room = profile.bigGap * beat - 1e-6;
    const left = i ? slot.time - picked[i - 1].time : 9;
    const right = i + 1 < picked.length ? picked[i + 1].time - slot.time : 9;
    if (left < room || right < room) return;
    const opening = gogoStarts.has(slot.measure) && slot.beatInMeasure === 0;
    if (opening || (slot.salience >= strong && slot.measure - lastMeasure >= profile.bigEvery)) {
      kinds.set(slot.index, kinds.get(slot.index) === 'ka' ? 'bigKa' : 'bigDon');
      lastMeasure = slot.measure;
    }
  });
}

// Places drumrolls leading into Go-Go Time and balloons right after it.
function placeHolds(slots, chosen, profile, gogo, duration) {
  const byMeasure = new Map();
  for (const slot of slots) {
    if (slot.level !== 0) continue;
    if (!byMeasure.has(slot.measure)) byMeasure.set(slot.measure, []);
    byMeasure.get(slot.measure).push(slot);
  }
  const holds = [];
  const span = (measure, firstBeat, beats) => {
    const group = byMeasure.get(measure);
    if (!group || group.length < BEATS_PER_MEASURE || !group.every(s => s.active)) return null;
    const beat = group[1].time - group[0].time;
    const end = group[firstBeat].time + beats * beat - beat / 2;
    return end < duration - 0.5 ? { time: group[firstBeat].time, end, beat } : null;
  };
  const free = hold => hold && hold.time > (holds.length ? holds.at(-1).end : -1) + 0.5;
  const clear = hold => {
    // leave breathing room after the hold: the next note is the following beat
    for (const slot of slots) if (slot.time >= hold.time - 1e-6 && slot.time <= hold.end + 0.4 * hold.beat) chosen[slot.index] = 0;
  };
  gogo.slice(0, 4).forEach(([a, b], n) => {
    const lead = a >= 1 ? span(a - 1, BEATS_PER_MEASURE - profile.rollBeats, profile.rollBeats) : null;
    if (free(lead)) {
      clear(lead);
      holds.push({ time: lead.time, end: lead.end, type: n % 2 ? 'bigRoll' : 'roll' });
    }
    if (n < 2) {
      const rest = span(b, 0, 3);
      if (free(rest)) {
        clear(rest);
        holds.push({ time: rest.time, end: rest.end, type: 'balloon', hits: Math.max(4, roundEven((rest.end - rest.time) * profile.balloonRate)) });
      }
    }
  });
  return holds;
}

function rate(profile, notes, seconds) {
  const times = notes.filter(n => n.end === undefined).map(n => n.time);
  if (!times.length || seconds <= 0) return { stars: profile.stars[0], average: 0, peak: 0 };
  const average = times.length / seconds;
  let peak = 0;
  const stride = Math.max(1, floorDiv(times.length, 200));
  for (let i = 0; i < times.length; i += stride) {
    let count = 0;
    for (const t of times) if (t >= times[i] && t < times[i] + 4) count++;
    peak = Math.max(peak, count / 4);
  }
  const level = profile.starBase + profile.starSlope * (0.7 * average + (0.3 * peak) / 1.5);
  return { stars: clamp(roundEven(level), ...profile.stars), average, peak };
}

// Builds the complete chart document for one song.
export function generate(features) {
  const division = detectFeel(features);
  const slots = buildSlots(features, division);
  const { energy, spans } = measureEnergy(features, slots);
  const ranks = rank(energy);
  for (const slot of slots) slot.intensity = 0.8 + 0.4 * (ranks.get(slot.measure) ?? 0.5);
  const active = new Map();
  for (const slot of slots) active.set(slot.measure, active.get(slot.measure) || slot.active);
  const gogo = findGogo(energy, active);
  const starts = new Set(gogo.map(([a]) => a));
  const activeSeconds = slots.reduce((sum, s) => sum + (s.active ? s.length : 0), 0);

  const charts = {};
  for (const name of DIFFICULTIES) {
    const profile = PROFILES[name];
    const chosen = select(slots, profile, division);
    tidyRuns(slots, chosen, profile);
    const holds = placeHolds(slots, chosen, profile, gogo, features.duration);
    const kinds = assignTypes(slots, chosen, profile);
    assignBig(slots, chosen, kinds, profile, starts, division);
    const notes = [
      ...slots.filter(s => chosen[s.index]).map(s => ({ time: roundEven(s.time, 4), type: kinds.get(s.index) })),
      ...holds.map(h => ({ ...h, time: roundEven(h.time, 4), end: roundEven(h.end, 4) })),
    ].sort((a, b) => a.time - b.time);
    const { stars, average, peak } = rate(profile, notes, activeSeconds);
    charts[name] = {
      stars,
      notes,
      stats: {
        hits: notes.filter(n => n.end === undefined).length,
        rolls: notes.filter(n => n.type === 'roll' || n.type === 'bigRoll').length,
        balloons: notes.filter(n => n.type === 'balloon').length,
        density: roundEven(average, 2),
        peakDensity: roundEven(peak, 2),
      },
    };
  }

  const last = slots.at(-1);
  const lastEnd = last ? last.time + last.length : features.duration;
  return {
    version: CHART_VERSION,
    bpm: roundEven(features.bpm, 2),
    duration: roundEven(features.duration, 3),
    steadyTempo: features.steady,
    feel: division === 3 ? 'shuffle' : 'straight',
    beats: Array.from(features.beats, t => roundEven(t, 4)),
    measures: slots.filter(s => s.level === 0 && s.sub === 0 && s.beatInMeasure === 0).map(s => roundEven(s.time, 4)),
    gogo: gogo.filter(([a]) => spans.has(a)).map(([a, b]) => [roundEven(spans.get(a)[0], 4), roundEven(spans.has(b) ? spans.get(b)[0] : lastEnd, 4)]),
    waveform: features.waveform,
    charts,
  };
}
