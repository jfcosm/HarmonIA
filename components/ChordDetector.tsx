// Armonix v4.8.0 Update
import React, { useState, useEffect } from 'react';
import Piano from './Piano';
import { NoteNotation, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { detectChord, playChordSound } from '../utils/musicLogic';
import { fetchChordInsight } from '../services/geminiService';
import { Search, RefreshCcw, Sparkles, Volume2 } from 'lucide-react';

interface ChordDetectorProps {
  language: Language;
  notation: NoteNotation;
  onNotationChange: (n: NoteNotation) => void;
}

const ChordDetector: React.FC<ChordDetectorProps> = ({ language, notation, onNotationChange }) => {
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
  const [detectedName, setDetectedName] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const t = TRANSLATIONS[language];

  const handleKeyClick = (midi: number) => {
    // Toggle note selection
    let newNotes = [...selectedNotes];
    if (newNotes.includes(midi)) {
      newNotes = newNotes.filter(n => n !== midi);
    } else {
      if (newNotes.length < 5) {
        newNotes.push(midi);
      }
    }
    setSelectedNotes(newNotes);
    
    // Play the note clicked
    playChordSound([midi]);
  };

  const handleClear = () => {
    setSelectedNotes([]);
    setDetectedName(null);
    setInsight(null);
  };

  const handlePlayChord = () => {
    if (selectedNotes.length > 0) {
      playChordSound(selectedNotes.sort((a, b) => a - b));
    }
  };

  // Effect to detect chord when notes change
  useEffect(() => {
    if (selectedNotes.length >= 3) {
      const name = detectChord(selectedNotes, notation);
      setDetectedName(name);
    } else {
      setDetectedName(null);
      setInsight(null);
    }
  }, [selectedNotes, notation]);

  // Effect to fetch insight when a chord is detected
  useEffect(() => {
    if (detectedName && detectedName !== t.unknownChord) {
      const fetchInfo = async () => {
        setIsLoadingInsight(true);
        // Use the American name for better AI query results, or pass detectedName
        // If we rely on detectChord using the current notation, we pass that.
        const text = await fetchChordInsight(detectedName, language);
        setInsight(text);
        setIsLoadingInsight(false);
      };
      
      // Debounce slightly
      const timeout = setTimeout(fetchInfo, 1000);
      return () => clearTimeout(timeout);
    }
  }, [detectedName, language]);

  return (
    <div className="flex flex-col items-center space-y-8 w-full">
      
      {/* Header & Instruction */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.detectorTitle}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t.detectorSubtitle}</p>
      </div>

      {/* Controls Toolbar */}
      <div className="w-full max-w-4xl flex justify-between items-center px-4">
         <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex text-sm font-medium transition-colors">
            <button
              onClick={() => onNotationChange(NoteNotation.AMERICAN)}
              className={`px-3 py-1 rounded-md transition-all ${notation === NoteNotation.AMERICAN ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
              C - D - E
            </button>
            <button
              onClick={() => onNotationChange(NoteNotation.LATIN)}
              className={`px-3 py-1 rounded-md transition-all ${notation === NoteNotation.LATIN ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Do - Re - Mi
            </button>
         </div>

         <button 
           onClick={handleClear}
           className="flex items-center gap-2 px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors font-medium text-sm"
         >
           <RefreshCcw size={16} />
           {t.clearKeys}
         </button>
      </div>

      {/* Display Result */}
      <div className="inline-flex items-center gap-4 p-4 md:p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors min-h-[100px] min-w-[300px] justify-center">
        {selectedNotes.length >= 3 ? (
          <>
            <div className="text-center">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                {t.chordDetected}
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-indigo-900 dark:text-indigo-300 tracking-tighter">
                {detectedName || t.unknownChord}
              </h2>
            </div>
            <button 
              onClick={handlePlayChord}
              className="bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 p-3 rounded-full transition-all active:scale-95 ml-4"
              title={t.play}
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </>
        ) : (
          <p className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-2">
            <Search className="w-5 h-5" />
            {t.selectMoreKeys} ({selectedNotes.length}/3)
          </p>
        )}
      </div>

      {/* Piano Interface */}
      <div className="w-full flex justify-center">
        <Piano 
          activeMidiNotes={selectedNotes}
          notation={notation}
          language={language}
          onKeyClick={handleKeyClick}
        />
      </div>

      {/* AI Insight for Detected Chord */}
      {detectedName && detectedName !== t.unknownChord && (
        <section className="max-w-4xl w-full px-2 pb-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="bg-gradient-to-r from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm relative overflow-hidden transition-colors">
            <div className="flex items-start gap-3 relative z-10">
              <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2 text-sm uppercase tracking-wide">{t.aiInsight}</h3>
                {isLoadingInsight ? (
                  <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-2 bg-indigo-200 dark:bg-slate-700 rounded w-3/4"></div>
                      <div className="h-2 bg-indigo-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                    {insight}
                  </p>
                )}
              </div>
            </div>
            {/* Decorative BG Circle */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-100 dark:bg-indigo-900 rounded-full opacity-50 blur-2xl"></div>
          </div>
        </section>
      )}

    </div>
  );
};

export default ChordDetector;