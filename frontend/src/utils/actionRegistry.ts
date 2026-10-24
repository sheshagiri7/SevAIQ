/**
 * SevAIQ Controlled Chatbot Action Registry.
 *
 * Implements an explicit allowlist of supported citizen-service operations.
 * Validates all action arguments against real application state,
 * enforces safety guards on consequential/destructive operations,
 * and delegates server-side operations directly to the backend API layer
 * as specified in docs/CHATBOT_API_CONTRACT.md.
 */

import {
  Scheme,
  CitizenProfile,
  DocumentRecord,
  DocumentPossessionStatus,
  NavigationTab,
  ChatSourceReference,
} from '../types';
import { resolveBackendSchemeId, adaptProfileToBackend } from './schemaAdapter';
import { buildCitizenChatContext } from './chatbotContextBuilder';
import { executeChatAction } from '../services/api';

export const ALLOWED_ACTIONS = [
  'DISCOVER_SCHEMES',
  'ASK_PROFILE_QUESTION',
  'EXPLAIN_SCHEME_MATCH',
  'CHECK_ELIGIBILITY',
  'SHOW_REQUIRED_DOCUMENTS',
  'UPDATE_DOCUMENT_STATUS',
  'GENERATE_READINESS_PASSPORT',
  'OPEN_OFFICIAL_APPLICATION_LINK',
  'SHOW_APPLICATION_PROGRESS',
  'UPDATE_USER_REPORTED_APPLICATION_STATUS',
  'SET_APPLICATION_REMINDER',
  'CHANGE_LANGUAGE',
  'READ_LAST_RESPONSE',
  'NAVIGATE_TO_SECTION',
  'CLEAR_SESSION',
] as const;

export const BACKEND_SERVER_ACTIONS = [
  'discover_schemes',
  'check_eligibility',
  'get_scheme_details',
  'map_documents',
  'generate_passport',
  'get_application_guidance',
] as const;

export const BACKEND_CLIENT_ACTIONS = [
  'navigate_to',
  'set_language',
  'clear_session',
  'speak_text',
] as const;

export const ALL_SUPPORTED_ACTIONS = [
  ...ALLOWED_ACTIONS,
  ...BACKEND_SERVER_ACTIONS,
  ...BACKEND_CLIENT_ACTIONS,
] as const;

export type ChatbotActionType =
  | (typeof ALLOWED_ACTIONS)[number]
  | (typeof BACKEND_SERVER_ACTIONS)[number]
  | (typeof BACKEND_CLIENT_ACTIONS)[number];

export interface ProposedAction {
  type: string;
  payload?: Record<string, any>;
}

export interface ValidatedAction {
  type: ChatbotActionType | string;
  payload: Record<string, any>;
  requiresConfirmation?: boolean;
}

export interface ActionValidationContext {
  schemes: Scheme[];
  documents: DocumentRecord[];
  profile: Partial<CitizenProfile>;
  selectedSchemeIds?: string[];
  language?: string;
  isKioskMode?: boolean;
}

export interface ActionExecutionContext {
  profile?: Partial<CitizenProfile>;
  schemes?: Scheme[];
  documents?: DocumentRecord[];
  selectedSchemeIds?: string[];
  language?: 'en' | 'ta' | 'hi';
  applicationTracking?: Record<string, string>;
}

export interface ActionValidationResult {
  valid: boolean;
  action?: ValidatedAction;
  error?: string;
  requiresConfirmation?: boolean;
}

export interface ActionResult {
  success: boolean;
  actionType: string;
  messageEn: string;
  messageTa: string;
  data?: any;
  action?: string;
  summary?: string;
  sources?: ChatSourceReference[];
  requires_confirmation?: boolean;
  next_question?: string | null;
  error?: {
    code: string;
    message: string;
    details?: any;
  } | null;
}

export interface ChatbotActionHandlers {
  onNavigate: (tab: NavigationTab) => void;
  onUpdateProfile?: (updated: Partial<CitizenProfile>) => void;
  onUpdateDocumentStatus?: (docId: string, status: DocumentPossessionStatus) => void;
  onToggleSchemeSelection?: (schemeId: string) => void;
  onSelectSchemeForEligibility?: (scheme: Scheme) => void;
  onClearSession?: () => void;
  onSelectTrackerScheme?: (schemeId: string) => void;
  onSetTrackerStatus?: (schemeId: string, status: string, stepIndex?: number) => void;
  onSetTrackerReminder?: (schemeId: string, reminderText: string, reminderDate?: string) => void;
  onChangeLanguage?: (language: 'en' | 'ta' | 'hi') => void;
  onReadLastResponse?: (messageId?: string) => void;
}

const VALID_PROFILE_FIELDS: Array<keyof CitizenProfile> = [
  'state',
  'area',
  'age',
  'occupation',
  'incomeBracket',
  'category',
  'landholding',
  'isStudent',
  'hasDisability',
];

const VALID_NAVIGATION_TABS: NavigationTab[] = [
  'chat',
  'dashboard',
  'discover',
  'demographic-profile',
  'eligibility',
  'document-mapper',
  'readiness-passport',
  'application-tracker',
  'trust-monitor',
];

export function isActionSupported(actionType: string): boolean {
  if (typeof actionType !== 'string') return false;
  const t = actionType.trim();
  return (
    (ALLOWED_ACTIONS as readonly string[]).includes(t) ||
    (BACKEND_SERVER_ACTIONS as readonly string[]).includes(t) ||
    (BACKEND_CLIENT_ACTIONS as readonly string[]).includes(t) ||
    [
      'update_document_status',
      'ask_profile_question',
      'explain_scheme_match',
      'open_official_application_link',
      'show_application_progress',
      'update_user_reported_application_status',
      'set_application_reminder',
      'navigate_to_section',
      'change_language',
      'read_last_response',
    ].includes(t.toLowerCase())
  );
}

