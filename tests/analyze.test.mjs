import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../src/game/analyze.js';
import { Game } from '../src/game/engine.js';

const RATE = 22050;

function drumLoop(bpm, offset, seconds, RATE = 22050) {
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
    put(time + beat / 2, t => random() * Math.exp(-t * 90), 0.04, loud * 0.25);
  }
  return samples;
}

test('finds the tempo and places beats on the real attacks', () => {
  for (const [bpm, offset] of [[120, 0.25], [96, 0.1], [150, 0.4]]) {
    const song = analyze(drumLoop(bpm, offset, 64), RATE);
    assert.ok(Math.abs(song.bpm - bpm) < 0.3, `${bpm} BPM was read as ${song.bpm}`);
    const period = 60 / bpm;
    const worst = Math.max(...song.beats.slice(0, 60).map(t => Math.abs(((t - offset + period / 2) % period) - period / 2)));
    assert.ok(worst < 0.02, `${bpm} BPM beats drift by ${Math.round(worst * 1000)} ms`);
  }
});

test('timing is right at every common sample rate', () => {
  // browsers decode to the output device rate, often 48 kHz, which does not
  // divide down to the same rate as 44.1 kHz audio
  for (const rate of [22050, 32000, 44100, 48000, 96000]) {
    const song = analyze(drumLoop(112, 0.35, 36, rate), rate);
    assert.ok(Math.abs(song.bpm - 112) < 0.3, `${rate} Hz: 112 BPM was read as ${song.bpm}`);
    assert.ok(Math.abs(song.duration - 36) < 0.01, `${rate} Hz: duration ${song.duration}`);
    const period = 60 / 112;
    const worst = Math.max(...song.beats.map(t => Math.abs(((t - 0.35 + period * 100.5) % period) - period / 2)));
    assert.ok(worst < 0.02, `${rate} Hz: beats drift by ${Math.round(worst * 1000)} ms`);
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
  assert.throws(() => analyze({ length: RATE * 60 * 16 }, RATE), /shorter than 15 minutes/);
});

test('is deterministic', () => {
  const samples = drumLoop(120, 0.25, 40);
  assert.deepEqual(analyze(samples, RATE), analyze(samples, RATE));
});
