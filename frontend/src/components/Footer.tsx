import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onOpenAbout?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAbout }) => {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-white dark:bg-[#0F2133] border-t border-[#D7DEE5] dark:border-[#223B56] mt-16 py-8 transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded bg-[#17324D] flex items-center justify-center text-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold text-[#202B36] dark:text-slate-200">SevAIQ</span>
            <span className="text-xs text-[#596775] dark:text-slate-600">|</span>
            <span className="text-xs text-[#596775] dark:text-slate-400">{t.header.challengeBadge}</span>
            {onOpenAbout && (
              <>
                <span className="text-xs text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={onOpenAbout}
                  className="text-xs font-semibold text-[#16733B] dark:text-emerald-400 hover:text-[#105C2E] hover:underline cursor-pointer"
                >
                  {language === 'ta'
                    ? 'அம்சங்கள் & வழிமுறைகள்'
                    : language === 'hi'
                    ? 'सुविधाएं और विवरण'
                    : 'About & Features'}
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-[#596775] dark:text-slate-400 text-center sm:text-right">
            {t.footer.disclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
};
