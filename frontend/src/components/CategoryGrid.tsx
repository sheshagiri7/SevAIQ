import React from 'react';
import { ArrowRight, Layers, Sparkles } from 'lucide-react';
import { MY_SCHEME_CATEGORIES, CategoryCardData } from '../data/categoryGridData';
import { useLanguage } from '../context/LanguageContext';

interface CategoryGridProps {
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onSelectCategory }) => {
  const { language, t } = useLanguage();
  const isTamil = language === 'ta';
  const isHindi = language === 'hi';

  const headingText = isTamil
    ? 'வகைகள் வாரியாக திட்டங்களை கண்டறியவும்'
    : isHindi
    ? 'श्रेणियों के आधार पर योजनाएं खोजें'
    : 'Find schemes based on categories';

  const subText = isTamil
    ? 'மத்திய மற்றும் மாநில அரசுகளின் 15 முதன்மைத் துறைகளின் கீழ் உள்ள சரிபார்க்கப்பட்ட நலத்திட்டங்களை உடனடியாகக் காணுங்கள்.'
    : isHindi
    ? '15 प्रमुख सरकारी क्षेत्रों के अंतर्गत वैधानिक पात्रता व आवेदन दिशानिर्देशों सहित सत्यापित कल्याणकारी योजनाएं देखें।'
    : 'Browse verified welfare initiatives across 15 government sectors with statutory criteria and application roadmaps.';

  const categoryCountLabel = `15 ${isTamil ? 'துறைகள்' : isHindi ? 'श्रेणियां' : 'Categories'}`;

  return (
    <section
      aria-labelledby="categories-heading"
      className="p-6 sm:p-8 bg-white dark:bg-[#17324D] rounded-xl border border-[#D7DEE5] dark:border-[#223B56] shadow-xs space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#D7DEE5] dark:border-[#223B56]">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#16733B] dark:text-emerald-400 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#16733B]" />
            <span>
              {t.banner?.hashtag ||
                (isTamil
                  ? '#அரசுதிட்டங்கள் / #உங்களுக்கானதிட்டங்கள்'
                  : isHindi
                  ? '#सरकारीयोजनाएं / #आपकेलिएयोजनाएं'
                  : '#GOVERNMENTSCHEMES / #SCHEMESFORYOU')}
            </span>
          </div>
          <h2
            id="categories-heading"
            className="text-2xl sm:text-3xl font-bold text-[#202B36] dark:text-white tracking-tight"
          >
            {headingText}
          </h2>
          <p className="text-xs sm:text-sm text-[#596775] dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {subText}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-start md:self-auto">
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-[#F5F7F8] dark:bg-[#0F2133] text-[#202B36] dark:text-slate-200 border border-[#D7DEE5] dark:border-[#223B56]">
            <Layers className="w-3.5 h-3.5 mr-1.5 text-[#16733B]" />
            {categoryCountLabel}
          </span>
        </div>
      </div>

      {/* 15-Category 5-Column Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
        {MY_SCHEME_CATEGORIES.map((cat: CategoryCardData) => {
          const Icon = cat.icon;
          const title = isTamil ? cat.titleTa : isHindi ? (cat.titleHi || cat.titleEn) : cat.titleEn;
          const schemesText = isTamil ? `${cat.count} திட்டங்கள்` : isHindi ? `${cat.count} योजनाएं` : `${cat.count} Schemes`;
          const exploreText = isTamil ? 'திட்டங்களை காண்க' : isHindi ? 'योजनाएं देखें' : 'Explore';

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.categoryFilterId)}
              className="group relative flex flex-col items-center justify-between p-4 sm:p-5 bg-white dark:bg-[#0F2133] hover:bg-[#EDF6EF] dark:hover:bg-[#17324D] rounded-xl border border-[#D7DEE5] dark:border-[#223B56] hover:border-[#16733B] shadow-xs transition-colors duration-150 text-center focus:outline-none focus:ring-2 focus:ring-[#16733B] min-h-[170px] sm:min-h-[190px] cursor-pointer"
              aria-label={`${title} - ${schemesText}`}
            >
              <div className="flex flex-col items-center w-full">
                {/* Pastel Circular Icon Backdrop */}
                <div
                  className={`w-13 h-13 sm:w-16 sm:h-16 rounded-full ${cat.bgColor} ${cat.textColor} flex items-center justify-center mb-2.5 sm:mb-3 group-hover:scale-110 group-hover:rotate-1 transition-transform duration-200 shadow-2xs`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
                </div>

                {/* Scheme Count Indicator */}
                <span className="text-[11px] sm:text-xs font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">
                  {schemesText}
                </span>
              </div>

              {/* Category Title */}
              <span className="text-xs sm:text-[13px] font-semibold text-slate-800 group-hover:text-civic-900 transition-colors leading-snug mt-2 w-full px-1">
                {title}
              </span>

              {/* Subdued Arrow cue on hover */}
              <div className="mt-2 text-[10px] font-bold text-civic-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                <span>{exploreText}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
