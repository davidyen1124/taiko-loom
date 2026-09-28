// On-device analysis, used only when the backend cannot be reached. It follows
// the same plan as backend/src/taiko_backend (beat grid, band-split don / ka,
// loudest section becomes Go-Go Time) with lighter signal processing.

const RATE = 11025;      // target rate after decimation; the real one depends on the file
const HOP = 128;

const PROFILES = {
  easy: { level: 0, density: 1.15, floor: 0.3, maxRun: 16, ka: 0.28, rollBeats: 4, balloonRate: 3, stars: [1, 5], base: 0.5, slope: 2.4 },
  medium: { level: 1, density: 2.05, floor: 0.17, maxRun: 7, ka: 0.38, rollBeats: 3, balloonRate: 4.5, stars: [2, 7], base: 1, slope: 1.9 },
  hard: { level: 2, density: 3.4, floor: 0.095, maxRun: 5, ka: 0.44, rollBeats: 2, balloonRate: 6.5, stars: [3, 8], base: 1.5, slope: 1.5 },
};
const LEVELS = [0, 2, 1, 2];                      // subdivision level of each quarter-beat
const METRIC = [1, 0.85, 0.92, 0.85];             // weight of beats 1, 2, 3, 4
const LEVEL_WEIGHT = [1, 0.62, 0.42];

const round = value => Math.round(value * 10000) / 10000;
const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

function quantile(values, q) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[clamp(Math.floor(q * (sorted.length - 1)), 0, sorted.length - 1)] ?? 0;
}

function envelopes(samples, sampleRate) {
  const step = Math.max(1, Math.round(sampleRate / RATE));
  // 48 kHz audio decimates to 12 kHz, not 11.025 kHz, so measure the frame rate
  const fps = sampleRate / step / HOP;
  const count = Math.floor(samples.length / step / HOP) - 4;
  if (count < fps * 5) throw new Error('Choose a song at least 5 seconds long.');
  const pole = 1 - Math.exp((-2 * Math.PI * 150) / (sampleRate / step));
  const all = new Float32Array(count); const low = new Float32Array(count); const high = new Float32Array(count);
  let smooth = 0; let previous = 0; let peak = 0;
  for (let f = 0; f < count; f++) {
    let a = 0; let l = 0; let h = 0;
    for (let i = 0; i < HOP; i++) {
      const v = samples[(f * HOP + i) * step] || 0;
      smooth += pole * (v - smooth);               // one-pole low-pass at 150 Hz
      const edge = v - previous; previous = v;      // first difference: a crude high-pass
      a += v * v; l += smooth * smooth; h += edge * edge;
    }
    all[f] = Math.sqrt(a / HOP); low[f] = Math.sqrt(l / HOP); high[f] = Math.sqrt(h / HOP);
    peak = Math.max(peak, all[f]);
  }
  if (peak < 1e-4) throw new Error('This audio is silent. Try another file.');
  const flux = band => {
    const out = new Float32Array(count);
    for (let f = 1; f < count; f++) out[f] = Math.max(0, Math.log(1e-4 + band[f]) - Math.log(1e-4 + band[f - 1]));
    return out;
  };
  const env = flux(all); const lowFlux = flux(low); const highFlux = flux(high);
  for (let f = 0; f < count; f++) env[f] = env[f] + 0.5 * lowFlux[f] + 0.5 * highFlux[f];
  return { count, fps, rms: all, env, low: lowFlux, high: highFlux, peak };
}

const sample = (env, time, fps) => {
  const x = time * fps;
  const i = Math.floor(x);
  if (i < 0 || i + 1 >= env.length) return 0;
  return env[i] + (env[i + 1] - env[i]) * (x - i);
};

