import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SchemeDiscovery } from './components/SchemeDiscovery';
import { DeveloperHandshake } from './components/DeveloperHandshake';
import { Footer } from './components/Footer';
import { checkBackendHealth, fetchSchemes, getApiBaseUrl } from './services/api';
import { ApiState, Scheme } from './types';

export function App() {
  const [apiState, setApiState] = useState<ApiState>({
    status: 'checking',
    baseUrl: getApiBaseUrl(),
    health: null,
    latencyMs: null,
    errorMessage: null,
    lastChecked: null,
  });

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isSchemesLoading, setIsSchemesLoading] = useState<boolean>(false);
  const [schemesError, setSchemesError] = useState<string | null>(null);

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
      setSchemes(result.data);
    } else {
      setSchemesError(result.error || 'Failed to load schemes from backend');
    }
  }, []);

  useEffect(() => {
    handleCheckHealth();
    handleFetchSchemes();
  }, [handleCheckHealth, handleFetchSchemes]);

  const handleExploreClick = () => {
    const el = document.getElementById('discover');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Header apiState={apiState} onRefreshHealth={handleCheckHealth} />

      <main className="flex-1">
        <Hero onExploreClick={handleExploreClick} />
        <SchemeDiscovery
          schemes={schemes}
          isLoading={isSchemesLoading}
          onRefreshSchemes={handleFetchSchemes}
          error={schemesError}
        />
        <DeveloperHandshake apiState={apiState} />
      </main>

      <Footer />
    </div>
  );
}

export default App;
