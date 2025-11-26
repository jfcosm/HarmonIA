import { useState, useEffect, useMemo } from 'react';
import Piano from './components/Piano';
import Guitar from './components/Guitar';
import Controls from './components/Controls';
import AboutModal from './components/AboutModal';
import Composer from './components/Composer';
import ChordDetector from './components/ChordDetector';
import Groovebox from './components/Groovebox';
import { NOTES, EXTENSIONS, TRANSLATIONS } from './constants';
import { NoteNotation, ChordExtensionType, Language, Instrument, AppMode } from './types';
import { getChordMidiNumbers, playChordSound } from './utils/musicLogic';
import { getGuitarVoicing } from './utils/guitarLogic';
import { fetchChordInsight } from './services/geminiService';
import { Music, Volume2, Sparkles, Globe, HelpCircle, PenTool, Eye, Sun, Moon, Search, Disc } from 'lucide-react';

// Helper to construct chord name with explicit spacing
const getChordName = (rootIndex: number, quality: string, extension: ChordExtensionType, notation: NoteNotation) => {
  const noteDef = NOTES[rootIndex];
  const rootName = notation === NoteNotation.AMERICAN ? noteDef.name : noteDef.latinName;
  
  let qualitySuffix = '';
  if (quality === 'minor') qualitySuffix = 'm';
  
  // Handle specific naming conventions
  if (extension === 'dim') qualitySuffix = ''; 
  if (extension === 'aug') qualitySuffix = ''; 
  
  const extName = EXTENSIONS[extension].name;
  
  const parts = [rootName];
  
  if (qualitySuffix) parts.push(qualitySuffix);
  if (extName) parts.push(extName);
  
  return parts.join(' ');
};

