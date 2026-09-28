// The on-screen drum for touch devices: where it sits and what a touch means.
//
// The drum is painted from straight above and then tilted away from the
// player, so on screen its head is an ellipse. A touch on the skin is a don, a
// touch anywhere else (the rim, or the screen around the drum) is a ka, and
// the side of the screen says which hand played it.
//
// The whole head stays clear of the bottom edge. A phone keeps a strip there
// for its own gestures, and a drum that invites taps on that strip sends the
// player to the home screen in the middle of a song. Only the wooden body of
// the drum reaches the edge.
import { PADS } from './input.js';

export const SKIN = 0.69;         // the skin's share of the drum's width, as painted
const FLATTEST = 0.2;             // sideways: the head is never flatter than this, height to width
const ROUNDEST = 0.9;             // upright: nor rounder than this
const CLEAR = 16;                 // sideways: from the device's own strip up to the head
const CLEAR_UPRIGHT = 28;         // upright, where the browser's toolbar also lives at the bottom
const GAP = 6;                    // between the lane, or the stage, and the drum

const NONE = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * `width` and `height` are the window, in CSS pixels. `inset` is what the
 * device keeps for itself at each edge. Sideways, `laneBottom` is where the
 * note lane ends; upright, `stageBottom` is where the stage ends.
 *
 * Returns the ellipse of the whole head and of its skin, the thickness of the
 * barrel showing under the head, and `floor`, where the barrel ends.
 */
export function drumLayout(width, height, { upright = false, stageBottom = 0, laneBottom = height / 2, inset = NONE } = {}) {
  const wide = width - inset.left - inset.right;
  const cx = inset.left + wide / 2;
  if (upright) {
    // a rounder drum, whole, high in the space under the stage
    const top = stageBottom + GAP * 2;
    const room = Math.max(120, height - inset.bottom - CLEAR_UPRIGHT - top);
    const ry = Math.min(wide * 0.47 * ROUNDEST, room / 2.2);
    const rx = Math.min(wide * 0.47, ry / 0.55);
    const depth = ry * 0.2;
    const spare = Math.max(0, room - ry * 2 - depth);
    const cy = top + ry + spare * 0.3;
    return { cx, cy, rx, ry, depth, floor: cy + ry + depth, skin: { rx: rx * SKIN, ry: ry * SKIN } };
  }
  // sideways: between the lane and the strip the device keeps
  const depth = Math.min(18, Math.max(10, height * 0.035));
  const top = laneBottom + GAP;
  const low = height - inset.bottom - CLEAR - depth;
  const ry = Math.max(36, (low - top) / 2);
  const rx = Math.min(wide * 0.47, ry / FLATTEST);
  return { cx, cy: top + ry, rx, ry, depth, floor: height, skin: { rx: rx * SKIN, ry: ry * SKIN } };
}

export const onSkin = (x, y, drum) => ((x - drum.cx) / drum.skin.rx) ** 2 + ((y - drum.cy) / drum.skin.ry) ** 2 <= 1;

// The pad a touch plays: PADS is ka-left, don-left, don-right, ka-right.
export function padAt(x, y, drum) {
  const left = x < drum.cx;
  if (onSkin(x, y, drum)) return left ? PADS[1] : PADS[2];
  return left ? PADS[0] : PADS[3];
}

// The far edge of the drum at `x`, or null beside it. The festival friends
// line up along it, so they dance behind the drum instead of under it.
export function drumTopAt(x, drum) {
  const across = (x - drum.cx) / drum.rx;
  if (Math.abs(across) >= 1) return null;
  return drum.cy - drum.ry * Math.sqrt(1 - across * across);
}
