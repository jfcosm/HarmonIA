export enum NoteNotation {
  AMERICAN = 'AMERICAN', // C, D, E...
  LATIN = 'LATIN',       // Do, Re, Mi...
}

export type Language = 'en' | 'es';

export type Instrument = 'piano' | 'guitar';

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

export type ChordExtensionType = 'none' | '7' | 'maj7' | '9' | 'sus2' | 'sus4' | 'dim' | 'aug' | '6';

// Array of 6 numbers. -1 = Mute/X, 0 = Open, 1-5 = Fret number.
// Order: Low E (String 6) to High E (String 1)
export type GuitarVoicing = number[]; 
