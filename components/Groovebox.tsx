// Armonix v4.6.0 Update
import React, { useState, useEffect, useRef } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Waveform } from '../types';
import { GrooveboxEngine, InstrumentType, BassStep, SynxStep } from '../utils/grooveEngine';
import { Trash2, Play, Square, Dices, Activity, Zap, Save, Download, Upload, Copy, Check } from 'lucide-react';

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

const DEFAULT_SYNX_STEP: SynxStep = { active: false, note: 'C', octave: 0 };
const DEFAULT_SYNX: SynxStep[] = Array(16).fill(null).map(() => ({ ...DEFAULT_SYNX_STEP }));

// --- TYPES FOR SESSION SAVING ---
interface GrooveSnapshot {
  tempo: number;
  drumPattern: Record<InstrumentType, boolean[]>;
  bassPattern: BassStep[];
  bassCutoff: number;
  bassResonance: number;
  synxPattern: SynxStep[];
  synxParams: {
    waveform: Waveform;
    cutoff: number;
    res: number;
    attack: number;
    decay: number;
    sustain: number;
    release: number;
    arp: boolean;
  };
}

// --- SLIDER COMPONENT ---
interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  colorClass?: string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({ label, value, min, max, step = 1, onChange, colorClass = "accent-indigo-600" }) => {
  return (
    <div className="flex flex-col gap-1 w-full min-w-[80px]">
      <div className="flex justify-between items-end mb-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer ${colorClass} hover:opacity-90`}
      />
    </div>
  );
};

// --- MAIN COMPONENT ---

