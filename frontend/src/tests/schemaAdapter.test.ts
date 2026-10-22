import { describe, it, expect } from 'vitest';
import {
  normalizeEligibilityRule,
  normalizeScheme,
  RawBackendEligibilityRule,
  RawBackendScheme,
} from '../utils/schemaAdapter';

describe('Schema Adapter Suite (Backend snake_case to Frontend camelCase)', () => {
  describe('normalizeEligibilityRule', () => {
    it('returns undefined when rule is undefined or null', () => {
      expect(normalizeEligibilityRule(undefined)).toBeUndefined();
      expect(normalizeEligibilityRule(null)).toBeUndefined();
    });

    it('correctly maps snake_case properties to camelCase', () => {
      const rawRule: RawBackendEligibilityRule = {
        min_age: 18,
        max_age: 60,
        allowed_genders: ['Female', 'Transgender'],
        allowed_areas: ['Rural'],
        allowed_occupations: ['Farmer / Cultivator'],
        max_income_bracket_index: 2,
        allowed_categories: ['SC', 'ST', 'OBC'],
        allowed_landholding: ['Marginal (< 1 ha)', 'Small (1-2 ha)'],
        must_be_student: true,
        requires_disability: false,
      };

      const normalized = normalizeEligibilityRule(rawRule);
      expect(normalized).toBeDefined();
      expect(normalized?.minAge).toBe(18);
      expect(normalized?.maxAge).toBe(60);
      expect(normalized?.allowedGenders).toEqual(['Female', 'Transgender']);
      expect(normalized?.allowedAreas).toEqual(['Rural']);
      expect(normalized?.allowedOccupations).toEqual(['Farmer / Cultivator']);
      expect(normalized?.maxIncomeBracketIndex).toBe(2);
      expect(normalized?.allowedCategories).toEqual(['SC', 'ST', 'OBC']);
      expect(normalized?.allowedLandholding).toEqual(['Marginal (< 1 ha)', 'Small (1-2 ha)']);
      expect(normalized?.mustBeStudent).toBe(true);
      expect(normalized?.requiresDisability).toBe(false);
    });

    it('tolerates already-normalized camelCase properties', () => {
      const rawRule: RawBackendEligibilityRule = {
        minAge: 21,
        maxAge: 40,
        mustBeStudent: false,
        requiresDisability: true,
      };

      const normalized = normalizeEligibilityRule(rawRule);
      expect(normalized?.minAge).toBe(21);
      expect(normalized?.maxAge).toBe(40);
      expect(normalized?.mustBeStudent).toBe(false);
      expect(normalized?.requiresDisability).toBe(true);
    });
  });

  describe('normalizeScheme', () => {
    it('maps top-level scheme fields with snake_case and normalizes nested eligibility rules', () => {
      const rawScheme: RawBackendScheme = {
        id: 'pm-kisan',
        title: 'Pradhan Mantri Kisan Samman Nidhi',
        short_description: 'Direct income support of ₹6,000 per year to small and marginal farmers.',
        category: 'Agriculture & Rural',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        beneficiary_type: 'Individual Farmer Families',
        official_portal_url: 'https://pmkisan.gov.in',
        verified: true,
        verification_source: 'pmkisan.gov.in official operational guidelines',
        verification_date: '2024-02-15',
        origin: 'backend',
        rules: {
          min_age: 18,
          allowed_occupations: ['Farmer / Cultivator'],
          allowed_landholding: ['Marginal (< 1 ha)', 'Small (1-2 ha)'],
        },
        required_documents: ['Aadhaar Card', 'Land Ownership Records', 'Bank Account Details'],
        benefits_summary: '₹6,000 per year in three equal installments',
        application_mode: 'Both',
      };

      const normalized = normalizeScheme(rawScheme);

      expect(normalized.id).toBe('pm-kisan');
      expect(normalized.title).toBe('Pradhan Mantri Kisan Samman Nidhi');
      expect(normalized.short_description).toBe(rawScheme.short_description);
      expect(normalized.category).toBe('Agriculture & Rural');
      expect(normalized.ministry).toBe('Ministry of Agriculture & Farmers Welfare');
      expect(normalized.beneficiary_type).toBe('Individual Farmer Families');
      expect(normalized.official_portal_url).toBe('https://pmkisan.gov.in');
      expect(normalized.verified).toBe(true);
      expect(normalized.verification_source).toBe('pmkisan.gov.in official operational guidelines');
      expect(normalized.origin).toBe('backend');

      // Check nested normalized rules
      expect(normalized.rules).toBeDefined();
      expect(normalized.rules?.minAge).toBe(18);
      expect(normalized.rules?.allowedOccupations).toEqual(['Farmer / Cultivator']);
      expect(normalized.rules?.allowedLandholding).toEqual(['Marginal (< 1 ha)', 'Small (1-2 ha)']);

      // Check lists
      expect(normalized.required_documents).toEqual([
        'Aadhaar Card',
        'Land Ownership Records',
        'Bank Account Details',
      ]);
    });

    it('requires both verified: true and verification_source to mark verified', () => {
      const unverifiedScheme: RawBackendScheme = {
        id: 'unverified-scheme',
        title: 'Unverified Scheme Title',
        short_description: 'Description without citation',
        category: 'Healthcare',
        ministry: 'Ministry of Health',
        verified: true,
        verification_source: '', // Empty source
      };

      const normalized = normalizeScheme(unverifiedScheme);
      expect(normalized.verified).toBe(false);
    });

    it('handles schemes without rules gracefully', () => {
      const basicScheme: RawBackendScheme = {
        id: 'general-welfare',
        title: 'General Welfare',
        short_description: 'Universal support for all citizens',
        category: 'Social Welfare',
        ministry: 'Ministry of Social Justice',
        verified: false,
      };

      const normalized = normalizeScheme(basicScheme);
      expect(normalized.rules).toBeUndefined();
      expect(normalized.required_documents).toEqual([]);
      expect(normalized.application_mode).toBe('Both');
    });
  });
});
