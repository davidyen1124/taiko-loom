// How to play. It opens by itself before the first song, and from the
// question mark on the song shelf. What it says about the drum depends on how
// the device is played: four keys, or four zones of the display.
import { useCallback, useEffect, useRef } from 'react';
import { Dialog } from './Dialog.jsx';
import { fingers } from './device.js';
import { NoteIcon } from './icons.jsx';
import { audio } from '../game/audio.js';
import { PADS, padForKey } from '../game/input.js';

const NOTES = [
  { type: 'bigDon', name: '大 Big notes', how: <><kbd>F</kbd>+<kbd>J</kbd> or <kbd>D</kbd>+<kbd>K</kbd> pay double</>, touch: <>Both thumbs together pay double</> },
  { type: 'roll', name: '連打 Drumroll', how: <>Hit any key as fast as you can until it ends</>, touch: <>Tap as fast as you can until it ends</> },
  { type: 'balloon', name: 'ふうせん Balloon', how: <>Hit ドン the number of times shown</>, touch: <>Tap ドン the number of times shown</> },
];

const WORDS = { don: 'ドン', ka: 'カッ' };
const PLACES = { 'ka-left': 'Left end', 'don-left': 'Left of middle', 'don-right': 'Right of middle', 'ka-right': 'Right end' };

export function HelpDialog({ onClose, first = false }) {
  const touch = fingers();
  const pads = useRef({});

  // A pad can be tried out, with a finger, the mouse or its key.
  const sound = useCallback(({ kind, hand }) => {
    if (kind === 'ka') audio.ka(false); else audio.don(false);
    pads.current[`${kind}-${hand}`]?.animate([{ transform: 'scale(.94)' }, { transform: 'none' }], { duration: 140, easing: 'ease-out' });
  }, []);
  useEffect(() => {
    const down = event => {
      const pad = event.repeat ? null : padForKey(event);
      if (pad) sound(pad);
    };
    window.addEventListener('keydown', down, true);
    return () => window.removeEventListener('keydown', down, true);
  }, [sound]);

  return (
    <Dialog title="How to play" kana="あそびかた" onClose={onClose} className="help">
      <p className="help-lead">Notes ride in from the right. Strike the drum as each one reaches the circle.</p>
      <div className={`help-pads ${touch ? 'zones' : 'keys'}`} role="group" aria-label={touch ? 'The four zones of the screen' : 'The four drum keys'}>
        {PADS.map(pad => (
          <button key={pad.key} className={`help-pad ${pad.kind}`} ref={node => { pads.current[`${pad.kind}-${pad.hand}`] = node; }} onPointerDown={() => sound(pad)}>
            <NoteIcon type={pad.kind} size={50} />
            <strong>{WORDS[pad.kind]}</strong>
            {touch ? <small>{PLACES[`${pad.kind}-${pad.hand}`]}</small> : <kbd className={pad.kind}>{pad.key}</kbd>}
          </button>
        ))}
      </div>
      <p className="help-how">
        {touch
          ? <>The whole screen is the drum, in these four zones. Tap red for <b>ドン</b> and blue for <b>カッ</b>, at any height. Try them here.</>
          : <>Four keys, two for each hand. Red notes are <b>ドン</b>, blue notes are <b>カッ</b>. Try them here.</>}
      </p>
      <div className="help-columns">
        <ul className="help-notes">
          {NOTES.map(note => (
            <li key={note.type}><NoteIcon type={note.type} size={note.type === 'bigDon' ? 52 : 42} /><strong>{note.name}</strong><span>{touch ? note.touch : note.how}</span></li>
          ))}
        </ul>
        <div className="help-tips">
          <div><h3>Timing</h3><p><b className="good">良</b> right on the beat · <b className="ok">可</b> close · <b className="bad">不可</b> missed</p></div>
          <div><h3>Soul gauge</h3><p>Good hits fill it. Finish past the <b>クリア</b> line to clear the song.</p></div>
          <div><h3>Go-Go Time</h3><p>The loudest part of the song. The lane catches fire.</p></div>
        </div>
      </div>
      <footer className="dialog-foot help-foot">
        {touch
          ? <p className="help-keys">Hold your device sideways · the button at the top left pauses the song</p>
          : <p className="help-keys"><kbd>Esc</kbd> pause · <kbd>D</kbd><kbd>K</kbd> move in menus · <kbd>F</kbd><kbd>J</kbd> confirm</p>}
        <button className="button primary" onClick={onClose} autoFocus={first}>{first ? 'はじめる  Start' : 'Got it'}</button>
      </footer>
    </Dialog>
  );
}
