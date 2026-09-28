// Backgrounds: the patterned sky band above the lane and the night festival below it.
import {
  CREAM, DON, FONT, INK, TAU, box, clamp, disc, ellipse, label, line, path, radial, seeded, sprite, stamp, vertical,
} from './draw.js';
import { plate } from './plates.js';

export const TOP = { width: 1280, height: 184 };
export const SCENE = { width: 1280, height: 360 };

const GARLAND = ['#f2452b', '#fff1cf', '#ffc42e', '#fff1cf', '#4fc0d8', '#fff1cf'];

const PALETTES = {
  night: { a: '#2a1c5a', b: '#4b1f5e', wave: '#6d3f96', crest: '#a874c9' },
  clear: { a: '#b3261e', b: '#e2621d', wave: '#f59a2e', crest: '#ffd76a' },
  gogo: { a: '#c4281c', b: '#f07a1c', wave: '#ffb338', crest: '#fff0a0' },
  dusk: { a: '#3a1a52', b: '#8c2a4a', wave: '#b8507a', crest: '#f0a0b0' },
  indigo: { a: '#15204f', b: '#23408a', wave: '#3f66b8', crest: '#8fb4f0' },
};

// Fills a rectangle with the scrolling wave pattern. Used behind the menus.
export function drawWaves(c, scale, time, palette, width, height, speed = 14) {
  const { a, b } = PALETTES[palette];
  c.fillStyle = vertical(c, 0, height, [[0, a], [1, b]]);
  c.fillRect(0, 0, width, height);
  const tile = waveTile(scale, palette);
  const shift = (time * speed) % tile.width;
  for (let y = -8; y < height; y += tile.height) {
    for (let x = -shift - tile.width; x < width + tile.width; x += tile.width) stamp(c, tile, x, y);
  }
}

export function drawGarland(c, time, width, size = 1) {
  const sag = x => 4 + Math.sin((x / 160) * Math.PI) ** 2 * 8 * size;
  c.strokeStyle = INK; c.lineWidth = 3; c.beginPath();
  for (let x = 0; x <= width; x += 8) c[x ? 'lineTo' : 'moveTo'](x, sag(x));
  c.stroke();
  for (let i = 0; i * 80 + 40 < width; i++) {
    const x = i * 80 + 40;
    c.save();
    c.translate(x, sag(x));
    c.rotate(Math.sin(time * 1.6 + i * 0.9) * 0.07);
    drawLantern(c, 0, 4, 19 * size, 24 * size, GARLAND[i % GARLAND.length], 0.6 + 0.4 * Math.sin(time * 3 + i));
    c.restore();
  }
}

// Seigaiha: overlapping wave scales, a traditional textile pattern.
function waveTile(scale, palette) {
  const { wave, crest } = PALETTES[palette];
  return sprite(`waves-${palette}`, 96, 48, scale, (c, w, h) => {
    const arcs = (cx, cy) => {
      [44, 33, 22, 11].forEach((r, i) => {
        c.beginPath();
        c.arc(cx, cy, r, Math.PI, TAU);
        c.lineWidth = 3.5;
        c.strokeStyle = i === 0 ? crest : wave;
        c.globalAlpha = i === 0 ? 0.5 : 0.42;
        c.stroke();
      });
    };
    for (const [cx, cy] of [[0, h], [w, h], [w / 2, h / 2], [0, 0], [w, 0], [w / 2, h + h / 2]]) {
      c.save();
      c.beginPath(); c.arc(cx, cy, 48, Math.PI, TAU); c.closePath();
      c.globalCompositeOperation = 'destination-out'; c.fill();
      c.restore();
      arcs(cx, cy);
    }
  });
}

