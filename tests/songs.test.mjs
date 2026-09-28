import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_SONGS, FIRST_SONG, demoSong } from '../src/game/songs/index.js';
import { SCORES } from '../src/game/songs/scores.js';
import { RATE, createBand, pitch, render } from '../src/game/songs/synth.js';
import { extract } from '../src/game/features.js';
import { detectFeel } from '../src/game/charting.js';
import { Game } from '../src/game/engine.js';

const LEVELS = ['easy', 'medium', 'hard'];

test('there are three built-in songs with their own names and colours', () => {
  assert.equal(DEMO_SONGS.length, 3);
  for (const key of ['id', 'title', 'colour']) assert.equal(new Set(DEMO_SONGS.map(song => song[key])).size, 3, key);
  assert.ok(DEMO_SONGS.every(song => song.source === 'demo' && song.version === 2));
  assert.equal(demoSong(FIRST_SONG).title, 'Lantern Parade');
  assert.deepEqual(DEMO_SONGS.map(song => song.feel).sort(), ['shuffle', 'straight', 'straight']);
});

test('every score is written out in full', () => {
  for (const score of SCORES) {
    for (const section of score.sections) {
      const tune = section.tune || section.name;
      const where = `${score.title}, ${section.name}`;
      for (const level of LEVELS) {
        assert.equal(section[level].length, section.hard.length, `${where}: ${level} has a measure missing`);
        for (const steps of section[level]) {
          assert.equal(steps.length, score.steps, `${where}: "${steps}" is not ${score.steps} steps`);
          assert.match(steps, /^[dkDKrRB.-]+$/, where);
          assert.doesNotMatch(steps, /(^|[^rRB-])-/, `${where}: "${steps}" holds nothing`);
          if (steps.includes('B')) assert.ok(section.balloon[level] >= 4, `${where}: balloon needs a hit count`);
        }
      }
      assert.equal(score.melody[tune].length, section.hard.length, `${where}: melody`);
      for (const phrase of score.melody[tune]) {
        if (phrase.length) assert.equal(phrase.reduce((sum, [, length]) => sum + length, 0), score.melodySteps, `${where}: a melody measure is the wrong length`);
        for (const [name] of phrase) if (name !== '-') assert.ok(pitch(name) > 100 && pitch(name) < 2000, name);
      }
      assert.ok(score.bass[tune].every(name => pitch(name) > 60 && pitch(name) < 140), `${where}: bass`);
      assert.ok(score.loudness[section.name] > 0, `${where}: loudness`);
    }
  }
});

test('notes are tuned to concert pitch', () => {
  assert.equal(pitch('A4'), 440);
  assert.ok(Math.abs(pitch('C4') - 261.626) < 0.01);
  assert.ok(Math.abs(pitch('Bb3') - 233.082) < 0.01);
  assert.ok(Math.abs(pitch('F#5') - 739.989) < 0.01);
});

test('charts get harder from Easy to Hard, and from song to song', () => {
  for (const song of DEMO_SONGS) {
    const { easy, medium, hard } = song.charts;
    assert.ok(easy.stats.hits < medium.stats.hits && medium.stats.hits < hard.stats.hits, song.title);
    assert.ok(easy.stars < medium.stars && medium.stars < hard.stars, song.title);
    for (const chart of [easy, medium, hard]) {
      chart.notes.forEach((note, i) => {
        assert.ok(note.time > 0 && note.time < song.duration);
        assert.ok(!i || note.time > chart.notes[i - 1].time, `${song.title}: notes are in order`);
        if (note.end !== undefined) assert.ok(note.end > note.time + 0.3 && note.end < song.duration);
      });
      for (const hold of chart.notes.filter(note => note.end !== undefined)) {
        assert.ok(!chart.notes.some(note => note !== hold && note.time >= hold.time - 1e-3 && note.time <= hold.end + 1e-3), `${song.title}: a note sits inside a hold`);
      }
    }
    // Easy never asks for anything faster than a beat
    const beat = 60 / song.bpm;
    const times = easy.notes.map(note => note.time);
    assert.ok(times.slice(1).every((time, i) => time - times[i] > beat - 1e-3), `${song.title}: Easy is too quick`);
  }
  const hardest = DEMO_SONGS.map(song => song.charts.hard.stars);
  assert.deepEqual(hardest, [...hardest].sort((a, b) => a - b), 'the shelf runs from gentle to fierce');
});

test('bar lines, beats and Go-Go Time line up with the music', () => {
  for (const song of DEMO_SONGS) {
    const beat = 60 / song.bpm;
    assert.ok(song.beats.every((time, i) => Math.abs(time - (song.beats[0] + i * beat)) < 1e-3));
    assert.ok(song.measures.every((time, i) => Math.abs(time - (song.measures[0] + i * beat * 4)) < 1e-3));
    assert.ok(song.gogo.length >= 2);
    for (const [from, to] of song.gogo) {
      assert.ok(song.measures.some(time => Math.abs(time - from) < 1e-3), 'Go-Go starts on a bar line');
      assert.ok(to - from >= 8 * beat * 4 - 1e-3);
    }
    assert.ok(song.duration > 60 && song.duration < 120);
    assert.equal(song.waveform.length, 180);
  }
});

