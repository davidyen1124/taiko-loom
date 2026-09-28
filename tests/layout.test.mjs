import test from 'node:test';
import assert from 'node:assert/strict';
import { PADS, padForPoint } from '../src/game/input.js';
import { FRAME, GAUGE, LANE, MASCOT, SAFE, SCENE_Y, STAGE, TARGET, TITLE, TOP_HEIGHT, TOUCH_STAGE, bandFor, setStage, stageFor } from '../src/game/layout.js';

const fills = (w, h) => {
  const stage = stageFor(w, h);
  return { ...stage, shownWidth: stage.width * stage.scale, shownHeight: stage.height * stage.scale };
};

test('a 16:9 window gets the design grid exactly', () => {
  const stage = stageFor(1280, 720);
  assert.deepEqual([stage.width, stage.height, stage.scale, stage.upright], [1280, 720, 1, false]);
  assert.equal(stageFor(2560, 1440).scale, 2);
});

test('the stage fills the window at every common shape: no bars', () => {
  const windows = [[1862, 1017], [1440, 900], [1920, 1080], [1024, 768], [1728, 1117], [2560, 1080], [844, 390], [1366, 768]];
  for (const [w, h] of windows) {
    const stage = fills(w, h);
    assert.ok(Math.abs(stage.shownWidth - w) < 0.5, `${w}x${h}: ${(w - stage.shownWidth).toFixed(2)} px of width left empty`);
    assert.ok(Math.abs(stage.shownHeight - h) < 0.5, `${w}x${h}: ${(h - stage.shownHeight).toFixed(2)} px of height left empty`);
    assert.ok(stage.width >= SAFE.width && stage.height >= SAFE.height, 'the design grid always fits inside');
  }
});

test('wider windows add columns, taller windows add rows', () => {
  assert.deepEqual([stageFor(1862, 1017).width, stageFor(1862, 1017).height], [1318.23, 720]);
  assert.deepEqual([stageFor(1440, 900).width, stageFor(1440, 900).height], [1280, 800]);
  assert.deepEqual([stageFor(1024, 768).width, stageFor(1024, 768).height], [1280, 960]);
});

test('extreme shapes are padded rather than stretched without limit', () => {
  const wide = fills(3840, 1080);        // 32:9
  assert.equal(wide.width, 1728);
  assert.ok(wide.shownWidth < 3840 && Math.abs(wide.shownHeight - 1080) < 1);
  const tall = fills(1000, 1100);
  assert.equal(tall.height, 960);
  assert.ok(tall.shownHeight < 1100 && Math.abs(tall.shownWidth - 1000) < 1);
});

test('the game is played sideways: a phone or tablet held upright is asked to turn', () => {
  assert.equal(stageFor(375, 812, { touch: true }).upright, true);
  assert.equal(stageFor(820, 1180, { touch: true }).upright, true);
  assert.equal(stageFor(844, 390, { touch: true }).upright, false);
  assert.equal(stageFor(1180, 820, { touch: true }).upright, false);
  // a tall window on a desktop is only a tall window
  const tall = stageFor(375, 812);
  assert.deepEqual([tall.width, tall.height, tall.upright], [1280, 960, false]);
  assert.equal(stageFor(820, 1180).upright, false);
});

// phones on their sides: in a browser with its bars showing, in a browser without, installed
const PHONES = [[844, 291], [844, 340], [844, 390], [932, 430], [852, 300], [667, 375], [740, 360], [915, 356], [915, 412]];

test('a phone on its side is filled from edge to edge, on every screen', () => {
  for (const [w, h] of PHONES) {
    for (const play of [false, true]) {
      const stage = stageFor(w, h, { touch: true, play });
      const where = `${w}x${h}${play ? ', play screen' : ''}`;
      assert.ok(Math.abs(stage.width * stage.scale - w) < 0.5, `${where}: ${(w - stage.width * stage.scale).toFixed(1)} px of width left empty`);
      assert.ok(Math.abs(stage.height * stage.scale - h) < 0.5, `${where}: ${(h - stage.height * stage.scale).toFixed(1)} px of height left empty`);
      assert.ok(stage.width >= SAFE.width, `${where}: the design grid is ${stage.width} wide`);
      assert.equal(stage.compact, play);
    }
  }
  // a desktop window of the same shape keeps its limit, and its play screen its layout
  assert.equal(stageFor(844, 291).width, 1728);
  assert.deepEqual(stageFor(844, 291, { play: true }), stageFor(844, 291));
  assert.equal(stageFor(1280, 720, { play: true }).compact, false);
});