function drawLantern(c, x, y, w, h, color, glow = 1) {
  c.save();
  c.translate(x, y);
  box(c, -w * 0.3, -4, w * 0.6, 6, 2, INK);
  box(c, -w * 0.3, h - 2, w * 0.6, 6, 2, INK);
  ellipse(c, 0, h / 2, w / 2, h / 2, color, INK, 3);
  c.save();
  c.beginPath(); c.ellipse(0, h / 2, w / 2 - 1.5, h / 2 - 1.5, 0, 0, TAU); c.clip();
  c.globalAlpha = 0.35 + 0.35 * glow;
  ellipse(c, -w * 0.08, h * 0.42, w * 0.3, h * 0.36, '#fff6c9');
  c.globalAlpha = 0.22;
  c.strokeStyle = INK; c.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) {
    c.beginPath(); c.ellipse(0, h / 2, w / 2, (h / 2) * (i / 4), 0, 0, TAU); c.stroke();
  }
  c.restore();
  c.restore();
}

export function drawTopBand(c, scale, time, mood, blend) {
  // mood: night | clear | gogo; blend 0..1 fades from night to the mood
  c.save();
  c.beginPath(); c.rect(0, 0, TOP.width, TOP.height); c.clip();
  drawWaves(c, scale, time, 'night', TOP.width, TOP.height);
  if (mood !== 'night' && blend > 0) {
    c.globalAlpha = clamp(blend);
    drawWaves(c, scale, time, mood, TOP.width, TOP.height);
    c.globalAlpha = 1;
  }
  // soft vignette keeps the HUD readable
  c.fillStyle = vertical(c, 0, TOP.height, [[0, 'rgba(10,4,20,.45)'], [0.35, 'rgba(10,4,20,0)'], [1, 'rgba(10,4,20,.35)']]);
  c.fillRect(0, 0, TOP.width, TOP.height);
  drawGarland(c, time, TOP.width);
  c.restore();
}

function stall(c, x, base, { sign, awning, goods }) {
  const w = 236;
  const top = base - 168;
  // back wall
  box(c, x + 14, top + 56, w - 28, 112, 0, '#6e1d1a', INK, 3);
  c.fillStyle = 'rgba(255,190,90,.22)';
  c.fillRect(x + 16, top + 58, w - 32, 60);
  // posts
  box(c, x + 8, top + 40, 12, 128, 2, '#8a3a22', INK, 3);
  box(c, x + w - 20, top + 40, 12, 128, 2, '#8a3a22', INK, 3);
  // counter with festive curtain
  box(c, x + 4, base - 58, w - 8, 58, 3, '#fff6e0', INK, 3);
  c.save();
  c.beginPath(); c.rect(x + 6, base - 56, w - 12, 54); c.clip();
  for (let i = 0; i < 8; i += 2) { c.fillStyle = DON; c.fillRect(x + 6 + (i * (w - 12)) / 8, base - 56, (w - 12) / 8, 54); }
  c.fillStyle = 'rgba(26,16,20,.14)'; c.fillRect(x + 6, base - 20, w - 12, 20);
  c.restore();
  box(c, x, base - 66, w, 12, 3, '#c98a4a', INK, 3);
  // goods on the counter
  goods(c, x + w / 2, base - 66);
  // awning
  c.save();
  path(c, [[x - 10, top + 58], [x + 16, top + 22], [x + w - 16, top + 22], [x + w + 10, top + 58]], { fill: awning[0], stroke: INK, width: 3 });
  c.beginPath();
  c.moveTo(x - 10, top + 58); c.lineTo(x + 16, top + 22); c.lineTo(x + w - 16, top + 22); c.lineTo(x + w + 10, top + 58); c.closePath();
  c.clip();
  c.fillStyle = awning[1];
  for (let i = 0; i < 9; i += 2) {
    const a = x - 10 + (i * (w + 20)) / 9;
    const b = x + 16 + (i * (w - 32)) / 9;
    path(c, [[a, top + 58], [b, top + 22], [b + (w - 32) / 9, top + 22], [a + (w + 20) / 9, top + 58]], { fill: awning[1] });
  }
  c.restore();
  // scalloped edge
  for (let i = 0; i < 9; i++) {
    const cx = x - 10 + ((i + 0.5) * (w + 20)) / 9;
    c.beginPath(); c.arc(cx, top + 58, (w + 20) / 18, 0, Math.PI);
    c.fillStyle = i % 2 ? awning[0] : awning[1]; c.fill();
    c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
  }
  line(c, x - 10, top + 58, x + w + 10, top + 58, INK, 3);
  // sign board
  box(c, x + 30, top - 22, w - 60, 46, 6, sign.color, INK, 3.5);
  box(c, x + 36, top - 16, w - 72, 34, 3, null, 'rgba(255,255,255,.35)', 2);
  label(c, sign.text, x + w / 2, top + 2, { size: 27, align: 'center', baseline: 'middle', fill: sign.ink, stroke: INK, width: 5, family: FONT });
}

