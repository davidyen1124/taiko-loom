// "Lantern Parade": the built-in song. Both the music and its charts are
// written here as data, and the audio is synthesised in the browser, so the
// game is playable straight after cloning with no audio files in the repo.

const BPM = 132;
const BEAT = 60 / BPM;
const MEASURE = BEAT * 4;
const OFFSET = 0.6;               // the first downbeat
const SIXTEENTH = BEAT / 4;

// Each string is one measure of sixteenth steps.
//   d k  don / ka        D K  big don / big ka
//   r R  drumroll / big drumroll, held while '-' follows
//   B    balloon, held while '-' follows
const SECTIONS = [
  {
    name: 'intro', repeat: 1,
    hard: ['d...d...d...d.d.', 'd...d...d.k.d...', 'd...d...d...d.d.', 'd.k.d.k.D.......'],
    medium: ['d...d...d...d...', 'd...d...d...d...', 'd...d...d...d.d.', 'd...k...D.......'],
    easy: ['d.......d.......', 'd.......d.......', 'd.......d...d...', 'd...d...D.......'],
  },
  {
    name: 'verse', repeat: 2,
    hard: ['d...k...d.d.k...', 'd.d.k...d...k.k.', 'd...k...d.d.k...', 'd.dkd...k.k.d...'],
    medium: ['d...k...d.d.k...', 'd...k...d...k...', 'd...k...d.d.k...', 'd.d.d...k...d...'],
    easy: ['d...k...d...k...', 'd...d...d.......', 'd...k...d...k...', 'd...d...d.......'],
  },
  {
    name: 'build', repeat: 1,
    hard: ['d.d.d.d.k.k.k.k.', 'd.dkd.k.d.dkd.k.', 'd.d.k.k.d.d.k.k.', 'D...K...r-----..'],
    medium: ['d...d.d.k...k.k.', 'd...d.d.k...k.k.', 'd.d.d...k.k.k...', 'D...K...r-----..'],
    easy: ['d...d...k...k...', 'd...d...k...k...', 'd...d...d...d...', 'D.......r-----..'],
  },
  {
    name: 'chorus', repeat: 1, gogo: true,
    hard: [
      'D...k.k.d.d.k...', 'd.dkd.k.d.d.k...', 'D...k.k.d.d.k.k.', 'd.d.k.d.dkd.K...',
      'D...k.k.d.d.k...', 'd.dkd.k.d.d.k...', 'D...k.k.d.d.k.k.', 'd.d.k...B-----..',
    ],
    medium: [
      'D...k...d.d.k...', 'd.d.d...k...k...', 'D...k...d.d.k...', 'd...k.k.d...K...',
      'D...k...d.d.k...', 'd.d.d...k...k...', 'D...k...d.d.k...', 'd...k...B-----..',
    ],
    easy: [
      'D...k...d...k...', 'd...d...k.......', 'D...k...d...k...', 'd...d...D.......',
      'D...k...d...k...', 'd...d...k.......', 'D...k...d...k...', 'd...d...B-----..',
    ],
    balloon: { easy: 4, medium: 6, hard: 8 },
  },
  {
    name: 'verse', repeat: 2,
    hard: ['d...k...d.d.k.k.', 'd.d.k...d.dkd...', 'd...k...d.d.k.k.', 'd.dkd.k.k.k.d...'],
    medium: ['d...k...d.d.k...', 'd.d.k...d...k...', 'd...k...d.d.k...', 'd.d.d...k.k.d...'],
    easy: ['d...k...d...k...', 'd...d...k...k...', 'd...k...d...k...', 'd...d...d.......'],
  },
  {
    name: 'build', repeat: 1,
    hard: ['d.d.d.d.k.k.k.k.', 'd.dkd.k.d.dkd.k.', 'd.d.k.k.d.d.k.k.', 'D...K...R-----..'],
    medium: ['d...d.d.k...k.k.', 'd...d.d.k...k.k.', 'd.d.d...k.k.k...', 'D...K...R-----..'],
    easy: ['d...d...k...k...', 'd...d...k...k...', 'd...d...d...d...', 'D.......R-----..'],
  },
  {
    name: 'chorus', repeat: 1, gogo: true,
    hard: [
      'D...k.k.d.d.k...', 'd.dkd.k.d.d.k...', 'D...k.k.d.d.k.k.', 'd.d.k.d.dkd.K...',
      'D...k.k.d.d.k...', 'd.dkd.k.d.d.k...', 'D...k.k.d.d.k.k.', 'd.dkd.k.d.dkK...',
    ],
    medium: [
      'D...k...d.d.k...', 'd.d.d...k...k...', 'D...k...d.d.k...', 'd...k.k.d...K...',
      'D...k...d.d.k...', 'd.d.d...k...k...', 'D...k...d.d.k...', 'd.d.k...d.d.K...',
    ],
    easy: [
      'D...k...d...k...', 'd...d...k.......', 'D...k...d...k...', 'd...d...D.......',
      'D...k...d...k...', 'd...d...k.......', 'D...k...d...k...', 'd...d...k...K...',
    ],
  },
  {
    name: 'outro', repeat: 1,
    hard: ['d.d.k.k.d.d.k.k.', 'R-----------....', 'D...............'],
    medium: ['d...k.k.d...k.k.', 'R-----------....', 'D...............'],
    easy: ['d...k...d...k...', 'R-----------....', 'D...............'],
  },
];

