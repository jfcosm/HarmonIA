import React from 'react';
import { X } from 'lucide-react';
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
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{t.aboutTitle}</h2>
          <button 
            onClick={onClose}
            className="text-indigo-100 hover:text-white hover:bg-indigo-500/50 rounded-full p-1 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-slate-600 leading-relaxed">
          <p className="font-medium text-slate-800">
            {t.aboutText1}
          </p>
          <p>
            {t.aboutText2}
          </p>
          
          <div className="pt-4 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
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
