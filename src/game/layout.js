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
// A phone on its side is wider than any desktop window, and wider still while
// its browser shows its bars.
export const WIDEST_TOUCH = 3.4;

// A phone on its side is wide and low. Played with fingers, the play screen may
// be as short as `height` rows, which draws the lane larger than the design
// grid would. The festival gives up rows first, then the sky band is drawn
// smaller: never smaller than `band`.
export const TOUCH_STAGE = { height: 560, band: 0.6 };

// Live size of the stage, and where rows added by a tall window went:
// `top` to the sky band, `bottom` to the festival, `foot` to the curtain
// under the plaza. `left` and `right` are columns the device keeps for itself
// (a notch, rounded corners): pictures run under them, the HUD stays clear.
// `band` is the size the sky band is drawn at, and `rise` how many rows the
// lane and the festival move up because of it.
export const STAGE = { width: SAFE.width, height: SAFE.height, top: 0, bottom: 0, foot: 0, left: 0, right: 0, band: 1, rise: 0 };

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

// The size the sky band is drawn at on a touch stage of the given height.
export const bandFor = height => Math.min(1, Math.max(TOUCH_STAGE.band, TOUCH_STAGE.band + (height - TOUCH_STAGE.height) / TOP_HEIGHT));

const round = value => Math.round(value * 100) / 100;

// The stage that fills a window of the given size. `touch` says the device is
// played with fingers, `play` that it is for the play screen. The game is played
// sideways: a phone or tablet held upright gets `upright`, and is asked to turn.
export function stageFor(windowWidth, windowHeight, { touch = false, play = false } = {}) {
  const w = Math.max(1, windowWidth);
  const h = Math.max(1, windowHeight);
  // The stage takes the exact shape of the window, so not even one pixel is left over.
  const shape = Math.min(touch ? WIDEST_TOUCH : WIDEST, Math.max(TALLEST, w / h));
  const compact = touch && play;
  const least = compact ? TOUCH_STAGE.height : SAFE.height;
  const wide = shape >= SAFE.width / least;
  const width = wide ? round(least * shape) : SAFE.width;
  const height = wide ? least : round(SAFE.width / shape);
  return { width, height, scale: Math.min(w / width, h / height), upright: touch && h > w, compact };
}

// Applies a stage size. Positions that hang off the right edge follow it.
// `left` and `right` are columns kept clear of the HUD, in stage units. The
// HUD is drawn from `left`, so its positions are measured from there, and the
// sky band's in its own units: stage units divided by `band`.
export function setStage(width, height, { left = 0, right = 0, compact = false } = {}) {
  const band = compact ? bandFor(height) : 1;
  const rise = TOP_HEIGHT * (1 - band);
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
  STAGE.band = band;
  STAGE.rise = rise;
  const inner = (width - left - right) / band;
  LANE.width = width - left - LANE.x;          // notes come in from the very edge of the display
  GAUGE.x = inner - 802;
  GAUGE.orbX = inner - 44;
  TITLE.x = inner - 24;
  // played with fingers the pause button is finger sized, and Yoru stands clear of it
  MASCOT.x = compact ? 110 / band + 85 : 156;
  TITLE.maxWidth = Math.min(900, inner - 424 - MASCOT.x);
  return STAGE;
}
