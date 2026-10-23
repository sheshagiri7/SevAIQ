import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onOpenAbout?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAbout }) => {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-white border-t border-slate-200 mt-16 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded bg-civic-700 flex items-center justify-center text-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold text-slate-800">SevAIQ</span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500">{t.header.challengeBadge}</span>
            {onOpenAbout && (
              <>
                <span className="text-xs text-slate-300">•</span>
                <button
                  type="button"
                  onClick={onOpenAbout}
                  className="text-xs font-semibold text-civic-700 hover:text-civic-900 hover:underline cursor-pointer"
                >
                  {language === 'ta' ? 'அம்சங்கள் & வழிமுறைகள்' : 'About & Features'}
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-slate-500 text-center sm:text-right">
            {t.footer.disclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
};
