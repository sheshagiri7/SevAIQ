/**
 * SevAIQ Controlled Chatbot Action Registry.
 *
 * Implements an explicit allowlist of supported citizen-service operations.
 * Validates all action arguments against real application state,
 * enforces safety guards on consequential/destructive operations,
 * and prevents arbitrary code execution from model responses.
 */

import {
  Scheme,
  CitizenProfile,
  DocumentRecord,
  DocumentPossessionStatus,
  NavigationTab,
} from '../types';
import { resolveBackendSchemeId } from './schemaAdapter';

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

export type ChatbotActionType = (typeof ALLOWED_ACTIONS)[number];

export interface ProposedAction {
  type: string;
  payload?: Record<string, any>;
}

export interface ValidatedAction {
  type: ChatbotActionType;
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

export interface ActionValidationResult {
  valid: boolean;
  action?: ValidatedAction;
  error?: string;
  requiresConfirmation?: boolean;
}

export interface ActionResult {
  success: boolean;
  actionType: ChatbotActionType;
  messageEn: string;
  messageTa: string;
  data?: any;
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

  if (typeof type !== 'string' || !ALLOWED_ACTIONS.includes(type as ChatbotActionType)) {
    return {
      valid: false,
      error: `Unsupported action "${type}". Permitted actions: ${ALLOWED_ACTIONS.join(', ')}`,
    };
  }

  const actionType = type as ChatbotActionType;

  // Validate specific action payloads
  switch (actionType) {
    case 'DISCOVER_SCHEMES': {
      // payload can optionally contain category or query
      const safePayload: Record<string, any> = {};
      if (typeof payload.category === 'string') safePayload.category = payload.category.trim();
      if (typeof payload.query === 'string') safePayload.query = payload.query.trim();
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
      const schemeId = payload.schemeId;
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

    case 'CHECK_ELIGIBILITY': {
      const safePayload: Record<string, any> = {};
      if (payload.schemeId && typeof payload.schemeId === 'string') {
        const matched = findScheme(payload.schemeId, context.schemes);
        if (!matched) {
          return { valid: false, error: `Scheme "${payload.schemeId}" not found in catalog` };
        }
        safePayload.schemeId = matched.id;
        safePayload.schemeTitle = matched.title;
      }
      return { valid: true, action: { type: actionType, payload: safePayload } };
    }

    case 'SHOW_REQUIRED_DOCUMENTS': {
      const safePayload: Record<string, any> = {};
      if (payload.schemeId && typeof payload.schemeId === 'string') {
        const matched = findScheme(payload.schemeId, context.schemes);
        if (matched) {
          safePayload.schemeId = matched.id;
          safePayload.schemeTitle = matched.title;
        }
      }
      if (payload.filter && ['all', 'missing', 'have'].includes(payload.filter)) {
        safePayload.filter = payload.filter;
      }
      return { valid: true, action: { type: actionType, payload: safePayload } };
    }

    case 'UPDATE_DOCUMENT_STATUS': {
      const docId = payload.docId;
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
      if (Array.isArray(payload.schemeIds)) {
        const validIds = payload.schemeIds.filter(
          (id: string) => typeof id === 'string' && Boolean(findScheme(id, context.schemes))
        );
        safePayload.schemeIds = validIds;
      }
      return { valid: true, action: { type: actionType, payload: safePayload } };
    }

    case 'SHOW_APPLICATION_PROGRESS': {
      const safePayload: Record<string, any> = {};
      if (payload.schemeId && typeof payload.schemeId === 'string') {
        const matched = findScheme(payload.schemeId, context.schemes);
        if (matched) safePayload.schemeId = matched.id;
      }
      return { valid: true, action: { type: actionType, payload: safePayload } };
    }

    case 'UPDATE_USER_REPORTED_APPLICATION_STATUS': {
      const schemeId = payload.schemeId;
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
      const schemeId = payload.schemeId;
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
          },
        },
      };
    }

