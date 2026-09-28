// Add a song: send it to the backend for analysis, or analyse it in the
// browser when there is no backend or it cannot be reached.
import { useEffect, useRef, useState } from 'react';
import { Upload, Music2, CircleAlert, WifiOff, FileAudio, ShieldCheck } from 'lucide-react';
import { Dialog } from './Dialog.jsx';
import { Mascot } from './icons.jsx';
import * as api from '../api.js';
import { audio } from '../game/audio.js';
import { keepLocalSong } from '../library.js';

const MAX_BYTES = 100 * 1024 * 1024;
const TYPES = /\.(mp3|wav|flac|ogg|oga|opus|m4a|aac|aiff?|wma|webm|mp4)$/i;
const size = bytes => (bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

function namesFrom(file) {
  const stem = file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ').replace(/^\d{1,3}[\s.-]+(?=\S)/, '').trim();
  const [left, ...rest] = stem.split(' - ');
  return rest.length ? { artist: left.trim(), title: rest.join(' - ').trim() } : { artist: '', title: stem };
}

async function analyseOnDevice(file, names, report) {
  report({ message: 'Reading your song', progress: 0.1 });
  const bytes = await file.arrayBuffer();
  report({ message: 'Tuning the drums', progress: 0.3 });
  let buffer;
  try { buffer = await audio.decode(bytes); } catch { throw new Error('This browser cannot play that audio format.'); }
  report({ message: 'Finding the beat', progress: 0.55 });
  const mono = new Float32Array(buffer.length);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < mono.length; i++) mono[i] += data[i] / buffer.numberOfChannels;
  }
  const song = await new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../analysis.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => { worker.terminate(); if (data.error) reject(new Error(data.error)); else resolve(data.song); };
    worker.onerror = () => { worker.terminate(); reject(new Error('Could not analyse this audio. Try another file.')); };
    worker.postMessage({ samples: mono, sampleRate: buffer.sampleRate, title: names.title || 'Untitled', artist: names.artist || 'Unknown artist' }, [mono.buffer]);
  });
  report({ message: 'Saving to this device', progress: 0.92 });
  const kept = await keepLocalSong(song, buffer, file);
  report({ message: 'Ready to play', progress: 1 });
  return kept;
}

export function UploadDialog({ online, backend, onClose, onAdded }) {
  const [file, setFile] = useState(null);
  const [names, setNames] = useState({ title: '', artist: '' });
  const [status, setStatus] = useState(null);      // { message, progress }
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const input = useRef();
  const cancel = useRef(null);
  useEffect(() => {
    // made here rather than at first render, so a remount gets a fresh signal
    cancel.current = new AbortController();
    return () => cancel.current.abort();
  }, []);

  const choose = picked => {
    setError('');
    if (!picked) return;
    if (!TYPES.test(picked.name) && !picked.type.startsWith('audio/')) { setError('Choose an audio file such as MP3, WAV, FLAC, OGG or M4A.'); return; }
    if (picked.size > MAX_BYTES) { setError('Choose audio smaller than 100 MB.'); return; }
    if (picked.size === 0) { setError('That file is empty.'); return; }
    setFile(picked);
    setNames(namesFrom(picked));
  };

  const analyse = async () => {
    if (!file || status) return;
    setError('');
    await audio.unlock();
    try {
      let song;
      let useServer = online;
      if (useServer) {
        try {
          setStatus({ message: 'Sending your song', progress: 0.02 });
          const job = await api.uploadSong(file, names, sent => setStatus({ message: 'Sending your song', progress: 0.02 + sent * 0.18 }));
          const done = await api.followJob(job.id, update => setStatus({ message: update.message, progress: 0.2 + update.progress * 0.8 }), { signal: cancel.current.signal });
          song = { ...done.song, source: 'server' };
        } catch (failure) {
          if (!failure.offline) throw failure;
          useServer = false;
        }
      }
      if (!useServer) song = await analyseOnDevice(file, names, setStatus);
      audio.jingle('clear');
      onAdded(song);
    } catch (failure) {
      if (failure.name === 'AbortError') return;
      setStatus(null);
      setError(failure.message || 'Something went wrong. Try another file.');
    }
  };

  const busy = Boolean(status);
  return (
    <Dialog title="Add your music" kana="曲をついか" onClose={onClose} className="upload" locked={busy}>
      {busy ? (
        <div className="upload-progress" role="status" aria-live="polite">
          <Mascot size={228} mood="gogo" bpm={150} drumming />
          <strong>{status.message}</strong>
          <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(status.progress * 100)}>
            <i style={{ width: `${Math.round(status.progress * 100)}%` }} />
          </div>
          <small>{names.title || file.name} · writing Easy, Medium and Hard</small>
        </div>
      ) : (
        <>
          <button
            type="button"
            className={`dropzone ${over ? 'over' : ''} ${file ? 'filled' : ''}`}
            onClick={() => input.current.click()}
            onDragOver={event => { event.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={event => { event.preventDefault(); setOver(false); choose(event.dataTransfer.files[0]); }}
          >
            {file ? <FileAudio size={40} strokeWidth={2.2} /> : <Upload size={40} strokeWidth={2.2} />}
            <strong>{file ? file.name : 'Choose a song or drop it here'}</strong>
            <span>{file ? `${size(file.size)} · click to choose a different file` : 'MP3, WAV, FLAC, OGG or M4A · up to 100 MB and 15 minutes'}</span>
          </button>
          <input ref={input} className="visually-hidden" type="file" tabIndex={-1} aria-label="Choose an audio file" accept="audio/*,.mp3,.wav,.flac,.ogg,.oga,.opus,.m4a,.aac,.aiff,.wma" onChange={event => { choose(event.target.files[0]); event.target.value = ''; }} />
          <div className="fields">
            <label htmlFor="song-title">Title<input id="song-title" type="text" maxLength={120} placeholder="Read from the file" value={names.title} onChange={event => setNames({ ...names, title: event.target.value })} disabled={!file} /></label>
            <label htmlFor="song-artist">Artist<input id="song-artist" type="text" maxLength={120} placeholder="Read from the file" value={names.artist} onChange={event => setNames({ ...names, artist: event.target.value })} disabled={!file} /></label>
          </div>
          {error && <p className="notice error" role="alert"><CircleAlert size={20} strokeWidth={2.6} />{error}</p>}
          {!backend && <p className="notice"><ShieldCheck size={20} strokeWidth={2.6} />Your song is analysed in your browser and saved on this device. Nothing is uploaded.</p>}
          {backend && !online && <p className="notice"><WifiOff size={20} strokeWidth={2.6} />The analysis server is offline, so this song will be analysed in your browser and saved on this device.</p>}
          <footer className="dialog-foot">
            <button className="button ghost" onClick={onClose}>Cancel</button>
            <button className="button primary" onClick={analyse} disabled={!file}><Music2 size={20} strokeWidth={2.8} />Analyse and add</button>
          </footer>
        </>
      )}
    </Dialog>
  );
}
