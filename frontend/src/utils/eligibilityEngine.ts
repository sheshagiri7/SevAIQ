import { CitizenProfile, Scheme, SchemeEvaluationResult, CriterionResult } from '../types';

const INCOME_BRACKET_INDEX: Record<string, number> = {
  '< 1 Lakh': 0,
  '1 - 2.5 Lakh': 1,
  '2.5 - 5 Lakh': 2,
  '5 - 8 Lakh': 3,
  '> 8 Lakh': 4,
};

/**
 * Transparent client-side eligibility evaluation engine.
 * Computes Met, Not met, and Unknown states with clear civic explanations.
 */
export function evaluateSchemeEligibility(
  scheme: Scheme,
  profile: CitizenProfile
): SchemeEvaluationResult {
  const criteriaResults: CriterionResult[] = [];
  const rules = scheme.rules;

  if (!rules) {
    // If no specific rules defined, criteria remain open/universal
    return {
      scheme,
      overallStatus: 'unknown',
      criteriaResults: [
        {
          id: 'general-verification',
          label: 'Eligibility Guidelines',
          status: 'unknown',
          explanation: 'Official scheme rules are pending verification by backend administration.',
        },
      ],
      metCount: 0,
      totalCriteriaCount: 1,
    };
  }

  // 1. Age Criterion
  if (rules.minAge !== undefined || rules.maxAge !== undefined) {
    const min = rules.minAge ?? 0;
    const max = rules.maxAge ?? 120;
    if (profile.age === null || profile.age === undefined) {
      criteriaResults.push({
        id: 'age',
        label: 'Age Requirement',
        status: 'unknown',
        explanation: `Age requirement: ${min} to ${max} years. Age is not yet set in profile.`,
        expectedRule: `${min} - ${max} years`,
        citizenValue: 'Not specified',
      });
    } else if (profile.age >= min && profile.age <= max) {
      criteriaResults.push({
        id: 'age',
        label: 'Age Requirement',
        status: 'met',
        explanation: `Your age (${profile.age}) meets the required bracket of ${min} to ${max} years.`,
        expectedRule: `${min} - ${max} years`,
        citizenValue: `${profile.age} years`,
      });
    } else {
      criteriaResults.push({
        id: 'age',
        label: 'Age Requirement',
        status: 'not_met',
        explanation: `Your age (${profile.age}) falls outside the allowable age limit (${min} to ${max} years).`,
        expectedRule: `${min} - ${max} years`,
        citizenValue: `${profile.age} years`,
      });
    }
  }

  // 2. Area / Residence Criterion
  if (rules.allowedAreas && rules.allowedAreas.length > 0 && !rules.allowedAreas.includes('All')) {
    if (!profile.area) {
      criteriaResults.push({
        id: 'area',
        label: 'Geographic Area',
        status: 'unknown',
        explanation: `Scheme is restricted to ${rules.allowedAreas.join(' or ')} regions. Area not specified.`,
        expectedRule: rules.allowedAreas.join(' / '),
        citizenValue: 'Not specified',
      });
    } else if (rules.allowedAreas.includes(profile.area)) {
      criteriaResults.push({
        id: 'area',
        label: 'Geographic Area',
        status: 'met',
        explanation: `Your residence (${profile.area}) qualifies for this program.`,
        expectedRule: rules.allowedAreas.join(' / '),
        citizenValue: profile.area,
      });
    } else {
      criteriaResults.push({
        id: 'area',
        label: 'Geographic Area',
        status: 'not_met',
        explanation: `Restricted to ${rules.allowedAreas.join(' or ')} citizens. Your profile is set to ${profile.area}.`,
        expectedRule: rules.allowedAreas.join(' / '),
        citizenValue: profile.area,
      });
    }
  }

  // 3. Occupation Criterion
  if (rules.allowedOccupations && rules.allowedOccupations.length > 0) {
    if (!profile.occupation) {
      criteriaResults.push({
        id: 'occupation',
        label: 'Occupational Eligibility',
        status: 'unknown',
        explanation: `Eligible occupations: ${rules.allowedOccupations.join(', ')}. Occupation not specified.`,
        expectedRule: rules.allowedOccupations.join(', '),
        citizenValue: 'Not specified',
      });
    } else if (rules.allowedOccupations.includes(profile.occupation)) {
      criteriaResults.push({
        id: 'occupation',
        label: 'Occupational Eligibility',
        status: 'met',
        explanation: `Your occupation (${profile.occupation}) is an authorized target group.`,
        expectedRule: rules.allowedOccupations.join(', '),
        citizenValue: profile.occupation,
      });
    } else {
      criteriaResults.push({
        id: 'occupation',
        label: 'Occupational Eligibility',
        status: 'not_met',
        explanation: `This scheme is designated for ${rules.allowedOccupations.join(', ')}. Your profile: ${profile.occupation}.`,
        expectedRule: rules.allowedOccupations.join(', '),
        citizenValue: profile.occupation,
      });
    }
  }

  // 4. Landholding Criterion
  if (rules.allowedLandholding && rules.allowedLandholding.length > 0) {
    if (!profile.landholding) {
      criteriaResults.push({
        id: 'landholding',
        label: 'Landholding Threshold',
        status: 'unknown',
        explanation: `Requires landholding status: ${rules.allowedLandholding.join(', ')}. Status not specified.`,
        expectedRule: rules.allowedLandholding.join(', '),
        citizenValue: 'Not specified',
      });
    } else if (rules.allowedLandholding.includes(profile.landholding)) {
      criteriaResults.push({
        id: 'landholding',
        label: 'Landholding Threshold',
        status: 'met',
        explanation: `Your landholding record (${profile.landholding}) is within eligible bounds.`,
        expectedRule: rules.allowedLandholding.join(', '),
        citizenValue: profile.landholding,
      });
    } else {
      criteriaResults.push({
        id: 'landholding',
        label: 'Landholding Threshold',
        status: 'not_met',
        explanation: `Eligible landholding: ${rules.allowedLandholding.join(', ')}. Your profile: ${profile.landholding}.`,
        expectedRule: rules.allowedLandholding.join(', '),
        citizenValue: profile.landholding,
      });
    }
  }

  // 5. Family Income Bracket Criterion
  if (rules.maxIncomeBracketIndex !== undefined) {
    if (!profile.incomeBracket) {
      criteriaResults.push({
        id: 'income',
        label: 'Annual Income Ceiling',
        status: 'unknown',
        explanation: `Income ceiling applies (up to ₹2.5 Lakh per annum). Family income not specified.`,
        expectedRule: 'Under ₹2.5 Lakh per annum',
        citizenValue: 'Not specified',
      });
    } else {
      const citizenIndex = INCOME_BRACKET_INDEX[profile.incomeBracket] ?? 99;
      if (citizenIndex <= rules.maxIncomeBracketIndex) {
        criteriaResults.push({
          id: 'income',
          label: 'Annual Income Ceiling',
          status: 'met',
          explanation: `Your annual family income (${profile.incomeBracket}) is within the allowable limit.`,
          expectedRule: 'Within scheme ceiling',
          citizenValue: profile.incomeBracket,
        });
      } else {
        criteriaResults.push({
          id: 'income',
          label: 'Annual Income Ceiling',
          status: 'not_met',
          explanation: `Your reported income (${profile.incomeBracket}) exceeds the maximum threshold for this scheme.`,
          expectedRule: 'Within scheme ceiling',
          citizenValue: profile.incomeBracket,
        });
      }
    }
  }

  // 6. Social Category (SC/ST/OBC/EWS) Criterion
  if (rules.allowedCategories && rules.allowedCategories.length > 0) {
    if (!profile.category) {
      criteriaResults.push({
        id: 'category',
        label: 'Social Category',
        status: 'unknown',
        explanation: `Applicable to ${rules.allowedCategories.join(', ')} categories. Category not selected.`,
        expectedRule: rules.allowedCategories.join(', '),
        citizenValue: 'Not specified',
      });
    } else if (rules.allowedCategories.includes(profile.category as any)) {
      criteriaResults.push({
        id: 'category',
        label: 'Social Category',
        status: 'met',
        explanation: `Your category (${profile.category}) qualifies for this targeted reservation program.`,
        expectedRule: rules.allowedCategories.join(', '),
        citizenValue: profile.category,
      });
    } else {
      criteriaResults.push({
        id: 'category',
        label: 'Social Category',
        status: 'not_met',
        explanation: `Restricted to ${rules.allowedCategories.join(', ')}. Your profile is ${profile.category}.`,
        expectedRule: rules.allowedCategories.join(', '),
        citizenValue: profile.category,
      });
    }
  }

  // 7. Student Enrollment Criterion
  if (rules.mustBeStudent) {
    if (profile.isStudent) {
      criteriaResults.push({
        id: 'student',
        label: 'Student Enrollment',
        status: 'met',
        explanation: 'Enrolled as an active student in a recognized educational institution.',
        expectedRule: 'Active Student',
        citizenValue: 'Enrolled',
      });
    } else {
      criteriaResults.push({
        id: 'student',
        label: 'Student Enrollment',
        status: 'not_met',
        explanation: 'This scheme requires active enrollment in higher secondary or tertiary education.',
        expectedRule: 'Active Student',
        citizenValue: 'Not a student',
      });
    }
  }

  // 8. Gender Criterion
  if (rules.allowedGenders && rules.allowedGenders.length > 0 && !rules.allowedGenders.includes('All')) {
    if (!profile.gender || profile.gender === 'Prefer not to say') {
      criteriaResults.push({
        id: 'gender',
        label: 'Gender Eligibility',
        status: 'unknown',
        explanation: `Scheme is designated for ${rules.allowedGenders.join(' / ')} applicants. Gender is not specified in profile.`,
        expectedRule: rules.allowedGenders.join(' / '),
        citizenValue: profile.gender || 'Not specified',
      });
    } else if (rules.allowedGenders.includes(profile.gender as any)) {
      criteriaResults.push({
        id: 'gender',
        label: 'Gender Eligibility',
        status: 'met',
        explanation: `Your gender profile (${profile.gender}) meets the eligible demographic criteria.`,
        expectedRule: rules.allowedGenders.join(' / '),
        citizenValue: profile.gender,
      });
    } else {
      criteriaResults.push({
        id: 'gender',
        label: 'Gender Eligibility',
        status: 'not_met',
        explanation: `Scheme criteria is restricted to ${rules.allowedGenders.join(' / ')}. Your profile: ${profile.gender}.`,
        expectedRule: rules.allowedGenders.join(' / '),
        citizenValue: profile.gender,
      });
    }
  }

  // 9. Disability Status (Divyangjan) Criterion
  if (rules.requiresDisability) {
    if (profile.hasDisability) {
      criteriaResults.push({
        id: 'disability',
        label: 'Disability Status (Divyangjan)',
        status: 'met',
        explanation: 'Eligible under Divyangjan / Persons with Disabilities (PwD) welfare provisions.',
        expectedRule: 'Disability status affirmed (Divyangjan / PwD)',
        citizenValue: 'Yes (Divyangjan)',
      });
    } else {
      criteriaResults.push({
        id: 'disability',
        label: 'Disability Status (Divyangjan)',
        status: 'not_met',
        explanation: 'This scheme is specifically designated for Persons with Disabilities (Divyangjan).',
        expectedRule: 'Disability status affirmed (Divyangjan / PwD)',
        citizenValue: 'No / Not indicated',
      });
    }
  }

  const metCount = criteriaResults.filter((c) => c.status === 'met').length;
  const hasNotMet = criteriaResults.some((c) => c.status === 'not_met');
  const hasUnknown = criteriaResults.some((c) => c.status === 'unknown');

  let overallStatus: 'met' | 'not_met' | 'unknown' = 'unknown';
  if (hasNotMet) {
    overallStatus = 'not_met';
  } else if (hasUnknown) {
    overallStatus = 'unknown';
  } else if (criteriaResults.length > 0 && metCount === criteriaResults.length) {
    overallStatus = 'met';
  }

  return {
    scheme,
    overallStatus,
    criteriaResults,
    metCount,
    totalCriteriaCount: criteriaResults.length,
  };
}
