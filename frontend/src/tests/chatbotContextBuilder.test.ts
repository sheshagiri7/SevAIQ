import { describe, it, expect } from 'vitest';
import { buildCitizenChatContext } from '../utils/chatbotContextBuilder';
import { VERIFIED_REFERENCE_SCHEMES, INITIAL_DOCUMENT_RECORDS } from '../data/verifiedReferenceSchemes';
import { DEMO_PROFILE, EMPTY_PROFILE } from '../utils/kioskStorage';

describe('SevAIQ Chatbot Context Builder Suite', () => {
  it('1. Returns undefined when session has no profile, no selected schemes, and no tracking', () => {
    const ctx = buildCitizenChatContext(EMPTY_PROFILE, [], [], []);
    expect(ctx).toBeUndefined();
  });

  it('2. Builds sanitized profile context without sensitive PII', () => {
    const ctx = buildCitizenChatContext(
      DEMO_PROFILE,
      VERIFIED_REFERENCE_SCHEMES,
      INITIAL_DOCUMENT_RECORDS,
      ['pm-kisan']
    );

    expect(ctx).toBeDefined();
    expect(ctx?.profile).toBeDefined();
    expect(ctx?.profile?.state).toBe(DEMO_PROFILE.state);
    expect(ctx?.profile?.area).toBe('Rural');
    expect(ctx?.profile?.occupation).toBe('Farmer / Cultivator');
    expect(ctx?.profile?.age).toBe(DEMO_PROFILE.age);

    // Strictly ensure no sensitive tokens exist
    const str = JSON.stringify(ctx);
    expect(str).not.toContain('aadhaar');
    expect(str).not.toContain('bank_account');
    expect(str).not.toContain('password');
  });

  it('3. Generates MatchProof summaries for scheme recommendations', () => {
    const ctx = buildCitizenChatContext(
      DEMO_PROFILE,
      VERIFIED_REFERENCE_SCHEMES,
      INITIAL_DOCUMENT_RECORDS,
      ['pm-kisan']
    );

    expect(ctx?.scheme_matches).toBeDefined();
    expect(ctx?.scheme_matches!.length).toBeGreaterThan(0);

    const pmKisanMatch = ctx?.scheme_matches!.find((m) => m.id === 'pm-kisan');
    expect(pmKisanMatch).toBeDefined();
    expect(pmKisanMatch?.status).toBe('Potential match');
    expect(pmKisanMatch?.reasons.length).toBeGreaterThan(0);
  });

  it('4. Consolidates document checklist and counts readiness percentage', () => {
    const docs = INITIAL_DOCUMENT_RECORDS.map((d) =>
      d.id === 'aadhaar-card' || d.id === 'land-records'
        ? { ...d, status: 'have' as const }
        : d.id === 'ration-card'
        ? { ...d, status: 'missing' as const }
        : d
    );

    const ctx = buildCitizenChatContext(
      DEMO_PROFILE,
      VERIFIED_REFERENCE_SCHEMES,
      docs,
      ['pm-kisan']
    );

    expect(ctx?.documents).toBeDefined();
    expect(ctx?.documents?.have_documents).toContain('Aadhaar Card');
    expect(ctx?.documents?.missing_documents.some((d) => d.includes('Ration Card'))).toBe(true);
    expect(ctx?.documents?.readiness_percentage).toBeGreaterThan(0);
  });

  it('5. Captures user-reported application tracking and computes next best action', () => {
    const tracking = {
      'pm-kisan': 'submitted',
    };

    const ctx = buildCitizenChatContext(
      DEMO_PROFILE,
      VERIFIED_REFERENCE_SCHEMES,
      INITIAL_DOCUMENT_RECORDS,
      ['pm-kisan'],
      tracking
    );

    expect(ctx?.tracking).toBeDefined();
    expect(ctx?.tracking?.['pm-kisan']).toBe('submitted');
    expect(ctx?.next_best_action).toBeDefined();
    expect(typeof ctx?.next_best_action).toBe('string');
  });
});
