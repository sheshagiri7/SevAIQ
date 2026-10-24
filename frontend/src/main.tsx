import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LanguageProvider } from './context/LanguageContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Enforce standard light mode across the entire website
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark', 'a11y-invert');
  document.documentElement.removeAttribute('data-theme');
  document.body?.classList.remove('dark', 'a11y-invert');
  document.body?.removeAttribute('data-theme');
  try {
    const raw = localStorage.getItem('SEVAIQ_A11Y_SETTINGS');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.invertColors) {
        delete parsed.invertColors;
        localStorage.setItem('SEVAIQ_A11Y_SETTINGS', JSON.stringify(parsed));
      }
    }
  } catch {
    // ignore
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <AccessibilityProvider>
          <App />
        </AccessibilityProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