function App() {
  // State
  const [language, setLanguage] = useState<Language>('es');
  const [mode, setMode] = useState<AppMode>('visualizer');
  const [instrument, setInstrument] = useState<Instrument>('piano');
  const [rootIndex, setRootIndex] = useState<number>(0); // C
  const [quality, setQuality] = useState<'major' | 'minor'>('major');
  const [extension, setExtension] = useState<ChordExtensionType>('none');
  const [notation, setNotation] = useState<NoteNotation>(NoteNotation.AMERICAN);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // AI Insight State
  const [insight, setInsight] = useState<string>("");
  const [isLoadingInsight, setIsLoadingInsight] = useState<boolean>(false);

  const t = TRANSLATIONS[language];

  // Derived State
  const activeMidiNotes = useMemo(() => {
    return getChordMidiNumbers(rootIndex, quality, extension);
  }, [rootIndex, quality, extension]);

  const guitarVoicing = useMemo(() => {
    return getGuitarVoicing(rootIndex, quality, extension);
  }, [rootIndex, quality, extension]);

  const chordName = useMemo(() => 
    getChordName(rootIndex, quality, extension, notation), 
  [rootIndex, quality, extension, notation]);

  const fullChordNameForAI = useMemo(() => 
    getChordName(rootIndex, quality, extension, NoteNotation.AMERICAN), 
  [rootIndex, quality, extension]);

  // Effects
  useEffect(() => {
    console.log("Armonix 1.5.2 initialized");
    // Apply dark mode class to HTML element
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch AI Insight when chord changes (only in visualizer mode)
  useEffect(() => {
    if (mode !== 'visualizer') return;

    const timer = setTimeout(async () => {
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        setIsLoadingInsight(true);
        const text = await fetchChordInsight(fullChordNameForAI, language);
        setInsight(text);
        setIsLoadingInsight(false);
      }
    }, 1000); 

    return () => clearTimeout(timer);
  }, [fullChordNameForAI, language, mode]);


  // Handlers
  const handlePlay = () => {
    playChordSound(activeMidiNotes);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col transition-colors duration-300">
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} language={language} />
      
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-4 px-4 md:px-8 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none">
               <Music className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-none">{t.appTitle}</h1>
              <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 font-medium hidden sm:block">{t.appSubtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
             <button 
               onClick={() => setIsAboutOpen(true)}
               className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
               title="About"
             >
               <HelpCircle className="w-5 h-5" />
             </button>

             {/* Dark Mode Toggle */}
             <button 
               onClick={toggleDarkMode}
               className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-500 dark:hover:text-indigo-400 transition-colors"
             >
               {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
             </button>

             {/* Language Dropdown */}
             <div className="relative flex items-center">
               <Globe className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
               <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="appearance-none pl-9 pr-8 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold transition-colors cursor-pointer border-none focus:ring-2 focus:ring-indigo-500 outline-none"
               >
                 <option value="es">Español</option>
                 <option value="en">English</option>
                 <option value="it">Italiano</option>
                 <option value="fr">Français</option>
                 <option value="de">Deutsch</option>
                 <option value="zh">中文</option>
                 <option value="ja">日本語</option>
                 <option value="ko">한국어</option>
               </select>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-grow px-2 md:px-4 space-y-6 max-w-6xl mx-auto w-full pt-6">
        
        {/* Mode Selector Tabs */}
        <div className="flex justify-center mb-4">
           <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-xl flex gap-1 transition-colors overflow-x-auto">
              <button 
                onClick={() => setMode('visualizer')}
                className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${mode === 'visualizer' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                <Eye size={16} />
                <span className="hidden sm:inline">{t.modeVisualizer}</span>
              </button>
              <button 
                onClick={() => setMode('composer')}
                className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${mode === 'composer' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                <PenTool size={16} />
                <span className="hidden sm:inline">{t.modeComposer}</span>
              </button>
              <button 
                onClick={() => setMode('detector')}
                className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${mode === 'detector' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                <Search size={16} />
                <span className="hidden sm:inline">{t.modeDetector}</span>
              </button>
              <button 
                onClick={() => setMode('groovebox')}
                className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${mode === 'groovebox' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                <Disc size={16} />
                <span className="hidden sm:inline">{t.modeGroovebox}</span>
              </button>
           </div>
        </div>

        {mode === 'visualizer' && (
          <>
            {/* VISUALIZER MODE */}
            <section className="text-center space-y-4">
              <div className="inline-flex items-center gap-4 p-4 md:p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                <h2 className="text-5xl md:text-7xl font-bold text-indigo-900 dark:text-indigo-300 tracking-tighter min-w-[120px]">
                  {chordName}
                </h2>
                <button 
                  onClick={handlePlay}
                  className="bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 p-3 md:p-4 rounded-full transition-all active:scale-95"
                  aria-label={t.play}
                  title={t.play}
                >
                  <Volume2 className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              </div>
            </section>

            <section className="w-full flex justify-center min-h-[200px] md:min-h-[280px]">
               {instrument === 'piano' ? (
                 <Piano 
                   activeMidiNotes={activeMidiNotes} 
                   rootMidi={activeMidiNotes[0]} 
                   notation={notation}
                 />
               ) : (
                 <Guitar 
                   voicing={guitarVoicing}
                   language={language}
                 />
               )}
            </section>

            <section>
              <Controls 
                selectedRootIndex={rootIndex}
                onRootChange={setRootIndex}
                quality={quality}
                onQualityChange={setQuality}
                extension={extension}
                onExtensionChange={setExtension}
                notation={notation}
                onNotationChange={setNotation}
                language={language}
                instrument={instrument}
                onInstrumentChange={setInstrument}
              />
            </section>

            {/* AI Insight Section */}
            {typeof process !== 'undefined' && process.env && process.env.API_KEY && (
              <section className="max-w-4xl mx-auto px-2 pb-8">
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
          </>
        )}

        {mode === 'composer' && (
          /* COMPOSER MODE */
          <section className="pb-8">
             <Composer 
               rootIndex={rootIndex}
               setRootIndex={setRootIndex}
               quality={quality}
               setQuality={setQuality}
               language={language}
               notation={notation}
             />
          </section>
        )}

        {mode === 'detector' && (
          /* DETECTOR MODE */
          <section className="pb-8">
             <ChordDetector
               language={language}
               notation={notation}
               onNotationChange={setNotation}
             />
          </section>
        )}

        {mode === 'groovebox' && (
          /* GROOVEBOX MODE */
          <section className="pb-8 w-full">
             <Groovebox language={language} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-8 mt-auto bg-indigo-50/50 dark:bg-slate-900/50 border-t border-indigo-100 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base font-medium">
            {t.footerText}{' '}
            <a 
              href="https://www.melodialab.pro" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold hover:underline transition-colors"
            >
              MelodIA La♭
            </a>.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;