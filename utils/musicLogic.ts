import { NOTES, QUALITIES, EXTENSIONS } from '../constants';
import { NoteDefinition, ChordExtensionType } from '../types';

/**
 * Generates the MIDI numbers for the selected chord.
 * We use C3 (MIDI 48) as the base reference for the visual piano.
 */
export const getChordMidiNumbers = (
  rootIndex: number, 
  quality: 'major' | 'minor', 
  extension: ChordExtensionType
): number[] => {
  // 1. Get base triad intervals
  const baseIntervals = QUALITIES[quality];

  // 2. Apply extension logic to get final intervals from root
  const finalIntervals = EXTENSIONS[extension].intervals(baseIntervals);

  // 3. Map to absolute MIDI notes starting from a base root
  // Start Octave 4 corresponds to 4 * 12 = 48 (C3).
  const startOctave = 4; 
  const rootMidi = (startOctave * 12) + rootIndex;

  return finalIntervals.map(interval => rootMidi + interval);
};

/**
 * Simple audio synthesis to play the chord
 */
let audioContext: AudioContext | null = null;

export const playChordSound = (midiNotes: number[]) => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  // Resume context if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const now = audioContext.currentTime;
  // Slower arpeggio for distinct "one by one" feel
  const arpeggioSpeed = 0.2; 
  
  midiNotes.forEach((note, index) => {
    if (!audioContext) return;
    
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    // Shift up +12 semitones (1 octave) relative to the calculated MIDI for clearer, brighter sound.
    // Since base is ~48 (C3), adding 12 moves it to ~60 (C4/Middle C). 
    // If user thinks it's still too low, we can add 24. Let's stick to +12 as requested "una octava más arriba".
    const playbackNote = note + 12;

    // MIDI to Frequency formula
    const frequency = 440 * Math.pow(2, (playbackNote - 69) / 12);
    
    osc.type = 'sine'; // Sine wave for soft piano-like tone
    osc.frequency.setValueAtTime(frequency, now);
    
    // Staggered start time for arpeggio effect
    const startTime = now + (index * arpeggioSpeed);
    const noteDuration = 1.0;
    const stopTime = startTime + noteDuration;

    // Envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, stopTime); // Decay
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start(startTime);
    osc.stop(stopTime);
  });
};