import { useEffect, useRef, useState } from 'react';
import { Volume2, Music, Gauge, Timer, Bot, Hand, RotateCcw } from 'lucide-react';
import { Dialog } from './Dialog.jsx';
import { audio } from '../game/audio.js';
import { DEFAULT_SETTINGS, LIMITS } from '../storage.js';

function Slider({ id, icon: Icon, label, hint, value, display, min, max, step, onChange }) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="setting">
      <label htmlFor={id}><Icon size={22} strokeWidth={2.6} /><span>{label}<small>{hint}</small></span></label>
      <input id={id} type="range" aria-label={label} aria-valuetext={display} min={min} max={max} step={step} value={value} style={{ '--fill': `${fill}%` }} onChange={event => onChange(Number(event.target.value))} />
      <output htmlFor={id}>{display}</output>
    </div>
  );
}

function Toggle({ id, icon: Icon, label, hint, value, onChange }) {
  return (
    <div className="setting">
      <label htmlFor={id}><Icon size={22} strokeWidth={2.6} /><span>{label}<small>{hint}</small></span></label>
      <button id={id} role="switch" aria-label={label} aria-checked={value} className={`switch ${value ? 'on' : ''}`} onClick={() => onChange(!value)}><i /></button>
      <output>{value ? 'On' : 'Off'}</output>
    </div>
  );
}

// Tap along to a click: the average distance from the beat is the offset.
function Calibrate({ onResult }) {
  const [running, setRunning] = useState(false);
  const [taps, setTaps] = useState([]);
  const started = useRef(0);
  const INTERVAL = 0.5;

  useEffect(() => {
    if (!running) return undefined;
    let stopped = false;
    audio.unlock().then(() => {
      if (stopped) return;
      started.current = audio.context.currentTime + 0.6;
      for (let i = 0; i < 12; i++) audio.tone({ type: 'square', from: i % 4 ? 880 : 1320, to: 880, length: 0.05, gain: 0.35, delay: 0.6 + i * INTERVAL });
    });
    const finish = setTimeout(() => setRunning(false), (0.6 + 12 * INTERVAL) * 1000);
    const down = event => {
      if (event.repeat || !'dfjk '.includes(event.key.toLowerCase())) return;
      event.preventDefault(); event.stopPropagation();
      tap(event.timeStamp);
    };
    window.addEventListener('keydown', down, true);
    return () => { stopped = true; clearTimeout(finish); window.removeEventListener('keydown', down, true); };
  }, [running]);

  const tap = stamp => {
    const heard = audio.heard(stamp) - started.current;
    if (heard < -0.2) return;
    const nearest = Math.round(heard / INTERVAL) * INTERVAL;
    setTaps(list => [...list, (heard - nearest) * 1000]);
  };

  useEffect(() => {
    if (running || taps.length < 4) return;
    const usable = taps.slice(1).sort((a, b) => a - b);
    const middle = usable.slice(Math.floor(usable.length * 0.2), Math.ceil(usable.length * 0.8));
    const average = middle.reduce((sum, value) => sum + value, 0) / middle.length;
    onResult(Math.max(LIMITS.offset.min, Math.min(LIMITS.offset.max, Math.round(average / 5) * 5)));
  }, [running, taps, onResult]);

  return (
    <div className="calibrate">
      <button className="button small" onClick={() => { setTaps([]); setRunning(true); }} disabled={running}>
        {running ? `Tap with the clicks… ${taps.length}` : 'Measure my timing'}
      </button>
      {running
        ? <button className="button small tap" onPointerDown={event => tap(event.timeStamp)}>Tap here</button>
        : <small>{taps.length >= 4 ? 'Offset updated from your taps.' : 'Plays 12 clicks. Tap F, J or the button on each one.'}</small>}
    </div>
  );
}

export function SettingsDialog({ settings, onChange, onClose }) {
  const set = (key, value) => onChange({ ...settings, [key]: value });
  useEffect(() => { audio.setVolumes({ music: settings.music, sfx: settings.sfx }); }, [settings.music, settings.sfx]);
  return (
    <Dialog title="Settings" kana="せってい" onClose={onClose} className="settings">
      <Slider id="set-music" icon={Music} label="Music" hint="Song volume" value={settings.music} display={`${Math.round(settings.music * 100)}%`} min={0} max={1} step={0.05} onChange={value => set('music', value)} />
      <Slider id="set-sfx" icon={Volume2} label="Drum sounds" hint="Don, ka and menu sounds" value={settings.sfx} display={`${Math.round(settings.sfx * 100)}%`} min={0} max={1} step={0.05} onChange={value => { set('sfx', value); audio.setVolumes({ music: settings.music, sfx: value }); audio.don(); }} />
      <Slider id="set-speed" icon={Gauge} label="Note speed" hint="Spreads notes out. The music is unchanged." value={settings.speed} display={`×${settings.speed.toFixed(1)}`} {...LIMITS.speed} onChange={value => set('speed', Math.round(value * 10) / 10)} />
      <Slider id="set-offset" icon={Timer} label="Timing offset" hint="Raise it if good hits are judged late (Bluetooth, TVs)." value={settings.offset} display={`${settings.offset > 0 ? '+' : ''}${settings.offset} ms`} {...LIMITS.offset} onChange={value => set('offset', value)} />
      <Calibrate onResult={value => set('offset', value)} />
      <Toggle id="set-auto" icon={Bot} label="Auto play" hint="Yoru plays for you. Scores are not saved." value={settings.auto} onChange={value => set('auto', value)} />
      <Toggle id="set-guide" icon={Hand} label="Touch zones" hint="Colour the four zones on touch screens. Hidden, the screen still plays." value={settings.guide} onChange={value => set('guide', value)} />
      <footer className="dialog-foot">
        <button className="button ghost" onClick={() => onChange({ ...DEFAULT_SETTINGS })}><RotateCcw size={18} strokeWidth={3} />Reset</button>
        <button className="button primary" onClick={onClose}>Done</button>
      </footer>
    </Dialog>
  );
}
