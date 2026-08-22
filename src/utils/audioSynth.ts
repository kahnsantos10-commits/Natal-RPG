// Web Audio API procedural sound engine for RPG immersion

class RPGAudioEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private ambientOscillators: (OscillatorNode | AudioBufferSourceNode)[] = [];
  public isMuted: boolean = false;
  public currentAmbient: string = "none";

  // Channel volumes (0.0 to 1.0)
  public masterVolume: number = 0.8;
  public ambientVolume: number = 0.6;
  public sfxVolume: number = 0.85;
  public ttsVolume: number = 1.0;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getMasterGain(): GainNode {
    const ctx = this.getContext();
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, ctx.currentTime);
      this.masterGain.connect(ctx.destination);
    }
    return this.masterGain;
  }

  private getSfxGain(): GainNode {
    const ctx = this.getContext();
    if (!this.sfxGain) {
      this.sfxGain = ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, ctx.currentTime);
      this.sfxGain.connect(this.getMasterGain());
    }
    return this.sfxGain;
  }

  public setMasterVolume(val: number) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  public setAmbientVolume(val: number) {
    this.ambientVolume = Math.max(0, Math.min(1, val));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.ambientVolume * 0.15, this.ctx.currentTime);
    }
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  public setTtsVolume(val: number) {
    this.ttsVolume = Math.max(0, Math.min(1, val));
  }

  // Play realistic dice rolling rattle and clatter
  playDiceRoll() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const sfxNode = this.getSfxGain();
      const count = 3 + Math.floor(Math.random() * 3);

      for (let i = 0; i < count; i++) {
        const time = ctx.currentTime + i * 0.07 + Math.random() * 0.03;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = Math.random() > 0.5 ? "triangle" : "square";
        osc.frequency.setValueAtTime(180 + Math.random() * 260, time);
        osc.frequency.exponentialRampToValueAtTime(70 + Math.random() * 40, time + 0.05);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800 + Math.random() * 400, time);

        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(sfxNode);

        osc.start(time);
        osc.stop(time + 0.07);
      }
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // Play epic Critical Hit Fanfare
  playCritSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const sfxNode = this.getSfxGain();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.08;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

        osc.connect(gain);
        gain.connect(sfxNode);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch (e) {}
  }

  // Play Fumble / Desastre sound
  playFumbleSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const sfxNode = this.getSfxGain();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(45, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(sfxNode);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  }

  // Spell / Paranormal Ritual cast sound
  playMagicSpell() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const sfxNode = this.getSfxGain();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(sfxNode);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  }

  // Sword strike / Attack hit
  playSwordHit() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const sfxNode = this.getSfxGain();
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(3, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(sfxNode);

      whiteNoise.start();
      whiteNoise.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }

  // Gunshot / Balistic shot
  playGunshot() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const sfxNode = this.getSfxGain();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(sfxNode);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) {}
  }

  // Token Movement / Footstep sound
  playTokenMove() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const sfxNode = this.getSfxGain();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(sfxNode);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {}
  }

  // Footstep / Walk sound
  playFootstep() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const sfxNode = this.getSfxGain();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(120 + Math.random() * 30, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(sfxNode);

      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch (e) {}
  }

  // Tactical click / Button tap
  playClick() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const sfxNode = this.getSfxGain();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(sfxNode);

      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch (e) {}
  }

  // Page flip / Book opening rustle
  playBookFlip() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const sfxNode = this.getSfxGain();
      
      // Generate multiple short rustling impulses
      for (let i = 0; i < 4; i++) {
        const time = ctx.currentTime + i * 0.04;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(250 + Math.random() * 150, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.04);
        
        gain.gain.setValueAtTime(0.06, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
        
        osc.connect(gain);
        gain.connect(sfxNode);
        
        osc.start(time);
        osc.stop(time + 0.04);
      }
    } catch (e) {}
  }

  // Ambience controls
  startAmbience(type: "tavern" | "dungeon" | "haunted" | "combat") {
    const mapped = type === "haunted" ? "paranormal" : type;
    this.setAmbient(mapped as any);
  }

  stopAmbience() {
    this.stopAmbient();
  }

  // Ambient sound synthesizer (Tavern, Dungeon, Paranormal, Combat)
  setAmbient(type: "none" | "tavern" | "dungeon" | "paranormal" | "combat") {
    this.stopAmbient();
    this.currentAmbient = type;
    if (type === "none" || this.isMuted) return;

    try {
      const ctx = this.getContext();
      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientVolume * 0.15, ctx.currentTime);
      this.ambientGain.connect(this.getMasterGain());

      if (type === "paranormal") {
        // Eerie dissonant drone
        const freqs = [55, 110, 116.54, 220]; // Tritone drone
        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.connect(this.ambientGain!);
          osc.start();
          this.ambientOscillators.push(osc);
        });
      } else if (type === "dungeon") {
        // Deep subterranean rumble
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(42, ctx.currentTime);
        osc.connect(this.ambientGain!);
        osc.start();
        this.ambientOscillators.push(osc);
      } else if (type === "tavern") {
        // Warm harmonic chord
        const freqs = [130.81, 164.81, 196.0, 261.63]; // C Major
        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.connect(this.ambientGain!);
          osc.start();
          this.ambientOscillators.push(osc);
        });
      } else if (type === "combat") {
        // Low pulse tension
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(65, ctx.currentTime);
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(2, ctx.currentTime); // 2Hz pulse
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(15, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();
        this.ambientOscillators.push(lfo);

        osc.connect(this.ambientGain!);
        osc.start();
        this.ambientOscillators.push(osc);
      }
    } catch (e) {
      console.warn("Ambient sound error:", e);
    }
  }

  stopAmbient() {
    this.ambientOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.ambientOscillators = [];
    if (this.ambientGain) {
      this.ambientGain.disconnect();
      this.ambientGain = null;
    }
    this.currentAmbient = "none";
  }

  // Play magical spell or action sound
  playSpellCast() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const sfxNode = this.getSfxGain();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(sfxNode);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio synth play error", e);
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    if (this.isMuted) {
      this.stopAmbient();
    }
    return this.isMuted;
  }
}

export const rpgAudio = new RPGAudioEngine();
