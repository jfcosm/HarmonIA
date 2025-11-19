import React, { useMemo } from 'react';
import { NOTES } from '../constants';
import { NoteNotation } from '../types';

interface PianoProps {
  activeMidiNotes: number[];
  rootMidi?: number;
  notation: NoteNotation;
}

const START_OCTAVE = 3; // Start at C3
const NUM_OCTAVES = 3;  // Show 3 octaves

const Piano: React.FC<PianoProps> = ({ activeMidiNotes, rootMidi, notation }) => {
  
  // Generate all keys for the keyboard
  const keys = useMemo(() => {
    const k = [];
    for (let i = 0; i < NUM_OCTAVES * 12; i++) {
      const noteIndex = i % 12;
      const octave = START_OCTAVE + Math.floor(i / 12);
      const midi = (octave * 12) + noteIndex;
      const noteDef = NOTES[noteIndex];
      const isBlack = noteDef.name.includes('#');
      
      // Determine display name based on notation prop
      const displayName = notation === NoteNotation.AMERICAN ? noteDef.name : noteDef.latinName;
      
      k.push({
        midi,
        noteIndex,
        isBlack,
        name: displayName,
        isActive: activeMidiNotes.includes(midi),
        isRoot: rootMidi !== undefined && (midi % 12 === rootMidi % 12) && activeMidiNotes.includes(midi)
      });
    }
    return k;
  }, [activeMidiNotes, rootMidi, notation]);

  const renderKeys = () => {
    const whiteKeys = keys.filter(k => !k.isBlack);
    const blackKeys = keys.filter(k => k.isBlack);

    return (
      // Removed overflow-x-auto to prevent scrolling, allowing flex to fit width
      <div className="relative select-none flex justify-center w-full">
        <div className="relative flex w-full max-w-5xl h-40 md:h-56 lg:h-64 bg-slate-800 p-1 rounded-xl shadow-2xl border-t-4 border-slate-700">
          {whiteKeys.map((key) => (
            <div
              key={key.midi}
              className={`
                relative flex-1 h-full rounded-b-md mx-[1px] z-0
                flex items-end justify-center pb-2 md:pb-4 transition-all duration-300
                border border-slate-300
                ${key.isActive 
                  ? (key.isRoot ? 'bg-indigo-300 shadow-[inset_0_-10px_20px_rgba(79,70,229,0.3)]' : 'bg-indigo-200') 
                  : 'bg-white hover:bg-slate-50'}
              `}
            >
               {/* Note Label */}
               {(key.isActive || key.noteIndex === 0) && (
                 <span className={`text-[10px] md:text-xs font-bold ${key.isActive ? 'text-indigo-900' : 'text-slate-400'}`}>
                   {key.name}
                 </span>
               )}
            </div>
          ))}

          {/* Render Black Keys Absolutely */}
          {blackKeys.map((key) => {
            const octaveOffset = Math.floor((key.midi - (START_OCTAVE * 12)) / 12);
            const noteInOctave = key.midi % 12;
            
            // Map chromatic index to number of white keys preceding it
            const whiteKeysBeforeInOctave = [1, 2, 4, 5, 6][[1, 3, 6, 8, 10].indexOf(noteInOctave)];
            const totalWhiteKeysBefore = (octaveOffset * 7) + (whiteKeysBeforeInOctave || 0);
            
            // Calculate positions
            // White Key Width = 100% / numWhiteKeys
            const numWhiteKeys = whiteKeys.length;
            const whiteKeyWidthPct = 100 / numWhiteKeys;
            
            // Thinner black keys (approx 3.5% of container width vs previous ~6%)
            // Centered on the line: Left = (PrecedingWhite * Width) - (BlackKeyWidth / 2)
            const blackKeyWidth = 3.5; 
            
            return (
              <div
                key={key.midi}
                style={{ 
                    left: `calc(${totalWhiteKeysBefore * whiteKeyWidthPct}% - (${blackKeyWidth / 2}%))`
                }}
                className={`
                  absolute top-0 z-10
                  w-[3.5%] h-[60%] 
                  rounded-b-sm md:rounded-b-md shadow-lg
                  transition-colors duration-200
                  border-x border-b border-black
                  ${key.isActive 
                    ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]' 
                    : 'bg-slate-900 bg-gradient-to-b from-slate-800 to-black'}
                `}
              >
                 {/* Optional Black Key Label if active */}
                 {key.isActive && (
                    <span className="absolute bottom-2 left-0 right-0 text-center text-[8px] md:text-[10px] text-white font-bold pointer-events-none">
                      {key.name}
                    </span>
                 )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return renderKeys();
};

export default Piano;