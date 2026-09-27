import { useEffect, useRef, useState } from 'react';
import { X, Upload, Link, LoaderCircle, Music2, Trophy, RotateCcw, Play, Pause, Volume2, VolumeX, Maximize, Settings2, CircleHelp } from 'lucide-react';
import { accuracy } from './engine';

export function Modal({ title, onClose, children, className = '' }) {
  const ref = useRef();
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className={`modal ${className}`} onCancel={onClose} onClick={e => { if (e.target === ref.current) onClose(); }}>
    <header><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={22}/></button></header>{children}
  </dialog>;
}

export function SongPicker({ track, busy, error, onClose, onImport, onDefault }) {
  const [url, setUrl] = useState('');
  return <Modal title="Find your rhythm" onClose={onClose}>
    <p className="modal-intro">Turn your music into a night at the festival.</p>
    <button className="song-choice" onClick={onDefault} disabled={busy}><span className="song-art"><Music2/></span><span><strong>Janice STFU</strong><small>Drake · ICEMAN · 3:57</small></span><span className="song-tag">{track?.artist === 'Drake' ? 'LOADED' : 'PLAY'}</span></button>
    <div className="separator"><span>or bring your own song</span></div>
    <label className={`upload-zone ${busy ? 'disabled' : ''}`}><Upload/><strong>Choose an audio file</strong><span>FLAC, MP3, WAV, OGG · up to 100 MB / 15 min</span><input aria-label="Choose an audio file" type="file" accept="audio/*,.flac,.mp3,.wav,.ogg,.m4a" disabled={busy} onChange={e => { if(e.target.files[0]) onImport(e.target.files[0]); }}/></label>
    <form onSubmit={e => { e.preventDefault(); onImport(url); }}><label htmlFor="audio-url">Or paste an audio URL</label><div className="url-field"><Link size={18}/><input id="audio-url" type="url" placeholder="https://…/your-song.flac" value={url} onChange={e=>setUrl(e.target.value)} required/><button disabled={busy || !url} type="submit">Analyze</button></div></form>
    {busy ? <p className="analysis-status"><LoaderCircle className="spin" size={18}/>{busy}</p> : <p className="fine-print">Files are analyzed on your device. Audio URLs must allow browser access.</p>}
    {error && <p className="error" role="alert">{error}</p>}
  </Modal>;
}

export function Settings({ values, setValues, onClose }) {
  return <Modal title="Make it feel right" onClose={onClose}>
    <p className="modal-intro">A little tuning goes a long way.</p>
    <label className="setting-label" htmlFor="offset"><span>Timing offset<small>Positive values accept later hits. Try +80 ms with Bluetooth audio.</small></span><output>{values.offset > 0 ? '+' : ''}{values.offset} ms</output></label>
    <input id="offset" type="range" min="-250" max="250" step="5" value={values.offset} onChange={e=>setValues(v=>({...v,offset:+e.target.value}))}/>
    <label className="setting-label" htmlFor="speed"><span>Note scroll speed<small>Changes spacing, not the music or the beat.</small></span><output>{values.speed.toFixed(1)}×</output></label>
    <input id="speed" type="range" min="0.7" max="1.5" step="0.1" value={values.speed} onChange={e=>setValues(v=>({...v,speed:+e.target.value}))}/>
    <label className="toggle-setting"><span>Drum sounds<small>Hear every Don and Ka.</small></span><input type="checkbox" checked={values.sfx} onChange={e=>setValues(v=>({...v,sfx:e.target.checked}))}/></label>
    <button className="secondary full" onClick={()=>setValues({offset:0,speed:1,sfx:true})}>Reset settings</button>
  </Modal>;
}

