import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { poseOf } from '../src/game/art/mascot.js';
import { DANCERS } from '../src/game/art/dancers.js';
import { ATLASES } from '../src/game/art/sprites.js';
import { LEVELS } from '../src/game/rules.js';

const FOLDER = new URL('../public/art/sprites/', import.meta.url).pathname;
const manifest = name => JSON.parse(readFileSync(join(FOLDER, `${name}.json`), 'utf8'));

// width and height of a WebP picture, from its header
function sizeOf(path) {
  const bytes = readFileSync(path);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  const kind = bytes.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + bytes.readUIntLE(24, 3), 1 + bytes.readUIntLE(27, 3)];
  if (kind === 'VP8L') { const bits = bytes.readUInt32LE(21); return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)]; }
  return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff];
}

test('every atlas the game asks for is there, and its list matches its picture', () => {
  for (const name of ATLASES) {
    const list = manifest(name);
    const [width, height] = sizeOf(join(FOLDER, list.image));
    assert.deepEqual([list.width, list.height], [width, height], `${name}: the list was made for a different picture`);
    assert.ok(list.unit > 0);
    for (const [id, sprite] of Object.entries(list.sprites)) {
      assert.ok(sprite.x >= 0 && sprite.y >= 0 && sprite.x + sprite.w <= width && sprite.y + sprite.h <= height, `${name}/${id} lies outside the picture`);
      assert.ok(sprite.ax > 0 && sprite.ax < sprite.w && sprite.ay > 0 && sprite.ay <= sprite.h, `${name}/${id}: anchor outside the sprite`);
    }
    const boxes = Object.entries(list.sprites);
    for (const [a, one] of boxes) {
      for (const [b, two] of boxes) {
        if (a >= b) continue;
        const apart = one.x + one.w <= two.x || two.x + two.w <= one.x || one.y + one.h <= two.y || two.y + two.h <= one.y;
        assert.ok(apart, `${name}: ${a} and ${b} overlap`);
      }
    }
  }
});

test('Yoru has a painted pose for everything the game can ask of it', () => {
  const painted = manifest('yoru').sprites;
  const asked = new Set();
  for (const mood of ['idle', 'happy', 'sad', 'oops', 'gogo', 'balloon', 'wave']) {
    for (const [left, right] of [[0, 0], [1, 0], [0, 1], [0.6, 0.9], [0.2, 0.1]]) {
      for (const kinds of [{ left: 'don', right: 'don' }, { left: 'ka', right: 'ka' }, {}]) {
        for (const leap of [false, true]) {
          for (const blink of [false, true]) {
            for (const beats of [0, 1.5, 2.2, 3.9]) asked.add(poseOf({ mood, left, right, kinds, leap, blink, beats }));
          }
        }
      }
    }
  }
  for (const id of asked) assert.ok(painted[id], `no painted pose called ${id}`);
  assert.deepEqual([...asked].sort(), Object.keys(painted).sort(), 'a painted pose is never used');
});

test('Yoru plays the hand and the part of the drum that was struck', () => {
  assert.equal(poseOf({ left: 1, kinds: { left: 'don' } }), 'don-left');
  assert.equal(poseOf({ right: 1, kinds: { right: 'ka' } }), 'ka-right');
  assert.equal(poseOf({ left: 0.4, right: 0.9, kinds: { left: 'ka', right: 'don' } }), 'don-right');
  assert.equal(poseOf({ mood: 'gogo', left: 1, kinds: { left: 'ka' } }), 'ka-left', 'a hit shows even while dancing');
  assert.equal(poseOf({ mood: 'gogo', beats: 4 }), 'dance-a');
  assert.equal(poseOf({ mood: 'gogo', beats: 5 }), 'dance-b');
  assert.equal(poseOf({ mood: 'oops', left: 1 }), 'oops', 'a mistake shows over the hit that caused it');
  assert.equal(poseOf({ blink: true }), 'blink');
});

test('every painted pose of a character is drawn to the same scale', () => {
  // standing poses of one character should be about as tall as each other
  const { sprites, unit } = manifest('yoru');
  for (const id of ['idle', 'blink', 'don-left', 'don-right', 'ka-left', 'ka-right', 'oops', 'puff', 'wave', 'cheer-b']) {
    const tall = sprites[id].ay;
    assert.ok(tall > unit * 0.9 && tall < unit * 1.08, `${id} stands ${tall} against a unit of ${unit}`);
  }
  const friends = manifest('friends');
  for (const dancer of DANCERS) {
    const [a, b] = ['a', 'b'].map(pose => friends.sprites[`${dancer.id}-${pose}`]);
    assert.ok(a && b, `${dancer.id} needs two dance poses`);
    assert.ok(Math.abs(a.ay - b.ay) < friends.unit * 0.09, `${dancer.id} changes size between poses`);
  }
});

test('notes, emblems and crowns are all painted', () => {
  const notes = manifest('notes').sprites;
  for (const id of ['don', 'ka', 'roll', 'balloon', 'float']) assert.ok(notes[id], id);
  // the four discs are one size, so big notes are exactly one and a half small ones
  const widths = ['don', 'ka', 'roll', 'balloon'].map(id => notes[id].w);
  assert.ok(Math.max(...widths) - Math.min(...widths) <= 2, `discs differ: ${widths}`);
  for (const id of ['don', 'ka', 'roll', 'balloon']) {
    assert.ok(Math.abs(notes[id].ax - notes[id].w / 2) <= 2 && Math.abs(notes[id].ay - notes[id].h / 2) <= 2, `${id} is not held by its middle`);
  }
  const hud = manifest('hud').sprites;
  for (const level of Object.values(LEVELS)) assert.ok(hud[level.icon], level.icon);
  for (const crown of ['silver', 'gold', 'rainbow']) assert.ok(hud[`crown-${crown}`], crown);
});

test('the site carries pictures, never audio', () => {
  const walk = folder => readdirSync(folder).flatMap(name => {
    const path = join(folder, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
  const files = walk(new URL('../public/', import.meta.url).pathname);
  assert.ok(files.length > 8);
  for (const file of files) assert.doesNotMatch(file, /\.(mp3|wav|flac|ogg|oga|m4a|aac|opus|wma|aiff?)$/i);
  const heavy = files.filter(file => statSync(file).size > 1024 * 1024);
  assert.deepEqual(heavy, [], 'a picture over 1 MB slows the first load');
});