const goods = {
  dumplings(c, x, y) {
    box(c, x - 84, y - 14, 168, 14, 3, '#3a3a40', INK, 3);
    for (let i = 0; i < 7; i++) {
      disc(c, x - 66 + i * 22, y - 22, 10.5, INK);
      disc(c, x - 66 + i * 22, y - 22, 8, '#c8853c');
      disc(c, x - 69 + i * 22, y - 25, 3, '#6a3b1c');
    }
    for (const dx of [-98, 98]) { box(c, x + dx - 9, y - 40, 18, 40, 4, '#ffe3a1', INK, 3); }
  },
  ice(c, x, y) {
    const colors = ['#ff6b8d', '#ffd34f', '#5fd1ea', '#8ee26b'];
    colors.forEach((color, i) => {
      const cx = x - 72 + i * 48;
      path(c, [[cx - 15, y - 26], [cx + 15, y - 26], [cx + 10, y], [cx - 10, y]], { fill: '#e9f7ff', stroke: INK, width: 3 });
      c.beginPath(); c.arc(cx, y - 26, 17, Math.PI, TAU); c.closePath();
      c.fillStyle = '#fff'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.beginPath(); c.arc(cx, y - 28, 12, Math.PI * 1.05, Math.PI * 1.95); c.closePath();
      c.fillStyle = color; c.fill();
    });
  },
  goldfish(c, x, y) {
    box(c, x - 92, y - 24, 184, 24, 8, '#3aa6d6', INK, 3);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x - 86, y - 20, 172, 5);
    [[-58, -11, '#ff5a3c'], [-12, -9, '#fff'], [34, -12, '#ff5a3c'], [70, -9, '#ffb03a']].forEach(([dx, dy, color]) => {
      ellipse(c, x + dx, y + dy, 11, 6, color, INK, 2.5);
      path(c, [[x + dx + 9, y + dy], [x + dx + 20, y + dy - 7], [x + dx + 20, y + dy + 7]], { fill: color, stroke: INK, width: 2.5 });
      disc(c, x + dx - 5, y + dy - 1, 1.6, INK);
    });
  },
  candy(c, x, y) {
    const colors = ['#ffb3d1', '#b8e8ff', '#fff2a8', '#ffb3d1', '#c9f5b0'];
    colors.forEach((color, i) => {
      const cx = x - 80 + i * 40;
      line(c, cx, y, cx, y - 30, INK, 6);
      line(c, cx, y, cx, y - 30, '#f1cf96', 3);
      disc(c, cx, y - 40, 18, INK); disc(c, cx, y - 40, 15, color);
      disc(c, cx - 5, y - 45, 5, 'rgba(255,255,255,.7)');
    });
  },
};

const STALLS = [
  { x: 22, sign: { text: 'たこやき', color: '#ffd34f', ink: '#d8341e' }, awning: ['#d8341e', '#fff6e0'], goods: goods.dumplings },
  { x: 276, sign: { text: 'きんぎょ', color: '#eafcff', ink: '#2e7fd1' }, awning: ['#2e7fd1', '#fff6e0'], goods: goods.goldfish },
  { x: 768, sign: { text: 'わたあめ', color: '#ffe3ef', ink: '#e8548e' }, awning: ['#f06aa0', '#fff6e0'], goods: goods.candy },
  { x: 1022, sign: { text: 'かきごおり', color: '#fff6e0', ink: '#1f6fd1' }, awning: ['#ffc42e', '#fff6e0'], goods: goods.ice },
];