export function Help({ onClose }) {
  return <Modal title="One song. Four keys." onClose={onClose}>
    <p className="modal-intro">Hit each note when its center meets the rings on the left.</p>
    <div className="help-note"><div className="sprite don"/><div><strong>Don · the red notes</strong><p>Hit the center with <kbd>F</kbd> or <kbd>J</kbd>.</p></div></div>
    <div className="help-note"><div className="sprite ka"/><div><strong>Ka · the blue notes</strong><p>Hit the rim with <kbd>D</kbd> or <kbd>K</kbd>.</p></div></div>
    <div className="help-details"><p><strong>Big notes</strong> · press both matching keys together for double points.</p><p><strong>Yellow drumrolls</strong> · tap any drum key repeatedly.</p><p><strong>Perfect / Good / Miss</strong> · precise hits build your combo and soul gauge. Reach 80% soul to clear.</p><p><kbd>Space</kbd> pause or resume · <kbd>R</kbd> restart · <kbd>Esc</kbd> pause</p></div>
    <p className="fine-print">Charts are automatically estimated from the audio. Use Settings to adjust timing for your headphones.</p>
    <button className="primary full" onClick={onClose}>Let’s play</button>
  </Modal>;
}

export function Results({ stats, best, track, difficulty, onRestart, onClose }) {
  const acc = accuracy(stats); const grade = acc >= 98 ? 'S' : acc >= 90 ? 'A' : acc >= 75 ? 'B' : acc >= 60 ? 'C' : 'D';
  return <Modal title={stats.soul >= 80 ? 'Festival cleared!' : 'Keep the rhythm going'} onClose={onClose} className="results">
    <div className="result-grade">{grade}</div><h3>{track.title}</h3><p className="result-sub">{track.artist} · {difficulty}</p>
    <div className="result-score">{stats.score.toLocaleString()}<small>FINAL SCORE</small></div>
    <div className="result-grid"><span><b>{stats.perfect}</b>Perfect</span><span><b>{stats.good}</b>Good</span><span><b>{stats.miss}</b>Miss</span><span><b>{stats.maxCombo}</b>Max combo</span><span><b>{acc.toFixed(1)}%</b>Accuracy</span><span><b>{stats.roll}</b>Roll hits</span></div>
    <p className="best-score"><Trophy size={16}/> Personal best · {best.toLocaleString()}</p>
    <button className="primary full" onClick={onRestart}><RotateCcw size={18}/>Play again</button>
  </Modal>;
}

export function Controls({ track, difficulty, onDifficulty, state, onPlay, onRestart, volume, setVolume, onSettings, onHelp, onFullscreen, busy }) {
  const playing = state === 'playing';
  return <section className="controls-bar" aria-label="Game controls">
    <div className="current-song"><Music2 size={27}/><div><h1>{track?.title || 'Loading song…'} <span>/ {track?.artist || 'Taiko Nights'}</span></h1><p>{track ? `${track.bpm} BPM · ${track.charts[difficulty].length} notes` : 'Getting the festival ready'}</p></div></div>
    <div className="difficulties" role="group" aria-label="Difficulty">{['easy','medium','hard'].map(level=><button key={level} disabled={busy} aria-pressed={difficulty===level} className={difficulty===level?'selected':''} onClick={()=>onDifficulty(level)}>{level}</button>)}</div>
    <button className="primary play-button" disabled={busy || !track} onClick={onPlay}>{busy ? <LoaderCircle className="spin" size={23}/> : playing ? <Pause fill="currentColor" size={23}/> : <Play fill="currentColor" size={23}/>}<span>{busy ? 'Loading' : playing ? 'Pause' : state==='paused' ? 'Resume' : state==='results' ? 'Replay' : 'Play'}</span></button>
    <div className="volume"><button className="icon-button" aria-label={volume ? 'Mute' : 'Unmute'} onClick={()=>setVolume(volume ? 0 : .75)}>{volume ? <Volume2 size={22}/> : <VolumeX size={22}/>}</button><input aria-label="Music volume" type="range" min="0" max="1" step=".01" value={volume} onChange={e=>setVolume(+e.target.value)}/></div>
    <div className="compact-tools"><button className="icon-button" aria-label="Restart song" disabled={!track || busy} onClick={onRestart}><RotateCcw size={18}/></button><button className="icon-button" aria-label="Settings" onClick={onSettings}><Settings2 size={18}/></button><button className="icon-button" aria-label="How to play" onClick={onHelp}><CircleHelp size={18}/></button><button className="icon-button" aria-label="Fullscreen" onClick={onFullscreen}><Maximize size={18}/></button></div>
  </section>;
}
