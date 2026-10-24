import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SchemeDiscovery } from '../components/SchemeDiscovery';
import { DocumentMapper } from '../components/DocumentMapper';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import {
  VERIFIED_REFERENCE_SCHEMES,
  INITIAL_DOCUMENT_RECORDS,
} from '../data/verifiedReferenceSchemes';
import { DEMO_PROFILE, MemoryStorage } from '../utils/kioskStorage';

describe('SevAIQ MatchProof & Unified Document Planner Suite', () => {
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

  it('1. SchemeDiscovery renders MatchProof toggle and eligibility status on scheme cards', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeDiscovery
            schemes={VERIFIED_REFERENCE_SCHEMES}
            isLoading={false}
            onRefreshSchemes={vi.fn()}
            backendSchemesCount={5}
            profile={DEMO_PROFILE}
            onNavigateToDocuments={vi.fn()}
            onAskAiAboutScheme={vi.fn()}
            onNavigateToEligibility={vi.fn()}
          />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Match status badge
    expect(html).toContain('May qualify');

    // Expandable MatchProof button
    expect(html).toContain('Why am I seeing this scheme? (MatchProof)');

    // Suitability rationale
    expect(html).toContain('Why this may suit you:');

    // Official verification badge
    expect(html).toContain('Verified Official Source');
  });

  it('2. DocumentMapper Unified Planner renders multi-scheme selector, scheme filter, and reusability badges', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <DocumentMapper
            documents={INITIAL_DOCUMENT_RECORDS}
            schemes={VERIFIED_REFERENCE_SCHEMES}
            selectedSchemeIds={['pm-kisan', 'ab-pmjay']}
            profile={DEMO_PROFILE}
            onToggleSchemeSelection={vi.fn()}
            onResetSchemeSelection={vi.fn()}
            onUpdateDocumentStatus={vi.fn()}
            onNavigate={vi.fn()}
          />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Unified Document Planner Header & Readiness Score
    expect(html).toContain('Stage 3: Prepare Documents');
    expect(html).toContain('Documents You Need: Actionable Checklist');
    expect(html).toContain('Document Readiness Score');

    // Scheme Filter Selector
    expect(html).toContain('Filter by Selected Scheme:');
    expect(html).toContain('All Selected Schemes');

    // Reusability and Scheme Badges
    expect(html).toContain('Cross-Scheme Synergy Unlocked');
    expect(html).toContain('Required by:');

    // 3-Way toggle buttons
    expect(html).toContain('I Have This');
    expect(html).toContain('I Need This');
    expect(html).toContain('Not Sure');

    // Printable checklist button
    expect(html).toContain('Print Checklist');
  });
});
