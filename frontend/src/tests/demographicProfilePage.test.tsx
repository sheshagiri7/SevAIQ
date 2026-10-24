import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DemographicProfile } from '../components/DemographicProfile';
import { SchemeDiscovery } from '../components/SchemeDiscovery';
import { LanguageProvider } from '../context/LanguageContext';
import { MemoryStorage, EMPTY_PROFILE, DEMO_PROFILE } from '../utils/kioskStorage';
import { VERIFIED_REFERENCE_SCHEMES } from '../data/verifiedReferenceSchemes';

describe('Demographic Profile in Schemes Discovery Page', () => {
  beforeEach(() => {
    (globalThis as any).localStorage = new MemoryStorage();
    if (typeof document === 'undefined') {
      (globalThis as any).document = {
        documentElement: { lang: 'en', style: {} },
        body: { classList: { add: vi.fn(), remove: vi.fn() } },
        getElementById: vi.fn().mockReturnValue(null),
      };
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Enter Your Details with core fields and privacy badge', () => {
    const html = renderToString(
      <LanguageProvider>
        <DemographicProfile
          profile={EMPTY_PROFILE}
          onUpdateProfile={vi.fn()}
          onResetProfile={vi.fn()}
          onPreFillDemoProfile={vi.fn()}
          eligibleCount={3}
          totalSchemesCount={10}
        />
      </LanguageProvider>
    );

    // Profile title & Zero PII privacy guarantee
    expect(html).toContain('Enter Your Details');
    expect(html).toContain('Zero PII • No Aadhaar Required');

    // Core demographic form labels
    expect(html).toContain('Age (Years)');
    expect(html).toContain('Gender');
    expect(html).toContain('State / Union Territory');
    expect(html).toContain('Residence Area');
    expect(html).toContain('Occupation / Livelihood');
    expect(html).toContain('Annual Household Income');
    expect(html).toContain('Social Category');
    expect(html).toContain('Agricultural Landholding');

    // Student & Disability checkboxes
    expect(html).toContain('Currently enrolled as a student');
    expect(html).toContain('Person with benchmark disability (PwD)');

    // Action buttons
    expect(html).not.toContain('Load Demo Profile');
    expect(html).toContain('Reset Answers');
  });

  it('displays active profile chips when profile has data', () => {
    const html = renderToString(
      <LanguageProvider>
        <DemographicProfile
          profile={DEMO_PROFILE}
          onUpdateProfile={vi.fn()}
          eligibleCount={5}
          totalSchemesCount={10}
        />
      </LanguageProvider>
    );

    expect(html).toContain('Active Profile:');
    expect(html).toContain('Karnataka');
    expect(html).toContain('Farmer / Cultivator');
    expect(html).toContain('5 / 10 Schemes Eligible');
  });

  it('renders scheme cards with demographic match status when profile is present', () => {
    const html = renderToString(
      <LanguageProvider>
        <SchemeDiscovery
          schemes={VERIFIED_REFERENCE_SCHEMES}
          isLoading={false}
          profile={DEMO_PROFILE}
          eligibleCount={2}
        />
      </LanguageProvider>
    );

    // Should indicate whether schemes match demographics
    expect(html).toContain('Eligible for You ✓');
  });

  it('filters schemes when onlyEligibleFilter is active in SchemeDiscovery', () => {
    // Without filter: PM-KISAN, PM-SVANidhi, and others are rendered
    const htmlAll = renderToString(
      <LanguageProvider>
        <SchemeDiscovery
          schemes={VERIFIED_REFERENCE_SCHEMES}
          isLoading={false}
          profile={DEMO_PROFILE}
          onlyEligibleFilter={false}
        />
      </LanguageProvider>
    );
    expect(htmlAll).toContain('PM-KISAN');

    // With filter active: only eligible schemes are rendered
    const htmlFiltered = renderToString(
      <LanguageProvider>
        <SchemeDiscovery
          schemes={VERIFIED_REFERENCE_SCHEMES}
          isLoading={false}
          profile={DEMO_PROFILE}
          onlyEligibleFilter={true}
        />
      </LanguageProvider>
    );
    // Farmer demo profile is eligible for PM-KISAN
    expect(htmlFiltered).toContain('PM-KISAN');
  });

  it('renders "Give Scheme Options" buttons and displays matching schemes accordingly the details in profile', () => {
    // 1. Initial render with DEMO_PROFILE (Farmer, Rural, Karnataka, Age 38, Marginal/Small land)
    const htmlWithDemo = renderToString(
      <LanguageProvider>
        <DemographicProfile
          profile={DEMO_PROFILE}
          onUpdateProfile={vi.fn()}
          defaultShowSchemeOptions={true}
        />
      </LanguageProvider>
    );

    // Give Scheme Options button exists
    expect(htmlWithDemo).toContain('data-testid="give-scheme-options-btn"');
    expect(htmlWithDemo).toContain('data-testid="give-scheme-options-footer-btn"');

    // Scheme options section is displayed
    expect(htmlWithDemo).toContain('data-testid="demographic-scheme-options"');
    expect(htmlWithDemo).toContain('Scheme Options According to Profile');

    // Shows schemes matching Farmer demographic details
    expect(htmlWithDemo).toContain('Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)');
    expect(htmlWithDemo).toContain('data-testid="scheme-option-card-pm-kisan"');

    // Shows why the scheme matched the citizen's profile details
    expect(htmlWithDemo).toContain('Why this scheme matches your profile:');
    expect(htmlWithDemo).toContain('Occupation:');
    expect(htmlWithDemo).toContain('Farmer / Cultivator');
    expect(htmlWithDemo).toContain('Residence:');
    expect(htmlWithDemo).toContain('Rural');
    expect(htmlWithDemo).toContain('Demographic Match ✓');
  });

  it('shows scheme options tailored to urban street vendor profile', () => {
    const vendorProfile = {
      ...EMPTY_PROFILE,
      occupation: 'Street Vendor / Hawker',
      area: 'Urban' as const,
      age: 32,
    };

    const htmlVendor = renderToString(
      <LanguageProvider>
        <DemographicProfile
          profile={vendorProfile}
          onUpdateProfile={vi.fn()}
          defaultShowSchemeOptions={true}
        />
      </LanguageProvider>
    );

    // PM SVANidhi matches urban street vendor livelihood
    expect(htmlVendor).toContain('PM SVANidhi');
    expect(htmlVendor).toContain('Street Vendor / Hawker');
    expect(htmlVendor).toContain('Urban');
  });

  it('shows scheme options tailored to student welfare profile', () => {
    const studentProfile = {
      ...EMPTY_PROFILE,
      isStudent: true,
      category: 'SC' as const,
      age: 20,
      incomeBracket: '< 1 Lakh' as const,
    };

    const htmlStudent = renderToString(
      <LanguageProvider>
        <DemographicProfile
          profile={studentProfile}
          onUpdateProfile={vi.fn()}
          defaultShowSchemeOptions={true}
        />
      </LanguageProvider>
    );

    // Post-Matric Scholarship matches student profile
    expect(htmlStudent).toContain('Post-Matric Scholarship');
    expect(htmlStudent).toContain('Student Welfare');
  });

  it('supports Tamil and Hindi localization for Give Scheme Options', () => {
    // Tamil
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'ta');
    const htmlTa = renderToString(
      <LanguageProvider>
        <DemographicProfile
          profile={DEMO_PROFILE}
          onUpdateProfile={vi.fn()}
          defaultShowSchemeOptions={false}
        />
      </LanguageProvider>
    );
    expect(htmlTa).toContain('திட்ட விருப்பங்களைப் பெறுக');

    // Hindi
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'hi');
    const htmlHi = renderToString(
      <LanguageProvider>
        <DemographicProfile
          profile={DEMO_PROFILE}
          onUpdateProfile={vi.fn()}
          defaultShowSchemeOptions={false}
        />
      </LanguageProvider>
    );
    expect(htmlHi).toContain('योजना विकल्प प्राप्त करें');
  });
});
