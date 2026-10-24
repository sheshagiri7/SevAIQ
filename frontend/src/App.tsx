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
import { SevAIQIntro, hasSeenIntro } from './components/SevAIQIntro';
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
  getDefaultStorage,
  purgeCitizenStorage,
  persistCitizenProfile,
  persistDocuments,
  persistSelectedSchemes,
  persistApplicationProgress,
  persistApplicationNotes,
  persistApplicationStatus,
  persistApplicationReminders,
} from './utils/kioskStorage';
import { InactivityWarningDialog } from './components/KioskDialogs';

export function App() {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<NavigationTab>('chat');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [onlyEligibleFilter, setOnlyEligibleFilter] = useState<boolean>(false);

  // Cinematic Website Opening Intro State (Session-persisted)
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return !hasSeenIntro();
  });

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const handleReplayIntro = useCallback(() => {
    setShowIntro(true);
  }, []);

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
      return getDefaultStorage().getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
    } catch {
      return false;
    }
  });

  // Citizen Profile State
  const [profile, setProfile] = useState<CitizenProfile>(() => {
    try {
      const isKiosk = getDefaultStorage().getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
      if (!isKiosk) {
        const saved = getDefaultStorage().getItem(STORAGE_KEYS.PROFILE);
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
      const isKiosk = getDefaultStorage().getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
      if (!isKiosk) {
        const saved = getDefaultStorage().getItem(STORAGE_KEYS.DOCUMENTS);
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
      const isKiosk = getDefaultStorage().getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
      if (!isKiosk) {
        const saved = getDefaultStorage().getItem(STORAGE_KEYS.SELECTED_SCHEMES);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Target scheme for Application Guidance Tracker
  const [selectedTrackerSchemeId, setSelectedTrackerSchemeId] = useState<string>('pm-kisan');

  // Session key to atomically reset VoiceAssistant component instance across mode/session resets
  const [sessionKey, setSessionKey] = useState<number>(0);

  // Common Application Tracker State (Shared in-memory across ApplicationTracker & VoiceAssistant)
  const [completedStepsMap, setCompletedStepsMap] = useState<Record<string, string[]>>(() => {
    try {
      const isKiosk = getDefaultStorage().getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
      if (!isKiosk) {
        const saved = getDefaultStorage().getItem(STORAGE_KEYS.APPLICATION_PROGRESS);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [notesMap, setNotesMap] = useState<Record<string, string>>(() => {
    try {
      const isKiosk = getDefaultStorage().getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
      if (!isKiosk) {
        const saved = getDefaultStorage().getItem(STORAGE_KEYS.APPLICATION_NOTES);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [statusMap, setStatusMap] = useState<Record<string, any>>(() => {
    try {
      const isKiosk = getDefaultStorage().getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
      if (!isKiosk) {
        const saved = getDefaultStorage().getItem(STORAGE_KEYS.APPLICATION_STATUS);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [reminderMap, setReminderMap] = useState<Record<string, string>>(() => {
    try {
      const isKiosk = getDefaultStorage().getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
      if (!isKiosk) {
        const saved = getDefaultStorage().getItem(STORAGE_KEYS.APPLICATION_REMINDERS);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {};
  });

  // Inactivity timeout tracking for shared public computers (5 minutes = 300s, warning at 270s)
  const isVoiceActiveRef = useRef<boolean>(false);
  const lastActivityRef = useRef<number>(Date.now());
  const [isInactivityWarningOpen, setIsInactivityWarningOpen] = useState<boolean>(false);
  const [inactivitySecondsRemaining, setInactivitySecondsRemaining] = useState<number>(30);
  const [inactivityNotice, setInactivityNotice] = useState<string | null>(null);

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

  // Inactivity timeout: 5 minutes (300,000ms), warning displayed at 270,000ms
  const INACTIVITY_TIMEOUT_MS = 300000;
  const WARNING_THRESHOLD_MS = 270000;

  // Inactivity reset callback
  const handleInactivityReset = useCallback(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {}

    purgeCitizenStorage();
    setProfile(EMPTY_PROFILE);
    setDocuments(INITIAL_DOCUMENT_RECORDS);
    setSelectedSchemeIds([]);
    setSelectedEligibilitySchemeId(null);
    setCompletedStepsMap({});
    setNotesMap({});
    setStatusMap({});
    setReminderMap({});
    setPendingChatQuery(null);
    setOnlyEligibleFilter(false);

    // Atomically reset VoiceAssistant component instance & chat history
    setSessionKey((prev) => prev + 1);

    setActiveTab('chat');
    setIsInactivityWarningOpen(false);
    lastActivityRef.current = Date.now();
    setInactivityNotice(
      t.header.inactivityResetToast ||
        'Previous session ended due to inactivity. A new, private kiosk session has started.'
    );
    setTimeout(() => setInactivityNotice(null), 6000);
  }, [t.header.inactivityResetToast]);

  // Monitor user activity events to reset inactivity timer
  const handleUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (isInactivityWarningOpen) {
      setIsInactivityWarningOpen(false);
    }
  }, [isInactivityWarningOpen]);

  useEffect(() => {
    if (!isKioskMode) return;

    lastActivityRef.current = Date.now();
    const events = ['keydown', 'pointerdown', 'mousedown', 'touchstart', 'input', 'change', 'scroll'];
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [isKioskMode, handleUserActivity]);

  // Inactivity polling interval (runs every 1 second when in Kiosk Mode)
  useEffect(() => {
    if (!isKioskMode) {
      setIsInactivityWarningOpen(false);
      return;
    }

    const intervalId = window.setInterval(() => {
      // If voice recognition is active or speech synthesis is playing, extend the session
      if (isVoiceActiveRef.current) {
        lastActivityRef.current = Date.now();
        setIsInactivityWarningOpen(false);
        return;
      }

      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        handleInactivityReset();
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        const remaining = Math.max(1, Math.ceil((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
        setInactivitySecondsRemaining(remaining);
        setIsInactivityWarningOpen(true);
      } else {
        setIsInactivityWarningOpen(false);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isKioskMode, handleInactivityReset]);

  // Toggle Public Kiosk Mode safely with full reset
  const handleToggleKioskMode = useCallback(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {}

    if (isKioskMode) {
      // Exiting Kiosk Mode:
      justExitedKioskRef.current = true;
      purgeCitizenStorage();
      try {
        getDefaultStorage().setItem(STORAGE_KEYS.KIOSK_MODE, 'false');
      } catch {}

      setProfile(EMPTY_PROFILE);
      setDocuments(INITIAL_DOCUMENT_RECORDS);
      setSelectedSchemeIds([]);
      setSelectedEligibilitySchemeId(null);
      setCompletedStepsMap({});
      setNotesMap({});
      setStatusMap({});
      setReminderMap({});
      setPendingChatQuery(null);
      setOnlyEligibleFilter(false);
      setSessionKey((prev) => prev + 1);
      setActiveTab('chat');
      setIsInactivityWarningOpen(false);
      setIsKioskMode(false);
    } else {
      // Entering Kiosk Mode:
      purgeCitizenStorage();
      try {
        getDefaultStorage().setItem(STORAGE_KEYS.KIOSK_MODE, 'true');
      } catch {}

      setProfile(EMPTY_PROFILE);
      setDocuments(INITIAL_DOCUMENT_RECORDS);
      setSelectedSchemeIds([]);
      setSelectedEligibilitySchemeId(null);
      setCompletedStepsMap({});
      setNotesMap({});
      setStatusMap({});
      setReminderMap({});
      setPendingChatQuery(null);
      setOnlyEligibleFilter(false);
      setSessionKey((prev) => prev + 1);
      setActiveTab('chat');
      lastActivityRef.current = Date.now();
      setIsInactivityWarningOpen(false);
      setIsKioskMode(true);
    }
  }, [isKioskMode]);

  // Clear Session & Reset all citizen state (manually triggered)
  const handleClearSession = useCallback(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {}

    purgeCitizenStorage();
    setProfile(EMPTY_PROFILE);
    setDocuments(INITIAL_DOCUMENT_RECORDS);
    setSelectedSchemeIds([]);
    setSelectedEligibilitySchemeId(null);
    setCompletedStepsMap({});
    setNotesMap({});
    setStatusMap({});
    setReminderMap({});
    setPendingChatQuery(null);
    setOnlyEligibleFilter(false);
    setSessionKey((prev) => prev + 1);
    setActiveTab('chat');
    lastActivityRef.current = Date.now();
    setIsInactivityWarningOpen(false);
  }, []);

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

  const handleSetTrackerStatus = useCallback(
    (schemeId: string, status: string, stepIndex?: number) => {
      setStatusMap((prev) => ({ ...prev, [schemeId]: status }));
      if (stepIndex !== undefined) {
        setCompletedStepsMap((prev) => {
          const existing = prev[schemeId] || [];
          const stepId = `step-${stepIndex + 1}`;
          if (!existing.includes(stepId)) {
            return { ...prev, [schemeId]: [...existing, stepId] };
          }
          return prev;
        });
      }
    },
    []
  );

  const handleSetTrackerReminder = useCallback(
    (schemeId: string, reminderText: string, reminderDate?: string) => {
      const formatted = reminderDate || new Date().toISOString().split('T')[0];
      setReminderMap((prev) => ({
        ...prev,
        [schemeId]: reminderText ? `${formatted} - ${reminderText}` : formatted,
      }));
    },
    []
  );

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

  useEffect(() => {
    if (isKioskMode || justExitedKioskRef.current) return;
    persistApplicationProgress(completedStepsMap, isKioskMode);
  }, [completedStepsMap, isKioskMode]);

  useEffect(() => {
    if (isKioskMode || justExitedKioskRef.current) return;
    persistApplicationNotes(notesMap, isKioskMode);
  }, [notesMap, isKioskMode]);

  useEffect(() => {
    if (isKioskMode || justExitedKioskRef.current) return;
    persistApplicationStatus(statusMap, isKioskMode);
  }, [statusMap, isKioskMode]);

  useEffect(() => {
    if (isKioskMode || justExitedKioskRef.current) return;
    persistApplicationReminders(reminderMap, isKioskMode);
  }, [reminderMap, isKioskMode]);

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
    <div className="min-h-screen flex flex-col bg-[#F5F7F8] dark:bg-[#0F2133] text-[#202B36] dark:text-[#F1F5F9] font-sans relative transition-colors duration-150">
      {/* Cinematic Website Opening Intro (Plays once per browser session or on manual replay) */}
      {showIntro && (
        <SevAIQIntro onComplete={handleIntroComplete} />
      )}

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

      {/* Public Kiosk Mode Privacy Alert Banner */}
      {isKioskMode && (
        <aside
          aria-label="Public Kiosk Mode Banner"
          className="bg-amber-50 dark:bg-amber-950/80 border-b border-amber-300 dark:border-amber-800/80 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 transition-colors"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="font-bold">
                {t.header.publicKioskActiveBanner ||
                  'Public Kiosk Mode Active • Ephemeral Session • Zero Disk Storage'}
              </span>
              <span className="text-amber-700 dark:text-amber-300/80 hidden md:inline">
                | 5-minute inactivity auto-reset enabled
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearSession}
              className="text-[11px] font-bold px-3 py-1 rounded-md bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 transition-colors cursor-pointer border border-amber-400 dark:border-amber-700"
            >
              {t.header.endSession || 'End Citizen Session'}
            </button>
          </div>
        </aside>
      )}

      {/* Inactivity Auto-Reset Notice Toast */}
      {inactivityNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 right-4 z-50 max-w-sm p-4 bg-emerald-900 text-white rounded-xl shadow-2xl border border-emerald-400/40 text-xs flex items-center gap-2 animate-in slide-in-from-top-2 duration-200"
        >
          <span className="text-emerald-300 text-base">✓</span>
          <span>{inactivityNotice}</span>
        </div>
      )}

      {/* Inactivity Warning Dialog Modal */}
      <InactivityWarningDialog
        isOpen={isInactivityWarningOpen}
        secondsRemaining={inactivitySecondsRemaining}
        onContinue={() => {
          lastActivityRef.current = Date.now();
          setIsInactivityWarningOpen(false);
        }}
        onEndNow={handleInactivityReset}
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
            key={sessionKey}
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
            applicationTracking={statusMap}
            onVoiceActiveChange={(active) => {
              isVoiceActiveRef.current = active;
              if (active) lastActivityRef.current = Date.now();
            }}
            onUpdateProfile={handleUpdateProfile}
            onUpdateDocumentStatus={handleUpdateDocumentStatus}
            onToggleSchemeSelection={handleToggleSchemeSelection}
            onClearSession={handleClearSession}
            onSelectTrackerScheme={(schemeId) => setSelectedTrackerSchemeId(schemeId)}
            onSetTrackerStatus={handleSetTrackerStatus}
            onSetTrackerReminder={handleSetTrackerReminder}
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
            completedStepsMap={completedStepsMap}
            onUpdateCompletedSteps={setCompletedStepsMap}
            notesMap={notesMap}
            onUpdateNotes={setNotesMap}
            statusMap={statusMap}
            onUpdateStatus={setStatusMap}
            reminderMap={reminderMap}
            onUpdateReminder={setReminderMap}
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
        onReplayIntro={handleReplayIntro}
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

      <Footer
        onOpenAbout={() => setIsAboutOpen(true)}
        onReplayIntro={handleReplayIntro}
      />
    </div>
  );
}

export default App;
