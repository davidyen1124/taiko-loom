// Listens to a song: tempo, beat grid, bar phase, band-split attacks, loudness.
//
// This is the browser's counterpart of backend/src/taiko_backend/analysis.py
// and follows the same steps: a spectrogram, percussive emphasis, attack
// envelopes for the whole band, the kick band and the high band, a tracked
// beat that is fitted to a steady grid when the song allows it, and a bar
// phase chosen from bass attacks and chord changes.

const TARGET_RATE = 22050;
const N_FFT = 1024;
const HOP = 256;
const N_MELS = 64;
const KICK_HZ = 115;
const HIGH_HZ = 2200;
const BPM_RANGE = [85, 175];
const BEATS_PER_MEASURE = 4;
export const MIN_SECONDS = 5;
export const MAX_SECONDS = 15 * 60;
// A centred analysis window sees an attack before its centre reaches it, so
// flux peaks lead the true attack. Measured in tests/analyze.test.mjs.
const ONSET_LEAD = 0.006;
// Tempos a beat tracker commonly confuses with the real one.
const TEMPO_RATIOS = [1, 2 / 3, 3 / 2, 0.5, 2, 3 / 4, 4 / 3];
const OVERRIDE_MARGIN = 1.2;

const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

export class AnalysisError extends Error {}

// ---- spectrum -----------------------------------------------------------

function makeFft(size) {
  const bits = Math.log2(size);
  const reverse = new Uint32Array(size);
  for (let i = 0; i < size; i++) {
    let r = 0;
    for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
    reverse[i] = r;
  }
  const cos = new Float64Array(size / 2);
  const sin = new Float64Array(size / 2);
  for (let i = 0; i < size / 2; i++) {
    cos[i] = Math.cos((2 * Math.PI * i) / size);
    sin[i] = -Math.sin((2 * Math.PI * i) / size);
  }
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  // fills `power` (size / 2 + 1 bins) from `input` (size samples)
  return (input, power) => {
    for (let i = 0; i < size; i++) { re[reverse[i]] = input[i]; im[reverse[i]] = 0; }
    for (let half = 1; half < size; half <<= 1) {
      const stride = size / (half * 2);
      for (let start = 0; start < size; start += half * 2) {
        for (let k = 0; k < half; k++) {
          const wr = cos[k * stride];
          const wi = sin[k * stride];
          const a = start + k;
          const b = a + half;
          const tr = re[b] * wr - im[b] * wi;
          const ti = re[b] * wi + im[b] * wr;
          re[b] = re[a] - tr; im[b] = im[a] - ti;
          re[a] += tr; im[a] += ti;
        }
      }
    }
    for (let i = 0; i <= size / 2; i++) power[i] = re[i] * re[i] + im[i] * im[i];
  };
}

// Slaney-style mel scale, as used by the backend's filter bank.
const hzToMel = hz => (hz < 1000 ? hz / (200 / 3) : 15 + Math.log(hz / 1000) / (Math.log(6.4) / 27));
const melToHz = mel => (mel < 15 ? mel * (200 / 3) : 1000 * Math.exp((Math.log(6.4) / 27) * (mel - 15)));

function melBank(rate) {
  const top = hzToMel(rate / 2);
  const edges = Array.from({ length: N_MELS + 2 }, (_, i) => melToHz((top * i) / (N_MELS + 1)));
  const bins = N_FFT / 2 + 1;
  const bank = [];
  for (let m = 0; m < N_MELS; m++) {
    const [lo, mid, hi] = [edges[m], edges[m + 1], edges[m + 2]];
    const norm = 2 / (hi - lo);
    const first = Math.max(0, Math.ceil((lo / rate) * N_FFT));
    const last = Math.min(bins - 1, Math.floor((hi / rate) * N_FFT));
    const weights = [];
    for (let b = first; b <= last; b++) {
      const hz = (b * rate) / N_FFT;
      const w = hz <= mid ? (hz - lo) / (mid - lo) : (hi - hz) / (hi - mid);
      weights.push(Math.max(0, w) * norm);
    }
    bank.push({ first, weights, centre: mid });
  }
  return bank;
}

function chromaMap(rate) {
  const bins = N_FFT / 2 + 1;
  const pitch = new Int8Array(bins).fill(-1);
  const weight = new Float32Array(bins);
  for (let b = 1; b < bins; b++) {
    const hz = (b * rate) / N_FFT;
    if (hz < 60 || hz > 5000) continue;
    const octaves = Math.log2(hz / 440) + 4.75;     // octaves above C0
    pitch[b] = ((Math.round((octaves % 1) * 12) % 12) + 12) % 12;
    weight[b] = Math.exp(-0.5 * ((octaves - 5) / 2) ** 2);
  }
  return { pitch, weight };
}

// Median of a small window, used for percussive emphasis.
function medianOf(buffer, count) {
  const window = buffer.subarray(0, count);
  window.sort();
  return count % 2 ? window[(count - 1) / 2] : 0.5 * (window[count / 2 - 1] + window[count / 2]);
}

// Keeps what changes quickly in time (drums) and turns down what is steady in
// pitch (voices, chords). Works on mel bands, which is far cheaper than the
// full spectrum and close enough for finding attacks.
function percussive(mel, frames) {
  const out = new Float32Array(mel.length);
  const scratch = new Float32Array(31);
  const harmonic = new Float32Array(mel.length);
  for (let m = 0; m < N_MELS; m++) {
    const row = m * frames;
    for (let t = 0; t < frames; t++) {
      let n = 0;
      for (let k = Math.max(0, t - 15); k <= Math.min(frames - 1, t + 15); k++) scratch[n++] = mel[row + k];
      harmonic[row + t] = medianOf(scratch, n);
    }
  }
  for (let t = 0; t < frames; t++) {
    for (let m = 0; m < N_MELS; m++) {
      let n = 0;
      for (let k = Math.max(0, m - 4); k <= Math.min(N_MELS - 1, m + 4); k++) scratch[n++] = mel[k * frames + t];
      const p = medianOf(scratch, n);
      const h = 2 * harmonic[m * frames + t];       // the backend's margin of 2 on the percussive side
      const mask = (p * p) / (p * p + h * h + 1e-20);
      out[m * frames + t] = mel[m * frames + t] * mask;
    }
  }
  return out;
}

function spectrum(samples, sampleRate) {
  const step = Math.max(1, Math.round(sampleRate / TARGET_RATE));
  const rate = sampleRate / step;                    // 48 kHz audio lands on 24 kHz, not 22.05
  const length = Math.floor(samples.length / step);
  const mono = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let k = 0; k < step; k++) sum += samples[i * step + k];
    mono[i] = sum / step;
  }
  const frames = Math.floor(length / HOP) + 1;
  const fft = makeFft(N_FFT);
  const window = Float64Array.from({ length: N_FFT }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N_FFT));
  const bank = melBank(rate);
  const tones = chromaMap(rate);
  const kickBins = Math.max(2, Math.floor(KICK_HZ / (rate / N_FFT)) + 1);
  const mel = new Float32Array(N_MELS * frames);     // magnitude per band
  const kick = new Float32Array(frames);
  const rms = new Float32Array(frames);
  const chroma = new Float32Array(12 * frames);
  const input = new Float64Array(N_FFT);
  const power = new Float64Array(N_FFT / 2 + 1);
  let peak = 0;
  for (let t = 0; t < frames; t++) {
    const centre = t * HOP;
    let energy = 0;
    for (let i = 0; i < N_FFT; i++) {
      let at = centre - N_FFT / 2 + i;
      if (at < 0) at = -at;                          // reflect at both ends, like a centred frame
      if (at >= length) at = 2 * (length - 1) - at;
      const v = at >= 0 && at < length ? mono[at] : 0;
      input[i] = v * window[i];
      energy += v * v;
    }
    rms[t] = Math.sqrt(energy / N_FFT);
    if (rms[t] > peak) peak = rms[t];
    fft(input, power);
    for (let m = 0; m < N_MELS; m++) {
      const { first, weights } = bank[m];
      let sum = 0;
      for (let k = 0; k < weights.length; k++) sum += weights[k] * power[first + k];
      mel[m * frames + t] = Math.sqrt(sum);
    }
    let low = 0;
    for (let b = 1; b < kickBins; b++) low += power[b];
    kick[t] = low;
    for (let b = 1; b <= N_FFT / 2; b++) {
      if (tones.pitch[b] >= 0) chroma[tones.pitch[b] * frames + t] += power[b] * tones.weight[b];
    }
  }
  return { rate, fps: rate / HOP, frames, mono, mel, kick, rms, chroma, bank, peak };
}

// Average rise in loudness, in decibels, across a set of bands.
function flux(bands, frames, count, floorDb) {
  let top = 0;
  for (let i = 0; i < bands.length; i++) if (bands[i] > top) top = bands[i];
  const reference = 10 * Math.log10(Math.max(top, 1e-20));
  const out = new Float32Array(frames);
  const level = v => Math.max(10 * Math.log10(Math.max(v, 1e-20)), reference - floorDb) - reference;
  for (let m = 0; m < count; m++) {
    let before = level(bands[m * frames]);
    for (let t = 1; t < frames; t++) {
      const now = level(bands[m * frames + t]);
      if (now > before) out[t] += now - before;
      before = now;
    }
  }
  for (let t = 0; t < frames; t++) out[t] /= count;
  return out;
}

// ---- beat ---------------------------------------------------------------

const sampleAt = (env, time, fps) => {
  const x = time * fps;
  const i = Math.floor(x);
  if (i < 0 || i + 1 >= env.length) return 0;
  return env[i] + (env[i + 1] - env[i]) * (x - i);
};

function smooth3(env) {
  const out = new Float32Array(env.length);
  for (let i = 0; i < env.length; i++) out[i] = ((env[i - 1] ?? env[i]) + env[i] + (env[i + 1] ?? env[i])) / 3;
  return out;
}

// Mean of the envelope along a grid, best over every phase.
function comb(env, fps, duration, period, phases) {
  let best = { score: -1, offset: 0 };
  for (const offset of phases(period)) {
    let sum = 0; let n = 0;
    for (let t = offset; t < duration; t += period) { if (t >= 0) { sum += sampleAt(env, t, fps); n++; } }
    const score = n ? sum / n : 0;
    if (score > best.score) best = { score, offset };
  }
  return best;
}

const everyPhase = step => period => Array.from({ length: Math.ceil(period / step) }, (_, i) => i * step);
const around = (centre, span, steps) => () => Array.from({ length: steps }, (_, i) => centre + span * ((i / (steps - 1)) * 2 - 1));

// A first guess at the tempo from how the attack curve repeats.
function guessTempo(env, fps, duration) {
  const minLag = Math.floor((fps * 60) / 200);
  const maxLag = Math.ceil((fps * 60) / 60);
  const values = [];
  for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
    let sum = 0;
    for (let i = lag; i < env.length; i++) sum += env[i] * env[i - lag];
    values.push({ lag, value: sum / (env.length - lag) });
  }
  const peaks = values
    .filter((v, i) => i > 0 && i < values.length - 1 && v.value >= values[i - 1].value && v.value >= values[i + 1].value)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  if (!peaks.length || peaks[0].value <= 0) throw new AnalysisError('No clear beat found. Try a more rhythmic song.');
  let best = null;
  for (const { lag } of peaks) {
    let found = { score: -1, period: lag / fps };
    for (let p = 0; p < 61; p++) {
      const period = (lag / fps) * (1 + 0.02 * ((p / 60) * 2 - 1));
      const { score } = comb(env, fps, Math.min(duration, 90), period, everyPhase(0.012));
      if (score > found.score) found = { score, period };
    }
    const bpm = 60 / found.period;
    const prior = Math.exp(-0.5 * (Math.log2(bpm / 120) / 1.1) ** 2);
    const weighted = found.score * Math.sqrt(bpm) * prior;
    if (!best || weighted > best.weighted) best = { weighted, period: found.period };
  }
  return best.period;
}

// Follows the beat through the song (dynamic programming, after Ellis 2007):
// each beat wants to sit on an attack and about one period after the last.
function trackBeats(env, fps, period) {
  const n = env.length;
  const lag = period * fps;
  let sum = 0; let sq = 0;
  for (const v of env) { sum += v; sq += v * v; }
  const deviation = Math.sqrt(Math.max(1e-12, sq / n - (sum / n) ** 2));
  // local score: the attack curve blurred to about a thirty-second of a beat
  const local = new Float32Array(n);
  const reach = Math.max(1, Math.round(lag / 8));
  for (let t = 0; t < n; t++) {
    let acc = 0; let norm = 0;
    for (let k = -reach; k <= reach; k++) {
      const w = Math.exp(-0.5 * ((k * 32) / lag) ** 2);
      acc += w * (env[t + k] ?? 0) / deviation;
      norm += w;
    }
    local[t] = acc / norm;
  }
  const best = new Float32Array(n);
  const from = new Int32Array(n).fill(-1);
  const near = Math.round(lag / 2);
  const far = Math.round(lag * 2);
  const tightness = 100;
  for (let t = 0; t < n; t++) {
    let top = -Infinity; let arg = -1;
    for (let back = near; back <= far && t - back >= 0; back++) {
      const penalty = tightness * Math.log(back / lag) ** 2;
      const candidate = best[t - back] - penalty;
      if (candidate > top) { top = candidate; arg = t - back; }
    }
    best[t] = local[t] + (arg >= 0 ? Math.max(top, 0) : 0);
    from[t] = arg >= 0 && top > 0 ? arg : -1;
  }
  let end = n - 1;
  for (let t = Math.max(0, n - Math.round(lag)); t < n; t++) if (best[t] > best[end]) end = t;
  const beats = [];
  for (let t = end; t >= 0; t = from[t]) { beats.push(t / fps); if (from[t] < 0) break; }
  return beats.reverse();
}

