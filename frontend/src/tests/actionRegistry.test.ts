import { describe, it, expect, vi } from 'vitest';
import {
  ALLOWED_ACTIONS,
  validateChatbotAction,
  extractActionFromText,
  inferClientAction,
  executeChatbotAction,
  ActionValidationContext,
  ChatbotActionHandlers,
} from '../utils/actionRegistry';
import { VERIFIED_REFERENCE_SCHEMES } from '../data/verifiedReferenceSchemes';
import { INITIAL_DOCUMENT_RECORDS } from '../data/verifiedReferenceSchemes';

describe('Chatbot Action Registry & Security Validation Suite', () => {
  const mockContext: ActionValidationContext = {
    profile: {
      age: 42,
      occupation: 'farmer',
      state: 'Tamil Nadu',
      area: 'Rural',
      ownsPuccaHouse: false,
    },
    schemes: VERIFIED_REFERENCE_SCHEMES,
    documents: INITIAL_DOCUMENT_RECORDS,
    selectedSchemeIds: ['pm-kisan', 'ab-pmjay'],
    isKioskMode: false,
  };

  describe('Strict Allowlist & Malicious Action Rejection', () => {
    it('defines exactly the permitted allowlist of safe civic actions', () => {
      expect(ALLOWED_ACTIONS).toContain('DISCOVER_SCHEMES');
      expect(ALLOWED_ACTIONS).toContain('ASK_PROFILE_QUESTION');
      expect(ALLOWED_ACTIONS).toContain('EXPLAIN_SCHEME_MATCH');
      expect(ALLOWED_ACTIONS).toContain('CHECK_ELIGIBILITY');
      expect(ALLOWED_ACTIONS).toContain('SHOW_REQUIRED_DOCUMENTS');
      expect(ALLOWED_ACTIONS).toContain('UPDATE_DOCUMENT_STATUS');
      expect(ALLOWED_ACTIONS).toContain('GENERATE_READINESS_PASSPORT');
      expect(ALLOWED_ACTIONS).toContain('OPEN_OFFICIAL_APPLICATION_LINK');
      expect(ALLOWED_ACTIONS).toContain('SHOW_APPLICATION_PROGRESS');
      expect(ALLOWED_ACTIONS).toContain('UPDATE_USER_REPORTED_APPLICATION_STATUS');
      expect(ALLOWED_ACTIONS).toContain('SET_APPLICATION_REMINDER');
      expect(ALLOWED_ACTIONS).toContain('CHANGE_LANGUAGE');
      expect(ALLOWED_ACTIONS).toContain('READ_LAST_RESPONSE');
      expect(ALLOWED_ACTIONS).toContain('NAVIGATE_TO_SECTION');
      expect(ALLOWED_ACTIONS).toContain('CLEAR_SESSION');
      expect(ALLOWED_ACTIONS).toHaveLength(15);
    });

    it('rejects unknown, arbitrary or dangerous action types', () => {
      const invalid = [
        { type: 'EXECUTE_SYSTEM_COMMAND', payload: { cmd: 'rm -rf' } },
        { type: 'DOWNLOAD_EXTERNAL_SCRIPT', payload: { url: 'http://malware.site' } },
        { type: 'EVAL_CODE', payload: { code: 'alert(1)' } },
        { type: 'DELETE_DATABASE', payload: {} },
        { type: 'FETCH_ALL_USERS', payload: {} },
        null,
        undefined,
        'NOT_AN_OBJECT',
      ];

      invalid.forEach((badAction) => {
        const result = validateChatbotAction(badAction, mockContext);
        expect(result.valid).toBe(false);
      });
    });

    it('sanitizes input and rejects invalid schema fields', () => {
      // Invalid profile field
      const badField = validateChatbotAction(
        { type: 'ASK_PROFILE_QUESTION', payload: { field: 'creditCardNumber' } },
        mockContext
      );
      expect(badField.valid).toBe(false);
      expect(badField.error).toContain('Invalid profile field');

      // Invalid navigation tab
      const badTab = validateChatbotAction(
        { type: 'NAVIGATE_TO_SECTION', payload: { section: 'admin-dashboard' } },
        mockContext
      );
      expect(badTab.valid).toBe(false);
      expect(badTab.error).toContain('Invalid section');

      // Invalid document status
      const badDoc = validateChatbotAction(
        { type: 'UPDATE_DOCUMENT_STATUS', payload: { docId: 'aadhaar', status: 'verified_by_fbi' } },
        mockContext
      );
      expect(badDoc.valid).toBe(false);
      expect(badDoc.error).toContain('Invalid document status');
    });

    it('requires confirmation for destructive actions (CLEAR_SESSION)', () => {
      // Unconfirmed CLEAR_SESSION
      const unconfirmed = validateChatbotAction(
        { type: 'CLEAR_SESSION', payload: { confirmed: false } },
        mockContext
      );
      expect(unconfirmed.valid).toBe(true);
      expect(unconfirmed.requiresConfirmation).toBe(true);

      // Confirmed CLEAR_SESSION
      const confirmed = validateChatbotAction(
        { type: 'CLEAR_SESSION', payload: { confirmed: true } },
        mockContext
      );
      expect(confirmed.valid).toBe(true);
      expect(confirmed.requiresConfirmation).toBe(false);
    });
  });

  describe('Extraction of Structured Action from Assistant Messages', () => {
    it('extracts embedded HTML action comment <!-- SEVAIQ_ACTION: {...} -->', () => {
      const text = `Here are the documents needed for PMAY-U:
1. Aadhaar Card
2. Income Certificate
<!-- SEVAIQ_ACTION: {"type": "SHOW_REQUIRED_DOCUMENTS", "payload": {"schemeId": "pmay-u"}} -->`;

      const { cleanText, proposedAction } = extractActionFromText(text);
      expect(cleanText).not.toContain('SEVAIQ_ACTION');
      expect(cleanText).toContain('1. Aadhaar Card');
      expect(proposedAction).toEqual({
        type: 'SHOW_REQUIRED_DOCUMENTS',
        payload: { schemeId: 'pmay-u' },
      });
    });

    it('extracts embedded JSON code block action', () => {
      const text = `Let me check your eligibility for PM-KISAN.
\`\`\`json
{
  "sevaiq_action": {
    "type": "CHECK_ELIGIBILITY",
    "payload": { "schemeId": "pm-kisan" }
  }
}
\`\`\``;

      const { cleanText, proposedAction } = extractActionFromText(text);
      expect(cleanText).toContain('Let me check your eligibility for PM-KISAN.');
      expect(cleanText).not.toContain('sevaiq_action');
      expect(proposedAction).toEqual({
        type: 'CHECK_ELIGIBILITY',
        payload: { schemeId: 'pm-kisan' },
      });
    });

    it('safely handles text without any action', () => {
      const text = 'Simple explanation without action.';
      const { cleanText, proposedAction } = extractActionFromText(text);
      expect(cleanText).toBe(text);
      expect(proposedAction).toBeNull();
    });
  });

  describe('Client Intent Classifier (inferClientAction)', () => {
    it('identifies student / college fee schemes intent', () => {
      const action = inferClientAction(
        'My daughter is joining college, are there any schemes for fees?',
        'en',
        mockContext
      );
      expect(action).not.toBeNull();
      expect(action?.type).toBe('DISCOVER_SCHEMES');
      expect(action?.payload?.['category']).toBe('Education & Learning');
    });

    it('identifies eligibility check intent for mentioned scheme', () => {
      const action = inferClientAction('Am I eligible for PM-KISAN?', 'en', mockContext);
      expect(action).not.toBeNull();
      expect(action?.type).toBe('CHECK_ELIGIBILITY');
      expect(action?.payload?.['schemeId']).toBe('pm-kisan');
    });

    it('identifies document requirement intent', () => {
      const action = inferClientAction('What documents do I need for PM-KISAN?', 'en', mockContext);
      expect(action).not.toBeNull();
      expect(action?.type).toBe('SHOW_REQUIRED_DOCUMENTS');
      expect(action?.payload?.['schemeId']).toBe('pm-kisan');
    });

    it('identifies readiness passport intent in English and Tamil', () => {
      const actionEn = inferClientAction('Prepare my scheme passport', 'en', mockContext);
      expect(actionEn?.type).toBe('GENERATE_READINESS_PASSPORT');

      const actionTa = inferClientAction('தயார் பாஸ்போர்ட் தயார் செய்', 'ta', mockContext);
      expect(actionTa?.type).toBe('GENERATE_READINESS_PASSPORT');
    });

    it('identifies application tracking "where did I stop?" intent', () => {
      const actionEn = inferClientAction('Where did I stop?', 'en', mockContext);
      expect(actionEn?.type).toBe('SHOW_APPLICATION_PROGRESS');

      const actionTa = inferClientAction('எங்கு நிறுத்தினேன்?', 'ta', mockContext);
      expect(actionTa?.type).toBe('SHOW_APPLICATION_PROGRESS');
    });

    it('identifies language switch intent in English and Tamil', () => {
      const actionTa = inferClientAction('Explain in Tamil', 'en', mockContext);
      expect(actionTa?.type).toBe('CHANGE_LANGUAGE');
      expect(actionTa?.payload?.['language']).toBe('ta');

      const actionEn = inferClientAction('ஆங்கிலத்தில் பேசு', 'ta', mockContext);
      expect(actionEn?.type).toBe('CHANGE_LANGUAGE');
      expect(actionEn?.payload?.['language']).toBe('en');
    });

    it('identifies clear session / reset intent with confirmation required', () => {
      const action = inferClientAction('clear session', 'en', mockContext);
      expect(action?.type).toBe('CLEAR_SESSION');
      expect(action?.payload?.['confirmed']).toBe(false);
    });
  });

  describe('Safe Action Dispatcher (executeChatbotAction)', () => {
    it('dispatches DISCOVER_SCHEMES and returns bilingual outcome', async () => {
      const handlers: ChatbotActionHandlers = {
        onNavigate: vi.fn(),
      };

      const result = await executeChatbotAction(
        { type: 'DISCOVER_SCHEMES', payload: { category: 'agriculture' } },
        handlers
      );

      expect(handlers.onNavigate).toHaveBeenCalledWith('discover');
      expect(result.success).toBe(true);
      expect(result.messageEn).toContain('Opened Scheme Discovery');
      expect(result.messageTa).toContain('திட்டங்கள் தேடல்');
    });

    it('dispatches UPDATE_DOCUMENT_STATUS and updates document possession', async () => {
      const handlers: ChatbotActionHandlers = {
        onNavigate: vi.fn(),
        onUpdateDocumentStatus: vi.fn(),
      };

      const result = await executeChatbotAction(
        { type: 'UPDATE_DOCUMENT_STATUS', payload: { docId: 'aadhaar', status: 'have' } },
        handlers
      );

      expect(handlers.onUpdateDocumentStatus).toHaveBeenCalledWith('aadhaar', 'have');
      expect(result.success).toBe(true);
      expect(result.messageEn).toContain('Available');
      expect(result.messageTa).toContain('உள்ளது');
    });

    it('dispatches CLEAR_SESSION only when confirmed', async () => {
      const handlers: ChatbotActionHandlers = {
        onNavigate: vi.fn(),
        onClearSession: vi.fn(),
      };

      // When unconfirmed
      const unconfirmedRes = await executeChatbotAction(
        { type: 'CLEAR_SESSION', payload: { confirmed: false } },
        handlers
      );
      expect(handlers.onClearSession).not.toHaveBeenCalled();
      expect(unconfirmedRes.success).toBe(false);
      expect(unconfirmedRes.messageEn).toContain('requires citizen confirmation');

      // When confirmed
      const confirmedRes = await executeChatbotAction(
        { type: 'CLEAR_SESSION', payload: { confirmed: true } },
        handlers
      );
      expect(handlers.onClearSession).toHaveBeenCalled();
      expect(confirmedRes.success).toBe(true);
      expect(confirmedRes.messageEn).toContain('Session cleared');
    });
  });
});
