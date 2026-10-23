import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-white border-t border-slate-200 mt-16 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-civic-700 flex items-center justify-center text-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold text-slate-800">SevAIQ</span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500">{t.header.challengeBadge}</span>
          </div>

          <p className="text-xs text-slate-500 text-center sm:text-right">
            {t.footer.disclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
};
