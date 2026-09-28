// Small canvas helpers shared by every drawing module.

export const INK = '#1a1014';
export const CREAM = '#fff6e0';
export const CREAM_SHADE = '#ecd9b0';
export const DON = '#f2452b';
export const DON_DARK = '#c02c14';
export const DON_LIGHT = '#ff8466';
export const KA = '#4fc0d8';
export const KA_DARK = '#2590ab';
export const KA_LIGHT = '#9be6f2';
export const ROLL = '#ffc42e';
export const ROLL_DARK = '#e2930c';
export const ROLL_LIGHT = '#ffe38a';
export const BALLOON = '#ff8a2a';
export const GOLD = '#ffd54a';

export const FONT = '"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", "Arial Rounded MT Bold", system-ui, sans-serif';
export const DISPLAY = '"Dela Gothic One", "M PLUS Rounded 1c", "Hiragino Kaku Gothic ProN", sans-serif';

export const TAU = Math.PI * 2;
export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOut = t => 1 - (1 - clamp(t)) ** 3;
export const easeIn = t => clamp(t) ** 3;
export const easeInOut = t => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
// Overshoots past 1 and settles: the "pop" used by combo numbers and stamps.
export const easeBack = t => {
  const c = 1.70158 * 1.4;
  const p = clamp(t) - 1;
  return 1 + (c + 1) * p ** 3 + c * p ** 2;
};

export function disc(c, x, y, r, fill) {
  c.beginPath();
  c.arc(x, y, Math.max(0, r), 0, TAU);
  if (fill) { c.fillStyle = fill; c.fill(); }
}

export function ring(c, x, y, r, stroke, width) {
  c.beginPath();
  c.arc(x, y, Math.max(0, r), 0, TAU);
  c.strokeStyle = stroke;
  c.lineWidth = width;
  c.stroke();
}

export function ellipse(c, x, y, rx, ry, fill, stroke, width = 3, rotation = 0) {
  c.beginPath();
  c.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rotation, 0, TAU);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}

export function roundRect(c, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + radius, y);
  c.arcTo(x + w, y, x + w, y + h, radius);
  c.arcTo(x + w, y + h, x, y + h, radius);
  c.arcTo(x, y + h, x, y, radius);
  c.arcTo(x, y, x + w, y, radius);
  c.closePath();
}

export function box(c, x, y, w, h, r, fill, stroke, width = 3) {
  roundRect(c, x, y, w, h, r);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.lineJoin = 'round'; c.stroke(); }
}

export function path(c, points, { fill, stroke, width = 3, close = true } = {}) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  if (close) c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
}

export function line(c, x1, y1, x2, y2, stroke, width = 3, cap = 'round') {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = stroke;
  c.lineWidth = width;
  c.lineCap = cap;
  c.stroke();
}

// Makes text fit a width without distorting it: the size steps down to
// `minSize`, and only then is the end replaced by an ellipsis.
export function fitText(c, text, maxWidth, { size, minSize = size, weight = 900, family = FONT, spacing = 0 }) {
  if ('letterSpacing' in c) c.letterSpacing = `${spacing}px`;
  let fitted = size;
  const measure = value => { c.font = `${weight} ${fitted}px ${family}`; return c.measureText(value).width; };
  while (fitted > minSize && measure(text) > maxWidth) fitted = Math.max(minSize, fitted - 1);
  let shown = text;
  if (measure(shown) > maxWidth) {
    const letters = [...text];
    while (letters.length > 1 && measure(`${letters.join('').trimEnd()}…`) > maxWidth) letters.pop();
    shown = `${letters.join('').trimEnd()}…`;
  }
  if ('letterSpacing' in c) c.letterSpacing = '0px';
  return { text: shown, size: fitted, shortened: shown !== text };
}

// Text with a solid outline behind it, the signature look of arcade HUDs.
// With `maxWidth`, text that is too long is squeezed; pass `minSize` as well
// to shrink and then shorten it instead, which keeps the letters in shape.
export function label(c, text, x, y, {
  size = 24, weight = 900, family = FONT, fill = '#fff', stroke = INK, width = 6,
  align = 'left', baseline = 'alphabetic', spacing = 0, shadow = 0, shadowColor = INK, maxWidth, minSize,
} = {}) {
  if (maxWidth && minSize) {
    const fitted = fitText(c, text, maxWidth, { size, minSize, weight, family, spacing });
    text = fitted.text;
    width *= fitted.size / size;
    size = fitted.size;
    maxWidth = undefined;
  }
  c.font = `${weight} ${size}px ${family}`;
  c.textAlign = align;
  c.textBaseline = baseline;
  c.lineJoin = 'round';
  c.miterLimit = 2;
  if ('letterSpacing' in c) c.letterSpacing = `${spacing}px`;
  let scale = 1;
  if (maxWidth) {
    const measured = c.measureText(text).width;
    if (measured > maxWidth) scale = maxWidth / measured;
  }
  c.save();
  c.translate(x, y);
  if (scale !== 1) c.scale(scale, 1);
  if (shadow) {
    c.strokeStyle = shadowColor;
    c.fillStyle = shadowColor;
    c.lineWidth = width;
    if (width) c.strokeText(text, 0, shadow);
    c.fillText(text, 0, shadow);
  }
  if (stroke && width) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.strokeText(text, 0, 0);
  }
  c.fillStyle = fill;
  c.fillText(text, 0, 0);
  c.restore();
  if ('letterSpacing' in c) c.letterSpacing = '0px';
}

export function vertical(c, y1, y2, stops) {
  const gradient = c.createLinearGradient(0, y1, 0, y2);
  stops.forEach(([at, color]) => gradient.addColorStop(at, color));
  return gradient;
}

export function radial(c, x, y, r, stops, inner = 0) {
  const gradient = c.createRadialGradient(x, y, inner, x, y, r);
  stops.forEach(([at, color]) => gradient.addColorStop(at, color));
  return gradient;
}

// A star / spark with `points` tips.
export function star(c, x, y, outer, inner, points, rotation = -Math.PI / 2) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = rotation + (i * Math.PI) / points;
    c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.closePath();
}

// Deterministic pseudo-random numbers, so scenery looks the same every run.
export function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Paints once into an off-screen canvas at device resolution and reuses it.
const cache = new Map();
export function sprite(key, width, height, scale, paint) {
  const id = `${key}@${scale.toFixed(3)}`;
  let entry = cache.get(id);
  if (!entry) {
    const canvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(Math.ceil(width * scale), Math.ceil(height * scale))
      : Object.assign(document.createElement('canvas'), { width: Math.ceil(width * scale), height: Math.ceil(height * scale) });
    const context = canvas.getContext('2d');
    context.scale(scale, scale);
    paint(context, width, height);
    entry = { canvas, width, height };
    cache.set(id, entry);
    if (cache.size > 160) cache.delete(cache.keys().next().value);
  }
  return entry;
}

export function stamp(c, entry, x, y, width = entry.width, height = entry.height) {
  c.drawImage(entry.canvas, x, y, width, height);
}

export function clearSprites() {
  cache.clear();
}
