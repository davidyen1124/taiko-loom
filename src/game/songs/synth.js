// The band: every instrument of the built-in songs, synthesised sample by
// sample in plain JavaScript. Nothing is sampled or recorded, so the repo
// carries no audio files, and because no browser audio API is involved a song
// renders the same everywhere: in a worker, in any browser, and in the tests.
import { holdLength, isHold, layout, timing } from './score.js';

export const RATE = 44100;
const TAU = 2 * Math.PI;
const SILENT = 0.0001;
const CENT = Math.LN2 / 1200;          // one cent as a fraction of frequency
const LONGEST = 4;                     // seconds; no single voice rings longer
const PEAK = 0.92;                     // the ceiling no sample goes over
const DRIVE = 2;                       // how far the mix is pushed into the limiter

const SEMITONES = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

// 'A4' -> 440, 'Bb3' -> 233.08
export function pitch(name) {
  const [, letter, accidental, octave] = /^([A-G])([#b]?)(\d)$/.exec(name);
  const semitones = SEMITONES[letter] + { '#': 1, b: -1, '': 0 }[accidental] + (Number(octave) - 4) * 12;
  return 440 * 2 ** (semitones / 12);
}

// [level, pan] of each section of the band
const BUSES = {
  drums: [1, 0], rim: [0.75, 0.25], bell: [0.3, -0.35], shaker: [0.22, 0.3],
  flute: [0.42, 0.12], koto: [0.5, 0.1], shamisen: [0.4, 0.14],
  string: [0.28, -0.22], chime: [0.2, -0.4], pad: [0.16, 0], bass: [0.5, 0],
};

const NOISE = new Float32Array(RATE);
for (let i = 0, seed = 1234567; i < NOISE.length; i++) {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  NOISE[i] = seed / 2147483648 - 1;
}

// ---- building blocks -----------------------------------------------------

// Rounds off the jump in a sawtooth or square wave, which would otherwise
// fold back into the audible range as a harsh whistle (polyBLEP).
function blep(phase, step) {
  if (phase < step) { const x = phase / step; return x + x - x * x - 1; }
  if (phase > 1 - step) { const x = (phase - 1) / step; return x * x + x + x + 1; }
  return 0;
}

const SHAPES = {
  sine: phase => Math.sin(TAU * phase),
  triangle: phase => (phase < 0.25 ? 4 * phase : phase < 0.75 ? 2 - 4 * phase : 4 * phase - 4),
  sawtooth: (phase, step) => 2 * phase - 1 - blep(phase, step),
  square: (phase, step) => (phase < 0.5 ? 1 : -1) + blep(phase, step) - blep((phase + 0.5) % 1, step),
};

// Adds an oscillator to `out`. `bend` moves the pitch:
//   { to, seconds }        glide to another frequency
//   { cents, seconds }     start sharp and settle, like a plucked string
//   { vibrato, rise }      a wobble of so many cents that fades in
function tone(out, n, shape, hz, level = 1, bend = {}) {
  const wave = SHAPES[shape];
  const glide = bend.to ? Math.round(bend.seconds * RATE) : 0;
  const ratio = glide ? (bend.to / hz) ** (1 / glide) : 1;
  const settle = bend.cents ? Math.round(bend.seconds * RATE) : 0;
  const calm = settle ? (0.01 / bend.cents) ** (1 / settle) : 1;
  const rise = bend.vibrato ? Math.max(1, bend.rise * RATE) : 0;
  let frequency = hz;
  let sharp = bend.cents || 0;
  let phase = 0;
  for (let i = 0; i < n; i++) {
    let step = frequency / RATE;
    if (i < settle) { step *= 1 + sharp * CENT; sharp *= calm; }
    if (rise) step *= 1 + bend.vibrato * Math.min(1, i / rise) * Math.sin((TAU * 5.6 * i) / RATE) * CENT;
    out[i] += level * wave(phase, step);
    phase += step;
    if (phase >= 1) phase -= 1;
    if (i < glide) frequency *= ratio;
  }
}

function hiss(out, n, at) {
  let k = Math.floor(((at * 7.3) % 1) * RATE);
  for (let i = 0; i < n; i++) {
    out[i] = NOISE[k];
    if (++k >= RATE) k = 0;
  }
}

// A struck sound: up to `peak` in `attack` seconds, then dying away to
// silence at `length`.
function strike(out, n, attack, peak, length) {
  const rise = Math.max(1, Math.round(attack * RATE));
  const fall = (SILENT / peak) ** (1 / Math.max(1, (length - attack) * RATE));
  let gain = peak;
  for (let i = 0; i < n; i++) {
    if (i < rise) out[i] *= SILENT + (peak - SILENT) * (i / rise);
    else { out[i] *= gain; gain *= fall; }
  }
}

// A held sound: up to `peak`, easing to `hold` until `release`, then gone by `end`.
function sustain(out, n, attack, peak, hold, release, end) {
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    if (t < attack) out[i] *= peak * (t / attack);
    else if (t < release) out[i] *= peak + (hold - peak) * ((t - attack) / (release - attack));
    else out[i] *= Math.max(0, hold * (1 - (t - release) / (end - release)));
  }
}

// Second-order filter. `q` is resonance in decibels for lowpass and highpass
// and width for bandpass. With `to`, the cutoff glides there over `seconds`.
function filter(out, n, type, hz, q = 1, to = 0, seconds = 0) {
  let b0; let b1; let b2; let a1; let a2;
  const tune = frequency => {
    const w = (TAU * Math.min(frequency, RATE * 0.45)) / RATE;
    const cos = Math.cos(w);
    const alpha = Math.sin(w) / (2 * (type === 'bandpass' ? q : 10 ** (q / 20)));
    const a0 = 1 + alpha;
    if (type === 'lowpass') { b1 = (1 - cos) / a0; b0 = b1 / 2; b2 = b0; }
    else if (type === 'highpass') { b1 = -(1 + cos) / a0; b0 = -b1 / 2; b2 = b0; }
    else { b0 = alpha / a0; b1 = 0; b2 = -b0; }
    a1 = (-2 * cos) / a0;
    a2 = (1 - alpha) / a0;
  };
  tune(hz);
  const glide = to ? Math.round(seconds * RATE) : 0;
  let x1 = 0; let x2 = 0; let y1 = 0; let y2 = 0;
  for (let i = 0; i < n; i++) {
    if (i <= glide && glide && i % 32 === 0) tune(hz * (to / hz) ** (i / glide));
    const x = out[i];
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    out[i] = y;
  }
}

// ---- the instruments -----------------------------------------------------

export function createBand(seconds, levels = {}) {
  const length = Math.ceil(seconds * RATE);
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  const scratch = new Float32Array(LONGEST * RATE);
  const gains = {};
  for (const [name, [level, pan]] of Object.entries(BUSES)) {
    const angle = ((pan + 1) / 2) * (Math.PI / 2);
    const gain = levels[name] ?? level;
    gains[name] = [gain * Math.cos(angle), gain * Math.sin(angle)];
  }

  // a fresh, silent stretch of `time` seconds to build one voice in
  const voice = time => {
    const n = Math.min(scratch.length, Math.ceil(time * RATE));
    return [scratch.fill(0, 0, n), n];
  };
  const send = (bus, at, out, n) => {
    const start = Math.round(at * RATE);
    const [l, r] = gains[bus];
    const end = Math.min(n, length - start);
    for (let i = Math.max(0, -start); i < end; i++) {
      left[start + i] += out[i] * l;
      right[start + i] += out[i] * r;
    }
  };

  const kit = {
    // the big drum's skin
    taiko(at, { big = false, loud = 1 } = {}) {
      const ring = big ? 0.5 : 0.28;
      let [out, n] = voice(ring + 0.05);
      tone(out, n, 'sine', big ? 140 : 165, 1, { to: big ? 44 : 56, seconds: ring * 0.6 });
      strike(out, n, 0.003, loud * (big ? 1 : 0.8), ring);
      send('drums', at, out, n);
      [out, n] = voice(0.09);
      hiss(out, n, at);
      filter(out, n, 'lowpass', 1200);
      strike(out, n, 0.001, loud * 0.4, 0.04);
      send('drums', at, out, n);
      if (!big) return;
      [out, n] = voice(0.75);
      hiss(out, n, at);
      filter(out, n, 'highpass', 6500);
      strike(out, n, 0.002, 0.9, 0.7);
      send('bell', at, out, n);
    },
    // and its rim
    rim(at, { big = false, loud = 1 } = {}) {
      let [out, n] = voice(0.17);
      hiss(out, n, at);
      filter(out, n, 'bandpass', big ? 2000 : 2500, 5);
      strike(out, n, 0.001, loud * (big ? 1.2 : 0.9), big ? 0.12 : 0.07);
      send('rim', at, out, n);
      [out, n] = voice(0.09);
      tone(out, n, 'square', 1400, 1, { to: 900, seconds: 0.024 });
      strike(out, n, 0.001, 0.12, 0.04);
      send('rim', at, out, n);
    },
    // a rolling crescendo
    roll(at, strokes, gap, loud = 1) {
      for (let k = 0; k < strokes; k++) {
        const [out, n] = voice(0.15);
        tone(out, n, 'sine', 180, 1, { to: 80, seconds: 0.06 });
        strike(out, n, 0.002, (0.35 + 0.55 * (k / strokes)) * loud, 0.1);
        send('drums', at + k * gap, out, n);
      }
    },
    // hand bell
    bell(at, accent = 1) {
      const [out, n] = voice(0.14);
      tone(out, n, 'square', 2093);
      tone(out, n, 'square', 3136);
      strike(out, n, 0.001, accent, 0.09);
      send('bell', at, out, n);
    },
    shaker(at, accent = 1) {
      const [out, n] = voice(0.11);
      hiss(out, n, at);
      filter(out, n, 'highpass', 7000);
      strike(out, n, 0.004, accent, 0.06);
      send('shaker', at, out, n);
    },
    // bamboo flute: soft attack, gentle vibrato, a breath of noise
    flute(at, hz, length) {
      let [out, n] = voice(length + 0.05);
      tone(out, n, 'sine', hz, 1, { vibrato: length > 0.4 ? 14 : 5, rise: Math.min(length, 0.3) });
      tone(out, n, 'triangle', hz * 2, 0.22);
      sustain(out, n, 0.035, 0.9, 0.8, Math.max(0.04, length - 0.06), length + 0.03);
      send('flute', at, out, n);
      const breath = Math.min(0.12, length);
      [out, n] = voice(0.17);
      hiss(out, n, at);
      filter(out, n, 'bandpass', hz * 2, 3);
      strike(out, n, 0.01, 0.12, breath);
      send('flute', at, out, n);
    },
    // koto: a plucked string that rings on, the pitch settling after the pluck
    koto(at, hz, length) {
      const ring = Math.min(1.8, Math.max(0.6, length * 1.6));
      const pluck = { cents: 38, seconds: 0.06 };
      let [out, n] = voice(ring + 0.05);
      tone(out, n, 'triangle', hz, 1, pluck);
      tone(out, n, 'sawtooth', hz, 0.3, pluck);
      tone(out, n, 'sine', hz * 2, 0.2, pluck);
      filter(out, n, 'lowpass', Math.min(9000, hz * 9), 0.7, hz * 1.6, 0.4);
      strike(out, n, 0.002, 0.9, ring);
      send('koto', at, out, n);
      [out, n] = voice(0.075);
      hiss(out, n, at);
      filter(out, n, 'bandpass', hz * 3, 2);
      strike(out, n, 0.001, 0.25, 0.025);
      send('koto', at, out, n);
    },
    // shamisen: bright and nasal, with the snap of the plectrum on the skin
    shamisen(at, hz, length) {
      const ring = Math.min(0.55, Math.max(0.17, length * 0.95));
      let [out, n] = voice(ring + 0.05);
      tone(out, n, 'sawtooth', hz);
      tone(out, n, 'square', hz * 1.003, 0.4);
      filter(out, n, 'lowpass', 6500, 3, 1100, 0.14);
      strike(out, n, 0.001, 0.9, ring);
      send('shamisen', at, out, n);
      [out, n] = voice(0.08);
      hiss(out, n, at);
      filter(out, n, 'bandpass', 1800, 2);
      strike(out, n, 0.001, 0.5, 0.03);
      send('shamisen', at, out, n);
    },
    // short plucked strings
    strings(at, hz) {
      const [out, n] = voice(0.31);
      tone(out, n, 'sawtooth', hz);
      filter(out, n, 'lowpass', 3800, 1, 700, 0.2);
      strike(out, n, 0.002, 0.8, 0.26);
      send('string', at, out, n);
    },
    bass(at, hz, length = 0.4) {
      const [out, n] = voice(length + 0.05);
      tone(out, n, 'triangle', hz);
      strike(out, n, 0.004, 0.9, length);
      send('bass', at, out, n);
    },
    // wind chime: partials that do not line up, ringing a long time
    chime(at, hz) {
      for (const [ratio, level, ring] of [[1, 0.6, 1.5], [2.76, 0.3, 1.1], [5.4, 0.12, 0.7]]) {
        const [out, n] = voice(ring + 0.05);
        tone(out, n, 'sine', hz * ratio);
        strike(out, n, 0.002, level, ring);
        send('chime', at, out, n);
      }
    },
    // a held root and fifth under everything
    pad(at, hz, length) {
      const [out, n] = voice(length + 0.15);
      tone(out, n, 'triangle', hz, 0.6);
      tone(out, n, 'triangle', hz * 1.4983, 0.6);
      tone(out, n, 'sawtooth', hz * 2.003, 0.25);
      filter(out, n, 'lowpass', 1700);
      sustain(out, n, 0.2, 0.7, 0.7, Math.max(0.25, length - 0.3), length + 0.1);
      send('pad', at, out, n);
    },
  };
  return { kit, left, right };
}

// Evens out the loud and the quiet, as a mixing desk would.
function compress(left, right) {
  const threshold = -14; const knee = 18; const slope = 1 / 4 - 1;
  const attack = Math.exp(-1 / (0.004 * RATE));
  const release = Math.exp(-1 / (0.18 * RATE));
  let reduction = 0;
  let peak = 0;
  for (let i = 0; i < left.length; i++) {
    const level = Math.max(Math.abs(left[i]), Math.abs(right[i]));
    const over = 20 * Math.log10(level + 1e-9) - threshold;
    let wanted = 0;
    if (over > knee / 2) wanted = slope * over;
    else if (over > -knee / 2) wanted = (slope * (over + knee / 2) ** 2) / (2 * knee);
    const pace = wanted < reduction ? attack : release;
    reduction = wanted + (reduction - wanted) * pace;
    const gain = 10 ** (reduction / 20);
    left[i] *= gain;
    right[i] *= gain;
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }
  return peak;
}

// Turns the song up by `drive` and holds the peaks under the ceiling. The
// gain starts to dip a few milliseconds before each peak arrives, so nothing
// is clipped and nothing clicks.
function limit(left, right, drive) {
  const n = left.length;
  const look = Math.round(0.005 * RATE);
  const recover = Math.exp(-1 / (0.08 * RATE));
  const need = new Float32Array(n);
  let held = 1;
  for (let i = 0; i < n; i++) {
    left[i] *= drive;
    right[i] *= drive;
    const level = Math.max(Math.abs(left[i]), Math.abs(right[i]));
    held = Math.min(level > PEAK ? PEAK / level : 1, 1 - (1 - held) * recover);
    need[i] = held;
  }
  // the lowest gain needed over the next few milliseconds...
  const lowest = new Float32Array(n);
  const queue = new Int32Array(n);
  let head = 0; let tail = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (tail > head && need[queue[tail - 1]] >= need[i]) tail--;
    queue[tail++] = i;
    if (queue[head] > i + look) head++;
    lowest[i] = need[queue[head]];
  }
  // ...reached smoothly
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += lowest[i] - (i >= look ? lowest[i - look] : 0);
    const gain = i >= look ? sum / look : lowest[i];
    left[i] *= gain;
    right[i] *= gain;
  }
}

