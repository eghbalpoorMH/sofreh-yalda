/**
 * Persian Santoor & Yalda Chime Web Audio Synthesizer
 * 100% procedural, zero external audio assets, copyright-free.
 */
class YaldaAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    // Persian Homayoun / Isfahan inspired scale frequencies (Hz)
    this.scale = [293.66, 329.63, 349.23, 415.30, 440.00, 523.25, 587.33, 659.25, 698.46, 830.61, 880.00];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.init();
      this.playSelect();
    }
    return this.enabled;
  }

  // Santoor plucked string tone
  pluck(freq, duration = 0.35, vol = 0.16, type = 'triangle', delay = 0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    // Slight harmonic shimmer like a dulcimer/santoor dual course
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.002, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration);
    osc2.stop(now + duration);
  }

  playSelect() {
    this.pluck(587.33, 0.14, 0.1, 'sine');
  }

  playSwap() {
    this.pluck(440, 0.12, 0.1, 'triangle', 0);
    this.pluck(523.25, 0.15, 0.12, 'triangle', 0.05);
  }

  playInvalid() {
    this.pluck(220, 0.18, 0.12, 'sawtooth', 0);
    this.pluck(196, 0.22, 0.12, 'sawtooth', 0.08);
  }

  playMatch(combo = 1) {
    const idx = Math.min(this.scale.length - 2, (combo - 1) % (this.scale.length - 1));
    const baseFreq = this.scale[idx];
    const thirdFreq = this.scale[Math.min(this.scale.length - 1, idx + 2)];
    this.pluck(baseFreq, 0.32, 0.15, 'triangle', 0);
    this.pluck(thirdFreq, 0.38, 0.13, 'triangle', 0.045);
  }

  playBombCreate() {
    this.pluck(523.25, 0.25, 0.16, 'triangle', 0);
    this.pluck(659.25, 0.28, 0.16, 'triangle', 0.06);
    this.pluck(880.00, 0.4, 0.18, 'triangle', 0.12);
  }

  playLineBlast() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.32);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  playAreaBoom() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.42);

    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.44);
  }

  playColorDivan() {
    const notes = [440, 523.25, 659.25, 830.61, 880, 1046.5];
    notes.forEach((f, i) => {
      this.pluck(f, 0.38, 0.15, 'triangle', i * 0.055);
    });
  }

  playIceBreak() {
    this.pluck(1174.66, 0.14, 0.11, 'sine', 0);
    this.pluck(1396.91, 0.16, 0.1, 'sine', 0.04);
  }

  playBoxBreak() {
    this.pluck(329.63, 0.18, 0.14, 'triangle', 0);
    this.pluck(440.00, 0.22, 0.12, 'triangle', 0.05);
  }

  playVictory() {
    const fanfare = [440, 523.25, 587.33, 659.25, 830.61, 880];
    fanfare.forEach((f, i) => {
      this.pluck(f, 0.5, 0.18, 'triangle', i * 0.09);
    });
  }

  playFalChord() {
    const chord = [293.66, 440, 523.25, 659.25, 880];
    chord.forEach((f, i) => {
      this.pluck(f, 0.65, 0.13, 'triangle', i * 0.07);
    });
  }
}

window.yaldaAudio = new YaldaAudio();
