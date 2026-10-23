import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Search,
  ArrowRight,
  ChevronDown,
  Sun,
  UserCheck,
  Fingerprint,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import { ApiState, NavigationTab, Scheme, CitizenProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';

// High-fidelity SVG of the State Emblem of India (Ashoka Lion Capital)
export const EmblemOfIndia: React.FC<{ className?: string }> = ({ className = 'w-8 h-10' }) => (
  <svg
    viewBox="0 0 100 135"
    fill="currentColor"
    className={className}
    aria-label="State Emblem of India"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fillRule="evenodd" clipRule="evenodd">
      {/* Central Lion Head & Mane */}
      <path d="M50 7c-7.5 0-12 5.5-12 12 0 4.2 2.2 8.5 5.5 10.5-1.2 2-2.2 4.2-2.2 7.5 0 5.2 4.2 9.5 9.5 9.5s9.5-4.3 9.5-9.5c0-3.3-1-5.5-2.2-7.5 3.3-2 5.5-6.3 5.5-10.5 0-6.5-4.5-12-11.6-12zm-4.2 13.8c0-2.2 2.2-4.2 4.2-4.2s4.2 2 4.2 4.2c0 3.2-4.2 6.4-4.2 6.4s-4.2-3.2-4.2-6.4z" />
      {/* Left Lion */}
      <path d="M27.5 16.5c-5.5 0-9.5 4.3-9.5 9.5 0 3.3 2.2 6.4 4.3 8.5-1.1 2.2-1.1 4.3-1.1 6.4 0 5.3 3.2 8.5 7.4 8.5s7.4-3.2 7.4-8.5c0-2.1-1.1-4.2-1.1-6.4 2.1-2.1 4.3-5.2 4.3-8.5 0-5.2-4.2-9.5-11.7-9.5zm-3.2 10.6c0-2.1 2.1-3.2 3.2-3.2s3.2 1.1 3.2 3.2c0 2.1-3.2 5.3-3.2 5.3s-3.2-3.2-3.2-5.3z" />
      {/* Right Lion */}
      <path d="M72.5 16.5c-7.4 0-11.7 4.3-11.7 9.5 0 3.3 2.2 6.4 4.3 8.5-1.1 2.2-1.1 4.3-1.1 6.4 0 5.3 3.2 8.5 7.4 8.5s7.4-3.2 7.4-8.5c0-2.1 0-4.2-1.1-6.4 2.1-2.1 4.3-5.2 4.3-8.5 0-5.2-4.2-9.5-9.5-9.5zm-1.1 10.6c0-2.1 2.1-3.2 3.2-3.2s3.2 1.1 3.2 3.2c0 2.1-3.2 5.3-3.2 5.3s-3.2-3.2-3.2-5.3z" />
      {/* Upper Torso */}
      <path d="M35.5 47c-2.1 4.2-5.3 9.5-5.3 16h39.6c0-6.5-3.2-11.8-5.3-16-4.2 2.1-9.5 3.2-14.5 3.2s-10.3-1.1-14.5-3.2z" />
      <path d="M19.5 49c-3.2 4.2-5.3 9.5-4.2 14h12.7c1.1-4.2 3.2-8.5 5.3-11.7-5.3-1.1-10.6-1.1-13.8-2.3z" />
      <path d="M80.5 49c-3.2 1.2-8.5 1.2-13.8 2.3 2.1 3.2 4.2 7.5 5.3 11.7h12.7c1.1-4.5-1-9.8-4.2-14z" />
      {/* Front Paws & Legs */}
      <path d="M33 65h6v21h-6zm12 0h6v21h-6zm16 0h6v21h-6zm-38 0h6v19h-6zm54 0h6v19h-6z" />
      {/* Abacus Platform */}
      <rect x="11" y="87" width="78" height="6.5" rx="1.5" />
      {/* Central Ashoka Chakra */}
      <circle cx="50" cy="100.5" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="100.5" r="2.2" />
      <path d="M50 92v17M41.5 100.5h17M44 94.5l12 12M56 94.5L44 106.5" stroke="currentColor" strokeWidth="0.8" />
      {/* Flanking Carvings */}
      <path d="M23 96.5c3.2 0 5.3 2.1 6.4 4.2s-2.1 5.3-6.4 5.3c-3.2 0-5.3-2.1-5.3-4.2s2.1-5.3 5.3-5.3zm54 0c3.2 0 5.3 2.1 6.4 4.2s-2.1 5.3-6.4 5.3c-3.2 0-5.3-2.1-5.3-4.2s2.1-5.3 5.3-5.3z" opacity="0.8" />
      {/* Lower Platform */}
      <rect x="7" y="110.5" width="86" height="5.5" rx="1.5" />
      {/* Lotus Profile Base */}
      <path d="M13 117.5c4.2 6.4 19 10.5 37 10.5s32.8-4.1 37-10.5H13z" />
      {/* Inscription Base */}
      <rect x="20" y="129.5" width="60" height="4.5" rx="1.2" />
    </g>
  </svg>
);

// High-fidelity SVG of the Digital India logo
export const DigitalIndiaLogo: React.FC<{ className?: string }> = ({ className = 'h-8 sm:h-9 w-auto' }) => (
  <div className={`flex items-center gap-1.5 ${className}`} aria-label="Digital India - Power To Empower">
    {/* Swirl Graphic */}
    <svg viewBox="0 0 48 48" className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Saffron Ribbon */}
      <path d="M13 10C23 6 35 10 39 18C35 16 27 14 19 18C13 21 11 14 13 10Z" fill="#F97316" />
      {/* Blue Swirl */}
      <path d="M7 24C11 14 25 12 35 18C41 22 41 30 35 34C29 38 17 36 13 28C11 24 5 28 7 24Z" fill="#0284C7" />
      {/* Green Ribbon */}
      <path d="M13 38C21 42 33 38 37 30C33 32 25 34 17 30C11 27 9 34 13 38Z" fill="#16A34A" />
      {/* Central Spark */}
      <circle cx="25" cy="24" r="2.8" fill="#FFFFFF" />
    </svg>
    {/* Text */}
    <div className="flex flex-col justify-center leading-none">
      <div className="flex items-baseline text-[12px] sm:text-[13px] font-black tracking-tight">
        <span className="text-sky-700">Digital</span>
        <span className="text-amber-600 ml-0.5">India</span>
      </div>
      <span className="text-[7px] sm:text-[7.5px] font-medium text-slate-500 tracking-tight mt-0.5">
        Power To Empower
      </span>
    </div>
  </div>
);

