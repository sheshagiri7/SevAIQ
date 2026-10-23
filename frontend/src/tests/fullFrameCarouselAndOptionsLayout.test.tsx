import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SchemeBannerCarousel } from '../components/SchemeBannerCarousel';
import { Dashboard } from '../components/Dashboard';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage, EMPTY_PROFILE } from '../utils/kioskStorage';
import { VERIFIED_REFERENCE_SCHEMES, INITIAL_DOCUMENT_RECORDS } from '../data/verifiedReferenceSchemes';

describe('Full-Frame Scheme Carousel Banner & Floating Options Section', () => {
  beforeEach(() => {
    (globalThis as any).localStorage = new MemoryStorage();
    if (typeof document === 'undefined') {
      (globalThis as any).document = {
        documentElement: { lang: 'en', style: {} },
        body: { classList: { add: vi.fn(), remove: vi.fn() } },
        getElementById: vi.fn().mockReturnValue({ scrollIntoView: vi.fn() }),
      };
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('SchemeBannerCarousel renders with full-frame viewport height classes and floating launcher', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Full frame classes (h-[calc(100vh-4.25rem)] and min-h)
    expect(html).toContain('h-[calc(100vh-4.25rem)]');
    expect(html).toContain('min-h-[640px]');

    // Floating option launcher bar with government hashtags
    expect(html).toContain('#GOVERNMENTSCHEMES / #SCHEMESFORYOU');
    expect(html).toContain('Find Schemes For You');
    expect(html).toContain('animate-float-subtle');
    expect(html).toContain('Scroll down to explore options');

    // Phone mockup and 3D decorations
    expect(html).toContain('Apply For Scholarship');
    expect(html).toContain('My Applications');
    expect(html).toContain('National Scholarship Portal');
  });

  it('renders the 4 floating category options along the flight path matching the official portal layout', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // 4 Floating Option Buttons with staggered float animation classes
    expect(html).toContain('animate-float-1');
    expect(html).toContain('animate-float-2');
    expect(html).toContain('animate-float-3');
    expect(html).toContain('animate-float-4');

    // Category options tooltips / accessible labels
    expect(html).toContain('Health &amp; Wellness');
    expect(html).toContain('Education &amp; Learning');
    expect(html).toContain('Agriculture &amp; Rural');
    expect(html).toContain('Housing &amp; Shelter');

    // QR code section
    expect(html).toContain('Scan the');
    expect(html).toContain('QR Code');

    // Navigation arrows matching green rounded rectangles
    expect(html).toContain('Previous Scheme Slide');
    expect(html).toContain('Next Scheme Slide');
  });

  it('Dashboard renders the full-frame carousel followed by the floating #options-section with features layout removed', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <Dashboard
            onNavigate={vi.fn()}
            profile={EMPTY_PROFILE}
            schemes={VERIFIED_REFERENCE_SCHEMES}
            eligibleCount={2}
            documents={INITIAL_DOCUMENT_RECORDS}
            isKioskMode={false}
          />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Carousel is rendered in full-width section
    expect(html).toContain('aria-label="Featured Government Schemes Showcase"');
    expect(html).toContain('h-[calc(100vh-4.25rem)]');

    // Options layout is floating with id="options-section"
    expect(html).toContain('id="options-section"');
    expect(html).toContain('-mt-');
    expect(html).toContain('shadow-2xl');

    // Inside options section, CategoryGrid appears prominently
    expect(html).toContain('Find schemes based on categories');
    expect(html).toContain('Agriculture,Rural &amp; Environment');

    // Features and metrics layout has been removed from Dashboard
    expect(html).not.toContain('Citizen Readiness &amp; Scheme Intelligence');
    expect(html).not.toContain('Cataloged Schemes');
    expect(html).not.toContain('Eligible Matches');
    expect(html).not.toContain('View Features &amp; Working');
  });
});
