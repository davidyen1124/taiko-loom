// Settings and personal records, kept in this browser only.
import { CROWN_ORDER } from './game/rules.js';

const SETTINGS_KEY = 'taiko-nights-settings-v2';
const RECORDS_KEY = 'taiko-nights-records-v2';

export const DEFAULT_SETTINGS = {
  music: 0.8,        // 0..1
  sfx: 0.8,          // 0..1
  speed: 1,          // note scroll multiplier
  offset: 0,         // ms; positive accepts later hits (Bluetooth, TVs)
  auto: false,       // the game plays itself
  guide: true,       // show touch zones on touch screens
};

export const LIMITS = {
  speed: { min: 0.7, max: 2, step: 0.1 },
  offset: { min: -200, max: 200, step: 5 },
};

function read(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value && typeof value === 'object' ? value : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

export function loadSettings() {
  const saved = read(SETTINGS_KEY, {});
  const settings = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (typeof saved[key] === typeof DEFAULT_SETTINGS[key]) settings[key] = saved[key];
  }
  settings.speed = Math.min(LIMITS.speed.max, Math.max(LIMITS.speed.min, settings.speed));
  settings.offset = Math.min(LIMITS.offset.max, Math.max(LIMITS.offset.min, settings.offset));
  return settings;
}

export const saveSettings = settings => write(SETTINGS_KEY, settings);

export const loadRecords = () => read(RECORDS_KEY, {});

export const recordKey = (songId, difficulty) => `${songId}:${difficulty}`;

// Stores the run if it beats the previous best. Returns what improved.
export function saveRecord(songId, difficulty, run) {
  const records = loadRecords();
  const key = recordKey(songId, difficulty);
  const before = records[key] || { score: 0, crown: null, combo: 0 };
  const improved = {
    score: run.score > before.score,
    crown: CROWN_ORDER.indexOf(run.crown) > CROWN_ORDER.indexOf(before.crown),
  };
  records[key] = {
    score: Math.max(before.score, run.score),
    crown: improved.crown ? run.crown : before.crown,
    combo: Math.max(before.combo || 0, run.maxCombo),
    rank: run.score >= before.score ? run.rank : before.rank,
    plays: (before.plays || 0) + 1,
  };
  write(RECORDS_KEY, records);
  return { record: records[key], improved, previous: before };
}

export function forgetSong(songId) {
  const records = loadRecords();
  for (const key of Object.keys(records)) if (key.startsWith(`${songId}:`)) delete records[key];
  write(RECORDS_KEY, records);
}
