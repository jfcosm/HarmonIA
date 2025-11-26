/**
 * Tuner Logic
 * Implements auto-correlation algorithm for pitch detection
 */

export interface TunerResult {
  note: string;
  frequency: number;
  cents: number;
}

const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export class TunerEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private bufferLength: number = 2048;
  private buffer: Float32Array;
  private isRunning: boolean = false;
  
  constructor() {
    this.buffer = new Float32Array(this.bufferLength);
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.bufferLength;
      
      source.connect(this.analyser);
      this.isRunning = true;
    } catch (err) {
      console.error("Error accessing microphone", err);
      throw err;
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  public getPitch(): TunerResult | null {
    if (!this.isRunning || !this.analyser || !this.audioContext) return null;

    this.analyser.getFloatTimeDomainData(this.buffer);
    // TypeScript Fix: Explicitly treat this.buffer as Float32Array to avoid ArrayBufferLike mismatch issues
    const freq = this.autoCorrelate(this.buffer as Float32Array, this.audioContext.sampleRate);

    if (freq === -1) return null;

    const note = this.noteFromPitch(freq);
    const cents = this.centsOffFromPitch(freq, note);
    const noteName = NOTE_STRINGS[note % 12];

    return {
      note: noteName,
      frequency: freq,
      cents: cents
    };
  }

  // Auto-correlation algorithm (YIN-like simplification)
  // Explicitly typing buf as Float32Array
  private autoCorrelate(buf: Float32Array, sampleRate: number): number {
    // RMS (Root Mean Square) to check signal volume
    let size = buf.length;
    let rms = 0;
    for (let i = 0; i < size; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / size);

    // Threshold to ignore silence/noise
    if (rms < 0.01) return -1;

    // Trim buffer to edges where signal crosses zero to improve accuracy
    let r1 = 0, r2 = size - 1;
    const thres = 0.2;
    for (let i = 0; i < size / 2; i++) {
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < size / 2; i++) {
      if (Math.abs(buf[size - i]) < thres) { r2 = size - i; break; }
    }

    // Slicing a Float32Array returns a new Float32Array (view), which is compatible
    const slicedBuf = buf.slice(r1, r2);
    size = slicedBuf.length;

    // Auto correlation
    const c = new Array(size).fill(0);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - i; j++) {
        c[i] = c[i] + slicedBuf[j] * slicedBuf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    
    for (let i = d; i < size; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    
    let T0 = maxpos;

    // Interpolation for better precision
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  }

  private noteFromPitch(frequency: number): number {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 69;
  }

  private frequencyFromNoteNumber(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  private centsOffFromPitch(frequency: number, note: number): number {
    return Math.floor(1200 * Math.log(frequency / this.frequencyFromNoteNumber(note)) / Math.log(2));
  }
}