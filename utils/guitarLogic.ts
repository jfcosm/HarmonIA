import { GUITAR_VOICINGS, NOTES } from '../constants';
import { GuitarVoicing, ChordExtensionType } from '../types';

export const getGuitarVoicing = (
  rootIndex: number,
  quality: 'major' | 'minor',
  extension: ChordExtensionType
): GuitarVoicing | null => {
  const noteName = NOTES[rootIndex].name;
  
  // Direct Lookup
  if (GUITAR_VOICINGS[noteName] && 
      GUITAR_VOICINGS[noteName][quality] && 
      // @ts-ignore - We know the dictionary might not have every extension, logic handles check
      GUITAR_VOICINGS[noteName][quality][extension]) {
    // @ts-ignore
    return GUITAR_VOICINGS[noteName][quality][extension];
  }

  // Fallback to basic major/minor if extension not found in dictionary
  // (Better to show the triad than nothing for weird extensions in this demo)
  if (GUITAR_VOICINGS[noteName] && GUITAR_VOICINGS[noteName][quality] && GUITAR_VOICINGS[noteName][quality]['none']) {
    return GUITAR_VOICINGS[noteName][quality]['none'];
  }

  return null;
};
