// Yoru, the festival tanuki. In folklore tanuki drum on their bellies, so
// Yoru wears a drum skin on the tummy and plays along with every hit.
import { CREAM, DON, INK, TAU, clamp, disc, ellipse, line, path, star } from './draw.js';

const FUR = '#b36f3c';
const FUR_DARK = '#7d4522';
const FUR_LIGHT = '#d99a5f';
const MASK = '#4a2a1a';
const BELLY = '#fff1cf';
const HAPPI = '#27408f';
const HAPPI_LIGHT = '#3f63c9';
const LEAF = '#58b13a';
const LEAF_DARK = '#2f7a1f';
const WOOD = '#f1cf96';

function arm(c, side, swing, mood) {
  // swing 0 = raised and ready, 1 = stick on the belly drum
  const dir = side === 'left' ? -1 : 1;
  const raise = mood === 'happy' ? -0.9 : 0;
  const angle = dir * (-0.95 + swing * 1.5 + raise * (1 - swing));
  c.save();
  c.translate(dir * 58, -92);
  c.rotate(angle);
  // stick
  line(c, 0, 26, dir * 6, 86, INK, 13);
  line(c, 0, 26, dir * 6, 86, WOOD, 7);
  // arm
  line(c, 0, 0, 0, 34, INK, 30);
  line(c, 0, 0, 0, 34, FUR, 24);
  disc(c, 0, 36, 15, INK);
  disc(c, 0, 36, 12, FUR_DARK);
  c.restore();
}