const TYPES = { d: 'don', k: 'ka', D: 'bigDon', K: 'bigKa', r: 'roll', R: 'bigRoll', B: 'balloon' };
const round = value => Math.round(value * 10000) / 10000;

function layout() {
  const measures = [];
  SECTIONS.forEach(section => {
    for (let pass = 0; pass < section.repeat; pass++) {
      section.hard.forEach((_, index) => measures.push({ section, index }));
    }
  });
  return measures;
}

function chartFor(difficulty, measures) {
  const notes = [];
  measures.forEach(({ section, index }, m) => {
    const steps = section[difficulty][index];
    for (let i = 0; i < 16; i++) {
      const type = TYPES[steps[i]];
      if (!type) continue;
      const time = round(OFFSET + m * MEASURE + i * SIXTEENTH);
      if ('rRB'.includes(steps[i])) {
        let length = 1;
        while (steps[i + length] === '-') length++;
        const note = { time, end: round(time + length * SIXTEENTH), type };
        if (type === 'balloon') note.hits = section.balloon[difficulty];
        notes.push(note);
      } else {
        notes.push({ time, type });
      }
    }
  });
  return notes;
}

function describe(notes, stars) {
  const hits = notes.filter(n => n.end === undefined);
  const seconds = hits.at(-1).time - hits[0].time;
  return {
    stars, notes,
    stats: {
      hits: hits.length,
      rolls: notes.filter(n => n.type === 'roll' || n.type === 'bigRoll').length,
      balloons: notes.filter(n => n.type === 'balloon').length,
      density: Math.round((hits.length / seconds) * 100) / 100,
    },
  };
}

