// Every position on the play screen, in stage units.
//
// The design grid is 1280 x 720. The stage is never letterboxed: it grows to
// fill the window. A wider window adds columns on the right (the lane gets
// longer), a taller one adds rows above and below. Everything is then scaled
// as a whole, so proportions stay the same at any size.

export const SAFE = { width: 1280, height: 720 };

// Beyond these shapes the window is padded rather than stretched further.
export const WIDEST = 2.4;          // a little past 21:9
export const TALLEST = 4 / 3;

// Live size of the stage, and where rows added by a tall window went:
// `top` to the sky band, `bottom` to the festival, `foot` to the curtain
// under the plaza.
export const STAGE = { width: SAFE.width, height: SAFE.height, top: 0, bottom: 0, foot: 0 };

export const TOP_HEIGHT = 184;

// The black band that frames the player panel, the lane and the syllable strip.
export const FRAME = { y: 184, height: 176 };

export const PANEL = { x: 0, y: 192, width: 328, height: 160 };

export const LANE = {
  x: 332, y: 192, width: SAFE.width - 332, height: 130,
  stripY: 326, stripHeight: 26,
};

export const TARGET = { x: 413, y: 257 };

export const DRUM = { x: 252, y: 274, radius: 62 };

// Anchored to the right edge of the stage.
export const GAUGE = { x: 478, y: 138, width: 714, height: 24, tall: 46, segments: 50, orbX: 1236, orbY: 150, orbRadius: 29 };

export const SCENE_Y = 360;

// Sized so the leaf on Yoru's head stays on screen at the top of a jump.
export const MASCOT = { x: 156, y: 187, size: 0.7, jump: 20 };

export const TITLE = { x: 1256, y: 64, maxWidth: 700 };

// How far a note travels per beat, in stage units, at 1x speed. A measure is
// 1000 units, so quarter-beat notes overlap slightly: the classic dense look.
export const BEAT_WIDTH = 250;

// The stage that fills a window of the given size.
export function stageFor(windowWidth, windowHeight) {
  const w = Math.max(1, windowWidth);
  const h = Math.max(1, windowHeight);
  // A phone held upright: the stage sits at the top and the drum zones take the rest.
  if (w < 700 && h > w * 1.2) {
    return { width: SAFE.width, height: SAFE.height, scale: w / SAFE.width, upright: true };
  }
  // The stage takes the window's exact shape, so not even one pixel is left over.
  const shape = Math.min(WIDEST, Math.max(TALLEST, w / h));
  const wide = shape >= SAFE.width / SAFE.height;
  const width = wide ? Math.round(SAFE.height * shape * 100) / 100 : SAFE.width;
  const height = wide ? SAFE.height : Math.round((SAFE.width / shape) * 100) / 100;
  return { width, height, scale: Math.min(w / width, h / height), upright: false };
}

// Applies a stage size. Positions that hang off the right edge follow it.
export function setStage(width, height) {
  const extra = Math.max(0, height - SAFE.height);
  // The festival picture has about 60 rows to spare at full width. It is never
  // zoomed to fill more, because that would crop the stalls at both ends.
  const bottom = Math.round(Math.min(extra * 0.5, 60));
  const top = Math.round((extra - bottom) * 0.5);
  STAGE.width = width;
  STAGE.height = height;
  STAGE.bottom = bottom;
  STAGE.top = top;
  STAGE.foot = extra - bottom - top;
  LANE.width = width - LANE.x;
  GAUGE.x = width - 802;
  GAUGE.orbX = width - 44;
  TITLE.x = width - 24;
  TITLE.maxWidth = Math.min(900, width - 580);
  return STAGE;
}
