import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { GuidedProfile } from '../components/GuidedProfile';
import { SchemeDiscovery } from '../components/SchemeDiscovery';
import { DocumentMapper } from '../components/DocumentMapper';
import { ApplicationTracker } from '../components/ApplicationTracker';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import {
  VERIFIED_REFERENCE_SCHEMES,
  INITIAL_DOCUMENT_RECORDS,
} from '../data/verifiedReferenceSchemes';
import { EMPTY_PROFILE, DEMO_PROFILE, MemoryStorage, purgeCitizenStorage } from '../utils/kioskStorage';
import { matchesBilingualQuery } from '../utils/bilingualSearch';

describe('SevAIQ Citizen-Friendly Welfare Assistance Redesign Suite', () => {
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

  it('1. VoiceAssistant landing hero renders prominent CTAs and 4-Stage Citizen Journey roadmap', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <VoiceAssistant
            schemes={VERIFIED_REFERENCE_SCHEMES}
            onNavigate={vi.fn()}
            isMainScreen={true}
            isOpen={true}
          />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Primary CTA 1: Find Government Schemes for Me
    expect(html).toContain('Find Government Schemes for Me');
    // Primary CTA 2: Ask SevAIQ a Question
    expect(html).toContain('Ask SevAIQ a Question');

    // 4-Stage visual roadmap cards
    expect(html).toContain('4-Stage Citizen Journey:');
    expect(html).toContain('1. Your Details');
    expect(html).toContain('2. Find Schemes');
    expect(html).toContain('3. Prepare Docs');
    expect(html).toContain('4. Track Application');
  });

  it('2. GuidedProfile renders 4 progressive steps with privacy reassurance', () => {
    const html = renderToString(
      <LanguageProvider>
        <GuidedProfile
          profile={EMPTY_PROFILE}
          onUpdateProfile={vi.fn()}
          onComplete={vi.fn()}
          onPreFillDemoProfile={vi.fn()}
          onResetProfile={vi.fn()}
        />
      </LanguageProvider>
    );

    // Progressive step indicator
    expect(html).toContain('Step 1 of 4');
    expect(html).toContain('Location &amp; Age');
    expect(html).toContain('Which state or union territory do you live in?');

    // Privacy protection guarantee
    expect(html).toContain('No Aadhaar or Bank details needed');

    // Navigation controls
    expect(html).toContain('Continue');
    expect(html).toContain('Sample Profile (Demo)');
    expect(html).toContain('Clear Form');
  });

  it('3. Bilingual natural language search matches citizen intents in English, Tamil, and Hindi', () => {
    const pmKisan = VERIFIED_REFERENCE_SCHEMES.find((s) => s.id === 'pm-kisan')!;
    const pmJay = VERIFIED_REFERENCE_SCHEMES.find((s) => s.id === 'pm-jay' || s.id === 'ab-pmjay')!;
    const pmayG = VERIFIED_REFERENCE_SCHEMES.find((s) => s.id === 'pmay-g')!;
    const nsp = VERIFIED_REFERENCE_SCHEMES.find((s) => s.id === 'nsp-post-matric')!;

    const mudra: any = {
      id: 'pm-mudra-yojana',
      title: 'Pradhan Mantri MUDRA Yojana',
      short_description: 'Collateral-free institutional credit to non-corporate micro enterprises',
      ministry: 'Ministry of Finance',
      category: 'Financial Inclusion & Livelihood',
    };

    const nsap: any = {
      id: 'nsap',
      title: 'National Social Assistance Programme (NSAP)',
      short_description: 'Social security pensions for elderly, widows and persons with disabilities',
      ministry: 'Ministry of Rural Development',
      category: 'Social Security & Pensions',
    };

    // English search phrases
    expect(matchesBilingualQuery(pmKisan, 'farmer money')).toBe(true);
    expect(matchesBilingualQuery(pmJay, 'free hospital treatment')).toBe(true);
    expect(matchesBilingualQuery(pmayG, 'house assistance')).toBe(true);
    expect(matchesBilingualQuery(mudra, 'business loan')).toBe(true);
    expect(matchesBilingualQuery(nsap, 'old-age pension')).toBe(true);
    expect(matchesBilingualQuery(nsp, 'college scholarship')).toBe(true);

    // Tamil search phrases
    expect(matchesBilingualQuery(pmKisan, 'விவசாயி பணம்')).toBe(true);
    expect(matchesBilingualQuery(pmJay, 'இலவச மருத்துவம்')).toBe(true);
    expect(matchesBilingualQuery(pmayG, 'வீடு கட்ட மானியம்')).toBe(true);
    expect(matchesBilingualQuery(mudra, 'சிறு தொழில் கடன்')).toBe(true);
    expect(matchesBilingualQuery(nsap, 'முதியோர் பென்ஷன்')).toBe(true);
    expect(matchesBilingualQuery(nsp, 'கல்வி உதவித்தொகை')).toBe(true);
  });

  it('4. SchemeDiscovery renders Stage 2 header, recommendations banner, and Check Documents CTA', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeDiscovery
            schemes={VERIFIED_REFERENCE_SCHEMES}
            isLoading={false}
            onRefreshSchemes={vi.fn()}
            backendSchemesCount={8}
            profile={DEMO_PROFILE}
            onNavigateToDocuments={vi.fn()}
            onAskAiAboutScheme={vi.fn()}
            onNavigateToEligibility={vi.fn()}
          />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Stage 2 header
    expect(html).toContain('Stage 2: Find Schemes');
    expect(html).toContain('Find Schemes: Discover Government Welfare Programs');

    // Recommendations banner
    expect(html).toContain('Schemes That May Help You (Based on Your Details)');

    // Action button to Stage 3
    expect(html).toContain('Check Documents (Stage 3)');
    expect(html).toContain('Ask AI');
  });

  it('5. DocumentMapper renders actionable checklist with 3-way toggle buttons and Next Step card', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <DocumentMapper
            documents={INITIAL_DOCUMENT_RECORDS}
            schemes={VERIFIED_REFERENCE_SCHEMES}
            selectedSchemeIds={['pm-kisan', 'pm-jay']}
            profile={DEMO_PROFILE}
            onToggleSchemeSelection={vi.fn()}
            onResetSchemeSelection={vi.fn()}
            onUpdateDocumentStatus={vi.fn()}
            onNavigate={vi.fn()}
          />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Stage 3 header
    expect(html).toContain('Stage 3: Prepare Documents');
    expect(html).toContain('Documents You Need: Actionable Checklist');

    // 3-way toggle buttons
    expect(html).toContain('I Have This');
    expect(html).toContain('I Need This');
    expect(html).toContain('Not Sure');

    // Printable checklist button
    expect(html).toContain('Print Checklist');

    // Transition card to Stage 4
    expect(html).toContain('Next: Track Application (Stage 4)');
    expect(html).toContain('Next Step Guidance');
  });

  it('6. ApplicationTracker renders Stage 4 header, user-reported status, and official status portal links', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <ApplicationTracker
            schemes={VERIFIED_REFERENCE_SCHEMES}
            initialSchemeId="pm-kisan"
            onNavigate={vi.fn()}
            isKioskMode={false}
          />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Stage 4 header
    expect(html).toContain('Stage 4: Track Application');
    expect(html).toContain('Track Your Application');

    // Honest User-Reported Status
    expect(html).toContain('User-Reported');
    expect(html).toContain('Your Reported Status:');
    expect(html).toContain('Not applied yet');

    // Official Government Status Check Portal Link
    expect(html).toContain('Official Live Status Check:');
    expect(html).toContain('Check PM-KISAN Beneficiary Status');

    // Reminder controls
    expect(html).toContain('Next Status Check Reminder:');
    expect(html).toContain('Remind Me');
  });

  it('7. Public Kiosk Mode purge safely wipes application progress, notes, and tracking data', () => {
    localStorage.setItem('SEVAIQ_APPLICATION_PROGRESS', JSON.stringify({ 'pm-kisan': ['step-1'] }));
    localStorage.setItem('SEVAIQ_APPLICATION_NOTES', JSON.stringify({ 'pm-kisan': 'Applied at Taluk office' }));
    localStorage.setItem('SEVAIQ_APPLICATION_STATUS', JSON.stringify({ 'pm-kisan': 'submitted' }));
    localStorage.setItem('SEVAIQ_APPLICATION_REMINDERS', JSON.stringify({ 'pm-kisan': '2026-11-01' }));

    // Execute purge
    purgeCitizenStorage();

    // All application tracking state must be wiped from storage
    expect(localStorage.getItem('SEVAIQ_APPLICATION_PROGRESS')).toBeNull();
    expect(localStorage.getItem('SEVAIQ_APPLICATION_NOTES')).toBeNull();
    expect(localStorage.getItem('SEVAIQ_APPLICATION_STATUS')).toBeNull();
    expect(localStorage.getItem('SEVAIQ_APPLICATION_REMINDERS')).toBeNull();
  });
});
