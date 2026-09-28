import test from 'node:test';
import assert from 'node:assert/strict';
import { steer } from '../src/game/audio.js';
import { DENSEST, Pacer, STEPS, pixelRatio, steady } from '../src/game/pacer.js';

// frame gaps in ms: `count` of them around `each`, give or take `wobble`
function gaps(count, each, wobble = 0, seed = 7) {
  let state = seed;
  const random = () => { state = (state * 1664525 + 1013904223) % 4294967296; return state / 4294967296; };
  return Array.from({ length: count }, () => each + (random() * 2 - 1) * wobble);
}
const run = (pacer, list) => list.map(gap => pacer.frame(gap)).filter(Boolean).length;

test('a phone draws two device pixels for each CSS pixel, a desktop up to three', () => {
  assert.equal(pixelRatio({ density: 3, finger: true }), DENSEST.finger);
  assert.equal(pixelRatio({ density: 3, finger: true }), 2);
  assert.equal(pixelRatio({ density: 2, finger: true }), 2);
  assert.equal(pixelRatio({ density: 1.5, finger: true }), 1.5);
  assert.equal(pixelRatio({ density: 2, finger: false }), 2);
  assert.equal(pixelRatio({ density: 4, finger: false }), 3);
  assert.equal(pixelRatio({ density: 1, finger: false }), 1);
});

test('frames that arrive on time leave the picture alone', () => {
  for (const each of [16.7, 8.3, 6.9]) {                  // 60, 120 and 144 Hz
    const pacer = new Pacer();
    assert.equal(run(pacer, gaps(1200, each, 1.2)), 0, `${each} ms`);
    assert.equal(pacer.quality, 1);
  }
  // an odd late frame is not a slow device
  const pacer = new Pacer();
  const list = gaps(1200, 16.7, 1);
  for (let i = 40; i < list.length; i += 50) list[i] = 50;
  assert.equal(run(pacer, list), 0);
});

// A device that needs `work` ms for a frame at full size, on a display that
// shows a frame every `tick` ms: a frame waits for the next tick after its work.
function device(pacer, { work, tick = 16.7, frames = 2400, floor = 0, wobble = 0.25 }) {
  let state = 11;
  const random = () => { state = (state * 1664525 + 1013904223) % 4294967296; return state / 4294967296; };
  const changes = [];
  for (let frame = 0; frame < frames; frame++) {
    // work goes with the number of pixels
    const needs = work * pacer.quality ** 2 * (1 + (random() * 2 - 1) * wobble);
    const gap = Math.max(floor, Math.ceil(needs / tick) * tick) + (random() - 0.5);
    if (pacer.frame(gap)) changes.push({ frame, quality: pacer.quality });
  }
  return changes;
}

test('frames that keep arriving late step the picture down until they are on time', () => {
  // uneven and slow: 20 to 34 ms of work for a frame
  const pacer = new Pacer();
  const changes = device(pacer, { work: 27 });
  assert.ok(changes.length >= 1);
  assert.ok(pacer.quality < 1);
  assert.ok(27 * pacer.quality ** 2 * 1.25 <= 16.7, `at ${pacer.quality} a frame still takes ${(27 * pacer.quality ** 2).toFixed(1)} ms`);
  assert.equal(pacer.rate, 60, 'and then the display is kept up with');
  for (let i = 1; i < changes.length; i++) assert.ok(changes[i].frame - changes[i - 1].frame >= 120, 'the picture is given time to settle between steps');
  assert.ok(changes[0].frame <= 200, `the first step took ${changes[0].frame} frames`);
  assert.ok(changes.length <= 4 && changes.at(-1).frame < 1000, 'and it is soon settled');
  assert.ok(STEPS.every((step, index) => index === 0 || step < STEPS[index - 1]) && STEPS.at(-1) >= 0.5);
});

