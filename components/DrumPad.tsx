// Armonix v4.4.0 - DrumPad Component
import React, { useState, useEffect, useRef } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { DrumEngine, DrumKit, DrumPadId } from '../utils/drumEngine';
import { Volume2, Sliders, Music2 } from 'lucide-react';

interface DrumPadProps {
  language: Language;
}

// Configuration for the 10 pads
// Layout:
// Row 1: Crash, Ride, Tom1, Tom2, Tom3 (Keys: Q, W, E, R, T)
// Row 2: Kick, Snare, HiHat Closed, HiHat Open, Clap (Keys: A, S, D, F, G)

interface PadConfig {
  id: DrumPadId;
  label: string;
  key: string;
  color: string; // Tailwind color base
}

const PAD_LAYOUT: PadConfig[] = [
  // Row 1
  { id: 'crash', label: 'Crash', key: 'Q', color: 'yellow' },
  { id: 'ride', label: 'Ride', key: 'W', color: 'yellow' },
  { id: 'tom1', label: 'Tom Hi', key: 'E', color: 'blue' },
  { id: 'tom2', label: 'Tom Mid', key: 'R', color: 'blue' },
  { id: 'tom3', label: 'Tom Lo', key: 'T', color: 'blue' },
  // Row 2
  { id: 'kick', label: 'Kick', key: 'A', color: 'rose' },
  { id: 'snare', label: 'Snare', key: 'S', color: 'rose' },
  { id: 'hihat_closed', label: 'HH Cls', key: 'D', color: 'teal' },
  { id: 'hihat_open', label: 'HH Opn', key: 'F', color: 'teal' },
  { id: 'clap', label: 'Clap', key: 'G', color: 'purple' },
];

const DrumPad: React.FC<DrumPadProps> = ({ language }) => {
  const t = TRANSLATIONS[language];
  const engineRef = useRef<DrumEngine | null>(null);
  const [kit, setKit] = useState<DrumKit>('acoustic');
  const [reverb, setReverb] = useState(0.3);
  
  // Track active pads for visual feedback
  const [activePads, setActivePads] = useState<Record<string, boolean>>({});

  useEffect(() => {
    engineRef.current = new DrumEngine();
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setKit(kit);
      engineRef.current.setReverb(reverb);
    }
  }, [kit, reverb]);

  const triggerPad = (id: DrumPadId) => {
    if (engineRef.current) {
      engineRef.current.trigger(id);
    }
    
    // Visual trigger
    setActivePads(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setActivePads(prev => ({ ...prev, [id]: false }));
    }, 100);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Avoid triggering if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    
    const key = e.key.toUpperCase();
    const pad = PAD_LAYOUT.find(p => p.key === key);
    if (pad) {
      triggerPad(pad.id);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col items-center w-full py-6">
      
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.drumTitle}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t.drumSubtitle}</p>
      </div>

      {/* Control Panel (Octapad Top) */}
      <div className="w-full max-w-4xl bg-slate-800 dark:bg-slate-900 text-white p-4 rounded-t-2xl flex flex-wrap items-center justify-between gap-4 border-b-4 border-slate-900">
         
         {/* Kit Selector */}
         <div className="flex items-center gap-3">
            <div className="bg-slate-700 p-2 rounded-lg">
               <Music2 size={20} className="text-indigo-400" />
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kit Select</span>
               <div className="flex gap-2 mt-1">
                  <button 
                     onClick={() => setKit('acoustic')}
                     className={`px-3 py-1 rounded text-xs font-bold transition-colors ${kit === 'acoustic' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                  >
                     {t.kitAcoustic}
                  </button>
                  <button 
                     onClick={() => setKit('electronic')}
                     className={`px-3 py-1 rounded text-xs font-bold transition-colors ${kit === 'electronic' ? 'bg-pink-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                  >
                     {t.kitElectronic}
                  </button>
               </div>
            </div>
         </div>

         {/* Reverb Knob */}
         <div className="flex items-center gap-3">
             <div className="bg-slate-700 p-2 rounded-lg">
                 <Sliders size={20} className="text-emerald-400" />
             </div>
             <div className="flex flex-col w-32">
                 <div className="flex justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t.reverb}</span>
                    <span className="text-[10px] font-mono text-emerald-400">{Math.round(reverb * 100)}%</span>
                 </div>
                 <input 
                   type="range" 
                   min="0" max="1" step="0.05"
                   value={reverb}
                   onChange={(e) => setReverb(parseFloat(e.target.value))}
                   className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                 />
             </div>
         </div>

         {/* Volume Icon (Visual only) */}
         <div className="hidden sm:block opacity-50">
            <Volume2 size={24} />
         </div>
      </div>

      {/* Pads Container */}
      <div className="w-full max-w-4xl bg-slate-900 p-4 md:p-6 rounded-b-2xl shadow-2xl border border-slate-700">
         <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 md:gap-4">
            {PAD_LAYOUT.map((pad) => {
               const isActive = activePads[pad.id];
               
               // Dynamic classes based on color config
               let activeClass = '';
               let glowClass = '';
               
               if (pad.color === 'yellow') {
                   activeClass = 'bg-yellow-500 border-yellow-300';
                   glowClass = 'shadow-[0_0_30px_rgba(234,179,8,0.6)]';
               } else if (pad.color === 'blue') {
                   activeClass = 'bg-blue-500 border-blue-300';
                   glowClass = 'shadow-[0_0_30px_rgba(59,130,246,0.6)]';
               } else if (pad.color === 'rose') {
                   activeClass = 'bg-rose-500 border-rose-300';
                   glowClass = 'shadow-[0_0_30px_rgba(244,63,94,0.6)]';
               } else if (pad.color === 'teal') {
                   activeClass = 'bg-teal-500 border-teal-300';
                   glowClass = 'shadow-[0_0_30px_rgba(20,184,166,0.6)]';
               } else {
                   activeClass = 'bg-purple-500 border-purple-300';
                   glowClass = 'shadow-[0_0_30px_rgba(168,85,247,0.6)]';
               }

               return (
                  <button
                     key={pad.id}
                     onMouseDown={() => triggerPad(pad.id)}
                     className={`
                        relative h-24 md:h-32 rounded-xl transition-all duration-75 select-none
                        flex flex-col items-center justify-center
                        border-b-4 border-r-2 
                        ${isActive 
                           ? `${activeClass} translate-y-1 scale-[0.98] ${glowClass} text-white border-transparent` 
                           : 'bg-slate-800 border-slate-950 text-slate-400 hover:bg-slate-700'}
                     `}
                  >
                     {/* Inner Ring for "Rubber" look */}
                     <div className={`absolute inset-2 border-2 border-dashed border-slate-600/30 rounded-lg pointer-events-none ${isActive ? 'opacity-0' : 'opacity-100'}`}></div>
                     
                     {/* Key Label */}
                     <span className={`absolute top-2 left-3 text-[10px] font-bold opacity-50 border border-current px-1.5 rounded ${isActive ? 'text-white' : 'text-slate-500'}`}>
                        {pad.key}
                     </span>

                     {/* Main Label */}
                     <span className={`text-sm md:text-lg font-bold uppercase tracking-wider ${isActive ? 'scale-110' : ''}`}>
                        {pad.label}
                     </span>
                  </button>
               );
            })}
         </div>
      </div>
      
      {/* Footer Hint */}
      <div className="mt-4 text-xs text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full">
         Use your keyboard keys <b>Q W E R T</b> and <b>A S D F G</b>
      </div>

    </div>
  );
};

export default DrumPad;