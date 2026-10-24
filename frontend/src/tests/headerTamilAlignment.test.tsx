import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Header } from '../components/Header';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage } from '../utils/kioskStorage';

describe('Header Tamil Transition Alignment and Sizing', () => {
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

  const renderHeaderWithLang = (lang: 'en' | 'ta') => {
    const Harness: React.FC = () => {
      const { setLanguage } = useLanguage();
      React.useEffect(() => {
        setLanguage(lang);
      }, [setLanguage]);

      return (
        <Header
          activeTab="dashboard"
          onSelectTab={() => {}}
          eligibleCount={3}
          isKioskMode={false}
          onToggleKioskMode={() => {}}
          onClearSession={() => {}}
        />
      );
    };

    return renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <Harness />
        </AccessibilityProvider>
      </LanguageProvider>
    );
  };

  it('renders English header with standard sizing classes', () => {
    const html = renderHeaderWithLang('en');
    expect(html).toContain('Dashboard');
    expect(html).toContain('Schemes');
    expect(html).toContain('Your Details');
    expect(html).toContain('Documents');
    expect(html).toContain('Passport');
    expect(html).toContain('Trust');
    expect(html).toContain('Track Application');
    expect(html).toContain('text-xs font-semibold');
  });

  it('renders Tamil header with adjusted compact sizing to prevent top options overflow', () => {
    // Directly pre-set localStorage to 'ta' for server render
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'ta');

    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <Header
            activeTab="dashboard"
            onSelectTab={() => {}}
            eligibleCount={3}
            isKioskMode={false}
            onToggleKioskMode={() => {}}
            onClearSession={() => {}}
          />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Tamil labels are all present
    expect(html).toContain('முகப்பு');
    expect(html).toContain('திட்டங்கள்');
    expect(html).toContain('விவரங்கள்');
    expect(html).toContain('ஆவணங்கள்');
    expect(html).toContain('பாஸ்போர்ட்');
    expect(html).toContain('நம்பகத்தன்மை');
    expect(html).toContain('நிலை');

    // Sized styling classes are applied for Tamil transition
    expect(html).toContain('text-[11px]');
    expect(html).toContain('px-1.5');

    // Navigation container uses flex-1 min-w-0 to guarantee no overlap with controls
    expect(html).toContain('flex-1 min-w-0');

    // Kiosk and session controls adapt sizes
    expect(html).toContain('நிறுத்தம்');
    expect(html).toContain('அமர்வை முடி');
  });

  it('renders Hindi header with authentic Hindi labels and zero Tamil residual words', () => {
    // Set localStorage language to Hindi
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'hi');

    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <Header
            activeTab="dashboard"
            onSelectTab={() => {}}
            eligibleCount={3}
            isKioskMode={false}
            onToggleKioskMode={() => {}}
            onClearSession={() => {}}
          />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Hindi navigation labels
    expect(html).toContain('डैशबोर्ड');
    expect(html).toContain('योजनाएं');
    expect(html).toContain('जानकारी');
    expect(html).toContain('दस्तावेज');
    expect(html).toContain('पासपोर्ट');
    expect(html).toContain('विश्वसनीयता');
    expect(html).toContain('स्थिति');

    // Must NOT contain any Tamil words on Hindi page
    expect(html).not.toContain('தகுதி');
    expect(html).not.toContain('சரிபார்ப்பு');
    expect(html).not.toContain('முகப்பு');
    expect(html).not.toContain('திட்டங்கள்');
    expect(html).not.toContain('ஆவணங்கள்');
  });
});