export function normalizeActionType(raw: string): string {
  const norm = raw.trim();
  switch (norm) {
    case 'discover_schemes':
    case 'DISCOVER_SCHEMES':
      return 'DISCOVER_SCHEMES';
    case 'check_eligibility':
    case 'CHECK_ELIGIBILITY':
      return 'CHECK_ELIGIBILITY';
    case 'explain_scheme_match':
    case 'EXPLAIN_SCHEME_MATCH':
      return 'EXPLAIN_SCHEME_MATCH';
    case 'get_scheme_details':
    case 'GET_SCHEME_DETAILS':
      return 'GET_SCHEME_DETAILS';
    case 'map_documents':
    case 'SHOW_REQUIRED_DOCUMENTS':
    case 'show_required_documents':
      return 'SHOW_REQUIRED_DOCUMENTS';
    case 'generate_passport':
    case 'GENERATE_READINESS_PASSPORT':
    case 'generate_readiness_passport':
      return 'GENERATE_READINESS_PASSPORT';
    case 'get_application_guidance':
    case 'GET_APPLICATION_GUIDANCE':
      return 'GET_APPLICATION_GUIDANCE';
    case 'open_official_application_link':
    case 'OPEN_OFFICIAL_APPLICATION_LINK':
      return 'OPEN_OFFICIAL_APPLICATION_LINK';
    case 'show_application_progress':
    case 'SHOW_APPLICATION_PROGRESS':
      return 'SHOW_APPLICATION_PROGRESS';
    case 'navigate_to':
    case 'NAVIGATE_TO_SECTION':
    case 'navigate_to_section':
      return 'NAVIGATE_TO_SECTION';
    case 'set_language':
    case 'CHANGE_LANGUAGE':
    case 'change_language':
      return 'CHANGE_LANGUAGE';
    case 'clear_session':
    case 'CLEAR_SESSION':
      return 'CLEAR_SESSION';
    case 'speak_text':
    case 'READ_LAST_RESPONSE':
    case 'read_last_response':
      return 'READ_LAST_RESPONSE';
    case 'update_document_status':
    case 'UPDATE_DOCUMENT_STATUS':
      return 'UPDATE_DOCUMENT_STATUS';
    case 'ask_profile_question':
    case 'ASK_PROFILE_QUESTION':
      return 'ASK_PROFILE_QUESTION';
    case 'update_user_reported_application_status':
    case 'UPDATE_USER_REPORTED_APPLICATION_STATUS':
      return 'UPDATE_USER_REPORTED_APPLICATION_STATUS';
    case 'set_application_reminder':
    case 'SET_APPLICATION_REMINDER':
      return 'SET_APPLICATION_REMINDER';
    default:
      return norm;
  }
}

/**
 * Validate an untrusted proposed action against the allowlist and current application state.
 */
