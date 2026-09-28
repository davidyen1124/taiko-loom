import test from 'node:test';
import assert from 'node:assert/strict';
import { GAUGE, LANE, SAFE, STAGE, TARGET, TITLE, setStage, stageFor } from '../src/game/layout.js';

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

test('a phone held upright keeps the design grid and says so', () => {
  const stage = stageFor(375, 812);
  assert.deepEqual([stage.width, stage.height, stage.upright], [1280, 720, true]);
  assert.ok(Math.abs(stage.scale - 375 / 1280) < 1e-9);
  assert.equal(stageFor(844, 390).upright, false);
  // a tablet is wider than a phone, but held upright it needs the room for its drum too
  assert.equal(stageFor(820, 1180).upright, false, 'a tall desktop window keeps its stage');
  assert.equal(stageFor(820, 1180, { touch: true }).upright, true);
  assert.equal(stageFor(1180, 820, { touch: true }).upright, false);
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