export function buildDemoSong() {
  const measures = layout();
  const duration = round(OFFSET + measures.length * MEASURE + 1.6);
  const beats = [];
  for (let t = OFFSET; t < duration - 0.05; t += BEAT) beats.push(round(t));
  const gogo = [];
  measures.forEach(({ section, index }, m) => {
    if (section.gogo && index === 0) gogo.push([round(OFFSET + m * MEASURE), round(OFFSET + (m + section.hard.length) * MEASURE)]);
  });
  // loudness sketch for the progress bar: quiet intro, loud choruses
  const waveform = Array.from({ length: 180 }, (_, i) => {
    const time = (i / 180) * duration;
    const m = Math.floor((time - OFFSET) / MEASURE);
    const name = measures[m]?.section.name;
    const level = { intro: 0.45, verse: 0.62, build: 0.78, chorus: 1, outro: 0.7 }[name] ?? 0.2;
    return Math.round((level * (0.82 + 0.18 * Math.sin(i * 2.3) ** 2)) * 1000) / 1000;
  });
  return {
    version: 2,
    id: 'demo-lantern-parade',
    source: 'demo',
    title: 'Lantern Parade',
    artist: 'Taiko Nights',
    bpm: BPM,
    duration,
    steadyTempo: true,
    feel: 'straight',
    beats,
    measures: measures.map((_, m) => round(OFFSET + m * MEASURE)),
    gogo,
    waveform,
    charts: {
      easy: describe(chartFor('easy', measures), 2),
      medium: describe(chartFor('medium', measures), 4),
      hard: describe(chartFor('hard', measures), 6),
    },
    levels: null,
  };
}

// ---- music -------------------------------------------------------------

// D yo scale, the five-note scale of festival flutes.
const HZ = { D3: 146.83, E3: 164.81, G3: 196, A3: 220, B3: 246.94, D4: 293.66, E4: 329.63, G4: 392, A4: 440, B4: 493.88, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, D6: 1174.66 };

// [note, eighths] pairs, one array per measure
const MELODY = {
  intro: [[], [], [], [['A4', 1], ['B4', 1], ['D5', 2], ['-', 4]]],
  verse: [
    [['A4', 2], ['B4', 1], ['A4', 1], ['G4', 2], ['E4', 2]],
    [['G4', 1], ['A4', 1], ['B4', 2], ['D5', 2], ['B4', 2]],
    [['A4', 2], ['B4', 1], ['A4', 1], ['G4', 2], ['E4', 2]],
    [['D4', 2], ['E4', 2], ['G4', 3], ['-', 1]],
  ],
  build: [
    [['E4', 1], ['G4', 1], ['A4', 2], ['E4', 1], ['G4', 1], ['A4', 2]],
    [['G4', 1], ['A4', 1], ['B4', 2], ['G4', 1], ['A4', 1], ['B4', 2]],
    [['A4', 1], ['B4', 1], ['D5', 2], ['A4', 1], ['B4', 1], ['D5', 2]],
    [['E5', 2], ['D5', 2], ['E5', 4]],
  ],
  chorus: [
    [['D5', 1], ['D5', 1], ['B4', 1], ['D5', 1], ['E5', 2], ['D5', 2]],
    [['B4', 1], ['A4', 1], ['B4', 2], ['G4', 2], ['A4', 2]],
    [['D5', 1], ['D5', 1], ['B4', 1], ['D5', 1], ['E5', 2], ['G5', 2]],
    [['E5', 1], ['D5', 1], ['B4', 2], ['D5', 3], ['-', 1]],
    [['D5', 1], ['D5', 1], ['B4', 1], ['D5', 1], ['E5', 2], ['D5', 2]],
    [['B4', 1], ['A4', 1], ['B4', 2], ['G4', 2], ['A4', 2]],
    [['G5', 1], ['G5', 1], ['E5', 1], ['G5', 1], ['A5', 2], ['G5', 2]],
    [['E5', 1], ['D5', 1], ['E5', 2], ['D5', 4]],
  ],
  outro: [
    [['D5', 1], ['B4', 1], ['A4', 1], ['G4', 1], ['A4', 1], ['B4', 1], ['D5', 2]],
    [['E5', 2], ['G5', 2], ['A5', 4]],
    [['D5', 8]],
  ],
};

const BASS = {
  intro: ['D3', 'D3', 'D3', 'A3'],
  verse: ['D3', 'G3', 'D3', 'A3'],
  build: ['E3', 'G3', 'A3', 'A3'],
  chorus: ['G3', 'A3', 'B3', 'D3', 'G3', 'A3', 'B3', 'D3'],
  outro: ['G3', 'A3', 'D3'],
};