test('every built-in chart can be played through perfectly', () => {
  for (const song of DEMO_SONGS) {
    for (const level of LEVELS) {
      const game = new Game(song, level, { auto: true });
      for (let t = -1; t <= song.duration + 2; t += 1 / 120) game.update(t);
      assert.equal(game.finished, true, `${song.title} ${level}`);
      assert.equal(game.stats.bad, 0, `${song.title} ${level}`);
      assert.equal(game.stats.good, song.charts[level].stats.hits, `${song.title} ${level}`);
      assert.ok(game.stats.score >= 1000000, `${song.title} ${level}: ${game.stats.score}`);
    }
  }
});

// ---- the sound ------------------------------------------------------------

const rendered = new Map();
const audioOf = score => {
  if (!rendered.has(score.id)) rendered.set(score.id, render(score));
  return rendered.get(score.id);
};
const decibels = (samples, from = 0, to = samples.length) => {
  let sum = 0;
  for (let i = from; i < to; i++) sum += samples[i] ** 2;
  return 10 * Math.log10(sum / (to - from) + 1e-12);
};

test('every song renders quickly, cleanly and at a matching level', () => {
  for (const score of SCORES) {
    const started = performance.now();
    const { left, right, sampleRate } = audioOf(score);
    assert.ok(performance.now() - started < 5000, `${score.title} took too long to render`);
    assert.equal(sampleRate, RATE);
    assert.ok(Math.abs(left.length / RATE - demoSong(score.id).duration) < 0.001, `${score.title} is not as long as its chart`);
    let peak = 0;
    for (let i = 0; i < left.length; i++) {
      assert.ok(Number.isFinite(left[i]) && Number.isFinite(right[i]), `${score.title}: broken sample at ${i}`);
      peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
    }
    assert.ok(peak > 0.85 && peak <= 0.9201, `${score.title} peaks at ${peak}`);
    const level = decibels(left);
    assert.ok(level > -20 && level < -12, `${score.title} plays at ${level.toFixed(1)} dB`);
    assert.ok(Math.abs(decibels(left) - decibels(right)) < 2, `${score.title} leans to one side`);
    // silent before the first downbeat, and faded out by the end: no clicks
    assert.ok(decibels(left, 0, Math.floor((score.offset - 0.02) * RATE)) < -80, `${score.title} starts early`);
    assert.ok(decibels(left, left.length - 2205) < -45, `${score.title} is cut off at the end`);
  }
});

test('the music is in time with its chart', () => {
  // listen to each song with the analyser that charts uploaded music
  for (const score of SCORES) {
    const song = demoSong(score.id);
    const { left, right } = audioOf(score);
    const heard = extract(left.map((v, i) => (v + right[i]) / 2), RATE);
    assert.ok(Math.abs(heard.bpm - song.bpm) < 0.2, `${song.title}: written at ${song.bpm}, sounds like ${heard.bpm}`);
    assert.equal(detectFeel(heard) === 3 ? 'shuffle' : 'straight', song.feel, song.title);
    const period = 60 / song.bpm;
    const late = heard.beats.map(t => ((t - song.beats[0] + period * 100.5) % period) - period / 2);
    const worst = Math.max(...late.map(Math.abs));
    assert.ok(worst < 0.005, `${song.title}: the music is ${(worst * 1000).toFixed(1)} ms away from the chart`);
  }
});

// the pitch that sounds, from how the wave repeats
function heardPitch(samples, expected) {
  const from = Math.floor(0.1 * RATE);
  const size = Math.min(samples.length - from, Math.floor(0.25 * RATE)) - Math.ceil(RATE / expected) * 2;
  let best = 0; let top = -Infinity;
  const score = lag => {
    let sum = 0;
    for (let i = from; i < from + size; i++) sum += samples[i] * samples[i + lag];
    return sum;
  };
  for (let lag = Math.floor(RATE / expected / 1.06); lag <= Math.ceil((RATE / expected) * 1.06); lag++) {
    const value = score(lag);
    if (value > top) { top = value; best = lag; }
  }
  const [a, b, c] = [score(best - 1), top, score(best + 1)];
  return RATE / (best + (0.5 * (a - c)) / (a - 2 * b + c));
}

test('every pitched instrument plays in tune', () => {
  for (const name of ['flute', 'koto', 'shamisen', 'strings', 'bass']) {
    for (const note of ['A2', 'D4', 'A4', 'E5', 'D6']) {
      if ((name === 'bass') !== (note === 'A2')) continue;
      const { kit, left } = createBand(1.2);
      kit[name](0, pitch(note), 0.8);
      const cents = 1200 * Math.log2(heardPitch(left, pitch(note)) / pitch(note));
      assert.ok(Math.abs(cents) < 12, `${name} plays ${note} ${cents.toFixed(1)} cents out`);
    }
  }
});

test('drums speak at once and stay in their own register', () => {
  const crossings = samples => {
    let count = 0;
    for (let i = 1; i < 4410; i++) if (samples[i - 1] < 0 !== samples[i] < 0) count++;
    return count;
  };
  const strike = name => {
    const { kit, left } = createBand(1);
    kit[name](0, { loud: 1 });
    let loudest = 0;
    for (let i = 0; i < left.length; i++) if (Math.abs(left[i]) > Math.abs(left[loudest])) loudest = i;
    return { left, loudest };
  };
  const don = strike('taiko');
  const ka = strike('rim');
  assert.ok(don.loudest < 0.012 * RATE && ka.loudest < 0.012 * RATE, 'the attack is immediate');
  assert.ok(crossings(ka.left) > 4 * crossings(don.left), 'the rim is much brighter than the skin');
});
