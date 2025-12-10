// Armonix v4.2.0 Update
/**
 * Simple synthesis engine for Groovebox (TR-909 / TB-303 / Synx style)
 */

export type InstrumentType = 'kick' | 'snare' | 'hihat' | 'clap';
export type Waveform = 'sine' | 'triangle' | 'sawtooth' | 'square';

export interface BassStep {
  active: boolean;
  note: string; // e.g. 'C', 'F#'
  octave: number; // relative to base octave
}

export interface SynxStep {
  active: boolean;
  note: string;
  octave: number;
}

export class GrooveboxEngine {
  private audioContext: AudioContext | null = null;
  private nextNoteTime: number = 0;
  private current16thNote: number = 0;
  private timerID: number | null = null;
  private isPlaying: boolean = false;
  private tempo: number = 120;
  
  // Bass Synth Parameters
  private filterCutoff: number = 500; // Hz
  private filterResonance: number = 5; // Q
  
  // Synx Synth Parameters
  private synxWaveform: Waveform = 'triangle';
  private synxCutoff: number = 2000;
  private synxResonance: number = 2;
  private synxAttack: number = 0.05;
  private synxDecay: number = 0.1;
  private synxSustain: number = 0.5;
  private synxRelease: number = 0.2;
  private synxArpEnabled: boolean = false;

  // Callbacks to UI
  private onStep: (step: number) => void;
  private getDrumPattern: () => Record<InstrumentType, boolean[]>;
  private getBassPattern: () => BassStep[];
  private getSynxPattern: () => SynxStep[];

  constructor(
    onStepCallback: (step: number) => void, 
    getDrumPatternCb: () => Record<InstrumentType, boolean[]>,
    getBassPatternCb: () => BassStep[],
    getSynxPatternCb: () => SynxStep[]
  ) {
    this.onStep = onStepCallback;
    this.getDrumPattern = getDrumPatternCb;
    this.getBassPattern = getBassPatternCb;
    this.getSynxPattern = getSynxPatternCb;
    console.log("Groovebox Engine Initialized - v4.2.0");
  }

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public start() {
    this.initAudioContext();
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.current16thNote = 0;
    this.nextNoteTime = this.audioContext!.currentTime + 0.1;
    this.scheduler();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerID !== null) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  public setTempo(bpm: number) {
    this.tempo = bpm;
  }

  public setFilterParams(cutoff: number, resonance: number) {
    this.filterCutoff = cutoff;
    this.filterResonance = resonance;
  }

  public setSynxParams(
    waveform: Waveform,
    cutoff: number,
    res: number,
    a: number, d: number, s: number, r: number,
    arp: boolean
  ) {
    this.synxWaveform = waveform;
    this.synxCutoff = cutoff;
    this.synxResonance = res;
    this.synxAttack = a;
    this.synxDecay = d;
    this.synxSustain = s;
    this.synxRelease = r;
    this.synxArpEnabled = arp;
  }

