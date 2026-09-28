// Music transport and synthesised drum sounds. The song clock is derived
// from the audio hardware clock, so notes stay locked to what is heard.

export const LEAD_IN = 2.2;        // seconds of scrolling before the music starts

class AudioEngine {
  constructor() {
    this.context = null;
    this.buffer = null;
    this.source = null;
    this.playing = false;
    this.position = -LEAD_IN;     // song time while paused
    this.startedAt = 0;           // context time that corresponds to song time 0
    this.volumes = { music: 0.8, sfx: 0.8 };
  }

  async unlock() {
    if (!this.context) {
      const Context = window.AudioContext || window.webkitAudioContext;
      this.context = new Context({ latencyHint: 'interactive' });
      this.master = this.context.createGain();
      this.master.connect(this.context.destination);
      this.music = this.context.createGain();
      this.music.connect(this.master);
      this.sfx = this.context.createGain();
      this.sfx.connect(this.master);
      this.setVolumes(this.volumes);
      const length = this.context.sampleRate;
      this.noise = this.context.createBuffer(1, length, length);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.context.state !== 'running') await this.context.resume().catch(() => {});
    return this.context;
  }

  get ready() {
    return Boolean(this.context) && this.context.state === 'running';
  }

  setVolumes({ music, sfx }) {
    this.volumes = { music, sfx };
    if (!this.context) return;
    this.music.gain.value = music ** 1.6;
    this.sfx.gain.value = sfx ** 1.6;
  }

  async decode(bytes) {
    const context = await this.unlock();
    return context.decodeAudioData(bytes.slice(0));
  }

  load(buffer) {
    this.stop();
    this.buffer = buffer;
    this.position = -LEAD_IN;
  }

  // The context time of the sound leaving the speakers right now.
  heard(performanceNow = performance.now()) {
    const context = this.context;
    const stamp = context.getOutputTimestamp?.();
    if (stamp && stamp.performanceTime > 0 && stamp.contextTime > 0) {
      const estimate = stamp.contextTime + (performanceNow - stamp.performanceTime) / 1000;
      if (Math.abs(estimate - context.currentTime) < 0.5) return estimate;
    }
    return context.currentTime - (context.outputLatency || context.baseLatency || 0);
  }

  // Current song time in seconds. Negative during the lead-in.
  time(performanceNow) {
    if (!this.playing) return this.position;
    return this.heard(performanceNow) - this.startedAt;
  }

  play(from = this.position) {
    if (!this.buffer || !this.ready) return false;
    this.stopSource();
    const context = this.context;
    const begin = context.currentTime + 0.06;
    this.source = context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(this.music);
    if (from < 0) this.source.start(begin - from, 0);
    else this.source.start(begin, Math.min(from, this.buffer.duration));
    this.startedAt = begin - from;
    this.position = from;
    this.playing = true;
    return true;
  }

  pause() {
    if (!this.playing) return;
    this.position = Math.min(this.time(), this.buffer?.duration ?? 0);
    this.playing = false;
    this.stopSource();
  }

  stop() {
    this.playing = false;
    this.position = -LEAD_IN;
    this.stopSource();
  }

  stopSource() {
    if (!this.source) return;
    try { this.source.stop(); } catch { /* already stopped */ }
    this.source.disconnect();
    this.source = null;
  }

  // ---- drum and interface sounds -------------------------------------

  tone({ type = 'sine', from, to, length, gain, delay = 0, attack = 0.002, curve = 'exp' }) {
    if (!this.ready) return;
    const context = this.context;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const amp = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    if (to && to !== from) oscillator.frequency.exponentialRampToValueAtTime(to, start + length * 0.6);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.linearRampToValueAtTime(gain, start + attack);
    if (curve === 'exp') amp.gain.exponentialRampToValueAtTime(0.0001, start + length);
    else amp.gain.linearRampToValueAtTime(0.0001, start + length);
    oscillator.connect(amp);
    amp.connect(this.sfx);
    oscillator.start(start);
    oscillator.stop(start + length + 0.02);
    oscillator.onended = () => { oscillator.disconnect(); amp.disconnect(); };
  }

