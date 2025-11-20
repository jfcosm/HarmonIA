import React from 'react';
import { GuitarVoicing, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface GuitarProps {
  voicing: GuitarVoicing | null;
  language: Language;
}

const NUM_FRETS = 5;
const NUM_STRINGS = 6;

const Guitar: React.FC<GuitarProps> = ({ voicing, language }) => {
  
  if (!voicing) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 transition-colors">
        <p className="text-slate-400 dark:text-slate-500 font-medium text-center px-4">
          {TRANSLATIONS[language].guitarNoVoicing}
        </p>
      </div>
    );
  }

  // Check if any note is beyond fret 5 (shouldn't happen with current dictionary, but for safety)
  const maxFret = Math.max(...voicing);
  const startFret = 1;

  return (
    <div className="relative flex flex-col items-center py-4 select-none">
      
      {/* Nut & Fretboard Container */}
      <div className="relative bg-slate-800 dark:bg-slate-900 shadow-2xl rounded-b-lg overflow-hidden transition-colors" style={{ width: '280px', height: '320px' }}>
        
        {/* Nut (Top Bar) */}
        <div className="absolute top-0 w-full h-2 bg-orange-100 border-b-2 border-slate-400 z-20"></div>

        {/* Frets (Horizontal Lines) */}
        {Array.from({ length: NUM_FRETS }).map((_, i) => (
          <div 
            key={i} 
            className="absolute w-full border-b border-slate-500"
            style={{ top: `${((i + 1) / NUM_FRETS) * 100}%` }}
          >
            {/* Fret Number Label (Optional side decoration) */}
            <span className="absolute -left-6 -top-3 text-xs text-slate-400 font-mono">{i + 1}</span>
          </div>
        ))}

        {/* Strings (Vertical Lines) */}
        {Array.from({ length: NUM_STRINGS }).map((_, i) => {
          // Logic to make lower strings thicker
          const thickness = i < 2 ? '2px' : '1px';
          const opacity = i < 2 ? 0.9 : 0.7;
          
          return (
            <div 
              key={i}
              className="absolute h-full bg-slate-300"
              style={{ 
                left: `${(i / (NUM_STRINGS - 1)) * 80 + 10}%`, // Spread within 10% padding
                width: thickness,
                opacity: opacity
              }}
            />
          );
        })}

        {/* Fret Markers (Dots on wood) */}
        <div 
          className="absolute w-4 h-4 rounded-full bg-slate-600/50 left-1/2 -translate-x-1/2" 
          style={{ top: `${(2.5 / NUM_FRETS) * 100}%` }} // Fret 3 (between 2 and 3 visually) -> index 2.5
        ></div>
        <div 
          className="absolute w-4 h-4 rounded-full bg-slate-600/50 left-1/2 -translate-x-1/2" 
          style={{ top: `${(4.5 / NUM_FRETS) * 100}%` }} // Fret 5
        ></div>

        {/* Fingering & Mutes */}
        {voicing.map((fret, stringIndex) => {
          // stringIndex 0 is Low E (Leftmost in view), 5 is High E
          const leftPos = `${(stringIndex / (NUM_STRINGS - 1)) * 80 + 10}%`;
          
          // Muted String (X)
          if (fret === -1) {
            return (
              <div key={stringIndex} className="absolute -top-6 text-slate-400 font-bold text-lg" style={{ left: leftPos, transform: 'translateX(-50%)' }}>
                X
              </div>
            );
          }

          // Open String (O)
          if (fret === 0) {
            return (
              <div key={stringIndex} className="absolute -top-6 text-indigo-500 font-bold text-lg" style={{ left: leftPos, transform: 'translateX(-50%)' }}>
                O
              </div>
            );
          }

          // Fretted Note (Dot)
          // Position vertically centered in the fret space
          const topPos = `${((fret - 0.5) / NUM_FRETS) * 100}%`;
          
          return (
            <div 
              key={stringIndex}
              className="absolute w-6 h-6 md:w-7 md:h-7 bg-teal-400/90 rounded-full shadow-[0_0_10px_rgba(45,212,191,0.5)] z-30 flex items-center justify-center"
              style={{ 
                left: leftPos, 
                top: topPos, 
                transform: 'translate(-50%, -50%)' 
              }}
            >
              {/* Optional: Show finger number? Or note name? Keeping simple for now. */}
            </div>
          );
        })}

      </div>
      
      {/* Simple Headstock Hint */}
      <div className="w-64 h-4 bg-slate-700 rounded-t-md mt-[-330px] mb-[310px] opacity-80"></div>
    </div>
  );
};

export default Guitar;