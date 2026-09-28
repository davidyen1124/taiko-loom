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
// With the touch drum docked under it the stage is shorter, so it may be wider.
export const WIDEST_DOCKED = 2.9;

// Live size of the stage, and where rows added by a tall window went:
// `top` to the sky band, `bottom` to the festival, `foot` to the curtain
// under the plaza. `left` and `right` are columns the device keeps for itself
// (a notch, rounded corners): pictures run under them, the HUD stays clear.
export const STAGE = { width: SAFE.width, height: SAFE.height, top: 0, bottom: 0, foot: 0, left: 0, right: 0 };

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

// How much of a sideways window is kept free under the stage while the touch
// drum is on screen: the strip the device keeps for itself, and a little more.
export const reserveFor = (windowHeight, inset = 0) => Math.round(inset + Math.min(40, Math.max(26, windowHeight * 0.08)));

// The stage that fills a window of the given size. `touch` says the device is
// played with fingers, as a tablet is. `reserve` is the height kept free under
// the stage; the stage then sits at the top of the window.
export function stageFor(windowWidth, windowHeight, { touch = false, reserve = 0 } = {}) {
  const w = Math.max(1, windowWidth);
  const h = Math.max(1, windowHeight);
  // A phone or tablet held upright: the stage sits at the top and the drum takes the rest.
  if ((w < 700 || touch) && h > w * 1.2) {
    return { width: SAFE.width, height: SAFE.height, scale: w / SAFE.width, upright: true, docked: false };
  }
  // The stage takes the exact shape of the room it has, so not even one pixel is left over.
  const room = Math.max(1, h - reserve);
  const shape = Math.min(reserve ? WIDEST_DOCKED : WIDEST, Math.max(TALLEST, w / room));
  const wide = shape >= SAFE.width / SAFE.height;
  const width = wide ? Math.round(SAFE.height * shape * 100) / 100 : SAFE.width;
  const height = wide ? SAFE.height : Math.round((SAFE.width / shape) * 100) / 100;
  return { width, height, scale: Math.min(w / width, room / height), upright: false, docked: reserve > 0 };
}

// Applies a stage size. Positions that hang off the right edge follow it.
// `left` and `right` are columns kept clear of the HUD, in stage units. The
// HUD is drawn from `left`, so its positions are measured from there.
export function setStage(width, height, { left = 0, right = 0 } = {}) {
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
  STAGE.left = left;
  STAGE.right = right;
  const inner = width - left - right;
  LANE.width = width - left - LANE.x;          // notes come in from the very edge of the display
  GAUGE.x = inner - 802;
  GAUGE.orbX = inner - 44;
  TITLE.x = inner - 24;
  TITLE.maxWidth = Math.min(900, inner - 580);
  return STAGE;
}