export function validateChatbotAction(
  proposed: unknown,
  context: ActionValidationContext
): ActionValidationResult {
  if (!proposed || typeof proposed !== 'object') {
    return { valid: false, error: 'Invalid action format: payload must be an object' };
  }

  const { type, payload = {} } = proposed as ProposedAction;

  if (typeof type !== 'string' || !isActionSupported(type)) {
    return {
      valid: false,
      error: `Unsupported action "${type}". Permitted actions: ${ALLOWED_ACTIONS.join(', ')}`,
    };
  }

  const actionType = type as ChatbotActionType;
  const normalized = normalizeActionType(type);

  switch (normalized) {
    case 'DISCOVER_SCHEMES': {
      const safePayload: Record<string, any> = {};
      if (typeof payload.category === 'string') safePayload.category = payload.category.trim();
      if (typeof payload.query === 'string') safePayload.query = payload.query.trim();
      if (typeof payload.q === 'string') safePayload.query = payload.q.trim();
      if (typeof payload.onlyEligible === 'boolean') safePayload.onlyEligible = payload.onlyEligible;
      return { valid: true, action: { type: actionType, payload: safePayload } };
    }

    case 'ASK_PROFILE_QUESTION': {
      const field = payload.field;
      if (!field || typeof field !== 'string' || !VALID_PROFILE_FIELDS.includes(field as any)) {
        return {
          valid: false,
          error: `Invalid profile field "${field}". Permitted fields: ${VALID_PROFILE_FIELDS.join(', ')}`,
        };
      }
      return {
        valid: true,
        action: {
          type: actionType,
          payload: {
            field,
            questionEn: typeof payload.questionEn === 'string' ? payload.questionEn : undefined,
            questionTa: typeof payload.questionTa === 'string' ? payload.questionTa : undefined,
            reasonEn: typeof payload.reasonEn === 'string' ? payload.reasonEn : undefined,
            reasonTa: typeof payload.reasonTa === 'string' ? payload.reasonTa : undefined,
            options: Array.isArray(payload.options) ? payload.options : undefined,
          },
        },
      };
    }

    case 'EXPLAIN_SCHEME_MATCH':
    case 'OPEN_OFFICIAL_APPLICATION_LINK': {
      const schemeId = payload.schemeId || payload.scheme_id;
      if (!schemeId || typeof schemeId !== 'string') {
        return { valid: false, error: `${actionType} requires a valid schemeId` };
      }
      const matched = findScheme(schemeId, context.schemes);
      if (!matched) {
        return { valid: false, error: `Scheme "${schemeId}" not found in catalog` };
      }
      return {
        valid: true,
        action: {
          type: actionType,
          payload: {
            schemeId: matched.id,
            schemeTitle: matched.title,
            portalUrl: matched.official_portal_url,
          },
        },
      };
    }

    case 'GET_SCHEME_DETAILS': {
      const schemeId = payload.schemeId || payload.scheme_id;
      if (!schemeId || typeof schemeId !== 'string') {
        return { valid: false, error: 'get_scheme_details requires schemeId' };
      }
      const matched = findScheme(schemeId, context.schemes);
      if (!matched) {
        return { valid: false, error: `Scheme "${schemeId}" not found in catalog` };
      }
      return {
        valid: true,
        action: {
          type: actionType,
          payload: {
            schemeId: matched.id,
            schemeTitle: matched.title,
          },
        },
      };
    }

    case 'CHECK_ELIGIBILITY': {
      const safePayload: Record<string, any> = {};
      const schemeId = payload.schemeId || payload.scheme_id;
      if (schemeId && typeof schemeId === 'string') {
        const matched = findScheme(schemeId, context.schemes);
        if (!matched) {
          return { valid: false, error: `Scheme "${schemeId}" not found in catalog` };
        }
        safePayload.schemeId = matched.id;
        safePayload.schemeTitle = matched.title;
      }
      return { valid: true, action: { type: actionType, payload: safePayload } };
    }

    case 'SHOW_REQUIRED_DOCUMENTS': {
      const safePayload: Record<string, any> = {};
      const schemeId = payload.schemeId || payload.scheme_id;
      if (schemeId && typeof schemeId === 'string') {
        const matched = findScheme(schemeId, context.schemes);
        if (matched) {
          safePayload.schemeId = matched.id;
          safePayload.schemeTitle = matched.title;
        }
      }
      if (Array.isArray(payload.scheme_ids)) {
        safePayload.schemeIds = payload.scheme_ids;
      } else if (Array.isArray(payload.schemeIds)) {
        safePayload.schemeIds = payload.schemeIds;
      }
      if (payload.filter && ['all', 'missing', 'have'].includes(payload.filter)) {
        safePayload.filter = payload.filter;
      }
      return { valid: true, action: { type: actionType, payload: safePayload } };
    }

    case 'UPDATE_DOCUMENT_STATUS': {
      const docId = payload.docId || payload.doc_id;
      const status = payload.status;
      if (!docId || typeof docId !== 'string') {
        return { valid: false, error: 'UPDATE_DOCUMENT_STATUS requires docId' };
      }
      const validStatuses: DocumentPossessionStatus[] = ['have', 'missing', 'unconfirmed'];
      if (!status || !validStatuses.includes(status)) {
        return {
          valid: false,
          error: `Invalid document status "${status}". Permitted: ${validStatuses.join(', ')}`,
        };
      }
      const docExists = context.documents.some((d) => d.id === docId);
      if (!docExists) {
        return { valid: false, error: `Document with ID "${docId}" not found in checklist` };
      }
      return {
        valid: true,
        action: {
          type: actionType,
          payload: { docId, status },
        },
      };
    }

    case 'GENERATE_READINESS_PASSPORT': {
      const safePayload: Record<string, any> = {};
      const schemeIdsList = payload.schemeIds || payload.scheme_ids;
      if (Array.isArray(schemeIdsList)) {
        const validIds = schemeIdsList.filter(
          (id: string) => typeof id === 'string' && Boolean(findScheme(id, context.schemes))
        );
        safePayload.schemeIds = validIds;
      }
      if (typeof payload.notes === 'string') {
        safePayload.notes = payload.notes.slice(0, 500);
      }
      return { valid: true, action: { type: actionType, payload: safePayload } };
    }

    case 'GET_APPLICATION_GUIDANCE':
    case 'SHOW_APPLICATION_PROGRESS': {
      const safePayload: Record<string, any> = {};
      const schemeId = payload.schemeId || payload.scheme_id;
      if (schemeId && typeof schemeId === 'string') {
        const matched = findScheme(schemeId, context.schemes);
        if (matched) safePayload.schemeId = matched.id;
      }
      return { valid: true, action: { type: actionType, payload: safePayload } };
    }

    case 'UPDATE_USER_REPORTED_APPLICATION_STATUS': {
      const schemeId = payload.schemeId || payload.scheme_id;
      if (!schemeId || typeof schemeId !== 'string') {
        return { valid: false, error: 'UPDATE_USER_REPORTED_APPLICATION_STATUS requires schemeId' };
      }
      const matched = findScheme(schemeId, context.schemes);
      if (!matched) {
        return { valid: false, error: `Scheme "${schemeId}" not found in catalog` };
      }
      return {
        valid: true,
        action: {
          type: actionType,
          payload: {
            schemeId: matched.id,
            status: typeof payload.status === 'string' ? payload.status : 'preparing_documents',
            stepIndex: typeof payload.stepIndex === 'number' ? payload.stepIndex : undefined,
          },
        },
      };
    }

    case 'SET_APPLICATION_REMINDER': {
      const schemeId = payload.schemeId || payload.scheme_id;
      if (!schemeId || typeof schemeId !== 'string') {
        return { valid: false, error: 'SET_APPLICATION_REMINDER requires schemeId' };
      }
      const matched = findScheme(schemeId, context.schemes);
      if (!matched) {
        return { valid: false, error: `Scheme "${schemeId}" not found in catalog` };
      }
      return {
        valid: true,
        action: {
          type: actionType,
          payload: {
            schemeId: matched.id,
            reminderText:
              typeof payload.reminderText === 'string'
                ? payload.reminderText
                : `Application reminder for ${matched.title}`,
            reminderDate: typeof payload.reminderDate === 'string' ? payload.reminderDate : undefined,
          },
        },
      };
    }

    case 'CHANGE_LANGUAGE': {
      const lang = payload.language;
      if (lang !== 'en' && lang !== 'ta' && lang !== 'hi') {
        return { valid: false, error: `Unsupported language "${lang}". Permitted: en, ta, hi` };
      }
      return {
        valid: true,
        action: { type: actionType, payload: { language: lang } },
      };
    }

    case 'READ_LAST_RESPONSE': {
      return {
        valid: true,
        action: {
          type: actionType,
          payload: {
            messageId: typeof payload.messageId === 'string' ? payload.messageId : undefined,
            text: typeof payload.text === 'string' ? payload.text : undefined,
          },
        },
      };
    }

    case 'NAVIGATE_TO_SECTION': {
      const targetMap: Record<string, NavigationTab> = {
        schemes: 'discover',
        documents: 'document-mapper',
        passport: 'readiness-passport',
        tracking: 'application-tracker',
        eligibility: 'eligibility',
        profile: 'demographic-profile',
        dashboard: 'dashboard',
        chat: 'chat',
      };
      const rawTarget = payload.section || payload.target;
      const section = targetMap[rawTarget] || rawTarget;
      if (!section || !VALID_NAVIGATION_TABS.includes(section as any)) {
        return {
          valid: false,
          error: `Invalid section "${rawTarget}". Permitted: ${VALID_NAVIGATION_TABS.join(', ')}`,
        };
      }
      return {
        valid: true,
        action: {
          type: actionType,
          payload: { section, target: payload.target || section },
        },
      };
    }

    case 'CLEAR_SESSION': {
      const isConfirmed = payload.confirmed === true;
      return {
        valid: true,
        requiresConfirmation: !isConfirmed,
        action: {
          type: actionType,
          payload: { confirmed: isConfirmed },
          requiresConfirmation: !isConfirmed,
        },
      };
    }

    default:
      return { valid: false, error: `Unhandled action ${actionType}` };
  }
}

