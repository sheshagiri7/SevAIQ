import {
  Scheme,
  SchemeEligibilityRule,
  CitizenProfile,
  BackendCitizenProfile,
  BackendSchemeEligibilityResult,
  SchemeEvaluationResult,
  CriterionResult,
  DocumentPossessionStatus,
} from '../types';

/**
 * Known Scheme ID aliases between frontend reference records and backend catalog.
 * 'ab-pmjay' in client reference maps to 'pm-jay' in the authoritative backend catalog.
 */
export const SCHEME_ID_ALIASES: Record<string, string> = {
  'ab-pmjay': 'pm-jay',
};

export function resolveBackendSchemeId(id: string): string {
  if (!id) return '';
  const lower = id.trim().toLowerCase();
  return SCHEME_ID_ALIASES[lower] || lower;
}

/**
 * Schema Normalization Adapter
 * 
 * Maps incoming backend wire-format records (using snake_case JSON keys)
 * into the frontend's camelCase TypeScript domain models.
 */

export interface RawBackendEligibilityRule {
  min_age?: number;
  max_age?: number;
  allowed_genders?: ('Male' | 'Female' | 'Transgender' | 'All')[];
  allowed_areas?: ('Rural' | 'Urban' | 'All')[];
  allowed_occupations?: string[];
  max_income_bracket_index?: number;
  allowed_categories?: ('General' | 'OBC' | 'SC' | 'ST' | 'EWS')[];
  allowed_landholding?: ('None' | 'Marginal (< 1 ha)' | 'Small (1-2 ha)' | 'Medium/Large (> 2 ha)')[];
  must_be_student?: boolean;
  requires_disability?: boolean;
  // Also tolerate camelCase if already normalized
  minAge?: number;
  maxAge?: number;
  allowedGenders?: ('Male' | 'Female' | 'Transgender' | 'All')[];
  allowedAreas?: ('Rural' | 'Urban' | 'All')[];
  allowedOccupations?: string[];
  maxIncomeBracketIndex?: number;
  allowedCategories?: ('General' | 'OBC' | 'SC' | 'ST' | 'EWS')[];
  allowedLandholding?: ('None' | 'Marginal (< 1 ha)' | 'Small (1-2 ha)' | 'Medium/Large (> 2 ha)')[];
  mustBeStudent?: boolean;
  requiresDisability?: boolean;
}

export interface RawBackendScheme {
  id: string;
  title: string;
  short_description: string;
  category: string;
  ministry: string;
  beneficiary_type?: string | null;
  official_portal_url?: string | null;
  verified?: boolean;
  verification_source?: string | null;
  verification_date?: string | null;
  origin?: 'backend' | 'reference' | 'demonstration';
  rules?: RawBackendEligibilityRule | null;
  required_documents?: string[];
  benefits_summary?: string;
  application_mode?: 'Online' | 'CSC / Seva Kendra' | 'Both';
}

/**
 * Normalizes rule wire-format (snake_case) to client camelCase.
 */
export function normalizeEligibilityRule(
  rawRule?: RawBackendEligibilityRule | null
): SchemeEligibilityRule | undefined {
  if (!rawRule || typeof rawRule !== 'object') {
    return undefined;
  }

  return {
    minAge: rawRule.min_age !== undefined ? rawRule.min_age : rawRule.minAge,
    maxAge: rawRule.max_age !== undefined ? rawRule.max_age : rawRule.maxAge,
    allowedGenders: rawRule.allowed_genders || rawRule.allowedGenders,
    allowedAreas: rawRule.allowed_areas || rawRule.allowedAreas,
    allowedOccupations: rawRule.allowed_occupations || rawRule.allowedOccupations,
    maxIncomeBracketIndex:
      rawRule.max_income_bracket_index !== undefined
        ? rawRule.max_income_bracket_index
        : rawRule.maxIncomeBracketIndex,
    allowedCategories: rawRule.allowed_categories || rawRule.allowedCategories,
    allowedLandholding: rawRule.allowed_landholding || rawRule.allowedLandholding,
    mustBeStudent:
      rawRule.must_be_student !== undefined
        ? rawRule.must_be_student
        : rawRule.mustBeStudent,
    requiresDisability:
      rawRule.requires_disability !== undefined
        ? rawRule.requires_disability
        : rawRule.requiresDisability,
  };
}

/**
 * Normalizes an entire Scheme record from the backend wire format into the client domain model.
 */
export function normalizeScheme(raw: RawBackendScheme): Scheme {
  return {
    id: raw.id,
    title: raw.title,
    short_description: raw.short_description,
    category: raw.category,
    ministry: raw.ministry,
    beneficiary_type: raw.beneficiary_type || null,
    official_portal_url: raw.official_portal_url || null,
    verified: Boolean(raw.verified && raw.verification_source),
    verification_source: raw.verification_source || null,
    verification_date: raw.verification_date || 'Not recorded',
    origin: raw.origin || 'backend',
    rules: normalizeEligibilityRule(raw.rules),
    required_documents: raw.required_documents || [],
    benefits_summary: raw.benefits_summary,
    application_mode: raw.application_mode || 'Both',
  };
}