function findGrid(env, low, duration, fps) {
  // Candidate tempos come from autocorrelation. Each is then judged by
  // laying a comb of beats over the attacks, which rejects 3:2 look-alikes.
  const minLag = Math.floor((fps * 60) / 175);
  const maxLag = Math.ceil((fps * 60) / 85);
  const correlation = [];
  for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
    let sum = 0;
    for (let i = lag; i < env.length; i++) sum += env[i] * env[i - lag];
    correlation.push({ lag, value: sum / (env.length - lag) });
  }
  const peaks = correlation
    .filter((c, i) => i > 0 && i < correlation.length - 1 && c.value >= correlation[i - 1].value && c.value >= correlation[i + 1].value)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  if (!peaks.length || peaks[0].value <= 0) throw new Error('No clear beat found. Try a more rhythmic song.');
  // Fit period and phase for one candidate: a wide pass, then a fine one.
  const fit = lag => {
    let found = { score: -1, period: lag / fps, offset: 0 };
    for (const [span, steps, phases] of [[0.025, 101, 40], [0.0008, 33, 0]]) {
      const centre = { ...found };
      for (let p = 0; p < steps; p++) {
        const period = centre.period * (1 + span * ((p / (steps - 1)) * 2 - 1));
        const count = phases || 25;
        for (let o = 0; o < count; o++) {
          const offset = phases ? (o / count) * period : centre.offset + ((o / (count - 1)) * 2 - 1) * 0.012;
          let sum = 0; let n = 0;
          for (let t = offset; t < duration; t += period) { if (t >= 0) { sum += sample(env, t, fps); n++; } }
          if (sum / Math.max(1, n) > found.score) found = { score: sum / Math.max(1, n), period, offset };
        }
      }
    }
    return found;
  };
  let best = null; let bestScore = -1;
  for (const { lag } of peaks) {
    const found = fit(lag);
    const bpm = 60 / found.period;
    if (bpm < 84 || bpm > 176) continue;
    const prior = Math.exp(-0.5 * (Math.log2(bpm / 120) / 1.1) ** 2);
    const candidate = found.score * Math.sqrt(bpm) * prior;
    if (candidate > bestScore) { bestScore = candidate; best = found; }
  }
  if (!best) throw new Error('No clear beat found. Try a more rhythmic song.');
  let { period, offset } = best;
  // kicks mark the beat: if the off-beats carry more bass, shift half a beat
  let on = 0; let off = 0;
  for (let t = offset; t < duration; t += period) { on += sample(low, t, fps); off += sample(low, t + period / 2, fps); }
  if (off > 1.35 * on) offset += period / 2;
  offset += 0.5 / fps;                              // energy frames are stamped at their start
  offset -= Math.floor(offset / period) * period;
  const beats = [];
  for (let t = offset; t < duration - 0.02; t += period) beats.push(t);
  let downbeat = 0; let strongest = -1;
  for (let phase = 0; phase < 4; phase++) {
    let sum = 0; let n = 0;
    for (let i = phase; i < beats.length; i += 4) { sum += sample(low, beats[i], fps) + 0.5 * sample(env, beats[i], fps); n++; }
    if (n && sum / n > strongest) { strongest = sum / n; downbeat = phase; }
  }
  return { beats, period, downbeat };
}