// Lanterns that glow and sway at run time: [x, y, width, height, colour]
export const SCENE_LANTERNS = [];

function tower(c, cx, base) {
  // lower tier
  box(c, cx - 118, base - 96, 236, 96, 0, '#fff6e0', INK, 3.5);
  c.save();
  c.beginPath(); c.rect(cx - 116, base - 94, 232, 92); c.clip();
  for (let i = 0; i < 8; i += 2) { c.fillStyle = DON; c.fillRect(cx - 116 + i * 29, base - 94, 29, 92); }
  c.fillStyle = 'rgba(26,16,20,.16)'; c.fillRect(cx - 116, base - 30, 232, 30);
  c.restore();
  box(c, cx - 132, base - 108, 264, 16, 3, '#c98a4a', INK, 3.5);
  // railing
  for (let i = 0; i <= 8; i++) box(c, cx - 126 + i * 30.5, base - 144, 8, 38, 2, '#d8341e', INK, 3);
  box(c, cx - 134, base - 150, 268, 11, 3, '#d8341e', INK, 3);
  // drum on its stand
  path(c, [[cx - 36, base - 108], [cx - 20, base - 150], [cx + 20, base - 150], [cx + 36, base - 108]], { fill: '#8a4a22', stroke: INK, width: 3 });
  ellipse(c, cx, base - 178, 46, 40, '#b7431f', INK, 4);
  ellipse(c, cx, base - 178, 34, 29, CREAM, INK, 3.5);
  c.strokeStyle = DON; c.lineWidth = 6; c.lineCap = 'round';
  c.beginPath(); c.arc(cx, base - 178, 11, Math.PI * 0.2, Math.PI * 1.3); c.stroke();
  // roof
  box(c, cx - 112, base - 232, 10, 86, 2, '#8a3a22', INK, 3);
  box(c, cx + 102, base - 232, 10, 86, 2, '#8a3a22', INK, 3);
  path(c, [[cx - 160, base - 226], [cx - 118, base - 262], [cx + 118, base - 262], [cx + 160, base - 226]], { fill: '#3b2a6b', stroke: INK, width: 3.5 });
  path(c, [[cx - 118, base - 262], [cx - 96, base - 278], [cx + 96, base - 278], [cx + 118, base - 262]], { fill: '#5a3f9c', stroke: INK, width: 3.5 });
  disc(c, cx, base - 286, 10, INK); disc(c, cx, base - 286, 6.5, '#ffd34f');
}

