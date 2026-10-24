import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CategoryGrid } from '../components/CategoryGrid';
import { AboutModal } from '../components/AboutModal';
import { Dashboard } from '../components/Dashboard';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage } from '../utils/kioskStorage';
import { MY_SCHEME_CATEGORIES } from '../data/categoryGridData';
import { VERIFIED_REFERENCE_SCHEMES, INITIAL_DOCUMENT_RECORDS } from '../data/verifiedReferenceSchemes';
import { EMPTY_PROFILE } from '../utils/kioskStorage';

describe('Dashboard Category Grid and Bottom-Left About Modal', () => {
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

  it('renders all 15 categories matching the official myScheme categories in CategoryGrid', () => {
    expect(MY_SCHEME_CATEGORIES).toHaveLength(15);

    const onSelect = vi.fn();
    const html = renderToString(
      <LanguageProvider>
        <CategoryGrid onSelectCategory={onSelect} />
      </LanguageProvider>
    );

    // Verify header
    expect(html).toContain('Find schemes based on categories');
    expect(html).toContain('#GOVERNMENTSCHEMES / #SCHEMESFORYOU');

    // Verify key categories from image 2
    expect(html).toContain('Agriculture,Rural &amp; Environment');
    expect(html).toContain('944 Schemes');
    expect(html).toContain('Banking,Financial Services and Insurance');
    expect(html).toContain('358 Schemes');
    expect(html).toContain('Business &amp; Entrepreneurship');
    expect(html).toContain('831 Schemes');
    expect(html).toContain('Education &amp; Learning');
    expect(html).toContain('1183 Schemes');
    expect(html).toContain('Health &amp; Wellness');
    expect(html).toContain('296 Schemes');
    expect(html).toContain('Housing &amp; Shelter');
    expect(html).toContain('145 Schemes');
    expect(html).toContain('Public Safety,Law &amp; Justice');
    expect(html).toContain('35 Schemes');
    expect(html).toContain('Science, IT &amp; Communications');
    expect(html).toContain('134 Schemes');
    expect(html).toContain('Skills &amp; Employment');
    expect(html).toContain('407 Schemes');
    expect(html).toContain('Social welfare &amp; Empowerment');
    expect(html).toContain('1527 Schemes');
    expect(html).toContain('Sports &amp; Culture');
    expect(html).toContain('315 Schemes');
    expect(html).toContain('Transport &amp; Infrastructure');
    expect(html).toContain('144 Schemes');
    expect(html).toContain('Travel &amp; Tourism');
    expect(html).toContain('104 Schemes');
    expect(html).toContain('Utility &amp; Sanitation');
    expect(html).toContain('60 Schemes');
    expect(html).toContain('Women and Child');
    expect(html).toContain('482 Schemes');
  });

  it('renders categories in Tamil when language is Tamil', () => {
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'ta');
    const onSelect = vi.fn();

    const html = renderToString(
      <LanguageProvider>
        <CategoryGrid onSelectCategory={onSelect} />
      </LanguageProvider>
    );

    expect(html).toContain('வகைகள் வாரியாக திட்டங்களை கண்டறியவும்');
    expect(html).toContain('வேளாண்மை, ஊரகம் &amp; சுற்றுச்சூழல்');
    expect(html).toContain('944 திட்டங்கள்');
    expect(html).toContain('வங்கி, நிதி சேவைகள் &amp; காப்பீடு');
    expect(html).toContain('358 திட்டங்கள்');
    expect(html).toContain('கல்வி &amp; கற்றல்');
    expect(html).toContain('1183 திட்டங்கள்');
  });

  it('Dashboard replaces the workflow cards with the CategoryGrid', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <Dashboard
            onNavigate={() => {}}
            profile={EMPTY_PROFILE}
            schemes={VERIFIED_REFERENCE_SCHEMES}
            eligibleCount={2}
            documents={INITIAL_DOCUMENT_RECORDS}
            isKioskMode={false}
          />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Categories are rendered on the Dashboard
    expect(html).toContain('Find schemes based on categories');
    expect(html).toContain('Agriculture,Rural &amp; Environment');
    expect(html).toContain('944 Schemes');

    // Metrics are still rendered
    expect(html).toContain('Cataloged Schemes');
    expect(html).toContain('Eligible Matches');
  });

  it('AboutModal contains the 4 workflow stages and 3 specialized citizen tools', () => {
    const html = renderToString(
      <LanguageProvider>
        <AboutModal
          isOpen={true}
          onClose={() => {}}
          onNavigate={() => {}}
        />
      </LanguageProvider>
    );

    // Modal title & mission
    expect(html).toContain('About SevAIQ: Features &amp; Working');
    expect(html).toContain('SevAIQ');

    // 4-stage readiness workflow
    expect(html).toContain('Discover Schemes');
    expect(html).toContain('01');
    expect(html).toContain('Detailed Analysis');
    expect(html).toContain('02');
    expect(html).toContain('Map Documents');
    expect(html).toContain('03');
    expect(html).toContain('Readiness Passport');
    expect(html).toContain('04');

    // 3 specialized tools
    expect(html).toContain('Feature 5');
    expect(html).toContain('Tamil &amp; English Voice Assistant');
    expect(html).toContain('Feature 6');
    expect(html).toContain('Official-Source Trust Monitor');
    expect(html).toContain('Feature 7');
    expect(html).toContain('Application Guidance Tracker');

    // Privacy & zero-hallucination guarantees
    expect(html).toContain('Privacy-First Architecture');
    expect(html).toContain('Zero Hallucination Standard');
  });
});