const Groovebox: React.FC<GrooveboxProps> = ({ language }) => {
  const t = TRANSLATIONS[language];
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [tempo, setTempo] = useState(128);
  
  // Bass Params
  const [bassCutoff, setBassCutoff] = useState(500);
  const [bassResonance, setBassResonance] = useState(5);

  // Synx Params
  const [synxWaveform, setSynxWaveform] = useState<Waveform>('triangle');
  const [synxCutoff, setSynxCutoff] = useState(2000);
  const [synxRes, setSynxRes] = useState(2);
  const [synxAttack, setSynxAttack] = useState(0.05);
  const [synxDecay, setSynxDecay] = useState(0.1);
  const [synxSustain, setSynxSustain] = useState(0.5);
  const [synxRelease, setSynxRelease] = useState(0.2);
  const [synxArp, setSynxArp] = useState(false);

  // Drum State
  const [drumPattern, setDrumPattern] = useState<Record<InstrumentType, boolean[]>>(DEFAULT_DRUMS);
  const [selectedDrum, setSelectedDrum] = useState<InstrumentType>('kick');

  // Bass State
  const [bassPattern, setBassPattern] = useState<BassStep[]>(DEFAULT_BASS);
  const [selectedBassSteps, setSelectedBassSteps] = useState<number[]>([]); 

  // Synx State
  const [synxPattern, setSynxPattern] = useState<SynxStep[]>(DEFAULT_SYNX);
  const [selectedSynxSteps, setSelectedSynxSteps] = useState<number[]>([]);

  // Active Instrument Context for Keyboard (Bass vs Synx)
  const [activeKeyboardTarget, setActiveKeyboardTarget] = useState<'bass' | 'synx'>('bass');

  // GLOBAL STEPS & SESSION STATE
  const [globalSteps, setGlobalSteps] = useState<(GrooveSnapshot | null)[]>(Array(6).fill(null));
  const [isSaveMode, setIsSaveMode] = useState(false);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [importCode, setImportCode] = useState("");
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const engineRef = useRef<GrooveboxEngine | null>(null);
  const drumPatternRef = useRef(drumPattern);
  const bassPatternRef = useRef(bassPattern);
  const synxPatternRef = useRef(synxPattern);

  // Sync refs
  useEffect(() => { drumPatternRef.current = drumPattern; }, [drumPattern]);
  useEffect(() => { bassPatternRef.current = bassPattern; }, [bassPattern]);
  useEffect(() => { synxPatternRef.current = synxPattern; }, [synxPattern]);

  // Initialize Engine
  useEffect(() => {
    engineRef.current = new GrooveboxEngine(
      (step) => setCurrentStep(step),
      () => drumPatternRef.current,
      () => bassPatternRef.current,
      () => synxPatternRef.current
    );
    return () => { if (engineRef.current) engineRef.current.stop(); };
  }, []);

  // Update Realtime Params
  useEffect(() => {
    if (engineRef.current) {
        engineRef.current.setTempo(tempo);
        engineRef.current.setFilterParams(bassCutoff, bassResonance);
        engineRef.current.setSynxParams(
            synxWaveform, synxCutoff, synxRes, 
            synxAttack, synxDecay, synxSustain, synxRelease, 
            synxArp
        );
    }
  }, [tempo, bassCutoff, bassResonance, synxWaveform, synxCutoff, synxRes, synxAttack, synxDecay, synxSustain, synxRelease, synxArp]);

  // Keyboard Event Listener for Global Steps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent typing in input fields triggering this
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        const key = e.key;
        if (['1', '2', '3', '4', '5', '6'].includes(key)) {
            const index = parseInt(key) - 1;
            handleStepButton(index);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSaveMode, globalSteps, drumPattern, bassPattern, synxPattern, tempo, bassCutoff, bassResonance, synxWaveform, synxCutoff, synxRes, synxAttack, synxDecay, synxSustain, synxRelease, synxArp]);


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
    setActiveKeyboardTarget('bass');
    const newPattern = [...bassPattern];
    newPattern[step] = { ...newPattern[step], active: !newPattern[step].active };
    setBassPattern(newPattern);
    if (newPattern[step].active) setSelectedBassSteps([step]);
  };

  const toggleSynxStep = (step: number) => {
    setActiveKeyboardTarget('synx');
    const newPattern = [...synxPattern];
    newPattern[step] = { ...newPattern[step], active: !newPattern[step].active };
    setSynxPattern(newPattern);
    if (newPattern[step].active) setSelectedSynxSteps([step]);
  };

  const assignNote = (note: string) => {
    const actualNote = note === 'C2' ? 'C' : note;
    const octaveOffset = note === 'C2' ? 1 : 0;

    if (activeKeyboardTarget === 'bass') {
        if (selectedBassSteps.length === 0) return;
        const newPattern = [...bassPattern];
        selectedBassSteps.forEach(stepIndex => {
            newPattern[stepIndex] = { ...newPattern[stepIndex], note: actualNote, octave: octaveOffset, active: true };
        });
        setBassPattern(newPattern);
    } else {
        if (selectedSynxSteps.length === 0) return;
        const newPattern = [...synxPattern];
        selectedSynxSteps.forEach(stepIndex => {
            newPattern[stepIndex] = { ...newPattern[stepIndex], note: actualNote, octave: octaveOffset, active: true };
        });
        setSynxPattern(newPattern);
    }
  };

  const clearAll = () => {
    setDrumPattern({ kick: Array(16).fill(false), snare: Array(16).fill(false), hihat: Array(16).fill(false), clap: Array(16).fill(false) });
    setBassPattern(Array(16).fill(null).map(() => ({ ...DEFAULT_BASS_STEP })));
    setSynxPattern(Array(16).fill(null).map(() => ({ ...DEFAULT_SYNX_STEP })));
  };

  const randomizePattern = () => {
    // Randomize Drums
    const newDrums = { ...drumPattern };
    const randomSteps = (prob: number) => Array(16).fill(false).map(() => Math.random() < prob);
    newDrums.kick = randomSteps(0.3);
    [0, 4, 8, 12].forEach(i => { if (Math.random() > 0.2) newDrums.kick[i] = true; });
    newDrums.snare = randomSteps(0.2);
    [4, 12].forEach(i => { if (Math.random() > 0.2) newDrums.snare[i] = true; });
    newDrums.hihat = randomSteps(0.6);
    newDrums.clap = randomSteps(0.1);
    setDrumPattern(newDrums);

    // Randomize Bass
    const scale = ['C', 'Eb', 'F', 'G', 'Bb', 'C2']; 
    const newBass = Array(16).fill(null).map(() => ({
        active: Math.random() < 0.4,
        note: scale[Math.floor(Math.random() * scale.length)].replace('2', ''),
        octave: Math.random() > 0.8 ? 1 : 0
    }));
    setBassPattern(newBass);

    // Randomize Synx
    const newSynx = Array(16).fill(null).map(() => ({
        active: Math.random() < 0.3,
        note: scale[Math.floor(Math.random() * scale.length)].replace('2', ''),
        octave: Math.random() > 0.6 ? 1 : 0
    }));
    setSynxPattern(newSynx);
  };

  // --- SESSION & GLOBAL STEP LOGIC ---

  const handleStepButton = (index: number) => {
    if (isSaveMode) {
        // Save current state to slot
        const snapshot: GrooveSnapshot = {
            tempo,
            drumPattern: JSON.parse(JSON.stringify(drumPattern)),
            bassPattern: JSON.parse(JSON.stringify(bassPattern)),
            bassCutoff,
            bassResonance,
            synxPattern: JSON.parse(JSON.stringify(synxPattern)),
            synxParams: {
                waveform: synxWaveform,
                cutoff: synxCutoff,
                res: synxRes,
                attack: synxAttack,
                decay: synxDecay,
                sustain: synxSustain,
                release: synxRelease,
                arp: synxArp
            }
        };
        const newSteps = [...globalSteps];
        newSteps[index] = snapshot;
        setGlobalSteps(newSteps);
        
        // Blink feedback or something?
        setIsSaveMode(false); // Auto exit save mode? Or keep it? Let's auto exit.
    } else {
        // Load state from slot
        const snapshot = globalSteps[index];
        if (snapshot) {
            setTempo(snapshot.tempo);
            setDrumPattern(snapshot.drumPattern);
            setBassPattern(snapshot.bassPattern);
            setBassCutoff(snapshot.bassCutoff);
            setBassResonance(snapshot.bassResonance);
            setSynxPattern(snapshot.synxPattern);
            setSynxWaveform(snapshot.synxParams.waveform);
            setSynxCutoff(snapshot.synxParams.cutoff);
            setSynxRes(snapshot.synxParams.res);
            setSynxAttack(snapshot.synxParams.attack);
            setSynxDecay(snapshot.synxParams.decay);
            setSynxSustain(snapshot.synxParams.sustain);
            setSynxRelease(snapshot.synxParams.release);
            setSynxArp(snapshot.synxParams.arp);
        }
    }
  };

  const generateSessionCode = () => {
    // Current state + global steps
    const sessionData = {
        current: {
            tempo,
            drumPattern,
            bassPattern,
            bassCutoff,
            bassResonance,
            synxPattern,
            synxParams: {
                waveform: synxWaveform,
                cutoff: synxCutoff,
                res: synxRes,
                attack: synxAttack,
                decay: synxDecay,
                sustain: synxSustain,
                release: synxRelease,
                arp: synxArp
            }
        },
        steps: globalSteps
    };
    try {
        const json = JSON.stringify(sessionData);
        // Base64 encode for simple "password" string
        const code = btoa(json);
        setSessionCode(code);
        setShowSessionModal(true);
    } catch (e) {
        console.error("Error generating code", e);
    }
  };

  const importSessionCode = () => {
    try {
        const json = atob(importCode);
        const data = JSON.parse(json);
        
        // Restore Current
        if (data.current) {
            const s = data.current;
            setTempo(s.tempo || 120);
            if (s.drumPattern) setDrumPattern(s.drumPattern);
            if (s.bassPattern) setBassPattern(s.bassPattern);
            if (s.bassCutoff) setBassCutoff(s.bassCutoff);
            if (s.bassResonance) setBassResonance(s.bassResonance);
            if (s.synxPattern) setSynxPattern(s.synxPattern);
            if (s.synxParams) {
                setSynxWaveform(s.synxParams.waveform);
                setSynxCutoff(s.synxParams.cutoff);
                setSynxRes(s.synxParams.res);
                setSynxAttack(s.synxParams.attack);
                setSynxDecay(s.synxParams.decay);
                setSynxSustain(s.synxParams.sustain);
                setSynxRelease(s.synxParams.release);
                setSynxArp(s.synxParams.arp);
            }
        }
        // Restore Steps
        if (data.steps && Array.isArray(data.steps)) {
            setGlobalSteps(data.steps);
        }
        
        setShowSessionModal(false);
        setImportCode("");
    } catch (e) {
        alert(t.invalidCode || "Invalid Code");
    }
  };

  const copyToClipboard = () => {
    if (sessionCode) {
        navigator.clipboard.writeText(sessionCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full flex justify-center py-4 md:py-8">
      
      {/* CHASSIS */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full relative transition-colors">
        
        {/* --- GLOBAL SEQUENCER & HEADER --- */}
        <div className="flex flex-col gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
            
            {/* Top Bar: Title & Session Controls */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                        {t.grooveTitle}
                        <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    </h2>
                    <span className="text-xs font-bold text-indigo-400 dark:text-indigo-300 tracking-widest uppercase">Rhythm Composer v4.3</span>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={generateSessionCode}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase transition-colors"
                    >
                        <Download size={14} /> {t.export}
                    </button>
                    <button 
                        onClick={() => { setSessionCode(null); setShowSessionModal(true); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase transition-colors"
                    >
                        <Upload size={14} /> {t.import}
                    </button>
                </div>
            </div>

            {/* Steps & Transport */}
            <div className="flex flex-wrap items-center justify-between gap-6 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                
                {/* Global Steps */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.globalSteps}</span>
                        <button 
                            onClick={() => setIsSaveMode(!isSaveMode)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${isSaveMode ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
                        >
                            <Save size={10} /> {isSaveMode ? t.stepSaveMode : t.savePattern}
                        </button>
                    </div>
                    <div className="flex gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <button
                                key={i}
                                onClick={() => handleStepButton(i)}
                                className={`
                                    w-10 h-10 rounded-lg font-bold text-sm shadow-sm transition-all active:scale-95 border-b-2
                                    ${globalSteps[i] 
                                        ? 'bg-indigo-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-slate-600' 
                                        : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-700'}
                                    ${isSaveMode ? 'hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:border-rose-300 hover:text-rose-600' : 'hover:bg-indigo-50 dark:hover:bg-slate-700'}
                                `}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tempo & Transport */}
                <div className="flex items-center gap-4 ml-auto">
                    <RangeSlider label={t.bpm} value={tempo} min={60} max={200} onChange={setTempo} />
                    <div className="bg-slate-800 dark:bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 shadow-inner">
                        <span className="font-mono text-indigo-400 text-lg font-bold">{tempo}</span>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-300 dark:bg-slate-700 mx-2"></div>
                    <div className="flex gap-2">
                        <button onClick={togglePlay} className={`h-10 px-6 rounded-xl font-bold text-sm uppercase transition-all shadow-sm active:scale-95 flex items-center gap-2 ${isPlaying ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}>
                            {isPlaying ? <Square size={16} /> : <Play size={16} />}
                        </button>
                        <button onClick={randomizePattern} className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 transition-colors"><Dices size={18} /></button>
                        <button onClick={clearAll} className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                </div>
            </div>
        </div>

        {/* --- MODULES GRID --- */}
        <div className="space-y-6">

            {/* DRUMS */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between mb-4">
                    <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div> Drums
                    </h3>
                    <div className="flex gap-1">
                        {DRUM_INSTRUMENTS.map(inst => (
                            <button key={inst} onClick={() => setSelectedDrum(inst)} className={`h-6 px-2 rounded text-[9px] font-bold uppercase transition-colors ${selectedDrum === inst ? 'bg-rose-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-500'}`}>{t[inst] || inst}</button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-8 md:grid-cols-16 gap-1">
                    {drumPattern[selectedDrum].map((isActive, i) => (
                        <button key={i} onClick={() => toggleDrumStep(i)} className={`h-8 rounded-md transition-all border-b-2 active:border-b-0 active:translate-y-[1px] ${isActive ? 'bg-rose-500 border-rose-700 shadow-md' : (i % 4 === 0 ? 'bg-slate-200 dark:bg-slate-600 border-slate-300' : 'bg-white dark:bg-slate-700 border-slate-200')}`}></button>
                    ))}
                </div>
            </div>

            {/* BASS */}
            <div className={`p-4 rounded-2xl border transition-all ${activeKeyboardTarget === 'bass' ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={12} /> Bass (Acid)
                    </h3>
                    <div className="flex gap-3">
                        <RangeSlider label={t.cutoff} value={bassCutoff} min={100} max={5000} onChange={setBassCutoff} colorClass="accent-blue-600" />
                        <RangeSlider label={t.resonance} value={bassResonance} min={0} max={20} onChange={setBassResonance} colorClass="accent-blue-600" />
                    </div>
                </div>
                <div className="grid grid-cols-8 md:grid-cols-16 gap-1">
                    {bassPattern.map((step, i) => (
                        <button
                            key={i}
                            onClick={() => toggleBassStep(i)}
                            className={`h-10 rounded-md border-b-2 flex items-center justify-center text-[10px] font-bold ${step.active ? 'bg-blue-600 border-blue-800 text-white' : (i % 4 === 0 ? 'bg-slate-200 dark:bg-slate-600 border-slate-300 dark:border-slate-500' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-transparent')} ${currentStep === i ? 'ring-2 ring-blue-400' : ''}`}
                        >
                            {step.note}
                        </button>
                    ))}
                </div>
            </div>

            {/* SYNX */}
            <div className={`p-4 rounded-2xl border transition-all ${activeKeyboardTarget === 'synx' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={12} /> {t.synxTitle}
                        </h3>
                        {/* Waveform Selector */}
                        <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                            {(['sine', 'triangle', 'sawtooth', 'square'] as Waveform[]).map(wf => (
                                <button
                                    key={wf}
                                    onClick={() => setSynxWaveform(wf)}
                                    className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${synxWaveform === wf ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-emerald-500'}`}
                                    title={wf}
                                >
                                    {/* Simple Icons for Waves */}
                                    {wf === 'sine' && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M0 6 Q3 0 6 6 T12 6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>}
                                    {wf === 'triangle' && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M0 12 L6 0 L12 12" fill="none" stroke="currentColor" strokeWidth="2"/></svg>}
                                    {wf === 'sawtooth' && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M0 12 L12 0 V12" fill="none" stroke="currentColor" strokeWidth="2"/></svg>}
                                    {wf === 'square' && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M0 12 V0 H6 V12 H12" fill="none" stroke="currentColor" strokeWidth="2"/></svg>}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Controls Stack */}
                    <div className="flex flex-col md:flex-row flex-wrap gap-x-4 gap-y-4 w-full md:w-auto">
                        <div className="flex gap-2 w-full md:w-auto">
                            <RangeSlider label="A" value={synxAttack} min={0.01} max={1} step={0.01} onChange={setSynxAttack} colorClass="accent-emerald-500" />
                            <RangeSlider label="D" value={synxDecay} min={0.01} max={1} step={0.01} onChange={setSynxDecay} colorClass="accent-emerald-500" />
                            <RangeSlider label="S" value={synxSustain} min={0} max={1} step={0.01} onChange={setSynxSustain} colorClass="accent-emerald-500" />
                            <RangeSlider label="R" value={synxRelease} min={0.01} max={2} step={0.01} onChange={setSynxRelease} colorClass="accent-emerald-500" />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <RangeSlider label={t.cutoff} value={synxCutoff} min={100} max={5000} onChange={setSynxCutoff} colorClass="accent-emerald-500" />
                            <RangeSlider label={t.resonance} value={synxRes} min={0} max={20} onChange={setSynxRes} colorClass="accent-emerald-500" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">{t.arpeggiator}</span>
                            <button 
                                onClick={() => setSynxArp(!synxArp)}
                                className={`w-10 h-5 rounded-full transition-colors relative ${synxArp ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${synxArp ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-8 md:grid-cols-16 gap-1">
                    {synxPattern.map((step, i) => (
                        <button
                            key={i}
                            onClick={() => toggleSynxStep(i)}
                            className={`h-10 rounded-md border-b-2 flex items-center justify-center text-[10px] font-bold ${step.active ? 'bg-emerald-500 border-emerald-700 text-white' : (i % 4 === 0 ? 'bg-slate-200 dark:bg-slate-600 border-slate-300 dark:border-slate-500' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-transparent')} ${currentStep === i ? 'ring-2 ring-emerald-400' : ''}`}
                        >
                            {step.note}
                        </button>
                    ))}
                </div>
            </div>

            {/* SHARED KEYBOARD */}
            <div className="flex flex-col items-center gap-2 pt-4">
                <div className="inline-flex bg-slate-200 dark:bg-slate-700 p-1.5 pb-3 rounded-xl shadow-inner border border-slate-300 dark:border-slate-600 relative">
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        {t.targetPitch}: {activeKeyboardTarget === 'bass' ? 'Bass' : 'Synx'}
                    </span>
                    <div className="flex relative mt-1">
                        {KEYS.map((note, i) => {
                            const isBlack = note.includes('#');
                            if (isBlack) return null;
                            return (
                                <div key={note} className="relative group">
                                    <button onClick={() => assignNote(note)} className={`w-8 md:w-10 h-24 md:h-28 bg-white border border-slate-300 rounded-b-[4px] hover:${activeKeyboardTarget === 'bass' ? 'bg-blue-50' : 'bg-emerald-50'} active:bg-slate-200 transition-colors shadow-sm`}></button>
                                    {KEYS[KEYS.indexOf(note) + 1]?.includes('#') && (
                                        <button onClick={() => assignNote(KEYS[KEYS.indexOf(note) + 1])} className="absolute -right-3 md:-right-3.5 top-0 w-6 md:w-7 h-14 md:h-16 bg-slate-800 border-x border-b border-slate-900 z-10 rounded-b-[3px] hover:bg-slate-700 active:bg-black shadow-md"></button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{t.grooveInstruction}</p>
            </div>

        </div>

        {/* --- SESSION MODAL --- */}
        {showSessionModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 rounded-[2rem] backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                        {sessionCode ? t.export : t.import} Session
                    </h3>
                    
                    {sessionCode ? (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500">{t.saveCodeInfo}</p>
                            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg font-mono text-xs break-all border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                                {sessionCode}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={copyToClipboard} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2">
                                    {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? t.copied : t.copy}
                                </button>
                                <button onClick={() => setShowSessionModal(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300">
                                    {t.close}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <textarea 
                                value={importCode}
                                onChange={(e) => setImportCode(e.target.value)}
                                placeholder={t.pasteCodeInfo}
                                className="w-full h-32 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            />
                            <div className="flex gap-2">
                                <button onClick={importSessionCode} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-indigo-700">
                                    {t.loadPattern}
                                </button>
                                <button onClick={() => setShowSessionModal(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300">
                                    {t.close}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Groovebox;