// Fits `time = offset + index * period` to tracked beats, tolerating beats the
// tracker skipped or doubled.
function fitGrid(beats) {
  const gaps = beats.slice(1).map((t, i) => t - beats[i]).sort((a, b) => a - b);
  let period = gaps[Math.floor(gaps.length / 2)];
  let offset = beats[0];
  const index = new Float64Array(beats.length);
  for (let round = 0; round < 3; round++) {
    for (let i = 1; i < beats.length; i++) index[i] = index[i - 1] + Math.max(1, Math.round((beats[i] - beats[i - 1]) / period));
    const weight = new Float64Array(beats.length).fill(1);
    for (let pass = 0; pass < 5; pass++) {
      let sw = 0; let sx = 0; let sy = 0; let sxx = 0; let sxy = 0;
      for (let i = 0; i < beats.length; i++) {
        const w = weight[i] * weight[i];
        sw += w; sx += w * index[i]; sy += w * beats[i]; sxx += w * index[i] * index[i]; sxy += w * index[i] * beats[i];
      }
      const slope = (sw * sxy - sx * sy) / (sw * sxx - sx * sx);
      const intercept = (sy - slope * sx) / sw;
      const residual = Array.from(beats, (t, i) => t - (intercept + slope * index[i]));
      const spread = residual.map(Math.abs).sort((a, b) => a - b)[Math.floor(residual.length / 2)];
      const scale = Math.max(1e-3, 1.4826 * spread);
      residual.forEach((r, i) => { weight[i] = 1 / (1 + (r / (2.5 * scale)) ** 2); });
      period = slope; offset = intercept;
    }
  }
  const residual = Array.from(beats, (t, i) => Math.abs(t - (offset + period * index[i]))).sort((a, b) => a - b);
  const steady = residual[Math.floor(0.85 * (residual.length - 1))] < 0.04;
  return { period, offset, steady };
}

// Judges the tracked tempo against its look-alikes by laying each grid over
// the attacks. The real beat catches a drum hit on every line.
function chooseTempo(period, env, fps, duration) {
  let chosen = null;
  for (const ratio of TEMPO_RATIOS) {
    const centre = period * ratio;
    const bpm = 60 / centre;
    if (bpm < BPM_RANGE[0] - 1 || bpm >= BPM_RANGE[1] + 1) continue;
    let best = { score: -1, period: centre, offset: 0 };
    for (let p = 0; p < 13; p++) {
      const candidate = centre * (1 + 6e-4 * ((p / 12) * 2 - 1));
      const found = comb(env, fps, duration, candidate, everyPhase(0.008));
      if (found.score > best.score) best = { score: found.score, period: candidate, offset: found.offset };
    }
    const prior = Math.exp(-0.5 * (Math.log2(bpm / 120) / 1.1) ** 2);
    const weighted = (best.score * Math.sqrt(bpm) * prior) / (ratio === 1 ? 1 : OVERRIDE_MARGIN);
    if (!chosen || weighted > chosen.weighted) chosen = { weighted, period: best.period, offset: best.offset };
  }
  return chosen;
}

// Nudges the grid onto the actual attacks.
function refineGrid(period, offset, env, fps, duration) {
  let best = { score: -1, period, offset };
  for (const [spanP, spanO, stepsP, stepsO] of [[6e-4, 0.035, 25, 29], [6e-5, 0.006, 13, 13]]) {
    const centre = { ...best };
    for (let p = 0; p < stepsP; p++) {
      const candidate = centre.period * (1 + spanP * ((p / (stepsP - 1)) * 2 - 1));
      const found = comb(env, fps, duration, candidate, around(centre.offset, spanO, stepsO));
      if (found.score > best.score) best = { score: found.score, period: candidate, offset: found.offset };
    }
  }
  return best;
}

