// Every position on the play screen, in stage units. The stage is always
// 1280 x 720 and is scaled as a whole to fit the window.
export const STAGE = { width: 1280, height: 720 };

export const TOP_HEIGHT = 184;

// The black band that frames the player panel, the lane and the syllable strip.
export const FRAME = { y: 184, height: 176 };

export const PANEL = { x: 0, y: 192, width: 328, height: 160 };

export const LANE = {
  x: 332, y: 192, width: 948, height: 130,
  stripY: 326, stripHeight: 26,
};

export const TARGET = { x: 413, y: 257 };

export const DRUM = { x: 252, y: 274, radius: 62 };

export const GAUGE = { x: 478, y: 138, width: 714, height: 24, tall: 46, segments: 50, orbX: 1236, orbY: 150, orbRadius: 29 };

export const SCENE_Y = 360;
export const GROUND_Y = SCENE_Y + 338;

export const MASCOT = { x: 156, y: 187, size: 0.74 };

export const TITLE = { x: 1256, y: 64, maxWidth: 700 };

// How far a note travels per beat, in stage units, at 1x speed. A measure is
// 1000 units, so quarter-beat notes overlap slightly: the classic dense look.
export const BEAT_WIDTH = 250;
