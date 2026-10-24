import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Menu,
  X,
  Compass,
  Files,
  Award,
  LayoutDashboard,
  Monitor,
  Trash2,
  ListChecks,
  Globe,
  MessageSquare,
  Sun,
  Moon,
  User,
  ChevronDown,
} from 'lucide-react';
import { ApiState, NavigationTab } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageSelector } from './LanguageSelector';
import { KioskConfirmationDialog } from './KioskDialogs';

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
  const { isDark, toggleTheme } = useTheme();
  const isIndic = language === 'ta' || language === 'hi';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showKioskConfirm, setShowKioskConfirm] = useState(false);

  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  const primaryJourneyItems: NavItem[] = [
    { id: 'chat', label: t.header.chat, mobileLabel: t.header.chatMobile, description: t.header.chatDesc, icon: MessageSquare },
    { id: 'eligibility', label: t.header.details || '1. Your Details', mobileLabel: t.header.detailsMobile || '1. Details', description: t.header.detailsDesc, icon: User, badge: eligibleCount > 0 ? eligibleCount : undefined },
    { id: 'discover', label: t.header.findSchemes || '2. Find Schemes', mobileLabel: t.header.findSchemesMobile || '2. Schemes', description: t.header.findSchemesDesc, icon: Compass },
    { id: 'document-mapper', label: t.header.prepareDocs || '3. Prepare Documents', mobileLabel: t.header.prepareDocsMobile || '3. Documents', description: t.header.prepareDocsDesc, icon: Files },
    { id: 'application-tracker', label: t.header.trackApp || '4. Track Application', mobileLabel: t.header.trackAppMobile || '4. Tracking', description: t.header.trackAppDesc, icon: ListChecks },
  ];

  const secondaryTools: NavItem[] = [
    { id: 'dashboard', label: t.header.dashboard, icon: LayoutDashboard },
    { id: 'readiness-passport', label: t.header.passport, mobileLabel: t.header.passportMobile, description: t.header.passportDesc, icon: Award },
    { id: 'trust-monitor', label: t.header.trust, mobileLabel: t.header.trustMobile, description: t.header.trustDesc, icon: ShieldCheck },
  ];

  const isSecondaryActive = secondaryTools.some((t) => t.id === activeTab);

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
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

  // Global Escape key & outside click listener for open modals/menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) setMobileMenuOpen(false);
        if (moreMenuOpen) setMoreMenuOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen, moreMenuOpen]);

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
    <header className="sticky top-0 z-50 bg-white dark:bg-[#0f2133] border-b border-[#D7DEE5] dark:border-[#223b56] shadow-xs w-full transition-colors duration-150">
      <div className="w-full px-2 sm:px-4 lg:px-5 xl:px-6 2xl:px-8">
        <div className="flex items-center justify-between min-h-[3.75rem] sm:min-h-[4.25rem] py-1 sm:py-1.5 w-full gap-1.5 sm:gap-2 lg:gap-3">
          {/* Top Left: Official SevAIQ Logo */}
          <div className="flex items-center shrink-0 pr-1">
            <button
              type="button"
              onClick={() => handleNavClick('chat')}
              className="flex items-center group focus:outline-none focus:ring-2 focus:ring-[#16733B] rounded-lg p-0.5 sm:p-1 transition-opacity hover:opacity-90 cursor-pointer"
              aria-label="SevAIQ - Civic Intelligence & AI Assistant"
            >
              <img
                src="/sevaiq-logo.png"
                alt="SevAIQ"
                className="h-8 sm:h-9 xl:h-10 w-auto max-w-[130px] sm:max-w-[150px] xl:max-w-[170px] object-contain shrink-0 sevaiq-header-logo transition-transform group-hover:scale-[1.02]"
              />
            </button>
          </div>

          {/* Center: Primary Citizen Journey (4 Stages + Chat) & More Tools */}
          <nav
            className="hidden lg:flex items-center justify-center flex-1 min-w-0 mx-1 lg:mx-2 gap-0.5 xl:gap-1 2xl:gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1"
            aria-label="Main Navigation"
          >
            {primaryJourneyItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'discover' && activeTab === 'demographic-profile');
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
                  } rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#16733B] whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-civic-50 text-civic-800 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-2xs font-bold border border-emerald-200/60 dark:border-emerald-800/40'
                      : 'text-[#596775] dark:text-slate-300 hover:text-[#17324D] dark:hover:text-white hover:bg-[#F5F7F8] dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`${isIndic ? 'w-3 h-3 xl:w-3.5 xl:h-3.5' : 'w-3.5 h-3.5'} shrink-0 ${isActive ? 'text-[#16733B] dark:text-emerald-400' : 'text-[#596775] dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[8px] xl:text-[9px] font-bold bg-[#EDF6EF] dark:bg-emerald-950/80 text-[#16733B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-1.5 right-1.5 h-0.5 bg-[#16733B] dark:bg-emerald-400 rounded-full" />
                  )}
                </button>
              );
            })}

            {/* Clean Secondary Tools Menu Dropdown */}
            <div className="relative shrink-0" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setMoreMenuOpen((prev) => !prev)}
                aria-expanded={moreMenuOpen}
                aria-haspopup="true"
                className={`relative flex items-center gap-1 px-2 py-1 xl:px-2.5 xl:py-1.5 text-xs font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#16733B] whitespace-nowrap ${
                  isSecondaryActive
                    ? 'bg-civic-50 text-civic-800 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-2xs font-bold border border-emerald-200/60 dark:border-emerald-800/40'
                    : 'text-[#596775] dark:text-slate-300 hover:text-[#17324D] dark:hover:text-white hover:bg-[#F5F7F8] dark:hover:bg-slate-800/60'
                }`}
              >
                <span>{t.header.moreTools || 'More'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
                {isSecondaryActive && (
                  <span className="absolute bottom-0 left-1.5 right-1.5 h-0.5 bg-[#16733B] dark:bg-emerald-400 rounded-full" />
                )}
              </button>

              <div className={`absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-[#17324D] rounded-xl shadow-lg border border-[#D7DEE5] dark:border-[#223b56] py-1.5 z-50 animate-in fade-in ${moreMenuOpen ? 'block' : 'hidden'}`}>
                <div className="px-3 py-1 text-[10px] font-bold text-[#596775] dark:text-slate-400 uppercase tracking-wider">
                  {language === 'ta' ? 'கூடுதல் கருவிகள்' : language === 'hi' ? 'अन्य विकल्प' : 'Secondary Tools'}
                </div>
                {secondaryTools.map((tool) => {
                  const ToolIcon = tool.icon;
                  const isToolActive = activeTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleNavClick(tool.id)}
                      className={`w-full flex items-center space-x-2 px-3 py-2 text-xs text-left font-medium transition-colors ${
                        isToolActive
                          ? 'bg-[#EDF6EF] dark:bg-[#0F2133] text-[#16733B] dark:text-emerald-300 font-bold'
                          : 'text-[#202B36] dark:text-slate-200 hover:bg-[#F5F7F8] dark:hover:bg-slate-800'
                      }`}
                    >
                      <ToolIcon className="w-3.5 h-3.5 text-[#16733B] dark:text-emerald-400 shrink-0" />
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Top Right: Language Switcher, Theme Mode, Kiosk Mode, End Session & Mobile Menu Toggle */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
            {/* Official Indian Governance / myScheme-Style Language Option */}
            <LanguageSelector variant="header" />

            {/* Professional Theme Toggle: Light / Dark Mode */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`h-7 xl:h-8 px-2 xl:px-2.5 rounded-lg ${
                isIndic ? 'text-[11px] xl:text-xs' : 'text-xs'
              } font-semibold inline-flex items-center gap-1 xl:gap-1.5 border transition-all focus:outline-none focus:ring-2 focus:ring-[#16733B] shrink-0 bg-white dark:bg-[#17324D] text-[#202B36] dark:text-slate-200 border-[#D7DEE5] dark:border-[#223b56] hover:bg-[#F5F7F8] dark:hover:bg-slate-800 shadow-2xs cursor-pointer`}
              title={isDark ? t.header.switchToLight : t.header.switchToDark}
              aria-label={isDark ? t.header.switchToLight : t.header.switchToDark}
              aria-pressed={isDark}
            >
              {isDark ? (
                <Sun className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Moon className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-[#596775] dark:text-slate-300 shrink-0" />
              )}
              <span className={isIndic ? 'hidden 2xl:inline' : 'hidden xl:inline'}>
                {isDark ? t.header.lightMode : t.header.darkMode}
              </span>
            </button>

            {/* Public Kiosk Mode Control with Safe Confirmation */}
            <button
              type="button"
              onClick={() => setShowKioskConfirm(true)}
              className={`h-7 xl:h-8 px-2 xl:px-2.5 rounded-lg ${
                isIndic ? 'text-[11px] xl:text-xs' : 'text-xs'
              } font-semibold inline-flex items-center gap-1 xl:gap-1.5 border transition-all focus:outline-none focus:ring-2 focus:ring-[#16733B] shrink-0 cursor-pointer ${
                isKioskMode
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-700 shadow-2xs hover:bg-amber-200 dark:hover:bg-amber-900'
                  : 'bg-white dark:bg-[#17324D] text-[#202B36] dark:text-slate-200 border-[#D7DEE5] dark:border-[#223b56] hover:bg-[#F5F7F8] dark:hover:bg-slate-800'
              }`}
              title={
                isKioskMode
                  ? t.header.kioskActiveTooltip
                  : t.header.kioskOffTooltip
              }
              aria-label={
                isKioskMode
                  ? 'Public Kiosk Mode: Active. Click to configure or exit.'
                  : 'Configure Public Kiosk Mode for shared computers.'
              }
              aria-pressed={isKioskMode}
            >
              {isKioskMode ? (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              ) : (
                <Monitor className="w-3 h-3 xl:w-3.5 xl:h-3.5 shrink-0 text-[#596775] dark:text-slate-400" />
              )}
              <span className={isIndic ? 'hidden 2xl:inline' : 'hidden xl:inline'}>
                {t.header.publicKioskTitle || t.header.kioskMode}
              </span>
              <span className={isKioskMode ? 'font-bold text-amber-900 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}>
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
              } font-semibold inline-flex items-center gap-1 xl:gap-1.5 border border-rose-200 dark:border-rose-900/70 text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-800 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs shrink-0 cursor-pointer`}
              title={t.header.endSessionTooltip}
              aria-label={t.header.endSession}
            >
              <Trash2 className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">{t.header.endSession}</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-8 w-8 inline-flex items-center justify-center p-1.5 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-civic-500 shrink-0"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 px-3 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-white dark:bg-[#0b162f] shadow-xl max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* Challenge badge on mobile drawer */}
            <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-200">{t.header.challengeBadge}</span>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">{t.header.civicDossier}</span>
            </div>

            {/* Mobile Language Switcher with official myScheme branding */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>{t.header.languageSelect}</span>
                </span>
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  myScheme
                </span>
              </div>
              <LanguageSelector variant="mobile" />
            </div>

            {/* Mobile Theme Mode Toggle */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />}
                <span>{isDark ? t.header.darkMode : t.header.lightMode}</span>
              </span>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs cursor-pointer"
                aria-label={isDark ? t.header.switchToLight : t.header.switchToDark}
              >
                {isDark ? t.header.switchToLight : t.header.switchToDark}
              </button>
            </div>

            <div className="space-y-1">
              <div className="px-3 pt-1 pb-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {language === 'ta' ? 'குடிமக்கள் பயணம் (4 நிலைகள்)' : language === 'hi' ? 'नागरिक यात्रा (4 चरण)' : 'Citizen Journey (4 Stages)'}
              </div>
              {primaryJourneyItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id === 'discover' && activeTab === 'demographic-profile');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500 ${
                      isActive
                        ? 'bg-civic-50 text-civic-800 dark:bg-civic-950/80 dark:text-civic-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-civic-700 dark:text-civic-400' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span>{item.mobileLabel || item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="px-3 pt-3 pb-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {language === 'ta' ? 'கூடுதல் கருவிகள்' : language === 'hi' ? 'अन्य विकल्प' : 'More Tools'}
              </div>
              {secondaryTools.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500 ${
                      isActive
                        ? 'bg-civic-50 text-civic-800 dark:bg-civic-950/80 dark:text-civic-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-civic-700 dark:text-civic-400' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span>{item.mobileLabel || item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mobile Session Controls */}
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">{t.header.publicKioskTitle || t.header.kioskMode}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isKioskMode ? t.header.volatileSession : t.header.standardSession}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowKioskConfirm(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    isKioskMode
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
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
                className="w-full flex items-center justify-center space-x-2 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
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
          <div className="bg-white dark:bg-[#0f1d3c] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 id="clear-session-title" className="text-base font-bold text-slate-900 dark:text-white">
                  {t.header.endSessionDialogTitle}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {t.header.endSessionDialogDesc}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 space-y-1 border border-slate-100 dark:border-slate-800">
              <p>• Removes <code>sevaiq_citizen_profile</code></p>
              <p>• Resets all document possession indicators</p>
              <p>• Restores the application to an empty starting state</p>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-500"
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

      {/* Public Kiosk Mode Confirmation Dialog (Enabling & Disabling) */}
      <KioskConfirmationDialog
        isOpen={showKioskConfirm}
        isEnabling={!isKioskMode}
        onConfirm={() => {
          setShowKioskConfirm(false);
          onToggleKioskMode();
        }}
        onCancel={() => {
          setShowKioskConfirm(false);
        }}
      />
    </header>
  );
};