test('played with fingers, a wide and low display draws the lane larger', () => {
  for (const [w, h] of [...PHONES, [1180, 820], [1024, 768], [1366, 1024]]) {
    const stage = stageFor(w, h, { touch: true, play: true });
    setStage(stage.width, stage.height, { compact: true });
    const where = `${w}x${h}`;
    const laneEnds = FRAME.y + FRAME.height + STAGE.top - STAGE.rise;
    assert.ok(stage.height >= TOUCH_STAGE.height);
    assert.ok(STAGE.band >= TOUCH_STAGE.band && STAGE.band <= 1, `${where}: the sky band is drawn at ${STAGE.band}`);
    assert.ok(Math.abs(STAGE.rise - TOP_HEIGHT * (1 - STAGE.band)) < 1e-9);
    assert.ok(Math.abs(laneEnds - (TOP_HEIGHT * STAGE.band + FRAME.height + STAGE.top)) < 1e-9, 'the lane sits right under the sky band');
    const festival = stage.height - STAGE.foot - (SCENE_Y + STAGE.top - STAGE.rise);
    assert.ok(festival >= 273, `${where}: the festival has ${Math.round(festival)} rows, too few for the friends to dance in`);
    // never smaller than the same window would draw it without this
    assert.ok(stage.scale >= stageFor(w, h, { touch: true }).scale - 1e-9, `${where}: the lane shrank`);
  }
  // the lane on a phone in a browser that shows its bars: a quarter larger
  const phone = stageFor(844, 291, { touch: true, play: true });
  assert.equal(phone.height, TOUCH_STAGE.height);
  assert.ok(phone.scale / stageFor(844, 291, { touch: true }).scale > 1.28);
  assert.equal(bandFor(phone.height), TOUCH_STAGE.band);
  // a display that is tall enough is laid out as a desktop window is
  for (const [w, h] of [[667, 375], [1024, 768], [1180, 820]]) {
    const stage = stageFor(w, h, { touch: true, play: true });
    const desk = stageFor(w, h);
    assert.equal(bandFor(stage.height), 1, `${w}x${h}`);
    assert.ok(Math.abs(stage.width - desk.width) < 1 && Math.abs(stage.height - desk.height) < 1, `${w}x${h}: ${stage.width} x ${stage.height}`);
  }
  setStage(1280, 720);
  assert.deepEqual([STAGE.band, STAGE.rise, MASCOT.x], [1, 0, 156]);
});

test('the sky band keeps its own units, and the HUD keeps clear of a notch', () => {
  const stage = stageFor(844, 291, { touch: true, play: true });
  setStage(stage.width, stage.height, { left: 100, right: 100, compact: true });
  const inner = (stage.width - 200) / STAGE.band;
  assert.equal(LANE.width, stage.width - 100 - LANE.x, 'notes still come in from the very edge');
  assert.ok(Math.abs(TITLE.x - (inner - 24)) < 1e-9);
  assert.ok(Math.abs(GAUGE.orbX - (inner - 44)) < 1e-9);
  // drawn, the orb is 44 band units from the first column the device keeps
  assert.ok(Math.abs(STAGE.left + GAUGE.orbX * STAGE.band - (stage.width - 100 - 44 * STAGE.band)) < 1e-6);
  // Yoru stands clear of the pause button, which ends 12 + 84 units in when played with fingers
  const yoru = MASCOT.x * STAGE.band;
  assert.ok(yoru - 0.5 * 170 * STAGE.band >= 96 + 10, `Yoru stands at ${yoru.toFixed(0)}`);
  assert.ok(TITLE.maxWidth > 400);
  setStage(1798, 720, { left: 100, right: 100 });
  assert.equal(STAGE.left, 100);
  assert.equal(LANE.width, 1798 - 100 - LANE.x);
  assert.equal(TITLE.x, 1798 - 200 - 24);
  assert.equal(GAUGE.orbX, 1798 - 200 - 44);
  setStage(1280, 720);
  assert.deepEqual([STAGE.left, STAGE.right, LANE.width], [0, 0, 1280 - LANE.x]);
});

