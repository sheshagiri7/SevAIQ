import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Header } from '../components/Header';
import { AccessibilityDrawer } from '../components/AccessibilityDrawer';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage } from '../utils/kioskStorage';

describe('Header & Accessibility Layout Integration', () => {
  beforeEach(() => {
    (globalThis as any).localStorage = new MemoryStorage();
    if (typeof document === 'undefined') {
      (globalThis as any).document = {
        documentElement: { lang: 'en', style: {} },
        body: { classList: { add: vi.fn(), remove: vi.fn() } },
      };
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Header with clean End Session button and without below-session accessibility button', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <Header
            activeTab="dashboard"
            onSelectTab={() => {}}
            eligibleCount={0}
            isKioskMode={false}
            onToggleKioskMode={() => {}}
            onClearSession={() => {}}
          />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Should NOT show Ctrl+F2 anywhere in the Header UI
    expect(html).not.toContain('Ctrl+F2');
    expect(html).not.toContain('(Ctrl+F2)');

    // Should contain clean End Session button
    expect(html).toContain('End Session');

    // Accessibility button below End Session has been removed in favor of the left-docked purple launcher
    expect(html).not.toContain('Accessibility options');
  });

  it('renders Tamil localized End Session label in Header', () => {
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'ta');

    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <Header
            activeTab="dashboard"
            onSelectTab={() => {}}
            eligibleCount={0}
            isKioskMode={false}
            onToggleKioskMode={() => {}}
            onClearSession={() => {}}
          />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    expect(html).not.toContain('Ctrl+F2');
    expect(html).toContain('அமர்வை முடி');
  });

  it('renders AccessibilityDrawer without displaying Ctrl+F2 banner badge', () => {
    // Render with isOpen true
    const DrawerHarness: React.FC = () => {
      return (
        <LanguageProvider>
          <AccessibilityProvider>
            <AccessibilityDrawer />
          </AccessibilityProvider>
        </LanguageProvider>
      );
    };

    // Pre-populate accessibility drawer state
    localStorage.setItem('SEVAIQ_A11Y_OPEN', 'true');

    const html = renderToString(<DrawerHarness />);
    expect(html).not.toContain('Ctrl+F2');
  });
});
