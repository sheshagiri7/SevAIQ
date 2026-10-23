import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Search, X, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AppLanguage } from '../i18n/translations';

/**
 * Official Indian Governance Multilingual Emblem (A / अ)
 * Replicates the NeGD / myScheme / Digital India national language switcher icon.
 */
export const IndicLanguageEmblem: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <div
    className={`relative flex items-center justify-center rounded-full bg-[#15803d] text-white select-none shrink-0 shadow-2xs ${className}`}
    aria-hidden="true"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
      <circle cx="12" cy="12" r="12" fill="#15803d" />
      {/* Latin 'A' character on top-left */}
      <text
        x="8.5"
        y="11.5"
        fill="#FFFFFF"
        fontSize="8.5"
        fontWeight="bold"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        textAnchor="middle"
      >
        A
      </text>
      {/* Subtle separator arc matching myScheme official branding */}
      <line
        x1="11.5"
        y1="7"
        x2="12.5"
        y2="17"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="0.75"
        strokeLinecap="round"
      />
      {/* Devanagari 'अ' character on bottom-right */}
      <text
        x="15.5"
        y="17"
        fill="#FFFFFF"
        fontSize="8.5"
        fontWeight="bold"
        fontFamily="'Noto Sans Devanagari', 'Devanagari Sangam MN', Nirmala UI, sans-serif"
        textAnchor="middle"
      >
        अ
      </text>
    </svg>
  </div>
);

export type SupportedLangCode =
  | AppLanguage
  | 'te'
  | 'kn'
  | 'ml'
  | 'mr'
  | 'gu'
  | 'bn'
  | 'pa'
  | 'or'
  | 'as';

export interface SupportedLanguageInfo {
  code: SupportedLangCode;
  name: string; // Native script
  englishName: string;
  isFullyLocalized: boolean;
}

export const INDIAN_LANGUAGES: SupportedLanguageInfo[] = [
  { code: 'en', name: 'English', englishName: 'English', isFullyLocalized: true },
  { code: 'hi', name: 'हिन्दी', englishName: 'Hindi', isFullyLocalized: true },
  { code: 'ta', name: 'தமிழ்', englishName: 'Tamil', isFullyLocalized: true },
  { code: 'te', name: 'తెలుగు', englishName: 'Telugu', isFullyLocalized: false },
  { code: 'kn', name: 'ಕನ್ನಡ', englishName: 'Kannada', isFullyLocalized: false },
  { code: 'ml', name: 'മലയാളം', englishName: 'Malayalam', isFullyLocalized: false },
  { code: 'mr', name: 'मराठी', englishName: 'Marathi', isFullyLocalized: false },
  { code: 'gu', name: 'ગુજરાતી', englishName: 'Gujarati', isFullyLocalized: false },
  { code: 'bn', name: 'বাংলা', englishName: 'Bengali', isFullyLocalized: false },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', isFullyLocalized: false },
  { code: 'or', name: 'ଓଡ଼ିଆ', englishName: 'Odia', isFullyLocalized: false },
  { code: 'as', name: 'অসমীয়া', englishName: 'Assamese', isFullyLocalized: false },
];

interface LanguageSelectorProps {
  variant?: 'header' | 'mobile';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bhashiniNotice, setBhashiniNotice] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const currentLangInfo =
    INDIAN_LANGUAGES.find((l) => l.code === language) || INDIAN_LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Keyboard navigation & accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelectLanguage = (langCode: SupportedLangCode) => {
    if (langCode === 'en' || langCode === 'ta' || langCode === 'hi') {
      setLanguage(langCode);
      setBhashiniNotice(null);
      setIsOpen(false);
      triggerRef.current?.focus();
    } else {
      const info = INDIAN_LANGUAGES.find((l) => l.code === langCode);
      setBhashiniNotice(info ? `${info.name} (${info.englishName})` : String(langCode));
    }
  };

  const filteredLanguages = INDIAN_LANGUAGES.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.englishName.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q)
    );
  });

  if (variant === 'mobile') {
    return (
      <div className={`relative ${className}`}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Change website language"
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <IndicLanguageEmblem className="w-5 h-5 sm:w-6 sm:h-6" />
            <div className="text-left">
              <span className="text-xs font-bold text-slate-800 block">
                {currentLangInfo.name}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {currentLangInfo.englishName} • {t.header.languageSelect}
              </span>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-emerald-800 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="mt-2 p-3 bg-white rounded-2xl shadow-xl border border-slate-200/90 space-y-2 z-50 animate-in fade-in zoom-in-95 duration-150"
            role="listbox"
            aria-label="Select website language"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <IndicLanguageEmblem className="w-5 h-5" />
                <span className="text-xs font-bold text-slate-900">
                  {language === 'ta'
                    ? 'மொழியைத் தேர்ந்தெடுக்கவும்'
                    : language === 'hi'
                    ? 'भाषा चुनें'
                    : 'Select Language'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close language selector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-0.5">
              {INDIAN_LANGUAGES.map((item) => {
                const isSelected = language === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleSelectLanguage(item.code)}
                    role="option"
                    aria-selected={isSelected}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all border ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-2xs ring-1 ring-emerald-300'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {item.englishName}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 ml-1">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Header Variant (Pixel-perfect recreation of myScheme.gov.in language option)
  return (
    <div className={`relative inline-block text-left shrink-0 ${className}`}>
      {/* Official myScheme-style trigger button: (A अ) English ▾ */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Change language, current language is ${currentLangInfo.englishName}`}
        className="group h-8 xl:h-8.5 px-2 sm:px-2.5 rounded-lg border border-emerald-600/30 bg-white hover:bg-emerald-50/70 hover:border-emerald-500/50 shadow-2xs transition-all flex items-center gap-1.5 xl:gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
      >
        <IndicLanguageEmblem className="w-5 h-5 xl:w-5.5 xl:h-5.5" />
        <span className="text-xs xl:text-sm font-semibold text-emerald-800 group-hover:text-emerald-900 tracking-tight whitespace-nowrap">
          {currentLangInfo.name}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-emerald-700 group-hover:text-emerald-900 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          role="listbox"
          aria-label="Website language options"
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-3 px-3 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <IndicLanguageEmblem className="w-6 h-6" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 leading-tight">
                  {language === 'ta'
                    ? 'மொழியைத் தேர்ந்தெடுக்கவும்'
                    : language === 'hi'
                    ? 'भाषा का चयन करें'
                    : 'Select Language'}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  {language === 'ta'
                    ? 'அங்கீகரிக்கப்பட்ட இந்திய மொழிகள்'
                    : language === 'hi'
                    ? 'मान्यता प्राप्त भारतीय भाषाएं'
                    : 'Official Indian Languages (myScheme)'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close language selector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input for Fast Filtering */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'மொழியைத் தேடவும்...'
                  : language === 'hi'
                  ? 'भाषा खोजें...'
                  : 'Search language...'
              }
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all"
            />
          </div>

          {/* Languages Scrollable Grid */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-0.5 [scrollbar-width:thin]">
            {filteredLanguages.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No languages found matching "{searchQuery}"
              </div>
            ) : (
              filteredLanguages.map((item) => {
                const isSelected = language === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleSelectLanguage(item.code)}
                    role="option"
                    aria-selected={isSelected}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-300'
                        : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight text-slate-900 truncate flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.isFullyLocalized && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium truncate">
                          {item.englishName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Active</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium group-hover:text-slate-600">
                          {item.code.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Attribution Banner */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Digital India • myScheme</span>
            </span>
            <span>Bhashini Ready</span>
          </div>
        </div>
      )}
    </div>
  );
};
