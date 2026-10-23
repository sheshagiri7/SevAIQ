import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Info } from 'lucide-react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Dashboard } from './components/Dashboard';
import { SchemeDiscovery } from './components/SchemeDiscovery';
import { EligibilityScreen } from './components/EligibilityScreen';
import { DocumentMapper } from './components/DocumentMapper';
import { ReadinessPassport } from './components/ReadinessPassport';
import { VoiceAssistant } from './components/VoiceAssistant';
import { TrustMonitor } from './components/TrustMonitor';
import { ApplicationTracker } from './components/ApplicationTracker';
import { AccessibilityDrawer } from './components/AccessibilityDrawer';
import { FloatingAccessibilityButton } from './components/FloatingAccessibilityButton';
import { ADHDRuler } from './components/ADHDRuler';
import { AboutModal } from './components/AboutModal';
import { Footer } from './components/Footer';
import { useLanguage } from './context/LanguageContext';
import { checkBackendHealth, fetchSchemes, getApiBaseUrl } from './services/api';
import {
  ApiState,
  Scheme,
  CitizenProfile,
  DocumentRecord,
  DocumentPossessionStatus,
  NavigationTab,
} from './types';
import {
  VERIFIED_REFERENCE_SCHEMES,
  INITIAL_DOCUMENT_RECORDS,
} from './data/verifiedReferenceSchemes';
import { evaluateSchemeEligibility } from './utils/eligibilityEngine';
import { reconcileCatalogSchemes } from './utils/catalogMerger';
import {
  EMPTY_PROFILE,
  DEMO_PROFILE,
  STORAGE_KEYS,
  purgeCitizenStorage,
  persistCitizenProfile,
  persistDocuments,
  persistSelectedSchemes,
} from './utils/kioskStorage';

