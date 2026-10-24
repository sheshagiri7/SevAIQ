import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeChatAction, fetchChatActionsCatalog, triggerBlobDownload } from '../services/api';
import {
  validateChatbotAction,
  executeChatbotAction,
  ActionValidationContext,
  ChatbotActionHandlers,
} from '../utils/actionRegistry';
import { VERIFIED_REFERENCE_SCHEMES, INITIAL_DOCUMENT_RECORDS } from '../data/verifiedReferenceSchemes';
import { ChatActionResultSchema } from '../types';

describe('Chatbot Action Layer API Integration Suite (docs/CHATBOT_API_CONTRACT.md)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const mockContext: ActionValidationContext = {
    profile: {
      age: 45,
      occupation: 'farmer',
      state: 'Tamil Nadu',
      area: 'Rural',
      landholding: 'Small (1-2 ha)',
      annualIncome: 150000,
    },
    schemes: VERIFIED_REFERENCE_SCHEMES,
    documents: INITIAL_DOCUMENT_RECORDS,
    selectedSchemeIds: ['pm-kisan', 'pmay-g'],
    language: 'en',
    isKioskMode: false,
  };

  const createMockHandlers = (): ChatbotActionHandlers => ({
    onNavigate: vi.fn(),
    onUpdateProfile: vi.fn(),
    onUpdateDocumentStatus: vi.fn(),
    onToggleSchemeSelection: vi.fn(),
    onSelectSchemeForEligibility: vi.fn(),
    onClearSession: vi.fn(),
    onSelectTrackerScheme: vi.fn(),
    onSetTrackerStatus: vi.fn(),
    onSetTrackerReminder: vi.fn(),
    onChangeLanguage: vi.fn(),
    onReadLastResponse: vi.fn(),
  });

  describe('1. Direct Action Execution API (POST /api/chat/action)', () => {
    it('executes discover_schemes action and returns verified schemes', async () => {
      const mockResult: ChatActionResultSchema = {
        success: true,
        action: 'discover_schemes',
        summary: "Found 1 verified scheme matching 'farming': PM-KISAN.",
        data: {
          match_count: 1,
          schemes: [
            {
              id: 'pm-kisan',
              title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
              category: 'Agriculture & Farmer Welfare',
              ministry: 'Ministry of Agriculture and Farmers Welfare',
              short_description: 'Income support of ₹6,000 per year.',
              official_portal_url: 'https://pmkisan.gov.in',
              verification_source: 'pmkisan.gov.in official guidelines',
            },
          ],
        },
        sources: [
          {
            title: 'PM-KISAN',
            url: 'https://pmkisan.gov.in',
            verification_source: 'Official Operational Guidelines',
            verification_date: '2024-02-28',
          },
        ],
        requires_confirmation: false,
        next_question: null,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResult,
      });

      const res = await executeChatAction({
        action: 'discover_schemes',
        payload: { query: 'farming' },
        language: 'en',
      });

      expect(res.success).toBe(true);
      expect(res.data?.action).toBe('discover_schemes');
      expect(res.data?.data.match_count).toBe(1);
      expect(res.data?.sources[0].url).toBe('https://pmkisan.gov.in');
    });

    it('executes check_eligibility and enforces 3-valued deterministic logic', async () => {
      const mockResult: ChatActionResultSchema = {
        success: true,
        action: 'check_eligibility',
        summary: 'You meet the known criteria for PM-KISAN, but landholding status is missing.',
        data: {
          scheme_id: 'pm-kisan',
          scheme_title: 'Pradhan Mantri Kisan Samman Nidhi',
          outcome: 'needs_verification',
          reasons: ['Citizen satisfies evaluated age and residence criteria.'],
          criteria_matched: ['Age 18+'],
          criteria_not_met: [],
          missing_information: ['Cultivable agricultural landholding status is required.'],
        },
        sources: [
          {
            title: 'PM-KISAN',
            url: 'https://pmkisan.gov.in',
            verification_source: 'Official Operational Guidelines',
          },
        ],
        requires_confirmation: false,
        next_question: 'Do you own cultivable agricultural land?',
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResult,
      });

      const res = await executeChatAction({
        action: 'check_eligibility',
        payload: { scheme_id: 'pm-kisan', profile: { age: 35 } },
        language: 'en',
      });

      expect(res.success).toBe(true);
      expect(res.data?.data.outcome).toBe('needs_verification');
      expect(res.data?.data.missing_information).toHaveLength(1);
      expect(res.data?.next_question).toBe('Do you own cultivable agricultural land?');
    });

    it('executes map_documents and calculates cross-scheme readiness score', async () => {
      const mockResult: ChatActionResultSchema = {
        success: true,
        action: 'map_documents',
        summary: 'Required documents mapped across 2 scheme(s). Current document readiness score: 50%.',
        data: {
          total_unique_required_documents: 4,
          reusable_documents: [
            {
              canonical_name: 'Aadhaar Card',
              reusability_count: 2,
              status: 'available',
            },
          ],
          single_scheme_documents: [],
          available_documents: [{ canonical_name: 'Aadhaar Card' }],
          missing_documents: [{ canonical_name: 'Land Record (Khata/Patta)' }],
          readiness_score: {
            score_percentage: 50,
            numerator: 1,
            denominator: 2,
            formula: '1 / 2 required documents available',
            disclaimer: 'Readiness indicates citizen preparedness, not approval.',
          },
        },
        sources: [
          {
            title: 'PM-KISAN',
            url: 'https://pmkisan.gov.in',
            verification_source: 'Official Guidelines',
          },
        ],
        requires_confirmation: false,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResult,
      });

      const res = await executeChatAction({
        action: 'map_documents',
        payload: {
          scheme_ids: ['pm-kisan', 'pmay-g'],
          citizen_documents: ['Aadhaar Card'],
        },
        language: 'en',
      });

      expect(res.success).toBe(true);
      expect(res.data?.data.readiness_score.score_percentage).toBe(50);
      expect(res.data?.data.reusable_documents).toHaveLength(1);
    });

    it('executes generate_passport and returns downloadable PDF payload', async () => {
      const mockResult: ChatActionResultSchema = {
        success: true,
        action: 'generate_passport',
        summary: 'SevAIQ Scheme Passport PDF successfully generated for 2 scheme(s).',
        data: {
          filename: 'SevAIQ_Scheme_Passport.pdf',
          download_endpoint: '/api/passport/pdf',
          schemes_included: ['pm-kisan', 'pmay-g'],
          readiness_percentage: 67,
          generation_timestamp: '2026-10-24T18:00:00Z',
          pdf_base64: 'JVBERi0xLjQKJcTl8uXrp...',
        },
        sources: [
          {
            title: 'PM-KISAN',
            url: 'https://pmkisan.gov.in',
            verification_source: 'Official Record',
          },
        ],
        requires_confirmation: false,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResult,
      });

      const res = await executeChatAction({
        action: 'generate_passport',
        payload: {
          scheme_ids: ['pm-kisan', 'pmay-g'],
          profile: { age: 40, residence_type: 'rural' },
        },
        language: 'en',
      });

      expect(res.success).toBe(true);
      expect(res.data?.data.filename).toBe('SevAIQ_Scheme_Passport.pdf');
      expect(res.data?.data.download_endpoint).toBe('/api/passport/pdf');
      expect(typeof res.data?.data.pdf_base64).toBe('string');
    });

    it('executes get_application_guidance with official links and non-intrusive status notice', async () => {
      const mockResult: ChatActionResultSchema = {
        success: true,
        action: 'get_application_guidance',
        summary: 'Official application guidance for PM-KISAN.',
        data: {
          scheme_title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
          application_mode: 'Online (pmkisan.gov.in) or Seva Kendra (CSC)',
          application_steps: [
            'Visit the official portal at https://pmkisan.gov.in.',
            'Click on "New Farmer Registration".',
            'Verify your Aadhaar and land record details.',
          ],
          official_portal_url: 'https://pmkisan.gov.in',
          user_recorded_status: 'Not yet recorded',
          portal_status_notice:
            'Notice: Application progress represents your local tracking notes, not live government portal verification.',
        },
        sources: [
          {
            title: 'PM-KISAN',
            url: 'https://pmkisan.gov.in',
            verification_source: 'Operational Guidelines',
          },
        ],
        requires_confirmation: false,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResult,
      });

      const res = await executeChatAction({
        action: 'get_application_guidance',
        payload: { scheme_id: 'pm-kisan' },
        language: 'en',
      });

      expect(res.success).toBe(true);
      expect(res.data?.data.application_steps).toHaveLength(3);
      expect(res.data?.data.official_portal_url).toBe('https://pmkisan.gov.in');
      expect(res.data?.data.portal_status_notice).toContain('Notice: Application progress represents');
    });

    it('gracefully handles backend validation errors (e.g. unknown scheme) without claiming success', async () => {
      const errorResult: ChatActionResultSchema = {
        success: false,
        action: 'get_scheme_details',
        summary: 'Scheme "fake-scheme-999" was not found in the verified catalogue.',
        data: {},
        sources: [],
        requires_confirmation: false,
        error: {
          code: 'SCHEME_NOT_FOUND',
          message: 'Scheme "fake-scheme-999" not found.',
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => JSON.stringify(errorResult),
        json: async () => errorResult,
      });

      const res = await executeChatAction({
        action: 'get_scheme_details',
        payload: { scheme_id: 'fake-scheme-999' },
      });

      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('2. Registered Action Catalog API (GET /api/chat/actions)', () => {
    it('retrieves the full metadata catalog of supported server and client actions', async () => {
      const mockCatalog = [
        {
          action: 'discover_schemes',
          type: 'server',
          description: 'Search verified schemes matching citizen goals.',
          parameters: { query: 'string', category: 'string' },
        },
        {
          action: 'check_eligibility',
          type: 'server',
          description: 'Evaluate profile against statutory rules.',
          parameters: { scheme_id: 'string', profile: 'CitizenProfile' },
        },
        {
          action: 'clear_session',
          type: 'client_side',
          description: 'Purge local session profile data.',
          parameters: { confirmed: 'boolean' },
          requires_confirmation: true,
        },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockCatalog,
      });

      const res = await fetchChatActionsCatalog();
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(3);
      expect(res.data[0].action).toBe('discover_schemes');
      expect(res.data[2].requires_confirmation).toBe(true);
    });
  });

  describe('3. Action Execution via ActionRegistry', () => {
    it('delegates discover_schemes through executeChatbotAction to backend API', async () => {
      const handlers = createMockHandlers();
      const mockApiResult: ChatActionResultSchema = {
        success: true,
        action: 'discover_schemes',
        summary: 'Found 1 verified scheme: PM-KISAN.',
        data: { match_count: 1, schemes: [{ id: 'pm-kisan', title: 'PM-KISAN' }] },
        sources: [
          {
            title: 'PM-KISAN',
            url: 'https://pmkisan.gov.in',
            verification_source: 'Official Record',
          },
        ],
        requires_confirmation: false,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResult,
      });

      const validated = validateChatbotAction(
        { type: 'discover_schemes', payload: { query: 'farmer' } },
        mockContext
      );
      expect(validated.valid).toBe(true);

      const outcome = await executeChatbotAction(validated.action!, handlers, {
        profile: mockContext.profile,
        schemes: mockContext.schemes,
        documents: mockContext.documents,
        language: 'en',
      });

      expect(handlers.onNavigate).toHaveBeenCalledWith('discover');
      expect(outcome.success).toBe(true);
      expect(outcome.summary).toContain('PM-KISAN');
      expect(outcome.sources).toHaveLength(1);
    });

    it('enforces safety guard and requires confirmation for CLEAR_SESSION', async () => {
      const handlers = createMockHandlers();

      // Unconfirmed attempt
      const unconfirmed = await executeChatbotAction(
        { type: 'clear_session', payload: { confirmed: false } },
        handlers
      );
      expect(handlers.onClearSession).not.toHaveBeenCalled();
      expect(unconfirmed.success).toBe(false);
      expect(unconfirmed.requires_confirmation).toBe(true);

      // Confirmed attempt
      const confirmed = await executeChatbotAction(
        { type: 'clear_session', payload: { confirmed: true } },
        handlers
      );
      expect(handlers.onClearSession).toHaveBeenCalled();
      expect(confirmed.success).toBe(true);
    });

    it('handles client navigation navigate_to mapping to appropriate section tab', async () => {
      const handlers = createMockHandlers();

      const res = await executeChatbotAction(
        { type: 'navigate_to', payload: { target: 'passport' } },
        handlers
      );

      expect(handlers.onNavigate).toHaveBeenCalledWith('readiness-passport');
      expect(res.success).toBe(true);
      expect(res.data.execution).toBe('client_side');
    });

    it('handles client language switch set_language', async () => {
      const handlers = createMockHandlers();

      const res = await executeChatbotAction(
        { type: 'set_language', payload: { language: 'ta' } },
        handlers
      );

      expect(handlers.onChangeLanguage).toHaveBeenCalledWith('ta');
      expect(res.success).toBe(true);
      expect(res.data.language).toBe('ta');
    });

    it('safely invokes triggerBlobDownload without runtime errors', () => {
      const blob = new Blob(['%PDF-1.4 test'], { type: 'application/pdf' });
      expect(() => triggerBlobDownload(blob, 'Test_Passport.pdf')).not.toThrow();
    });
  });
});
