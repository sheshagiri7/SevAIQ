import { describe, it, expect } from 'vitest';
import { reconcileCatalogSchemes } from '../utils/catalogMerger';
import { Scheme } from '../types';

describe('Scheme Catalog Reconciler', () => {
  const mockReferenceSchemes: Scheme[] = [
    {
      id: 'ref-1',
      title: 'Reference Scheme 1',
      short_description: 'Description 1',
      category: 'Agriculture',
      ministry: 'Ministry of Agriculture',
      verified: true,
      verification_source: 'Official Gazette Notification 2021',
      verification_date: '2021-01-01',
      rules: { minAge: 18 },
      required_documents: ['land-records'],
    },
    {
      id: 'ref-2',
      title: 'Reference Scheme 2',
      short_description: 'Description 2',
      category: 'Healthcare',
      ministry: 'Ministry of Health',
      verified: true,
      verification_source: 'National Health Portal',
      verification_date: '2020-05-15',
    },
  ];

  it('preserves all valid reference schemes when backend returns an empty list', () => {
    const result = reconcileCatalogSchemes([], mockReferenceSchemes);
    expect(result.length).toBe(2);
    expect(result[0].id).toBe('ref-1');
    expect(result[1].id).toBe('ref-2');
  });

  it('does NOT remove unrelated reference schemes when backend returns only one scheme', () => {
    const backendSchemes: Scheme[] = [
      {
        id: 'ref-1',
        title: 'Backend Updated Title for Scheme 1',
        short_description: 'Backend updated description',
        category: 'Agriculture',
        ministry: 'Ministry of Agriculture',
        verified: true,
        verification_source: 'Updated Ministry API Source',
      },
    ];

    const result = reconcileCatalogSchemes(backendSchemes, mockReferenceSchemes);
    // Should still have both ref-1 and ref-2
    expect(result.length).toBe(2);

    const ref1 = result.find((s) => s.id === 'ref-1');
    const ref2 = result.find((s) => s.id === 'ref-2');

    expect(ref1).toBeDefined();
    expect(ref1?.title).toBe('Backend Updated Title for Scheme 1');
    expect(ref1?.origin).toBe('backend');
    // Rules and documents from reference model should be preserved if backend didn't provide them
    expect(ref1?.rules?.minAge).toBe(18);
    expect(ref1?.required_documents).toEqual(['land-records']);

    // ref-2 should be retained untouched
    expect(ref2).toBeDefined();
    expect(ref2?.title).toBe('Reference Scheme 2');
    expect(ref2?.origin).toBe('reference');
  });

  it('adds new schemes introduced by the backend', () => {
    const backendSchemes: Scheme[] = [
      {
        id: 'new-backend-scheme',
        title: 'Brand New Scheme from Backend',
        short_description: 'New verified program',
        category: 'Education',
        ministry: 'Ministry of Education',
        verified: true,
        verification_source: 'Official Education Portal',
      },
    ];

    const result = reconcileCatalogSchemes(backendSchemes, mockReferenceSchemes);
    expect(result.length).toBe(3);
    const newScheme = result.find((s) => s.id === 'new-backend-scheme');
    expect(newScheme).toBeDefined();
    expect(newScheme?.origin).toBe('backend');
  });

  it('refuses to label a scheme verified if verification_source is empty or missing', () => {
    const unverifiedReference: Scheme[] = [
      {
        id: 'unverified-scheme',
        title: 'Unverified Scheme',
        short_description: 'Missing official evidence',
        category: 'Social Welfare',
        ministry: 'Unknown Ministry',
        verified: true, // Erroneously set to true without source
        verification_source: '', // Empty source
      },
    ];

    const result = reconcileCatalogSchemes([], unverifiedReference);
    expect(result[0].verified).toBe(false);
    expect(result[0].origin).toBe('demonstration');
  });
});