function createMix(context) {
  const master = context.createDynamicsCompressor();
  master.threshold.value = -14; master.knee.value = 18; master.ratio.value = 4;
  master.attack.value = 0.004; master.release.value = 0.18;
  const out = context.createGain();
  out.gain.value = 0.9;
  master.connect(out); out.connect(context.destination);
  const bus = (gain, pan) => {
    const node = context.createGain(); node.gain.value = gain;
    const panner = context.createStereoPanner(); panner.pan.value = pan;
    node.connect(panner); panner.connect(master);
    return node;
  };
  return { drums: bus(1, 0), rim: bus(0.75, 0.25), bell: bus(0.3, -0.35), flute: bus(0.42, 0.12), string: bus(0.28, -0.22), bass: bus(0.5, 0) };
}

function envelope(context, destination, start, attack, peak, length) {
  const amp = context.createGain();
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.linearRampToValueAtTime(peak, start + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + length);
  amp.connect(destination);
  return amp;
}

function oscillator(context, destination, type, frequency, start, length, sweepTo) {
  const osc = context.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, start + length * 0.6);
  osc.connect(destination);
  osc.start(start); osc.stop(start + length + 0.05);
  return osc;
}

function noise(context, buffer, destination, start, length, type, frequency, q = 1) {
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = type; filter.frequency.value = frequency; filter.Q.value = q;
  source.connect(filter); filter.connect(destination);
  source.start(start, (start * 7.3) % 1, length + 0.05);
}

function scheduleDrums(context, mix, white, measures) {
  measures.forEach(({ section, index }, m) => {
    const steps = section.hard[index];
    const loud = section.name === 'chorus' ? 1 : section.name === 'build' ? 0.9 : 0.78;
    for (let i = 0; i < 16; i++) {
      const at = OFFSET + m * MEASURE + i * SIXTEENTH;
      const step = steps[i];
      if (step === 'd' || step === 'D') {
        const big = step === 'D';
        oscillator(context, envelope(context, mix.drums, at, 0.003, loud * (big ? 1 : 0.8), big ? 0.5 : 0.28), 'sine', big ? 140 : 165, at, big ? 0.5 : 0.28, big ? 44 : 56);
        noise(context, white, envelope(context, mix.drums, at, 0.001, loud * 0.4, 0.04), at, 0.04, 'lowpass', 1200);
        if (big) noise(context, white, envelope(context, mix.bell, at, 0.002, 0.9, 0.7), at, 0.7, 'highpass', 6500);
      } else if (step === 'k' || step === 'K') {
        const big = step === 'K';
        noise(context, white, envelope(context, mix.rim, at, 0.001, loud * (big ? 1.2 : 0.9), big ? 0.12 : 0.07), at, 0.12, 'bandpass', big ? 2000 : 2500, 5);
        oscillator(context, envelope(context, mix.rim, at, 0.001, 0.12, 0.04), 'square', 1400, at, 0.04, 900);
      } else if ('rRB'.includes(step)) {
        let length = 1;
        while (steps[i + length] === '-') length++;
        // a rolling crescendo of thirty-second notes
        for (let k = 0; k < length * 2; k++) {
          const t = at + k * (SIXTEENTH / 2);
          const swell = 0.35 + 0.55 * (k / (length * 2));
          oscillator(context, envelope(context, mix.drums, t, 0.002, swell * loud, 0.1), 'sine', 180, t, 0.1, 80);
        }
      }
    }
    // hand bell: steady eighths, busier in the chorus
    if (section.name !== 'intro' || index >= 2) {
      const every = section.name === 'chorus' ? 2 : 4;
      for (let i = 0; i < 16; i += every) {
        const at = OFFSET + m * MEASURE + i * SIXTEENTH;
        const accent = i % 8 === 4 ? 1 : 0.55;
        const amp = envelope(context, mix.bell, at, 0.001, accent, 0.09);
        oscillator(context, amp, 'square', 2093, at, 0.09);
        oscillator(context, amp, 'square', 3136, at, 0.09);
      }
    }
  });
}

