import { Scheme } from '../types';

/**
 * Reconciles schemes from the FastAPI backend with the reference catalog.
 * 
 * Rules:
 * 1. Preserves valid reference entries so backend entries don't wipe them out.
 * 2. Backend entries take precedence for stable matching IDs.
 * 3. Never labels a scheme verified unless genuine verification source information is present.
 * 4. Explicitly tags origin ('backend' vs 'reference' vs 'demonstration').
 * 5. Deterministic deduplication by scheme ID.
 */
export function reconcileCatalogSchemes(
  backendSchemes: Scheme[],
  referenceSchemes: Scheme[]
): Scheme[] {
  const schemeMap = new Map<string, Scheme>();

  // 1. Process reference schemes
  for (const ref of referenceSchemes) {
    if (!ref.id) continue;

    // Check if official verification source evidence exists
    const hasSource = Boolean(ref.verification_source && ref.verification_source.trim() !== '');
    const isVerified = Boolean(ref.verified && hasSource);

    schemeMap.set(ref.id, {
      ...ref,
      verified: isVerified,
      origin: ref.origin || (isVerified ? 'reference' : 'demonstration'),
      verification_date: ref.verification_date || 'Not recorded',
      verification_source: hasSource ? ref.verification_source : null,
    });
  }

  // 2. Reconcile backend schemes
  for (const bScheme of backendSchemes) {
    if (!bScheme.id) continue;

    const hasSource = Boolean(
      bScheme.verification_source && bScheme.verification_source.trim() !== ''
    );
    const isVerified = Boolean(bScheme.verified && hasSource);

    const existing = schemeMap.get(bScheme.id);

    if (existing) {
      // Backend metadata overlays reference metadata
      schemeMap.set(bScheme.id, {
        ...existing,
        ...bScheme,
        verified: isVerified,
        origin: 'backend',
        // Preserve client-side eligibility rules and documents if backend does not yet provide them
        rules: bScheme.rules || existing.rules,
        required_documents: bScheme.required_documents || existing.required_documents,
        benefits_summary: bScheme.benefits_summary || existing.benefits_summary,
        application_mode: bScheme.application_mode || existing.application_mode,
        verification_date: bScheme.verification_date || existing.verification_date || 'Not recorded',
        verification_source: hasSource ? bScheme.verification_source : existing.verification_source,
      });
    } else {
      // Completely new backend scheme
      schemeMap.set(bScheme.id, {
        ...bScheme,
        verified: isVerified,
        origin: 'backend',
        verification_date: bScheme.verification_date || 'Not recorded',
        verification_source: hasSource ? bScheme.verification_source : null,
      });
    }
  }

  return Array.from(schemeMap.values());
}