test('a device that takes a steady 25 ms for every frame is helped too', () => {
  // every frame misses one tick and makes the next: a steady 30 a second
  const pacer = new Pacer();
  const changes = device(pacer, { work: 25, wobble: 0.1 });
  assert.equal(changes[0].quality, STEPS.at(-1), 'the smallest picture is tried first, to see whether size is the matter');
  assert.ok(pacer.quality < 1 && pacer.quality > STEPS.at(-1), `then the largest that keeps up is found: ${pacer.quality}`);
  assert.ok(25 * pacer.quality ** 2 * 1.1 <= 16.7);
  assert.equal(pacer.held, false);
  assert.equal(pacer.rate, 60);
  assert.ok(changes.length <= 4 && changes.at(-1).frame < 1000);
});

test('a device that cannot keep up at any size stops at the smallest picture', () => {
  for (const work of [60, 90, 120]) {
    const pacer = new Pacer();
    device(pacer, { work });
    assert.equal(pacer.quality, STEPS.at(-1), `${work} ms`);
    assert.equal(pacer.held, false);
  }
});

test('a display that holds itself to 30 frames a second keeps the whole picture', () => {
  // a phone saving power: a frame every 33.3 ms, however little work it is
  const pacer = new Pacer();
  const changes = device(pacer, { work: 4, floor: 33.3 });
  assert.deepEqual(changes.map(change => change.quality), [STEPS.at(-1), 1], 'one look at the smallest picture, and back');
  assert.equal(pacer.quality, 1);
  assert.equal(pacer.held, true);
  assert.equal(pacer.rate, 30);
  assert.ok(changes[1].frame < 400, 'found out within a few seconds');
  // and the next song does not try again
  const next = new Pacer(pacer.step, pacer.held);
  assert.deepEqual(device(next, { work: 4, floor: 33.3 }), []);
  // when the display is let go again, that is noticed
  device(next, { work: 4, frames: 300 });
  assert.equal(next.held, false);
  assert.ok(Math.abs(steady(gaps(90, 33.3, 1)) - 33.3) < 1);
  assert.equal(steady(gaps(90, 16.7, 1).map((gap, index) => (index % 3 ? gap : gap * 2))), null, 'every third frame late is not steady');
});

test('a pause or a hidden tab is not a slow frame', () => {
  const pacer = new Pacer();
  const list = gaps(1200, 16.7, 1);
  for (let i = 30; i < list.length; i += 60) list[i] = 900;
  assert.equal(run(pacer, list), 0);
  assert.equal(pacer.frame(0), false);
  assert.equal(pacer.frame(NaN), false);
});

test('the song clock moves evenly over a hardware clock that moves in steps', () => {
  // the hardware tells its time in steps of 23 ms; the display draws every 16.7 ms
  let lead = null;
  const moves = [];
  let before = null;
  for (let frame = 0; frame < 600; frame++) {
    const shown = frame * 0.0167;
    const hardware = Math.floor((shown + 1.5) / 0.023) * 0.023;     // song time as the hardware tells it
    lead = steer(lead, hardware - shown);
    const song = shown + lead;
    if (before !== null && frame > 120) moves.push(song - before);
    before = song;
  }
  const uneven = Math.max(...moves.map(move => Math.abs(move - 0.0167)));
  assert.ok(uneven < 0.0012, `a frame moved the song ${(uneven * 1000).toFixed(2)} ms more or less than the display did`);
  // read as it is, the same clock would stand still one frame and leap the next
  assert.ok(0.023 - 0.0167 > uneven * 4);
  // and it stays with the music: within the hardware's own step
  const shown = 599 * 0.0167;
  assert.ok(Math.abs(shown + lead - (shown + 1.5)) < 0.023);
});

test('the song clock is set, not steered, when the music jumps', () => {
  assert.equal(steer(null, 1.25), 1.25);
  assert.equal(steer(1.25, 9), 9, 'a seek');
  assert.equal(steer(1.25, 1.19), 1.19, 'a stall of 60 ms');
  const steered = steer(1.25, 1.26);
  assert.ok(steered > 1.25 && steered < 1.251);
});