    case 'NAVIGATE_TO_SECTION': {
      const section = payload.section;
      if (!section || !VALID_NAVIGATION_TABS.includes(section as any)) {
        return {
          valid: false,
          error: `Invalid section "${section}". Permitted: ${VALID_NAVIGATION_TABS.join(', ')}`,
        };
      }
      return {
        valid: true,
        action: {
          type: actionType,
          payload: { section },
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
    // If a scheme is specifically mentioned, pass it
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
 */
export async function executeChatbotAction(
  action: ValidatedAction,
  handlers: ChatbotActionHandlers
): Promise<ActionResult> {
  const { type, payload } = action;

  switch (type) {
    case 'DISCOVER_SCHEMES': {
      handlers.onNavigate('discover');
      return {
        success: true,
        actionType: type,
        messageEn: `Opened Scheme Discovery${payload.category ? ` for ${payload.category}` : ''}.`,
        messageTa: `திட்டங்கள் தேடல் பகுதி திறக்கப்பட்டது${payload.category ? ` (${payload.category})` : ''}.`,
        data: payload,
      };
    }

    case 'ASK_PROFILE_QUESTION': {
      // Profile question will be rendered inline in chat
      return {
        success: true,
        actionType: type,
        messageEn: `Ready to answer ${payload.field}.`,
        messageTa: `${payload.field} விவரத்தை பதிவு செய்ய தயாராக உள்ளது.`,
        data: payload,
      };
    }

    case 'EXPLAIN_SCHEME_MATCH':
    case 'CHECK_ELIGIBILITY': {
      handlers.onNavigate('eligibility');
      return {
        success: true,
        actionType: type,
        messageEn: payload.schemeTitle
          ? `Checking eligibility criteria for ${payload.schemeTitle}.`
          : 'Opened eligibility checker.',
        messageTa: payload.schemeTitle
          ? `${payload.schemeTitle} திட்டத்திற்கான தகுதி சரிபார்ப்பு திறக்கப்பட்டது.`
          : 'தகுதி சரிபார்ப்பு பகுதி திறக்கப்பட்டது.',
        data: payload,
      };
    }

    case 'SHOW_REQUIRED_DOCUMENTS': {
      handlers.onNavigate('document-mapper');
      return {
        success: true,
        actionType: type,
        messageEn: payload.schemeTitle
          ? `Opened document checklist for ${payload.schemeTitle}.`
          : 'Opened Unified Document Planner.',
        messageTa: payload.schemeTitle
          ? `${payload.schemeTitle} திட்டத்திற்கான ஆவண பட்டியல் திறக்கப்பட்டது.`
          : 'ஒருங்கிணைந்த ஆவணங்கள் பகுதி திறக்கப்பட்டது.',
        data: payload,
      };
    }

    case 'UPDATE_DOCUMENT_STATUS': {
      if (handlers.onUpdateDocumentStatus) {
        handlers.onUpdateDocumentStatus(payload.docId, payload.status);
      }
      const statusLabel =
        payload.status === 'have'
          ? 'Marked as Available'
          : payload.status === 'missing'
          ? 'Marked as Missing'
          : 'Marked as Uncertain';
      const statusLabelTa =
        payload.status === 'have'
          ? 'உள்ளது எனக் குறிக்கப்பட்டது'
          : payload.status === 'missing'
          ? 'தேவை எனக் குறிக்கப்பட்டது'
          : 'தெரியவில்லை எனக் குறிக்கப்பட்டது';
      return {
        success: true,
        actionType: type,
        messageEn: `Document status updated: ${statusLabel}.`,
        messageTa: `ஆவண நிலை புதுப்பிக்கப்பட்டது: ${statusLabelTa}.`,
        data: payload,
      };
    }

    case 'GENERATE_READINESS_PASSPORT': {
      handlers.onNavigate('readiness-passport');
      return {
        success: true,
        actionType: type,
        messageEn: 'Opened Scheme Readiness Passport generation dossier.',
        messageTa: 'திட்ட தயார் பாஸ்போர்ட் பகுதி திறக்கப்பட்டது.',
        data: payload,
      };
    }

    case 'OPEN_OFFICIAL_APPLICATION_LINK': {
      const url = payload.portalUrl;
      if (url && typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return {
        success: true,
        actionType: type,
        messageEn: payload.portalUrl
          ? `Opened official portal link: ${payload.portalUrl}`
          : 'Official portal link provided.',
        messageTa: payload.portalUrl
          ? `அதிகாரப்பூர்வ அரசு இணையதள இணைப்பு திறக்கப்பட்டது: ${payload.portalUrl}`
          : 'அதிகாரப்பூர்வ அரசு இணைப்பு வழங்கப்பட்டது.',
        data: payload,
      };
    }

    case 'SHOW_APPLICATION_PROGRESS': {
      handlers.onNavigate('application-tracker');
      return {
        success: true,
        actionType: type,
        messageEn: 'Opened Application Guidance Tracker.',
        messageTa: 'விண்ணப்ப வழிகாட்டல் பகுதி திறக்கப்பட்டது.',
        data: payload,
      };
    }

    case 'UPDATE_USER_REPORTED_APPLICATION_STATUS': {
      if (handlers.onSetTrackerStatus) {
        handlers.onSetTrackerStatus(payload.schemeId, payload.status, payload.stepIndex);
      }
      return {
        success: true,
        actionType: type,
        messageEn: `Application progress recorded for scheme: ${payload.status}.`,
        messageTa: `விண்ணப்ப நிலை பதிவு செய்யப்பட்டது: ${payload.status}.`,
        data: payload,
      };
    }

    case 'SET_APPLICATION_REMINDER': {
      if (handlers.onSetTrackerReminder) {
        handlers.onSetTrackerReminder(
          payload.schemeId,
          payload.reminderText,
          payload.reminderDate
        );
      }
      return {
        success: true,
        actionType: type,
        messageEn: `Reminder saved: ${payload.reminderText}.`,
        messageTa: `நினைவூட்டல் சேமிக்கப்பட்டது: ${payload.reminderText}.`,
        data: payload,
      };
    }

    case 'CHANGE_LANGUAGE': {
      if (handlers.onChangeLanguage) {
        handlers.onChangeLanguage(payload.language);
      }
      return {
        success: true,
        actionType: type,
        messageEn: `Language switched to ${payload.language === 'ta' ? 'Tamil' : 'English'}.`,
        messageTa: `மொழி ${payload.language === 'ta' ? 'தமிழுக்கு' : 'ஆங்கிலத்திற்கு'} மாற்றப்பட்டது.`,
        data: payload,
      };
    }

    case 'READ_LAST_RESPONSE': {
      if (handlers.onReadLastResponse) {
        handlers.onReadLastResponse(payload.messageId);
      }
      return {
        success: true,
        actionType: type,
        messageEn: 'Reading response aloud via browser speech synthesis.',
        messageTa: 'பதில் குரல் வழியே படிக்கப்படுகிறது.',
        data: payload,
      };
    }

    case 'NAVIGATE_TO_SECTION': {
      handlers.onNavigate(payload.section);
      return {
        success: true,
        actionType: type,
        messageEn: `Navigated to ${payload.section}.`,
        messageTa: `${payload.section} பகுதிக்கு நகர்த்தப்பட்டது.`,
        data: payload,
      };
    }

    case 'CLEAR_SESSION': {
      if (payload.confirmed && handlers.onClearSession) {
        handlers.onClearSession();
        return {
          success: true,
          actionType: type,
          messageEn: 'Session cleared. All local state has been safely reset.',
          messageTa: 'அமர்வு அழிக்கப்பட்டது. அனைத்து விவரங்களும் பாதுகாப்பாக மீட்டமைக்கப்பட்டன.',
          data: payload,
        };
      }
      return {
        success: false,
        actionType: type,
        messageEn: 'Session reset requires citizen confirmation.',
        messageTa: 'அமர்வை அழிக்க உங்கள் உறுதிப்படுத்தல் தேவை.',
        data: payload,
      };
    }

    default:
      return {
        success: false,
        actionType: type,
        messageEn: `Unhandled action ${type}.`,
        messageTa: `செயல்படுத்த முடியாத செயல்: ${type}.`,
      };
  }
}
