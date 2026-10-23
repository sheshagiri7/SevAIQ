import { describe, it, expect } from 'vitest';
import {
  normalizeEligibilityRule,
  normalizeScheme,
  resolveBackendSchemeId,
  adaptProfileToBackend,
  mapBackendStatusToFrontend,
  mapFrontendStatusToBackend,
  adaptBackendEligibilityResult,
  RawBackendEligibilityRule,
  RawBackendScheme,
} from '../utils/schemaAdapter';
import { CitizenProfile, BackendSchemeEligibilityResult } from '../types';

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

  describe('resolveBackendSchemeId', () => {
    it('maps ab-pmjay alias to backend authoritative pm-jay', () => {
      expect(resolveBackendSchemeId('ab-pmjay')).toBe('pm-jay');
      expect(resolveBackendSchemeId('AB-PMJAY')).toBe('pm-jay');
    });

    it('returns original normalized id for standard scheme IDs', () => {
      expect(resolveBackendSchemeId('pm-kisan')).toBe('pm-kisan');
      expect(resolveBackendSchemeId('PM-KISAN')).toBe('pm-kisan');
    });

    it('handles empty or whitespace strings', () => {
      expect(resolveBackendSchemeId('')).toBe('');
      expect(resolveBackendSchemeId('   ')).toBe('');
    });
  });

  describe('adaptProfileToBackend', () => {
    it('correctly maps citizen profile to backend wire format', () => {
      const frontendProfile: CitizenProfile = {
        age: 35,
        gender: 'Male',
        state: 'Karnataka',
        area: 'Rural',
        occupation: 'Farmer / Cultivator',
        incomeBracket: '1 - 2.5 Lakh',
        annualIncome: 120000,
        category: 'OBC',
        landholding: 'Marginal (< 1 ha)',
        isStudent: false,
        hasDisability: false,
        ownsPuccaHouse: false,
        isTaxPayer: false,
        isGovernmentEmployee: false,
      };

      const backendProfile = adaptProfileToBackend(frontendProfile, ['Aadhaar Card', 'Land Records']);

      expect(backendProfile.age).toBe(35);
      expect(backendProfile.state).toBe('Karnataka');
      expect(backendProfile.residence_type).toBe('rural');
      expect(backendProfile.occupation).toBe('Farmer / Cultivator');
      expect(backendProfile.annual_income).toBe(120000);
      expect(backendProfile.owns_cultivable_land).toBe(true);
      expect(backendProfile.owns_pucca_house).toBe(false);
      expect(backendProfile.is_tax_payer).toBe(false);
      expect(backendProfile.is_government_employee).toBe(false);
      expect(backendProfile.available_documents).toEqual(['Aadhaar Card', 'Land Records']);
    });

    it('never guesses income midpoint when annualIncome is undefined', () => {
      const frontendProfile: CitizenProfile = {
        age: 28,
        gender: 'Female',
        state: 'Delhi',
        area: 'Urban',
        occupation: 'Street Vendor',
        incomeBracket: '1 - 2.5 Lakh',
        category: 'General',
        landholding: 'None',
        isStudent: false,
        hasDisability: false,
      };

      const backendProfile = adaptProfileToBackend(frontendProfile);
      expect(backendProfile.annual_income).toBeNull();
      expect(backendProfile.residence_type).toBe('urban');
      expect(backendProfile.owns_cultivable_land).toBe(false);
    });

    it('preserves null for unselected fields', () => {
      const emptyProfile: CitizenProfile = {
        age: null,
        gender: '',
        state: '',
        area: '',
        occupation: '',
        incomeBracket: '',
        category: '',
        landholding: '',
        isStudent: false,
        hasDisability: false,
      };
      const backendProfile = adaptProfileToBackend(emptyProfile);

      expect(backendProfile.age).toBeNull();
      expect(backendProfile.state).toBeNull();
      expect(backendProfile.residence_type).toBeNull();
      expect(backendProfile.occupation).toBeNull();
      expect(backendProfile.annual_income).toBeNull();
      expect(backendProfile.owns_cultivable_land).toBeNull();
      expect(backendProfile.owns_pucca_house).toBeNull();
      expect(backendProfile.is_tax_payer).toBeNull();
      expect(backendProfile.is_government_employee).toBeNull();
      expect(backendProfile.available_documents).toEqual([]);
    });
  });

  describe('mapBackendStatusToFrontend and mapFrontendStatusToBackend', () => {
    it('correctly maps between backend wire document status and frontend possession status', () => {
      expect(mapBackendStatusToFrontend('available')).toBe('have');
      expect(mapBackendStatusToFrontend('missing')).toBe('missing');
      expect(mapBackendStatusToFrontend('needs_verification')).toBe('unconfirmed');
      expect(mapBackendStatusToFrontend('unknown_status')).toBe('unconfirmed');

      expect(mapFrontendStatusToBackend('have')).toBe('available');
      expect(mapFrontendStatusToBackend('missing')).toBe('missing');
      expect(mapFrontendStatusToBackend('unconfirmed')).toBe('needs_verification');
    });
  });

  describe('adaptBackendEligibilityResult', () => {
    it('transforms meets_known_criteria outcome to met status with criteria details', () => {
      const backendResult: BackendSchemeEligibilityResult = {
        scheme_id: 'pm-kisan',
        scheme_title: 'PM-KISAN',
        category: 'Agriculture & Rural',
        official_portal_url: 'https://pmkisan.gov.in',
        verification_source: 'Operational Guidelines',
        outcome: 'meets_known_criteria',
        reasons: ['Citizen meets all known criteria.'],
        criteria_matched: ['Age 18+ verified', 'Owns cultivable land verified'],
        criteria_not_met: [],
        missing_information: [],
      };

      const adapted = adaptBackendEligibilityResult(backendResult);
      expect(adapted.overallStatus).toBe('met');
      expect(adapted.metCount).toBe(2);
      expect(adapted.totalCriteriaCount).toBe(2);
      expect(adapted.criteriaResults).toHaveLength(2);
      expect(adapted.criteriaResults[0].status).toBe('met');
      expect(adapted.scheme.id).toBe('pm-kisan');
      expect(adapted.scheme.verified).toBe(true);
    });

    it('transforms does_not_meet_known_criteria outcome to not_met status', () => {
      const backendResult: BackendSchemeEligibilityResult = {
        scheme_id: 'pm-kisan',
        scheme_title: 'PM-KISAN',
        category: 'Agriculture & Rural',
        official_portal_url: 'https://pmkisan.gov.in',
        verification_source: 'Operational Guidelines',
        outcome: 'does_not_meet_known_criteria',
        reasons: ['Income taxpayer disqualified.'],
        criteria_matched: [],
        criteria_not_met: ['Institutional landholder or income taxpayer excluded'],
        missing_information: [],
      };

      const adapted = adaptBackendEligibilityResult(backendResult);
      expect(adapted.overallStatus).toBe('not_met');
      expect(adapted.metCount).toBe(0);
      expect(adapted.criteriaResults[0].status).toBe('not_met');
    });

    it('transforms needs_verification outcome to unknown status', () => {
      const backendResult: BackendSchemeEligibilityResult = {
        scheme_id: 'pm-jay',
        scheme_title: 'Ayushman Bharat PM-JAY',
        category: 'Healthcare',
        official_portal_url: 'https://pmjay.gov.in',
        verification_source: 'NHA Guidelines',
        outcome: 'needs_verification',
        reasons: ['SECC 2011 entitlement status not provided.'],
        criteria_matched: [],
        criteria_not_met: [],
        missing_information: ['SECC 2011 / Ration Card entitlement requires verification'],
      };

      const adapted = adaptBackendEligibilityResult(backendResult);
      expect(adapted.overallStatus).toBe('unknown');
      expect(adapted.criteriaResults[0].status).toBe('unknown');
    });
  });
});