function scheduleMelody(context, mix, white, measures) {
  measures.forEach(({ section, index }, m) => {
    const phrase = MELODY[section.name]?.[index] || [];
    let step = 0;
    phrase.forEach(([name, eighths]) => {
      const at = OFFSET + m * MEASURE + step * (BEAT / 2);
      const length = eighths * (BEAT / 2);
      step += eighths;
      if (name === '-') return;
      const frequency = HZ[name];
      // flute: soft attack, gentle vibrato, a breath of noise
      const amp = context.createGain();
      amp.gain.setValueAtTime(0.0001, at);
      amp.gain.linearRampToValueAtTime(0.9, at + 0.035);
      amp.gain.setValueAtTime(0.8, at + Math.max(0.04, length - 0.06));
      amp.gain.linearRampToValueAtTime(0.0001, at + length + 0.03);
      amp.connect(mix.flute);
      const voice = oscillator(context, amp, 'sine', frequency, at, length);
      const overtone = context.createGain(); overtone.gain.value = 0.22; overtone.connect(amp);
      oscillator(context, overtone, 'triangle', frequency * 2, at, length);
      const lfo = context.createOscillator(); lfo.frequency.value = 5.6;
      const depth = context.createGain();
      depth.gain.setValueAtTime(0, at);
      depth.gain.linearRampToValueAtTime(length > 0.4 ? 14 : 5, at + Math.min(length, 0.3));
      lfo.connect(depth); depth.connect(voice.detune);
      lfo.start(at); lfo.stop(at + length + 0.05);
      noise(context, white, envelope(context, mix.flute, at, 0.01, 0.12, Math.min(0.12, length)), at, 0.12, 'bandpass', frequency * 2, 3);
    });

    // plucked strings answer on the off-beats
    if (section.name !== 'intro') {
      const root = HZ[BASS[section.name][index % BASS[section.name].length]];
      for (let i = 0; i < 8; i++) {
        if (i % 2 === 0 && section.name !== 'chorus') continue;
        const at = OFFSET + m * MEASURE + i * (BEAT / 2);
        const pitch = root * (i % 4 === 1 ? 3 : i % 4 === 3 ? 4 : 2);
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3800, at);
        filter.frequency.exponentialRampToValueAtTime(700, at + 0.2);
        filter.connect(envelope(context, mix.string, at, 0.002, 0.8, 0.26));
        oscillator(context, filter, 'sawtooth', pitch, at, 0.26);
      }
    }
    // bass
    const name = BASS[section.name][index % BASS[section.name].length];
    const pattern = section.name === 'chorus' ? [0, 3, 4, 6] : section.name === 'build' ? [0, 2, 4, 6] : [0, 4];
    pattern.forEach(i => {
      const at = OFFSET + m * MEASURE + i * (BEAT / 2);
      oscillator(context, envelope(context, mix.bass, at, 0.004, 0.9, 0.4), 'triangle', HZ[name] / 2, at, 0.4);
    });
  });
}

let rendering = null;

// Renders the song once and keeps the result for the rest of the session.
export function renderDemoAudio() {
  if (rendering) return rendering;
  const song = buildDemoSong();
  const rate = 44100;
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const context = new Offline(2, Math.ceil(song.duration * rate), rate);
  const white = context.createBuffer(1, rate, rate);
  const data = white.getChannelData(0);
  let seed = 1234567;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    data[i] = seed / 2147483648 - 1;
  }
  const measures = layout();
  const mix = createMix(context);
  scheduleDrums(context, mix, white, measures);
  scheduleMelody(context, mix, white, measures);
  rendering = context.startRendering().catch(error => { rendering = null; throw error; });
  return rendering;
}
