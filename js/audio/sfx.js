/**
 * K-POP DEMON HUNTERS - 8-Bit Retro Sound Effects
 */

class SoundEffects {
  constructor(synth) {
    this.synth = synth;
  }

  playSlash(combo = 1) {
    if (!this.synth || !this.synth.ctx) return;
    const baseFreq = combo === 3 ? 650 : (combo === 2 ? 520 : 440);
    // Sword woosh
    this.synth.playPulse(baseFreq, 0.1, 0.5, 0.25, -280);
    this.synth.playNoise(0.08, true, 0.2);
  }

  playSlurp() {
    if (!this.synth || !this.synth.ctx) return;
    const now = this.synth.ctx.currentTime;
    // Multi-bubble slurp sound
    this.synth.playPulse(300, 0.05, 0.5, 0.2, 200, now);
    this.synth.playPulse(420, 0.05, 0.5, 0.22, 250, now + 0.04);
    this.synth.playPulse(550, 0.08, 0.5, 0.25, 300, now + 0.08);
    // Gulp chime
    this.synth.playTriangle(587.33, 0.12, 0.3, now + 0.14);
  }

  playJump() {
    if (!this.synth || !this.synth.ctx) return;
    this.synth.playPulse(180, 0.14, 0.5, 0.2, 360);
  }

  playWallKick() {
    if (!this.synth || !this.synth.ctx) return;
    const now = this.synth.ctx.currentTime;
    this.synth.playPulse(350, 0.06, 0.5, 0.2, 100, now);
    this.synth.playPulse(600, 0.08, 0.5, 0.25, 200, now + 0.03);
  }

  playBounce() {
    if (!this.synth || !this.synth.ctx) return;
    this.synth.playPulse(220, 0.2, 0.5, 0.25, 600);
  }

  playStar() {
    if (!this.synth || !this.synth.ctx) return;
    const now = this.synth.ctx.currentTime;
    this.synth.playPulse(987.77, 0.08, 0.5, 0.2, 0, now); // B5
    this.synth.playPulse(1318.51, 0.14, 0.5, 0.25, 0, now + 0.07); // E6
  }

  playChopsticks() {
    if (!this.synth || !this.synth.ctx) return;
    const now = this.synth.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      this.synth.playPulse(freq, 0.1, 0.5, 0.22, 0, now + i * 0.06);
    });
  }

  playEnemyHit() {
    if (!this.synth || !this.synth.ctx) return;
    this.synth.playPulse(180, 0.08, 0.5, 0.25, -80);
    this.synth.playNoise(0.06, true, 0.18);
  }

  playEnemyDefeat() {
    if (!this.synth || !this.synth.ctx) return;
    const now = this.synth.ctx.currentTime;
    this.synth.playNoise(0.15, true, 0.25, now);
    this.synth.playPulse(523.25, 0.06, 0.5, 0.2, 0, now + 0.04);
    this.synth.playPulse(783.99, 0.08, 0.5, 0.2, 0, now + 0.08);
    this.synth.playPulse(1046.50, 0.12, 0.5, 0.25, 0, now + 0.12);
  }

  playPlayerHurt() {
    if (!this.synth || !this.synth.ctx) return;
    this.synth.playPulse(260, 0.16, 0.5, 0.3, -150);
    this.synth.playNoise(0.12, false, 0.2);
  }

  playRainbowFever() {
    if (!this.synth || !this.synth.ctx) return;
    const now = this.synth.ctx.currentTime;
    const arpeggio = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
    arpeggio.forEach((f, i) => {
      this.synth.playPulse(f, 0.08, 0.5, 0.22, 0, now + i * 0.04);
    });
  }

  playBossRoar() {
    if (!this.synth || !this.synth.ctx) return;
    const now = this.synth.ctx.currentTime;
    this.synth.playTriangle(75, 0.5, 0.4, now);
    this.synth.playNoise(0.4, false, 0.3, now);
  }

  playVocalHyeah() {
    if (!this.synth || !this.synth.ctx) return;
    const now = this.synth.ctx.currentTime;
    // Cheerful upward 8-bit phonetic chirp
    this.synth.playPulse(587.33, 0.06, 0.5, 0.22, 200, now);
    this.synth.playPulse(880.00, 0.10, 0.5, 0.25, 400, now + 0.04);
  }

  playVocalDaebak() {
    if (!this.synth || !this.synth.ctx) return;
    const now = this.synth.ctx.currentTime;
    // Triumphant double arpeggio chime
    const notes = [659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, i) => {
      this.synth.playPulse(freq, 0.08, 0.5, 0.2, 0, now + i * 0.05);
    });
  }

  playLanternBurst() {
    if (!this.synth || !this.synth.ctx) return;
    const now = this.synth.ctx.currentTime;
    this.synth.playNoise(0.1, true, 0.2, now);
    this.synth.playPulse(1200, 0.08, 0.5, 0.2, -400, now + 0.02);
  }

  playCrystalShatter() {
    if (!this.synth || !this.synth.ctx) return;
    const now = this.synth.ctx.currentTime;
    this.synth.playNoise(0.18, true, 0.28, now);
    this.synth.playPulse(1567.98, 0.1, 0.5, 0.22, -600, now);
    this.synth.playPulse(2093.00, 0.14, 0.5, 0.25, -800, now + 0.04);
  }
}

window.SoundEffects = SoundEffects;
