import React, { useState, useEffect, useRef } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { GrooveboxEngine, InstrumentType, BassStep } from '../utils/grooveEngine';
import { Trash2, Play, Square, Dices } from 'lucide-react';

interface GrooveboxProps {
  language: Language;
}

// --- CONSTANTS ---
const DRUM_INSTRUMENTS: InstrumentType[] = ['kick', 'snare', 'hihat', 'clap'];
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C2']; // C2 is high C

const DEFAULT_DRUMS: Record<InstrumentType, boolean[]> = {
  kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
  snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
  hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
  clap:  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
};

const DEFAULT_BASS_STEP: BassStep = { active: false, note: 'C', octave: 0 };
const DEFAULT_BASS: BassStep[] = Array(16).fill(null).map(() => ({ ...DEFAULT_BASS_STEP }));
// Preset bass pattern
DEFAULT_BASS[0] = { active: true, note: 'C', octave: 0 };
DEFAULT_BASS[2] = { active: true, note: 'C', octave: 0 };
DEFAULT_BASS[4] = { active: true, note: 'Eb', octave: 0 };
DEFAULT_BASS[6] = { active: true, note: 'C', octave: 0 };
DEFAULT_BASS[8] = { active: true, note: 'G', octave: 0 };
DEFAULT_BASS[10] = { active: true, note: 'F', octave: 0 };
DEFAULT_BASS[12] = { active: true, note: 'C', octave: 0 };
DEFAULT_BASS[14] = { active: true, note: 'Bb', octave: 0 };

// --- KNOB COMPONENT ---
interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}

const Knob: React.FC<KnobProps> = ({ label, value, min, max, onChange }) => {
  const rotation = ((value - min) / (max - min)) * 270 - 135; // -135 to 135 degrees

  const handleDrag = (e: React.MouseEvent) => {
    const startY = e.clientY;
    const startValue = value;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const range = max - min;
      // Sensitivity: full range over 200px
      let newValue = startValue + (deltaY / 200) * range;
      newValue = Math.max(min, Math.min(max, newValue));
      onChange(newValue);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="flex flex-col items-center gap-2 cursor-ns-resize group select-none" onMouseDown={handleDrag}>
      <div className="relative w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 shadow-[0_4px_6px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.8)] dark:shadow-none border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:border-indigo-400 transition-colors">
        {/* Indicator Line */}
        <div 
          className="w-1.5 h-6 bg-indigo-500 rounded-full absolute top-1.5 origin-bottom shadow-sm"
          style={{ transform: `rotate(${rotation}deg) translateY(-50%)`, transformOrigin: '50% 100%' }}
        ></div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors">{label}</span>
    </div>
  );
};

// --- MAIN COMPONENT ---