  burst({ filter, frequency, q = 1, length, gain, delay = 0, sweep }) {
    if (!this.ready) return;
    const context = this.context;
    const start = context.currentTime + delay;
    const source = context.createBufferSource();
    source.buffer = this.noise;
    const shape = context.createBiquadFilter();
    shape.type = filter;
    shape.frequency.setValueAtTime(frequency, start);
    if (sweep) shape.frequency.exponentialRampToValueAtTime(sweep, start + length);
    shape.Q.value = q;
    const amp = context.createGain();
    amp.gain.setValueAtTime(gain, start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + length);
    source.connect(shape); shape.connect(amp); amp.connect(this.sfx);
    source.start(start, Math.random() * 0.5, length + 0.02);
    source.onended = () => { source.disconnect(); shape.disconnect(); amp.disconnect(); };
  }

  don(big = false) {
    this.tone({ from: big ? 150 : 175, to: big ? 46 : 58, length: big ? 0.42 : 0.26, gain: big ? 1 : 0.85 });
    this.tone({ type: 'triangle', from: big ? 300 : 340, to: 110, length: 0.09, gain: 0.35 });
    this.burst({ filter: 'lowpass', frequency: 1400, length: 0.035, gain: 0.5 });
  }

  ka(big = false) {
    this.burst({ filter: 'bandpass', frequency: big ? 2100 : 2600, q: 5, length: big ? 0.11 : 0.07, gain: big ? 1.3 : 1 });
    this.tone({ type: 'square', from: big ? 1250 : 1500, to: 900, length: 0.045, gain: 0.16 });
    this.burst({ filter: 'highpass', frequency: 5200, length: 0.025, gain: 0.3 });
  }

  pop() {
    this.burst({ filter: 'lowpass', frequency: 5000, sweep: 300, length: 0.22, gain: 1 });
    this.tone({ from: 320, to: 1300, length: 0.12, gain: 0.35 });
    [880, 1174.7, 1568].forEach((f, i) => this.pluck(f, 0.1 + i * 0.06, 0.22));
  }

  pluck(frequency, delay = 0, gain = 0.3, length = 0.32) {
    this.tone({ type: 'triangle', from: frequency, to: frequency, length, gain, delay });
    this.tone({ type: 'sawtooth', from: frequency * 2, to: frequency * 2, length: length * 0.35, gain: gain * 0.18, delay });
  }

  // Short melodies on the D yo scale (D E G A B), the sound of festival flutes.
  jingle(name) {
    const D = 587.33; const E = 659.25; const G = 783.99; const A = 880; const B = 987.77;
    const tunes = {
      move: [[A, 0, 0.12, 0.12]],
      confirm: [[G, 0, 0.2, 0.16], [B * 1, 0.07, 0.24, 0.2], [D * 2, 0.14, 0.26, 0.4]],
      back: [[A, 0, 0.2, 0.16], [E, 0.08, 0.2, 0.28]],
      milestone: [[D, 0, 0.22, 0.16], [G, 0.08, 0.22, 0.16], [A, 0.16, 0.22, 0.16], [D * 2, 0.24, 0.3, 0.5]],
      gogo: [[G, 0, 0.2, 0.14], [A, 0.07, 0.2, 0.14], [B, 0.14, 0.2, 0.14], [D * 2, 0.21, 0.2, 0.14], [E * 2, 0.28, 0.3, 0.6]],
      clear: [[D, 0, 0.26, 0.2], [G, 0.14, 0.26, 0.2], [A, 0.28, 0.26, 0.2], [B, 0.42, 0.26, 0.2], [D * 2, 0.56, 0.3, 0.3], [A, 0.74, 0.22, 0.2], [D * 2, 0.9, 0.34, 0.9]],
      fail: [[A / 2, 0, 0.24, 0.4], [G / 2, 0.22, 0.24, 0.4], [E / 2, 0.44, 0.26, 0.9]],
      crown: [[D * 2, 0, 0.24, 0.12], [B, 0.06, 0.2, 0.12], [D * 2, 0.12, 0.24, 0.12], [E * 2, 0.2, 0.26, 0.14], [G * 2, 0.3, 0.3, 0.7]],
      tick: [[D * 2, 0, 0.07, 0.05]],
    };
    (tunes[name] || []).forEach(([f, delay, gain, length]) => this.pluck(f, delay, gain, length));
    if (name === 'confirm') this.don(false);
    if (name === 'clear' || name === 'crown') this.burst({ filter: 'highpass', frequency: 6000, length: 0.5, gain: 0.12, delay: 0.5 });
  }
}

export const audio = new AudioEngine();
