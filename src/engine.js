export const WINDOWS = { perfect: .045, good: .095, miss: .145 };
export const freshStats = () => ({ score: 0, combo: 0, maxCombo: 0, perfect: 0, good: 0, miss: 0, roll: 0, soul: 0 });
export const accuracy = s => { const n = s.perfect + s.good + s.miss; return n ? (s.perfect + s.good * .5) / n * 100 : 100; };

export class RhythmEngine {
  constructor(onUpdate, onEnd) {
    this.onUpdate = onUpdate; this.onEnd = onEnd;
    this.state = 'ready'; this.stats = freshStats(); this.notes = [];
    this.position = -2.5; this.volume = .75; this.offset = 0; this.speed = 1;
    this.effects = []; this.sprites = new Image(); this.sprites.src = '/assets/sprites.png';
    this.sprites.onload = () => this.draw();
    this.animate = this.animate.bind(this); this.frame = requestAnimationFrame(this.animate);
  }
  async context() {
    if (!this.ctx) {
      this.ctx = new AudioContext({ latencyHint: 'interactive' });
      this.gain = this.ctx.createGain(); this.gain.gain.value = this.volume; this.gain.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = .5; this.sfxGain.connect(this.gain);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    return this.ctx;
  }
  async loadAudio(data) {
    const ctx = await this.context();
    this.buffer = await ctx.decodeAudioData(data.slice(0));
  }
  setTrack(track, difficulty = 'medium') {
    this.stopSource(); this.track = track; this.difficulty = difficulty;
    this.notes = track.charts[difficulty].map((n, i) => ({ ...n, id: i, judged: false }));
    this.normalCount = Math.max(1, this.notes.filter(n => n.type !== 'roll').length);
    this.stats = freshStats(); this.position = -2.5; this.state = 'ready'; this.effects = []; this.lastBig = null;
    this.emit(); this.draw();
  }
  time() { return this.state === 'playing' ? this.ctx.currentTime - this.startedAt : this.position; }
  async play() {
    if (!this.buffer || this.state === 'playing') return;
    await this.context();
    if (this.state === 'results') this.setTrack(this.track, this.difficulty);
    this.startedAt = this.ctx.currentTime - this.position;
    this.source = this.ctx.createBufferSource(); this.source.buffer = this.buffer;
    this.source.connect(this.gain);
    this.source.start(this.ctx.currentTime + Math.max(0, -this.position), Math.max(0, this.position));
    this.state = 'playing'; this.emit();
  }
  stopSource() { if (this.source) { try { this.source.stop(); } catch {} this.source.disconnect(); this.source = null; } }
  pause() { if (this.state !== 'playing') return; this.position = this.time(); this.stopSource(); this.state = 'paused'; this.emit(); }
  restart() { this.setTrack(this.track, this.difficulty); }
  setVolume(value) { this.volume = value; if (this.gain) this.gain.gain.value = value; }
  sound(type) {
    if (!this.ctx || this.ctx.state !== 'running' || !this.sfx) return;
    const oscillator = this.ctx.createOscillator(); const amp = this.ctx.createGain(); const now = this.ctx.currentTime;
    oscillator.type = type === 'don' ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(type === 'don' ? 170 : 870, now);
    oscillator.frequency.exponentialRampToValueAtTime(type === 'don' ? 52 : 280, now + .09);
    amp.gain.setValueAtTime(type === 'don' ? .9 : .35, now); amp.gain.exponentialRampToValueAtTime(.001, now + .13);
    oscillator.connect(amp); amp.connect(this.sfxGain); oscillator.start(now); oscillator.stop(now + .14);
    oscillator.onended = () => { oscillator.disconnect(); amp.disconnect(); };
  }
  hit(type, key) {
    this.sound(type); this.flashType = type; this.flashAt = performance.now();
    if (this.state !== 'playing' || this.time() < 0) return;
    const t = this.time() - this.offset / 1000;
    const roll = this.notes.find(n => n.type === 'roll' && t >= n.time && t <= n.end);
    if (roll) { this.stats.roll++; this.stats.score += 100; this.effect('ROLL!', '#ffd467'); this.emit(); return; }
    if (this.lastBig && key !== this.lastBig.key && type === this.lastBig.type && t - this.lastBig.time < .05) {
      this.stats.score += this.lastBig.bonus; this.lastBig = null; this.effect('BIG!', '#ffd467'); this.emit(); return;
    }
    let candidate, nearest = WINDOWS.miss;
    for (const note of this.notes) {
      if (note.time > t + WINDOWS.miss) break;
      const distance = Math.abs(note.time - t);
      if (!note.judged && note.type !== 'roll' && distance <= nearest) { candidate = note; nearest = distance; }
    }
    if (!candidate) return;
    candidate.judged = true;
    const delta = Math.abs(candidate.time - t);
    if (candidate.type !== type || delta > WINDOWS.good) { this.miss(); }
    else {
      const judgement = delta <= WINDOWS.perfect ? 'perfect' : 'good';
      this.stats[judgement]++; this.stats.combo++;
      this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.combo);
      const bonus = Math.min(100, Math.floor(this.stats.combo / 10) * 10);
      const points = (judgement === 'perfect' ? 1000 : 500) + bonus;
      this.stats.score += points;
      this.stats.soul = Math.min(100, this.stats.soul + (judgement === 'perfect' ? 150 : 75) / this.normalCount);
      this.effect(judgement === 'perfect' ? '良 PERFECT' : '可 GOOD', judgement === 'perfect' ? '#ffd467' : '#f4eee3');
      if (candidate.big) this.lastBig = { key, time: t, type, bonus: points };
    }
    this.emit();
  }
  miss() {
    this.stats.miss++; this.stats.combo = 0; this.stats.soul = Math.max(0, this.stats.soul - 200 / this.normalCount);
    this.effect('不可 MISS', '#aaa0b5');
  }
  effect(text, color) { this.effects.push({ text, color, at: performance.now() }); }
  emit() { this.onUpdate?.({ state: this.state, time: this.time(), stats: { ...this.stats }, difficulty: this.difficulty }); }
  animate(now) {
    if (this.state === 'playing') {
      const t = this.time() - this.offset / 1000;
      for (const note of this.notes) {
        if (!note.judged && note.type !== 'roll' && t - note.time > WINDOWS.miss) { note.judged = true; this.miss(); }
        if (note.time > t + .2) break;
      }
      if (this.time() >= this.track.duration + .3) {
        this.position = this.track.duration; this.stopSource(); this.state = 'results'; this.onEnd?.({ ...this.stats }); this.emit();
      }
      if (!this.lastEmit || now - this.lastEmit > 80) { this.emit(); this.lastEmit = now; }
    }
    this.draw(now); this.frame = requestAnimationFrame(this.animate);
  }
  attach(canvas) {
    this.canvas = canvas;
    this.observer?.disconnect();
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas); this.resize();
  }
  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = rect.width * dpr; this.canvas.height = rect.height * dpr;
    this.width = rect.width; this.height = rect.height; this.dpr = dpr; this.draw();
  }
  draw(now = performance.now()) {
    if (!this.canvas || !this.width) return;
    const c = this.canvas.getContext('2d'); const w = this.width; const h = this.height;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, w, h);
    const x = Math.min(100, w * .115); const y = (h - 27) / 2;
    const radius = Math.min(35, (h - 40) / 2, w * .075);
    const speed = Math.max(w / (this.difficulty === 'easy' ? 3.2 : this.difficulty === 'hard' ? 2.1 : 2.7), w < 500 ? 200 : 0) * this.speed;
    c.fillStyle = '#99909d'; c.fillRect(0, h - 27, w, 27);
    c.strokeStyle = '#101014'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, h - 27); c.lineTo(w, h - 27); c.stroke();
    const flash = now - (this.flashAt || 0) < 110;
    c.fillStyle = flash ? (this.flashType === 'don' ? '#703c33' : '#2c606e') : '#353438';
    c.strokeStyle = flash ? '#fff2d6' : '#78747a'; c.lineWidth = 3;
    c.beginPath(); c.arc(x, y, radius + 12, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.arc(x, y, radius + 2, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(x, y, radius - 4, 0, Math.PI * 2); c.stroke();
    const clock = this.state === 'ready' ? .1 : this.time() - this.offset / 1000;
    const notes = this.state === 'ready' ? [0.48, .88, 1.28, 1.68, 2.08, 2.48].map((t, i) => ({time:t,type:i%3===1?'ka':'don', big:i===3})) : this.notes;
    if (this.state !== 'ready') {
      c.strokeStyle = '#4b464e'; c.lineWidth = 1;
      for (const t of this.track?.beats || []) { const bx = x + (t - clock) * speed; if (bx < 0) continue; if (bx > w) break; c.beginPath(); c.moveTo(bx, 0); c.lineTo(bx, h - 27); c.stroke(); }
    }
    for (const n of notes) {
      const nx = x + (n.time - clock) * speed;
      if (n.judged || (n.type === 'roll' ? x + (n.end - clock) * speed < -70 : nx < -70)) continue;
      if (nx > w + 70) break;
      const size = radius * (n.big ? 3.5 : 3.05);
      if (n.type === 'roll') {
        const endX = x + (n.end - clock) * speed;
        c.lineWidth = radius * 1.6; c.lineCap = 'round'; c.strokeStyle = '#19171a';
        c.beginPath(); c.moveTo(nx, y); c.lineTo(endX, y); c.stroke();
        c.lineWidth -= 8; c.strokeStyle = '#efbc49'; c.stroke(); c.lineCap = 'butt';
      } else if (this.sprites.complete && this.sprites.naturalWidth) {
        const cell = this.sprites.naturalWidth / 2;
        c.drawImage(this.sprites, n.type === 'ka' ? cell : 0, 0, cell, cell, nx - size / 2, y - size / 2, size, size);
      }
      c.font = '800 15px "Arial", sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = '#302832';
      const label = n.type === 'ka' ? 'カッ' : n.type === 'roll' ? '連打' : n.big ? 'ドン' : 'ド';
      c.strokeText(label, nx, h - 8); c.fillStyle = '#fff8ee'; c.fillText(label, nx, h - 8);
    }
    this.effects = this.effects.filter(e => now - e.at < 650);
    const effect = this.effects.at(-1);
    if (effect) { const age = (now - effect.at) / 650; c.globalAlpha = 1 - age; c.font = '900 18px Arial'; c.fillStyle = effect.color; c.textAlign = 'center'; c.fillText(effect.text, x + 8, 25 - age * 12); c.globalAlpha = 1; }
  }
  destroy() { cancelAnimationFrame(this.frame); this.stopSource(); this.observer?.disconnect(); this.ctx?.close(); }
}