/**
 * Helper to resolve scheme by ID or alias.
 */
function findScheme(id: string, schemes: Scheme[]): Scheme | undefined {
  const norm = id.trim().toLowerCase();
  const resolved = resolveBackendSchemeId(norm);
  return schemes.find(
    (s) =>
      s.id.toLowerCase() === norm ||
      resolveBackendSchemeId(s.id.toLowerCase()) === resolved ||
      s.title.toLowerCase().includes(norm)
  );
}

/**
 * Extract structured action from assistant response string if present.
 * Looks for `<!-- SEVAIQ_ACTION: {...} -->` or JSON code block.
 */
export function extractActionFromText(text: string): {
  cleanText: string;
  proposedAction: ProposedAction | null;
} {
  if (!text) return { cleanText: '', proposedAction: null };

  // Match HTML comment action tag: <!-- SEVAIQ_ACTION: {...} -->
  const commentRegex = /<!--\s*SEVAIQ_ACTION:\s*(\{[\s\S]*?\})\s*-->/;
  const match = text.match(commentRegex);

  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      const cleanText = text.replace(commentRegex, '').trim();
      if (parsed && typeof parsed.type === 'string') {
        return { cleanText, proposedAction: parsed };
      }
    } catch {
      // JSON parse error, ignore action tag
    }
  }

  // Match JSON code block with action: ```json { "sevaiq_action": { "type": "...", ... } } ```
  const codeBlockRegex = /```(?:json)?\s*\{\s*"sevaiq_action":\s*(\{[\s\S]*?\})\s*\}\s*```/i;
  const blockMatch = text.match(codeBlockRegex);
  if (blockMatch) {
    try {
      const parsed = JSON.parse(blockMatch[1]);
      const cleanText = text.replace(codeBlockRegex, '').trim();
      if (parsed && typeof parsed.type === 'string') {
        return { cleanText, proposedAction: parsed };
      }
    } catch {
      // ignore
    }
  }

  return { cleanText: text, proposedAction: null };
}

/**
 * Intelligent client-side intent classifier for common citizen queries.
 * Acts as an instant, zero-latency trigger for explicit citizen workflows.
 */
export function inferClientAction(
  query: string,
  _language: string,
  context: ActionValidationContext
): ProposedAction | null {
  const q = query.trim().toLowerCase();

  // 1. Clear session / Reset
  if (
    q === 'clear session' ||
    q === 'reset session' ||
    q === 'delete my data' ||
    q.includes('அமர்வை அழி') ||
    q.includes('அமர்வை மீட்டமை') ||
    q === 'reset all'
  ) {
    return { type: 'CLEAR_SESSION', payload: { confirmed: false } };
  }

  // 2. Language switch
  if (
    q.includes('in tamil') ||
    q.includes('speak tamil') ||
    q.includes('தமிழுக்கு மாற்று') ||
    q.includes('தமிழில் பேசு') ||
    q.includes('தமிழில் விளக்கு') ||
    q === 'explain it in tamil' ||
    q === 'explain in tamil' ||
    q === 'tamil'
  ) {
    return { type: 'CHANGE_LANGUAGE', payload: { language: 'ta' } };
  }
  if (
    q.includes('in english') ||
    q.includes('speak english') ||
    q.includes('ஆங்கிலத்திற்கு மாற்று') ||
    q.includes('ஆங்கிலத்தில் பேசு') ||
    q.includes('ஆங்கிலத்தில் விளக்கு') ||
    q === 'explain it in english' ||
    q === 'english'
  ) {
    return { type: 'CHANGE_LANGUAGE', payload: { language: 'en' } };
  }

  // 3. College fees / student scheme discovery
  if (
    q.includes('college') ||
    q.includes('student') ||
    q.includes('college fee') ||
    q.includes('college fees') ||
    q.includes('fees') ||
    q.includes('scholarship') ||
    q.includes('கல்வி உதவித்தொகை') ||
    q.includes('கல்லூரி கட்டணம்') ||
    q.includes('படிப்பு கட்டணம்') ||
    q.includes('higher education fee')
  ) {
    return {
      type: 'DISCOVER_SCHEMES',
      payload: { category: 'Education & Learning', query: 'scholarship' },
    };
  }

  // 4. Scheme Readiness Passport
  if (
    q.includes('passport') ||
    q.includes('readiness passport') ||
    q.includes('தயார் பாஸ்போர்ட்') ||
    q.includes('பாஸ்போர்ட் தயார்') ||
    q.includes('prepare my scheme readiness passport') ||
    q.includes('prepare my scheme passport') ||
    q.includes('download passport')
  ) {
    return {
      type: 'GENERATE_READINESS_PASSPORT',
      payload: { schemeIds: context.selectedSchemeIds || [] },
    };
  }

  // 5. Documents checklist
  if (
    q.includes('what documents') ||
    q.includes('my documents') ||
    q.includes('documents needed') ||
    q.includes('என்ன ஆவணங்கள்') ||
    q.includes('ஆவணங்கள் தேவை') ||
    q.includes('சான்றிதழ்கள்') ||
    q.includes('checklist')
  ) {
    const mentionedScheme = context.schemes.find((s) =>
      q.includes(s.id.toLowerCase()) || q.includes(s.title.toLowerCase().split('(')[0].trim().toLowerCase())
    );
    return {
      type: 'SHOW_REQUIRED_DOCUMENTS',
      payload: { schemeId: mentionedScheme?.id, filter: 'all' },
    };
  }

  // 6. Application Tracker / Where did I stop
  if (
    q.includes('where did i stop') ||
    q.includes('where did i stop?') ||
    q.includes('track my application') ||
    q.includes('track application') ||
    q.includes('எங்கு நிறுத்தினேன்') ||
    q.includes('விண்ணப்ப நிலை') ||
    q.includes('status of application')
  ) {
    return { type: 'SHOW_APPLICATION_PROGRESS', payload: {} };
  }

  // 7. Eligibility check
  if (
    q.includes('am i eligible') ||
    q.includes('can i get this scheme') ||
    q.includes('நான் தகுதியானவரா') ||
    q.includes('எனக்கு கிடைக்குமா') ||
    q.includes('check eligibility')
  ) {
    const mentionedScheme = context.schemes.find((s) =>
      q.includes(s.id.toLowerCase()) || q.includes(s.title.toLowerCase().split('(')[0].trim().toLowerCase())
    );
    return {
      type: 'CHECK_ELIGIBILITY',
      payload: { schemeId: mentionedScheme?.id },
    };
  }

  // 8. How do I apply / Official link
  if (
    q.includes('how do i apply') ||
    q.includes('how to apply') ||
    q.includes('விண்ணப்பிப்பது எப்படி') ||
    q.includes('எவ்வாறு விண்ணப்பிப்பது') ||
    q.includes('official portal link')
  ) {
    const mentionedScheme = context.schemes.find((s) =>
      q.includes(s.id.toLowerCase()) || q.includes(s.title.toLowerCase().split('(')[0].trim().toLowerCase())
    );
    if (mentionedScheme) {
      return {
        type: 'OPEN_OFFICIAL_APPLICATION_LINK',
        payload: { schemeId: mentionedScheme.id },
      };
    }
  }

  // 9. Next best action
  if (
    q.includes('what should i do next') ||
    q.includes('what to do next') ||
    q.includes('அடுத்து என்ன செய்ய வேண்டும்') ||
    q.includes('அடுத்த படி என்ன')
  ) {
    return {
      type: 'NAVIGATE_TO_SECTION',
      payload: {
        section:
          !context.profile.occupation && !context.profile.age
            ? 'eligibility'
            : (context.selectedSchemeIds?.length || 0) === 0
            ? 'discover'
            : 'document-mapper',
      },
    };
  }

  return null;
}

