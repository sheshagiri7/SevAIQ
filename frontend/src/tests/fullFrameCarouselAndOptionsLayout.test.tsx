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

    // QR code section is removed
    expect(html).not.toContain('Scan the');
    expect(html).not.toContain('QR Code');

    // Navigation arrows matching green rounded rectangles
    expect(html).toContain('Previous Scheme Slide');
    expect(html).toContain('Next Scheme Slide');
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

  it('SchemeBannerCarousel updates green button and floating launcher options for Tamil language transition', () => {
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'ta');

    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Green button and floating launcher translated to Tamil
    expect(html).toContain('#அரசுதிட்டங்கள் / #உங்களுக்கானதிட்டங்கள்');
    expect(html).toContain('உங்களுக்கான திட்டங்களைக் கண்டறியவும்');
    expect(html).toContain('விருப்பங்களை ஆராய கீழே உருட்டவும்');

    // Slide content translated to Tamil
    expect(html).toContain('தேசிய கல்வி உதவித்தொகை தளம்');
    expect(html).toContain('மின்னணு &amp; தகவல் தொழில்நுட்ப அமைச்சகம்');
    expect(html).toContain('விண்ணப்பிக்கவும்');
    expect(html).toContain('தகுதியை சரிபார்க்கவும்');
    expect(html).toContain('முந்தைய திட்டம்');
    expect(html).toContain('அடுத்த திட்டம்');
  });

  it('SchemeBannerCarousel updates green button and floating launcher options for Hindi language transition', () => {
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'hi');

    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Green button and floating launcher translated to Hindi
    expect(html).toContain('#सरकारीयोजनाएं / #आपकेलिएयोजनाएं');
    expect(html).toContain('आपके लिए योजनाएं खोजें');
    expect(html).toContain('विकल्प देखने के लिए नीचे स्क्रॉल करें');

    // Slide content translated to Hindi
    expect(html).toContain('राष्ट्रीय छात्रवृत्ति पोर्टल');
    expect(html).toContain('इलेक्ट्रॉनिक्स और सूचना प्रौद्योगिकी मंत्रालय');
    expect(html).toContain('अभी आवेदन करें');
    expect(html).toContain('पात्रता जांचें');
    expect(html).toContain('पिछली योजना');
    expect(html).toContain('अगली योजना');
  });
});
