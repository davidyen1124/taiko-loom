// "Moonlit Koi": a slow shuffle for koto, in the A in scale (A Bb D E F), the
// darker five-note scale of koto and shamisen music. The gentlest of the
// built-in songs, and the one written in triplets.
import { playMelody, rootOf } from './synth.js';

export default {
  id: 'demo-moonlit-koi',
  title: 'Moonlit Koi',
  artist: 'Taiko Nights',
  colour: '#3d6fd6',
  bpm: 100,
  offset: 0.6,
  steps: 12,                      // three to a beat
  tail: 2.4,
  stars: { easy: 1, medium: 3, hard: 5 },
  loudness: { intro: 0.4, verse: 0.58, build: 0.74, chorus: 1, outro: 0.62 },
  drums: { intro: 0.6, verse: 0.66, build: 0.8, chorus: 0.9, outro: 0.7 },
  mix: { bell: 0.16 },

  sections: [
    {
      name: 'intro',
      hard: ['d.....d.....', 'd.....d..k..', 'd..k..d..k..', 'd..k.dd..D..'],
      medium: ['d.....d.....', 'd.....d.....', 'd..k..d..k..', 'd..k..d..D..'],
      easy: ['d.....d.....', 'd.....d.....', 'd.....d.....', 'd..d..D.....'],
    },
    {
      name: 'verse',
      hard: ['d..k.dd..k..', 'd.dk..d..k.k', 'd..k.dd..k..', 'd.dk.dk..d..'],
      medium: ['d..k..d..k..', 'd..k.dd..k..', 'd..k..d..k..', 'd.dk..d..d..'],
      easy: ['d.....k.....', 'd..d..k.....', 'd.....k.....', 'd..d..d.....'],
    },
    {
      name: 'build',
      hard: ['d.dd.dk.kk.k', 'd.dk.kd.dk.k', 'dkdd..dkdk..', 'D..K..r----.'],
      medium: ['d..d.dk..k.k', 'd..d.dk..k.k', 'd.dd..k.kk..', 'D..K..r----.'],
      easy: ['d..d..k..k..', 'd..d..k..k..', 'd..d..d..d..', 'D.....r----.'],
    },
    {
      name: 'chorus', gogo: true,
      hard: [
        'D..k.dd.dk..', 'd.dk.kd..k.k', 'D..k.dd.dk..', 'd.dkdkd..K..',
        'D..k.dd.dk..', 'd.dk.kd..k.k', 'D..k.dd.dk.k', 'd.dk..B----.',
      ],
      medium: [
        'D..k..d.dk..', 'd..d.dk..k..', 'D..k..d.dk..', 'd..k.kd..K..',
        'D..k..d.dk..', 'd..d.dk..k..', 'D..k..d.dk..', 'd..k..B----.',
      ],
      easy: [
        'D.....k.....', 'd..d..k.....', 'D.....k.....', 'd..d..D.....',
        'D.....k.....', 'd..d..k.....', 'D.....k.....', 'd..d..B----.',
      ],
      balloon: { easy: 4, medium: 5, hard: 7 },
    },
    {
      name: 'verse',
      hard: ['d..k.dd.dk..', 'd.dk..d.dk.k', 'd..k.dd.dk..', 'dkdk..d..k..'],
      medium: ['d..k..d.dk..', 'd..k.dd..k..', 'd..k..d.dk..', 'd.dk..d..k..'],
      easy: ['d.....k.....', 'd..d..k..k..', 'd.....k.....', 'd..d..d.....'],
    },
    {
      name: 'build',
      hard: ['d.dd.dk.kk.k', 'd.dk.kd.dk.k', 'dkdd..dkdk..', 'D..K..R----.'],
      medium: ['d..d.dk..k.k', 'd..d.dk..k.k', 'd.dd..k.kk..', 'D..K..R----.'],
      easy: ['d..d..k..k..', 'd..d..k..k..', 'd..d..d..d..', 'D.....R----.'],
    },
    {
      name: 'chorus', gogo: true,
      hard: [
        'D..k.dd.dk..', 'd.dk.kd..k.k', 'D..k.dd.dk..', 'd.dkdkd..K..',
        'D..k.dd.dk..', 'd.dk.kd..k.k', 'D..k.dd.dk.k', 'd.dkdkd.dK..',
      ],
      medium: [
        'D..k..d.dk..', 'd..d.dk..k..', 'D..k..d.dk..', 'd..k.kd..K..',
        'D..k..d.dk..', 'd..d.dk..k..', 'D..k..d.dk..', 'd.dk..d..K..',
      ],
      easy: [
        'D.....k.....', 'd..d..k.....', 'D.....k.....', 'd..d..D.....',
        'D.....k.....', 'd..d..k.....', 'D.....k.....', 'd..d..k..K..',
      ],
    },
    {
      name: 'outro',
      hard: ['d..k.dd..k.k', 'R-------....', 'D...........'],
      medium: ['d..k..d..k..', 'R-------....', 'D...........'],
      easy: ['d.....k.....', 'R-------....', 'D...........'],
    },
  ],

  // [note, triplet steps] pairs, one list per measure; 2 + 1 is a swung pair
  melodySteps: 12,
  melody: {
    intro: [
      [['A4', 3], ['E5', 3], ['D5', 3], ['E5', 3]],
      [['F5', 3], ['E5', 3], ['D5', 6]],
      [['A4', 3], ['E5', 3], ['D5', 3], ['Bb4', 3]],
      [['A4', 6], ['-', 6]],
    ],
    verse: [
      [['A4', 2], ['Bb4', 1], ['D5', 3], ['E5', 2], ['D5', 1], ['Bb4', 3]],
      [['A4', 3], ['F4', 2], ['E4', 1], ['F4', 3], ['A4', 3]],
      [['A4', 2], ['Bb4', 1], ['D5', 3], ['E5', 2], ['F5', 1], ['E5', 3]],
      [['D5', 2], ['Bb4', 1], ['A4', 6], ['-', 3]],
    ],
    build: [
      [['D5', 2], ['E5', 1], ['F5', 3], ['D5', 2], ['E5', 1], ['F5', 3]],
      [['E5', 2], ['F5', 1], ['A5', 3], ['E5', 2], ['F5', 1], ['A5', 3]],
      [['F5', 2], ['A5', 1], ['Bb5', 3], ['A5', 2], ['F5', 1], ['E5', 3]],
      [['E5', 6], ['-', 6]],
    ],
    chorus: [
      [['A5', 3], ['F5', 2], ['E5', 1], ['F5', 3], ['E5', 2], ['D5', 1]],
      [['E5', 3], ['D5', 2], ['Bb4', 1], ['A4', 6]],
      [['A5', 3], ['F5', 2], ['E5', 1], ['F5', 3], ['A5', 2], ['Bb5', 1]],
      [['A5', 6], ['F5', 3], ['E5', 3]],
      [['A5', 3], ['F5', 2], ['E5', 1], ['F5', 3], ['E5', 2], ['D5', 1]],
      [['E5', 3], ['D5', 2], ['Bb4', 1], ['D5', 3], ['E5', 3]],
      [['F5', 3], ['E5', 2], ['D5', 1], ['E5', 3], ['D5', 2], ['Bb4', 1]],
      [['A4', 9], ['-', 3]],
    ],
    outro: [
      [['A5', 2], ['F5', 1], ['E5', 3], ['D5', 2], ['Bb4', 1], ['A4', 3]],
      [['D5', 3], ['E5', 3], ['A5', 6]],
      [['A4', 12]],
    ],
  },

  bass: {
    intro: ['A2', 'A2', 'A2', 'E2'],
    verse: ['A2', 'F2', 'D2', 'E2'],
    build: ['D2', 'E2', 'F2', 'E2'],
    chorus: ['F2', 'A2', 'F2', 'E2', 'F2', 'A2', 'D2', 'A2'],
    outro: ['F2', 'E2', 'A2'],
  },

  arrange(kit, measures, { at, measure }) {
    playMelody(kit, this, measures, kit.koto);
    measures.forEach((entry, m) => {
      const { name } = entry.section;
      const root = rootOf(this, entry);
      const last = name === 'outro' && entry.index === 2;
      // a shaker carries the swing: long, short, long, short
      if (name !== 'intro' && !last) {
        for (let beat = 0; beat < 4; beat++) {
          kit.shaker(at(m, beat * 3), beat % 2 ? 1 : 0.6);
          kit.shaker(at(m, beat * 3 + 2), 0.45);
        }
      }
      // hand bell on the back beats of the chorus
      if (name === 'chorus') [3, 9].forEach(step => kit.bell(at(m, step), 0.8));
      // water drops: a chime at the top of every other measure
      if (entry.index % 2 === 0 && name !== 'build') kit.chime(at(m), root * 8);
      if (name === 'chorus' || name === 'outro') kit.chime(at(m, 6), root * 12);
      // a second koto answers low on the swung off-beats
      if (name === 'verse' || name === 'chorus') [5, 11].forEach(step => kit.koto(at(m, step), root * (step === 5 ? 3 : 4), 0.3));
      kit.pad(at(m), root * 2, measure);
      const walk = name === 'chorus' ? [0, 5, 6, 9] : name === 'build' ? [0, 3, 6, 9] : last ? [0] : [0, 6];
      walk.forEach(step => kit.bass(at(m, step), root, last ? 1.6 : 0.5));
    });
  },
};
