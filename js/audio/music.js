/**
 * K-POP DEMON HUNTERS - 8-Bit NES Chiptune Music Engine
 * Catchy K-Pop retro tunes sequenced in 4 channels (Pulse 1, Pulse 2, Triangle, Noise).
 */

// Note Frequency Table
const N = {
  REST: 0,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A6: 1760.00
};

class MusicPlayer {
  constructor(synth) {
    this.synth = synth;
    this.currentTrack = null;
    this.isPlaying = false;
    this.stepIndex = 0;
    this.timerId = null;
    this.tempo = 135; // BPM
    this.tempoMultiplier = 1.0;
  }

  setTempoMultiplier(mult = 1.0) {
    if (Math.abs(this.tempoMultiplier - mult) < 0.01) return;
    this.tempoMultiplier = mult;
    if (this.isPlaying && this.currentTrack) {
      // Re-schedule step timer with new tempo while preserving stepIndex
      if (this.timerId) clearInterval(this.timerId);
      const data = this.getTrackData(this.currentTrack);
      const effectiveTempo = data.tempo * this.tempoMultiplier;
      const stepDurationMs = (60000 / effectiveTempo) / 4;
      this.timerId = setInterval(() => {
        this.tickStep();
      }, stepDurationMs);
    }
  }

  // Define Music Patterns
  getTrackData(trackName) {
    if (trackName === 'title') {
      return {
        tempo: 130,
        loop: true,
        // Pulse 1: Catchy K-Pop Melody
        p1: [
          N.E5, N.G5, N.A5, N.REST, N.A5, N.G5, N.E5, N.D5,
          N.E5, N.G5, N.A5, N.C6,   N.B5, N.A5, N.G5, N.REST,
          N.A5, N.C6, N.D6, N.REST, N.D6, N.C6, N.A5, N.G5,
          N.A5, N.G5, N.E5, N.D5,   N.C5, N.D5, N.E5, N.REST
        ],
        // Pulse 2: Arpeggiated Chords
        p2: [
          N.C4, N.E4, N.G4, N.C5,   N.C4, N.E4, N.G4, N.C5,
          N.A3, N.C4, N.E4, N.A4,   N.A3, N.C4, N.E4, N.A4,
          N.F3, N.A3, N.C4, N.F4,   N.F3, N.A3, N.C4, N.F4,
          N.G3, N.B3, N.D4, N.G4,   N.G3, N.B3, N.D4, N.G4
        ],
        // Triangle: Driving Bass
        tri: [
          N.C3, N.C3, N.C3, N.C3,   N.C3, N.C3, N.E3, N.G3,
          N.A2, N.A2, N.A2, N.A2,   N.A2, N.A2, N.C3, N.E3,
          N.F2, N.F2, N.F2, N.F2,   N.F2, N.F2, N.A2, N.C3,
          N.G2, N.G2, N.G2, N.G2,   N.G2, N.B2, N.D3, N.G3
        ],
        // Noise: Dance Beat (1=Kick/Hat, 2=Snare)
        noise: [
          1, 0, 2, 0, 1, 1, 2, 0,
          1, 0, 2, 0, 1, 0, 2, 1,
          1, 0, 2, 0, 1, 1, 2, 0,
          1, 1, 2, 0, 1, 2, 2, 2
        ]
      };
    } else if (trackName === 'stage1') {
      // Night Market Noodle Rush
      return {
        tempo: 140,
        loop: true,
        p1: [
          N.A4, N.C5, N.E5, N.A5, N.G5, N.E5, N.D5, N.E5,
          N.C5, N.D5, N.E5, N.G5, N.E5, N.D5, N.C5, N.REST,
          N.D5, N.E5, N.F5, N.A5, N.G5, N.F5, N.E5, N.D5,
          N.E5, N.G5, N.A5, N.B5, N.C6, N.B5, N.A5, N.G5
        ],
        p2: [
          N.E4, N.A4, N.C5, N.E5, N.D4, N.G4, N.B4, N.D5,
          N.C4, N.E4, N.G4, N.C5, N.E4, N.G4, N.B4, N.E5,
          N.F4, N.A4, N.C5, N.F5, N.D4, N.F4, N.A4, N.D5,
          N.E4, N.G4, N.B4, N.E5, N.E4, N.G4, N.B4, N.E5
        ],
        tri: [
          N.A2, N.A3, N.A2, N.A3, N.G2, N.G3, N.G2, N.G3,
          N.C3, N.C4, N.C3, N.C4, N.E2, N.E3, N.E2, N.E3,
          N.F2, N.F3, N.F2, N.F3, N.D2, N.D3, N.D2, N.D3,
          N.E2, N.E3, N.E2, N.E3, N.E2, N.G2, N.B2, N.E3
        ],
        noise: [
          1, 0, 2, 0, 1, 1, 2, 0,
          1, 0, 2, 0, 1, 0, 2, 1,
          1, 0, 2, 0, 1, 1, 2, 0,
          1, 2, 1, 2, 2, 2, 2, 0
        ]
      };
    } else if (trackName === 'stage2') {
      // Concert Dome Glow
      return {
        tempo: 135,
        loop: true,
        p1: [
          N.G5, N.E5, N.REST, N.C5, N.D5, N.E5, N.G5, N.A5,
          N.C6, N.A5, N.G5,   N.E5, N.D5, N.E5, N.D5, N.C5,
          N.F5, N.A5, N.C6,   N.D6, N.C6, N.A5, N.G5, N.F5,
          N.G5, N.B5, N.D6,   N.E6, N.D6, N.B5, N.G5, N.REST
        ],
        p2: [
          N.C4, N.G4, N.C5, N.E5, N.C4, N.G4, N.C5, N.E5,
          N.A3, N.E4, N.A4, N.C5, N.A3, N.E4, N.A4, N.C5,
          N.F3, N.C4, N.F4, N.A4, N.F3, N.C4, N.F4, N.A4,
          N.G3, N.D4, N.G4, N.B4, N.G3, N.D4, N.G4, N.B4
        ],
        tri: [
          N.C3, N.REST, N.C3, N.C3, N.C3, N.REST, N.E3, N.G3,
          N.A2, N.REST, N.A2, N.A2, N.A2, N.REST, N.C3, N.E3,
          N.F2, N.REST, N.F2, N.F2, N.F2, N.REST, N.A2, N.C3,
          N.G2, N.REST, N.G2, N.G2, N.G2, N.B2,   N.D3, N.G3
        ],
        noise: [
          1, 0, 2, 0, 1, 0, 2, 1,
          1, 0, 2, 0, 1, 1, 2, 0,
          1, 0, 2, 0, 1, 0, 2, 1,
          1, 2, 1, 2, 1, 2, 2, 2
        ]
      };
    } else if (trackName === 'boss') {
      // Dokkaebi Beat Drop Boss Battle
      return {
        tempo: 155,
        loop: true,
        p1: [
          N.A5, N.A5, N.C6, N.A5, N.D6, N.C6, N.A5, N.G5,
          N.A5, N.A5, N.C6, N.A5, N.G5, N.E5, N.G5, N.E5,
          N.F5, N.A5, N.D6, N.F6, N.E6, N.D6, N.C6, N.A5,
          N.B5, N.B5, N.C6, N.D6, N.E6, N.D6, N.C6, N.B5
        ],
        p2: [
          N.E4, N.E4, N.G4, N.E4, N.A4, N.G4, N.E4, N.D4,
          N.E4, N.E4, N.G4, N.E4, N.D4, N.B3, N.D4, N.B3,
          N.D4, N.F4, N.A4, N.D5, N.C5, N.A4, N.F4, N.D4,
          N.G4, N.G4, N.A4, N.B4, N.C5, N.B4, N.A4, N.G4
        ],
        tri: [
          N.A2, N.A2, N.E3, N.A2, N.A2, N.A2, N.G3, N.A2,
          N.A2, N.A2, N.E3, N.A2, N.E2, N.E2, N.B2, N.E2,
          N.D2, N.D2, N.A2, N.D2, N.F2, N.F2, N.C3, N.F2,
          N.E2, N.E2, N.B2, N.E2, N.E2, N.E2, N.E2, N.E2
        ],
        noise: [
          1, 1, 2, 1, 1, 1, 2, 1,
          1, 1, 2, 1, 1, 2, 2, 2,
          1, 1, 2, 1, 1, 1, 2, 1,
          2, 2, 2, 2, 2, 2, 2, 2
        ]
      };
    } else if (trackName === 'victory') {
      // Stage Clear Fanfare
      return {
        tempo: 140,
        loop: false,
        p1: [
          N.C5, N.E5, N.G5, N.C6, N.REST, N.C6, N.D6, N.E6,
          N.D6, N.C6, N.G5, N.A5, N.C6,  N.REST, N.C6, N.REST
        ],
        p2: [
          N.G4, N.C5, N.E5, N.G5, N.REST, N.G5, N.A5, N.C6,
          N.A5, N.G5, N.E5, N.F5, N.G5,  N.REST, N.G5, N.REST
        ],
        tri: [
          N.C3, N.C3, N.E3, N.G3, N.REST, N.A3, N.B3, N.C4,
          N.F3, N.F3, N.G3, N.G3, N.C3,  N.REST, N.C3, N.REST
        ],
        noise: [
          1, 0, 2, 0, 1, 1, 2, 0,
          1, 1, 2, 2, 1, 0, 2, 0
        ]
      };
    }

    // Default fallback to stage1
    return this.getTrackData('stage1');
  }