// For songs whose tempo moves: fill gaps, drop doubles, extend to both ends.
function repairBeats(beats, duration) {
  const gaps = beats.slice(1).map((t, i) => t - beats[i]).sort((a, b) => a - b);
  const period = gaps[Math.floor(gaps.length / 2)];
  const out = [beats[0]];
  for (const t of beats.slice(1)) {
    const gap = t - out.at(-1);
    if (gap < 0.6 * period) continue;
    const parts = Math.max(1, Math.round(gap / period));
    for (let k = 1; k <= parts; k++) out.push(out.at(-1) + (t - out.at(-1)) / (parts - k + 1));
  }
  const average = list => list.slice(1).reduce((sum, t, i) => sum + t - list[i], 0) / Math.max(1, list.length - 1);
  const first = out.length > 5 ? average(out.slice(0, 5)) : period;
  while (out[0] - first > 0.02) out.unshift(out[0] - first);
  const last = out.length > 5 ? average(out.slice(-5)) : period;
  while (out.at(-1) + last < duration - 0.02) out.push(out.at(-1) + last);
  return out;
}

// Picks which of the four beat phases starts the bar, from bass attacks and
// harmonic change (chords tend to move on the downbeat).
function findDownbeat(beats, low, chroma, frames, fps) {
  if (beats.length < 8) return 0;
  const bass = beats.map(t => sampleAt(low, t, fps));
  const at = beats.map(t => clamp(Math.round(t * fps), 0, frames - 1));
  const perBeat = [];
  for (let i = 0; i + 1 < beats.length; i++) {
    const vector = new Float64Array(12);
    const end = Math.max(at[i] + 1, at[i + 1]);
    for (let p = 0; p < 12; p++) {
      let sum = 0;
      for (let f = at[i]; f < end; f++) sum += chroma[p * frames + f];
      vector[p] = sum / (end - at[i]);
    }
    const length = Math.hypot(...vector) + 1e-9;
    perBeat.push(vector.map(v => v / length));
  }
  const change = new Float64Array(beats.length);
  for (let i = 1; i < perBeat.length; i++) {
    let dot = 0;
    for (let p = 0; p < 12; p++) dot += perBeat[i][p] * perBeat[i - 1][p];
    change[i] = 1 - dot;
  }
  const z = values => {
    const m = values.reduce((s, v) => s + v, 0) / values.length;
    const d = Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length) + 1e-9;
    return Array.from(values, v => (v - m) / d);
  };
  const zb = z(bass);
  const zc = z(change);
  let best = 0; let top = -Infinity;
  for (let phase = 0; phase < BEATS_PER_MEASURE; phase++) {
    let sum = 0; let n = 0;
    for (let i = phase; i < beats.length; i += BEATS_PER_MEASURE) { sum += zb[i] + 1.2 * zc[i]; n++; }
    if (n && sum / n > top) { top = sum / n; best = phase; }
  }
  return best;
}

// ---- everything together --------------------------------------------------

export function extract(samples, sampleRate) {
  const duration = samples.length / sampleRate;
  if (duration > MAX_SECONDS) throw new AnalysisError('Choose a song shorter than 15 minutes.');
  if (duration < MIN_SECONDS) throw new AnalysisError('Choose a song at least 5 seconds long.');
  const spec = spectrum(samples, sampleRate);
  if (!(spec.peak >= 1e-4)) throw new AnalysisError('This audio is silent. Try another file.');
  const { fps, frames } = spec;

  const drums = percussive(spec.mel, frames);
  for (let i = 0; i < drums.length; i++) drums[i] *= drums[i];       // magnitude to power
  const highFrom = spec.bank.findIndex(band => band.centre >= HIGH_HZ);
  const env = flux(drums, frames, N_MELS, 70);
  const high = flux(drums.subarray(highFrom * frames), frames, N_MELS - highFrom, 70);
  const low = flux(spec.kick, frames, 1, 50);

  const first = guessTempo(smooth3(env), fps, duration);
  const tracked = trackBeats(env, fps, first);
  if (tracked.length < 8) throw new AnalysisError('No clear beat found. Try a more rhythmic song.');

  const fitted = fitGrid(tracked);
  let { period } = fitted;
  let beats;
  if (fitted.steady) {
    const smooth = smooth3(env);
    const picked = chooseTempo(period, smooth, fps, duration) || fitted;
    let grid = refineGrid(picked.period, picked.offset, smooth, fps, duration);
    period = grid.period;
    let { offset } = grid;
    while (60 / period < BPM_RANGE[0]) period /= 2;
    while (60 / period >= BPM_RANGE[1]) {
      period *= 2;
      // halving leaves two candidate phases; kicks mark the beat
      let a = 0; let b = 0;
      for (let t = offset; t < duration; t += period) {
        a += sampleAt(low, t, fps) + 0.5 * sampleAt(env, t, fps);
        b += sampleAt(low, t + period / 2, fps) + 0.5 * sampleAt(env, t + period / 2, fps);
      }
      if (b > a) offset += period / 2;
    }
    // trackers sometimes lock onto the off-beat; bass drums rarely do
    let on = 0; let off = 0;
    for (let t = offset; t < duration; t += period) { on += sampleAt(low, t, fps); off += sampleAt(low, t + period / 2, fps); }
    if (off > 1.35 * on) offset += period / 2;
    offset += ONSET_LEAD;
    offset -= Math.floor(offset / period) * period;
    beats = [];
    for (let t = offset; t < duration - 0.02; t += period) beats.push(t);
    grid = null;
  } else {
    beats = repairBeats(tracked, duration).map(t => t + ONSET_LEAD);
    const gaps = beats.slice(1).map((t, i) => t - beats[i]).sort((a, b) => a - b);
    period = gaps[Math.floor(gaps.length / 2)];
    while (60 / period < BPM_RANGE[0]) {
      beats = beats.flatMap((t, i) => (i + 1 < beats.length ? [t, (t + beats[i + 1]) / 2] : [t]));
      period /= 2;
    }
    while (60 / period >= BPM_RANGE[1]) { beats = beats.filter((_, i) => i % 2 === 0); period *= 2; }
    beats = beats.filter(t => t >= 0 && t < duration);
  }
  if (beats.length < 8) throw new AnalysisError('No clear beat found. Try a more rhythmic song.');

  const downbeat = findDownbeat(beats, low, spec.chroma, frames, fps);

  // Salience relative to how loud the song is around each moment, so a quiet
  // verse still gets notes on its clear attacks.
  const sortedEnv = Float32Array.from(env).sort();
  const p90 = sortedEnv[Math.floor(0.9 * (sortedEnv.length - 1))];
  const half = Math.round(2 * fps);
  const stride = 4;
  const reference = new Float32Array(frames);
  const bucket = new Float32Array(half * 2 + 1);
  for (let t = 0; t < frames; t += stride) {
    let n = 0;
    for (let k = t - half; k <= t + half; k++) bucket[n++] = env[clamp(k, 0, frames - 1)];
    const window = bucket.subarray(0, n).sort();
    const value = window[Math.floor(0.92 * (n - 1))];
    for (let k = t; k < Math.min(frames, t + stride); k++) reference[k] = value;
  }
  const relative = new Float32Array(frames);
  for (let t = 0; t < frames; t++) relative[t] = clamp(env[t] / (reference[t] + 0.25 * p90 + 1e-9), 0, 2);
  const onsets = [];
  const onsetStrength = [];
  for (let t = 0; t < frames; t++) {
    if (relative[t] <= 0.18) continue;
    let peak = true;
    for (let k = t - 2; k <= t + 2; k++) if (k !== t && (relative[k] ?? 0) > relative[t]) peak = false;
    if (peak) { onsets.push(t / fps + ONSET_LEAD); onsetStrength.push(relative[t]); }
  }

  const sortedRms = Float32Array.from(spec.rms).sort();
  const rmsFloor = Math.max(sortedRms[Math.floor(0.95 * (sortedRms.length - 1))] * 0.06, 1e-4);
  const block = Math.floor(spec.mono.length / 180) || 1;
  const wave = Array.from({ length: 180 }, (_, i) => {
    let sum = 0;
    for (let k = i * block; k < (i + 1) * block; k++) sum += (spec.mono[k] || 0) ** 2;
    return Math.sqrt(sum / block);
  });
  const loudest = Math.max(...wave) || 1;

  return {
    duration, bpm: 60 / period, steady: fitted.steady, beats, downbeat, fps,
    env: relative, low, high, rms: spec.rms, onsets, onsetStrength, rmsFloor,
    waveform: wave.map(v => Math.round((v / loudest) * 1000) / 1000),
    frame: time => clamp(Math.round(time * fps), 0, frames - 1),
  };
}