/**
 * Execute a validated action via real application handlers.
 * Server-side operations call POST /api/chat/action deterministically.
 * Client-side operations (navigation, language, local documents, session reset)
 * are executed locally in the browser.
 */
export async function executeChatbotAction(
  action: ValidatedAction,
  handlers: ChatbotActionHandlers,
  context?: ActionExecutionContext
): Promise<ActionResult> {
  const normType = normalizeActionType(action.type);
  const { payload } = action;
  const lang = (context?.language === 'ta' ? 'ta' : 'en') as 'en' | 'ta';

  const availableDocs =
    context?.documents?.filter((d) => d.status === 'have').map((d) => d.name) || [];
  const backendProfile = context?.profile
    ? adaptProfileToBackend(context.profile as CitizenProfile, availableDocs)
    : undefined;
  const citizenContext = buildCitizenChatContext(
    context?.profile as CitizenProfile,
    context?.schemes || [],
    context?.documents || [],
    context?.selectedSchemeIds || [],
    context?.applicationTracking
  );

  // 1. Server-Side Action: Scheme Discovery
  if (normType === 'DISCOVER_SCHEMES') {
    handlers.onNavigate('discover');
    const apiRes = await executeChatAction({
      action: 'discover_schemes',
      payload: {
        query: payload.query || payload.q || '',
        category: payload.category || undefined,
        profile: backendProfile,
      },
      language: lang,
      citizen_context: citizenContext,
    });

    if (apiRes.success && apiRes.data) {
      return {
        success: true,
        action: 'discover_schemes',
        actionType: action.type,
        summary: apiRes.data.summary,
        messageEn: apiRes.data.summary,
        messageTa: apiRes.data.summary,
        data: apiRes.data.data,
        sources: apiRes.data.sources || [],
        requires_confirmation: false,
        next_question: apiRes.data.next_question,
        error: null,
      };
    }

    return {
      success: false,
      action: 'discover_schemes',
      actionType: action.type,
      summary:
        apiRes.error ||
        (lang === 'ta' ? 'திட்டங்களை கண்டறிய முடியவில்லை.' : 'Failed to discover schemes.'),
      messageEn: apiRes.error || 'Failed to discover schemes.',
      messageTa:
        lang === 'ta' ? apiRes.error || 'திட்டங்களை கண்டறிய முடியவில்லை.' : 'Failed to discover schemes.',
      data: apiRes.data?.data || {},
      sources: apiRes.data?.sources || [],
      requires_confirmation: false,
      next_question: null,
      error: apiRes.data?.error || {
        code: 'DISCOVERY_FAILED',
        message: apiRes.error || 'Failed to discover schemes',
      },
    };
  }

  // 2. Server-Side Action: Eligibility Assessment
  if (normType === 'CHECK_ELIGIBILITY' || normType === 'EXPLAIN_SCHEME_MATCH') {
    handlers.onNavigate('eligibility');
    const rawSchemeId = payload.schemeId || payload.scheme_id;
    const resolvedSchemeId = rawSchemeId ? resolveBackendSchemeId(rawSchemeId) : undefined;

    const apiRes = await executeChatAction({
      action: 'check_eligibility',
      payload: {
        scheme_id: resolvedSchemeId,
        profile: backendProfile || { age: null },
      },
      language: lang,
      citizen_context: citizenContext,
    });

    if (apiRes.success && apiRes.data) {
      return {
        success: true,
        action: 'check_eligibility',
        actionType: action.type,
        summary: apiRes.data.summary,
        messageEn: apiRes.data.summary,
        messageTa: apiRes.data.summary,
        data: apiRes.data.data,
        sources: apiRes.data.sources || [],
        requires_confirmation: false,
        next_question: apiRes.data.next_question,
        error: null,
      };
    }

    return {
      success: false,
      action: 'check_eligibility',
      actionType: action.type,
      summary:
        apiRes.error ||
        (lang === 'ta' ? 'தகுதி சரிபார்ப்பில் பிழை ஏற்பட்டது.' : 'Failed to evaluate eligibility.'),
      messageEn: apiRes.error || 'Failed to evaluate eligibility.',
      messageTa:
        lang === 'ta' ? apiRes.error || 'தகுதி சரிபார்ப்பில் பிழை ஏற்பட்டது.' : 'Failed to evaluate eligibility.',
      data: apiRes.data?.data || {},
      sources: apiRes.data?.sources || [],
      requires_confirmation: false,
      next_question: null,
      error: apiRes.data?.error || {
        code: 'ELIGIBILITY_FAILED',
        message: apiRes.error || 'Failed to evaluate eligibility',
      },
    };
  }

  // 3. Server-Side Action: Scheme Details
  if (normType === 'GET_SCHEME_DETAILS') {
    const rawSchemeId = payload.schemeId || payload.scheme_id;
    const resolvedSchemeId = rawSchemeId ? resolveBackendSchemeId(rawSchemeId) : '';

    const apiRes = await executeChatAction({
      action: 'get_scheme_details',
      payload: { scheme_id: resolvedSchemeId },
      language: lang,
      citizen_context: citizenContext,
    });

    if (apiRes.success && apiRes.data) {
      return {
        success: true,
        action: 'get_scheme_details',
        actionType: action.type,
        summary: apiRes.data.summary,
        messageEn: apiRes.data.summary,
        messageTa: apiRes.data.summary,
        data: apiRes.data.data,
        sources: apiRes.data.sources || [],
        requires_confirmation: false,
        next_question: apiRes.data.next_question,
        error: null,
      };
    }

    return {
      success: false,
      action: 'get_scheme_details',
      actionType: action.type,
      summary:
        apiRes.error ||
        (lang === 'ta' ? 'திட்ட விவரங்களை பெற முடியவில்லை.' : 'Failed to get scheme details.'),
      messageEn: apiRes.error || 'Failed to get scheme details.',
      messageTa:
        lang === 'ta' ? apiRes.error || 'திட்ட விவரங்களை பெற முடியவில்லை.' : 'Failed to get scheme details.',
      data: apiRes.data?.data || {},
      sources: apiRes.data?.sources || [],
      requires_confirmation: false,
      next_question: null,
      error: apiRes.data?.error || {
        code: 'SCHEME_DETAILS_FAILED',
        message: apiRes.error || 'Failed to get scheme details',
      },
    };
  }

  // 4. Server-Side Action: Unified Document Mapping
  if (normType === 'SHOW_REQUIRED_DOCUMENTS') {
    handlers.onNavigate('document-mapper');
    let schemeIds: string[] = [];
    if (Array.isArray(payload.scheme_ids)) schemeIds = payload.scheme_ids;
    else if (Array.isArray(payload.schemeIds)) schemeIds = payload.schemeIds;
    else if (payload.schemeId) schemeIds = [payload.schemeId];
    else if (payload.scheme_id) schemeIds = [payload.scheme_id];
    else if (context?.selectedSchemeIds && context.selectedSchemeIds.length > 0)
      schemeIds = context.selectedSchemeIds;
    else if (context?.schemes && context.schemes.length > 0) schemeIds = [context.schemes[0].id];
    else schemeIds = ['pm-kisan'];

    const resolvedIds = schemeIds.map(resolveBackendSchemeId);
    const apiRes = await executeChatAction({
      action: 'map_documents',
      payload: {
        scheme_ids: resolvedIds,
        citizen_documents: availableDocs,
        profile: backendProfile,
      },
      language: lang,
      citizen_context: citizenContext,
    });

    if (apiRes.success && apiRes.data) {
      return {
        success: true,
        action: 'map_documents',
        actionType: action.type,
        summary: apiRes.data.summary,
        messageEn: apiRes.data.summary,
        messageTa: apiRes.data.summary,
        data: apiRes.data.data,
        sources: apiRes.data.sources || [],
        requires_confirmation: false,
        next_question: apiRes.data.next_question,
        error: null,
      };
    }

    return {
      success: false,
      action: 'map_documents',
      actionType: action.type,
      summary:
        apiRes.error ||
        (lang === 'ta' ? 'ஆவணங்கள் திட்டமிடலில் பிழை ஏற்பட்டது.' : 'Failed to map documents.'),
      messageEn: apiRes.error || 'Failed to map documents.',
      messageTa:
        lang === 'ta' ? apiRes.error || 'ஆவணங்கள் திட்டமிடலில் பிழை ஏற்பட்டது.' : 'Failed to map documents.',
      data: apiRes.data?.data || {},
      sources: apiRes.data?.sources || [],
      requires_confirmation: false,
      next_question: null,
      error: apiRes.data?.error || {
        code: 'DOC_MAPPING_FAILED',
        message: apiRes.error || 'Failed to map documents',
      },
    };
  }

  // 5. Server-Side Action: Scheme Readiness Passport PDF Generation
  if (normType === 'GENERATE_READINESS_PASSPORT') {
    handlers.onNavigate('readiness-passport');
    let schemeIds: string[] = [];
    if (Array.isArray(payload.scheme_ids)) schemeIds = payload.scheme_ids;
    else if (Array.isArray(payload.schemeIds)) schemeIds = payload.schemeIds;
    else if (context?.selectedSchemeIds && context.selectedSchemeIds.length > 0)
      schemeIds = context.selectedSchemeIds;
    else if (context?.schemes && context.schemes.length > 0) schemeIds = [context.schemes[0].id];
    else schemeIds = ['pm-kisan'];

    const resolvedIds = schemeIds.map(resolveBackendSchemeId);
    const apiRes = await executeChatAction({
      action: 'generate_passport',
      payload: {
        scheme_ids: resolvedIds,
        profile: backendProfile || { age: 30 },
        citizen_documents: availableDocs,
        notes: payload.notes,
      },
      language: lang,
      citizen_context: citizenContext,
    });

    if (apiRes.success && apiRes.data) {
      return {
        success: true,
        action: 'generate_passport',
        actionType: action.type,
        summary: apiRes.data.summary,
        messageEn: apiRes.data.summary,
        messageTa: apiRes.data.summary,
        data: apiRes.data.data,
        sources: apiRes.data.sources || [],
        requires_confirmation: false,
        next_question: apiRes.data.next_question,
        error: null,
      };
    }

    return {
      success: false,
      action: 'generate_passport',
      actionType: action.type,
      summary:
        apiRes.error ||
        (lang === 'ta' ? 'பாஸ்போர்ட் உருவாக்குவதில் பிழை ஏற்பட்டது.' : 'Failed to generate passport.'),
      messageEn: apiRes.error || 'Failed to generate passport.',
      messageTa:
        lang === 'ta' ? apiRes.error || 'பாஸ்போர்ட் உருவாக்குவதில் பிழை ஏற்பட்டது.' : 'Failed to generate passport.',
      data: apiRes.data?.data || {},
      sources: apiRes.data?.sources || [],
      requires_confirmation: false,
      next_question: null,
      error: apiRes.data?.error || {
        code: 'PASSPORT_FAILED',
        message: apiRes.error || 'Failed to generate passport',
      },
    };
  }

  // 6. Server-Side Action: Verified Application Guidance & Official Links
  if (
    normType === 'GET_APPLICATION_GUIDANCE' ||
    normType === 'OPEN_OFFICIAL_APPLICATION_LINK' ||
    normType === 'SHOW_APPLICATION_PROGRESS'
  ) {
    if (normType === 'SHOW_APPLICATION_PROGRESS') {
      handlers.onNavigate('application-tracker');
    }

    const rawSchemeId =
      payload.schemeId ||
      payload.scheme_id ||
      context?.selectedSchemeIds?.[0] ||
      context?.schemes?.[0]?.id ||
      'pm-kisan';
    const resolvedSchemeId = resolveBackendSchemeId(rawSchemeId);

    const apiRes = await executeChatAction({
      action: 'get_application_guidance',
      payload: { scheme_id: resolvedSchemeId },
      language: lang,
      citizen_context: citizenContext,
    });

    if (apiRes.success && apiRes.data) {
      const portalUrl = apiRes.data.data?.official_portal_url || payload.portalUrl;
      if (
        normType === 'OPEN_OFFICIAL_APPLICATION_LINK' &&
        portalUrl &&
        typeof window !== 'undefined'
      ) {
        window.open(portalUrl, '_blank', 'noopener,noreferrer');
      }

      return {
        success: true,
        action: 'get_application_guidance',
        actionType: action.type,
        summary: apiRes.data.summary,
        messageEn: apiRes.data.summary,
        messageTa: apiRes.data.summary,
        data: apiRes.data.data,
        sources: apiRes.data.sources || [],
        requires_confirmation: false,
        next_question: apiRes.data.next_question,
        error: null,
      };
    }

    return {
      success: false,
      action: 'get_application_guidance',
      actionType: action.type,
      summary:
        apiRes.error ||
        (lang === 'ta' ? 'விண்ணப்ப வழிகாட்டலை பெற முடியவில்லை.' : 'Failed to retrieve application guidance.'),
      messageEn: apiRes.error || 'Failed to retrieve application guidance.',
      messageTa:
        lang === 'ta' ? apiRes.error || 'விண்ணப்ப வழிகாட்டலை பெற முடியவில்லை.' : 'Failed to retrieve application guidance.',
      data: apiRes.data?.data || {},
      sources: apiRes.data?.sources || [],
      requires_confirmation: false,
      next_question: null,
      error: apiRes.data?.error || {
        code: 'GUIDANCE_FAILED',
        message: apiRes.error || 'Failed to retrieve application guidance',
      },
    };
  }

  // 7. Client-Side Browser Action: Navigation
  if (normType === 'NAVIGATE_TO_SECTION') {
    const targetMap: Record<string, NavigationTab> = {
      schemes: 'discover',
      documents: 'document-mapper',
      passport: 'readiness-passport',
      tracking: 'application-tracker',
      eligibility: 'eligibility',
      profile: 'demographic-profile',
      dashboard: 'dashboard',
      chat: 'chat',
    };
    const rawTarget = payload.section || payload.target || 'discover';
    const target = (targetMap[rawTarget] || rawTarget) as NavigationTab;
    handlers.onNavigate(target);
    return {
      success: true,
      action: 'navigate_to',
      actionType: action.type,
      summary: lang === 'ta' ? `${target} பகுதிக்கு நகர்த்தப்பட்டது.` : `Navigated to ${target}.`,
      messageEn: `Navigated to ${target}.`,
      messageTa: `${target} பகுதிக்கு நகர்த்தப்பட்டது.`,
      data: { target, execution: 'client_side' },
      sources: [],
      requires_confirmation: false,
    };
  }

  // 8. Client-Side Browser Action: Language Switch
  if (normType === 'CHANGE_LANGUAGE') {
    const newLang = (payload.language || 'en') as 'en' | 'ta' | 'hi';
    if (handlers.onChangeLanguage) {
      handlers.onChangeLanguage(newLang);
    }
    return {
      success: true,
      action: 'set_language',
      actionType: action.type,
      summary:
        newLang === 'ta'
          ? 'மொழி தமிழுக்கு மாற்றப்பட்டது.'
          : 'Language switched to English.',
      messageEn: `Language switched to ${newLang === 'ta' ? 'Tamil' : 'English'}.`,
      messageTa: `மொழி ${newLang === 'ta' ? 'தமிழுக்கு' : 'ஆங்கிலத்திற்கு'} மாற்றப்பட்டது.`,
      data: { language: newLang, execution: 'client_side' },
      sources: [],
      requires_confirmation: false,
    };
  }

  // 9. Client-Side Browser Action: Confirmed Session Clearing
  if (normType === 'CLEAR_SESSION') {
    if (payload.confirmed === true && handlers.onClearSession) {
      handlers.onClearSession();
      return {
        success: true,
        action: 'clear_session',
        actionType: action.type,
        summary:
          lang === 'ta'
            ? 'அமர்வு அழிக்கப்பட்டது. அனைத்து விவரங்களும் பாதுகாப்பாக மீட்டமைக்கப்பட்டன.'
            : 'Session cleared. All local state has been safely reset.',
        messageEn: 'Session cleared. All local state has been safely reset.',
        messageTa: 'அமர்வு அழிக்கப்பட்டது. அனைத்து விவரங்களும் பாதுகாப்பாக மீட்டமைக்கப்பட்டன.',
        data: { confirmed: true, execution: 'client_side' },
        sources: [],
        requires_confirmation: false,
      };
    }
    return {
      success: false,
      action: 'clear_session',
      actionType: action.type,
      summary:
        lang === 'ta'
          ? 'அமர்வை அழிக்க உங்கள் உறுதிப்படுத்தல் தேவை.'
          : 'Session reset requires citizen confirmation.',
      messageEn: 'Session reset requires citizen confirmation.',
      messageTa: 'அமர்வை அழிக்க உங்கள் உறுதிப்படுத்தல் தேவை.',
      data: { confirmed: false, execution: 'client_side' },
      sources: [],
      requires_confirmation: true,
    };
  }

  // 10. Client-Side Browser Action: Text-to-Speech Playback
  if (normType === 'READ_LAST_RESPONSE') {
    if (handlers.onReadLastResponse) {
      handlers.onReadLastResponse(payload.messageId);
    }
    return {
      success: true,
      action: 'speak_text',
      actionType: action.type,
      summary:
        lang === 'ta'
          ? 'பதில் குரல் வழியே படிக்கப்படுகிறது.'
          : 'Reading response aloud via browser speech synthesis.',
      messageEn: 'Reading response aloud via browser speech synthesis.',
      messageTa: 'பதில் குரல் வழியே படிக்கப்படுகிறது.',
      data: { messageId: payload.messageId, execution: 'client_side' },
      sources: [],
      requires_confirmation: false,
    };
  }

  // 11. Client-Side Document Checklist Status Update
  if (normType === 'UPDATE_DOCUMENT_STATUS') {
    if (handlers.onUpdateDocumentStatus) {
      handlers.onUpdateDocumentStatus(payload.docId, payload.status);
    }
    const statusLabel =
      payload.status === 'have'
        ? 'Available'
        : payload.status === 'missing'
        ? 'Missing'
        : 'Uncertain';
    const statusLabelTa =
      payload.status === 'have'
        ? 'உள்ளது'
        : payload.status === 'missing'
        ? 'தேவை'
        : 'தெரியவில்லை';
    return {
      success: true,
      action: 'update_document_status',
      actionType: action.type,
      summary: `Document status updated: Marked as ${statusLabel}.`,
      messageEn: `Document status updated: Marked as ${statusLabel}.`,
      messageTa: `ஆவண நிலை புதுப்பிக்கப்பட்டது: ${statusLabelTa} எனக் குறிக்கப்பட்டது.`,
      data: { docId: payload.docId, status: payload.status, execution: 'client_side' },
      sources: [],
      requires_confirmation: false,
    };
  }

  // 12. Client-Side Profile Interactive Question
  if (normType === 'ASK_PROFILE_QUESTION') {
    return {
      success: true,
      action: 'ask_profile_question',
      actionType: action.type,
      summary: `Ready to answer ${payload.field}.`,
      messageEn: `Ready to answer ${payload.field}.`,
      messageTa: `${payload.field} விவரத்தை பதிவு செய்ய தயாராக உள்ளது.`,
      data: { ...payload, execution: 'client_side' },
      sources: [],
      requires_confirmation: false,
    };
  }

  // 13. Client-Side Application Status Tracking
  if (normType === 'UPDATE_USER_REPORTED_APPLICATION_STATUS') {
    if (handlers.onSetTrackerStatus) {
      handlers.onSetTrackerStatus(payload.schemeId, payload.status, payload.stepIndex);
    }
    return {
      success: true,
      action: 'UPDATE_USER_REPORTED_APPLICATION_STATUS',
      actionType: action.type,
      summary: `Application progress recorded for scheme: ${payload.status}.`,
      messageEn: `Application progress recorded for scheme: ${payload.status}.`,
      messageTa: `விண்ணப்ப நிலை பதிவு செய்யப்பட்டது: ${payload.status}.`,
      data: { ...payload, execution: 'client_side' },
      sources: [],
      requires_confirmation: false,
    };
  }

  // 14. Client-Side Application Reminder
  if (normType === 'SET_APPLICATION_REMINDER') {
    if (handlers.onSetTrackerReminder) {
      handlers.onSetTrackerReminder(
        payload.schemeId,
        payload.reminderText,
        payload.reminderDate
      );
    }
    return {
      success: true,
      action: 'SET_APPLICATION_REMINDER',
      actionType: action.type,
      summary: `Reminder saved: ${payload.reminderText}.`,
      messageEn: `Reminder saved: ${payload.reminderText}.`,
      messageTa: `நினைவூட்டல் சேமிக்கப்பட்டது: ${payload.reminderText}.`,
      data: { ...payload, execution: 'client_side' },
      sources: [],
      requires_confirmation: false,
    };
  }

  return {
    success: false,
    action: action.type,
    actionType: action.type,
    summary: `Unhandled action: ${action.type}.`,
    messageEn: `Unhandled action: ${action.type}.`,
    messageTa: `செயல்படுத்த முடியாத செயல்: ${action.type}.`,
    data: payload,
    sources: [],
    requires_confirmation: false,
  };
}
