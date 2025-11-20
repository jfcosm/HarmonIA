import React from 'react';
import { X, Heart } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] transition-colors">
        
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white">{t.aboutTitle}</h2>
          <button 
            onClick={onClose}
            className="text-indigo-100 hover:text-white hover:bg-indigo-500/50 rounded-full p-1 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed overflow-y-auto">
          <p className="font-medium text-slate-800 dark:text-slate-100">
            {t.aboutText1}
          </p>
          <p>
            {t.aboutText2}
          </p>
        </div>

        {/* Footer with Dedication */}
        <div className="p-6 pt-2 shrink-0 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-900 border border-indigo-50 dark:border-slate-800 rounded-xl p-4 shadow-sm text-center">
             <Heart className="w-5 h-5 text-rose-400 mx-auto mb-2 fill-rose-400" />
             <p className="text-sm text-slate-500 dark:text-slate-400 italic font-serif">
               "{t.dedication}"
             </p>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors w-full sm:w-auto"
            >
              {t.close}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutModal;