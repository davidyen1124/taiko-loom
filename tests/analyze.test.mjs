import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../src/game/analyze.js';
import { chooseTempo, extract, listen, smooth3 } from '../src/game/features.js';
import { SCORES } from '../src/game/songs/scores.js';
import { render } from '../src/game/songs/synth.js';
import { detectFeel, loudThreshold, quantile, roundEven } from '../src/game/charting.js';
import { Game } from '../src/game/engine.js';

const RATE = 22050;

// `swing` plays the off-beat late, as a shuffle does; `even` plays it as loud
// as the beat, which is what makes a tempo hard to tell from its look-alikes
function drumLoop(bpm, offset, seconds, RATE = 22050, { swing = false, even = false } = {}) {
  const samples = new Float32Array(Math.floor(seconds * RATE));
  const beat = 60 / bpm;
  let seed = 7;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2147483648 - 1; };
  const put = (time, make, length, gain) => {
    const start = Math.round(time * RATE);
    for (let i = 0; i < length * RATE && start + i < samples.length; i++) samples[start + i] += make(i / RATE) * gain;
  };
  for (let b = 0; offset + b * beat < seconds - 1; b++) {
    const time = offset + b * beat;
    const loud = Math.floor(b / 32) % 2 ? 1 : 0.5;
    if (b % 2 === 0) put(time, t => Math.sin(2 * Math.PI * (55 + 90 * Math.exp(-t * 30)) * t) * Math.exp(-t * 18), 0.18, loud);
    else put(time, t => random() * Math.exp(-t * 28), 0.14, loud * 0.7);
    put(time + beat * (swing ? 2 / 3 : 0.5), t => random() * Math.exp(-t * 90), 0.04, loud * (even ? 0.7 : 0.25));
  }
  return samples;
}

// distance from each beat to the nearest true beat
const drift = (beats, offset, period) => beats.map(t => ((t - offset + period * 100.5) % period) - period / 2);

test('finds the tempo and places beats on the real attacks', () => {
  for (const [bpm, offset] of [[120, 0.25], [96, 0.1], [150, 0.4]]) {
    const song = analyze(drumLoop(bpm, offset, 64), RATE);
    assert.ok(Math.abs(song.bpm - bpm) < 0.3, `${bpm} BPM was read as ${song.bpm}`);
    const worst = Math.max(...drift(song.beats, offset, 60 / bpm).map(Math.abs));
    assert.ok(worst < 0.006, `${bpm} BPM beats drift by ${Math.round(worst * 1000)} ms`);
  }
});

test('beats are not early or late on average', () => {
  // the Hard window is 25 ms either side, so a few milliseconds of bias matter
  for (const [bpm, offset, rate] of [[138, 0.33, 44100], [100, 0.5, 44100], [165, 0.2, 48000]]) {
    const { beats, bpm: read } = extract(drumLoop(bpm, offset, 48, rate), rate);
    assert.ok(Math.abs(read - bpm) < 0.3, `${bpm} BPM was read as ${read}`);
    const errors = drift(beats, offset, 60 / bpm);
    const mean = errors.reduce((sum, v) => sum + v, 0) / errors.length;
    assert.ok(Math.abs(mean) < 0.004, `${bpm} BPM beats are ${(mean * 1000).toFixed(1)} ms off on average`);
  }
});

test('hears a shuffle and charts it in triplets', () => {
  const straight = extract(drumLoop(120, 0.25, 48), RATE);
  const swung = extract(drumLoop(120, 0.25, 48, RATE, { swing: true }), RATE);
  assert.equal(detectFeel(straight), 4);
  assert.equal(detectFeel(swung), 3);
  assert.equal(analyze(drumLoop(120, 0.25, 48, RATE, { swing: true }), RATE).feel, 'shuffle');
});

// the tempo the analyser settles on when its first guess was `guess`
function settled(samples, rate, guess) {
  const heard = listen(samples, rate);
  return 60 / chooseTempo(60 / guess, smooth3(heard.env), heard.fps, heard.duration).period;
}
const song = title => {
  const { left, right, sampleRate } = render(SCORES.find(score => score.title === title));
  return [left.map((v, i) => (v + right[i]) / 2), sampleRate];
};

test('a fast song in straight eighths is not taken for a slower shuffle', () => {
  // three eighth notes at 168 are exactly as long as three triplets at 112
  const rush = song('Raijin Rush');
  for (const guess of [168, 112]) assert.ok(Math.abs(settled(...rush, guess) - 168) < 0.5, `Raijin Rush from a first guess of ${guess}: ${settled(...rush, guess).toFixed(1)}`);
  const parade = song('Lantern Parade');
  for (const guess of [132, 88]) assert.ok(Math.abs(settled(...parade, guess) - 132) < 0.5, `Lantern Parade from ${guess}`);
  for (const bpm of [140, 150, 160, 168]) {
    const loop = drumLoop(bpm, 0.3, 48, RATE, { even: true });
    for (const guess of [bpm, (bpm * 2) / 3]) assert.ok(Math.abs(settled(loop, RATE, guess) - bpm) < 0.5, `${bpm} BPM from a first guess of ${guess.toFixed(0)}: ${settled(loop, RATE, guess).toFixed(1)}`);
  }
});

