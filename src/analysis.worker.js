// Lightweight local analysis for browser imports. The bundled track uses librosa.
// Energy flux + autocorrelation tempo + a locally corrected beat grid.
self.onmessage = ({ data: { samples, sampleRate, title } }) => {
  try {
    const step = Math.max(1, Math.floor(sampleRate / 11025)); const sr = sampleRate / step;
    const hop = 128, win = 512; const count = Math.floor(samples.length / step / hop);
    const energy = new Float32Array(count); const high = new Float32Array(count); const flux = new Float32Array(count);
    for (let f = 0; f < count; f++) {
      let e = 0, h = 0, previous = 0;
      for (let j = 0; j < win; j++) { const v = samples[(f * hop + j) * step] || 0; e += v*v; h += (v - previous)**2; previous = v; }
      energy[f] = Math.sqrt(e / win); high[f] = Math.sqrt(h / win);
      flux[f] = Math.max(0, energy[f] - (energy[f-1] || 0)) + Math.max(0, high[f] - (high[f-1] || 0));
    }
    let peak = 0; for (const value of energy) peak = Math.max(peak, value);
    if (peak < .0001) throw new Error('This audio is silent. Try another file.');
    const fps = sr / hop;
    let bestLag = Math.round(fps * .5), bestScore = -1;
    for (let lag = Math.floor(fps * 60 / 180); lag <= Math.ceil(fps * 60 / 70); lag++) {
      let score = 0; for (let i = lag; i < count; i++) score += flux[i] * flux[i-lag];
      score /= Math.max(1, count-lag); score *= 1 - Math.abs(60 * fps / lag - 120) / 500;
      if (score > bestScore) { bestScore = score; bestLag = lag; }
    }
    let phase = 0, phaseScore = -1;
    for (let p = 0; p < bestLag; p++) { let s = 0; for (let i=p; i<count; i+=bestLag) s += flux[i]; if(s>phaseScore){phaseScore=s;phase=p;} }
    const beats = [];
    for(let i=phase; i<count; i+=bestLag){ let local = Math.round(i); for(let j=Math.max(0,local-4); j<Math.min(count,local+5); j++) if(flux[j]>flux[local])local=j; beats.push(local / fps); }
    const charts = {easy:[],medium:[],hard:[]};
    beats.forEach((time,i)=>{
      const f=Math.round(time*fps); if(time<.15 || energy[f] < peak*.07) return;
      const type=i%4===1 && high[f] > energy[f]*.35?'ka':'don';
      if(i%2===0) charts.easy.push({time,type:'don',big:false});
      charts.medium.push({time,type,big:false}); charts.hard.push({time,type,big:i%16===0});
      if(i+1<beats.length){ const mid=(time+beats[i+1])/2; let m=Math.round(mid*fps); for(let j=Math.max(0,m-4);j<Math.min(count,m+5);j++)if(flux[j]>flux[m])m=j; if(flux[m]>peak*.045)charts.hard.push({time:m/fps,type:'ka',big:false}); }
    });
    if(charts.medium.length < 4) throw new Error('No clear beat found. Try a more rhythmic song.');
    const waveform=Array.from({length:180},(_,i)=>energy[Math.min(count-1,Math.floor(i*count/180))]/peak);
    self.postMessage({version:1,id:`local-${title}-${samples.length}`,title,artist:'Your music',duration:samples.length/sampleRate,bpm:Math.round(60*fps/bestLag*10)/10,estimated:true,analysis:'Browser energy flux and autocorrelation',beats,charts,waveform});
  } catch(error){ self.postMessage({error:error.message}); }
};
