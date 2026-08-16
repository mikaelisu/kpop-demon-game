/**
 * K-POP DEMON HUNTERS - Web Audio NES 2A03 Chiptune Synthesizer
 * Authentic emulation of 8-bit sound chip channels (Pulse 1, Pulse 2, Triangle, Noise).
 */

class ChiptuneSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.volume = 0.45;
    this.noiseBuffer = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Create 1-second white noise buffer for Noise Channel
    const bufferSize = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.isInitialized = true;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(mute) {
    this.isMuted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Play a note on the 8-bit Pulse (Square) Channel
   */
  playPulse(freq, duration = 0.15, dutyCycle = 0.5, volume = 0.25, pitchSlide = 0, startTime = null) {
    if (!this.ctx || this.isMuted) return;
    const now = startTime !== null ? startTime : this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);

    if (pitchSlide !== 0) {
      osc.frequency.linearRampToValueAtTime(Math.max(20, freq + pitchSlide), now + duration);
    }

    // NES ADSR volume envelope
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Play a note on the Triangle (Warm Bass) Channel
   */
  playTriangle(freq, duration = 0.2, volume = 0.35, startTime = null) {
    if (!this.ctx || this.isMuted) return;
    const now = startTime !== null ? startTime : this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    // Flat Triangle Channel envelope (like real NES)
    gain.gain.setValueAtTime(volume, now);
    gain.gain.setValueAtTime(volume, now + duration * 0.9);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Play a burst on the Noise (Percussion / SFX) Channel
   */
  playNoise(duration = 0.1, isSnare = false, volume = 0.2, startTime = null) {
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;
    const now = startTime !== null ? startTime : this.ctx.currentTime;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = isSnare ? 'bandpass' : 'highpass';
    filter.frequency.setValueAtTime(isSnare ? 1200 : 3500, now);
    filter.Q.setValueAtTime(isSnare ? 3 : 1, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + duration);
  }
}

window.ChiptuneSynth = ChiptuneSynth;
