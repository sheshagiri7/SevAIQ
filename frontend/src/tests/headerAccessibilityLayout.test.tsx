import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Header } from '../components/Header';
import { AccessibilityDrawer } from '../components/AccessibilityDrawer';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage } from '../utils/kioskStorage';

describe('Header & Accessibility Layout Set Integration', () => {
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

  it('renders Header without showing Ctrl+F2 text or shortcut badge in UI', () => {
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

    // Should contain End Session and Accessibility options
    expect(html).toContain('End Session');
    expect(html).toContain('Accessibility');
  });

  it('renders layout set where Accessibility button is placed below End Session', () => {
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

    // End Session appears before Accessibility in the DOM layout set
    const endSessionIndex = html.indexOf('End Session');
    const accessibilityIndex = html.indexOf('Accessibility');
    expect(endSessionIndex).toBeGreaterThan(-1);
    expect(accessibilityIndex).toBeGreaterThan(-1);
    expect(endSessionIndex).toBeLessThan(accessibilityIndex);
  });

  it('renders Tamil localized labels in the layout set without Ctrl+F2', () => {
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
    expect(html).toContain('அணுகல்தன்மை');
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
