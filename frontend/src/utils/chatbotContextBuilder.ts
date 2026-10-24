/**
 * Controlled Citizen Context Builder for SevAIQ AI Chatbot.
 * 
 * Prepares privacy-sanitized, minimum necessary session state
 * (profile answers, scheme recommendations with MatchProof, document checklist,
 * and user-recorded application statuses) to ground Gemini responses in the
 * citizen's real situation.
 * 
 * STRICT PRIVACY MANDATE:
 * Absolutely NO Aadhaar numbers, PAN numbers, bank account numbers,
 * phone numbers, or passwords are ever captured or passed.
 */

import { CitizenProfile, Scheme, DocumentRecord } from '../types';
import { evaluateSchemeEligibility } from './eligibilityEngine';

export interface CitizenChatContext {
  profile?: {
    state?: string;
    area?: string;
    age?: number | null;
    occupation?: string;
    income_bracket?: string;
    category?: string;
    landholding?: string;
    is_student?: boolean;
    has_disability?: boolean;
  };
  scheme_matches?: Array<{
    id: string;
    title: string;
    status: 'Potential match' | 'More info needed' | 'Criteria not met';
    reasons: string[];
    missing: string[];
  }>;
  documents?: {
    selected_schemes: string[];
    total_required: number;
    have_documents: string[];
    missing_documents: string[];
    unconfirmed_documents: string[];
    readiness_percentage: number;
  };
  tracking?: Record<string, string>;
  next_best_action?: string;
}

export function buildCitizenChatContext(
  profile?: CitizenProfile,
  schemes: Scheme[] = [],
  documents: DocumentRecord[] = [],
  selectedSchemeIds: string[] = [],
  applicationTracking?: Record<string, string>
): CitizenChatContext | undefined {
  const hasProfileData =
    Boolean(profile && (profile.age !== null || profile.occupation || profile.state || profile.area));

  if (!hasProfileData && selectedSchemeIds.length === 0 && (!applicationTracking || Object.keys(applicationTracking).length === 0)) {
    return undefined;
  }

  const context: CitizenChatContext = {};

  // 1. Sanitized Demographic & Socioeconomic Profile (strictly non-PII)
  if (profile && hasProfileData) {
    context.profile = {};
    if (profile.state) context.profile.state = profile.state;
    if (profile.area) context.profile.area = profile.area;
    if (profile.age !== null && profile.age !== undefined) context.profile.age = profile.age;
    if (profile.occupation) context.profile.occupation = profile.occupation;
    if (profile.incomeBracket) context.profile.income_bracket = profile.incomeBracket;
    if (profile.category) context.profile.category = profile.category;
    if (profile.landholding) context.profile.landholding = profile.landholding;
    if (profile.isStudent) context.profile.is_student = true;
    if (profile.hasDisability) context.profile.has_disability = true;
  }

  // 2. Scheme Recommendations & MatchProof Outcomes
  if (profile && hasProfileData && schemes.length > 0) {
    const evaluated = schemes.map((s) => ({
      scheme: s,
      eval: evaluateSchemeEligibility(s, profile),
    }));

    // Prioritize 'met' (potential matches), then 'unknown' (more info needed)
    const sorted = evaluated.sort((a, b) => {
      const order = { met: 0, unknown: 1, not_met: 2 };
      return (order[a.eval.overallStatus] ?? 3) - (order[b.eval.overallStatus] ?? 3);
    });

    context.scheme_matches = sorted.slice(0, 6).map(({ scheme, eval: e }) => {
      let statusLabel: 'Potential match' | 'More info needed' | 'Criteria not met' = 'Criteria not met';
      if (e.overallStatus === 'met') statusLabel = 'Potential match';
      else if (e.overallStatus === 'unknown') statusLabel = 'More info needed';

      const reasons = e.criteriaResults
        .filter((c) => c.status === 'met')
        .map((c) => c.explanation);

      const missing = e.criteriaResults
        .filter((c) => c.status === 'unknown')
        .map((c) => c.label);

      return {
        id: scheme.id,
        title: scheme.title,
        status: statusLabel,
        reasons: reasons.slice(0, 3),
        missing: missing.slice(0, 3),
      };
    });
  }

  // 3. Consolidated Document Planner Checklist
  if (selectedSchemeIds.length > 0 && documents.length > 0) {
    const relevantDocs = documents.filter((d) =>
      d.applicableSchemeIds.some((sId) => selectedSchemeIds.includes(sId))
    );

    const haveDocs = relevantDocs.filter((d) => d.status === 'have').map((d) => d.name);
    const missingDocs = relevantDocs.filter((d) => d.status === 'missing').map((d) => d.name);
    const unconfirmedDocs = relevantDocs.filter((d) => d.status === 'unconfirmed').map((d) => d.name);

    const selectedSchemeTitles = selectedSchemeIds.map((sId) => {
      const match = schemes.find((s) => s.id === sId);
      return match ? match.title.split('(')[0].trim() : sId;
    });

    const total = relevantDocs.length;
    const readiness = total > 0 ? Math.round((haveDocs.length / total) * 100) : 0;

    context.documents = {
      selected_schemes: selectedSchemeTitles,
      total_required: total,
      have_documents: haveDocs,
      missing_documents: missingDocs,
      unconfirmed_documents: unconfirmedDocs,
      readiness_percentage: readiness,
    };
  }

  // 4. User-Reported Application Tracking Statuses
  if (applicationTracking && Object.keys(applicationTracking).length > 0) {
    context.tracking = { ...applicationTracking };
  }

  // 5. Next Best Action Logic
  if (!hasProfileData) {
    context.next_best_action = 'Complete your profile in Stage 1 to discover schemes tailored to your livelihood.';
  } else if (context.documents && context.documents.missing_documents.length > 0) {
    context.next_best_action = `Procure your missing documents (${context.documents.missing_documents[0]}) before submitting applications.`;
  } else if (context.documents && context.documents.readiness_percentage === 100) {
    context.next_best_action = 'All required documents are ready in hand. Visit the official portal or your local CSC Seva Kendra to apply.';
  } else if (context.scheme_matches && context.scheme_matches.some((m) => m.status === 'Potential match')) {
    context.next_best_action = 'Select your matching schemes in Stage 2 and prepare your document checklist in Stage 3.';
  } else {
    context.next_best_action = 'Review scheme guidelines or speak with a local Seva Kendra facilitator for assistance.';
  }

  return context;
}
