import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Dashboard } from './components/Dashboard';
import { SchemeDiscovery } from './components/SchemeDiscovery';
import { EligibilityScreen } from './components/EligibilityScreen';
import { DocumentMapper } from './components/DocumentMapper';
import { ReadinessPassport } from './components/ReadinessPassport';
import { DeveloperHandshake } from './components/DeveloperHandshake';
import { Footer } from './components/Footer';
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
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

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
      setIsKioskMode(true);
    }
  };

  // Clear Session & Reset all citizen state
  const handleClearSession = () => {
    purgeCitizenStorage();
    setProfile(EMPTY_PROFILE);
    setDocuments(INITIAL_DOCUMENT_RECORDS);
    setSelectedSchemeIds([]);
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

  const handleSelectSchemeForEligibility = (_scheme: Scheme) => {
    setActiveTab('eligibility');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Universal Header with Tab Navigation & Health Status */}
      <Header
        apiState={apiState}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onRefreshHealth={handleCheckHealth}
        eligibleCount={eligibleCount}
        isKioskMode={isKioskMode}
        onToggleKioskMode={handleToggleKioskMode}
        onClearSession={handleClearSession}
      />

      {/* Main Screen Content */}
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigate={setActiveTab}
            profile={profile}
            schemes={allSchemes}
            eligibleCount={eligibleCount}
            documents={documents}
            isKioskMode={isKioskMode}
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
              backendSchemesCount={backendSchemes.length}
            />
          </>
        )}

        {activeTab === 'eligibility' && (
          <EligibilityScreen
            schemes={allSchemes}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onNavigate={setActiveTab}
            onSelectForMapper={handleToggleSchemeSelection}
            selectedSchemeIdsForMapper={selectedSchemeIds}
            isKioskMode={isKioskMode}
            onResetProfile={handleResetProfile}
            onPreFillDemoProfile={handlePreFillDemoProfile}
          />
        )}

        {activeTab === 'document-mapper' && (
          <DocumentMapper
            documents={documents}
            schemes={allSchemes}
            selectedSchemeIds={selectedSchemeIds}
            onToggleSchemeSelection={handleToggleSchemeSelection}
            onResetSchemeSelection={handleResetSchemeSelection}
            onUpdateDocumentStatus={handleUpdateDocumentStatus}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'readiness-passport' && (
          <ReadinessPassport
            profile={profile}
            schemes={allSchemes}
            documents={documents}
            selectedSchemeIds={selectedSchemeIds}
            onNavigate={setActiveTab}
          />
        )}

        {/* Developer Handshake section accessible on dashboard and discover */}
        {(activeTab === 'dashboard' || activeTab === 'discover') && (
          <DeveloperHandshake apiState={apiState} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
