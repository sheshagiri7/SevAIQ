import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Menu,
  X,
  Compass,
  CheckSquare,
  Files,
  Award,
  LayoutDashboard,
  Monitor,
  Trash2,
  ListChecks,
  Globe,
  MessageSquare,
} from 'lucide-react';
import { ApiState, NavigationTab } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  apiState?: ApiState;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onRefreshHealth?: () => void;
  eligibleCount?: number;
  isKioskMode?: boolean;
  onToggleKioskMode?: () => void;
  onClearSession?: () => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  mobileLabel?: string;
  description?: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  eligibleCount = 0,
  isKioskMode = false,
  onToggleKioskMode = () => {},
  onClearSession = () => {},
}) => {
  const { language, t } = useLanguage();
  const isIndic = language === 'ta' || language === 'hi';
  const isTamil = language === 'ta';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  const navItems: NavItem[] = [
    { id: 'chat', label: t.header.chat, mobileLabel: t.header.chatMobile, description: t.header.chatDesc, icon: MessageSquare },
    { id: 'dashboard', label: t.header.dashboard, icon: LayoutDashboard },
    { id: 'discover', label: t.header.schemes, mobileLabel: t.header.schemesMobile, description: t.header.schemesDesc, icon: Compass },
    { id: 'eligibility', label: t.header.eligibility, mobileLabel: t.header.eligibilityMobile, description: t.header.eligibilityDesc, icon: CheckSquare, badge: eligibleCount > 0 ? eligibleCount : undefined },
    { id: 'document-mapper', label: t.header.documents, mobileLabel: t.header.documentsMobile, description: t.header.documentsDesc, icon: Files },
    { id: 'readiness-passport', label: t.header.passport, mobileLabel: t.header.passportMobile, description: t.header.passportDesc, icon: Award },
    { id: 'trust-monitor', label: t.header.trust, mobileLabel: t.header.trustMobile, description: t.header.trustDesc, icon: ShieldCheck },
    { id: 'application-tracker', label: t.header.guidance, mobileLabel: t.header.guidanceMobile, description: t.header.guidanceDesc, icon: ListChecks },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const handleCloseModal = () => {
    setShowClearConfirm(false);
    setTimeout(() => {
      triggerButtonRef.current?.focus();
    }, 0);
  };

  const handleConfirmClear = () => {
    onClearSession();
    setShowClearConfirm(false);
    setTimeout(() => {
      triggerButtonRef.current?.focus();
    }, 0);
  };

  // Global Escape key listener for open modals/menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Keyboard navigation, Escape dismissal, and focus trap for the End Session dialog
  useEffect(() => {
    if (showClearConfirm) {
      // Initial focus on Cancel button for safety
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleCloseModal();
          return;
        }

        // Two-button focus trap
        if (e.key === 'Tab') {
          const cancelBtn = cancelButtonRef.current;
          const confirmBtn = confirmButtonRef.current;
          if (!cancelBtn || !confirmBtn) return;

          if (e.shiftKey) {
            // Shift + Tab: if on cancelBtn, wrap to confirmBtn
            if (document.activeElement === cancelBtn) {
              e.preventDefault();
              confirmBtn.focus();
            }
          } else {
            // Tab: if on confirmBtn, wrap to cancelBtn
            if (document.activeElement === confirmBtn) {
              e.preventDefault();
              cancelBtn.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showClearConfirm]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/90 shadow-2xs w-full">
      <div className="w-full px-2 sm:px-4 lg:px-5 xl:px-6 2xl:px-8">
        <div className="flex items-center justify-between min-h-[3.75rem] sm:min-h-[4.25rem] py-1 sm:py-1.5 w-full gap-1.5 sm:gap-2 lg:gap-3">
          {/* Top Left: Logo & Tagline */}
          <div className="flex items-center shrink-0 pr-1">
            <button
              type="button"
              onClick={() => handleNavClick('chat')}
              className="flex items-center space-x-2 text-left group focus:outline-none focus:ring-2 focus:ring-civic-500 rounded-xl p-0.5"
              aria-label="SevAIQ - Civic Intelligence & AI Assistant"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 xl:w-9 xl:h-9 rounded-xl bg-gradient-to-br from-blue-800 via-civic-700 to-indigo-900 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5 xl:w-5 xl:h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-base sm:text-lg xl:text-xl font-black tracking-tight text-slate-900 leading-none">
                  Sev<span className="text-civic-600">AI</span>Q
                </span>
                <span className={`text-[9px] xl:text-[10px] text-slate-500 font-medium tracking-normal leading-none mt-1 ${isIndic ? 'max-w-[185px] sm:max-w-[215px] 2xl:max-w-none' : 'max-w-[200px] xl:max-w-none'} truncate`}>
                  {t.header.tagline}
                </span>
              </div>
            </button>
          </div>

          {/* Center: All Navigation Options Aligned in Center */}
          <nav
            className="hidden lg:flex items-center justify-center flex-1 min-w-0 mx-1 lg:mx-2 gap-0.5 xl:gap-1 2xl:gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1"
            aria-label="Main Navigation"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center ${
                    isIndic
                      ? 'gap-1 xl:gap-1.5 px-1.5 py-1 xl:px-2 xl:py-1.5 2xl:px-2.5 text-[11px] xl:text-xs font-semibold'
                      : 'gap-1.5 px-2 py-1 xl:px-2.5 xl:py-1.5 text-xs font-semibold'
                  } rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-civic-500 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-civic-50 text-civic-800 shadow-2xs font-bold border border-civic-200/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`${isIndic ? 'w-3 h-3 xl:w-3.5 xl:h-3.5' : 'w-3.5 h-3.5'} shrink-0 ${isActive ? 'text-civic-700' : 'text-slate-500'}`} />
                  <span>
                    {item.id === 'eligibility' && isTamil ? (
                      <>
                        <span>தகுதி</span>
                        <span className="hidden xl:inline"> சரிபார்ப்பு</span>
                      </>
                    ) : (
                      item.label
                    )}
                  </span>
                  {item.badge !== undefined && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[8px] xl:text-[9px] font-bold bg-emerald-100 text-emerald-800">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-1.5 right-1.5 h-0.5 bg-civic-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Top Right: Language Switcher, Kiosk Mode, End Session & Mobile Menu Toggle */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
            {/* Official Indian Governance / myScheme-Style Language Option */}
            <LanguageSelector variant="header" />

            {/* Ephemeral Public Kiosk Mode Toggle */}
            <button
              type="button"
              onClick={onToggleKioskMode}
              className={`h-7 xl:h-8 px-2 xl:px-2.5 rounded-lg ${
                isIndic ? 'text-[11px] xl:text-xs' : 'text-xs'
              } font-semibold inline-flex items-center gap-1 xl:gap-1.5 border transition-all focus:outline-none focus:ring-2 focus:ring-civic-500 shrink-0 ${
                isKioskMode
                  ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs hover:bg-amber-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title={
                isKioskMode
                  ? t.header.kioskActiveTooltip
                  : t.header.kioskOffTooltip
              }
              aria-pressed={isKioskMode}
            >
              <Monitor className={`w-3 h-3 xl:w-3.5 xl:h-3.5 shrink-0 ${isKioskMode ? 'text-amber-800' : 'text-slate-500'}`} />
              <span className={isIndic ? 'hidden 2xl:inline' : 'hidden xl:inline'}>{t.header.kioskMode}</span>
              <span className={isKioskMode ? 'font-bold text-amber-900' : ''}>
                {isKioskMode ? t.header.active : t.header.off}
              </span>
            </button>

            {/* Clear Profile / End Session */}
            <button
              ref={triggerButtonRef}
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className={`h-7 xl:h-8 px-2 xl:px-2.5 rounded-lg ${
                isIndic ? 'text-[11px] xl:text-xs' : 'text-xs'
              } font-semibold inline-flex items-center gap-1 xl:gap-1.5 border border-rose-200 text-rose-700 bg-white hover:bg-rose-50 hover:border-rose-300 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs shrink-0 cursor-pointer`}
              title={t.header.endSessionTooltip}
              aria-label={t.header.endSession}
            >
              <Trash2 className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-rose-600 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">{t.header.endSession}</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-8 w-8 inline-flex items-center justify-center p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-civic-500 shrink-0"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 px-3 border-t border-slate-200 space-y-2 bg-white shadow-xl max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* Challenge badge on mobile drawer */}
            <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">{t.header.challengeBadge}</span>
              <span className="text-[10px] text-amber-700 font-semibold">{t.header.civicDossier}</span>
            </div>

            {/* Mobile Language Switcher with official myScheme branding */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.header.languageSelect}</span>
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  myScheme
                </span>
              </div>
              <LanguageSelector variant="mobile" />
            </div>

            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500 ${
                      isActive
                        ? 'bg-civic-50 text-civic-800 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-civic-700' : 'text-slate-500'}`} />
                      <span>{item.mobileLabel || item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Session Controls */}
            <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">{t.header.kioskMode}</span>
                  <span className="text-[11px] text-slate-500">
                    {isKioskMode ? t.header.volatileSession : t.header.standardSession}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onToggleKioskMode}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    isKioskMode
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {isKioskMode ? t.header.active : t.header.off}
                </button>
              </div>

              {/* Clear Profile / End Session */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowClearConfirm(true);
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>{t.header.endSession}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clear Profile / End Session Confirmation Modal */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-session-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 id="clear-session-title" className="text-base font-bold text-slate-900">
                  {t.header.endSessionDialogTitle}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {t.header.endSessionDialogDesc}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
              <p>• Removes <code>sevaiq_citizen_profile</code></p>
              <p>• Resets all document possession indicators</p>
              <p>• Restores the application to an empty starting state</p>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-500"
              >
                {t.header.cancelKeepSession}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {t.header.confirmEndSession}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
