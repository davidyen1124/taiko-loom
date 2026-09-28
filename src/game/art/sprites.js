// Painted sprites. An atlas is one picture plus a list saying where each
// sprite sits in it and where its anchor is: the point that stays still when
// one pose is swapped for another (between the feet, or the centre of a note).
//
// Atlases are optional. Until one has loaded, or if it fails to load, the
// code-drawn figure is used instead, so the game never waits on a picture.
const BASE = import.meta.env?.BASE_URL ?? '/';
export const ATLASES = ['yoru', 'friends', 'notes', 'hud'];

const atlases = {};               // name -> { image, unit, sprites }
const listeners = new Set();
let loading = null;

function load(name) {
  if (typeof Image === 'undefined' || typeof fetch === 'undefined') return Promise.resolve();
  const folder = `${BASE}art/sprites/`;
  return fetch(`${folder}${name}.json`)
    .then(response => (response.ok ? response.json() : Promise.reject(new Error(`${name}: ${response.status}`))))
    .then(list => new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => { atlases[name] = { image, unit: list.unit, sprites: list.sprites }; resolve(); };
      image.onerror = () => reject(new Error(`${name}: picture missing`));
      image.src = `${folder}${list.image}`;
    }))
    .catch(() => {});             // the drawn version stays
}

export function loadSprites() {
  loading ||= Promise.all(ATLASES.map(load)).then(() => { for (const listener of listeners) listener(); });
  return loading;
}

// Calls back once the pictures are in, so a still canvas can repaint.
export function onSprites(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const hasSprite = (atlas, id) => Boolean(atlases[atlas]?.sprites[id]);

// The address and rectangle of a sprite, for use outside a canvas.
export function spriteBox(atlas, id) {
  const sheet = atlases[atlas];
  const entry = sheet?.sprites[id];
  return entry ? { ...entry, unit: sheet.unit, src: sheet.image.src, sheetWidth: sheet.image.naturalWidth, sheetHeight: sheet.image.naturalHeight } : null;
}

/**
 * Draws a sprite with its anchor at (x, y). `size` is how large one unit of
 * the atlas is drawn: for a character, its standing height.
 * Returns false when the sprite is not available, so the caller can draw its own.
 */
export function drawSprite(c, atlas, id, x, y, size, { alpha = 1, rotate = 0, stretchX = 1, stretchY = 1 } = {}) {
  const sheet = atlases[atlas];
  const entry = sheet?.sprites[id];
  if (!entry) return false;
  const scale = size / sheet.unit;
  c.save();
  c.translate(x, y);
  if (rotate) c.rotate(rotate);
  c.scale(scale * stretchX, scale * stretchY);
  if (alpha !== 1) c.globalAlpha *= alpha;
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.drawImage(sheet.image, entry.x, entry.y, entry.w, entry.h, -entry.ax, -entry.ay, entry.w, entry.h);
  c.restore();
  return true;
}

// Part of a sprite, given as fractions of its width: used to stretch the
// middle of a drumroll.
export function drawSlice(c, atlas, id, from, to, x, y, width, height) {
  const sheet = atlases[atlas];
  const entry = sheet?.sprites[id];
  if (!entry) return false;
  c.drawImage(sheet.image, entry.x + entry.w * from, entry.y, Math.max(1, entry.w * (to - from)), entry.h, x, y, width, height);
  return true;
}