function buildSlots({ env, low, high, rms, peak, fps }, { beats, period, downbeat }, duration) {
  const reach = Math.max(1, Math.round(0.42 * (period / 4) * fps));
  const local = Math.round(2 * fps);
  const floor = peak * 0.06;
  const slots = [];
  beats.forEach((beat, i) => {
    const number = i - downbeat;
    for (let sub = 0; sub < 4; sub++) {
      const time = beat + (period * sub) / 4;
      const f = clamp(Math.round(time * fps), 0, env.length - 1);
      let strength = 0; let lo = 0; let hi = 0; let reference = 1e-6; let loud = 0;
      for (let k = Math.max(0, f - reach); k <= Math.min(env.length - 1, f + reach); k++) {
        if (env[k] > strength) strength = env[k];
        lo = Math.max(lo, low[k]); hi = Math.max(hi, high[k]);
      }
      for (let k = Math.max(0, f - local); k < Math.min(env.length, f + local); k += 2) reference = Math.max(reference, env[k]);
      for (let k = Math.max(0, f - 10); k < Math.min(rms.length, f + 10); k++) loud = Math.max(loud, rms[k]);
      slots.push({
        index: slots.length, time, length: period / 4, sub, level: LEVELS[sub],
        measure: Math.floor(number / 4), beatInMeasure: ((number % 4) + 4) % 4,
        salience: clamp(strength / (reference * 0.75 + 0.05), 0, 2),
        bright: hi / (lo + hi + 1e-6),
        active: loud > floor && time >= 0.4 && time <= duration - 0.6,
        intensity: 1,
      });
    }
  });
  return slots;
}

function measureLoudness(slots, rms, fps) {
  const spans = new Map();
  for (const slot of slots) {
    const span = spans.get(slot.measure) || [slot.time, slot.time];
    span[1] = slot.time + slot.length;
    spans.set(slot.measure, span);
  }
  const numbers = [...spans.keys()].sort((a, b) => a - b);
  const level = numbers.map(m => {
    const [a, b] = spans.get(m).map(t => clamp(Math.round(t * fps), 0, rms.length - 1));
    let sum = 0;
    for (let f = a; f <= b; f++) sum += rms[f] * rms[f];
    return 10 * Math.log10(1e-9 + sum / Math.max(1, b - a + 1));
  });
  const smooth = level.map((v, i) => 0.2 * (level[i - 1] ?? v) + 0.6 * v + 0.2 * (level[i + 1] ?? v));
  const order = [...smooth].sort((a, b) => a - b);
  const energy = new Map(); const rank = new Map();
  numbers.forEach((m, i) => { energy.set(m, smooth[i]); rank.set(m, order.indexOf(smooth[i]) / Math.max(1, order.length - 1)); });
  return { numbers, energy, rank, spans };
}

function findGogo({ numbers, energy }, slots) {
  const usable = numbers.filter(m => m >= 0);
  if (usable.length < 8) return [];
  const values = usable.map(m => energy.get(m));
  const threshold = Math.max(quantile(values, 0.62), Math.max(...values) - 6);
  const active = new Set(slots.filter(s => s.active).map(s => s.measure));
  const sections = [];
  let start = null;
  for (const m of [...usable, usable.at(-1) + 1]) {
    const hot = energy.get(m) >= threshold && active.has(m);
    if (hot && start === null) start = m + (((-m % 2) + 2) % 2);
    if (!hot && start !== null) {
      for (let a = start; m - a >= 4; a += 16) sections.push([a, a + Math.min(16, Math.floor((m - a) / 4) * 4)]);
      start = null;
    }
  }
  const mean = ([a, b]) => { let s = 0; for (let m = a; m < b; m++) s += energy.get(m) ?? -99; return s / (b - a); };
  sections.sort((x, y) => mean(y) - mean(x));
  const kept = []; let used = 0;
  for (const section of sections) {
    if (!kept.length || used + section[1] - section[0] <= 0.4 * usable.length) { kept.push(section); used += section[1] - section[0]; }
  }
  return kept.sort((x, y) => x[0] - y[0]);
}

const score = slot => ((slot.level === 0 ? 0.3 : 0) + slot.salience)
  * (slot.level === 0 ? METRIC[slot.beatInMeasure] : LEVEL_WEIGHT[slot.level]) * slot.intensity;