  // Lookahead scheduler
  private scheduler() {
    if (!this.isPlaying || !this.audioContext) return;

    while (this.nextNoteTime < this.audioContext.currentTime + 0.1) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);
      this.nextStep();
    }

    this.timerID = window.setTimeout(() => this.scheduler(), 25);
  }

  private nextStep() {
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += 0.25 * secondsPerBeat; // Add 1/4th of a beat length to time (16th note)
    this.current16thNote++;
    if (this.current16thNote === 16) {
      this.current16thNote = 0;
    }
  }

  private scheduleNote(stepNumber: number, time: number) {
    // Update UI
    requestAnimationFrame(() => {
        this.onStep(stepNumber);
    });

    const drumPattern = this.getDrumPattern();
    const bassPattern = this.getBassPattern();
    const synxPattern = this.getSynxPattern();

    // Play Drums
    if (drumPattern.kick[stepNumber]) this.playKick(time);
    if (drumPattern.snare[stepNumber]) this.playSnare(time);
    if (drumPattern.hihat[stepNumber]) this.playHiHat(time);
    if (drumPattern.clap[stepNumber]) this.playClap(time);

    // Play Bass
    const bassStep = bassPattern[stepNumber];
    if (bassStep && bassStep.active) {
        this.playBass(time, bassStep);
    }

    // Play Synx
    const synxStep = synxPattern[stepNumber];
    if (synxStep && synxStep.active) {
        if (this.synxArpEnabled) {
            this.playSynxArp(time, synxStep);
        } else {
            this.playSynx(time, synxStep);
        }
    }
  }

  // --- SYNTHESIS METHODS ---

  private playKick(time: number) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  private playSnare(time: number) {
    if (!this.audioContext) return;
    
    // Noise
    const bufferSize = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(1, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);

    // Body (Triangle)
    const osc = this.audioContext.createOscillator();
    osc.type = 'triangle';
    
    const oscGain = this.audioContext.createGain();
    oscGain.gain.setValueAtTime(0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc.frequency.setValueAtTime(250, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.audioContext.destination);

    noise.start(time);
    osc.start(time);
    noise.stop(time + 0.2);
    osc.stop(time + 0.2);
  }

  private playHiHat(time: number) {
    if (!this.audioContext) return;

    // Metal Noise
    const bufferSize = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 10000;
    filter.Q.value = 1;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  private playClap(time: number) {
    if (!this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 1;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.8, time + 0.01);
    gain.gain.linearRampToValueAtTime(0.2, time + 0.03);
    gain.gain.linearRampToValueAtTime(0.7, time + 0.04);
    gain.gain.linearRampToValueAtTime(0.001, time + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);

    noise.start(time);
    noise.stop(time + 0.2);
  }

  private playBass(time: number, step: BassStep) {
    if (!this.audioContext) return;

    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseFreq = 65.41; // C2
    const noteIndex = notes.indexOf(step.note);
    if (noteIndex === -1) return;

    const semitones = noteIndex + (step.octave * 12);
    const freq = baseFreq * Math.pow(2, semitones / 12);

    const osc = this.audioContext.createOscillator();
    osc.type = 'sawtooth'; // Classic 303
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = this.filterResonance; 
    
    // Dynamic filter envelope based on cutoff knob
    const baseCutoff = this.filterCutoff;
    const peakCutoff = Math.min(20000, baseCutoff + 2000);

    filter.frequency.setValueAtTime(baseCutoff, time);
    filter.frequency.exponentialRampToValueAtTime(peakCutoff, time + 0.05);
    filter.frequency.exponentialRampToValueAtTime(baseCutoff, time + 0.3);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.4);
  }

  // Melodic Synth (SYNX)
  private playSynx(time: number, step: SynxStep) {
    if (!this.audioContext) return;

    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseFreq = 261.63; // C4 (Middle C)
    const noteIndex = notes.indexOf(step.note);
    if (noteIndex === -1) return;

    const semitones = noteIndex + (step.octave * 12);
    const freq = baseFreq * Math.pow(2, semitones / 12);

    const osc = this.audioContext.createOscillator();
    osc.type = this.synxWaveform;
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = this.synxResonance;
    filter.frequency.setValueAtTime(this.synxCutoff, time);

    const gain = this.audioContext.createGain();
    
    // ADSR Envelope
    const attack = this.synxAttack;
    const decay = this.synxDecay;
    const sustain = this.synxSustain;
    const release = this.synxRelease;
    const holdTime = 0.2; // Duration of step approx

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.4, time + attack); // Max vol 0.4
    gain.gain.linearRampToValueAtTime(0.4 * sustain, time + attack + decay);
    gain.gain.setValueAtTime(0.4 * sustain, time + holdTime);
    gain.gain.linearRampToValueAtTime(0, time + holdTime + release);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(time);
    osc.stop(time + holdTime + release + 0.1);
  }

  private playSynxArp(time: number, step: SynxStep) {
    if (!this.audioContext) return;
    
    // Arpeggiator pattern: Root -> 5th -> Octave
    // Play 3 very short notes within the step duration
    const noteDuration = 0.08; 
    
    const playNote = (semitoneOffset: number, startTime: number) => {
        if (!this.audioContext) return;
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const baseFreq = 261.63; 
        const noteIndex = notes.indexOf(step.note);
        const semitones = noteIndex + (step.octave * 12) + semitoneOffset;
        const freq = baseFreq * Math.pow(2, semitones / 12);

        const osc = this.audioContext.createOscillator();
        osc.type = this.synxWaveform;
        osc.frequency.setValueAtTime(freq, startTime);

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = this.synxCutoff;

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gain.gain.linearRampToValueAtTime(0, startTime + noteDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(startTime);
        osc.stop(startTime + noteDuration + 0.05);
    };

    playNote(0, time);
    playNote(7, time + noteDuration);
    playNote(12, time + noteDuration * 2);
  }
}