function paintScene(c) {
  const { width: W, height: H } = SCENE;
  const random = seeded(20260927);
  c.fillStyle = vertical(c, 0, 250, [[0, '#130d33'], [0.55, '#35205f'], [1, '#a2446a']]);
  c.fillRect(0, 0, W, 252);
  for (let i = 0; i < 90; i++) {
    const x = random() * W; const y = random() * 150; const r = 0.6 + random() * 1.5;
    c.globalAlpha = 0.35 + random() * 0.6;
    disc(c, x, y, r, '#fff8d8');
  }
  c.globalAlpha = 1;
  // moon
  c.fillStyle = radial(c, 1130, 62, 110, [[0, 'rgba(255,240,190,.5)'], [1, 'rgba(255,240,190,0)']]);
  c.fillRect(1000, -60, 260, 260);
  disc(c, 1130, 62, 36, '#fff3c4');
  disc(c, 1118, 52, 7, 'rgba(230,200,140,.5)'); disc(c, 1142, 74, 5, 'rgba(230,200,140,.5)'); disc(c, 1139, 50, 3.5, 'rgba(230,200,140,.5)');

  // distant hills
  c.fillStyle = '#2a1a55';
  c.beginPath(); c.moveTo(0, 252); c.lineTo(0, 190);
  c.bezierCurveTo(140, 130, 250, 210, 380, 176); c.bezierCurveTo(520, 140, 600, 214, 760, 184);
  c.bezierCurveTo(900, 150, 1010, 206, 1130, 170); c.bezierCurveTo(1200, 150, 1250, 176, 1280, 184);
  c.lineTo(1280, 252); c.closePath(); c.fill();
  c.fillStyle = '#1d123f';
  for (let i = 0; i < 46; i++) {
    const x = i * 29 + random() * 12; const h = 22 + random() * 30;
    path(c, [[x - 13, 252], [x, 252 - h], [x + 13, 252]], { fill: '#1d123f' });
  }
  // torii gate
  c.save(); c.translate(646, 0); c.globalAlpha = 0.9;
  box(c, -94, 96, 188, 13, 4, '#8f2418', INK, 3);
  path(c, [[-112, 78], [-104, 94], [104, 94], [112, 78], [60, 86], [-60, 86]], { fill: '#b82f1d', stroke: INK, width: 3 });
  box(c, -76, 108, 15, 150, 3, '#b82f1d', INK, 3); box(c, 61, 108, 15, 150, 3, '#b82f1d', INK, 3);
  c.restore();

  // ground
  c.fillStyle = vertical(c, 250, H, [[0, '#e0843e'], [1, '#a84a24']]);
  c.fillRect(0, 250, W, H - 250);
  c.strokeStyle = 'rgba(95,35,15,.35)'; c.lineWidth = 2;
  for (let i = 0; i < 5; i++) { const y = 262 + i * i * 5.5; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  for (let i = -14; i <= 14; i++) { c.beginPath(); c.moveTo(640 + i * 46, 250); c.lineTo(640 + i * 150, H); c.stroke(); }
  line(c, 0, 250, W, 250, INK, 3, 'butt');

  c.save(); c.translate(640, 262); c.scale(0.84, 0.84); tower(c, 0, 0); c.restore();
  STALLS.forEach(s => stall(c, s.x, 262, s));

  // strings of lanterns from the tower to both edges
  SCENE_LANTERNS.length = 0;
  const colors = ['#f2452b', '#ffd34f', '#fff1cf', '#4fc0d8', '#f06aa0', '#8ee26b'];
  for (const dir of [-1, 1]) {
    const from = [640 + dir * 84, 36];
    const to = [640 + dir * 690, 2];
    const at = t => [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI) * 26];
    c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath();
    for (let i = 0; i <= 40; i++) { const [x, y] = at(i / 40); c[i ? 'lineTo' : 'moveTo'](x, y); }
    c.stroke();
    for (let i = 1; i <= 8; i++) {
      const [x, y] = at(i / 9);
      SCENE_LANTERNS.push([x, y, 24, 30, colors[(i + (dir > 0 ? 3 : 0)) % colors.length]]);
    }
  }
  // footer band: red and white festival stripes under a wave border
  box(c, 0, H - 26, W, 26, 0, '#fff6e0');
  for (let i = 0; i < 32; i += 2) { c.fillStyle = DON; c.fillRect(i * 40, H - 26, 40, 26); }
  c.fillStyle = 'rgba(26,16,20,.12)'; c.fillRect(0, H - 9, W, 9);
  line(c, 0, H - 26, W, H - 26, INK, 3, 'butt');
}

function glowSprite(scale) {
  return sprite('lantern-glow', 120, 120, scale, c => {
    c.fillStyle = radial(c, 60, 60, 60, [[0, 'rgba(255,214,120,.55)'], [0.4, 'rgba(255,190,90,.22)'], [1, 'rgba(255,170,60,0)']]);
    c.fillRect(0, 0, 120, 120);
  });
}

