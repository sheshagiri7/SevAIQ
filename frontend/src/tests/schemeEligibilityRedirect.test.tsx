import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { EligibilityScreen } from '../components/EligibilityScreen';
import { LanguageProvider } from '../context/LanguageContext';
import { VERIFIED_REFERENCE_SCHEMES, INITIAL_DOCUMENT_RECORDS } from '../data/verifiedReferenceSchemes';
import { EMPTY_PROFILE, DEMO_PROFILE } from '../utils/kioskStorage';

describe('Scheme-to-Eligibility Redirect & Focused Breakdown', () => {
  beforeEach(() => {
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

  it('renders all schemes when no targetSchemeId is provided', () => {
    const html = renderToString(
      <LanguageProvider>
        <EligibilityScreen
          schemes={VERIFIED_REFERENCE_SCHEMES}
          profile={EMPTY_PROFILE}
          documents={INITIAL_DOCUMENT_RECORDS}
          onUpdateProfile={vi.fn()}
          onNavigate={vi.fn()}
          onSelectForMapper={vi.fn()}
          selectedSchemeIdsForMapper={[]}
        />
      </LanguageProvider>
    );

    // Should NOT have the targeted focus banner
    expect(html).not.toContain('Target Scheme Selected');
    expect(html).not.toContain('Focused Scheme Eligibility');
    // Should display all schemes
    expect(html).toContain('All Schemes');
    expect(html).toContain('PM-KISAN');
    expect(html).toContain('PM SVANidhi');
  });

  it('filters and auto-expands the specific scheme when targetSchemeId is provided', () => {
    const html = renderToString(
      <LanguageProvider>
        <EligibilityScreen
          schemes={VERIFIED_REFERENCE_SCHEMES}
          profile={DEMO_PROFILE}
          documents={INITIAL_DOCUMENT_RECORDS}
          onUpdateProfile={vi.fn()}
          onNavigate={vi.fn()}
          onSelectForMapper={vi.fn()}
          selectedSchemeIdsForMapper={[]}
          targetSchemeId="pm-svanidhi"
        />
      </LanguageProvider>
    );

    // Must show the focused banner
    expect(html).toContain('Target Scheme Selected');
    expect(html).toContain('Focused Scheme Eligibility');
    expect(html).toContain("PM Street Vendor’s AtmaNirbhar Nidhi (PM SVANidhi)");

    // Must include the target scheme badge on the card
    expect(html).toContain('🎯 Selected Scheme');

    // The Official Criteria Breakdown should be auto-expanded
    expect(html).toContain('Official Criteria Breakdown for');
    expect(html).toContain('Age Requirement');
    expect(html).toContain('Geographic Area');
    expect(html).toContain('Occupational Eligibility');

    // Only PM SVANidhi should be in the filtered list (other schemes like PM-KISAN should not be in the card list)
    expect(html).toContain('id="eligibility-scheme-pm-svanidhi"');
    expect(html).not.toContain('id="eligibility-scheme-pm-kisan"');
  });

  it('supports alias resolution such as ab-pmjay', () => {
    const html = renderToString(
      <LanguageProvider>
        <EligibilityScreen
          schemes={VERIFIED_REFERENCE_SCHEMES}
          profile={DEMO_PROFILE}
          documents={INITIAL_DOCUMENT_RECORDS}
          onUpdateProfile={vi.fn()}
          onNavigate={vi.fn()}
          onSelectForMapper={vi.fn()}
          selectedSchemeIdsForMapper={[]}
          targetSchemeId="ab-pmjay"
        />
      </LanguageProvider>
    );

    // Should focus on AB-PMJAY
    expect(html).toContain('Target Scheme Selected');
    expect(html).toContain('Ayushman Bharat');
    expect(html).toContain('Official Criteria Breakdown for');
  });

  it('renders correctly with Tamil localization when targetSchemeId is provided', () => {
    // Wrap with Tamil language by rendering with localStorage or custom provider wrapper
    const TamilWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      // Mock localStorage with language 'ta'
      (globalThis as any).localStorage = {
        getItem: (k: string) => (k === 'SEVAIQ_LANGUAGE' ? 'ta' : null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      return <LanguageProvider>{children}</LanguageProvider>;
    };

    const html = renderToString(
      <TamilWrapper>
        <EligibilityScreen
          schemes={VERIFIED_REFERENCE_SCHEMES}
          profile={DEMO_PROFILE}
          documents={INITIAL_DOCUMENT_RECORDS}
          onUpdateProfile={vi.fn()}
          onNavigate={vi.fn()}
          onSelectForMapper={vi.fn()}
          selectedSchemeIdsForMapper={[]}
          targetSchemeId="pm-svanidhi"
        />
      </TamilWrapper>
    );

    // Tamil badge and title
    expect(html).toContain('தேர்ந்தெடுக்கப்பட்டது');
    expect(html).toContain('பிரதம மந்திரி தெருவோர வியாபாரிகள் ஆத்மநிர்பர் நிதி (PM SVANidhi)');
    expect(html).toContain('அனைத்து திட்டங்கள்');
  });
});
