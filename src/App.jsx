import { useEffect, useRef, useState } from 'react';
import { Flower as Flower2, Music2, Trophy, Play, Headphones, ChevronRight } from 'lucide-react';
import { RhythmEngine, freshStats, accuracy } from './engine';
import { Controls, Help, Results, Settings, SongPicker } from './components';

const DEFAULT_URL = '';
const timeLabel = value => `${Math.floor(Math.max(0,value) / 60)}:${String(Math.floor(Math.max(0,value) % 60)).padStart(2,'0')}`;
const readSettings = () => { try { return {offset:0,speed:1,sfx:true,...JSON.parse(localStorage.getItem('taiko-settings-v1'))}; } catch { return {offset:0,speed:1,sfx:true}; } };
const getBest = (track, diff) => { try{return Number(localStorage.getItem(`taiko-best-v1-${track?.id}-${diff}`)) || 0;}catch{return 0;} };

export function App() {
  const [track,setTrack] = useState(null), [difficulty,setDifficulty] = useState('medium');
  const [game,setGame] = useState({state:'ready',time:-2.5,stats:freshStats()});
  const [modal,setModal] = useState(null), [busy,setBusy] = useState(''), [error,setError] = useState('');
  const [settings,setSettings] = useState(readSettings), [volume,setVolume] = useState(.75), [best,setBest] = useState(0);
  const engine = useRef(), canvas = useRef(), shell = useRef(), audioBytes = useRef(), workerRef = useRef(), abortRef = useRef();
  const actions = useRef({}); const [pressed,setPressed] = useState(''); const pressTimer=useRef();
  useEffect(()=>{
    const e = new RhythmEngine(setGame, stats=>{
      const old = getBest(e.track,e.difficulty); const high=Math.max(old,stats.score);
      try{localStorage.setItem(`taiko-best-v1-${e.track.id}-${e.difficulty}`,String(high));}catch{}
      setBest(high); setModal('results');
    }); engine.current=e; e.attach(canvas.current);
    const abort = new AbortController();
    fetch('/charts/default.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('Song chart is missing. Run the analysis script to prepare the track.');return r.json();}).then(data=>{setTrack(data);e.setTrack(data,'medium');setBest(getBest(data,'medium'));}).catch(err=>{if(err.name!=='AbortError')setError(err.message);});
    const keydown = event=>{
      if(event.target.closest('input,textarea,select,dialog') || actions.current.modal) return;
      const key=event.key.toLowerCase();
      if(['d','f','j','k',' ','r','escape'].includes(key)) event.preventDefault(); else return;
      if(event.repeat) return;
      if(key===' ') actions.current.play();
      else if(key==='r') actions.current.restart();
      else if(key==='escape') e.pause();
      else actions.current.hit(key);
    };
    const hidden=()=>{if(document.hidden)e.pause();}; const blur=()=>e.pause();
    window.addEventListener('keydown',keydown); document.addEventListener('visibilitychange',hidden); window.addEventListener('blur',blur);
    return()=>{abort.abort();e.destroy();workerRef.current?.terminate();abortRef.current?.abort();clearTimeout(pressTimer.current);window.removeEventListener('keydown',keydown);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('blur',blur);};
  },[]);
  useEffect(()=>{if(engine.current){engine.current.offset=settings.offset;engine.current.speed=settings.speed;engine.current.sfx=settings.sfx;} try{localStorage.setItem('taiko-settings-v1',JSON.stringify(settings));}catch{}},[settings]);
  useEffect(()=>{engine.current?.setVolume(volume);},[volume]);

  async function play() {
    const e=engine.current;
    if(!track || busy) return;
    if(e.state==='playing'){e.pause();return;}
    setError('');
    try{
      await e.context();
      if(!e.buffer){
        setBusy('Loading audio…');
        if(!audioBytes.current){ const response=await fetch(track.audio);if(!response.ok)throw new Error('Audio is missing. Run the analysis script to prepare the track.');audioBytes.current=await response.arrayBuffer(); }
        await e.loadAudio(audioBytes.current);
      }
      setBusy('');setModal(null);await e.play();
    }catch(err){setBusy('');setError(err.message || 'Unable to play audio.');}
  }
  function restart(){if(!track || busy)return;engine.current.restart();setModal(null);play();}
  function chooseDifficulty(level){if(!track || busy || level===difficulty)return;engine.current.setTrack(track,level);setDifficulty(level);setBest(getBest(track,level));setModal(null);}
  function openModal(name){engine.current.pause();setError('');setModal(name);}
  function hit(key){const type=key==='d'||key==='k'?'ka':'don';engine.current.hit(type,key);setPressed(key);clearTimeout(pressTimer.current);pressTimer.current=setTimeout(()=>setPressed(''),110);}
  actions.current={play,restart,hit,modal};
  async function loadDefault(){
    if(busy)return;
    const response=await fetch('/charts/default.json');const data=await response.json();audioBytes.current=null;engine.current.buffer=null;setTrack(data);engine.current.setTrack(data,difficulty);setBest(getBest(data,difficulty));setModal(null);setError('');
  }
  async function importSong(source){
    if(busy)return;setError('');engine.current.pause();
    try{
      if(typeof source==='string' && decodeURI(source)===decodeURI(DEFAULT_URL)){await loadDefault();return;}
      let bytes, title;
      setBusy('Reading audio…');
      if(typeof source==='string'){
        const url=new URL(source);if(!['http:','https:'].includes(url.protocol))throw new Error('Use an HTTP or HTTPS audio URL.');
        abortRef.current=new AbortController(); const timer=setTimeout(()=>abortRef.current?.abort(),60000);
        try{const response=await fetch(url,{signal:abortRef.current.signal});if(!response.ok)throw new Error(`Audio server returned ${response.status}.`);if(Number(response.headers.get('content-length'))>100*1024*1024)throw new Error('Please choose audio smaller than 100 MB.');const reader=response.body.getReader();const chunks=[];let size=0;while(true){const{done,value}=await reader.read();if(done)break;size+=value.length;if(size>100*1024*1024){await reader.cancel();throw new Error('Audio exceeds 100 MB.');}chunks.push(value);}bytes=await new Blob(chunks).arrayBuffer();}finally{clearTimeout(timer);}
        title=decodeURIComponent(url.pathname.split('/').pop()).replace(/\.[^.]+$/,'')||'Your song';
      }else{
        if(source.size>100*1024*1024)throw new Error('Please choose audio smaller than 100 MB.');bytes=await source.arrayBuffer();title=source.name.replace(/\.[^.]+$/,'');
      }
      setBusy('Decoding audio…'); const ctx=await engine.current.context();const buffer=await ctx.decodeAudioData(bytes.slice(0));
      if(buffer.duration>900)throw new Error('Choose a song shorter than 15 minutes.');
      if(buffer.duration<3)throw new Error('Choose a song at least 3 seconds long.');
      setBusy('Finding the beat. Building three charts…');
      const mono=new Float32Array(buffer.length);for(let ch=0;ch<buffer.numberOfChannels;ch++){const channel=buffer.getChannelData(ch);for(let i=0;i<mono.length;i++)mono[i]+=channel[i]/buffer.numberOfChannels;}
      const result=await new Promise((resolve,reject)=>{const worker=new Worker(new URL('./analysis.worker.js',import.meta.url),{type:'module'});workerRef.current=worker;worker.onmessage=({data})=>{worker.terminate();workerRef.current=null;data.error?reject(new Error(data.error)):resolve(data);};worker.onerror=()=>{worker.terminate();workerRef.current=null;reject(new Error('Could not analyze this audio. Try another file.'));};worker.postMessage({samples:mono,sampleRate:buffer.sampleRate,title},[mono.buffer]);});
      audioBytes.current=bytes;engine.current.buffer=buffer;engine.current.setTrack(result,difficulty);setTrack(result);setBest(getBest(result,difficulty));setModal(null);setBusy('');
    }catch(err){setBusy('');setError(err.name==='AbortError'?'The audio download timed out. Try a local file.':err.message==='Failed to fetch'?'Cannot read this URL. Check the server’s CORS settings, or choose a local file.':err.message);}
  }
  const {state,time,stats}=game;const progress=track?Math.max(0,Math.min(100,time/track.duration*100)):0;
  const isCounting=state==='playing'&&time<0;
  return <main ref={shell} className="app-shell">
    <nav className="top-nav" aria-label="Main navigation"><a className="brand" href="#" onClick={e=>{e.preventDefault();setModal(null);}}><Flower2 fill="currentColor" size={26}/><span>TAIKO NIGHTS</span></a><div className="nav-links"><button className={!modal?'active':''} onClick={()=>setModal(null)}>Play</button><button onClick={()=>openModal('songs')}>Songs</button><button onClick={()=>openModal('settings')}>Settings</button><button onClick={()=>openModal('help')}>How to play</button></div><span className="nav-motto">A LITTLE LOUDER TONIGHT<Flower2 size={22} fill="currentColor"/></span></nav>
    <section className={`game-board ${state==='playing'?'is-playing':''}`} aria-label="Taiko rhythm game">
      <div className="game-header"><div className={`sprite mascot ${pressed?'bounce':''}`} aria-hidden="true"/><div className="player-tag">1P</div><div className="scoreboard"><div className="score" aria-label={`Score ${stats.score}`}>{String(stats.score).padStart(6,'0')}</div><p>{track?.title || 'Janice STFU'} <span>/ {track?.artist || 'Drake'}</span></p></div><div className="soul"><span className="soul-label">SOUL</span><div className="soul-track" role="progressbar" aria-label="Soul gauge" aria-valuenow={Math.round(stats.soul)} aria-valuemin="0" aria-valuemax="100"><div className="soul-fill" style={{width:`${stats.soul}%`}}/><span className="clear-marker">CLEAR</span></div><strong className={stats.soul>=80?'cleared':''}>魂</strong></div></div>
      <div className="play-lane"><div className={`drum-panel ${pressed?'struck':''}`}><div className="combo"><strong>{stats.combo}</strong><span>COMBO</span></div><span className={`difficulty-flag ${difficulty}`}>{difficulty==='easy'?'かんたん':difficulty==='hard'?'むずかしい':'ふつう'}<b>{difficulty}</b></span><button className="drum-hit" aria-label="Hit drum center" onPointerDown={e=>{e.preventDefault();hit('f');}}><span className="sprite drum"/></button></div><div className="highway"><canvas ref={canvas} aria-label="Notes move from right to left. F or J for red, D or K for blue."/>{state==='ready'&&<div className="ready-hint">YOUR STAGE. YOUR RHYTHM.</div>}</div></div>
      <div className="festival"><img src="/assets/festival.png" alt="A Japanese lantern festival with colorful food stalls and dancing drum friends" draggable="false"/>
        {isCounting&&<div className="countdown" aria-live="polite"><b>{Math.ceil(-time)}</b><span>Feel the beat</span></div>}
        {state==='paused'&&<div className="pause-overlay"><span>TAKE A BREATHER</span><h2>We’ll hold the beat.</h2><button className="primary" onClick={play}><Play fill="currentColor" size={20}/>Resume</button><small>or press Space</small></div>}
        {state==='playing'&&stats.combo>=10&&<div className="combo-callout" key={Math.floor(stats.combo/10)}><b>{stats.combo}</b><span>COMBO!</span></div>}
      </div>
      <div className="game-progress"><div style={{width:`${progress}%`}}/></div>
    </section>
    <Controls track={track} difficulty={difficulty} onDifficulty={chooseDifficulty} state={state} onPlay={play} onRestart={restart} volume={volume} setVolume={setVolume} busy={busy} onSettings={()=>openModal('settings')} onHelp={()=>openModal('help')} onFullscreen={()=>{if(document.fullscreenElement)document.exitFullscreen();else shell.current.requestFullscreen?.().catch(()=>setError('Fullscreen is not available in this browser.'));}}/>
    <section className="playback-detail" aria-label="Song progress"><span>{timeLabel(time)}</span><div className="waveform" aria-hidden="true">{(track?.waveform||[]).map((v,i)=><i key={i} className={i/180*100<progress?'played':''} style={{height:`${3+v*15}px`}}/>)}</div><span>{timeLabel(track?.duration||0)}</span><span className="accuracy">{accuracy(stats).toFixed(1)}% accuracy</span></section>
    <section className="keyboard-guide" aria-label="Keyboard controls"><span className="guide-label">Controls</span>{[['D','ka'],['F','don'],['J','don'],['K','ka']].map(([key,type])=><button key={key} className={`key-guide ${type} ${pressed===key.toLowerCase()?'pressed':''}`} aria-label={`Hit ${type} with ${key}`} onPointerDown={e=>{e.preventDefault();hit(key.toLowerCase());}}><kbd>{key}</kbd><span>{type==='don'?'Don (Red)':'Ka (Blue)'}</span></button>)}<div className="guide-divider"/><button className="key-guide" onClick={play}><kbd className="wide-key">Space</kbd><span>Pause</span></button><button className="key-guide" onClick={restart}><kbd>R</kbd><span>Restart</span></button><span className="headphone-tip"><Headphones size={15}/>Headphones on. World off.</span></section>
    <footer className="bottom-bar"><button className="secondary" onClick={()=>openModal('songs')}><Music2 size={18}/>Change song<ChevronRight size={15}/></button><span className="best"><Trophy size={15}/>{best?'Best '+best.toLocaleString():'Make tonight a personal best'}</span><span className="bottom-note">GOOD BEATS<br/>BRIGHTER NIGHTS</span></footer>
    {error&&!modal&&<div className="error page-error" role="alert">{error}</div>}
    {modal==='songs'&&<SongPicker track={track} busy={busy} error={error} onClose={()=>{if(!busy){setModal(null);setError('');}}} onImport={importSong} onDefault={loadDefault}/>}
    {modal==='settings'&&<Settings values={settings} setValues={setSettings} onClose={()=>setModal(null)}/>}
    {modal==='help'&&<Help onClose={()=>setModal(null)}/>}
    {modal==='results'&&track&&<Results stats={stats} best={best} track={track} difficulty={difficulty} onRestart={restart} onClose={()=>setModal(null)}/>}
  </main>;
}
