// Turns a written score into a song document in the shared chart format.
//
// A score lists its sections in playing order. Each section holds one string
// per measure and difficulty, one character per step:
//   d k  don / ka        D K  big don / big ka
//   r R  drumroll / big drumroll, held while '-' follows
//   B    balloon, held while '-' follows
// A measure has 16 steps (sixteenths) or, for a shuffle, 12 (triplets).

const TYPES = { d: 'don', k: 'ka', D: 'bigDon', K: 'bigKa', r: 'roll', R: 'bigRoll', B: 'balloon' };
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const round = value => Math.round(value * 10000) / 10000;

export const isHold = step => step === 'r' || step === 'R' || step === 'B';

export function holdLength(steps, from) {
  let length = 1;
  while (steps[from + length] === '-') length++;
  return length;
}

// Where everything falls in time.
export function timing(score) {
  const beat = 60 / score.bpm;
  const measure = beat * 4;
  return { beat, measure, step: measure / score.steps, at: (m, step = 0) => score.offset + m * measure + step * (measure / score.steps) };
}

// The measures in playing order.
export function layout(score) {
  const measures = [];
  for (const section of score.sections) {
    for (let pass = 0; pass < (section.repeat || 1); pass++) {
      section.hard.forEach((_, index) => measures.push({ section, index, tune: section.tune || section.name }));
    }
  }
  return measures;
}

function notesFor(score, difficulty, measures) {
  const { at } = timing(score);
  const notes = [];
  measures.forEach(({ section, index }, m) => {
    const steps = section[difficulty][index];
    for (let i = 0; i < score.steps; i++) {
      const type = TYPES[steps[i]];
      if (!type) continue;
      const time = round(at(m, i));
      if (!isHold(steps[i])) { notes.push({ time, type }); continue; }
      const note = { time, end: round(at(m, i + holdLength(steps, i))), type };
      if (type === 'balloon') note.hits = section.balloon[difficulty];
      notes.push(note);
    }
  });
  return notes;
}

function describe(notes, stars) {
  const hits = notes.filter(note => note.end === undefined);
  const seconds = hits.at(-1).time - hits[0].time;
  return {
    stars,
    notes,
    stats: {
      hits: hits.length,
      rolls: notes.filter(note => note.type === 'roll' || note.type === 'bigRoll').length,
      balloons: notes.filter(note => note.type === 'balloon').length,
      density: Math.round((hits.length / seconds) * 100) / 100,
    },
  };
}

export function buildSong(score) {
  const { beat, measure, at } = timing(score);
  const measures = layout(score);
  const duration = round(at(measures.length) + score.tail);
  const beats = [];
  for (let t = score.offset; t < duration - 0.05; t += beat) beats.push(round(t));
  const gogo = [];
  measures.forEach(({ section, index }, m) => {
    if (section.gogo && index === 0) gogo.push([round(at(m)), round(at(m + section.hard.length))]);
  });
  // loudness sketch for the progress bar, from how loud each section is played
  const waveform = Array.from({ length: 180 }, (_, i) => {
    const m = Math.floor(((i / 180) * duration - score.offset) / measure);
    const level = score.loudness[measures[m]?.section.name] ?? 0.2;
    return Math.round((level * (0.82 + 0.18 * Math.sin(i * 2.3) ** 2)) * 1000) / 1000;
  });
  return {
    version: 2,
    id: score.id,
    source: 'demo',
    title: score.title,
    artist: score.artist,
    colour: score.colour,
    bpm: score.bpm,
    duration,
    steadyTempo: true,
    feel: score.steps === 12 ? 'shuffle' : 'straight',
    beats,
    measures: measures.map((_, m) => round(at(m))),
    gogo,
    waveform,
    charts: Object.fromEntries(DIFFICULTIES.map(name => [name, describe(notesFor(score, name, measures), score.stars[name])])),
    levels: null,
  };
}
