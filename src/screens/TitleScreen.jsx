import { useEffect } from 'react';
import { Backdrop } from '../ui/Backdrop.jsx';
import { audio } from '../game/audio.js';
import { padForKey } from '../game/input.js';

export function TitleScreen({ online, onStart }) {
  useEffect(() => {
    const down = async event => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'Tab' || event.key === 'Shift') return;
      const pad = padForKey(event);
      event.preventDefault();
      await audio.unlock();
      if (pad?.kind === 'ka') audio.ka(true); else audio.don(true);
      onStart();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [onStart]);

  const begin = async () => {
    await audio.unlock();
    audio.don(true);
    onStart();
  };

  return (
    <section className="title" aria-label="Title screen">
      <Backdrop variant="title" bpm={132} />
      <div className="title-logo">
        <p className="title-kana">たいこナイツ</p>
        <h1><span>TAIKO</span><span>NIGHTS</span></h1>
        <p className="title-tag">Your music, your rhythm</p>
      </div>
      <button className="title-start" onClick={begin} autoFocus>
        <strong>たたいてスタート</strong>
        <span>Hit any drum key or tap to start</span>
      </button>
      <ul className="title-keys" aria-label="Drum keys">
        <li className="ka"><kbd>D</kbd>カッ</li>
        <li className="don"><kbd>F</kbd>ドン</li>
        <li className="don"><kbd>J</kbd>ドン</li>
        <li className="ka"><kbd>K</kbd>カッ</li>
      </ul>
      <p className={`title-status ${online ? 'online' : 'offline'}`}>
        <i />{online === null ? 'Looking for the analysis server…' : online ? 'Analysis server connected' : 'Analysis server offline · songs are analysed on this device'}
      </p>
    </section>
  );
}
