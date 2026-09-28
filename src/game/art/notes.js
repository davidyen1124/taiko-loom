// Note artwork. Notes are little drum heads seen from above: a cream skin
// rim around a lacquered face with a swirl crest. They are painted (see
// docs/art); the ones drawn in code here stand in while the pictures load.
import {
  BALLOON, CREAM, CREAM_SHADE, DON, DON_DARK, DON_LIGHT, INK, KA, KA_DARK, KA_LIGHT, ROLL, ROLL_DARK, ROLL_LIGHT,
  TAU, disc, ring, sprite, stamp, vertical,
} from './draw.js';
import { drawSprite, hasSprite } from './sprites.js';

export const SMALL = 34;
export const BIG = 51;

const FACES = {
  don: [DON, DON_DARK, DON_LIGHT],
  ka: [KA, KA_DARK, KA_LIGHT],
  roll: [ROLL, ROLL_DARK, ROLL_LIGHT],
  balloon: [BALLOON, '#d9600c', '#ffc07a'],
};

export const faceOf = type => (
  type === 'ka' || type === 'bigKa' ? 'ka'
    : type === 'roll' || type === 'bigRoll' ? 'roll'
      : type === 'balloon' ? 'balloon' : 'don'
);
export const radiusOf = type => (type === 'bigDon' || type === 'bigKa' || type === 'bigRoll' ? BIG : SMALL);

function paintHead(c, x, y, r, face) {
  const [base, dark, light] = FACES[face];
  const rim = r * 0.26;
  disc(c, x, y, r, INK);
  disc(c, x, y, r - 3, CREAM);
  // Shaded underside of the skin rim.
  c.save();
  c.beginPath(); c.arc(x, y, r - 3, 0, TAU); c.clip();
  disc(c, x, y + r * 0.2, r - 3, CREAM_SHADE);
  disc(c, x, y - r * 0.08, r - 3.5, CREAM);
  c.restore();

  const inner = r - 3 - rim;
  disc(c, x, y, inner + 2.5, INK);
  c.save();
  c.beginPath(); c.arc(x, y, inner, 0, TAU); c.clip();
  disc(c, x, y, inner, dark);
  disc(c, x, y - inner * 0.14, inner * 0.98, base);
  // Painted swirl, the way festival drums carry a tomoe crest.
  c.lineCap = 'round';
  c.strokeStyle = dark;
  c.lineWidth = inner * 0.2;
  c.globalAlpha = 0.55;
  c.beginPath(); c.arc(x, y + inner * 0.02, inner * 0.46, Math.PI * 0.15, Math.PI * 1.2); c.stroke();
  c.globalAlpha = 1;
  disc(c, x + inner * 0.41, y + inner * 0.23, inner * 0.17, dark);
  c.globalAlpha = 0.55;
  disc(c, x + inner * 0.41, y + inner * 0.23, inner * 0.17, dark);
  c.globalAlpha = 1;
  // Lacquer highlight.
  c.strokeStyle = light;
  c.lineWidth = inner * 0.13;
  c.globalAlpha = 0.9;
  c.beginPath(); c.arc(x, y, inner * 0.74, Math.PI * 1.12, Math.PI * 1.55); c.stroke();
  c.globalAlpha = 1;
  disc(c, x - inner * 0.2, y - inner * 0.72, inner * 0.075, light);
  c.restore();
}

// Each note is scaled once to the size it is shown at and kept, so a lane
// full of notes costs no more than copying small pictures.
export function noteSprite(type, scale) {
  const r = radiusOf(type);
  const size = r * 2 + 8;
  const face = faceOf(type);
  const painted = hasSprite('notes', face);
  return sprite(`note-${type}-${painted ? 'painted' : 'drawn'}`, size, size, scale, c => {
    if (!painted || !drawSprite(c, 'notes', face, size / 2, size / 2, r * 2)) paintHead(c, size / 2, size / 2, r, face);
  });
}

export function drawNote(c, type, x, y, scale, alpha = 1, zoom = 1) {
  const entry = noteSprite(type, scale);
  const w = entry.width * zoom;
  if (alpha !== 1) c.globalAlpha = alpha;
  stamp(c, entry, x - w / 2, y - w / 2, w, w);
  if (alpha !== 1) c.globalAlpha = 1;
}

// The band of a drumroll, painted to match the roll note: dark outline, cream
// rim, golden face. Proportions and colours are measured from the note.
function paintedBand(c, x, tail, y, r) {
  const layers = [
    [r, INK],
    [r * 0.93, vertical(c, y - r, y + r, [[0, '#fffaec'], [0.6, '#fdeecc'], [1, '#e2c49a']])],
    [r * 0.765, INK],
    [r * 0.74, vertical(c, y - r * 0.74, y + r * 0.74, [[0, '#ffdf3c'], [0.45, '#fecb0b'], [1, '#f8a400']])],
  ];
  c.lineCap = 'round';
  for (const [half, paint] of layers) {
    c.strokeStyle = paint;
    c.lineWidth = half * 2;
    c.beginPath(); c.moveTo(x, y); c.lineTo(tail, y); c.stroke();
  }
  // gloss along the top of the face
  c.strokeStyle = 'rgba(255, 246, 190, .8)';
  c.lineWidth = Math.max(2.5, r * 0.11);
  c.beginPath(); c.moveTo(x + r * 0.9, y - r * 0.5); c.lineTo(Math.max(x + r * 0.9, tail - r * 0.1), y - r * 0.5); c.stroke();
}