const Groovebox: React.FC<GrooveboxProps> = ({ language }) => {
  const t = TRANSLATIONS[language];
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [tempo, setTempo] = useState(128);
  
  // Audio Parameters
  const [cutoff, setCutoff] = useState(500);
  const [resonance, setResonance] = useState(5);

  // Drum State
  const [drumPattern, setDrumPattern] = useState<Record<InstrumentType, boolean[]>>(DEFAULT_DRUMS);
  const [selectedDrum, setSelectedDrum] = useState<InstrumentType>('kick');

  // Bass State
  const [bassPattern, setBassPattern] = useState<BassStep[]>(DEFAULT_BASS);
  const [selectedBassSteps, setSelectedBassSteps] = useState<number[]>([]); // Steps currently selected for editing

  const engineRef = useRef<GrooveboxEngine | null>(null);
  const drumPatternRef = useRef(drumPattern);
  const bassPatternRef = useRef(bassPattern);

  // Sync refs
  useEffect(() => { drumPatternRef.current = drumPattern; }, [drumPattern]);
  useEffect(() => { bassPatternRef.current = bassPattern; }, [bassPattern]);

  // Initialize Engine
  useEffect(() => {
    engineRef.current = new GrooveboxEngine(
      (step) => setCurrentStep(step),
      () => drumPatternRef.current,
      () => bassPatternRef.current
    );
    return () => { if (engineRef.current) engineRef.current.stop(); };
  }, []);

  // Update Realtime Params
  useEffect(() => {
    if (engineRef.current) {
        engineRef.current.setTempo(tempo);
        engineRef.current.setFilterParams(cutoff, resonance);
    }
  }, [tempo, cutoff, resonance]);

  // Handlers
  const togglePlay = () => {
    if (!engineRef.current) return;
    if (isPlaying) {
      engineRef.current.stop();
      setIsPlaying(false);
      setCurrentStep(-1);
    } else {
      engineRef.current.start();
      setIsPlaying(true);
    }
  };

  const toggleDrumStep = (step: number) => {
    const newPattern = { ...drumPattern };
    newPattern[selectedDrum] = [...newPattern[selectedDrum]];
    newPattern[selectedDrum][step] = !newPattern[selectedDrum][step];
    setDrumPattern(newPattern);
  };

  const toggleBassStep = (step: number) => {
    // Toggle Active state
    const newPattern = [...bassPattern];
    newPattern[step] = { ...newPattern[step], active: !newPattern[step].active };
    setBassPattern(newPattern);
    
    // If turning on, select it
    if (newPattern[step].active) {
        setSelectedBassSteps([step]);
    }
  };

  const assignBassNote = (note: string) => {
    // Clean note name (handle C2 as high C)
    const actualNote = note === 'C2' ? 'C' : note;
    const octaveOffset = note === 'C2' ? 1 : 0;

    if (selectedBassSteps.length === 0) return;

    const newPattern = [...bassPattern];
    selectedBassSteps.forEach(stepIndex => {
        newPattern[stepIndex] = { 
            ...newPattern[stepIndex], 
            note: actualNote,
            octave: octaveOffset,
            active: true // Auto activate if note pressed
        };
    });
    setBassPattern(newPattern);
  };

  const selectBassStepForEdit = (step: number) => {
    // If holding shift/ctrl could be multi select, but let's keep simple
    setSelectedBassSteps([step]);
  };

  const clearAll = () => {
    // Reset Logic
    setDrumPattern({
        kick: Array(16).fill(false),
        snare: Array(16).fill(false),
        hihat: Array(16).fill(false),
        clap: Array(16).fill(false),
    });
    setBassPattern(Array(16).fill(null).map(() => ({ ...DEFAULT_BASS_STEP })));
  };

  const randomizePattern = () => {
    // 1. Randomize Drums
    const newDrums = { ...drumPattern };
    
    // Helper for probability based randomization
    const randomSteps = (prob: number) => Array(16).fill(false).map(() => Math.random() < prob);
    
    newDrums.kick = randomSteps(0.3); // Sparse kicks
    // Force Kick on 1, 5, 9, 13 for 4/4 feel (optional, but better for starters)
    [0, 4, 8, 12].forEach(i => { if (Math.random() > 0.2) newDrums.kick[i] = true; });

    newDrums.snare = randomSteps(0.2);
    // Force Snare on 5, 13
    [4, 12].forEach(i => { if (Math.random() > 0.2) newDrums.snare[i] = true; });

    newDrums.hihat = randomSteps(0.6); // Busy hihats
    newDrums.clap = randomSteps(0.1); // Sparse claps

    setDrumPattern(newDrums);

    // 2. Randomize Bass
    // Use C Minor Pentatonic for musicality: C, Eb, F, G, Bb
    const scale = ['C', 'Eb', 'F', 'G', 'Bb', 'C2']; 
    const newBass = Array(16).fill(null).map(() => {
        const active = Math.random() < 0.4; // 40% chance of a note
        const note = scale[Math.floor(Math.random() * scale.length)];
        const octave = (note === 'C2') ? 1 : (Math.random() > 0.8 ? 1 : 0); // Occasional octave jump
        return {
            active,
            note: note === 'C2' ? 'C' : note,
            octave: note === 'C2' ? 1 : octave
        };
    });
    setBassPattern(newBass);
  };

  return (
    <div className="w-full flex justify-center py-4 md:py-8">
      
      {/* CHASSIS */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full relative transition-colors">
        
        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="flex flex-col">
                <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                    {t.grooveTitle}
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                </h2>
                <span className="text-xs font-bold text-indigo-400 dark:text-indigo-300 tracking-widest uppercase">Rhythm Composer</span>
            </div>
            
            {/* LCD Display */}
            <div className="bg-slate-800 dark:bg-slate-950 border border-slate-700 rounded-lg px-6 py-3 shadow-inner flex items-center gap-3">
                <span className="font-mono text-indigo-400 text-2xl tracking-widest font-bold">
                    {tempo} <span className="text-xs text-slate-500">BPM</span>
                </span>
            </div>
        </div>

        {/* --- GLOBAL CONTROLS --- */}
        <div className="flex flex-wrap gap-8 mb-8 items-end border-b border-slate-100 dark:border-slate-800 pb-8">
            <Knob label={t.bpm} value={tempo} min={60} max={200} onChange={setTempo} />
            
            <div className="flex gap-3 ml-auto">
                <button 
                    onClick={togglePlay}
                    className={`h-12 px-8 rounded-xl font-bold text-sm uppercase tracking-wide transition-all shadow-sm active:scale-95 flex items-center gap-2 ${isPlaying ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'}`}
                >
                    {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    {isPlaying ? t.stop : t.play}
                </button>
                
                <button 
                    onClick={randomizePattern}
                    className="h-12 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-indigo-500 transition-all active:scale-95"
                    title={t.randomize}
                >
                    <Dices size={20} />
                </button>

                <button 
                    onClick={clearAll}
                    className="h-12 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-rose-500 transition-all active:scale-95"
                    title={t.clearPattern}
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>

        {/* --- DRUM SECTION --- */}
        <div className="mb-10 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Drums</h3>
                {/* Instrument Selectors */}
                <div className="flex gap-2">
                    {DRUM_INSTRUMENTS.map(inst => (
                        <button
                            key={inst}
                            onClick={() => setSelectedDrum(inst)}
                            className={`
                                h-8 px-3 rounded-lg font-bold text-[10px] uppercase shadow-sm transition-all
                                ${selectedDrum === inst 
                                    ? 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none transform scale-105' 
                                    : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'}
                            `}
                        >
                            {t[inst] || inst}
                        </button>
                    ))}
                </div>
            </div>

            {/* 16 Step Buttons */}
            <div className="grid grid-cols-8 md:grid-cols-16 gap-1 md:gap-1.5">
                {drumPattern[selectedDrum].map((isActive, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                        {/* Step Indicator */}
                        <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-75 ${currentStep === i ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                        
                        {/* Pad */}
                        <button
                            onClick={() => toggleDrumStep(i)}
                            className={`
                                w-full aspect-[0.8] rounded-md transition-all duration-100 border-b-2 active:border-b-0 active:translate-y-[2px]
                                ${isActive 
                                    ? 'bg-indigo-500 border-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none' 
                                    : (i % 4 === 0 ? 'bg-slate-200 dark:bg-slate-600 border-slate-300 dark:border-slate-800' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-800')}
                            `}
                        >
                        </button>
                        
                        {/* Number */}
                        <span className="text-[8px] font-mono text-slate-400 select-none">{i + 1}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* --- BASS SECTION --- */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Bass (Acid)</h3>
                
                {/* Synthesis Knobs */}
                <div className="flex gap-6">
                    <Knob label="Cutoff" value={cutoff} min={100} max={5000} onChange={setCutoff} />
                    <Knob label="Reson" value={resonance} min={0} max={20} onChange={setResonance} />
                </div>
            </div>

            {/* Bass Sequencer Steps */}
            <div className="grid grid-cols-8 md:grid-cols-16 gap-1 md:gap-1.5 mb-8">
                {bassPattern.map((step, i) => (
                    <button
                        key={i}
                        onClick={() => toggleBassStep(i)}
                        onContextMenu={(e) => { e.preventDefault(); selectBassStepForEdit(i); }}
                        className={`
                            relative h-14 rounded-lg border-b-2 active:border-b-0 active:translate-y-[2px] flex flex-col items-center justify-center gap-1 transition-all
                            ${currentStep === i ? 'ring-2 ring-rose-400 z-10' : ''}
                            ${selectedBassSteps.includes(i) 
                                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-900' 
                                : (step.active 
                                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' 
                                    : 'bg-white dark:bg-slate-700 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-800')}
                        `}
                    >
                        {/* Active Dot */}
                        {step.active && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                        <span className={`text-[10px] font-bold leading-none ${step.active ? '' : 'opacity-0'}`}>
                            {step.note}
                        </span>
                    </button>
                ))}
            </div>

            {/* Mini Keyboard */}
            <div className="flex justify-center">
                <div className="inline-flex bg-slate-200 dark:bg-slate-700 p-1.5 pb-3 rounded-xl shadow-inner border border-slate-300 dark:border-slate-600 relative">
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.groovePitch || 'Pitch'}</span>
                    <div className="flex relative mt-1">
                        {KEYS.map((note, i) => {
                            const isBlack = note.includes('#');
                            
                            // Skip rendering black keys in the main flow, handle them absolutely
                            if (isBlack) return null;

                            return (
                                <div key={note} className="relative group">
                                    {/* White Key */}
                                    <button
                                        onClick={() => assignBassNote(note)}
                                        className="w-8 md:w-10 h-24 md:h-28 bg-white border border-slate-300 rounded-b-[4px] hover:bg-indigo-50 active:bg-indigo-100 active:h-[6.8rem] transition-colors shadow-sm"
                                    >
                                    </button>
                                    
                                    {/* Check if next note is black and render it */}
                                    {KEYS[KEYS.indexOf(note) + 1]?.includes('#') && (
                                        <button
                                            onClick={() => assignBassNote(KEYS[KEYS.indexOf(note) + 1])}
                                            className="absolute -right-3 md:-right-3.5 top-0 w-6 md:w-7 h-14 md:h-16 bg-slate-800 border-x border-b border-slate-900 z-10 rounded-b-[3px] hover:bg-slate-700 active:h-[3.8rem] shadow-md"
                                        >
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-4 font-medium uppercase tracking-wide">{t.grooveInstruction}</p>
        </div>

      </div>
    </div>
  );
};

export default Groovebox;