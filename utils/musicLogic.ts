
import { QUALITIES, EXTENSIONS, NOTES } from '../constants';
import { ChordExtensionType, NoteDefinition, NoteNotation } from '../types';

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

/**
 * Detects chord from a set of MIDI notes
 */
export const detectChord = (midiNotes: number[], notation: NoteNotation): string | null => {
  if (midiNotes.length < 3) return null;

  // Sort and normalize
  const sortedNotes = [...midiNotes].sort((a, b) => a - b);
  const uniqueNotes = Array.from(new Set(sortedNotes.map(n => n % 12)));
  
  // Iterate through each note as a potential root
  for (let i = 0; i < uniqueNotes.length; i++) {
    const root = uniqueNotes[i];
    
    // Calculate intervals relative to this root
    const intervals = uniqueNotes.map(n => (n - root + 12) % 12).sort((a, b) => a - b);
    
    // Match intervals to qualities and extensions
    // Simple matching logic for common chords
    
    // Major Triad: 0, 4, 7
    const isMajor = intervals.includes(0) && intervals.includes(4) && intervals.includes(7);
    // Minor Triad: 0, 3, 7
    const isMinor = intervals.includes(0) && intervals.includes(3) && intervals.includes(7);
    
    if (isMajor) {
      const rootName = notation === NoteNotation.AMERICAN ? NOTES[root].name : NOTES[root].latinName;
      if (intervals.includes(10) && intervals.includes(14 % 12)) return `${rootName}9`; // Dom9
      if (intervals.includes(11) && intervals.includes(14 % 12)) return `${rootName}maj9`; // Maj9
      if (intervals.includes(10)) return `${rootName}7`;
      if (intervals.includes(11)) return `${rootName}maj7`;
      if (intervals.includes(2)) return `${rootName}add9`;
      if (intervals.includes(14 % 12)) return `${rootName}add9`; // 2 and 14 are same mod 12
      if (intervals.includes(9)) return `${rootName}6`;
      return rootName; // Just Major
    }

    if (isMinor) {
      const rootName = notation === NoteNotation.AMERICAN ? NOTES[root].name : NOTES[root].latinName;
      let suffix = 'm';
      if (intervals.includes(10)) suffix += '7';
      else if (intervals.includes(11)) suffix += 'maj7';
      
      if (intervals.includes(2) || intervals.includes(14 % 12)) suffix += '(add9)';
      if (intervals.includes(5) && intervals.includes(6)) {
         // Special case, maybe m7b5 check later
      }
      
      return rootName + suffix;
    }
    
    // Diminished: 0, 3, 6
    if (intervals.includes(0) && intervals.includes(3) && intervals.includes(6)) {
       const rootName = notation === NoteNotation.AMERICAN ? NOTES[root].name : NOTES[root].latinName;
       if (intervals.includes(10)) return `${rootName}m7b5`; // Half-dim
       if (intervals.includes(9)) return `${rootName}dim7`; // Full dim (bb7 = 6+3 = 9 semitones from root? No, 7 dim is 9)
       return `${rootName}dim`;
    }

    // Augmented: 0, 4, 8
    if (intervals.includes(0) && intervals.includes(4) && intervals.includes(8)) {
        const rootName = notation === NoteNotation.AMERICAN ? NOTES[root].name : NOTES[root].latinName;
        return `${rootName}aug`;
    }
    
    // Sus4: 0, 5, 7
    if (intervals.includes(0) && intervals.includes(5) && intervals.includes(7)) {
        const rootName = notation === NoteNotation.AMERICAN ? NOTES[root].name : NOTES[root].latinName;
        if (intervals.includes(10)) return `${rootName}7sus4`;
        return `${rootName}sus4`;
    }

    // Sus2: 0, 2, 7
    if (intervals.includes(0) && intervals.includes(2) && intervals.includes(7)) {
        const rootName = notation === NoteNotation.AMERICAN ? NOTES[root].name : NOTES[root].latinName;
        return `${rootName}sus2`;
    }
  }

  return null;
};
