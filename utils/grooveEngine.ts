
/**
 * Simple synthesis engine for Groovebox (TR-909 / TB-303 style)
 */

export type InstrumentType = 'kick' | 'snare' | 'hihat' | 'clap';

export interface BassStep {
  active: boolean;
  note: string; // e.g. 'C', 'F#'
  octave: number; // relative to base 303 octave (usually 2)
}

export class GrooveboxEngine {
  private audioContext: AudioContext | null = null;
  private nextNoteTime: number = 0;
  private current16thNote: number = 0;
  private timerID: number | null = null;
  private isPlaying: boolean = false;
  private tempo: number = 120;
  
  // Synth Parameters
  private filterCutoff: number = 500; // Hz
  private filterResonance: number = 5; // Q
  
  // Callbacks to UI
  private onStep: (step: number) => void;
  private getDrumPattern: () => Record<InstrumentType, boolean[]>;
  private getBassPattern: () => BassStep[];

  constructor(
    onStepCallback: (step: number) => void, 
    getDrumPatternCb: () => Record<InstrumentType, boolean[]>,
    getBassPatternCb: () => BassStep[]
  ) {
    this.onStep = onStepCallback;
    this.getDrumPattern = getDrumPatternCb;
    this.getBassPattern = getBassPatternCb;
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

  // Lookahead scheduler
  private scheduler() {
    if (!this.isPlaying || !this.audioContext) return;

    // while there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
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

    // Play Drums
    if (drumPattern.kick[stepNumber]) this.playKick(time);
    if (drumPattern.snare[stepNumber]) this.playSnare(time);
    if (drumPattern.hihat[stepNumber]) this.playHiHat(time);
    if (drumPattern.clap[stepNumber]) this.playClap(time);

    // Play Bass
    const step = bassPattern[stepNumber];
    if (step && step.active) {
        this.playBass(time, step);
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

    // Basic frequency calculation
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseFreq = 65.41; // C2
    const noteIndex = notes.indexOf(step.note);
    if (noteIndex === -1) return;

    // Calculate semitones from C2
    // step.octave is relative to 2 (default). 0 = C2.
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
}
