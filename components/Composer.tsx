// Armonix v4.2.0 Update
import React, { useState } from 'react';
import { SongStyle, SongMood, SongTempo, SongComplexity, Language, NoteNotation } from '../types';
import { COMPOSER_OPTIONS, TRANSLATIONS, NOTES } from '../constants';
import { generateSongProgression } from '../services/geminiService';
import { Sparkles, Music, ChevronDown } from 'lucide-react';

interface ComposerProps {
  rootIndex: number;
  setRootIndex: (i: number) => void;
  quality: 'major' | 'minor';
  setQuality: (q: 'major' | 'minor') => void;
  language: Language;
  notation: NoteNotation;
}

const Composer: React.FC<ComposerProps> = ({ 
  rootIndex, 
  setRootIndex, 
  quality, 
  setQuality, 
  language,
  notation
}) => {
  const t = TRANSLATIONS[language];
  
  const [style, setStyle] = useState<SongStyle>('pop');
  const [mood, setMood] = useState<SongMood>('happy');
  const [tempo, setTempo] = useState<SongTempo>('moderate');
  const [complexity, setComplexity] = useState<SongComplexity>('basic');
  
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const noteDef = NOTES[rootIndex];
  const rootName = notation === NoteNotation.AMERICAN ? noteDef.name : noteDef.latinName;

  const handleCompose = async () => {
    setIsLoading(true);
    setResult(null);
    
    const progression = await generateSongProgression(
      rootName, 
      quality, 
      style, 
      mood, 
      tempo, 
      complexity, 
      language
    );
    
    setResult(progression);
    setIsLoading(false);
  };

  // Robust text cleaning to remove Markdown artifacts
  const cleanResult = result ? result
    // Remove bold/italic markers (**)
    .replace(/\*\*/g, '')
    // Remove single asterisks often used for bullets, guarding against musical notation if any (unlikely for *)
    .replace(/\*/g, '')
    // Remove backticks (`)
    .replace(/`/g, '')
    // Remove Markdown headers (# Header) but preserve musical sharps (C#)
    // Matches a # at the start of a line/string followed by a space
    .replace(/(?:^|\n)#+\s/g, '\n')
    // Remove list dashes at start of line
    .replace(/(?:^|\n)-\s/g, '\n')
    // Trim extra whitespace
    .trim()
    : null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.composerTitle}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t.composerSubtitle}</p>
      </div>

      {/* Controls Container */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 space-y-6 transition-colors">
        
        {/* Key Selector (Simple Row) */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.keyOf}</span>
            <div className="flex gap-3">
                <div className="relative">
                  <select 
                    value={rootIndex}
                    onChange={(e) => setRootIndex(Number(e.target.value))}
                    className="appearance-none bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 py-2 pl-4 pr-8 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                  >
                    {NOTES.map(note => (
                      <option key={note.index} value={note.index}>
                        {notation === NoteNotation.AMERICAN ? note.name : note.latinName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                
                <div className="relative">
                  <select 
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as 'major' | 'minor')}
                    className="appearance-none bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 py-2 pl-4 pr-8 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer capitalize"
                  >
                    <option value="major">{t.major}</option>
                    <option value="minor">{t.minor}</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>
        </div>

        {/* Style */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{t.lblStyle}</h3>
          <div className="flex flex-wrap gap-2">
            {COMPOSER_OPTIONS.styles.map(s => (
              <button
                key={s}
                onClick={() => setStyle(s as SongStyle)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${style === s ? 'bg-indigo-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700'}`}
              >
                {s.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{t.lblMood}</h3>
          <div className="flex flex-wrap gap-2">
            {COMPOSER_OPTIONS.moods.map(m => (
              <button
                key={m}
                onClick={() => setMood(m as SongMood)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${mood === m ? 'bg-rose-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-700'}`}
              >
                {t[`mood_${m}`] || m}
              </button>
            ))}
          </div>
        </div>

        {/* Tempo & Complexity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{t.lblTempo}</h3>
            <div className="flex flex-wrap gap-2">
              {COMPOSER_OPTIONS.tempos.map(tmp => (
                <button
                  key={tmp}
                  onClick={() => setTempo(tmp as SongTempo)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${tempo === tmp ? 'bg-teal-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-700'}`}
                >
                  {t[`tempo_${tmp}`] || tmp}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{t.lblComplexity}</h3>
            <div className="flex flex-wrap gap-2">
              {COMPOSER_OPTIONS.complexities.map(c => (
                <button
                  key={c}
                  onClick={() => setComplexity(c as SongComplexity)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${complexity === c ? 'bg-amber-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700'}`}
                >
                  {t[`complexity_${c}`] || c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            onClick={handleCompose}
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="animate-pulse">{t.loading}</span>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {t.btnCompose}
              </>
            )}
          </button>
        </div>

      </div>

      {/* AI Result / Info Inteligente */}
      {cleanResult && (
        <section className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
          <div className="bg-gradient-to-r from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm relative overflow-hidden transition-colors">
             <div className="flex items-start gap-3 relative z-10">
                <Music className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> {t.composerResult}
                  </h3>
                  <div className="text-slate-700 dark:text-slate-300 text-base leading-relaxed whitespace-pre-line font-medium">
                    {cleanResult}
                  </div>
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

export default Composer;