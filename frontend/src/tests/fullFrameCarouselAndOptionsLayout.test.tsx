import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
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

  it('Dashboard renders the full-frame carousel followed by the separate #options-section layout', () => {
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

    // Options layout is separated with id="options-section"
    expect(html).toContain('id="options-section"');

    // Inside options section, CategoryGrid appears first
    expect(html).toContain('Find schemes based on categories');
    expect(html).toContain('Agriculture,Rural &amp; Environment');

    // Followed by Civic Intelligence metrics
    expect(html).toContain('Citizen Readiness &amp; Scheme Intelligence');
    expect(html).toContain('Cataloged Schemes');
    expect(html).toContain('Eligible Matches');
  });
});
