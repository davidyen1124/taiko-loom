// The on-screen drum for touch devices: where it sits and what a touch means.
//
// The drum is drawn from straight above and then tilted away from the player,
// so on screen its head is an ellipse. A touch on the skin is a don, a touch
// anywhere else (the rim, or the screen around the drum) is a ka, and the side
// of the screen says which hand played it.
import { PADS } from './input.js';

export const SKIN = 0.69;         // the skin's share of the drum's width, as painted
const TILT = 0.6;                 // height of the tilted head, as a share of its width
const DEPTH = 0.09;               // thickness of the barrel showing under the head

/**
 * `width` and `height` are the window; `stageBottom` is where the stage ends
 * when the device is held upright and the stage only fills the top.
 * Returns the ellipse of the whole head and of its skin, in window pixels.
 */
export function drumLayout(width, height, { upright = false, stageBottom = 0 } = {}) {
  if (upright) {
    // room to spare: a rounder drum, whole, in the space under the stage
    const room = Math.max(120, height - stageBottom);
    const margin = room * 0.04;
    const fits = (room - margin * 2) / (2 + DEPTH * 2.2);        // the tallest half-height that fits, barrel included
    const ry = Math.min(width * 0.47 * 0.86, fits);
    const rx = Math.min(width * 0.47, ry / 0.55);
    const depth = ry * DEPTH * 2.2;
    const spare = room - margin * 2 - ry * 2 - depth;
    const cy = stageBottom + margin + spare * 0.4 + ry;
    return { cx: width / 2, cy, rx, ry, depth, skin: { rx: rx * SKIN, ry: ry * SKIN } };
  }
  // sideways: the drum rises from the bottom edge and stays clear of the lane
  const rx = Math.min(width * 0.46, height * 1.25);
  const ry = rx * TILT;
  const shown = Math.min(height * 0.44, ry * 0.8);       // how much of it stands above the bottom edge
  const cy = height - shown + ry;
  return { cx: width / 2, cy, rx, ry, depth: ry * DEPTH, skin: { rx: rx * SKIN, ry: ry * SKIN } };
}

export const onSkin = (x, y, drum) => ((x - drum.cx) / drum.skin.rx) ** 2 + ((y - drum.cy) / drum.skin.ry) ** 2 <= 1;

// The pad a touch plays: PADS is ka-left, don-left, don-right, ka-right.
export function padAt(x, y, drum) {
  const left = x < drum.cx;
  if (onSkin(x, y, drum)) return left ? PADS[1] : PADS[2];
  return left ? PADS[0] : PADS[3];
}

// The top edge of the drum at `x`, or null beside it. The festival friends
// line up along it, so they dance behind the drum instead of under it.
export function drumTopAt(x, drum) {
  const across = (x - drum.cx) / drum.rx;
  if (Math.abs(across) >= 1) return null;
  return drum.cy - drum.ry * Math.sqrt(1 - across * across);
}
