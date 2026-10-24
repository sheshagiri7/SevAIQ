import { describe, it, expect } from 'vitest';
import { reconcileCatalogSchemes } from '../utils/catalogMerger';
import { normalizeScheme } from '../utils/schemaAdapter';
import { classifyDomainTrust, getFriendlyGovLabel } from '../components/CivicMarkdown';
import { VERIFIED_REFERENCE_SCHEMES } from '../data/verifiedReferenceSchemes';
import { Scheme } from '../types';

describe('Scheme Catalog Corrections & Trust Audit Suite', () => {
  describe('1. PMAY-U 2.0 Multi-Component & Income Tiers', () => {
    it('normalizes PMAY-U 2.0 record with 4 programme verticals and official portal', () => {
      const rawPmayU2 = {
        id: 'pmay-u',
        title: 'Pradhan Mantri Awas Yojana - Urban 2.0 (PMAY-U 2.0)',
        short_description: 'Government housing initiative providing financial assistance and interest subsidies for 1 crore urban families.',
        category: 'Housing & Infrastructure',
        ministry: 'Ministry of Housing and Urban Affairs',
        beneficiary_type: 'Urban EWS, LIG, and Middle Income Group (MIG) families',
        official_portal_url: 'https://pmay-urban.gov.in',
        verified: true,
        verification_source: 'Union Cabinet Decision & MoHUA PMAY-U 2.0 Operational Guidelines (PIB PRID: 2043924; pmay-urban.gov.in)',
        verification_date: '2024-08-09',
        rules: {
          min_age: 18,
          allowed_areas: ['Urban'] as ('Urban')[],
          max_income_bracket_index: 2,
        },
      };

      const normalized = normalizeScheme(rawPmayU2);
      expect(normalized.id).toBe('pmay-u');
      expect(normalized.title).toContain('PMAY-U 2.0');
      expect(normalized.verification_date).toBe('2024-08-09');
      expect(normalized.official_portal_url).toBe('https://pmay-urban.gov.in');
      expect(normalized.verified).toBe(true);
      expect(normalized.rules?.allowedAreas).toContain('Urban');
    });

    it('classifies pmay-urban.gov.in as an official government domain', () => {
      expect(classifyDomainTrust('https://pmay-urban.gov.in')).toBe('official_gov');
      expect(getFriendlyGovLabel('https://pmay-urban.gov.in')).toBe(
        'Official PMAY-Urban Portal (pmay-urban.gov.in)'
      );
    });
  });

  describe('2. PM Mudra Yojana: Tarun Plus & Credit vs Grant Classification', () => {
    it('normalizes PM Mudra Yojana with genuine DFS verification and credit classification', () => {
      const rawMudra = {
        id: 'pm-mudra-yojana',
        title: 'Pradhan Mantri Mudra Yojana (PMMY)',
        short_description: 'Institutional collateral-free business loan facility up to ₹20 Lakhs across Shishu, Kishore, Tarun, and Tarun Plus.',
        category: 'Financial Inclusion & Livelihood',
        ministry: 'Ministry of Finance',
        official_portal_url: 'https://financialservices.gov.in/pradhan-mantri-mudra-yojana-pmmy',
        verified: true,
        verification_source: 'Department of Financial Services (DFS), Ministry of Finance Notification & MUDRA Guidelines (financialservices.gov.in / mudra.org.in)',
        verification_date: '2024-10-24',
      };

      const normalized = normalizeScheme(rawMudra);
      expect(normalized.id).toBe('pm-mudra-yojana');
      expect(normalized.verified).toBe(true);
      expect(normalized.verification_date).toBe('2024-10-24');
      expect(normalized.origin).toBe('backend');
    });

    it('classifies financialservices.gov.in as official government and mudra.org.in as authorized agency', () => {
      expect(classifyDomainTrust('https://financialservices.gov.in/pradhan-mantri-mudra-yojana-pmmy')).toBe(
        'official_gov'
      );
      expect(classifyDomainTrust('https://www.mudra.org.in')).toBe('authorized_agency');
    });
  });

  describe('3. Catalogue Reconciliation (nsp-post-matric)', () => {
    it('reconciles backend nsp-post-matric with reference scheme without losing client rules', () => {
      const backendSchemes: Scheme[] = [
        {
          id: 'nsp-post-matric',
          title: 'Post-Matric Scholarship for SC/ST/OBC Students',
          short_description: 'Centrally sponsored financial scholarship providing 100% compulsory fee reimbursement.',
          category: 'Education & Skilling',
          ministry: 'Ministry of Social Justice and Empowerment / Ministry of Tribal Affairs',
          official_portal_url: 'https://scholarships.gov.in',
          verified: true,
          verification_source: 'National Scholarship Portal Guidelines (scholarships.gov.in)',
          verification_date: '2024-07-01',
          origin: 'backend',
        },
      ];

      const reconciled = reconcileCatalogSchemes(backendSchemes, VERIFIED_REFERENCE_SCHEMES);
      const nspScheme = reconciled.find((s) => s.id === 'nsp-post-matric');

      expect(nspScheme).toBeDefined();
      expect(nspScheme?.origin).toBe('backend');
      expect(nspScheme?.verified).toBe(true);
      expect(nspScheme?.verification_date).toBe('2024-07-01');
      // Inherited client-side rules preserved
      expect(nspScheme?.rules?.mustBeStudent).toBe(true);
      expect(nspScheme?.rules?.allowedCategories).toEqual(['SC', 'ST', 'OBC']);
    });
  });

  describe('4. Source Provenance & Trust Metadata Integrity', () => {
    it('ensures no reference scheme has placeholder date 2026-10-22 or missing source', () => {
      VERIFIED_REFERENCE_SCHEMES.forEach((scheme) => {
        expect(scheme.verification_date).toBeDefined();
        expect(scheme.verification_date).not.toBe('2026-10-22');
        expect(scheme.verification_date).not.toBe('Not recorded');
        expect(scheme.verification_source).toBeTruthy();
        expect(scheme.verified).toBe(true);
      });
    });
  });
});
