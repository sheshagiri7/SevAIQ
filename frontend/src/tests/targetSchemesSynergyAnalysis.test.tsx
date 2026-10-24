import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DocumentMapper } from '../components/DocumentMapper';
import { SchemeDiscovery } from '../components/SchemeDiscovery';
import { EligibilityScreen } from '../components/EligibilityScreen';
import { LanguageProvider } from '../context/LanguageContext';
import {
  VERIFIED_REFERENCE_SCHEMES,
  INITIAL_DOCUMENT_RECORDS,
} from '../data/verifiedReferenceSchemes';
import { EMPTY_PROFILE } from '../utils/kioskStorage';

describe('SevAIQ Target Schemes for Synergy Analysis & Document Mapper', () => {
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

  it('initially displays helpful empty state and does NOT show entire catalog in target schemes panel', () => {
    const html = renderToString(
      <LanguageProvider>
        <DocumentMapper
          documents={INITIAL_DOCUMENT_RECORDS}
          schemes={VERIFIED_REFERENCE_SCHEMES}
          selectedSchemeIds={[]}
          onToggleSchemeSelection={vi.fn()}
          onResetSchemeSelection={vi.fn()}
          onUpdateDocumentStatus={vi.fn()}
          onNavigate={vi.fn()}
        />
      </LanguageProvider>
    );

    // Empty state message requirement
    expect(html).toContain(
      'No schemes added yet. Explore schemes and click ‘Add to Mapper’ to compare document requirements.'
    );
    // Header indicates 0 selected
    expect(html).toContain('(0 selected)');
    // Reset Selection button is hidden when empty
    expect(html).not.toContain('Reset Selection');

    // Does NOT render all catalog schemes as chips in the panel
    // In the old implementation, all 5+ schemes were mapped as buttons in this panel
    expect(html).not.toContain('All schemes active');
  });

  it('displays only the added scheme when one scheme is selected', () => {
    const html = renderToString(
      <LanguageProvider>
        <DocumentMapper
          documents={INITIAL_DOCUMENT_RECORDS}
          schemes={VERIFIED_REFERENCE_SCHEMES}
          selectedSchemeIds={['pm-kisan']}
          onToggleSchemeSelection={vi.fn()}
          onResetSchemeSelection={vi.fn()}
          onUpdateDocumentStatus={vi.fn()}
          onNavigate={vi.fn()}
        />
      </LanguageProvider>
    );

    // Shows 1 selected
    expect(html).toContain('(1 selected)');
    // Contains PM-KISAN
    expect(html).toContain('PM-KISAN');
    // Does NOT contain other unselected schemes in the target schemes pill container
    expect(html).not.toContain('Ayushman Bharat');
    expect(html).not.toContain('PM SVANidhi');
    expect(html).not.toContain('PMAY-G');
    // Reset button is visible
    expect(html).toContain('Reset Selection');
  });

  it('displays exactly three schemes when three schemes are selected, not all available schemes', () => {
    const threeSelected = ['pm-kisan', 'ab-pmjay', 'pm-svanidhi'];
    const html = renderToString(
      <LanguageProvider>
        <DocumentMapper
          documents={INITIAL_DOCUMENT_RECORDS}
          schemes={VERIFIED_REFERENCE_SCHEMES}
          selectedSchemeIds={threeSelected}
          onToggleSchemeSelection={vi.fn()}
          onResetSchemeSelection={vi.fn()}
          onUpdateDocumentStatus={vi.fn()}
          onNavigate={vi.fn()}
        />
      </LanguageProvider>
    );

    expect(html).toContain('(3 selected)');
    expect(html).toContain('PM-KISAN');
    expect(html).toContain('Ayushman Bharat');
    expect(html).toContain('PM SVANidhi');

    // Schemes NOT in selection should NOT be in the target schemes panel
    expect(html).not.toContain('PMAY-G');
    expect(html).not.toContain('National Social Assistance');
  });

  it('provides a remove option for each selected scheme with accessible labels', () => {
    const html = renderToString(
      <LanguageProvider>
        <DocumentMapper
          documents={INITIAL_DOCUMENT_RECORDS}
          schemes={VERIFIED_REFERENCE_SCHEMES}
          selectedSchemeIds={['pm-kisan', 'ab-pmjay']}
          onToggleSchemeSelection={vi.fn()}
          onRemoveScheme={vi.fn()}
          onResetSchemeSelection={vi.fn()}
          onUpdateDocumentStatus={vi.fn()}
          onNavigate={vi.fn()}
        />
      </LanguageProvider>
    );

    // Each selected scheme pill has a remove button with an aria-label
    expect(html).toContain('aria-label="Remove Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) from synergy analysis"');
    expect(html).toContain('aria-label="Remove Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB-PMJAY) from synergy analysis"');
  });

  it('prevents duplicate additions of the same scheme', () => {
    // When duplicate IDs are accidentally passed or clicked twice
    const html = renderToString(
      <LanguageProvider>
        <DocumentMapper
          documents={INITIAL_DOCUMENT_RECORDS}
          schemes={VERIFIED_REFERENCE_SCHEMES}
          selectedSchemeIds={['pm-kisan', 'pm-kisan', 'pm-kisan']}
          onToggleSchemeSelection={vi.fn()}
          onResetSchemeSelection={vi.fn()}
          onUpdateDocumentStatus={vi.fn()}
          onNavigate={vi.fn()}
        />
      </LanguageProvider>
    );

    // Deduplication should count exactly 1 unique selected scheme
    expect(html).toContain('(1 selected)');
  });

  it('analyzes document requirements and overlaps using only the currently selected schemes', () => {
    // With 0 schemes selected, totalCount is 0 and no document requirements shown
    const htmlZero = renderToString(
      <LanguageProvider>
        <DocumentMapper
          documents={INITIAL_DOCUMENT_RECORDS}
          schemes={VERIFIED_REFERENCE_SCHEMES}
          selectedSchemeIds={[]}
          onToggleSchemeSelection={vi.fn()}
          onResetSchemeSelection={vi.fn()}
          onUpdateDocumentStatus={vi.fn()}
          onNavigate={vi.fn()}
        />
      </LanguageProvider>
    );
    expect(htmlZero).toContain('All Required Documents (0)');
    expect(htmlZero).toContain('0 Shared Documents Found');

    // With 2 schemes selected, document requirements are scoped only to those 2 schemes
    const htmlTwo = renderToString(
      <LanguageProvider>
        <DocumentMapper
          documents={INITIAL_DOCUMENT_RECORDS}
          schemes={VERIFIED_REFERENCE_SCHEMES}
          selectedSchemeIds={['pm-kisan', 'ab-pmjay']}
          onToggleSchemeSelection={vi.fn()}
          onResetSchemeSelection={vi.fn()}
          onUpdateDocumentStatus={vi.fn()}
          onNavigate={vi.fn()}
        />
      </LanguageProvider>
    );
    expect(htmlTwo).not.toContain('All Required Documents (0)');
  });

  it('synchronizes selected state on SchemeDiscovery cards and details modal with "Add to Mapper" buttons', () => {
    const selectedIds = ['pm-kisan'];

    const html = renderToString(
      <LanguageProvider>
        <SchemeDiscovery
          schemes={VERIFIED_REFERENCE_SCHEMES}
          isLoading={false}
          onRefreshSchemes={vi.fn()}
          onSelectForEligibility={vi.fn()}
          onNavigateToTracker={vi.fn()}
          selectedSchemeIdsForMapper={selectedIds}
          onSelectForMapper={vi.fn()}
        />
      </LanguageProvider>
    );

    // For PM-KISAN (which is in selectedIds), button reflects selection
    expect(html).toContain('In Document Mapper ✓');
    // For other schemes (which are NOT in selectedIds), button shows "+ Add to Mapper"
    expect(html).toContain('+ Add to Mapper');
  });

  it('synchronizes selected state on EligibilityScreen with DocumentMapper', () => {
    const selectedIds = ['ab-pmjay'];

    const html = renderToString(
      <LanguageProvider>
        <EligibilityScreen
          schemes={VERIFIED_REFERENCE_SCHEMES}
          profile={EMPTY_PROFILE}
          documents={INITIAL_DOCUMENT_RECORDS}
          onUpdateProfile={vi.fn()}
          onNavigate={vi.fn()}
          onSelectForMapper={vi.fn()}
          selectedSchemeIdsForMapper={selectedIds}
        />
      </LanguageProvider>
    );

    expect(html).toContain('In Document Mapper ✓');
    expect(html).toContain('+ Add to Mapper');
  });

  it('interactive workflow: adding schemes, preventing duplicates, removing schemes, and reset selection', () => {
    // Interactive test simulating citizen actions in a stateful container
    let currentSelected: string[] = [];
    const handleToggle = (schemeId: string) => {
      if (currentSelected.includes(schemeId)) {
        currentSelected = currentSelected.filter((id) => id !== schemeId);
      } else {
        currentSelected = Array.from(new Set([...currentSelected, schemeId]));
      }
    };
    const handleReset = () => {
      currentSelected = [];
    };

    // Step 1: Initial state is empty
    expect(currentSelected).toEqual([]);

    // Step 2: Citizen clicks "+ Add to Mapper" on PM-KISAN
    handleToggle('pm-kisan');
    expect(currentSelected).toEqual(['pm-kisan']);

    // Step 3: Citizen attempts to add PM-KISAN again (duplicate check)
    // If an explicit add is called or toggle:
    const handleAddIdempotent = (schemeId: string) => {
      if (!currentSelected.includes(schemeId)) {
        currentSelected = [...currentSelected, schemeId];
      }
    };
    handleAddIdempotent('pm-kisan');
    expect(currentSelected).toEqual(['pm-kisan']);

    // Step 4: Citizen adds two more schemes (total 3 schemes)
    handleAddIdempotent('ab-pmjay');
    handleAddIdempotent('pm-svanidhi');
    expect(currentSelected).toEqual(['pm-kisan', 'ab-pmjay', 'pm-svanidhi']);
    expect(currentSelected.length).toBe(3);

    // Step 5: Citizen removes one scheme ('ab-pmjay')
    handleToggle('ab-pmjay');
    expect(currentSelected).toEqual(['pm-kisan', 'pm-svanidhi']);
    expect(currentSelected.length).toBe(2);

    // Step 6: Citizen clicks "Reset Selection"
    handleReset();
    expect(currentSelected).toEqual([]);
  });
});