function select(slots, profile) {
  const chosen = new Uint8Array(slots.length);
  const step = [4, 2, 1][profile.level];
  const fits = slot => {
    for (let k = slot.index - 1; k >= 0 && slot.time - slots[k].time < profile.floor - 1e-6; k--) if (chosen[k]) return false;
    for (let k = slot.index + 1; k < slots.length && slots[k].time - slot.time < profile.floor - 1e-6; k++) if (chosen[k]) return false;
    let run = 1;
    for (let k = slot.index - step; k >= 0 && chosen[k] && run <= profile.maxRun; k -= step) run++;
    for (let k = slot.index + step; k < slots.length && chosen[k] && run <= profile.maxRun; k += step) run++;
    return run <= profile.maxRun;
  };
  const windows = new Map();
  for (const slot of slots) {
    const key = Math.floor(slot.measure / 4);
    if (!windows.has(key)) windows.set(key, { allowed: [], seconds: 0, intensity: 0, n: 0 });
    const group = windows.get(key);
    if (slot.active) { group.seconds += slot.length; group.intensity += slot.intensity; group.n++; }
    if (slot.active && slot.level <= profile.level) group.allowed.push(slot);
  }
  for (const group of [...windows.entries()].sort((a, b) => a[0] - b[0]).map(entry => entry[1])) {
    const lift = 0.78 + (0.44 * (group.intensity / Math.max(1, group.n) - 0.8)) / 0.4;
    const target = Math.round(profile.density * group.seconds * lift);
    let taken = 0;
    for (const slot of group.allowed.sort((a, b) => score(b) - score(a))) {
      if (taken >= target || score(slot) < 0.2) break;
      if (fits(slot)) { chosen[slot.index] = 1; taken++; }
    }
  }
  if (profile.level === 2) {                      // quick chains start and end on a half-beat
    for (let i = 0; i < slots.length; i++) {
      if (!chosen[i]) continue;
      let j = i;
      while (j + 1 < slots.length && chosen[j + 1]) j++;
      if (slots[i].level === 2) { chosen[i] = 0; continue; }
      if (j > i && slots[j].level === 2) chosen[j] = 0;
      i = j;
    }
  }
  return chosen;
}

function holds(slots, chosen, profile, gogo, duration) {
  const byMeasure = new Map();
  for (const slot of slots) {
    if (slot.level !== 0) continue;
    if (!byMeasure.has(slot.measure)) byMeasure.set(slot.measure, []);
    byMeasure.get(slot.measure).push(slot);
  }
  const out = [];
  const span = (measure, first, beats) => {
    const group = byMeasure.get(measure);
    if (!group || group.length < 4 || !group.every(s => s.active)) return null;
    const beat = group[1].time - group[0].time;
    const end = group[first].time + beats * beat - beat / 2;
    return end < duration - 0.5 ? { time: group[first].time, end, beat } : null;
  };
  const place = (hold, extra) => {
    if (!hold || hold.time <= (out.at(-1)?.end ?? -1) + 0.5) return;
    for (const slot of slots) if (slot.time >= hold.time - 1e-6 && slot.time <= hold.end + 0.4 * hold.beat) chosen[slot.index] = 0;
    out.push({ time: round(hold.time), end: round(hold.end), ...extra(hold) });
  };
  gogo.slice(0, 4).forEach(([a, b], n) => {
    if (a >= 1) place(span(a - 1, 4 - profile.rollBeats, profile.rollBeats), () => ({ type: n % 2 ? 'bigRoll' : 'roll' }));
    if (n < 2) place(span(b, 0, 3), hold => ({ type: 'balloon', hits: Math.max(4, Math.round((hold.end - hold.time) * profile.balloonRate)) }));
  });
  return out;
}

