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
  detailed_benefits?: string | null;
  eligibility_summary?: string | null;
  application_mode?: 'Online' | 'CSC / Seva Kendra' | 'Both';
  image_url?: string | null;
}

/**
 * Detailed verified scheme details returned by GET /api/schemes/{id}
 */
export interface SchemeDetail extends Scheme {
  nodal_agency?: string | null;
  detailed_benefits?: string | null;
  eligibility_summary?: string | null;
  eligibility_criteria?: Record<string, any>;
  application_steps?: string[];
}

/**
 * Category count returned by GET /api/categories
 */
export interface CategoryCount {
  category: string;
  count: number;
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
  // Optional statutory criteria inputs for backend API matching
  annualIncome?: number | null;
  ownsPuccaHouse?: boolean | null;
  isTaxPayer?: boolean | null;
  isGovernmentEmployee?: boolean | null;
}

/**
 * Backend CitizenProfile wire model for POST /api/eligibility/check & POST /api/passport/pdf
 */
export interface BackendCitizenProfile {
  age?: number | null;
  state?: string | null;
  residence_type?: 'rural' | 'urban' | null;
  occupation?: string | null;
  annual_income?: number | null;
  owns_cultivable_land?: boolean | null;
  owns_pucca_house?: boolean | null;
  is_tax_payer?: boolean | null;
  is_government_employee?: boolean | null;
  available_documents?: string[];
}

export type BackendEligibilityOutcome =
  | 'meets_known_criteria'
  | 'does_not_meet_known_criteria'
  | 'needs_verification';

export interface BackendSchemeEligibilityResult {
  scheme_id: string;
  scheme_title: string;
  category: string;
  outcome: BackendEligibilityOutcome;
  reasons: string[];
  criteria_matched: string[];
  criteria_not_met: string[];
  missing_information: string[];
  official_portal_url?: string | null;
  verification_source?: string | null;
}

export interface BackendEligibilityCheckResponse {
  total_schemes_evaluated: number;
  summary: {
    meets_known_criteria: number;
    does_not_meet_known_criteria: number;
    needs_verification: number;
  };
  schemes: BackendSchemeEligibilityResult[];
}

export interface BackendMappedDocument {
  canonical_name: string;
  raw_names: string[];
  schemes_requiring: string[];
  reusability_count: number;
  status: 'available' | 'missing' | 'needs_verification';
  category: string;
}

export interface BackendReadinessScore {
  score_percentage: number;
  numerator: number;
  denominator: number;
  formula: string;
  disclaimer: string;
}

export interface BackendDocumentMappingResponse {
  selected_scheme_ids: string[];
  selected_schemes_summary: Array<{ id: string; title: string }>;
  total_unique_required_documents: number;
  reusable_documents: BackendMappedDocument[];
  single_scheme_documents: BackendMappedDocument[];
  available_documents: BackendMappedDocument[];
  missing_documents: BackendMappedDocument[];
  unverified_requirements: string[];
  readiness_score: BackendReadinessScore;
  official_source_references: Array<{
    scheme_id: string;
    scheme_title: string;
    official_portal_url?: string | null;
    verification_source?: string | null;
  }>;
}

export interface DocumentMapperRequest {
  scheme_ids: string[];
  citizen_documents?: string[];
  profile?: BackendCitizenProfile | null;
}

export interface PassportRequest {
  scheme_ids: string[];
  profile: BackendCitizenProfile;
  citizen_documents?: string[];
  notes?: string;
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
  | 'chat'
  | 'dashboard'
  | 'discover'
  | 'eligibility'
  | 'document-mapper'
  | 'readiness-passport'
  | 'voice-assistant'
  | 'trust-monitor'
  | 'application-tracker';

export type AssistantLanguage = 'en' | 'ta' | 'hi';

export interface ChatMessageWire {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequestPayload {
  messages: ChatMessageWire[];
  language?: string;
  context_scheme_id?: string;
  citizen_context?: Record<string, any>;
}

export interface ChatResponsePayload {
  reply: string;
  provider: string;
  model: string;
  status: 'success' | 'error';
  latency_ms?: number;
  error_type?: string;
  error_message?: string;
  suggested_schemes?: string[];
}

export interface ProviderStatus {
  provider_id: string;
  display_name: string;
  configured: boolean;
  status: 'ready' | 'not_configured' | 'quota_exhausted' | 'error';
  message: string;
}

export interface AssistantMessage {
  id: string;
  sender: 'citizen' | 'assistant';
  text: string;
  timestamp: Date;
  suggestedSchemes?: Scheme[];
  suggestedAction?: {
    label: string;
    tab: NavigationTab;
  };
  provider?: string;
  model?: string;
  latencyMs?: number;
  isError?: boolean;
  errorType?: string;
  retryable?: boolean;
}

export interface ApplicationStepProgress {
  schemeId: string;
  completedSteps: number[]; // index of completed application steps
  status: 'not_started' | 'preparing_documents' | 'submitted_on_portal' | 'tracking_externally';
  notes?: string;
  lastUpdated: string;
}
