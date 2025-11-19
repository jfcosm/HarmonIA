import React, { useState, useEffect, useMemo } from 'react';
import Piano from './components/Piano';
import Guitar from './components/Guitar';
import Controls from './components/Controls';
import AboutModal from './components/AboutModal';
import { NOTES, EXTENSIONS, TRANSLATIONS } from './constants';
import { NoteNotation, ChordExtensionType, Language, Instrument } from './types';
import { getChordMidiNumbers, playChordSound } from './utils/musicLogic';
import { getGuitarVoicing } from './utils/guitarLogic';
import { fetchChordInsight } from './services/geminiService';
import { Music, Volume2, Sparkles, Globe, HelpCircle } from 'lucide-react';

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
  const [instrument, setInstrument] = useState<Instrument>('piano');
  const [rootIndex, setRootIndex] = useState<number>(0); // C
  const [quality, setQuality] = useState<'major' | 'minor'>('major');
  const [extension, setExtension] = useState<ChordExtensionType>('none');
  const [notation, setNotation] = useState<NoteNotation>(NoteNotation.AMERICAN);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  
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

  // Handlers
  const handlePlay = () => {
    // For now, we play the synthesized piano sound even if guitar is selected
    // because synthesizing a guitar pluck is much more complex.
    // The theory notes are the same.
    playChordSound(activeMidiNotes);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'es' : 'en');
  };

  // Effect: Fetch AI Insight when chord changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (process.env.API_KEY) {
        setIsLoadingInsight(true);
        const text = await fetchChordInsight(fullChordNameForAI, language);
        setInsight(text);
        setIsLoadingInsight(false);
      }
    }, 1000); 

    return () => clearTimeout(timer);
  }, [fullChordNameForAI, language]);


  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} language={language} />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 md:px-8 mb-8 sticky top-0 z-50 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200">
               <Music className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-none">{t.appTitle}</h1>
              <p className="text-xs md:text-sm text-slate-400 font-medium hidden sm:block">{t.appSubtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsAboutOpen(true)}
               className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
               title={language === 'en' ? 'About' : 'Acerca de'}
             >
               <HelpCircle className="w-5 h-5" />
             </button>
             <button 
               onClick={toggleLanguage}
               className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-sm font-semibold"
             >
               <Globe className="w-4 h-4" />
               {language === 'en' ? 'EN' : 'ES'}
             </button>
          </div>
        </div>
      </header>

      <main className="px-2 md:px-4 space-y-10 max-w-6xl mx-auto">
        
        {/* Chord Display & Play Area */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-4 p-4 md:p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-5xl md:text-7xl font-bold text-indigo-900 tracking-tighter min-w-[120px]">
              {chordName}
            </h2>
            <button 
              onClick={handlePlay}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 p-3 md:p-4 rounded-full transition-all active:scale-95"
              aria-label={t.play}
              title={t.play}
            >
              <Volume2 className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          </div>
        </section>

        {/* Instrument Visualizer */}
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

        {/* Controls */}
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
        {process.env.API_KEY && (
          <section className="max-w-4xl mx-auto px-2">
            <div className="bg-gradient-to-r from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
              <div className="flex items-start gap-3 relative z-10">
                <Sparkles className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-indigo-900 mb-2 text-sm uppercase tracking-wide">{t.aiInsight}</h3>
                  {isLoadingInsight ? (
                    <div className="animate-pulse flex space-x-4">
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-2 bg-indigo-200 rounded w-3/4"></div>
                        <div className="h-2 bg-indigo-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600 text-base leading-relaxed">
                      {insight}
                    </p>
                  )}
                </div>
              </div>
              {/* Decorative BG Circle */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-100 rounded-full opacity-50 blur-2xl"></div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