export interface HeaderProps {
  apiState?: ApiState;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onRefreshHealth?: () => void;
  eligibleCount?: number;
  isKioskMode: boolean;
  onToggleKioskMode: () => void;
  onClearSession: () => void;
  schemes?: Scheme[];
  onSelectSchemeForEligibility?: (schemeId: string) => void;
  onSearch?: (query: string) => void;
  onPreFillDemoProfile?: () => void;
  profile?: CitizenProfile;
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
  isKioskMode,
  onToggleKioskMode,
  onClearSession,
  schemes = [],
  onSelectSchemeForEligibility,
  onSearch,
  onPreFillDemoProfile,
  profile,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { toggleInvertColors } = useAccessibility();
  const isIndic = language === 'ta' || language === 'hi';
  const isTamil = isIndic;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const langDropdownRef = useRef<HTMLDivElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: t.header.dashboard, icon: LayoutDashboard },
    { id: 'discover', label: t.header.schemes, mobileLabel: t.header.schemesMobile, description: t.header.schemesDesc, icon: Compass },
    { id: 'eligibility', label: t.header.eligibility, mobileLabel: t.header.eligibilityMobile, description: t.header.eligibilityDesc, icon: CheckSquare, badge: eligibleCount > 0 ? eligibleCount : undefined },
    { id: 'document-mapper', label: t.header.documents, mobileLabel: t.header.documentsMobile, description: t.header.documentsDesc, icon: Files },
    { id: 'readiness-passport', label: t.header.passport, mobileLabel: t.header.passportMobile, description: t.header.passportDesc, icon: Award },
    { id: 'trust-monitor', label: t.header.trust, mobileLabel: t.header.trustMobile, description: t.header.trustDesc, icon: ShieldCheck },
    { id: 'application-tracker', label: t.header.guidance, mobileLabel: t.header.guidanceMobile, description: t.header.guidanceDesc, icon: ListChecks },
  ];

  // Filter schemes matching search query for live dropdown
  const matchingSchemes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || schemes.length === 0) return [];
    return schemes
      .filter((s) => {
        const titleMatch = s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
        const catMatch = s.category ? s.category.toLowerCase().includes(q) : false;
        const ministryMatch = s.ministry ? s.ministry.toLowerCase().includes(q) : false;
        return titleMatch || catMatch || ministryMatch;
      })
      .slice(0, 5);
  }, [searchQuery, schemes]);

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

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    setShowSearchDropdown(false);
    if (onSearch) {
      onSearch(query);
    }
    onSelectTab('discover');
  };

  const handleSelectSchemeResult = (schemeId: string) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    if (onSelectSchemeForEligibility) {
      onSelectSchemeForEligibility(schemeId);
    } else {
      onSelectTab('eligibility');
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Escape key listener for open modals/menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) setMobileMenuOpen(false);
        if (langDropdownOpen) setLangDropdownOpen(false);
        if (showSearchDropdown) setShowSearchDropdown(false);
        if (showSignInModal) setShowSignInModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, langDropdownOpen, showSearchDropdown, showSignInModal]);

  // Keyboard navigation, Escape dismissal, and focus trap for the End Session dialog
  useEffect(() => {
    if (showClearConfirm) {
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleCloseModal();
          return;
        }

        if (e.key === 'Tab') {
          const cancelBtn = cancelButtonRef.current;
          const confirmBtn = confirmButtonRef.current;
          if (!cancelBtn || !confirmBtn) return;

          if (e.shiftKey) {
            if (document.activeElement === cancelBtn) {
              e.preventDefault();
              confirmBtn.focus();
            }
          } else {
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
      {/* Row 1: Official National Portal Header (Matches myscheme.gov.in reference) */}
      <div className="w-full px-3 sm:px-5 lg:px-6 xl:px-8 border-b border-slate-100">
        <div className="flex items-center justify-between h-16 sm:h-[4.25rem] gap-2 lg:gap-4">
          {/* Left: Emblem of India + myScheme/SevAIQ Logo + Digital India Logo */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            {/* National Emblem of India */}
            <div className="text-slate-800 shrink-0" title="Government of India / भारत सरकार">
              <EmblemOfIndia className="w-7 h-9 sm:w-8 sm:h-10" />
            </div>

            {/* Portal Logo: myScheme + SevAIQ subtitle */}
            <button
              type="button"
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center text-left group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-0.5"
              aria-label="myScheme SevAIQ - Civic Intelligence & Scheme Readiness Platform"
            >
              <div className="flex flex-col justify-center">
                <div className="flex items-center text-xl sm:text-2xl font-black tracking-tight leading-none">
                  <span className="text-emerald-700">my</span>
                  <span className="text-slate-900">Scheme</span>
                </div>
                <span className="text-[8px] sm:text-[9.5px] font-bold text-slate-500 tracking-wider uppercase leading-none mt-1">
                  Sev<span className="text-civic-600">AI</span>Q Civic Engine
                </span>
              </div>
            </button>

            {/* Divider */}
            <div className="hidden md:block h-7 w-px bg-slate-200 shrink-0" />

            {/* Digital India Official Logo */}
            <div className="hidden md:flex shrink-0">
              <DigitalIndiaLogo className="h-8 sm:h-9" />
            </div>
          </div>

          {/* Center: Search Bar ("Enter scheme name to search... 🔍") */}
          <div
            ref={searchContainerRef}
            className="relative flex-1 max-w-md xl:max-w-lg min-w-0 mx-1 sm:mx-3"
          >
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder={t.header.searchPlaceholder || 'Enter scheme name to search...'}
                aria-label={t.header.searchPlaceholder || 'Enter scheme name to search...'}
                className="w-full h-9 sm:h-10 pl-3.5 pr-10 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-2xs transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 p-1.5 text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                title="Search schemes"
                aria-label="Submit search"
              >
                <Search className="w-4 h-4 stroke-[2.2]" />
              </button>
            </form>

            {/* Live Autocomplete Results Dropdown */}
            {showSearchDropdown && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 max-h-80 overflow-y-auto">
                {matchingSchemes.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Matching Schemes ({matchingSchemes.length})
                    </div>
                    {matchingSchemes.map((scheme) => (
                      <button
                        key={scheme.id}
                        type="button"
                        onClick={() => handleSelectSchemeResult(scheme.id)}
                        className="w-full px-3.5 py-2 text-left hover:bg-emerald-50/70 transition-colors flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 truncate">
                            {scheme.title}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {scheme.category || scheme.ministry}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 shrink-0 inline-flex items-center gap-0.5">
                          Check <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className="w-full px-3.5 py-2 text-center text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      {t.header.viewAllSchemes || 'View all search results'} &quot;{searchQuery}&quot; →
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-3 text-center text-xs text-slate-500">
                    {t.header.noSchemesFound || 'No schemes match your search query'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Options: Sign In -> | Language Selector (A/अ English ▾) | Theme Mode (☀️) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* 1. "Sign In ->" Green Pill Button */}
            <button
              type="button"
              onClick={() => setShowSignInModal(true)}
              className="h-8 sm:h-9 px-3 sm:px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0 cursor-pointer"
              aria-label="Sign In"
            >
              <span>{t.header.signIn || 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            {/* 2. Language Selector Dropdown: A/अ English ▾ */}
            <div className="relative shrink-0" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="h-8 sm:h-9 px-2 sm:px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-emerald-700 font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0 cursor-pointer"
                aria-label="Select website language"
                aria-expanded={langDropdownOpen}
              >
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[9px] font-black flex items-center justify-center tracking-tighter shrink-0">
                  A/अ
                </span>
                <span className="font-semibold text-emerald-800 hidden sm:inline">
                  {language === 'ta' ? 'தமிழ்' : language === 'hi' ? 'हिंदी' : 'English'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
              </button>

              {/* Language Dropdown Menu */}
              {langDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('en');
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between ${
                      language === 'en'
                        ? 'text-emerald-800 bg-emerald-50 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>English</span>
                    {language === 'en' && <span className="text-emerald-700 font-bold">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('ta');
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between ${
                      language === 'ta'
                        ? 'text-emerald-800 bg-emerald-50 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>தமிழ்</span>
                    {language === 'ta' && <span className="text-emerald-700 font-bold">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('hi');
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between ${
                      language === 'hi'
                        ? 'text-emerald-800 bg-emerald-50 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>हिंदी</span>
                    {language === 'hi' && <span className="text-emerald-700 font-bold">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* 3. Theme / Display Mode Dark Square Button with Sun Icon */}
            <button
              type="button"
              onClick={toggleInvertColors}
              className="h-8 sm:h-9 w-8 sm:w-9 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-black text-amber-300 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-slate-700 shadow-2xs shrink-0 cursor-pointer"
              title={t.header.themeTooltip || 'Toggle High Contrast / Theme Mode'}
              aria-label={t.header.themeTooltip || 'Toggle High Contrast / Theme Mode'}
            >
              <Sun className="w-4 h-4 text-amber-300 stroke-[2.2]" />
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-8 w-8 inline-flex items-center justify-center p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Navigation Bar (All Portal Tabs & Kiosk/Session Controls) */}
      <div className="w-full px-2 sm:px-4 lg:px-5 xl:px-6 2xl:px-8 bg-slate-50/70 border-t border-slate-100">
        <div className="flex items-center justify-between min-h-[2.5rem] sm:min-h-[2.75rem] py-1 w-full gap-2">
          {/* Navigation Links Aligned in Center/Left */}
          <nav
            className="hidden lg:flex items-center justify-start flex-1 min-w-0 gap-0.5 xl:gap-1 2xl:gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5"
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
                    isTamil
                      ? 'gap-1 xl:gap-1.5 px-1.5 py-1 xl:px-2 xl:py-1.5 2xl:px-2.5 text-[11px] xl:text-xs font-semibold'
                      : 'gap-1.5 px-2 py-1 xl:px-2.5 xl:py-1.5 text-xs font-semibold'
                  } rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-bold border border-emerald-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon
                    className={`${
                      isTamil ? 'w-3 h-3 xl:w-3.5 xl:h-3.5' : 'w-3.5 h-3.5'
                    } shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}
                  />
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
                    <span className="absolute bottom-0 left-1.5 right-1.5 h-0.5 bg-emerald-700 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls in Sub-Navbar: Kiosk Mode & End Session */}
          <div className="hidden sm:flex items-center justify-end gap-1.5 shrink-0 ml-auto">
            {/* Ephemeral Public Kiosk Mode Toggle */}
            <button
              type="button"
              onClick={onToggleKioskMode}
              className={`h-7 px-2 xl:px-2.5 rounded-lg ${
                isTamil ? 'text-[11px] xl:text-xs' : 'text-xs'
              } font-semibold inline-flex items-center gap-1 xl:gap-1.5 border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0 ${
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
              <Monitor
                className={`w-3 h-3 xl:w-3.5 xl:h-3.5 shrink-0 ${
                  isKioskMode ? 'text-amber-800' : 'text-slate-500'
                }`}
              />
              <span className={isTamil ? 'hidden 2xl:inline' : 'hidden xl:inline'}>
                {t.header.kioskMode}
              </span>
              <span className={isKioskMode ? 'font-bold text-amber-900' : ''}>
                {isKioskMode ? t.header.active : t.header.off}
              </span>
            </button>

            {/* Clear Profile / End Session */}
            <button
              ref={triggerButtonRef}
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className={`h-7 px-2 xl:px-2.5 rounded-lg ${
                isTamil ? 'text-[11px] xl:text-xs' : 'text-xs'
              } font-semibold inline-flex items-center gap-1 xl:gap-1.5 border border-rose-200 text-rose-700 bg-white hover:bg-rose-50 hover:border-rose-300 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs shrink-0 cursor-pointer`}
              title={t.header.endSessionTooltip}
              aria-label={t.header.endSession}
            >
              <Trash2 className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-rose-600 shrink-0" />
              <span className="whitespace-nowrap">{t.header.endSession}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden py-4 px-3 border-t border-slate-200 space-y-3 bg-white shadow-xl max-h-[calc(100vh-5rem)] overflow-y-auto">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.header.searchPlaceholder || 'Enter scheme name to search...'}
              className="w-full h-10 pl-3 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 p-1 text-slate-500"
              aria-label="Submit mobile search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Sign In Banner for Mobile */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setShowSignInModal(true);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>{t.header.signIn || 'Sign In to Citizen Portal'}</span>
            </div>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Mobile Language Switcher */}
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[8px] font-bold flex items-center justify-center">
                A
              </span>
              <span>{t.header.languageSelect}</span>
            </span>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
                  language === 'en'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ta')}
                className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
                  language === 'ta'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                தமிழ்
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
                  language === 'hi'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

          {/* Navigation Items */}
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
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    />
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

      {/* Citizen Sign In / DigiLocker / Profile Modal */}
      {showSignInModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="citizen-signin-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSignInModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="citizen-signin-title" className="text-base sm:text-lg font-bold text-slate-900">
                    {t.header.signInDialogTitle || 'Citizen Sign In & Identity'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.header.signInDialogDesc ||
                      'Sign in to access your personalized scheme readiness passport and save your document eligibility status.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSignInModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Active Session Status if profile exists */}
            {profile && profile.age > 0 && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-1">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                  {t.header.currentSession || 'Active Citizen Profile'}
                </span>
                <p className="text-xs text-emerald-800">
                  Age: <span className="font-semibold">{profile.age}</span> | Gender:{' '}
                  <span className="font-semibold">{profile.gender}</span> | State:{' '}
                  <span className="font-semibold">{profile.state}</span> | Category:{' '}
                  <span className="font-semibold">{profile.socialCategory}</span>
                </p>
              </div>
            )}

            {/* Sign In Options */}
            <div className="space-y-2.5">
              {/* DigiLocker Official Access */}
              <button
                type="button"
                onClick={() => {
                  if (onPreFillDemoProfile) onPreFillDemoProfile();
                  setShowSignInModal(false);
                }}
                className="w-full p-3.5 rounded-2xl border border-sky-200 bg-sky-50/50 hover:bg-sky-50 hover:border-sky-300 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-sky-800">
                      {t.header.digiLockerSignIn || 'Sign In with DigiLocker'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {t.header.digiLockerDesc || 'Government of India digital document repository'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Mobile OTP Authentication */}
              <button
                type="button"
                onClick={() => {
                  if (onPreFillDemoProfile) onPreFillDemoProfile();
                  setShowSignInModal(false);
                }}
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-slate-800">
                      {t.header.mobileOtpSignIn || 'Sign In with Mobile OTP'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {t.header.mobileOtpDesc || 'Instant SMS verification on registered mobile number'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Demo Profile Sign In */}
              <button
                type="button"
                onClick={() => {
                  if (onPreFillDemoProfile) onPreFillDemoProfile();
                  setShowSignInModal(false);
                }}
                className="w-full p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                      {t.header.demoProfileSignIn || 'Quick Demo Citizen Profile'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {t.header.demoProfileDesc || 'One-click load: Raman (Marginal Farmer, Rural TN)'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowSignInModal(false);
                  setShowClearConfirm(true);
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                {t.header.endSession}
              </button>
              <button
                type="button"
                onClick={() => setShowSignInModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                {t.header.close || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