test('the display is the drum: four equal zones, rim, face, face, rim', () => {
  const [kaLeft, donLeft, donRight, kaRight] = PADS;
  for (const width of [667, 844, 932, 1180, 1920]) {
    assert.equal(padForPoint(0, width), kaLeft);
    assert.equal(padForPoint(width * 0.25 - 1, width), kaLeft);
    assert.equal(padForPoint(width * 0.25 + 1, width), donLeft);
    assert.equal(padForPoint(width * 0.5 - 1, width), donLeft);
    assert.equal(padForPoint(width * 0.5 + 1, width), donRight);
    assert.equal(padForPoint(width * 0.75 - 1, width), donRight);
    assert.equal(padForPoint(width * 0.75 + 1, width), kaRight);
    assert.equal(padForPoint(width, width), kaRight, 'the last pixel is still the rim');
    // a finger that lands just off the glass, or on a second display
    assert.equal(padForPoint(-3, width), kaLeft);
    assert.equal(padForPoint(width + 40, width), kaRight);
    // each half is a hand, so two thumbs together play a big note
    assert.deepEqual([padForPoint(width * 0.3, width).hand, padForPoint(width * 0.7, width).hand], ['left', 'right']);
  }
  // on an iPhone the notch takes 47 px of each rim zone; what is left is wider than a thumb
  assert.ok(844 / 4 - 47 >= 160);
});

test('what hangs off the right edge follows the stage', () => {
  setStage(1318, 720);
  assert.equal(LANE.x + LANE.width, 1318, 'the lane reaches the right edge');
  assert.ok(GAUGE.x > TARGET.x + 40, 'the gauge never runs into the target');
  assert.equal(GAUGE.orbX, 1318 - 44);
  assert.equal(GAUGE.x + GAUGE.width, 1318 - 88);
  assert.equal(TITLE.x, 1318 - 24);
  assert.deepEqual([STAGE.top, STAGE.bottom], [0, 0]);
  setStage(1280, 800);
  assert.equal(STAGE.top + STAGE.bottom + STAGE.foot, 80, 'every extra row is given to something');
  assert.ok(STAGE.top > 0 && STAGE.bottom > 0);
  setStage(1280, 960);
  assert.equal(STAGE.top + STAGE.bottom + STAGE.foot, 240);
  assert.ok(STAGE.bottom <= 60, 'the festival picture is never zoomed past its width, which would crop the stalls');
  assert.ok(STAGE.foot > 0, 'the rest becomes the curtain under the plaza');
  setStage(1280, 720);
  assert.deepEqual([LANE.width, GAUGE.x, GAUGE.orbX, TITLE.x, STAGE.top, STAGE.bottom, STAGE.foot], [948, 478, 1236, 1256, 0, 0, 0]);
});

test('the festival picture keeps the dancers on the plaza and never slices the moon', async () => {
  globalThis.Image = class {};
  const { framePlate } = await import('../src/game/art/scenery.js');
  const PLAZA = 538;
  const MOON = { top: 80 - 58, bottom: 80 + 58 };
  for (const [width, height] of [[1280, 360], [1318.23, 360], [1500, 360], [1728, 360], [1280, 400], [1280, 420]]) {
    const frame = framePlate(width, height);
    const band = height / frame.zoom;
    assert.ok(frame.top >= 0 && frame.top + band <= 724.001, `${width}x${height}: the band stays inside the picture`);
    assert.ok(frame.left >= -0.001 && frame.left < 60, `${width}x${height}: the stalls at both ends are not cropped`);
    const feet = frame.top + (height - 22) / frame.zoom;
    assert.ok(feet >= PLAZA + 20, `${width}x${height}: feet at row ${Math.round(feet)} are on the plaza`);
    const sliced = frame.top > MOON.top && frame.top < MOON.bottom;
    assert.ok(!sliced || frame.hideMoon, `${width}x${height}: a sliced moon is hidden`);
    if (frame.top <= MOON.top - 4) assert.equal(frame.hideMoon, false, `${width}x${height}: a whole moon is kept`);
  }
});
