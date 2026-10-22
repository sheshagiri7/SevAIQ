import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Menu,
  X,
  Compass,
  CheckSquare,
  Files,
  Award,
  LayoutDashboard,
  Monitor,
  Trash2,
} from 'lucide-react';
import { ApiState, NavigationTab } from '../types';

interface HeaderProps {
  apiState: ApiState;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onRefreshHealth: () => void;
  eligibleCount?: number;
  isKioskMode: boolean;
  onToggleKioskMode: () => void;
  onClearSession: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiState,
  activeTab,
  onSelectTab,
  onRefreshHealth,
  eligibleCount = 0,
  isKioskMode,
  onToggleKioskMode,
  onClearSession,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  const navItems: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'discover', label: 'Find Schemes', icon: Compass },
    { id: 'eligibility', label: 'Eligibility', icon: CheckSquare, badge: eligibleCount > 0 ? eligibleCount : undefined },
    { id: 'document-mapper', label: 'Document Mapper', icon: Files },
    { id: 'readiness-passport', label: 'Readiness Passport', icon: Award },
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

  // Keyboard navigation, Escape dismissal, and focus trap for the End Session dialog
  useEffect(() => {
    if (showClearConfirm) {
      // Sensible initial focus on Cancel button for safety
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Identity - Semantic Button */}
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center space-x-3 text-left group focus:outline-none focus:ring-2 focus:ring-civic-500 rounded-xl p-1"
            aria-label="SevAIQ Home Dashboard"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-800 via-civic-700 to-indigo-900 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  Sev<span className="text-civic-600">AI</span>Q
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                  Seva First 2026
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium hidden md:block">
                Civic Intelligence & Scheme Readiness
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-civic-500 ${
                    isActive
                      ? 'bg-civic-50 text-civic-800 shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
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
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-civic-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Kiosk Mode, Clear Profile, Backend Status & Mobile Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Ephemeral Public Kiosk Mode Toggle */}
            <button
              type="button"
              onClick={onToggleKioskMode}
              className={`hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-civic-500 ${
                isKioskMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title={
                isKioskMode
                  ? 'Public Kiosk Mode is ON: No profile data saved to localStorage'
                  : 'Toggle Public Kiosk Mode for shared devices'
              }
              aria-pressed={isKioskMode}
            >
              <Monitor className={`w-3.5 h-3.5 ${isKioskMode ? 'text-amber-800' : 'text-slate-500'}`} />
              <span className="hidden xl:inline">Kiosk Mode:</span>
              <span>{isKioskMode ? 'Active' : 'Off'}</span>
            </button>

            {/* Clear Profile / End Session */}
            <button
              ref={triggerButtonRef}
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
              title="Clear all demographic answers and document statuses from this device"
              aria-label="Clear profile and end session"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">End Session</span>
            </button>

            {/* Backend Health Badge */}
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                apiState.status === 'connected'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : apiState.status === 'checking'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
              title={`FastAPI Target: ${apiState.baseUrl}`}
            >
              {apiState.status === 'connected' ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Backend:</span>
                  <span>Healthy</span>
                  {apiState.latencyMs !== null && (
                    <span className="text-emerald-700 font-mono text-[10px]">({apiState.latencyMs}ms)</span>
                  )}
                </>
              ) : apiState.status === 'checking' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Backend:</span>
                  <span>Offline</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={onRefreshHealth}
              disabled={apiState.status === 'checking'}
              aria-label="Refresh API connection status"
              title="Ping backend /api/health"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 focus:outline-none focus:ring-2 focus:ring-civic-500"
            >
              <RefreshCw className={`w-4 h-4 ${apiState.status === 'checking' ? 'animate-spin' : ''}`} />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-civic-500"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 px-2 border-t border-slate-200 space-y-1 bg-white">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-civic-500 ${
                    isActive
                      ? 'bg-civic-50 text-civic-800'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-civic-700' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-3 text-xs">
              <span className="text-slate-600 font-medium">Public Kiosk Mode:</span>
              <button
                type="button"
                onClick={onToggleKioskMode}
                className={`px-3 py-1 rounded-lg font-semibold ${
                  isKioskMode ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isKioskMode ? 'Active (No storage)' : 'Off (Local storage)'}
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
                  End Session & Clear Profile?
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
