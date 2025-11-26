

export enum NoteNotation {
  AMERICAN = 'AMERICAN', // C, D, E...
  LATIN = 'LATIN',       // Do, Re, Mi...
}

export type Language = 'en' | 'es' | 'it' | 'fr' | 'de' | 'zh' | 'ja' | 'ko';

export type Instrument = 'piano' | 'guitar';

export type AppMode = 'visualizer' | 'composer' | 'detector' | 'groovebox' | 'tuner';

export interface NoteDefinition {
  name: string; // "C", "C#"
  latinName: string; // "Do", "Do#"
  index: number; // 0-11
}

export interface ChordQualityDef {
  label: string;
  value: string;
  intervals: number[]; // Semitone distances from root
}

export interface KeyState {
  noteIndex: number; // 0-11 relative to octave
  octave: number;
  midi: number; // Unique ID (e.g., 60 for Middle C)
  isBlack: boolean;
  name: string;
  isActive: boolean;
  isRoot: boolean;
}

// Updated with extended jazz/pop chords
export type ChordExtensionType = 
  'none' | '7' | 'maj7' | '9' | 'add9' | 'maj9' | 
  'sus2' | 'sus4' | '7sus4' | 
  'dim' | 'aug' | 'm7b5' | 
  '6' | 'maj7#11' | 'maj13';

// Array of 6 numbers. -1 = Mute/X, 0 = Open, 1-5 = Fret number.
// Order: Low E (String 6) to High E (String 1)
export type GuitarVoicing = number[];

// Composer Types
export type SongStyle = 'pop' | 'rock' | 'ballad' | 'jazz' | 'reggae' | 'lofi' | 'country' | 'techno' | 'electropop' | 'alternative' | 'heavy-metal' | 'blues' | 'k-pop' | 'ost';
export type SongMood = 'happy' | 'sad' | 'melancholic' | 'energetic' | 'relaxed' | 'epic' | 'meditation' | 'concentration';
export type SongTempo = 'slow' | 'moderate' | 'fast';
export type SongComplexity = 'basic' | 'intermediate' | 'advanced';