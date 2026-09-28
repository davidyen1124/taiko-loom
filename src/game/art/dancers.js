// The festival crowd. Five folk-craft friends join the dance one by one as the
// soul gauge fills: a daruma doll, a paper lantern, a fox, a lucky cat and a
// stack of rice cakes.
import { CREAM, DON, INK, TAU, clamp, disc, easeBack, ellipse, line, path, sprite, stamp } from './draw.js';

const SIZE = { width: 130, height: 150 };

function face(c, x, y, { gap = 15, eye = 5, smile = 9, blush = true } = {}) {
  disc(c, x - gap, y, eye, INK); disc(c, x + gap, y, eye, INK);
  disc(c, x - gap - 1.5, y - 1.5, eye * 0.36, '#fff'); disc(c, x + gap - 1.5, y - 1.5, eye * 0.36, '#fff');
  c.strokeStyle = INK; c.lineWidth = 3.5; c.lineCap = 'round';
  c.beginPath(); c.arc(x, y + 5, smile, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
  if (blush) {
    c.globalAlpha = 0.7;
    ellipse(c, x - gap - 10, y + 9, 7, 4.5, '#ff8f7a'); ellipse(c, x + gap + 10, y + 9, 7, 4.5, '#ff8f7a');
    c.globalAlpha = 1;
  }
}

function feet(c, x, y, spread = 22, color = INK) {
  ellipse(c, x - spread, y, 14, 8, color, INK, 3.5);
  ellipse(c, x + spread, y, 14, 8, color, INK, 3.5);
}

function fan(c, x, y, rotation, color) {
  c.save();
  c.translate(x, y); c.rotate(rotation);
  line(c, 0, 0, 0, 22, INK, 7); line(c, 0, 0, 0, 22, '#f1cf96', 3);
  c.beginPath(); c.moveTo(0, 2); c.arc(0, 2, 27, Math.PI * 1.12, Math.PI * 1.88); c.closePath();
  c.fillStyle = '#fff6e0'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3.5; c.lineJoin = 'round'; c.stroke();
  disc(c, 0, -14, 7, color);
  c.restore();
}

const PAINTERS = {
  daruma(c) {
    feet(c, 65, 140, 22, '#8f2418');
    ellipse(c, 65, 86, 52, 56, DON, INK, 4.5);
    ellipse(c, 65, 72, 37, 33, CREAM, INK, 3.5);
    // brows and whiskers
    c.strokeStyle = INK; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(38, 54); c.quadraticCurveTo(48, 46, 58, 54); c.stroke();
    c.beginPath(); c.moveTo(72, 54); c.quadraticCurveTo(82, 46, 92, 54); c.stroke();
    face(c, 65, 70, { gap: 16, eye: 5.5, smile: 8 });
    c.strokeStyle = '#ffd34f'; c.lineWidth = 4;
    c.beginPath(); c.arc(65, 116, 17, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    c.beginPath(); c.arc(65, 126, 26, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
    fan(c, 118, 70, 0.5, DON);
  },
  lantern(c) {
    feet(c, 65, 140, 18, '#3a2a20');
    line(c, 65, 6, 65, 22, INK, 4);
    path(c, [[48, 22], [82, 22], [86, 32], [44, 32]], { fill: INK });
    ellipse(c, 65, 84, 48, 54, '#fff1cf', INK, 4.5);
    c.save();
    c.beginPath(); c.ellipse(65, 84, 46, 52, 0, 0, TAU); c.clip();
    c.strokeStyle = 'rgba(214,150,70,.55)'; c.lineWidth = 2.5;
    for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(65, 84, 48, 8 + i * 9.5, 0, 0, TAU); c.stroke(); }
    c.fillStyle = 'rgba(255,196,46,.3)'; c.fillRect(0, 96, 130, 60);
    c.restore();
    path(c, [[44, 134], [86, 134], [82, 144], [48, 144]], { fill: INK });
    face(c, 65, 78, { gap: 17, eye: 5.5, smile: 10 });
    c.fillStyle = DON;
    c.font = '900 22px "Dela Gothic One", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('祭', 65, 116);
  },
  fox(c) {
    // tail
    c.save(); c.translate(100, 110); c.rotate(-0.5);
    ellipse(c, 14, 0, 30, 16, '#fff', INK, 4); ellipse(c, 32, 0, 12, 10, '#ffb03a');
    c.restore();
    feet(c, 65, 140, 20, '#fff');
    ellipse(c, 65, 108, 36, 34, '#fff', INK, 4.5);
    path(c, [[40, 96], [65, 122], [90, 96], [84, 86], [46, 86]], { fill: '#d8341e', stroke: INK, width: 3.5 });
    // ears
    path(c, [[24, 50], [30, 10], [58, 34]], { fill: '#fff', stroke: INK, width: 4.5 });
    path(c, [[106, 50], [100, 10], [72, 34]], { fill: '#fff', stroke: INK, width: 4.5 });
    path(c, [[33, 40], [34, 22], [48, 34]], { fill: '#ff8f7a' });
    path(c, [[97, 40], [96, 22], [82, 34]], { fill: '#ff8f7a' });
    ellipse(c, 65, 60, 46, 36, '#fff', INK, 4.5);
    // painted markings
    c.strokeStyle = '#d8341e'; c.lineWidth = 4.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(34, 50); c.quadraticCurveTo(44, 42, 54, 48); c.stroke();
    c.beginPath(); c.moveTo(96, 50); c.quadraticCurveTo(86, 42, 76, 48); c.stroke();
    disc(c, 65, 38, 5, '#d8341e');
    c.strokeStyle = INK; c.lineWidth = 4;
    c.beginPath(); c.arc(48, 60, 7, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.beginPath(); c.arc(82, 60, 7, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    ellipse(c, 65, 70, 5, 3.5, INK);
    c.lineWidth = 3;
    c.beginPath(); c.arc(59, 73, 6, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
    c.beginPath(); c.arc(71, 73, 6, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
    fan(c, 12, 92, -0.6, '#2e7fd1');
  },
  cat(c) {
    feet(c, 65, 140, 22, '#fff');
    ellipse(c, 65, 108, 40, 34, '#fff', INK, 4.5);
    // raised paw
    ellipse(c, 108, 52, 13, 20, '#fff', INK, 4, 0.25);
    path(c, [[28, 46], [30, 12], [56, 30]], { fill: '#fff', stroke: INK, width: 4.5 });
    path(c, [[102, 46], [100, 12], [74, 30]], { fill: '#2b2230', stroke: INK, width: 4.5 });
    ellipse(c, 65, 60, 46, 38, '#fff', INK, 4.5);
    c.save();
    c.beginPath(); c.ellipse(65, 60, 44, 36, 0, 0, TAU); c.clip();
    ellipse(c, 100, 30, 26, 20, '#2b2230'); ellipse(c, 30, 34, 20, 14, '#f4a23a');
    c.restore();
    face(c, 65, 60, { gap: 17, eye: 5.5, smile: 8 });
    c.strokeStyle = INK; c.lineWidth = 2.5;
    for (const dir of [-1, 1]) {
      line(c, 65 + dir * 34, 68, 65 + dir * 52, 64, INK, 2.5); line(c, 65 + dir * 34, 74, 65 + dir * 52, 78, INK, 2.5);
    }
    // collar and bell
    c.strokeStyle = DON; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.arc(65, 66, 40, Math.PI * 0.28, Math.PI * 0.72); c.stroke();
    disc(c, 65, 106, 10, INK); disc(c, 65, 106, 7, '#ffd34f'); line(c, 61, 108, 69, 108, INK, 2);
  },
  mochi(c) {
    feet(c, 65, 140, 24, '#c98a4a');
    box2(c, 22, 122, 86, 14, '#c98a4a');
    ellipse(c, 65, 104, 50, 28, '#fffdf4', INK, 4.5);
    ellipse(c, 65, 66, 38, 26, '#fffdf4', INK, 4.5);
    c.fillStyle = 'rgba(214,180,120,.3)';
    c.beginPath(); c.ellipse(65, 116, 44, 12, 0, 0, Math.PI); c.fill();
    // citrus on top
    ellipse(c, 65, 34, 17, 15, '#ff9a2a', INK, 4);
    c.beginPath(); c.moveTo(65, 22); c.quadraticCurveTo(80, 8, 86, 20); c.quadraticCurveTo(74, 26, 65, 22); c.closePath();
    c.fillStyle = '#58b13a'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    face(c, 65, 66, { gap: 14, eye: 5, smile: 7 });
    // little arms
    line(c, 20, 96, 4, 78, INK, 11); line(c, 20, 96, 4, 78, '#fffdf4', 5);
    line(c, 110, 96, 126, 78, INK, 11); line(c, 110, 96, 126, 78, '#fffdf4', 5);
  },
};

function box2(c, x, y, w, h, fill) {
  c.beginPath(); c.rect(x, y, w, h);
  c.fillStyle = fill; c.fill(); c.strokeStyle = INK; c.lineWidth = 4; c.lineJoin = 'round'; c.stroke();
}

export const DANCERS = [
  { id: 'daruma', x: 640, joins: 0 },
  { id: 'fox', x: 430, joins: 20 },
  { id: 'cat', x: 850, joins: 40 },
  { id: 'lantern', x: 230, joins: 60 },
  { id: 'mochi', x: 1050, joins: 80 },
];

export function dancerSprite(id, scale) {
  return sprite(`dancer-${id}`, SIZE.width, SIZE.height, scale, c => PAINTERS[id](c));
}

/**
 * state.entered[id] is the song time each dancer hopped in, or undefined.
 * beat is a 0..1 phase inside the current beat, step counts beats.
 */
export function drawDancers(c, scale, ground, { time, beat, step, entered, gogo, size = 1, places = null }) {
  DANCERS.forEach((dancer, index) => {
    const since = entered[dancer.id];
    if (since === undefined) return;
    if (places && places[dancer.id] === undefined) return;
    const x = places ? places[dancer.id] : dancer.x;
    const arrive = easeBack(clamp((time - since) / 0.45));
    if (arrive <= 0) return;
    const hop = Math.max(0, Math.sin(beat * Math.PI)) * (gogo ? 22 : 12);
    const lean = ((step + index) % 2 ? 1 : -1) * (gogo ? 0.16 : 0.1) * Math.sin(beat * Math.PI);
    const squash = 1 - 0.07 * Math.max(0, 1 - beat * 4);
    const entry = dancerSprite(dancer.id, scale);
    c.save();
    c.translate(x, ground);
    c.globalAlpha = 0.25;
    ellipse(c, 0, -4, Math.max(0, (46 - hop * 0.5) * size * Math.min(1, arrive)), 9 * size, INK);
    c.globalAlpha = 1;
    c.translate(0, -hop + (1 - arrive) * 60);
    c.rotate(lean);
    c.scale(size * arrive * (2 - squash), size * arrive * squash);
    stamp(c, entry, -SIZE.width / 2, -SIZE.height + 6);
    c.restore();
  });
}
