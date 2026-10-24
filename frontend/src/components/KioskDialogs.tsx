import React, { useEffect, useRef } from 'react';
import { ShieldAlert, Monitor, X, Clock, RefreshCw, LogOut } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface KioskConfirmationDialogProps {
  isOpen: boolean;
  isEnabling: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface InactivityWarningDialogProps {
  isOpen: boolean;
  secondsRemaining: number;
  onContinue: () => void;
  onEndNow: () => void;
}

/**
 * Accessible confirmation modal for enabling or disabling Public Kiosk Mode.
 */
export const KioskConfirmationDialog: React.FC<KioskConfirmationDialogProps> = ({
  isOpen,
  isEnabling,
  onConfirm,
  onCancel,
}) => {
  const { t, language } = useLanguage();
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  // Focus cancel button on mount for safety (prevent accidental confirmation)
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key closes modal (Cancel)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kiosk-modal-title"
      aria-describedby="kiosk-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white dark:bg-[#17324D] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 my-auto animate-in zoom-in-95 duration-150">
        <div className="flex items-start space-x-3.5">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              isEnabling
                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
            }`}
          >
            {isEnabling ? (
              <Monitor className="w-6 h-6 stroke-[2.2]" />
            ) : (
              <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="kiosk-modal-title"
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug"
            >
              {isEnabling ? t.header.enableKioskTitle : t.header.disableKioskTitle}
            </h3>

            {/* Public Purpose Notice Badge */}
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                {language === 'ta'
                  ? 'பகிரப்பட்ட பொது சாதனங்களுக்காக வடிவமைக்கப்பட்டது'
                  : language === 'hi'
                  ? 'साझा सार्वजनिक कंप्यूटरों के लिए निर्मित'
                  : 'Designed for Shared Public Terminals (CSC / Kiosk)'}
              </span>
            </div>

            <p
              id="kiosk-modal-desc"
              className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed"
            >
              {isEnabling ? t.header.enableKioskDesc : t.header.disableKioskDesc}
            </p>

            <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
              >
                {isEnabling ? t.header.enableKioskCancel : t.header.disableKioskCancel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`w-full sm:w-auto px-4.5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 cursor-pointer ${
                  isEnabling
                    ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                    : 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                }`}
              >
                {isEnabling ? t.header.enableKioskConfirm : t.header.disableKioskConfirm}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Accessible warning dialog that appears 30 seconds before inactivity reset in Public Kiosk Mode.
 */
export const InactivityWarningDialog: React.FC<InactivityWarningDialogProps> = ({
  isOpen,
  secondsRemaining,
  onContinue,
  onEndNow,
}) => {
  const { t, language } = useLanguage();
  const continueBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        continueBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const descText = (t.header.inactivityWarningDesc || '').replace(
    '{seconds}',
    String(secondsRemaining)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-warning-title"
      aria-describedby="inactivity-warning-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-[#17324D] rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-400 dark:border-amber-500 my-auto animate-in zoom-in-95 duration-150">
        <div className="flex flex-col items-center text-center">
          <div className="p-3.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 mb-3 animate-pulse">
            <Clock className="w-8 h-8 stroke-[2.2]" />
          </div>

          <h3
            id="inactivity-warning-title"
            className="text-lg font-bold text-slate-900 dark:text-white"
          >
            {t.header.inactivityWarningTitle}
          </h3>

          {/* Large Countdown Pill */}
          <div className="my-3 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-mono text-xl font-extrabold tracking-wider">
            {`00:${secondsRemaining < 10 ? '0' + secondsRemaining : secondsRemaining}`}
          </div>

          <p
            id="inactivity-warning-desc"
            className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
          >
            {descText}
          </p>

          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'ta'
              ? 'உங்கள் சுயவிவரமும் அரட்டை வரலாறும் அடுத்த குடிமகனுக்காக பாதுகாக்கப்படாமல் அழிக்கப்படும்.'
              : language === 'hi'
              ? 'आपकी गोपनीयता के लिए आपकी प्रोफाइल व चैट इतिहास सुरक्षित रूप से मिटा दिया जाएगा।'
              : 'All in-memory chat, profile, and tracker inputs will be wiped clean for the next citizen.'}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
            <button
              ref={continueBtnRef}
              type="button"
              onClick={onContinue}
              className="w-full sm:flex-1 py-2.5 px-4 text-xs font-bold text-white bg-[#16733B] hover:bg-[#105C2E] rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#16733B] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.header.continueSession}</span>
            </button>
            <button
              type="button"
              onClick={onEndNow}
              className="w-full sm:w-auto py-2.5 px-3.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors border border-rose-200 dark:border-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer flex items-center justify-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.header.endSessionNow}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