function chart(slots, profile, gogo, duration, activeSeconds) {
  const chosen = select(slots, profile);
  const held = holds(slots, chosen, profile, gogo, duration);
  const picked = slots.filter(s => chosen[s.index]);
  const cut = quantile(picked.map(s => s.bright), 1 - profile.ka);
  const kinds = picked.map(s => {
    const ka = s.bright > cut && s.bright > 0.35;
    return ka && (profile.level > 0 || s.beatInMeasure % 2 === 1) ? 'ka' : 'don';
  });
  const strong = quantile(picked.map(s => s.salience), 0.9);
  const starts = new Set(gogo.map(([a]) => a));
  let lastBig = -1e6;
  picked.forEach((slot, i) => {
    if (slot.level !== 0 || slot.beatInMeasure % 2) return;
    const room = (profile.level === 2 ? 0.5 : 1) * slot.length * 4 - 1e-6;
    const left = i ? slot.time - picked[i - 1].time : 9;
    const right = i + 1 < picked.length ? picked[i + 1].time - slot.time : 9;
    if (left < room || right < room) return;
    const opening = starts.has(slot.measure) && slot.beatInMeasure === 0;
    if (opening || (slot.salience >= strong && slot.measure - lastBig >= [4, 3, 2][profile.level])) {
      kinds[i] = kinds[i] === 'ka' ? 'bigKa' : 'bigDon';
      lastBig = slot.measure;
    }
  });
  const notes = [...picked.map((s, i) => ({ time: round(s.time), type: kinds[i] })), ...held].sort((a, b) => a.time - b.time);
  const hits = picked.length;
  const density = activeSeconds ? hits / activeSeconds : 0;
  return {
    stars: clamp(Math.round(profile.base + profile.slope * density), ...profile.stars),
    notes,
    stats: {
      hits, rolls: held.filter(h => h.type !== 'balloon').length, balloons: held.filter(h => h.type === 'balloon').length,
      density: Math.round(density * 100) / 100,
    },
  };
}

export function analyze(samples, sampleRate, { title = 'Untitled', artist = 'Unknown artist' } = {}) {
  const duration = samples.length / sampleRate;
  if (duration > 15 * 60) throw new Error('Choose a song shorter than 15 minutes.');
  const bands = envelopes(samples, sampleRate);
  const grid = findGrid(bands.env, bands.low, duration, bands.fps);
  if (grid.beats.length < 8) throw new Error('No clear beat found. Try a more rhythmic song.');
  const slots = buildSlots(bands, grid, duration);
  const loudness = measureLoudness(slots, bands.rms, bands.fps);
  for (const slot of slots) slot.intensity = 0.8 + 0.4 * (loudness.rank.get(slot.measure) ?? 0.5);
  const gogo = findGogo(loudness, slots);
  const activeSeconds = slots.reduce((sum, s) => sum + (s.active ? s.length : 0), 0);
  const charts = {};
  for (const name of ['easy', 'medium', 'hard']) charts[name] = chart(slots, PROFILES[name], gogo, duration, activeSeconds);
  if (charts.medium.stats.hits < 8) throw new Error('No clear beat found. Try a more rhythmic song.');

  const first = m => loudness.spans.get(m)?.[0];
  const waveform = Array.from({ length: 180 }, (_, i) => {
    const f = clamp(Math.floor((i / 180) * bands.count), 0, bands.count - 1);
    return Math.round((bands.rms[f] / bands.peak) * 1000) / 1000;
  });
  let hash = 0;
  for (let i = 0; i < samples.length; i += 997) hash = (hash * 31 + Math.round(samples[i] * 32767)) | 0;
  return {
    version: 2,
    id: `device-${(hash >>> 0).toString(16).padStart(8, '0')}-${samples.length.toString(16)}`,
    source: 'device',
    title, artist,
    bpm: Math.round((60 / grid.period) * 100) / 100,
    duration: Math.round(duration * 1000) / 1000,
    steadyTempo: true,
    feel: 'straight',
    beats: grid.beats.map(round),
    measures: slots.filter(s => s.sub === 0 && s.beatInMeasure === 0).map(s => round(s.time)),
    gogo: gogo.filter(([a]) => first(a) !== undefined).map(([a, b]) => [round(first(a)), round(first(b) ?? duration)]),
    waveform,
    charts,
    analysis: 'On-device energy flux and comb-filter beat grid',
  };
}
