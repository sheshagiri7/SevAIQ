import { describe, it, expect } from 'vitest';
import { evaluateSchemeEligibility } from '../utils/eligibilityEngine';
import { CitizenProfile, Scheme } from '../types';

describe('Eligibility Engine Rule Evaluator', () => {
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

  it('never marks a scheme as "met" when required profile information is missing', () => {
    const schemeWithRules: Scheme = {
      id: 'test-farmer',
      title: 'Farmer Support Initiative',
      short_description: 'Benefits for rural farmers',
      category: 'Agriculture',
      ministry: 'Ministry of Agriculture',
      verified: true,
      rules: {
        minAge: 18,
        maxAge: 70,
        allowedOccupations: ['Farmer / Cultivator'],
        allowedAreas: ['Rural'],
      },
    };

    const result = evaluateSchemeEligibility(schemeWithRules, emptyProfile);
    expect(result.overallStatus).toBe('unknown');
    expect(result.metCount).toBe(0);

    const ageResult = result.criteriaResults.find((c) => c.id === 'age');
    const occResult = result.criteriaResults.find((c) => c.id === 'occupation');
    const areaResult = result.criteriaResults.find((c) => c.id === 'area');

    expect(ageResult?.status).toBe('unknown');
    expect(occResult?.status).toBe('unknown');
    expect(areaResult?.status).toBe('unknown');
  });

  describe('Gender Rule Evaluation', () => {
    const womenScheme: Scheme = {
      id: 'scheme-women',
      title: 'Women Empowerment Mission',
      short_description: 'Support for female entrepreneurs',
      category: 'Livelihood',
      ministry: 'Ministry of Women and Child Development',
      verified: true,
      rules: {
        allowedGenders: ['Female'],
      },
    };

    it('returns "met" when gender matches allowed criteria', () => {
      const profile: CitizenProfile = { ...emptyProfile, gender: 'Female' };
      const result = evaluateSchemeEligibility(womenScheme, profile);
      const genderResult = result.criteriaResults.find((c) => c.id === 'gender');
      expect(genderResult?.status).toBe('met');
      expect(result.overallStatus).toBe('met');
    });

    it('returns "not_met" when gender does not match allowed criteria', () => {
      const profile: CitizenProfile = { ...emptyProfile, gender: 'Male' };
      const result = evaluateSchemeEligibility(womenScheme, profile);
      const genderResult = result.criteriaResults.find((c) => c.id === 'gender');
      expect(genderResult?.status).toBe('not_met');
      expect(result.overallStatus).toBe('not_met');
    });

    it('returns "unknown" when gender is empty or set to "Prefer not to say"', () => {
      const profileEmpty: CitizenProfile = { ...emptyProfile, gender: '' };
      const resultEmpty = evaluateSchemeEligibility(womenScheme, profileEmpty);
      expect(resultEmpty.criteriaResults.find((c) => c.id === 'gender')?.status).toBe('unknown');
      expect(resultEmpty.overallStatus).toBe('unknown');

      const profilePreferNot: CitizenProfile = { ...emptyProfile, gender: 'Prefer not to say' };
      const resultPreferNot = evaluateSchemeEligibility(womenScheme, profilePreferNot);
      expect(resultPreferNot.criteriaResults.find((c) => c.id === 'gender')?.status).toBe('unknown');
      expect(resultPreferNot.overallStatus).toBe('unknown');
    });
  });

  describe('Disability (Divyangjan) Rule Evaluation', () => {
    const pwdScheme: Scheme = {
      id: 'scheme-divyangjan',
      title: 'Divyangjan Swavalamban Yojana',
      short_description: 'Assistive aids and pension for persons with disabilities',
      category: 'Social Justice',
      ministry: 'Ministry of Social Justice and Empowerment',
      verified: true,
      rules: {
        requiresDisability: true,
      },
    };

    it('returns "met" when citizen has indicated disability status', () => {
      const profile: CitizenProfile = { ...emptyProfile, hasDisability: true };
      const result = evaluateSchemeEligibility(pwdScheme, profile);
      const disabilityResult = result.criteriaResults.find((c) => c.id === 'disability');
      expect(disabilityResult?.status).toBe('met');
      expect(result.overallStatus).toBe('met');
    });

    it('returns "not_met" when citizen does not have disability status', () => {
      const profile: CitizenProfile = { ...emptyProfile, hasDisability: false };
      const result = evaluateSchemeEligibility(pwdScheme, profile);
      const disabilityResult = result.criteriaResults.find((c) => c.id === 'disability');
      expect(disabilityResult?.status).toBe('not_met');
      expect(result.overallStatus).toBe('not_met');
    });
  });

  describe('Overall Status Determination', () => {
    const multiCriteriaScheme: Scheme = {
      id: 'scheme-multi',
      title: 'Multi-Criteria Welfare Scheme',
      short_description: 'Requires student, category, and age',
      category: 'Education',
      ministry: 'Ministry of Education',
      verified: true,
      rules: {
        minAge: 15,
        maxAge: 30,
        mustBeStudent: true,
        allowedCategories: ['SC', 'ST', 'OBC'],
      },
    };

    it('returns "not_met" if even one criterion fails', () => {
      const profile: CitizenProfile = {
        ...emptyProfile,
        age: 20, // Met
        isStudent: false, // Not met!
        category: 'OBC', // Met
      };
      const result = evaluateSchemeEligibility(multiCriteriaScheme, profile);
      expect(result.overallStatus).toBe('not_met');
    });

    it('returns "unknown" if no criteria failed but some are missing', () => {
      const profile: CitizenProfile = {
        ...emptyProfile,
        age: 20, // Met
        isStudent: true, // Met
        category: '', // Missing!
      };
      const result = evaluateSchemeEligibility(multiCriteriaScheme, profile);
      expect(result.overallStatus).toBe('unknown');
    });

    it('returns "met" when all criteria are satisfied', () => {
      const profile: CitizenProfile = {
        ...emptyProfile,
        age: 20, // Met
        isStudent: true, // Met
        category: 'SC', // Met
      };
      const result = evaluateSchemeEligibility(multiCriteriaScheme, profile);
      expect(result.overallStatus).toBe('met');
      expect(result.metCount).toBe(3);
      expect(result.totalCriteriaCount).toBe(3);
    });
  });
});