/**
 * Explicit typed adapter converting frontend citizen profile into backend API profile.
 * 
 * Rules:
 * - Rural / Urban -> 'rural' / 'urban'
 * - Landholding -> boolean only when established (None -> false, Marginal/Small/Medium -> true, else null)
 * - Annual income -> only numeric value when provided (never guess midpoints from income brackets)
 * - Never converts unanswered questions into false (leaves null)
 */
export function adaptProfileToBackend(
  profile: CitizenProfile,
  availableDocumentNames: string[] = []
): BackendCitizenProfile {
  let residence_type: 'rural' | 'urban' | null = null;
  if (profile.area === 'Rural') residence_type = 'rural';
  else if (profile.area === 'Urban') residence_type = 'urban';

  let owns_cultivable_land: boolean | null = null;
  if (profile.landholding === 'None') {
    owns_cultivable_land = false;
  } else if (
    profile.landholding === 'Marginal (< 1 ha)' ||
    profile.landholding === 'Small (1-2 ha)' ||
    profile.landholding === 'Medium/Large (> 2 ha)'
  ) {
    owns_cultivable_land = true;
  }

  return {
    age: typeof profile.age === 'number' && profile.age >= 0 ? profile.age : null,
    state: profile.state && profile.state.trim().length >= 2 ? profile.state.trim() : null,
    residence_type,
    occupation: profile.occupation && profile.occupation.trim().length > 0 ? profile.occupation.trim() : null,
    annual_income:
      typeof profile.annualIncome === 'number' && profile.annualIncome >= 0
        ? profile.annualIncome
        : null,
    owns_cultivable_land,
    owns_pucca_house: typeof profile.ownsPuccaHouse === 'boolean' ? profile.ownsPuccaHouse : null,
    is_tax_payer: typeof profile.isTaxPayer === 'boolean' ? profile.isTaxPayer : null,
    is_government_employee:
      typeof profile.isGovernmentEmployee === 'boolean' ? profile.isGovernmentEmployee : null,
    available_documents: availableDocumentNames,
  };
}

/**
 * Maps backend document status ('available', 'missing', 'needs_verification')
 * to frontend document possession status ('have', 'missing', 'unconfirmed').
 */
export function mapBackendStatusToFrontend(status: string): DocumentPossessionStatus {
  switch (status) {
    case 'available':
      return 'have';
    case 'missing':
      return 'missing';
    case 'needs_verification':
    default:
      return 'unconfirmed';
  }
}

/**
 * Maps frontend document status ('have', 'missing', 'unconfirmed')
 * to backend status ('available', 'missing', 'needs_verification').
 */
export function mapFrontendStatusToBackend(
  status: DocumentPossessionStatus
): 'available' | 'missing' | 'needs_verification' {
  switch (status) {
    case 'have':
      return 'available';
    case 'missing':
      return 'missing';
    case 'unconfirmed':
    default:
      return 'needs_verification';
  }
}

/**
 * Adapts a backend explainable evaluation result into the frontend SchemeEvaluationResult model.
 */
export function adaptBackendEligibilityResult(
  result: BackendSchemeEligibilityResult,
  resolvedScheme?: Scheme
): SchemeEvaluationResult {
  let overallStatus: 'met' | 'not_met' | 'unknown' = 'unknown';
  if (result.outcome === 'meets_known_criteria') {
    overallStatus = 'met';
  } else if (result.outcome === 'does_not_meet_known_criteria') {
    overallStatus = 'not_met';
  } else {
    overallStatus = 'unknown';
  }

  const criteriaResults: CriterionResult[] = [];

  result.criteria_matched.forEach((c, idx) => {
    criteriaResults.push({
      id: `matched-${idx + 1}`,
      label: 'Statutory Criterion Met',
      status: 'met',
      explanation: c,
    });
  });

  result.criteria_not_met.forEach((c, idx) => {
    criteriaResults.push({
      id: `unmet-${idx + 1}`,
      label: 'Criterion Disqualified',
      status: 'not_met',
      explanation: c,
    });
  });

  result.missing_information.forEach((c, idx) => {
    criteriaResults.push({
      id: `missing-${idx + 1}`,
      label: 'Needs Verification',
      status: 'unknown',
      explanation: c,
    });
  });

  const scheme: Scheme = resolvedScheme || {
    id: result.scheme_id,
    title: result.scheme_title,
    short_description: result.reasons[0] || 'Verified Government Scheme',
    category: result.category,
    ministry: '',
    official_portal_url: result.official_portal_url,
    verified: Boolean(result.verification_source),
    verification_source: result.verification_source,
    origin: 'backend',
  };

  return {
    scheme,
    overallStatus,
    criteriaResults,
    metCount: result.criteria_matched.length,
    totalCriteriaCount:
      result.criteria_matched.length +
      result.criteria_not_met.length +
      result.missing_information.length,
  };
}
