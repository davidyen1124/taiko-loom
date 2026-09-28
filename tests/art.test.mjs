import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { poseOf } from '../src/game/art/mascot.js';
import { DANCERS } from '../src/game/art/dancers.js';
import { ATLASES } from '../src/game/art/sprites.js';
import { PADS } from '../src/game/input.js';
import { reserveFor, stageFor } from '../src/game/layout.js';
import { LEVELS } from '../src/game/rules.js';
import { SKIN, drumLayout, drumTopAt, onSkin, padAt } from '../src/game/touchDrum.js';

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

// ---- the touch drum --------------------------------------------------------

const LANE_ENDS = 360;            // rows down a stage of 720
const IPHONE = { top: 0, right: 47, bottom: 21, left: 47 };     // held sideways: notch and home strip
const IPHONE_UPRIGHT = { top: 47, right: 0, bottom: 34, left: 0 };
const PLAIN = { top: 0, right: 0, bottom: 0, left: 0 };
const SIDEWAYS = [[844, 390, IPHONE], [932, 430, IPHONE], [667, 375, PLAIN], [740, 360, PLAIN], [1180, 820, { ...PLAIN, bottom: 20 }], [1366, 1024, PLAIN]];

// the drum as the play screen lays it out: stage first, then the drum under its lane
function sideways(width, height, inset) {
  const stage = stageFor(width, height, { touch: true, reserve: reserveFor(height, inset.bottom) });
  const laneBottom = LANE_ENDS * stage.scale;
  return { stage, laneBottom, drum: drumLayout(width, height, { laneBottom, inset }) };
}

test('sideways, the stage moves up and the whole head of the drum fits under the lane', () => {
  for (const [width, height, inset] of SIDEWAYS) {
    const { stage, laneBottom, drum } = sideways(width, height, inset);
    const where = `${width}x${height}`;
    assert.equal(stage.docked, true);
    assert.ok(stage.height * stage.scale <= height - inset.bottom - 26 + 0.5, `${where}: the stage leaves no room under it`);
    assert.ok(Math.abs(stage.width * stage.scale - width) < 1, `${where}: the stage does not fill the width`);
    assert.ok(drum.cy - drum.ry >= laneBottom, `${where}: the drum covers the lane`);
    assert.ok(drum.cx - drum.rx >= inset.left && drum.cx + drum.rx <= width - inset.right, `${where}: the drum runs under the notch`);
    assert.ok(Math.abs(drum.skin.rx / drum.rx - SKIN) < 1e-9 && Math.abs(drum.skin.ry / drum.ry - SKIN) < 1e-9);
    assert.ok(drum.skin.ry * 2 >= 96, `${where}: the skin is only ${Math.round(drum.skin.ry * 2)} px high`);
    assert.ok(drum.skin.rx * 2 >= width * 0.45, `${where}: the skin is only ${Math.round(drum.skin.rx * 2)} px wide`);
    assert.equal(drum.floor, height, 'the barrel runs to the edge of the display');
  }
});

test('nothing to tap sits on the strip the phone keeps along the bottom', () => {
  for (const [width, height, inset] of SIDEWAYS) {
    const { drum } = sideways(width, height, inset);
    const clear = height - (drum.cy + drum.ry);
    assert.ok(clear >= inset.bottom + 16, `${width}x${height}: the head ends ${Math.round(clear)} px from the edge`);
    assert.ok(height - (drum.cy + drum.skin.ry) >= inset.bottom + 40, `${width}x${height}: the skin is too near the edge`);
    // a touch on the strip still plays, as the rim: no touch is wasted
    for (const x of [8, width * 0.3, width / 2 - 1, width * 0.7, width - 8]) assert.equal(padAt(x, height - 4, drum).kind, 'ka');
  }
  for (const [width, height, stageBottom] of [[390, 844, 266], [430, 932, 289], [375, 667, 211], [820, 1180, 508]]) {
    const drum = drumLayout(width, height, { upright: true, stageBottom, inset: IPHONE_UPRIGHT });
    assert.ok(height - drum.floor >= IPHONE_UPRIGHT.bottom + 28 - 0.5, `${width}x${height}: the drum ends ${Math.round(height - drum.floor)} px from the edge`);
  }
});

test('upright, the drum sits whole and high in the space under the stage', () => {
  for (const [width, height, stageBottom] of [[390, 844, 266], [430, 932, 289], [375, 667, 211], [360, 640, 203], [820, 1180, 508]]) {
    const drum = drumLayout(width, height, { upright: true, stageBottom, inset: IPHONE_UPRIGHT });
    const where = `${width}x${height}`;
    assert.ok(drum.cy - drum.ry >= stageBottom, `${where}: the drum covers the stage`);
    assert.ok(Math.abs(drum.floor - (drum.cy + drum.ry + drum.depth)) < 1e-9);
    assert.ok(drum.cx - drum.rx >= 0 && drum.cx + drum.rx <= width);
    assert.ok(drum.skin.ry * 2 >= 140, `${where}: the skin is only ${Math.round(drum.skin.ry * 2)} px high`);
    // nearer the stage than the bottom edge
    assert.ok(drum.cy - drum.ry - stageBottom <= height - drum.floor, `${where}: the drum hangs low`);
  }
});

test('the skin plays don, everything else plays ka, and each side is a hand', () => {
  const [kaLeft, donLeft, donRight, kaRight] = PADS;
  for (const [width, height, inset] of SIDEWAYS) {
    const { drum } = sideways(width, height, inset);
    assert.equal(padAt(drum.cx - drum.skin.rx * 0.4, drum.cy, drum), donLeft);
    assert.equal(padAt(drum.cx + drum.skin.rx * 0.4, drum.cy, drum), donRight);
    assert.equal(padAt(8, drum.cy, drum), kaLeft, 'beside the drum is the rim');
    assert.equal(padAt(width - 8, drum.cy, drum), kaRight);
    assert.equal(padAt(drum.cx - 40, 20, drum), kaLeft, 'above the drum is the rim too: no touch is wasted');
    assert.equal(padAt(drum.cx + drum.rx * 0.9, drum.cy, drum), kaRight, 'the painted rim');
    // thumbs resting a third of the way in, level with the middle of the drum
    assert.equal(padAt(width * 0.32, drum.cy, drum).kind, 'don', `${width}x${height}: a resting thumb misses the skin`);
    assert.equal(padAt(width * 0.68, drum.cy, drum).kind, 'don');
  }
  const drum = drumLayout(390, 844, { upright: true, stageBottom: 266, inset: IPHONE_UPRIGHT });
  assert.equal(padAt(drum.cx - 10, drum.cy, drum), donLeft);
  assert.equal(padAt(drum.cx + drum.rx * 0.85, drum.cy, drum), kaRight);
  assert.equal(padAt(drum.cx - drum.rx * 0.85, drum.cy, drum), kaLeft);
  assert.ok(onSkin(drum.cx, drum.cy - drum.skin.ry + 1, drum) && !onSkin(drum.cx, drum.cy - drum.skin.ry - 1, drum));
});

test('the friends can find the far edge of the drum', () => {
  const { drum } = sideways(844, 390, IPHONE);
  assert.equal(drumTopAt(drum.cx, drum), drum.cy - drum.ry);
  assert.ok(drumTopAt(drum.cx + drum.rx * 0.8, drum) > drumTopAt(drum.cx, drum), 'the edge falls away toward the sides');
  assert.equal(drumTopAt(drum.cx - drum.rx - 1, drum), null);
});
