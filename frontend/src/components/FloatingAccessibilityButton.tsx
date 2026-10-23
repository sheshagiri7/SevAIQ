import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';

/**
 * FloatingAccessibilityButton
 *
 * Implements the myScheme / UX4G signature royal purple docked accessibility launcher.
 * Docked to the left edge of the screen, matching official Government of India civic portals.
 * Clicking opens the UX4G Universal Accessibility Drawer.
 */
export const FloatingAccessibilityButton: React.FC = () => {
  const { isOpen, toggleOpen, activeCount } = useAccessibility();
  const { language } = useLanguage();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleOpen();
    }
  };

  const label = language === 'ta' ? 'அணுகல்தன்மை விருப்பங்கள்' : 'Accessibility options';

  return (
    <aside
      aria-label={label}
      className="fixed left-0 top-[38%] -translate-y-1/2 z-40 print:hidden select-none a11y-exempt"
    >
      <button
        type="button"
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        className="group relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-r-2xl bg-gradient-to-r from-[#6342E8] via-[#6B46C1] to-[#7952F5] hover:from-[#5634db] hover:to-[#6b44e6] text-white shadow-[0_4px_20px_rgba(99,66,232,0.45)] hover:shadow-[0_6px_25px_rgba(99,66,232,0.6)] border-t border-r border-b border-white/25 hover:translate-x-1 active:translate-x-0 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-3 focus:ring-purple-400 focus:ring-offset-2"
        aria-label={label}
        title={label}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {/* Universal Accessibility Symbol matching myScheme / UX4G */}
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-white fill-none stroke-current group-hover:scale-110 transition-transform duration-200"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="4.5" r="2.2" fill="currentColor" stroke="none" />
          <path d="M4 9h16" strokeWidth="2.3" />
          <path d="M12 9v6.5" strokeWidth="2.3" />
          <path d="M7.5 21l4.5-5.5 4.5 5.5" strokeWidth="2.3" />
        </svg>

        {/* Active Settings Notification Badge */}
        {activeCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border-2 border-[#6342E8] animate-pulse"
            title={`${activeCount} active settings`}
          >
            {activeCount}
          </span>
        )}

        {/* Desktop Slide-out Flyout Tooltip */}
        <div
          role="tooltip"
          className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden md:flex items-center pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0 z-50"
        >
          <div className="bg-slate-900/95 backdrop-blur-xs text-white text-xs font-semibold py-2 px-3.5 rounded-xl shadow-xl border border-slate-700/60 whitespace-nowrap flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span>{label}</span>
            <span className="text-[9px] font-bold text-purple-200 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800/60">
              myScheme
            </span>
          </div>
        </div>
      </button>
    </aside>
  );
};
