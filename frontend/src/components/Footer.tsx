import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onOpenAbout?: () => void;
  onReplayIntro?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAbout, onReplayIntro }) => {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-white dark:bg-[#0F2133] border-t border-[#D7DEE5] dark:border-[#223B56] mt-16 py-8 transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          {/* Main Footer Left: Identity + Action Links */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {/* Identity Badge */}
            <div className="flex items-center justify-center space-x-2 shrink-0">
              <div className="w-6 h-6 rounded bg-[#17324D] flex items-center justify-center text-white shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-bold text-[#202B36] dark:text-slate-200">SevAIQ</span>
              <span className="text-xs text-[#596775] dark:text-slate-600" aria-hidden="true">|</span>
              <span className="text-xs text-[#596775] dark:text-slate-400">{t.header.challengeBadge}</span>
            </div>

            {/* Actions: About & Features + Play Intro */}
            {(onOpenAbout || onReplayIntro) && (
              <div className="flex items-center justify-center flex-wrap gap-2.5 sm:gap-3 w-full sm:w-auto">
                {onOpenAbout && (
                  <>
                    <span className="hidden sm:inline text-xs text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
                    <button
                      type="button"
                      onClick={onOpenAbout}
                      className="text-xs font-semibold text-[#16733B] dark:text-emerald-400 hover:text-[#105C2E] dark:hover:text-emerald-300 hover:underline cursor-pointer px-2 py-1 rounded-md transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {language === 'ta'
                        ? 'அம்சங்கள் & வழிமுறைகள்'
                        : language === 'hi'
                        ? 'सुविधाएं और विवरण'
                        : 'About & Features'}
                    </button>
                  </>
                )}

                {onReplayIntro && (
                  <>
                    <span className="hidden sm:inline text-xs text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
                    <div className="flex items-center justify-center w-full sm:w-auto my-0.5 sm:my-0">
                      <button
                        type="button"
                        onClick={onReplayIntro}
                        className="w-fit max-w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 sm:px-3 sm:py-1 text-xs font-semibold text-[#17324D] dark:text-teal-300 bg-slate-100 hover:bg-slate-200/90 dark:bg-[#13283E] dark:hover:bg-[#1A3654] border border-slate-300/80 dark:border-slate-700 hover:border-teal-500/60 dark:hover:border-teal-400/60 rounded-full shadow-2xs transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:focus:ring-teal-400/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0F2133] select-none active:scale-95"
                        aria-label="Replay SevAIQ Cinematic Intro"
                        style={{ width: 'fit-content' }}
                      >
                        <span aria-hidden="true" className="text-xs shrink-0">🎬</span>
                        <span className="whitespace-nowrap">
                          {language === 'ta'
                            ? 'அறிமுகக் காட்சி'
                            : language === 'hi'
                            ? 'परिचय दृश्य'
                            : 'Play Intro'}
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-[#596775] dark:text-slate-400 text-center sm:text-right shrink-0">
            {t.footer.disclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
};
