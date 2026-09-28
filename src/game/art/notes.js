// Note artwork. Notes are drawn as little drum heads seen from above:
// a cream skin rim around a lacquered face with a painted swirl.
import {
  BALLOON, CREAM, CREAM_SHADE, DON, DON_DARK, DON_LIGHT, INK, KA, KA_DARK, KA_LIGHT, ROLL, ROLL_DARK, ROLL_LIGHT,
  TAU, disc, ring, sprite, stamp,
} from './draw.js';

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

export function noteSprite(type, scale) {
  const r = radiusOf(type);
  const size = r * 2 + 8;
  return sprite(`note-${type}`, size, size, scale, c => paintHead(c, size / 2, size / 2, r, faceOf(type)));
}

export function drawNote(c, type, x, y, scale, alpha = 1, zoom = 1) {
  const entry = noteSprite(type, scale);
  const w = entry.width * zoom;
  if (alpha !== 1) c.globalAlpha = alpha;
  stamp(c, entry, x - w / 2, y - w / 2, w, w);
  if (alpha !== 1) c.globalAlpha = 1;
}

// A drumroll: head, a long band, and a rounded tail.
export function drawRoll(c, type, x, endX, y, scale) {
  const r = radiusOf(type);
  const band = r - 3;
  const [base, dark, light] = FACES.roll;
  const tail = Math.max(endX, x);
  c.save();
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
  c.restore();
  drawNote(c, type, x, y, scale);
}

// A balloon note: a drum head towing a paper balloon.
export function drawBalloon(c, x, y, scale, puff = 0) {
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
  const grow = 1 + puff * 0.25;
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
