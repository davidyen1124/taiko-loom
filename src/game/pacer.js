// Keeps the game smooth on displays and devices it has never met.
//
// Two things are decided here. How many pixels to draw for each CSS pixel to
// begin with: a phone's display is denser than a moving picture needs, and
// every pixel is work and warmth. And when to draw fewer: the pacer watches
// how long frames take to arrive, and steps the picture down when they
// arrive late.

// Device pixels drawn for each CSS pixel, at most.
export const DENSEST = { mouse: 3, finger: 2 };

export function pixelRatio({ density = globalThis.devicePixelRatio || 1, finger = false } = {}) {
  return Math.min(density, finger ? DENSEST.finger : DENSEST.mouse);
}

// Shares of that density the picture can be stepped down to.
export const STEPS = [1, 0.8, 0.65, 0.5];

const FRAMES = 90;                // frames looked at before deciding
const REST = 45;                  // frames ignored after a change, while caches are rebuilt
const LATE = 21;                  // ms: on average, slower than 48 frames a second
const STALL = 250;                // ms: not a slow frame, but a pause, a hidden tab, a dialog

const median = values => [...values].sort((a, b) => a - b)[values.length >> 1];

// The gap that nearly every frame keeps, or null when frames come unevenly.
export function steady(gaps) {
  const middle = median(gaps);
  const near = gaps.filter(gap => Math.abs(gap - middle) <= Math.max(2.5, middle * 0.12)).length;
  return near >= gaps.length * 0.85 ? middle : null;
}

export class Pacer {
  constructor(step = 0, held = false) {
    this.step = step;             // index into STEPS
    this.gaps = [];
    this.rest = REST;
    this.rate = null;             // frames a second of a steady display, once known
    this.held = held;             // the display keeps its own, lower rate: nothing to gain
    this.trial = null;            // the smallest picture is being tried: { from, beat }
    this.climb = null;            // it helped, and larger ones are being tried: { to }
  }

  get quality() {
    return STEPS[this.step];
  }

  change(step) {
    this.step = step;
    this.rest = REST;
    return true;
  }

  // Takes the time since the frame before, in ms. Returns true when the
  // picture should be drawn at another size from now on.
  frame(gap) {
    if (!(gap > 0) || gap > STALL) { this.gaps = []; return false; }
    if (this.rest > 0) { this.rest--; return false; }
    this.gaps.push(gap);
    if (this.gaps.length < FRAMES) return false;
    const gaps = this.gaps;
    this.gaps = [];
    const beat = steady(gaps);
    const mean = gaps.reduce((sum, value) => sum + value, 0) / gaps.length;
    const late = (beat ?? mean) > LATE;
    const last = STEPS.length - 1;
    if (beat !== null) this.rate = Math.round(1000 / beat);

    if (this.trial) {
      const { from, beat: before } = this.trial;
      this.trial = null;
      if (beat !== null && Math.abs(beat - before) <= before * 0.1) {
        // A quarter of the pixels, and not a frame sooner. The display keeps
        // this rate by itself, as a phone that is saving power keeps 30
        // frames a second. The picture goes back to what it was.
        this.held = true;
        return this.change(from);
      }
      // It helped. The largest picture that still keeps up is looked for.
      if (!late && from + 1 < last) this.climb = { to: from + 1 };
      return late ? false : this.climbOn();
    }

    if (this.climb) {
      if (late) {
        // one step too far
        this.climb = null;
        return this.change(Math.min(last, this.step + 1));
      }
      return this.climbOn();
    }

    if (!late) { this.held = false; return false; }
    if (this.held || this.step >= last) return false;
    if (beat !== null) {
      // Steady, but slow. Every frame may be a little too much work, or the
      // display may be holding back. The smallest picture tells which.
      this.trial = { from: this.step, beat };
      return this.change(last);
    }
    return this.change(this.step + 1);
  }

  climbOn() {
    if (!this.climb || this.step <= this.climb.to) { this.climb = null; return false; }
    return this.change(this.step - 1);
  }
}

// What one song learned is kept for the next.
let learned = { step: 0, held: false };
let watching = null;
export const startPacer = () => { watching = new Pacer(learned.step, learned.held); return watching; };
export const keepPace = pacer => { learned = { step: pacer.step, held: pacer.held }; };

// For the frame meter: what the pacer has made of this device so far.
export const paceNow = () => (watching ? `picture ${Math.round(watching.quality * 100)}%${watching.held ? ' · display holds its own rate' : ''}` : '');