test('a shuffle is not taken for a faster song in straight eighths', () => {
  const koi = song('Moonlit Koi');
  for (const guess of [100, 150]) assert.ok(Math.abs(settled(...koi, guess) - 100) < 0.5, `Moonlit Koi from a first guess of ${guess}: ${settled(...koi, guess).toFixed(1)}`);
  for (const [bpm, even] of [[100, false], [112, false], [110, true]]) {
    const loop = drumLoop(bpm, 0.3, 48, RATE, { swing: true, even });
    for (const guess of [bpm, bpm * 1.5]) assert.ok(Math.abs(settled(loop, RATE, guess) - bpm) < 0.5, `${bpm} BPM shuffle from a first guess of ${guess}: ${settled(loop, RATE, guess).toFixed(1)}`);
  }
});

test('slow and very fast songs are charted at a tempo that can be played', () => {
  // outside 85 to 175 the beat is doubled or halved, and stays on the attacks
  for (const [bpm, charted] of [[70, 140], [60, 120], [180, 90], [200, 100]]) {
    const song = analyze(drumLoop(bpm, 0.3, 48), RATE);
    assert.ok(Math.abs(song.bpm - charted) < 0.3, `${bpm} BPM was charted at ${song.bpm}`);
    const worst = Math.max(...drift(song.beats, 0.3, 60 / charted).map(Math.abs));
    assert.ok(worst < 0.01, `${bpm} BPM: beats drift by ${Math.round(worst * 1000)} ms`);
    // nothing is played between the doubled beats, which does not make it a shuffle
    if (charted > bpm) assert.equal(song.feel, 'straight', `${bpm} BPM`);
  }
});

test('chart maths: halves round to even, quantiles interpolate', () => {
  assert.deepEqual([0.5, 1.5, 2.5, 3.5].map(v => roundEven(v)), [0, 2, 2, 4]);
  assert.equal(roundEven(1.23456, 2), 1.23);
  assert.equal(quantile([1, 2, 3, 4], 0.5), 2.5);
  assert.equal(quantile([5], 0.9), 5);
  // two clear groups of bars: the threshold falls between them
  const threshold = loudThreshold([-30, -29, -31, -30, -12, -11, -13, -12]);
  assert.ok(threshold > -29 && threshold < -13, `threshold ${threshold}`);
});

test('timing is right at every common sample rate', () => {
  // browsers decode to the output device rate, often 48 kHz, which does not
  // divide down to the same rate as 44.1 kHz audio
  for (const rate of [22050, 32000, 44100, 48000, 96000]) {
    const song = analyze(drumLoop(112, 0.35, 36, rate), rate);
    assert.ok(Math.abs(song.bpm - 112) < 0.3, `${rate} Hz: 112 BPM was read as ${song.bpm}`);
    assert.ok(Math.abs(song.duration - 36) < 0.01, `${rate} Hz: duration ${song.duration}`);
    const worst = Math.max(...drift(song.beats, 0.35, 60 / 112).map(Math.abs));
    assert.ok(worst < 0.006, `${rate} Hz: beats drift by ${Math.round(worst * 1000)} ms`);
  }
});

test('produces three valid charts of rising difficulty in the shared format', () => {
  const song = analyze(drumLoop(120, 0.25, 96), RATE, { title: 'Test', artist: 'Me' });
  assert.equal(song.version, 2);
  assert.equal(song.source, 'device');
  assert.equal(song.title, 'Test');
  assert.equal(song.waveform.length, 180);
  const { easy, medium, hard } = song.charts;
  assert.ok(easy.stats.hits < medium.stats.hits && medium.stats.hits < hard.stats.hits);
  assert.ok(easy.stars <= medium.stars && medium.stars <= hard.stars);
  for (const chart of [easy, medium, hard]) {
    chart.notes.forEach((note, i) => {
      assert.ok(note.time > 0 && note.time < song.duration);
      assert.ok(!i || note.time > chart.notes[i - 1].time, 'notes are strictly ordered');
      assert.ok(['don', 'ka', 'bigDon', 'bigKa', 'roll', 'bigRoll', 'balloon'].includes(note.type));
      if (note.end !== undefined) assert.ok(note.end > note.time + 0.3);
      if (note.type === 'balloon') assert.ok(note.hits >= 4);
    });
    const holds = chart.notes.filter(n => n.end !== undefined);
    for (const hold of holds) {
      assert.ok(!chart.notes.some(n => n.end === undefined && n.time >= hold.time - 1e-3 && n.time <= hold.end + 1e-3));
    }
  }
  assert.ok(song.gogo.length >= 1);
  assert.ok(song.gogo.every(([a, b]) => b - a >= 7.9));
});

test('the generated chart is playable by the engine from start to finish', () => {
  const song = analyze(drumLoop(128, 0.3, 60), RATE);
  const game = new Game(song, 'hard', { auto: true });
  for (let t = -1; t <= song.duration + 2; t += 1 / 120) game.update(t);
  assert.equal(game.finished, true);
  assert.equal(game.stats.bad, 0);
  assert.equal(game.stats.good, song.charts.hard.stats.hits);
  assert.ok(game.stats.score >= 1000000);
});

test('rejects silence, clips that are too short and songs that are too long', () => {
  assert.throws(() => analyze(new Float32Array(RATE * 10), RATE), /silent/);
  assert.throws(() => analyze(drumLoop(120, 0, 3), RATE), /at least 5 seconds/);
  assert.throws(() => analyze({ length: RATE * 60 * 11 }, RATE), /shorter than 10 minutes/);
});

test('is deterministic', () => {
  const samples = drumLoop(120, 0.25, 40);
  assert.deepEqual(analyze(samples, RATE), analyze(samples, RATE));
});