export function App() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const [apiState, setApiState] = useState<ApiState>({
    status: 'checking',
    baseUrl: getApiBaseUrl(),
    health: null,
    latencyMs: null,
    errorMessage: null,
    lastChecked: null,
  });

  const [backendSchemes, setBackendSchemes] = useState<Scheme[]>([]);
  const [isSchemesLoading, setIsSchemesLoading] = useState<boolean>(false);
  const [schemesError, setSchemesError] = useState<string | null>(null);

  // Ephemeral Public Kiosk Mode state
  const [isKioskMode, setIsKioskMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
    } catch {
      return false;
    }
  });

  // Citizen Profile State
  const [profile, setProfile] = useState<CitizenProfile>(() => {
    try {
      const isKiosk = localStorage.getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
      if (!isKiosk) {
        const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return EMPTY_PROFILE;
  });

  // Document Records State
  const [documents, setDocuments] = useState<DocumentRecord[]>(() => {
    try {
      const isKiosk = localStorage.getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
      if (!isKiosk) {
        const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_DOCUMENT_RECORDS;
  });

  // Target Schemes Selected for Mapper & Passport
  const [selectedSchemeIds, setSelectedSchemeIds] = useState<string[]>(() => {
    try {
      const isKiosk = localStorage.getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
      if (!isKiosk) {
        const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_SCHEMES);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return ['pm-kisan', 'ab-pmjay'];
  });

  // Target scheme for Application Guidance Tracker
  const [selectedTrackerSchemeId, setSelectedTrackerSchemeId] = useState<string>('pm-kisan');

  // Target scheme for Eligibility Engine Screen
  const [selectedEligibilitySchemeId, setSelectedEligibilitySchemeId] = useState<string | null>(null);

  // Guard ref to prevent React transition effects from writing kiosk-session data to localStorage
  const justExitedKioskRef = useRef(false);

  // Toggle Public Kiosk Mode safely
  const handleToggleKioskMode = () => {
    if (isKioskMode) {
      // Exiting Kiosk Mode:
      // 1. Set guard so subsequent persistence effects cannot re-save the kiosk session data
      justExitedKioskRef.current = true;

      // 2. Clear all persistent storage keys immediately
      purgeCitizenStorage();
      try {
        localStorage.setItem(STORAGE_KEYS.KIOSK_MODE, 'false');
      } catch {
        // ignore
      }

      // 3. Clear all in-memory citizen state so the next citizen starts with a clean profile
      setProfile(EMPTY_PROFILE);
      setDocuments(INITIAL_DOCUMENT_RECORDS);
      setSelectedSchemeIds([]);
      setSelectedEligibilitySchemeId(null);
      setIsKioskMode(false);
    } else {
      // Entering Kiosk Mode:
      // 1. Purge any previously persisted citizen data from storage
      purgeCitizenStorage();
      try {
        localStorage.setItem(STORAGE_KEYS.KIOSK_MODE, 'true');
      } catch {
        // ignore
      }

      // 2. Clear all in-memory citizen state so kiosk session begins fresh
      setProfile(EMPTY_PROFILE);
      setDocuments(INITIAL_DOCUMENT_RECORDS);
      setSelectedSchemeIds([]);
      setSelectedEligibilitySchemeId(null);
      setIsKioskMode(true);
    }
  };

  // Clear Session & Reset all citizen state
  const handleClearSession = () => {
    purgeCitizenStorage();
    setProfile(EMPTY_PROFILE);
    setDocuments(INITIAL_DOCUMENT_RECORDS);
    setSelectedSchemeIds([]);
    setSelectedEligibilitySchemeId(null);
    setIsVoiceAssistantOpen(false);
  };

  const handlePreFillDemoProfile = () => {
    setProfile(DEMO_PROFILE);
    setSelectedSchemeIds(['pm-kisan', 'ab-pmjay']);
  };

  const handleResetProfile = () => {
    setProfile(EMPTY_PROFILE);
    if (!isKioskMode) {
      try {
        localStorage.removeItem(STORAGE_KEYS.PROFILE);
      } catch {
        // ignore
      }
    }
  };

  // Atomic reset for document selection in DocumentMapper
  const handleResetSchemeSelection = () => {
    setSelectedSchemeIds([]);
  };

  // Save changes to localStorage only when NOT in public kiosk mode
  useEffect(() => {
    if (isKioskMode) {
      purgeCitizenStorage();
      return;
    }
    if (justExitedKioskRef.current) {
      purgeCitizenStorage();
      const timer = setTimeout(() => {
        justExitedKioskRef.current = false;
      }, 0);
      return () => clearTimeout(timer);
    }
    persistCitizenProfile(profile, isKioskMode);
  }, [profile, isKioskMode]);

  useEffect(() => {
    if (isKioskMode || justExitedKioskRef.current) {
      return;
    }
    persistDocuments(documents, isKioskMode);
  }, [documents, isKioskMode]);

  useEffect(() => {
    if (isKioskMode || justExitedKioskRef.current) {
      return;
    }
    persistSelectedSchemes(selectedSchemeIds, isKioskMode);
  }, [selectedSchemeIds, isKioskMode]);

  const handleCheckHealth = useCallback(async () => {
    setApiState((prev) => ({ ...prev, status: 'checking', errorMessage: null }));
    const result = await checkBackendHealth();

    if (result.success && result.data) {
      setApiState({
        status: 'connected',
        baseUrl: getApiBaseUrl(),
        health: result.data,
        latencyMs: result.latencyMs,
        errorMessage: null,
        lastChecked: new Date(),
      });
    } else {
      setApiState({
        status: 'disconnected',
        baseUrl: getApiBaseUrl(),
        health: null,
        latencyMs: result.latencyMs,
        errorMessage: result.error || 'Backend service unreachable',
        lastChecked: new Date(),
      });
    }
  }, []);

  const handleFetchSchemes = useCallback(async () => {
    setIsSchemesLoading(true);
    setSchemesError(null);

    const result = await fetchSchemes();
    setIsSchemesLoading(false);

    if (result.success) {
      setBackendSchemes(result.data);
    } else {
      setSchemesError(result.error || 'Failed to load schemes from backend');
    }
  }, []);

  useEffect(() => {
    handleCheckHealth();
    handleFetchSchemes();
  }, [handleCheckHealth, handleFetchSchemes]);

  // Reconcile catalog: deterministic merging of backend schemes & reference models
  // Prevents backend data from removing valid catalog entries and preserves official verification evidence
  const allSchemes = useMemo(() => {
    return reconcileCatalogSchemes(backendSchemes, VERIFIED_REFERENCE_SCHEMES);
  }, [backendSchemes]);

  // Compute eligible count for badge in header
  const eligibleCount = useMemo(() => {
    return allSchemes.filter((s) => evaluateSchemeEligibility(s, profile).overallStatus === 'met')
      .length;
  }, [allSchemes, profile]);

  const handleUpdateProfile = (updated: Partial<CitizenProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdateDocumentStatus = (docId: string, status: DocumentPossessionStatus) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status } : d))
    );
  };

  const handleToggleSchemeSelection = (schemeId: string) => {
    setSelectedSchemeIds((prev) =>
      prev.includes(schemeId) ? prev.filter((id) => id !== schemeId) : [...prev, schemeId]
    );
  };

  const handleNavigate = (tab: NavigationTab) => {
    if (tab === 'voice-assistant') {
      setIsVoiceAssistantOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  // If activeTab is ever voice-assistant, open the corner assistant and show dashboard
  useEffect(() => {
    if (activeTab === 'voice-assistant') {
      setIsVoiceAssistantOpen(true);
      setActiveTab('dashboard');
    }
  }, [activeTab]);

  const handleSelectSchemeForEligibility = (scheme: Scheme | string) => {
    const schemeId = typeof scheme === 'string' ? scheme : scheme.id;
    setSelectedEligibilitySchemeId(schemeId);
    setActiveTab('eligibility');
  };

  const handleTabSelect = (tab: NavigationTab) => {
    if (tab === 'eligibility') {
      // Citizen clicked the top header "Eligibility" tab directly -> show all schemes
      setSelectedEligibilitySchemeId(null);
    }
    handleNavigate(tab);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryFilter(categoryId);
    setActiveTab('discover');
    setTimeout(() => {
      const el = document.getElementById('discover');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans relative">
      {/* Universal Header with Tab Navigation & Health Status */}
      <Header
        apiState={apiState}
        activeTab={activeTab}
        onSelectTab={handleTabSelect}
        onRefreshHealth={handleCheckHealth}
        eligibleCount={eligibleCount}
        isKioskMode={isKioskMode}
        onToggleKioskMode={handleToggleKioskMode}
        onClearSession={handleClearSession}
        schemes={allSchemes}
        onSelectSchemeForEligibility={handleSelectSchemeForEligibility}
        onPreFillDemoProfile={handlePreFillDemoProfile}
        profile={profile}
      />

      {/* Main Screen Content */}
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigate={handleNavigate}
            profile={profile}
            schemes={allSchemes}
            eligibleCount={eligibleCount}
            documents={documents}
            isKioskMode={isKioskMode}
            onSelectCategory={handleCategorySelect}
            onOpenAbout={() => setIsAboutOpen(true)}
            onSelectSchemeForEligibility={handleSelectSchemeForEligibility}
          />
        )}

        {activeTab === 'discover' && (
          <>
            <Hero onExploreClick={() => {
              const el = document.getElementById('discover');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }} />
            <SchemeDiscovery
              schemes={allSchemes}
              isLoading={isSchemesLoading}
              onRefreshSchemes={handleFetchSchemes}
              error={schemesError}
              onSelectForEligibility={handleSelectSchemeForEligibility}
              onNavigateToTracker={(schemeId) => {
                setSelectedTrackerSchemeId(schemeId);
                setActiveTab('application-tracker');
              }}
              backendSchemesCount={backendSchemes.length}
              selectedCategory={selectedCategoryFilter}
              onSelectCategory={setSelectedCategoryFilter}
            />
          </>
        )}

        {activeTab === 'eligibility' && (
          <EligibilityScreen
            schemes={allSchemes}
            profile={profile}
            documents={documents}
            onUpdateProfile={handleUpdateProfile}
            onNavigate={handleNavigate}
            onSelectForMapper={handleToggleSchemeSelection}
            selectedSchemeIdsForMapper={selectedSchemeIds}
            isKioskMode={isKioskMode}
            onResetProfile={handleResetProfile}
            onPreFillDemoProfile={handlePreFillDemoProfile}
            targetSchemeId={selectedEligibilitySchemeId}
            onClearTargetScheme={() => setSelectedEligibilitySchemeId(null)}
          />
        )}

        {activeTab === 'document-mapper' && (
          <DocumentMapper
            documents={documents}
            schemes={allSchemes}
            profile={profile}
            selectedSchemeIds={selectedSchemeIds}
            onToggleSchemeSelection={handleToggleSchemeSelection}
            onResetSchemeSelection={handleResetSchemeSelection}
            onUpdateDocumentStatus={handleUpdateDocumentStatus}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'readiness-passport' && (
          <ReadinessPassport
            profile={profile}
            schemes={allSchemes}
            documents={documents}
            selectedSchemeIds={selectedSchemeIds}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'trust-monitor' && (
          <TrustMonitor
            schemes={allSchemes}
            onNavigate={handleNavigate}
            onSelectSchemeForEligibility={handleSelectSchemeForEligibility}
          />
        )}

        {activeTab === 'application-tracker' && (
          <ApplicationTracker
            schemes={allSchemes}
            initialSchemeId={selectedTrackerSchemeId}
            onNavigate={handleNavigate}
            isKioskMode={isKioskMode}
          />
        )}
      </main>

      {/* Floating Bottom-Left Corner About Option Launcher */}
      <aside
        aria-label="About SevAIQ Features & Working"
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 print:hidden"
      >
        <button
          type="button"
          onClick={() => setIsAboutOpen(true)}
          className="group flex items-center space-x-2 sm:space-x-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300/90 shadow-lg hover:shadow-xl hover:border-civic-400 transition-all focus:outline-none focus:ring-2 focus:ring-civic-500 active:scale-95 cursor-pointer"
          aria-label={
            language === 'ta'
              ? 'SevAIQ பற்றி: அம்சங்கள் & செயல்படும் முறை'
              : language === 'hi'
              ? 'SevAIQ के बारे में: विशेषताएं और कार्यप्रणाली'
              : 'About SevAIQ: Features & Working'
          }
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-civic-700 to-indigo-900 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform shrink-0">
            <Info className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="flex flex-col items-start leading-tight text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black tracking-tight text-slate-900">
                {language === 'ta' ? 'SevAIQ பற்றி' : language === 'hi' ? 'SevAIQ के बारे में' : 'About SevAIQ'}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-civic-50 text-civic-700 border border-civic-200/60">
                {language === 'ta' ? 'அம்சங்கள்' : language === 'hi' ? 'कार्यप्रणाली' : 'How it works'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
              {language === 'ta'
                ? 'செயல்பாடுகள் & கருவிகள்'
                : language === 'hi'
                ? 'विशेषताएं और नागरिक कार्यप्रवाह'
                : 'Features & Citizen Workflow'}
            </span>
          </div>
        </button>
      </aside>

      {/* About SevAIQ Features & Working Interactive Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Floating Bottom-Right Corner Voice AI Assistant */}
      <VoiceAssistant
        schemes={allSchemes}
        onNavigate={handleNavigate}
        onSelectSchemeForEligibility={handleSelectSchemeForEligibility}
        isOpen={isVoiceAssistantOpen}
        onToggleOpen={() => setIsVoiceAssistantOpen((prev) => !prev)}
        onClose={() => setIsVoiceAssistantOpen(false)}
      />

      {/* UX4G Universal Accessibility Options Slide-over Drawer */}
      <AccessibilityDrawer />

      {/* myScheme-Style Left Docked Purple Accessibility Launcher */}
      <FloatingAccessibilityButton />

      {/* ADHD Full-Screen Interactive Reading Focus Ruler */}
      <ADHDRuler />

      <Footer onOpenAbout={() => setIsAboutOpen(true)} />
    </div>
  );
}

export default App;