// A drumroll: head, a long band, and a rounded tail.
export function drawRoll(c, type, x, endX, y, scale) {
  const r = radiusOf(type);
  const tail = Math.max(endX, x);
  c.save();
  if (hasSprite('notes', 'roll')) {
    paintedBand(c, x, tail, y, r);
  } else {
    const band = r - 3;
    const [base, dark, light] = FACES.roll;
    c.lineCap = 'round';
    c.strokeStyle = INK;
    c.lineWidth = band * 2 + 6;
    c.beginPath(); c.moveTo(x, y); c.lineTo(tail, y); c.stroke();
    c.strokeStyle = dark;
    c.lineWidth = band * 2;
    c.beginPath(); c.moveTo(x, y); c.lineTo(tail, y); c.stroke();
    c.strokeStyle = base;
    c.lineWidth = band * 2 - 8;
    c.beginPath(); c.moveTo(x, y - 3); c.lineTo(tail, y - 3); c.stroke();
    c.strokeStyle = light;
    c.lineWidth = Math.max(3, band * 0.2);
    c.globalAlpha = 0.85;
    c.beginPath(); c.moveTo(x + r, y - band * 0.55); c.lineTo(Math.max(x + r, tail - 4), y - band * 0.55); c.stroke();
  }
  c.restore();
  drawNote(c, type, x, y, scale);
}

// A balloon note: a drum head towing a balloon.
export function drawBalloon(c, x, y, scale, puff = 0) {
  const grow = 1 + puff * 0.25;
  if (hasSprite('notes', 'float')) {
    // the painted balloon hangs knot down; turned a quarter it trails the note
    const wide = 70 * grow;
    const entry = sprite(`balloon-painted-${Math.round(grow * 20)}`, wide * 1.6, wide * 1.6, scale, (b, w, h) => {
      b.translate(w / 2, h / 2);
      b.rotate(Math.PI / 2);
      drawSprite(b, 'notes', 'float', 0, 0, wide);
    });
    stamp(c, entry, x + SMALL - 12 + wide * 0.78 - entry.width / 2, y - entry.height / 2);
    drawNote(c, 'balloon', x, y, scale);
    return;
  }
  const entry = sprite('balloon-tail', 120, 80, scale, (b, w, h) => {
    const cy = h / 2;
    b.lineCap = 'round';
    b.strokeStyle = INK; b.lineWidth = 3;
    b.beginPath(); b.moveTo(0, cy); b.quadraticCurveTo(14, cy + 8, 26, cy); b.stroke();
    // knot
    b.beginPath(); b.moveTo(24, cy - 6); b.lineTo(34, cy); b.lineTo(24, cy + 6); b.closePath();
    b.fillStyle = '#ff5f7e'; b.fill(); b.stroke();
    // body
    b.beginPath(); b.ellipse(72, cy, 42, 32, 0, 0, TAU);
    b.fillStyle = '#ff5f7e'; b.fill(); b.stroke();
    b.save(); b.clip();
    b.fillStyle = '#ffd34f'; b.fillRect(58, 0, 12, h);
    b.fillStyle = '#4fc0d8'; b.fillRect(84, 0, 12, h);
    b.fillStyle = 'rgba(26,16,20,.16)'; b.beginPath(); b.ellipse(74, cy + 22, 44, 20, 0, 0, TAU); b.fill();
    b.restore();
    b.beginPath(); b.ellipse(72, cy, 42, 32, 0, 0, TAU); b.stroke();
    b.strokeStyle = '#fff'; b.lineWidth = 4; b.globalAlpha = 0.85;
    b.beginPath(); b.ellipse(72, cy, 32, 23, 0, Math.PI * 1.1, Math.PI * 1.45); b.stroke();
  });
  stamp(c, entry, x + SMALL - 6, y - (entry.height * grow) / 2, entry.width * grow, entry.height * grow);
  drawNote(c, 'balloon', x, y, scale);
}

// The target the notes scroll into.
export function drawTarget(c, x, y, flash, kind, gogo) {
  c.save();
  disc(c, x, y, BIG + 2, 'rgba(255,255,255,.05)');
  ring(c, x, y, BIG + 1, gogo ? 'rgba(255,214,120,.75)' : 'rgba(255,255,255,.28)', 2.5);
  disc(c, x, y, SMALL, 'rgba(255,255,255,.1)');
  ring(c, x, y, SMALL, gogo ? '#ffe9a8' : 'rgba(255,255,255,.72)', 3.5);
  ring(c, x, y, SMALL - 9, 'rgba(255,255,255,.22)', 2);
  if (flash > 0) {
    const color = kind === 'ka' ? KA_LIGHT : DON_LIGHT;
    c.globalAlpha = flash * 0.8;
    disc(c, x, y, SMALL - 2, color);
    c.globalAlpha = flash;
    ring(c, x, y, SMALL, '#fff', 4);
  }
  c.restore();
}