  playTrack(trackName) {
    if (this.currentTrack === trackName && this.isPlaying) return;
    this.stop();

    this.currentTrack = trackName;
    this.isPlaying = true;
    this.stepIndex = 0;

    const data = this.getTrackData(trackName);
    const effectiveTempo = data.tempo * this.tempoMultiplier;
    const stepDurationMs = (60000 / effectiveTempo) / 4; // Sixteenth note step

    this.timerId = setInterval(() => {
      this.tickStep();
    }, stepDurationMs);
  }

  tickStep() {
    if (!this.isPlaying || !this.synth || !this.synth.ctx || this.synth.isMuted) return;

    const data = this.getTrackData(this.currentTrack);
    const totalSteps = data.p1.length;
    const idx = this.stepIndex % totalSteps;

    const effectiveTempo = data.tempo * this.tempoMultiplier;
    const noteDuration = (60 / effectiveTempo) / 4 * 0.9;

    // Pulse 1 Channel
    if (data.p1 && data.p1[idx]) {
      this.synth.playPulse(data.p1[idx], noteDuration, 0.5, 0.16);
    }
    // Pulse 2 Channel
    if (data.p2 && data.p2[idx]) {
      this.synth.playPulse(data.p2[idx], noteDuration, 0.25, 0.12);
    }
    // Triangle Channel (Bass)
    if (data.tri && data.tri[idx]) {
      this.synth.playTriangle(data.tri[idx], noteDuration, 0.28);
    }
    // Noise Channel (Drums)
    if (data.noise && data.noise[idx]) {
      const type = data.noise[idx];
      if (type === 1) {
        this.synth.playNoise(0.06, false, 0.12); // Kick / hi-hat
      } else if (type === 2) {
        this.synth.playNoise(0.09, true, 0.18); // Snare
      }
    }

    this.stepIndex++;
    if (!data.loop && this.stepIndex >= totalSteps) {
      this.stop();
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

window.MusicPlayer = MusicPlayer;
