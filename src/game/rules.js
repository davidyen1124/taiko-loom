// Gameplay rules shared by the engine, the renderer and the menus.

export const DIFFICULTIES = ['easy', 'medium', 'hard'];

export const LEVELS = {
  easy: { jp: 'かんたん', en: 'Easy', color: '#f2642b', dark: '#a8361a', icon: 'blossom', maxStars: 5 },
  medium: { jp: 'ふつう', en: 'Medium', color: '#6fae2e', dark: '#3f7214', icon: 'leaf', maxStars: 7 },
  hard: { jp: 'むずかしい', en: 'Hard', color: '#3d7fd9', dark: '#1f4c99', icon: 'flame', maxStars: 8 },
};

// Timing windows in seconds, measured from the note's exact time.
// 良 GOOD is the tight window, 可 OK the loose one. A hit outside OK but inside
// BAD is a mistimed swing: it spends the note as 不可 and breaks the combo.
export const WINDOWS = {
  easy: { good: 0.042, ok: 0.108, bad: 0.125 },
  medium: { good: 0.042, ok: 0.108, bad: 0.125 },
  hard: { good: 0.025, ok: 0.075, bad: 0.108 },
};

// Soul gauge. `fill` is the share of the chart that must be hit 良 for a full
// gauge. 可 earns `ok` of a 良. 不可 removes `bad` times a 良.
export const GAUGE = {
  easy: { clear: 60, fill: 0.635, ok: 0.75, bad: 0.5 },
  medium: { clear: 70, fill: 0.7, ok: 0.75, bad: 1 },
  hard: { clear: 70, fill: 0.667, ok: 0.75, bad: 1.25 },
};

// Fixed scoring: every 良 pays the same, whatever the combo. A flawless run
// with every big note struck two-handed totals one million before drumrolls.
export const MAX_SCORE = 1000000;
export const ROLL_POINTS = 100;
export const BIG_ROLL_POINTS = 200;
export const BALLOON_POINTS = 300;
export const BALLOON_POP_POINTS = 5000;
export const BIG_PAIR_WINDOW = 0.033;     // the second stick may trail the first by two frames
export const COMBO_SHOWN_FROM = 10;
export const MILESTONES = [10, 30, 50];   // then every 100
export const AUTO_ROLL_RATE = 15;         // hits per second when the game plays itself
export const AUTO_BALLOON_RATE = 30;

export const HIT_TYPES = new Set(['don', 'ka', 'bigDon', 'bigKa']);
export const ROLL_TYPES = new Set(['roll', 'bigRoll']);
export const isHit = note => HIT_TYPES.has(note.type);
export const isRoll = note => ROLL_TYPES.has(note.type);
export const isBig = note => note.type === 'bigDon' || note.type === 'bigKa' || note.type === 'bigRoll';
export const kindOf = note => (note.type === 'ka' || note.type === 'bigKa' ? 'ka' : 'don');

export const SYLLABLES = {
  don: 'ドン', ka: 'カッ', bigDon: 'ドン(大)', bigKa: 'カッ(大)', roll: '連打', bigRoll: '連打(大)', balloon: 'ふうせん',
};

// Points for one 良. Big notes count twice because both sticks can land.
// Rounded up to tens so totals always end in zero.
export function scoreUnit(hitCount, bigCount = 0) {
  if (hitCount <= 0) return 0;
  return Math.max(10, Math.ceil(MAX_SCORE / (hitCount + bigCount) / 10) * 10);
}

export function isMilestone(combo) {
  return MILESTONES.includes(combo) || (combo >= 100 && combo % 100 === 0);
}

// Score stamps shown on the results screen, best first. Each is one night
// further into the festival: lantern, blossom, moon, festival, heaven.
export const RANKS = [
  { id: 'heaven', label: '天', name: 'Heaven', min: 1000000, color: '#ff4fa3' },
  { id: 'festival', label: '祭', name: 'Festival', min: 950000, color: '#f2452b' },
  { id: 'moon', label: '月', name: 'Moon', min: 850000, color: '#f4b52e' },
  { id: 'blossom', label: '花', name: 'Blossom', min: 700000, color: '#f06aa0' },
  { id: 'lantern', label: '灯', name: 'Lantern', min: 500000, color: '#d18a54' },
];

export function rankFor(score) {
  return RANKS.find(rank => score >= rank.min) || null;
}

// Crowns: the best outcome a run earned.
export function crownFor(result) {
  if (!result.cleared) return null;
  if (result.bad === 0 && result.ok === 0) return 'rainbow';
  if (result.bad === 0) return 'gold';
  return 'silver';
}

export const CROWN_ORDER = [null, 'silver', 'gold', 'rainbow'];
export const betterCrown = (a, b) => (CROWN_ORDER.indexOf(a) >= CROWN_ORDER.indexOf(b) ? a : b);

export function accuracy(stats) {
  const total = stats.good + stats.ok + stats.bad;
  return total ? ((stats.good + stats.ok * 0.5) / total) * 100 : 0;
}
