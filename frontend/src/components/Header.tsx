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
  Mic,
  ListChecks,
  ChevronDown,
} from 'lucide-react';
import { ApiState, NavigationTab } from '../types';

interface HeaderProps {
  apiState?: ApiState;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onRefreshHealth?: () => void;
  eligibleCount?: number;
  isKioskMode: boolean;
  onToggleKioskMode: () => void;
  onClearSession: () => void;
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
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const moreDropdownRef = useRef<HTMLDivElement | null>(null);

  const primaryNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'discover', label: 'Schemes', mobileLabel: 'Find Schemes', description: 'Bilingual AI-powered scheme discovery', icon: Compass },
    { id: 'eligibility', label: 'Eligibility', mobileLabel: 'Explainable Eligibility', description: 'Statutory criteria evaluation engine', icon: CheckSquare, badge: eligibleCount > 0 ? eligibleCount : undefined },
    { id: 'document-mapper', label: 'Documents', mobileLabel: 'Document Synergy Mapper', description: 'Cross-scheme certificate deduplication', icon: Files },
    { id: 'readiness-passport', label: 'Passport', mobileLabel: 'Readiness Passport', description: 'Civic entitlement application dossier', icon: Award },
  ];

  const secondaryNavItems: NavItem[] = [
    { id: 'voice-assistant', label: 'Voice AI', mobileLabel: 'Tamil & English Voice Assistant', description: 'Accessible in-browser voice query engine', icon: Mic },
    { id: 'trust-monitor', label: 'Trust', mobileLabel: 'Official Source Trust Monitor', description: 'Government domain & gazette audits', icon: ShieldCheck },
    { id: 'application-tracker', label: 'Guidance', mobileLabel: 'Application Guidance Tracker', description: 'Step-by-step submission checklist', icon: ListChecks },
  ];

  const allNavItems: NavItem[] = [...primaryNavItems, ...secondaryNavItems];
  const isMoreActive = secondaryNavItems.some((item) => item.id === activeTab);

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
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

  // Close "More Tools" dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    if (moreDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [moreDropdownOpen]);

  // Global Escape key listener for open modals/menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (moreDropdownOpen) setMoreDropdownOpen(false);
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moreDropdownOpen, mobileMenuOpen]);

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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Identity - Semantic Button with perfectly aligned icon, wordmark, and tagline */}
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center space-x-3 text-left group focus:outline-none focus:ring-2 focus:ring-civic-500 rounded-2xl p-1 shrink-0"
            aria-label="SevAIQ Home Dashboard"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-blue-800 via-civic-700 to-indigo-900 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none">
                  Sev<span className="text-civic-600">AI</span>Q
                </span>
                <span className="hidden 2xl:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80 leading-none shrink-0 tracking-wide">
                  Seva First 2026
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium whitespace-nowrap mt-1 leading-none hidden sm:block">
                Civic Intelligence &amp; Scheme Readiness
              </p>
            </div>
          </button>

          {/* Desktop Navigation - Centered, comfortable padding, non-cramped */}
          <nav
            className="hidden lg:flex items-center justify-center flex-1 mx-3 xl:mx-6 space-x-1"
            aria-label="Main Navigation"
          >
            {/* Primary workflow destinations */}
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center space-x-1.5 px-2.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-civic-500 whitespace-nowrap ${
                    isActive
                      ? 'bg-civic-50 text-civic-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-civic-700' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-civic-600 rounded-full" />
                  )}
                </button>
              );
            })}

            {/* Specialized Tools tabs: inline on wide screens (>= 1280px / xl) */}
            <div className="hidden xl:flex items-center space-x-1">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex items-center space-x-1.5 px-2.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-civic-500 whitespace-nowrap ${
                      isActive
                        ? 'bg-civic-50 text-civic-800 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-civic-700' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-civic-600 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Overflow Dropdown for Medium Screens (1024px - 1279px) */}
            <div className="relative xl:hidden" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                aria-expanded={moreDropdownOpen}
                aria-haspopup="true"
                className={`relative flex items-center space-x-1 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-civic-500 whitespace-nowrap ${
                  isMoreActive
                    ? 'bg-civic-50 text-civic-800 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>More Tools</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreDropdownOpen ? 'rotate-180' : ''}`} />
                {isMoreActive && (
                  <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-civic-600 rounded-full" />
                )}
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Civic Intelligence Tools
                  </div>
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          handleNavClick(item.id);
                          setMoreDropdownOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 text-xs font-semibold text-left transition-colors ${
                          isActive
                            ? 'bg-civic-50 text-civic-800 font-bold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-civic-100 text-civic-700' : 'bg-slate-100 text-slate-500'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{item.mobileLabel || item.label}</div>
                          <div className="text-[10px] text-slate-500 font-normal leading-tight">{item.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Controls: Kiosk Mode, Clear Profile & Mobile Toggle - Exact same height & centerline */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Ephemeral Public Kiosk Mode Toggle */}
            <button
              type="button"
              onClick={onToggleKioskMode}
              className={`h-9 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border transition-all focus:outline-none focus:ring-2 focus:ring-civic-500 shrink-0 ${
                isKioskMode
                  ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs hover:bg-amber-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title={
                isKioskMode
                  ? 'Public Kiosk Mode is Active: Session profile data exists in memory only'
                  : 'Toggle Public Kiosk Mode for shared devices'
              }
              aria-pressed={isKioskMode}
            >
              <Monitor className={`w-3.5 h-3.5 ${isKioskMode ? 'text-amber-800' : 'text-slate-500'}`} />
              <span className="hidden md:inline">Kiosk Mode:</span>
              <span className={isKioskMode ? 'font-bold text-amber-900' : ''}>
                {isKioskMode ? 'Active' : 'Off'}
              </span>
            </button>

            {/* Clear Profile / End Session */}
            <button
              ref={triggerButtonRef}
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="h-9 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 shrink-0"
              title="Clear all demographic answers and document statuses from this device"
              aria-label="Clear profile and end session"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">End Session</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-civic-500 shrink-0"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 px-3 border-t border-slate-200 space-y-1 bg-white shadow-xl max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* Challenge badge on mobile drawer */}
            <div className="px-3 py-2 mb-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">Seva First Innovation Challenge 2026</span>
              <span className="text-[10px] text-amber-700 font-semibold">Civic Dossier</span>
            </div>

            <div className="space-y-1">
              {allNavItems.map((item) => {
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
                  <span className="font-semibold text-slate-800 block">Public Kiosk Mode</span>
                  <span className="text-[11px] text-slate-500">
                    {isKioskMode ? 'Volatile in-memory session' : 'Standard local session'}
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
                  {isKioskMode ? 'Active (Turn Off)' : 'Off (Turn On)'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowClearConfirm(true);
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>End Session &amp; Clear Profile</span>
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
                  End Session &amp; Clear Profile?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  This will immediately erase your profile demographic answers, document checklist statuses,
                  and selected schemes from this computer.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
              <p>• Removes <code>sevaiq_citizen_profile</code> from storage</p>
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
                Cancel
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
