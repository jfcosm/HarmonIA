// Armonix v4.2.0 Update
import React, { useState, useEffect, useRef } from 'react';
import { TunerEngine, TunerResult } from '../utils/tunerLogic';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { Mic, MicOff } from 'lucide-react';

interface TunerProps {
  language: Language;
}

const Tuner: React.FC<TunerProps> = ({ language }) => {
  const t = TRANSLATIONS[language];
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TunerResult | null>(null);
  
  const engineRef = useRef<TunerEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    engineRef.current = new TunerEngine();
    return () => {
      stopTuner();
    };
  }, []);

  const updateTuner = () => {
    if (engineRef.current) {
      const data = engineRef.current.getPitch();
      if (data) {
        setResult(data);
      }
      animationFrameRef.current = requestAnimationFrame(updateTuner);
    }
  };

  const startTuner = async () => {
    setError(null);
    try {
      if (engineRef.current) {
        await engineRef.current.start();
        setIsListening(true);
        updateTuner();
      }
    } catch (e) {
      setError(t.micError);
      setIsListening(false);
    }
  };

  const stopTuner = () => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsListening(false);
    setResult(null);
  };

  const toggleTuner = () => {
    if (isListening) {
      stopTuner();
    } else {
      startTuner();
    }
  };

  // Calculate needle rotation (-45deg to 45deg mapped from -50 to +50 cents)
  // Clamp cents between -50 and 50 for display
  const cents = result ? Math.max(-50, Math.min(50, result.cents)) : 0;
  const rotation = (cents / 50) * 45;
  
  const isTuned = result && Math.abs(result.cents) < 5;

  return (
    <div className="flex flex-col items-center w-full py-8">
      
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.tunerTitle}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t.tunerSubtitle}</p>
      </div>

      {/* Tuner Device Chassis */}
      <div className="bg-slate-100 dark:bg-slate-200 p-6 rounded-[2.5rem] shadow-2xl border-4 border-slate-200 dark:border-slate-300 w-full max-w-xs relative flex flex-col items-center">
        
        {/* Analog Gauge Window */}
        <div className="w-full h-40 bg-white rounded-t-[1.5rem] rounded-b-lg shadow-inner border border-slate-300 relative overflow-hidden mb-6">
           
           {/* Ticks SVG */}
           <svg className="absolute top-4 left-0 w-full h-full" viewBox="0 0 200 100">
              {/* Arcs */}
              <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="#e2e8f0" strokeWidth="2" />
              
              {/* Major Ticks (-50, 0, +50) */}
              <line x1="100" y1="20" x2="100" y2="35" stroke="#94a3b8" strokeWidth="3" />
              <text x="100" y="15" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="bold">0</text>

              <line x1="28" y1="60" x2="40" y2="65" stroke="#94a3b8" strokeWidth="2" transform="rotate(-45 100 100)" />
              <text x="25" y="55" textAnchor="middle" fontSize="8" fill="#94a3b8">-50</text>

              <line x1="172" y1="60" x2="160" y2="65" stroke="#94a3b8" strokeWidth="2" transform="rotate(45 100 100)" />
              <text x="175" y="55" textAnchor="middle" fontSize="8" fill="#94a3b8">+50</text>

              {/* Minor Ticks */}
              {[...Array(9)].map((_, i) => {
                 if (i === 4) return null; // Skip center
                 const angle = (i - 4) * 10; // -40 to +40
                 return (
                    <line 
                        key={i}
                        x1="100" y1="25" x2="100" y2="32" 
                        stroke="#cbd5e1" strokeWidth="1"
                        transform={`rotate(${angle} 100 90)`}
                    />
                 );
              })}
           </svg>

           {/* Needle */}
           <div 
             className="absolute bottom-[-10%] left-1/2 w-1.5 h-[80%] bg-indigo-600 rounded-full origin-bottom transition-transform duration-200 ease-out shadow-sm z-10"
             style={{ 
                transform: `translateX(-50%) rotate(${isListening ? rotation : -45}deg)`,
                opacity: isListening ? 1 : 0.5
             }}
           ></div>
           
           {/* Needle Base Cap */}
           <div className="absolute bottom-[-15px] left-1/2 w-12 h-12 bg-indigo-500 rounded-full -translate-x-1/2 shadow-md z-20"></div>
        </div>

        {/* Note Display (LCD Style) */}
        <div className="w-24 h-24 bg-slate-300 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] flex items-center justify-center mb-6 border border-slate-400">
            <div className="w-20 h-20 bg-[#9ca3af] rounded-lg flex items-center justify-center shadow-inner">
                <span className="font-mono text-5xl font-bold text-slate-800 tracking-tighter">
                    {isListening && result ? result.note : '--'}
                </span>
            </div>
        </div>

        {/* OK Light */}
        <div className={`
            w-full py-3 rounded-xl font-bold text-xl text-center transition-all duration-200 shadow-sm border border-slate-300
            ${isTuned 
                ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.6)] border-green-600 scale-105' 
                : 'bg-slate-300 text-slate-400'}
        `}>
            OK
        </div>

        {/* Controls */}
        <div className="mt-8 w-full">
            <button
                onClick={toggleTuner}
                className={`
                    w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                    ${isListening ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}
                `}
            >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                {isListening ? t.stopTuner : t.startTuner}
            </button>
            {error && <p className="text-rose-500 text-xs mt-3 text-center font-medium">{error}</p>}
        </div>

      </div>
    </div>
  );
};

export default Tuner;