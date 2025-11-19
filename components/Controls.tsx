import React from 'react';
import { NOTES, EXTENSIONS, TRANSLATIONS } from '../constants';
import { NoteNotation, ChordExtensionType, Language, Instrument } from '../types';
import { Guitar, Piano as PianoIcon } from 'lucide-react';

interface ControlsProps {
  selectedRootIndex: number;
  onRootChange: (index: number) => void;
  
  quality: 'major' | 'minor';
  onQualityChange: (q: 'major' | 'minor') => void;
  
  extension: ChordExtensionType;
  onExtensionChange: (e: ChordExtensionType) => void;
  
  notation: NoteNotation;
  onNotationChange: (n: NoteNotation) => void;

  language: Language;
  instrument: Instrument;
  onInstrumentChange: (i: Instrument) => void;
}

const Controls: React.FC<ControlsProps> = ({
  selectedRootIndex,
  onRootChange,
  quality,
  onQualityChange,
  extension,
  onExtensionChange,
  notation,
  onNotationChange,
  language,
  instrument,
  onInstrumentChange
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto p-4 md:p-8 bg-white rounded-3xl shadow-xl border border-slate-100">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        
        {/* Instrument Toggle */}
        <div className="bg-slate-100 p-1.5 rounded-xl flex w-full md:w-auto">
          <button
            onClick={() => onInstrumentChange('piano')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${instrument === 'piano' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <PianoIcon size={18} />
            {t.piano}
          </button>
          <button
            onClick={() => onInstrumentChange('guitar')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${instrument === 'guitar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Guitar size={18} />
            {t.guitar}
          </button>
        </div>

        {/* Notation Toggle */}
        <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
          <button
            onClick={() => onNotationChange(NoteNotation.AMERICAN)}
            className={`px-3 py-1 rounded-md transition-all ${notation === NoteNotation.AMERICAN ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
          >
            C - D - E
          </button>
          <button
            onClick={() => onNotationChange(NoteNotation.LATIN)}
            className={`px-3 py-1 rounded-md transition-all ${notation === NoteNotation.LATIN ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
          >
            Do - Re - Mi
          </button>
        </div>
      </div>

      {/* Section 1: Root Note */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.root}</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
          {NOTES.map((note) => (
            <button
              key={note.index}
              onClick={() => onRootChange(note.index)}
              className={`
                h-12 rounded-xl font-semibold text-lg transition-all duration-200
                ${selectedRootIndex === note.index 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
                  : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 border border-slate-100'}
              `}
            >
              {notation === NoteNotation.AMERICAN ? note.name : note.latinName}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section 2: Quality */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.quality}</h3>
          <div className="flex gap-3">
            {(['major', 'minor'] as const).map((q) => (
              <button
                key={q}
                onClick={() => onQualityChange(q)}
                className={`
                  flex-1 py-3 px-6 rounded-xl font-medium capitalize transition-all
                  ${quality === q 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' 
                    : 'bg-slate-50 text-slate-600 hover:bg-rose-50 border border-slate-100'}
                `}
              >
                {t[q]}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Variations */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.extension}</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {(Object.keys(EXTENSIONS) as ChordExtensionType[]).map((ext) => (
              <button
                key={ext}
                onClick={() => onExtensionChange(ext)}
                className={`
                  py-2 px-2 rounded-lg text-sm font-medium transition-all
                  ${extension === ext 
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-200' 
                    : 'bg-slate-50 text-slate-600 hover:bg-teal-50 border border-slate-100'}
                `}
              >
                {ext === 'none' ? t.basic : ext}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
