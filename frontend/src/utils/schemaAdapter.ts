import { Scheme, SchemeEligibilityRule } from '../types';

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
