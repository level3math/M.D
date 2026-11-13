/**
 * High-fidelity chime synthesized with Web Audio API.
 * Guarantees zero latency and no external audio asset dependencies.
 */
export function playNotificationChime(type: 'alert' | 'success' | 'urgent' = 'alert') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, now);
    masterGain.connect(ctx.destination);

    if (type === 'alert') {
      // Elegant 3-tone ascending academic chime
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        noteGain.gain.setValueAtTime(0, now + idx * 0.08);
        noteGain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
    } else if (type === 'urgent') {
      // 2-tone pulse for urgent deadlines
      [880, 1174.66, 880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        noteGain.gain.setValueAtTime(0, now + idx * 0.09);
        noteGain.gain.linearRampToValueAtTime(0.22, now + idx * 0.09 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.25);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.28);
      });
    } else {
      // Soft success chime
      [659.25, 783.99, 987.77].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        noteGain.gain.setValueAtTime(0, now + idx * 0.1);
        noteGain.gain.linearRampToValueAtTime(0.18, now + idx * 0.1 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.35);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.4);
      });
    }
  } catch (err) {
    console.warn('Audio chime playback failed:', err);
  }
}

export type AmbientSoundMode = 'off' | 'rain' | 'waves' | 'white' | 'forest';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private currentMode: AmbientSoundMode = 'off';
  private volume: number = 0.35;

  private init() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  stop() {
    if (this.source) {
      try { this.source.stop(); } catch {}
      this.source.disconnect();
      this.source = null;
    }
    if (this.lfo) {
      try { this.lfo.stop(); } catch {}
      this.lfo.disconnect();
      this.lfo = null;
    }
    this.currentMode = 'off';
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  getMode(): AmbientSoundMode {
    return this.currentMode;
  }

  play(mode: AmbientSoundMode) {
    this.stop();
    if (mode === 'off') return;
    this.init();
    if (!this.ctx) return;

    this.currentMode = mode;
    const sampleRate = this.ctx.sampleRate;
    const duration = 4;
    const buffer = this.ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < sampleRate * duration; i++) {
      const white = Math.random() * 2 - 1;
      if (mode === 'rain') {
        lastOut = (lastOut + 0.04 * white) / 1.04;
        data[i] = lastOut * 3.5;
      } else if (mode === 'waves') {
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 4.0;
      } else if (mode === 'forest') {
        lastOut = (lastOut + 0.06 * white) / 1.06;
        data[i] = lastOut * 3.0;
      } else {
        data[i] = white * 0.45;
      }
    }

    this.source = this.ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    if (mode === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.2, this.ctx.currentTime);
    } else if (mode === 'waves') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, this.ctx.currentTime);
      filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      this.lfo.connect(lfoGain);

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.source.connect(filter);
      filter.connect(this.gainNode);
      lfoGain.connect(this.gainNode.gain);
      this.gainNode.connect(this.ctx.destination);
      this.lfo.start();
      this.source.start();
      return;
    } else if (mode === 'forest') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, this.ctx.currentTime);
      filter.Q.setValueAtTime(0.7, this.ctx.currentTime);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    }

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    this.source.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);
    this.source.start();
  }
}

export const ambientSound = new AmbientSoundEngine();

