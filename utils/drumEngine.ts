// Armonix v4.4.0 - Physical Modeling Drum Engine
// Pure procedural synthesis without external samples.

export type DrumKit = 'acoustic' | 'electronic';

export type DrumPadId = 
  | 'crash' | 'ride' | 'tom1' | 'tom2' | 'tom3' 
  | 'kick' | 'snare' | 'hihat_closed' | 'hihat_open' | 'clap';

export class DrumEngine {
  private audioContext: AudioContext | null = null;
  private reverbNode: ConvolverNode | null = null;
  private masterGain: GainNode | null = null;
  private kit: DrumKit = 'acoustic';
  private reverbLevel: number = 0.3;
  private masterVolume: number = 0.8;

  constructor() {
    // Lazy init in trigger
  }

  public setKit(kit: DrumKit) {
    this.kit = kit;
  }

  public setReverb(amount: number) {
    this.reverbLevel = Math.max(0, Math.min(1, amount));
  }

  public setVolume(amount: number) {
    this.masterVolume = Math.max(0, Math.min(1, amount));
    if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext?.currentTime || 0);
    }
  }

  private initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Master Gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.audioContext.destination);

      // Reverb Setup (Impulse Response)
      this.reverbNode = this.audioContext.createConvolver();
      const impulse = this.createImpulseResponse(2.0, 2.0, false);
      this.reverbNode.buffer = impulse;
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Generate a simple reverb impulse
  private createImpulseResponse(duration: number, decay: number, reverse: boolean): AudioBuffer {
    const ctx = this.audioContext!;
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = reverse ? length - i : i;
      // Simple noise with exponential decay
      const e = Math.pow(1 - n / length, decay);
      left[i] = (Math.random() * 2 - 1) * e;
      right[i] = (Math.random() * 2 - 1) * e;
    }
    return impulse;
  }

  public trigger(pad: DrumPadId) {
    this.initAudio();
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Create separate paths for Dry and Wet
    // This ensures that if Reverb is 0, we still hear the Dry signal.
    
    // Dry Path
    const dryGain = ctx.createGain();
    dryGain.gain.value = 1.0; // Full dry signal by default
    dryGain.connect(this.masterGain);

    // Wet Path
    const wetGain = ctx.createGain();
    wetGain.gain.value = this.reverbLevel; // Controlled by slider
    if (this.reverbNode) {
        wetGain.connect(this.reverbNode);
        this.reverbNode.connect(this.masterGain);
    }

    // Input mixer (so triggers can feed both Dry and Wet)
    const inputMix = ctx.createGain();
    inputMix.gain.value = 1.0;
    inputMix.connect(dryGain);
    inputMix.connect(wetGain);

    // Route trigger based on kit
    // We pass 'inputMix' as the destination for the synth functions
    if (this.kit === 'acoustic') {
      this.playAcoustic(pad, now, inputMix);
    } else {
      this.playElectronic(pad, now, inputMix);
    }
  }

  // --- ACOUSTIC KIT SYNTHESIS (Physical Modeling-ish) ---
  
  private playAcoustic(pad: DrumPadId, time: number, dest: AudioNode) {
    const ctx = this.audioContext!;
    
    switch (pad) {
      case 'kick': {
        // Punchy low sine with pitch drop + click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(50, time + 0.1);
        gain.gain.setValueAtTime(1.0, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(time);
        osc.stop(time + 0.3);
        
        // Beater Click
        const click = ctx.createOscillator();
        const cGain = ctx.createGain();
        click.type = 'square';
        click.frequency.setValueAtTime(2000, time);
        cGain.gain.setValueAtTime(0.2, time);
        cGain.gain.exponentialRampToValueAtTime(0.01, time + 0.02);
        click.connect(cGain);
        cGain.connect(dest);
        click.start(time);
        click.stop(time + 0.02);
        break;
      }
      case 'snare': {
        // Body (Tone)
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.frequency.setValueAtTime(250, time);
        oscGain.gain.setValueAtTime(0.4, time);
        oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        osc.connect(oscGain);
        oscGain.connect(dest);
        osc.start(time);
        osc.stop(time + 0.15);

        // Snares (Noise)
        const noise = this.createNoiseBuffer();
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noise;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.8, time);
        nGain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);
        noiseSrc.connect(filter);
        filter.connect(nGain);
        nGain.connect(dest);
        noiseSrc.start(time);
        noiseSrc.stop(time + 0.3);
        break;
      }
      case 'hihat_closed': {
        const osc = this.createMetalBuffer();
        const src = ctx.createBufferSource();
        src.buffer = osc;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        src.start(time);
        src.stop(time + 0.1);
        break;
      }
      case 'hihat_open': {
         const osc = this.createMetalBuffer();
         const src = ctx.createBufferSource();
         src.buffer = osc;
         const filter = ctx.createBiquadFilter();
         filter.type = 'highpass';
         filter.frequency.value = 5000;
         const gain = ctx.createGain();
         gain.gain.setValueAtTime(0.5, time);
         gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
         src.connect(filter);
         filter.connect(gain);
         gain.connect(dest);
         src.start(time);
         src.stop(time + 0.5);
         break;
      }
      case 'crash': {
         const osc = this.createNoiseBuffer();
         const src = ctx.createBufferSource();
         src.buffer = osc;
         const filter = ctx.createBiquadFilter();
         filter.type = 'highpass';
         filter.frequency.value = 3000;
         const gain = ctx.createGain();
         gain.gain.setValueAtTime(0.7, time);
         gain.gain.exponentialRampToValueAtTime(0.01, time + 1.5);
         src.connect(filter);
         filter.connect(gain);
         gain.connect(dest);
         src.start(time);
         src.stop(time + 1.5);
         break;
      }
      case 'ride': {
         // Bell tone
         const osc = ctx.createOscillator();
         osc.type = 'triangle';
         osc.frequency.setValueAtTime(600, time);
         const gain = ctx.createGain();
         gain.gain.setValueAtTime(0.3, time);
         gain.gain.exponentialRampToValueAtTime(0.01, time + 1.0);
         // Metallic noise mix
         const m = this.createMetalBuffer();
         const mSrc = ctx.createBufferSource();
         mSrc.buffer = m;
         const mGain = ctx.createGain();
         mGain.gain.setValueAtTime(0.2, time);
         mGain.gain.exponentialRampToValueAtTime(0.01, time + 0.8);
         
         osc.connect(gain);
         gain.connect(dest);
         mSrc.connect(mGain);
         mGain.connect(dest);
         
         osc.start(time);
         osc.stop(time + 1.0);
         mSrc.start(time);
         mSrc.stop(time + 1.0);
         break;
      }
      case 'tom1':
      case 'tom2':
      case 'tom3': {
         const pitch = pad === 'tom1' ? 180 : (pad === 'tom2' ? 140 : 100);
         const osc = ctx.createOscillator();
         osc.frequency.setValueAtTime(pitch, time);
         osc.frequency.exponentialRampToValueAtTime(pitch * 0.8, time + 0.2);
         const gain = ctx.createGain();
         gain.gain.setValueAtTime(0.8, time);
         gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
         osc.connect(gain);
         gain.connect(dest);
         osc.start(time);
         osc.stop(time + 0.4);
         break;
      }
      case 'clap': {
         // Short bursts of noise
         const noise = this.createNoiseBuffer();
         const src = ctx.createBufferSource();
         src.buffer = noise;
         const filter = ctx.createBiquadFilter();
         filter.type = 'bandpass';
         filter.frequency.value = 1200;
         const gain = ctx.createGain();
         
         gain.gain.setValueAtTime(0, time);
         gain.gain.linearRampToValueAtTime(0.7, time + 0.01);
         gain.gain.exponentialRampToValueAtTime(0.1, time + 0.03); // Echo 1
         gain.gain.linearRampToValueAtTime(0.5, time + 0.04); // Echo 2
         gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

         src.connect(filter);
         filter.connect(gain);
         gain.connect(dest);
         src.start(time);
         src.stop(time + 0.2);
         break;
      }
    }
  }

  // --- ELECTRONIC KIT SYNTHESIS (909 Style) ---

  private playElectronic(pad: DrumPadId, time: number, dest: AudioNode) {
    const ctx = this.audioContext!;
    
    switch (pad) {
      case 'kick': {
         // Deep 909 Kick
         const osc = ctx.createOscillator();
         osc.frequency.setValueAtTime(120, time);
         osc.frequency.exponentialRampToValueAtTime(40, time + 0.2);
         const gain = ctx.createGain();
         gain.gain.setValueAtTime(1.0, time);
         gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
         
         // Click
         const click = ctx.createOscillator();
         click.type = 'square';
         click.frequency.setValueAtTime(800, time);
         const cGain = ctx.createGain();
         cGain.gain.setValueAtTime(0.3, time);
         cGain.gain.exponentialRampToValueAtTime(0.01, time + 0.01);
         
         osc.connect(gain);
         click.connect(cGain);
         gain.connect(dest);
         cGain.connect(dest);
         
         osc.start(time);
         osc.stop(time + 0.4);
         click.start(time);
         click.stop(time + 0.02);
         break;
      }
      case 'snare': {
         // 909 Snare (Tonal + Noise)
         const tone = ctx.createOscillator();
         tone.frequency.setValueAtTime(200, time);
         tone.frequency.linearRampToValueAtTime(160, time + 0.1);
         const tGain = ctx.createGain();
         tGain.gain.setValueAtTime(0.5, time);
         tGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
         
         const noise = this.createNoiseBuffer();
         const nSrc = ctx.createBufferSource();
         nSrc.buffer = noise;
         const nFilter = ctx.createBiquadFilter();
         nFilter.type = 'lowpass';
         nFilter.frequency.value = 2000;
         const nGain = ctx.createGain();
         nGain.gain.setValueAtTime(0.7, time);
         nGain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);
         
         tone.connect(tGain);
         tGain.connect(dest);
         nSrc.connect(nFilter);
         nFilter.connect(nGain);
         nGain.connect(dest);
         
         tone.start(time);
         tone.stop(time + 0.2);
         nSrc.start(time);
         nSrc.stop(time + 0.3);
         break;
      }
      case 'hihat_closed':
      case 'hihat_open': {
         // Metal Noise
         const osc = this.createMetalBuffer();
         const src = ctx.createBufferSource();
         src.buffer = osc;
         const filter = ctx.createBiquadFilter();
         filter.type = 'highpass';
         filter.frequency.value = 7000;
         const gain = ctx.createGain();
         
         const dur = pad === 'hihat_closed' ? 0.05 : 0.3;
         gain.gain.setValueAtTime(0.5, time);
         gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
         
         src.connect(filter);
         filter.connect(gain);
         gain.connect(dest);
         src.start(time);
         src.stop(time + dur + 0.1);
         break;
      }
      case 'tom1':
      case 'tom2':
      case 'tom3': {
         // Simmons style synth toms
         const pitch = pad === 'tom1' ? 400 : (pad === 'tom2' ? 300 : 200);
         const osc = ctx.createOscillator();
         osc.type = 'square';
         const filter = ctx.createBiquadFilter();
         filter.type = 'lowpass';
         filter.frequency.setValueAtTime(pitch * 2, time);
         filter.frequency.exponentialRampToValueAtTime(pitch * 0.5, time + 0.3);
         
         osc.frequency.value = pitch * 0.8; 
         
         const gain = ctx.createGain();
         gain.gain.setValueAtTime(0.6, time);
         gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
         
         osc.connect(filter);
         filter.connect(gain);
         gain.connect(dest);
         
         osc.start(time);
         osc.stop(time + 0.3);
         break;
      }
      default: {
         // Fallback to acoustic logic for others or silence
         this.playAcoustic(pad, time, dest);
         break;
      }
    }
  }

  // Helper: Create White Noise
  private createNoiseBuffer(): AudioBuffer {
    const ctx = this.audioContext!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Helper: Create Metallic Noise (multiple square waves)
  private createMetalBuffer(): AudioBuffer {
     const ctx = this.audioContext!;
     const buffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
     const data = buffer.getChannelData(0);
     
     // Sum of non-harmonic square waves
     for (let i = 0; i < data.length; i++) {
        let val = 0;
        const t = i / ctx.sampleRate;
        val += Math.sign(Math.sin(2 * Math.PI * 540 * t));
        val += Math.sign(Math.sin(2 * Math.PI * 800 * t));
        val += Math.sign(Math.sin(2 * Math.PI * 300 * t));
        val += Math.sign(Math.sin(2 * Math.PI * 420 * t));
        data[i] = val * 0.25;
     }
     return buffer;
  }
}