import React from 'react';
import { Sparkles, Shield, CheckCircle, Database, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeroProps {
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick }) => {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-20 bg-[#F5F7F8] dark:bg-[#0F2133] border-b border-[#D7DEE5] dark:border-[#223B56]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Project Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-[#EDF6EF] dark:bg-[#105C2E]/30 border border-[#D7DEE5] dark:border-[#223B56] text-[#16733B] dark:text-emerald-300 text-xs font-semibold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#16733B]" />
          <span>{t.hero.badge}</span>
          <span className="text-[#D7DEE5] dark:text-[#223B56]">•</span>
          <span className="text-[#596775] dark:text-slate-400 font-normal">{t.hero.track}</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#202B36] dark:text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
          {t.hero.titlePart1}{' '}
          <span className="text-[#16733B] dark:text-emerald-400">
            {t.hero.titleHighlight}
          </span>
        </h1>

        {/* Description */}
        <p className="mt-5 text-lg sm:text-xl text-[#596775] dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t.hero.description}
        </p>

        {/* CTA Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-[#16733B] hover:bg-[#105C2E] text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
          >
            <span>{t.hero.discoverSchemes}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Key Guarantees */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-white dark:bg-[#17324D] border border-[#D7DEE5] dark:border-[#223B56] shadow-xs flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-[#EDF6EF] dark:bg-[#105C2E]/30 text-[#16733B] dark:text-emerald-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#202B36] dark:text-white">{t.hero.guarantee1Title}</h3>
              <p className="text-xs text-[#596775] dark:text-slate-400 mt-0.5">
                {t.hero.guarantee1Desc}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#17324D] border border-[#D7DEE5] dark:border-[#223B56] shadow-xs flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-[#EDF6EF] dark:bg-[#105C2E]/30 text-[#16733B] dark:text-emerald-300">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#202B36] dark:text-white">{t.hero.guarantee2Title}</h3>
              <p className="text-xs text-[#596775] dark:text-slate-400 mt-0.5">
                {t.hero.guarantee2Desc}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#17324D] border border-[#D7DEE5] dark:border-[#223B56] shadow-xs flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-[#EDF6EF] dark:bg-[#105C2E]/30 text-[#16733B] dark:text-emerald-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#202B36] dark:text-white">{t.hero.guarantee3Title}</h3>
              <p className="text-xs text-[#596775] dark:text-slate-400 mt-0.5">
                {t.hero.guarantee3Desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
