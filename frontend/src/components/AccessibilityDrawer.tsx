import React, { useEffect, useRef } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { RotateCcw, X, Sparkles, Check } from 'lucide-react';

export const AccessibilityDrawer: React.FC = () => {
  const {
    settings,
    isOpen,
    setIsOpen,
    increaseTextSize,
    decreaseTextSize,
    toggleTextSpacing,
    toggleLineHeight,
    toggleDyslexia,
    toggleAdhdMode,
    cycleSaturation,
    toggleHighlightLinks,
    toggleBigCursor,
    togglePauseAnimation,
    toggleHideImages,
    resetAllSettings,
  } = useAccessibility();

  const { language } = useLanguage();
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const labels = {
    title: language === 'ta' ? 'அணுகல்தன்மை விருப்பங்கள்' : language === 'hi' ? 'सुलभता विकल्प' : 'Accessibility options',
    upgrade: language === 'ta' ? 'மேம்படுத்து' : language === 'hi' ? 'अपग्रेड' : 'Upgrade',
    biggerText: language === 'ta' ? 'பெரிய எழுத்து' : language === 'hi' ? 'बड़ा टेक्स्ट' : 'Bigger Text',
    smallerText: language === 'ta' ? 'சிறிய எழுத்து' : language === 'hi' ? 'छोटा टेक्स्ट' : 'Smaller Text',
    textSpacing: language === 'ta' ? 'எழுத்து இடைவெளி' : language === 'hi' ? 'अक्षर रिक्ति' : 'Text Spacing',
    lineHeight: language === 'ta' ? 'வரி இடைவெளி' : language === 'hi' ? 'पंक्ति ऊंचाई' : 'Line Height',
    dyslexia: language === 'ta' ? 'டிஸ்லெக்ஸியா நட்பு' : language === 'hi' ? 'डिस्लेक्सिया अनुकूल' : 'Dyslexia Friendly',
    adhd: language === 'ta' ? 'ADHD முறைமை' : language === 'hi' ? 'एडीएचडी मोड' : 'ADHD Mode',
    saturation: language === 'ta' ? 'வண்ண செறிவு' : language === 'hi' ? 'रंग संतृप्ति' : 'Saturation',
    highlightLinks: language === 'ta' ? 'இணைப்பு முன்னிலை' : language === 'hi' ? 'लिंक उभारें' : 'Highlight Links',
    cursor: language === 'ta' ? 'பெரிய சுட்டி' : language === 'hi' ? 'बड़ा कर्सर' : 'Cursor',
    pauseAnimation: language === 'ta' ? 'அசைவு நிறுத்து' : language === 'hi' ? 'एनिमेशन रोकें' : 'Pause Animation',
    hideImages: language === 'ta' ? 'படங்களை மறை' : language === 'hi' ? 'चित्र छुपाएं' : 'Hide Images',
    reset: language === 'ta' ? 'அனைத்தையும் மீட்டமை' : language === 'hi' ? 'सभी सेटिंग्स रीसेट करें' : 'Reset All Settings',
  };

  // Focus management
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden a11y-exempt"
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
    >
      {/* Semi-transparent backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in drawer container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div
          ref={drawerRef}
          className="w-screen sm:w-[420px] max-w-md bg-slate-100 shadow-2xl flex flex-col justify-between border-l border-slate-200 overflow-y-auto animate-in slide-in-from-right duration-250 select-none"
        >
          {/* Top Section: Header & 12 Options Grid */}
          <div>
            {/* Header: Signature UX4G Royal Purple Banner */}
            <div className="bg-gradient-to-r from-[#6342E8] via-[#6B46C1] to-[#7952F5] text-white px-5 py-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold tracking-tight">
                  {labels.title}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {/* Upgrade Button matching screenshot */}
                <button
                  type="button"
                  onClick={() => alert('UX4G Accessibility Suite: All standard & pro features are fully unlocked for SevAIQ citizens.')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white text-[#6342E8] text-xs font-bold shadow-xs hover:bg-purple-50 transition-all focus:outline-none focus:ring-2 focus:ring-white"
                  title="Accessibility Features Tier: Government Enterprise Unlocked"
                >
                  <Sparkles className="w-3 h-3 text-[#6342E8] fill-current" />
                  <span>{labels.upgrade}</span>
                </button>

                {/* Close Button */}
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Close accessibility options"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* 3x4 Grid of 12 Accessibility Tools */}
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-3 gap-3">
                {/* 1. Bigger Text */}
                <button
                  type="button"
                  onClick={increaseTextSize}
                  className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                    settings.textSize > 100
                      ? 'bg-purple-50 border-2 border-purple-600 text-purple-900 shadow-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                  aria-label="Increase text size"
                >
                  {settings.textSize > 100 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <div className="h-7 flex items-center justify-center mb-1">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none stroke-2">
                      <path d="M3 6h7M6.5 6v12" strokeLinecap="round" />
                      <path d="M12 9h6M15 9v9" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold leading-tight">
                    {labels.biggerText}
                  </span>
                  {settings.textSize > 100 && (
                    <span className="text-[10px] font-bold text-purple-700 mt-0.5">
                      +{settings.textSize - 100}%
                    </span>
                  )}
                </button>

                {/* 2. Smaller Text */}
                <button
                  type="button"
                  onClick={decreaseTextSize}
                  className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                    settings.textSize < 100
                      ? 'bg-purple-50 border-2 border-purple-600 text-purple-900 shadow-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                  aria-label="Decrease text size"
                >
                  {settings.textSize < 100 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <div className="h-7 flex items-center justify-center mb-1">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none stroke-2">
                      <path d="M5 9h6M8 9v9" strokeLinecap="round" />
                      <path d="M14 11h4M16 11v7" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold leading-tight">
                    {labels.smallerText}
                  </span>
                  {settings.textSize < 100 && (
                    <span className="text-[10px] font-bold text-purple-700 mt-0.5">
                      -{100 - settings.textSize}%
                    </span>
                  )}
                </button>

                {/* 3. Text Spacing */}
                <button
                  type="button"
                  onClick={toggleTextSpacing}
                  className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                    settings.textSpacing
                      ? 'bg-purple-50 border-2 border-purple-600 text-purple-900 shadow-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                  aria-pressed={settings.textSpacing}
                >
                  {settings.textSpacing && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <div className="h-7 flex items-center justify-center mb-1">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none stroke-2">
                      <path d="M8 14h8M6 17l6-12 6 12" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 21h16M4 21l2-2M4 21l2 2M20 21l-2-2M20 21l-2 2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold leading-tight">
                    {labels.textSpacing}
                  </span>
                </button>

                {/* 4. Line Height */}
                <button
                  type="button"
                  onClick={toggleLineHeight}
                  className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                    settings.lineHeight
                      ? 'bg-purple-50 border-2 border-purple-600 text-purple-900 shadow-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                  aria-pressed={settings.lineHeight}
                >
                  {settings.lineHeight && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <div className="h-7 flex items-center justify-center mb-1">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none stroke-2">
                      <path d="M12 6h9M12 12h9M12 18h9" strokeLinecap="round" />
                      <path d="M5 6v12M3 8l2-2 2 2M3 16l2 2 2-2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold leading-tight">
                    {labels.lineHeight}
                  </span>
                </button>

                {/* 5. Dyslexia Friendly */}
                <button
                  type="button"
                  onClick={toggleDyslexia}
                  className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                    settings.dyslexiaFriendly
                      ? 'bg-purple-50 border-2 border-purple-600 text-purple-900 shadow-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                  aria-pressed={settings.dyslexiaFriendly}
                >
                  {settings.dyslexiaFriendly && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <div className="h-7 flex items-center justify-center mb-1">
                    <span className="text-2xl font-black font-serif tracking-tighter">Df</span>
                  </div>
                  <span className="text-xs font-semibold leading-tight">
                    {labels.dyslexia}
                  </span>
                </button>

                {/* 6. ADHD Mode */}
                <button
                  type="button"
                  onClick={toggleAdhdMode}
                  className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                    settings.adhdMode
                      ? 'bg-purple-50 border-2 border-purple-600 text-purple-900 shadow-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                  aria-pressed={settings.adhdMode}
                >
                  {settings.adhdMode && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <div className="h-7 flex items-center justify-center mb-1">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none stroke-2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M7 12c1.2-2 2.4-2 3.6 0s2.4 2 3.6 0 2.4-2 3.6 0" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold leading-tight">
                    {labels.adhd}
                  </span>
                </button>

                {/* 7. Saturation */}
                <button
                  type="button"
                  onClick={cycleSaturation}
                  className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                    settings.saturation !== 'normal'
                      ? 'bg-purple-50 border-2 border-purple-600 text-purple-900 shadow-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                  aria-label="Cycle saturation modes"
                >
                  {settings.saturation !== 'normal' && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <div className="h-7 flex items-center justify-center mb-1">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none stroke-2">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold leading-tight">
                    {labels.saturation}
                  </span>
                  {settings.saturation !== 'normal' && (
                    <span className="text-[10px] font-bold text-purple-700 capitalize mt-0.5">
                      {settings.saturation}
                    </span>
                  )}
                </button>

                {/* 8. Invert Colors */}
                <button
                  type="button"
                  onClick={toggleInvertColors}
                  className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                    settings.invertColors
                      ? 'bg-purple-50 border-2 border-purple-600 text-purple-900 shadow-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                  aria-pressed={settings.invertColors}
                >
                  {settings.invertColors && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <div className="h-7 flex items-center justify-center mb-1">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current stroke-2">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 3v16.5a8 8 0 0 1 0-16z" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold leading-tight">
                    {labels.invertColors}
                  </span>
                </button>

                {/* 9. Highlight Links */}
                <button
                  type="button"
                  onClick={toggleHighlightLinks}
                  className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                    settings.highlightLinks
                      ? 'bg-purple-50 border-2 border-purple-600 text-purple-900 shadow-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                  aria-pressed={settings.highlightLinks}
                >
                  {settings.highlightLinks && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <div className="h-7 flex items-center justify-center mb-1">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none stroke-2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold leading-tight">
                    {labels.highlightLinks}
                  </span>
                </button>

                {/* 10. Cursor */}
                <button
                  type="button"
                  onClick={toggleBigCursor}
                  className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                    settings.bigCursor
                      ? 'bg-purple-50 border-2 border-purple-600 text-purple-900 shadow-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                  aria-pressed={settings.bigCursor}
                >
                  {settings.bigCursor && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <div className="h-7 flex items-center justify-center mb-1">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none stroke-2">
                      <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
                      <path d="M10 7v9l3-3 3 5 1.5-.9-3-4.8 4.5-.3L10 7z" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold leading-tight">
                    {labels.cursor}
                  </span>
                </button>

                {/* 11. Pause Animation */}
                <button
                  type="button"
                  onClick={togglePauseAnimation}
                  className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                    settings.pauseAnimation
                      ? 'bg-purple-50 border-2 border-purple-600 text-purple-900 shadow-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                  aria-pressed={settings.pauseAnimation}
                >
                  {settings.pauseAnimation && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <div className="h-7 flex items-center justify-center mb-1">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none stroke-2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M10 9v6M14 9v6" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold leading-tight">
                    {labels.pauseAnimation}
                  </span>
                </button>

                {/* 12. Hide Images */}
                <button
                  type="button"
                  onClick={toggleHideImages}
                  className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                    settings.hideImages
                      ? 'bg-purple-50 border-2 border-purple-600 text-purple-900 shadow-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                  aria-pressed={settings.hideImages}
                >
                  {settings.hideImages && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <div className="h-7 flex items-center justify-center mb-1">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none stroke-2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold leading-tight">
                    {labels.hideImages}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Reset All Settings & Created by UX4G */}
          <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={resetAllSettings}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-purple-900" />
              <span>{labels.reset}</span>
            </button>

            <div className="text-xs text-slate-500 font-medium flex items-center space-x-1">
              <span>Created by</span>
              <span className="font-black text-[#5B34EA] tracking-wide">UX4G</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