// The painted plate is 3:1. The scene slot is wider, so a band is cropped
// from it; positions below are in scene units after that crop.
const PLATE = { width: 2172, height: 724, top: 52 };
const PLATE_SCALE = SCENE.width / PLATE.width;
const PLATE_SIGNS = [
  { x: 133, text: 'だんご', ink: '#fff6e0' },
  { x: 378, text: 'からあげ', ink: '#fff6e0' },
  { x: 904, text: 'りんごあめ', ink: '#8a3a0a' },
  { x: 1149, text: 'かきごおり', ink: '#fff6e0' },
];
// lantern centres measured on the plate, in plate pixels
const PLATE_LANTERNS = [
  [54, 87], [166, 128], [278, 154], [391, 179], [505, 187], [621, 179], [741, 163], [847, 128],
  [1323, 128], [1425, 163], [1540, 187], [1657, 204], [1777, 204], [1895, 187], [2011, 157], [2120, 114],
  [948, 163], [1221, 163], [46, 391], [400, 391], [471, 391], [806, 391], [1366, 391], [1700, 391], [1777, 391], [2120, 391],
];

function paintPlate(c) {
  const image = plate('festival');
  const band = SCENE.height / PLATE_SCALE;
  c.drawImage(image, 0, PLATE.top, PLATE.width, band, 0, 0, SCENE.width, SCENE.height);
  const y = (288 - PLATE.top) * PLATE_SCALE;
  for (const sign of PLATE_SIGNS) {
    label(c, sign.text, sign.x, y, {
      size: sign.text.length > 4 ? 24 : 28, align: 'center', baseline: 'middle', fill: sign.ink, stroke: INK, width: 5, family: FONT, maxWidth: 170,
    });
  }
}

export function drawScene(c, scale, time, { gogo = 0, cleared = 0 } = {}) {
  const glow = glowSprite(scale);
  if (plate('festival')) {
    stamp(c, sprite('festival-plate', SCENE.width, SCENE.height, scale, paintPlate), 0, 0);
    c.save();
    c.globalCompositeOperation = 'lighter';
    PLATE_LANTERNS.forEach(([px, py], i) => {
      const pulse = 0.42 + 0.22 * Math.sin(time * 2.4 + i * 1.7) + 0.3 * gogo;
      c.globalAlpha = clamp(pulse);
      stamp(c, glow, px * PLATE_SCALE - 60, (py - PLATE.top) * PLATE_SCALE - 60);
    });
    c.restore();
  } else {
    drawPaintedScene(c, scale, time, gogo, glow);
  }
  if (cleared > 0) {
    // warm wash once the song is being cleared
    c.save();
    c.globalAlpha = 0.16 * cleared;
    c.fillStyle = vertical(c, 0, SCENE.height, [[0, '#ffd76a'], [1, 'rgba(255,215,106,0)']]);
    c.fillRect(0, 0, SCENE.width, SCENE.height);
    c.restore();
  }
}

function drawPaintedScene(c, scale, time, gogo, glow) {
  const base = sprite('festival', SCENE.width, SCENE.height, scale, paintScene);
  stamp(c, base, 0, 0);
  c.save();
  c.globalCompositeOperation = 'lighter';
  SCENE_LANTERNS.forEach(([x, y], i) => {
    const pulse = 0.55 + 0.25 * Math.sin(time * 2.4 + i * 1.7) + 0.2 * gogo;
    c.globalAlpha = clamp(pulse);
    stamp(c, glow, x - 60, y - 44);
  });
  c.restore();
  SCENE_LANTERNS.forEach(([x, y, w, h, color], i) => {
    c.save();
    c.translate(x, y);
    c.rotate(Math.sin(time * 1.5 + i * 1.1) * (0.06 + 0.06 * gogo));
    drawLantern(c, 0, 2, w, h, color, 0.7 + 0.3 * Math.sin(time * 2.4 + i * 1.7));
    c.restore();
  });
}
