import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Info, Mic, Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { DemographicProfile } from './components/DemographicProfile';
import { Dashboard } from './components/Dashboard';
import { SchemeDiscovery } from './components/SchemeDiscovery';
import { EligibilityScreen } from './components/EligibilityScreen';
import { DocumentMapper } from './components/DocumentMapper';
import { ReadinessPassport } from './components/ReadinessPassport';
import { VoiceAssistant } from './components/VoiceAssistant';
import { TrustMonitor } from './components/TrustMonitor';
import { ApplicationTracker } from './components/ApplicationTracker';
import { AccessibilityDrawer } from './components/AccessibilityDrawer';
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
  const [activeTab, setActiveTab] = useState<NavigationTab>('chat');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [onlyEligibleFilter, setOnlyEligibleFilter] = useState<boolean>(false);

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
    return [];
  });

  // Target scheme for Application Guidance Tracker
  const [selectedTrackerSchemeId, setSelectedTrackerSchemeId] = useState<string>('pm-kisan');

  // Target scheme for Eligibility Engine Screen
  const [selectedEligibilitySchemeId, setSelectedEligibilitySchemeId] = useState<string | null>(null);

  // Pending query to pass directly to VoiceAssistant
  const [pendingChatQuery, setPendingChatQuery] = useState<string | null>(null);

  const handleAskAiAboutScheme = (schemeTitle: string) => {
    setPendingChatQuery(
      language === 'ta'
        ? `${schemeTitle} திட்டத்தின் பயன்கள், தகுதி விதிகள் மற்றும் விண்ணப்பிக்கும் முறையை எளிய தமிழில் விளக்குங்கள்.`
        : `Please explain the benefits, eligibility rules, and application process for ${schemeTitle} in simple words.`
    );
    setActiveTab('chat');
  };

  const handleNavigateToDocuments = (schemeId: string) => {
    if (!selectedSchemeIds.includes(schemeId)) {
      setSelectedSchemeIds((prev) => [...prev, schemeId]);
    }
    setActiveTab('document-mapper');
  };

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
      setPendingChatQuery(null);
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
    setOnlyEligibleFilter(false);
  };

  const handlePreFillDemoProfile = () => {
    setProfile(DEMO_PROFILE);
    setSelectedSchemeIds(['pm-kisan', 'ab-pmjay']);
  };

  const handleResetProfile = () => {
    setProfile(EMPTY_PROFILE);
    setOnlyEligibleFilter(false);
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
      prev.includes(schemeId)
        ? prev.filter((id) => id !== schemeId)
        : [...new Set([...prev, schemeId])]
    );
  };

  const handleRemoveSchemeFromMapper = (schemeId: string) => {
    setSelectedSchemeIds((prev) => prev.filter((id) => id !== schemeId));
  };

  const handleNavigate = (tab: NavigationTab) => {
    if (tab === 'voice-assistant') {
      setActiveTab('chat');
      return;
    }
    if (tab === 'demographic-profile') {
      setActiveTab('demographic-profile');
      setTimeout(() => {
        const el = document.getElementById('demographic-profile');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          el.focus?.({ preventScroll: true });
        }
      }, 50);
      return;
    }
    setActiveTab(tab);
  };

  // If activeTab is ever voice-assistant or demographic-profile, handle redirection cleanly
  useEffect(() => {
    if (activeTab === 'voice-assistant') {
      setActiveTab('chat');
    } else if (activeTab === 'demographic-profile') {
      setTimeout(() => {
        const el = document.getElementById('demographic-profile');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          el.focus?.({ preventScroll: true });
        }
      }, 50);
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 font-sans relative transition-colors duration-150">
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
      />

      {/* Main Screen Content */}
      <main className="flex-1 flex flex-col">
        {/* Main Citizen Chat Workspace - Keep mounted so conversation history persists */}
        <div
          className={
            activeTab === 'chat' || activeTab === 'voice-assistant'
              ? 'flex-1 flex flex-col'
              : 'hidden'
          }
        >
          <VoiceAssistant
            schemes={allSchemes}
            onNavigate={handleNavigate}
            onSelectSchemeForEligibility={handleSelectSchemeForEligibility}
            isOpen={true}
            onToggleOpen={() => {}}
            onClose={() => {}}
            isKioskMode={isKioskMode}
            isMainScreen={true}
            onOpenAbout={() => setIsAboutOpen(true)}
            pendingQuery={pendingChatQuery}
            onClearPendingQuery={() => setPendingChatQuery(null)}
            profile={profile}
            documents={documents}
            selectedSchemeIds={selectedSchemeIds}
          />
        </div>

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
            onFindSchemes={() => handleNavigate('demographic-profile')}
          />
        )}

        {(activeTab === 'discover' || activeTab === 'demographic-profile') && (
          <div className="py-6 space-y-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <DemographicProfile
                id="demographic-profile"
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onResetProfile={handleResetProfile}
                onPreFillDemoProfile={handlePreFillDemoProfile}
                isKioskMode={isKioskMode}
                eligibleCount={eligibleCount}
                totalSchemesCount={allSchemes.length}
                showFilterToggle={true}
                onlyEligibleFilter={onlyEligibleFilter}
                onToggleOnlyEligible={setOnlyEligibleFilter}
                onNavigateToEligibility={(scheme) => {
                  if (scheme) {
                    setSelectedEligibilitySchemeId(scheme.id);
                  }
                  setActiveTab('eligibility');
                }}
                forceOpen={activeTab === 'demographic-profile'}
                schemes={allSchemes}
                onSelectSchemeForEligibility={handleSelectSchemeForEligibility}
                selectedSchemeIdsForMapper={selectedSchemeIds}
                onSelectForMapper={handleToggleSchemeSelection}
                defaultShowSchemeOptions={activeTab === 'demographic-profile'}
              />
            </div>
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
              onNavigateToDocuments={handleNavigateToDocuments}
              onAskAiAboutScheme={handleAskAiAboutScheme}
              onNavigateToEligibility={() => setActiveTab('eligibility')}
              backendSchemesCount={backendSchemes.length}
              selectedCategory={selectedCategoryFilter}
              onSelectCategory={setSelectedCategoryFilter}
              selectedSchemeIdsForMapper={selectedSchemeIds}
              onSelectForMapper={handleToggleSchemeSelection}
              profile={profile}
              onlyEligibleFilter={onlyEligibleFilter}
              onToggleOnlyEligible={setOnlyEligibleFilter}
              eligibleCount={eligibleCount}
            />
          </div>
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
            onRemoveScheme={handleRemoveSchemeFromMapper}
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
          className="group flex items-center space-x-2 sm:space-x-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-white dark:bg-[#0c1834] hover:bg-slate-50 dark:hover:bg-[#102046] text-slate-800 dark:text-slate-100 border border-slate-300/90 dark:border-slate-700/80 shadow-lg hover:shadow-xl hover:border-civic-400 dark:hover:border-civic-500 transition-all focus:outline-none focus:ring-2 focus:ring-civic-500 active:scale-95 cursor-pointer"
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
              <span className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white">
                {language === 'ta' ? 'SevAIQ பற்றி' : language === 'hi' ? 'SevAIQ के बारे में' : 'About SevAIQ'}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-civic-50 dark:bg-civic-950/80 text-civic-700 dark:text-civic-300 border border-civic-200/60 dark:border-civic-800/60">
                {language === 'ta' ? 'அம்சங்கள்' : language === 'hi' ? 'कार्यप्रणाली' : 'How it works'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
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

      {/* Floating Bottom-Right Corner Voice AI Assistant Launcher - Rendered on Secondary Pages Only */}
      {activeTab !== 'chat' && activeTab !== 'voice-assistant' && (
        <aside aria-label="Voice AI Assistant Controller">
          <button
            type="button"
            onClick={() => handleNavigate('chat')}
            aria-label={
              language === 'ta'
                ? 'SevAIQ வாய்ஸ் AI அரட்டைக்கு செல் (தமிழ் & English)'
                : language === 'hi'
                ? 'SevAIQ वॉयस AI चैट पर जाएं (हिंदी, तमिल और अंग्रेजी)'
                : 'Open SevAIQ Voice AI Chat (Tamil & English)'
            }
            className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2.5 px-4 py-3 sm:px-4.5 sm:py-3.5 rounded-full shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-civic-500/40 select-none bg-gradient-to-r from-blue-700 via-civic-700 to-indigo-800 text-white shadow-civic-800/40 hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] border border-white/25 ring-4 ring-civic-500/15 cursor-pointer"
          >
            {/* Animated Glowing Mic Icon Badge */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/15 backdrop-blur-xs text-white shrink-0 group-hover:scale-110 transition-transform">
              <Mic className="w-4.5 h-4.5 text-white" />
              {/* Live Online Ping Indicator */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-white/80" />
              </span>
            </div>

            {/* Bilingual Label & Pill */}
            <div className="flex flex-col items-start leading-tight text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black tracking-tight text-white">
                  {language === 'ta' ? 'வாய்ஸ் AI' : language === 'hi' ? 'वॉयस AI' : 'Voice AI'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white/20 text-blue-100 tracking-wide font-mono">
                  ta-IN / en-IN
                </span>
              </div>
              <span className="text-[10px] text-blue-100/90 font-medium whitespace-nowrap">
                {language === 'ta'
                  ? 'அரட்டைக்கு செல்'
                  : language === 'hi'
                  ? 'चैट पर जाएं'
                  : 'Return to Chat'}
              </span>
            </div>

            {/* Sparkle Accent */}
            <Sparkles className="w-3.5 h-3.5 text-amber-300 opacity-90 hidden sm:block shrink-0 animate-pulse" />
          </button>
        </aside>
      )}

      {/* UX4G Universal Accessibility Options Slide-over Drawer */}
      <AccessibilityDrawer />

      {/* ADHD Full-Screen Interactive Reading Focus Ruler */}
      <ADHDRuler />

      <Footer onOpenAbout={() => setIsAboutOpen(true)} />
    </div>
  );
}

export default App;