// Brings every song to the same level, about as loud as a finished record.
function master(left, right) {
  const peak = compress(left, right);
  if (peak > 0) limit(left, right, (PEAK / peak) * DRIVE);
}

// ---- playing a score -----------------------------------------------------

// The drums play the Hard chart, so what you hit is what you hear.
export function playDrums(kit, score, measures) {
  const { at, step } = timing(score);
  measures.forEach(({ section, index }, m) => {
    const steps = section.hard[index];
    const loud = score.drums[section.name] ?? 0.78;
    for (let i = 0; i < score.steps; i++) {
      const mark = steps[i];
      if (mark === 'd' || mark === 'D') kit.taiko(at(m, i), { big: mark === 'D', loud });
      else if (mark === 'k' || mark === 'K') kit.rim(at(m, i), { big: mark === 'K', loud });
      else if (isHold(mark)) kit.roll(at(m, i), holdLength(steps, i) * 2, step / 2, loud);
    }
  });
}

// Plays the written melody. `score.melody` holds [note, length] pairs, one
// list per measure, with lengths counted in `score.melodySteps` per measure.
export function playMelody(kit, score, measures, voice, only = () => true) {
  const { at, measure } = timing(score);
  const unit = measure / score.melodySteps;
  measures.forEach((entry, m) => {
    if (!only(entry)) return;
    let step = 0;
    for (const [name, length] of score.melody[entry.tune]?.[entry.index] || []) {
      if (name !== '-') voice(at(m) + step * unit, pitch(name), length * unit);
      step += length;
    }
  });
}

export const rootOf = (score, { tune, index }) => {
  const roots = score.bass[tune];
  return pitch(roots[index % roots.length]);
};

// Renders a whole song to stereo samples.
export function render(score) {
  const measures = layout(score);
  const clock = timing(score);
  const { kit, left, right } = createBand(clock.at(measures.length) + score.tail, score.mix);
  playDrums(kit, score, measures);
  score.arrange(kit, measures, clock);
  master(left, right);
  return { left, right, sampleRate: RATE };
}
