/**
 * Type definitions for SevAIQ Frontend
 * Aligned with docs/API_CONTRACT.md and civic intelligence workflows.
 */

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy' | string;
  service: string;
  version: string;
}

export type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error';

export interface ApiState {
  status: ConnectionStatus;
  baseUrl: string;
  health: HealthResponse | null;
  latencyMs: number | null;
  errorMessage: string | null;
  lastChecked: Date | null;
}

/**
 * Government scheme criterion rule specification
 */
export interface SchemeEligibilityRule {
  minAge?: number;
  maxAge?: number;
  allowedGenders?: ('Male' | 'Female' | 'Transgender' | 'All')[];
  allowedAreas?: ('Rural' | 'Urban' | 'All')[];
  allowedOccupations?: string[];
  maxIncomeBracketIndex?: number; // 0: <1L, 1: 1-2.5L, 2: 2.5-5L, 3: 5-8L, 4: >8L
  allowedCategories?: ('General' | 'OBC' | 'SC' | 'ST' | 'EWS')[];
  allowedLandholding?: ('None' | 'Marginal (< 1 ha)' | 'Small (1-2 ha)' | 'Medium/Large (> 2 ha)')[];
  mustBeStudent?: boolean;
  requiresDisability?: boolean;
}

/**
 * Core Scheme model matching docs/API_CONTRACT.md,
 * with optional criteria and document arrays for civic assessment.
 */
export interface Scheme {
  id: string;
  title: string;
  short_description: string;
  category: string;
  ministry: string;
  beneficiary_type?: string | null;
  official_portal_url?: string | null;
  verified: boolean;
  verification_source?: string | null;
  verification_date?: string | null;
  origin?: 'backend' | 'reference' | 'demonstration';
  // Extended criteria & documents for frontend assessment
  rules?: SchemeEligibilityRule;
  required_documents?: string[];
  benefits_summary?: string;
  application_mode?: 'Online' | 'CSC / Seva Kendra' | 'Both';
}

/**
 * Citizen Profile for eligibility matching.
 * PRIVACY MANDATE: strictly no Aadhaar or bank account numbers collected.
 */
export interface CitizenProfile {
  age: number | null;
  gender: 'Female' | 'Male' | 'Transgender' | 'Prefer not to say' | '';
  state: string;
  area: 'Rural' | 'Urban' | '';
  occupation: string;
  incomeBracket: '< 1 Lakh' | '1 - 2.5 Lakh' | '2.5 - 5 Lakh' | '5 - 8 Lakh' | '> 8 Lakh' | '';
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS' | '';
  landholding: 'None' | 'Marginal (< 1 ha)' | 'Small (1-2 ha)' | 'Medium/Large (> 2 ha)' | '';
  isStudent: boolean;
  hasDisability: boolean;
}

export type EligibilityStatus = 'met' | 'not_met' | 'unknown';

export interface CriterionResult {
  id: string;
  label: string;
  status: EligibilityStatus;
  explanation: string;
  citizenValue?: string;
  expectedRule?: string;
}

export interface SchemeEvaluationResult {
  scheme: Scheme;
  overallStatus: EligibilityStatus;
  criteriaResults: CriterionResult[];
  metCount: number;
  totalCriteriaCount: number;
}

export type DocumentPossessionStatus = 'have' | 'missing' | 'unconfirmed';

export interface DocumentRecord {
  id: string;
  name: string;
  description: string;
  issuingAuthority: string;
  applicableSchemeIds: string[];
  status: DocumentPossessionStatus;
}

export type NavigationTab =
  | 'dashboard'
  | 'discover'
  | 'eligibility'
  | 'document-mapper'
  | 'readiness-passport';
