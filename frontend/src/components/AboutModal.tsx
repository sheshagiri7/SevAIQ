import React, { useEffect, useRef } from 'react';
import {
  ShieldCheck,
  X,
  Mic,
  ListChecks,
  ArrowRight,
  Lock,
  Database,
  Sparkles,
} from 'lucide-react';
import { NavigationTab } from '../types';
import { useLanguage } from '../context/LanguageContext';

export interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { language, t } = useLanguage();
  const isTamil = language === 'ta';
  const isHindi = language === 'hi';
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus close button on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleActionClick = (tab: NavigationTab) => {
    onClose();
    onNavigate(tab);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Top Header */}
        <div className="px-5 sm:px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-blue-50/40 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-blue-800 via-civic-700 to-indigo-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2
                  id="about-modal-title"
                  className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight"
                >
                  {isTamil
                    ? 'SevAIQ பற்றி: அம்சங்கள் & செயல்படும் முறை'
                    : isHindi
                    ? 'SevAIQ के बारे में: विशेषताएं और कार्यप्रणाली'
                    : 'About SevAIQ: Features & Working'}
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-civic-100 text-civic-800 border border-civic-200">
                  {t.header.challengeBadge}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {t.header.tagline}
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500 shrink-0 ml-2"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-8 text-slate-800">
          {/* Mission Intro */}
          <div className="p-5 rounded-2xl bg-civic-50/70 border border-civic-100 flex items-start space-x-3.5">
            <Sparkles className="w-5 h-5 text-civic-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-civic-900 leading-relaxed">
              <strong>SevAIQ</strong> {isTamil
                ? 'என்பது இந்திய குடிமக்கள் தங்களுக்குரிய மத்திய மற்றும் மாநில நலத்திட்டங்களை துல்லியமாக கண்டறிந்து, தகுதியை சோதித்து, தேவையான ஆவணங்களை தயார் செய்து, நிராகரிப்பு இல்லாத விண்ணப்பங்களை சமர்ப்பிக்க உதவும் அரசு-நம்பகத்தன்மை கொண்ட டிஜிட்டல் தளமாகும்.'
                : isHindi
                ? 'एक पारदर्शी नागरिक बुद्धिमत्ता मंच है जो भारतीय नागरिकों और वैधानिक सरकारी कल्याण योजनाओं के बीच सूचना अंतराल को समाप्त करता है। यह खोज से लेकर सत्यापित आवेदन तत्परता तक बिना किसी भ्रांति (zero hallucinations) के आपका मार्गदर्शन करता है।'
                : 'is an explainable civic intelligence platform designed to eliminate the information asymmetry between Indian citizens and statutory government welfare programs. It guides you from discovery to verified submission readiness with zero hallucinations.'}
            </div>
          </div>

          {/* 1. Structured Citizen Workflow (01 - 04) */}
          <div className="space-y-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-civic-700 mb-1">
                <ShieldCheck className="w-4 h-4 text-civic-600" />
                <span>{t.dashboard.workflowBadge}</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {t.dashboard.workflowTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {t.dashboard.workflowSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Step 1: Discover Schemes */}
              <button
                type="button"
                onClick={() => handleActionClick('discover')}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-blue-50/50 hover:border-civic-300 transition-all text-left flex flex-col justify-between h-full group focus:outline-none focus:ring-2 focus:ring-civic-500"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-civic-800 font-black text-xs flex items-center justify-center mb-3 shrink-0">
                    01
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-civic-800 transition-colors">
                    {t.dashboard.step1Title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                    {t.dashboard.step1Desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-civic-700">
                  <span>{t.dashboard.step1Action}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>

              {/* Step 2: Check Eligibility */}
              <button
                type="button"
                onClick={() => handleActionClick('eligibility')}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-300 transition-all text-left flex flex-col justify-between h-full group focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center mb-3 shrink-0">
                    02
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {t.dashboard.step2Title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                    {t.dashboard.step2Desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-emerald-700">
                  <span>{t.dashboard.step2Action}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>

              {/* Step 3: Map Documents */}
              <button
                type="button"
                onClick={() => handleActionClick('document-mapper')}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all text-left flex flex-col justify-between h-full group focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center mb-3 shrink-0">
                    03
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-800 transition-colors">
                    {t.dashboard.step3Title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                    {t.dashboard.step3Desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-indigo-700">
                  <span>{t.dashboard.step3Action}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>

              {/* Step 4: Readiness Passport */}
              <button
                type="button"
                onClick={() => handleActionClick('readiness-passport')}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-amber-50/50 hover:border-amber-300 transition-all text-left flex flex-col justify-between h-full group focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center mb-3 shrink-0">
                    04
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-amber-800 transition-colors">
                    {t.dashboard.step4Title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                    {t.dashboard.step4Desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-amber-700">
                  <span>{t.dashboard.step4Action}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            </div>
          </div>

          {/* 2. Specialized Citizen Tools (Features 5, 6, 7) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.dashboard.toolsBadge}
              </h3>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {t.dashboard.toolsTitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Feature 5: Voice AI */}
              <button
                type="button"
                onClick={() => handleActionClick('voice-assistant')}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-civic-400 hover:shadow-md transition-all text-left flex flex-col justify-between h-full group focus:outline-none focus:ring-2 focus:ring-civic-500"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-civic-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shrink-0">
                    <Mic className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-civic-700">
                    Feature 5
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {t.dashboard.feat5Title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {t.dashboard.feat5Desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-civic-700">
                  <span>{t.dashboard.feat5Action}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>

              {/* Feature 6: Trust Monitor */}
              <button
                type="button"
                onClick={() => handleActionClick('trust-monitor')}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all text-left flex flex-col justify-between h-full group focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Feature 6
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {t.dashboard.feat6Title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {t.dashboard.feat6Desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-700">
                  <span>{t.dashboard.feat6Action}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>

              {/* Feature 7: Guidance Tracker */}
              <button
                type="button"
                onClick={() => handleActionClick('application-tracker')}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-400 hover:shadow-md transition-all text-left flex flex-col justify-between h-full group focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shrink-0">
                    <ListChecks className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                    Feature 7
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {t.dashboard.feat7Title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {t.dashboard.feat7Desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-700">
                  <span>{t.dashboard.feat7Action}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            </div>
          </div>

          {/* 3. Privacy & Deterministic Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="p-5 bg-slate-900 text-white rounded-2xl flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{t.dashboard.privacyTitle}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {t.dashboard.privacyDesc}
                </p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-blue-100 text-civic-800 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">{t.dashboard.zeroHallucinationTitle}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {t.dashboard.zeroHallucinationDesc}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-8 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 text-center sm:text-left">
            {isTamil
              ? 'அனைத்து தரவுகளும் உங்கள் உலாவியில் மட்டுமே பாதுகாப்பாக சேமிக்கப்படுகின்றன.'
              : isHindi
              ? 'सभी डेटा केवल आपके ब्राउज़र में सुरक्षित रूप से स्थानीय रूप से संग्रहीत होते हैं • शून्य सर्वर भंडारण'
              : 'Zero server-side persistence of citizen profiles • Ephemeral in-memory execution'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-civic-700 hover:bg-civic-800 rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500"
          >
            {isTamil ? 'மூடவும்' : isHindi ? 'समझ गए, बंद करें' : 'Got it, Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
