// Screen flow: title -> song select -> play -> results.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage } from './ui/Stage.jsx';
import { TitleScreen } from './screens/TitleScreen.jsx';
import { SongSelect } from './screens/SongSelect.jsx';
import { PlayScreen } from './screens/PlayScreen.jsx';
import { ResultsScreen } from './screens/ResultsScreen.jsx';
import { SettingsDialog } from './ui/SettingsDialog.jsx';
import { HelpDialog } from './ui/HelpDialog.jsx';
import { UploadDialog } from './ui/UploadDialog.jsx';
import { FrameMeter } from './ui/FrameMeter.jsx';
import { Mascot } from './ui/icons.jsx';
import { audio } from './game/audio.js';
import { FIRST_SONG, renderDemoAudio } from './game/songs/index.js';
import { loadFonts } from './fonts.js';
import { loadPlates } from './game/art/plates.js';
import { loadSprites } from './game/art/sprites.js';
import { loadAudio, loadShelf, loadSong, removeSong } from './library.js';
import { stopPreview } from './preview.js';
import { forgetSong, hasSeen, loadRecords, loadSettings, markSeen, saveRecord, saveSettings } from './storage.js';
import './styles.css';

const METER = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fps');

export function App() {
  const [screen, setScreen] = useState('title');
  const [songs, setSongs] = useState([]);
  const [settings, setSettings] = useState(loadSettings);
  const [records, setRecords] = useState(loadRecords);
  const [dialog, setDialog] = useState(null);           // settings | help | first | upload
  const [loading, setLoading] = useState(null);         // { title, progress }
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);         // { song, buffer, difficulty }
  const [result, setResult] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [focus, setFocus] = useState(FIRST_SONG);
  const [, setPlates] = useState(false);
  const played = useRef(settings);

  const refresh = useCallback(async () => {
    const next = await loadShelf();
    setSongs(next);
    return next;
  }, []);

  useEffect(() => {
    loadFonts();
    Promise.all([loadPlates(), loadSprites()]).then(() => setPlates(true));
    refresh();
    renderDemoAudio(FIRST_SONG).catch(() => {});
  }, [refresh]);

  useEffect(() => {
    saveSettings(settings);
    audio.setVolumes({ music: settings.music, sfx: settings.sfx });
  }, [settings]);

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(''), 6000);
    return () => clearTimeout(timer);
  }, [error]);

  const play = useCallback(async (summary, difficulty) => {
    setError('');
    setFocus(summary.id);
    setLoading({ title: summary.title, progress: 0 });
    try {
      await audio.unlock();
      const song = await loadSong(summary);
      const buffer = await loadAudio(song, progress => setLoading({ title: summary.title, progress }));
      await loadFonts(`${song.title}${song.artist}`);
      played.current = settings;
      setSession({ song, buffer, difficulty });
      setResult(null);
      // the first song waits until the player has been shown how to play
      if (!settings.auto && !hasSeen('help')) setDialog('first');
      else setScreen('play');
    } catch (failure) {
      setError(failure.message || 'This song could not be loaded.');
      refresh();
    } finally {
      setLoading(null);
    }
  }, [settings, refresh]);

  const finish = useCallback(run => {
    setResult(run);
    setOutcome(run.auto ? null : saveRecord(session.song.id, run.difficulty, run));
    setRecords(loadRecords());
    setScreen('results');
  }, [session]);

  const retry = useCallback(() => {
    setSession(current => ({ ...current }));
    setScreen('play');
  }, []);

  const toSongs = useCallback(() => {
    setScreen('select');
    refresh();
  }, [refresh]);

  const added = useCallback(async song => {
    setDialog(null);
    await refresh();
    setFocus(song.id);
    if (song.saved === false) setError('This browser would not save the song, so it stays until you close the page.');
  }, [refresh]);

  const remove = useCallback(async song => {
    try {
      stopPreview();
      await removeSong(song);
      forgetSong(song.id);
      setRecords(loadRecords());
      audio.jingle('back');
    } catch (failure) {
      setError(failure.message || 'This song could not be removed.');
    }
    const next = await refresh();
    setFocus(next[0]?.id);
  }, [refresh]);

  return (
    <Stage>
      {screen === 'title' && <TitleScreen onStart={() => { setScreen('select'); refresh(); }} />}
      {screen === 'select' && (
        <SongSelect
          songs={songs} records={records} settings={settings} busy={Boolean(dialog || loading)} initial={focus}
          onPlay={play} onAdd={() => setDialog('upload')} onDelete={remove}
          onSettings={() => { audio.jingle('confirm'); setDialog('settings'); }} onHelp={() => { audio.jingle('confirm'); setDialog('help'); }}
          onBack={() => { stopPreview(); setScreen('title'); }}
        />
      )}
      {screen === 'play' && session && (
        <PlayScreen song={session.song} buffer={session.buffer} difficulty={session.difficulty} settings={played.current} session={session} onFinish={finish} onQuit={toSongs} />
      )}
      {screen === 'results' && result && (
        <ResultsScreen song={session.song} result={result} outcome={outcome} onRetry={retry} onSongs={toSongs} />
      )}

      {dialog === 'settings' && <SettingsDialog settings={settings} onChange={setSettings} onClose={() => setDialog(null)} />}
      {dialog === 'help' && <HelpDialog onClose={() => { markSeen('help'); setDialog(null); }} />}
      {dialog === 'first' && <HelpDialog first onClose={() => { markSeen('help'); setDialog(null); setScreen('play'); }} />}
      {dialog === 'upload' && <UploadDialog onClose={() => setDialog(null)} onAdded={added} />}

      {loading && (
        <div className="loading" role="status" aria-live="polite">
          <Mascot size={240} mood="idle" bpm={140} drumming />
          <strong>{loading.title}</strong>
          <div className="meter"><i style={{ width: `${Math.round(loading.progress * 100)}%` }} /></div>
          <span>じゅんびちゅう… Getting the stage ready</span>
        </div>
      )}
      {error && <p className="toast" role="alert">{error}</p>}
      {METER && <FrameMeter />}
    </Stage>
  );
}