function eyes(c, mood, blink) {
  for (const dir of [-1, 1]) {
    const x = dir * 30;
    const y = -150;
    // mask patch
    c.save();
    c.translate(x + dir * 3, y + 3);
    c.rotate(dir * 0.35);
    ellipse(c, 0, 0, 25, 20, MASK);
    c.restore();
    if (mood === 'happy' || mood === 'gogo') {
      c.strokeStyle = '#fff'; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.arc(x, y + 6, 11, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    } else if (mood === 'sad') {
      c.strokeStyle = '#fff'; c.lineWidth = 5.5; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(x - dir * 9, y - 7); c.lineTo(x + dir * 7, y); c.lineTo(x - dir * 9, y + 7); c.stroke();
    } else if (blink) {
      line(c, x - 10, y + 1, x + 10, y + 1, '#fff', 5);
    } else {
      ellipse(c, x, y, 10, 12.5, '#fff');
      ellipse(c, x + dir * 1.5, y + 1.5, 6.5, 8.5, INK);
      disc(c, x + dir * 1.5 - 2.5, y - 2.5, 3, '#fff');
    }
  }
}

function mouth(c, mood) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (mood === 'sad') {
    c.strokeStyle = INK; c.lineWidth = 4;
    c.beginPath(); c.arc(0, -104, 11, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    return;
  }
  if (mood === 'balloon') {
    disc(c, 0, -113, 7, INK);
    disc(c, 0, -113, 4, '#e0566b');
    return;
  }
  const open = mood === 'happy' || mood === 'gogo' ? 1 : 0.6;
  c.beginPath();
  c.moveTo(-17, -119);
  c.quadraticCurveTo(0, -116, 17, -119);
  c.quadraticCurveTo(12, -119 + 26 * open, 0, -119 + 27 * open);
  c.quadraticCurveTo(-12, -119 + 26 * open, -17, -119);
  c.closePath();
  c.fillStyle = '#8f2334'; c.fill();
  c.save(); c.clip();
  ellipse(c, 0, -119 + 26 * open, 11, 9, '#ff7d8e');
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 4; c.stroke();
}

/**
 * pose: { bob, left, right, mood, blink, jump, squash }
 *   bob     0..1 beat bounce          left/right  0..1 stick swing
 *   mood    idle | happy | sad | gogo | balloon
 */
export function drawMascot(c, x, y, size, pose = {}) {
  const { bob = 0, left = 0, right = 0, mood = 'idle', blink = false, jump = 0, time = 0 } = pose;
  const squash = 1 - bob * 0.045;
  c.save();
  c.translate(x, y - jump);
  c.scale(size, size);

  // ground shadow
  c.save();
  c.translate(0, jump / size);
  c.globalAlpha = clamp(0.28 - jump / 400, 0.08, 0.28);
  ellipse(c, 0, 0, 78 - jump / 8, 13, INK);
  c.restore();

  c.scale(1 + bob * 0.03, squash);

  // tail
  c.save();
  c.translate(66, -40);
  c.rotate(-0.5 + Math.sin(time * 3) * 0.08);
  ellipse(c, 22, 0, 38, 24, FUR_DARK, INK, 5);
  ellipse(c, 12, -2, 24, 16, FUR);
  c.restore();

  // feet
  ellipse(c, -34, -6, 25, 13, FUR_DARK, INK, 5);
  ellipse(c, 34, -6, 25, 13, FUR_DARK, INK, 5);

  // ears (behind the head)
  for (const dir of [-1, 1]) {
    c.save();
    c.translate(dir * 50, -188);
    c.rotate(dir * 0.45);
    ellipse(c, 0, 0, 22, 25, FUR, INK, 5);
    ellipse(c, 0, 4, 11, 13, '#f0a08a');
    c.restore();
  }

  // body
  ellipse(c, 0, -62, 70, 62, FUR, INK, 5);
  // happi coat
  c.save();
  c.beginPath(); c.ellipse(0, -62, 67.5, 59.5, 0, 0, TAU); c.clip();
  path(c, [[-80, -130], [-22, -130], [-40, 10], [-80, 10]], { fill: HAPPI });
  path(c, [[80, -130], [22, -130], [40, 10], [80, 10]], { fill: HAPPI });
  path(c, [[-22, -130], [-32, -130], [-50, 10], [-40, 10]], { fill: HAPPI_LIGHT });
  path(c, [[22, -130], [32, -130], [50, 10], [40, 10]], { fill: HAPPI_LIGHT });
  c.fillStyle = '#fff';
  for (const dir of [-1, 1]) {
    c.save(); c.translate(dir * 57, -58); star(c, 0, 0, 9, 4, 4, 0); c.fill(); c.restore();
  }
  c.restore();
  ellipse(c, 0, -62, 70, 62, null, INK, 5);

  // belly drum
  ellipse(c, 0, -52, 40, 38, INK);
  ellipse(c, 0, -52, 36, 34, BELLY);
  ellipse(c, 0, -52, 27, 25.5, null, '#e6c58b', 3);
  c.save();
  c.translate(0, -52);
  c.strokeStyle = DON; c.lineWidth = 7; c.lineCap = 'round';
  c.beginPath(); c.arc(0, 0, 11, Math.PI * 0.2, Math.PI * 1.3); c.stroke();
  disc(c, 9, 6, 6, DON);
  c.restore();
  const thump = Math.max(left, right);
  if (thump > 0.5) {
    c.globalAlpha = (thump - 0.5) * 1.6;
    ellipse(c, 0, -52, 36, 34, '#fff');
    c.globalAlpha = 1;
  }

  // head
  ellipse(c, 0, -142, 76, 62, FUR, INK, 5);
  c.save();
  c.beginPath(); c.ellipse(0, -142, 73.5, 59.5, 0, 0, TAU); c.clip();
  ellipse(c, 0, -110, 44, 34, CREAM);
  ellipse(c, -30, -188, 30, 14, FUR_LIGHT);
  c.restore();
  eyes(c, mood, blink);
  ellipse(c, 0, -128, 9, 6.5, INK);
  disc(c, -2.5, -130, 2, '#fff');
  mouth(c, mood);
  // cheeks
  c.globalAlpha = 0.75;
  ellipse(c, -50, -122, 11, 7, '#ff8f7a');
  ellipse(c, 50, -122, 11, 7, '#ff8f7a');
  c.globalAlpha = 1;

  // twisted headband
  c.save();
  c.beginPath(); c.ellipse(0, -142, 76, 62, 0, 0, TAU); c.clip();
  c.strokeStyle = INK; c.lineWidth = 21; c.lineCap = 'butt';
  c.beginPath(); c.arc(0, -96, 96, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
  c.strokeStyle = '#fff'; c.lineWidth = 14;
  c.beginPath(); c.arc(0, -96, 96, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
  c.strokeStyle = DON; c.lineWidth = 14;
  c.setLineDash([9, 17]);
  c.beginPath(); c.arc(0, -96, 96, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
  c.setLineDash([]);
  c.restore();
  // knot
  c.save();
  c.translate(66, -176);
  ellipse(c, 12, -8, 13, 8, '#fff', INK, 4, -0.6);
  ellipse(c, 14, 8, 13, 8, '#fff', INK, 4, 0.5);
  disc(c, 0, 0, 9, INK); disc(c, 0, 0, 5.5, DON);
  c.restore();

  // leaf
  c.save();
  c.translate(-8, -202);
  c.rotate(-0.35 + Math.sin(time * 2.2) * 0.05);
  c.beginPath();
  c.moveTo(0, 6); c.quadraticCurveTo(-26, -8, -6, -38); c.quadraticCurveTo(24, -22, 0, 6);
  c.closePath();
  c.fillStyle = LEAF; c.fill();
  c.strokeStyle = INK; c.lineWidth = 4.5; c.lineJoin = 'round'; c.stroke();
  line(c, -1, 2, -5, -28, LEAF_DARK, 3);
  c.restore();

  arm(c, 'left', left, mood);
  arm(c, 'right', right, mood);

  if (mood === 'sad') {
    c.save();
    c.translate(70, -176);
    c.beginPath(); c.moveTo(0, -14); c.quadraticCurveTo(12, 4, 0, 10); c.quadraticCurveTo(-12, 4, 0, -14); c.closePath();
    c.fillStyle = '#8fdcf2'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3.5; c.stroke();
    c.restore();
  }
  if (mood === 'gogo' || mood === 'happy') {
    c.fillStyle = '#ffe36a'; c.strokeStyle = INK; c.lineWidth = 3;
    const spots = [[-102, -176, 0], [104, -120, 1.3], [-96, -76, 2.4]];
    for (const [sx, sy, phase] of spots) {
      const s = 7 + Math.sin(time * 7 + phase) * 4;
      c.save(); c.translate(sx, sy); star(c, 0, 0, s + 5, (s + 5) * 0.38, 4, time + phase); c.fill(); c.stroke(); c.restore();
    }
  }
  c.restore();
}
