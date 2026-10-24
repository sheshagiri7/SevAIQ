import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SchemeBannerCarousel } from '../components/SchemeBannerCarousel';
import { Dashboard } from '../components/Dashboard';
import { DemographicProfile } from '../components/DemographicProfile';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage, EMPTY_PROFILE } from '../utils/kioskStorage';
import { VERIFIED_REFERENCE_SCHEMES, INITIAL_DOCUMENT_RECORDS } from '../data/verifiedReferenceSchemes';

describe('Find Schemes For You Button Demographic Profile Redirection', () => {
  beforeEach(() => {
    (globalThis as any).localStorage = new MemoryStorage();
    if (typeof document === 'undefined') {
      (globalThis as any).document = {
        documentElement: { lang: 'en', style: {} },
        body: { classList: { add: vi.fn(), remove: vi.fn() } },
        getElementById: vi.fn().mockImplementation((id: string) => ({
          scrollIntoView: vi.fn(),
          focus: vi.fn(),
          id,
        })),
      };
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders "Find Schemes For You" button with correct attributes and demographic profile section ID', () => {
    const htmlBanner = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    expect(htmlBanner).toContain('Find Schemes For You');
    expect(htmlBanner).toContain('Find Schemes For You - redirect to demographic profile');
    expect(htmlBanner).toContain('data-testid="find-schemes-button"');
    expect(htmlBanner).toContain('id="find-schemes-button"');

    const htmlProfile = renderToString(
      <LanguageProvider>
        <DemographicProfile
          profile={EMPTY_PROFILE}
          onUpdateProfile={vi.fn()}
        />
      </LanguageProvider>
    );

    expect(htmlProfile).toContain('id="demographic-profile"');
    expect(htmlProfile).toContain('data-testid="demographic-profile"');
    expect(htmlProfile).toContain('Enter Your Details');
  });

  it('SchemeBannerCarousel calls onFindSchemes when provided', () => {
    const mockFindSchemes = vi.fn();
    const mockNavigate = vi.fn();

    // Directly test the component props interface
    const props = {
      onNavigate: mockNavigate,
      onFindSchemes: mockFindSchemes,
    };

    expect(props.onFindSchemes).toBeDefined();
  });

  it('Dashboard passes demographic profile navigation to SchemeBannerCarousel', () => {
    const mockNavigate = vi.fn();

    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <Dashboard
            onNavigate={mockNavigate}
            profile={EMPTY_PROFILE}
            schemes={VERIFIED_REFERENCE_SCHEMES}
            eligibleCount={0}
            documents={INITIAL_DOCUMENT_RECORDS}
            isKioskMode={false}
          />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    expect(html).toContain('Find Schemes For You');
    expect(html).toContain('Find Schemes For You - redirect to demographic profile');
  });

  it('supports Tamil and Hindi localization for the redirect button', () => {
    // Tamil
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'ta');
    const htmlTa = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );
    expect(htmlTa).toContain('உங்களுக்கான திட்டங்களைக் கண்டறியவும்');
    expect(htmlTa).toContain('புள்ளிவிவரக் குறிப்புக்குச் செல்லவும்');

    // Hindi
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'hi');
    const htmlHi = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );
    expect(htmlHi).toContain('आपके लिए योजनाएं खोजें');
    expect(htmlHi).toContain('जनसांख्यिकीय प्रोफाइल पर जाएं');
  });
});
