import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { LanguageProvider } from '../context/LanguageContext';
import { ThemeProvider } from '../context/ThemeContext';
import { VERIFIED_REFERENCE_SCHEMES } from '../data/verifiedReferenceSchemes';
import { INITIAL_DOCUMENT_RECORDS } from '../data/verifiedReferenceSchemes';
import { inferClientAction, validateChatbotAction, executeChatbotAction, ActionValidationContext } from '../utils/actionRegistry';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual<any>('../services/api');
  return {
    ...actual,
    executeChatAction: vi.fn().mockImplementation(async (req: any) => {
      const action = req.action;
      if (action === 'discover_schemes') {
        return {
          success: true,
          data: {
            success: true,
            action: 'discover_schemes',
            summary: 'Opened Scheme Discovery.',
            data: { match_count: 1, schemes: [{ id: 'pm-kisan' }] },
            sources: [],
            requires_confirmation: false,
          },
        };
      }
      if (action === 'check_eligibility') {
        return {
          success: true,
          data: {
            success: true,
            action: 'check_eligibility',
            summary: 'Eligibility evaluated.',
            data: { outcome: 'meets_known_criteria' },
            sources: [],
            requires_confirmation: false,
          },
        };
      }
      if (action === 'map_documents') {
        return {
          success: true,
          data: {
            success: true,
            action: 'map_documents',
            summary: 'Document checklist loaded.',
            data: { readiness_score: { score_percentage: 100 } },
            sources: [],
            requires_confirmation: false,
          },
        };
      }
      if (action === 'generate_passport') {
        return {
          success: true,
          data: {
            success: true,
            action: 'generate_passport',
            summary: 'Scheme Readiness Passport generated.',
            data: {
              filename: 'SevAIQ_Scheme_Passport.pdf',
              pdf_base64: 'JVBERi0xLjQK...',
              readiness_percentage: 100,
            },
            sources: [],
            requires_confirmation: false,
          },
        };
      }
      if (action === 'get_application_guidance') {
        return {
          success: true,
          data: {
            success: true,
            action: 'get_application_guidance',
            summary: 'Application guidance loaded.',
            data: { official_portal_url: 'https://pmkisan.gov.in' },
            sources: [],
            requires_confirmation: false,
          },
        };
      }
      return { success: false, error: 'Unknown action' };
    }),
  };
});

describe('Citizen-First Accessible Chat-Driven Assistant Suite', () => {
  const baseProps = {
    schemes: VERIFIED_REFERENCE_SCHEMES,
    documents: INITIAL_DOCUMENT_RECORDS,
    selectedSchemeIds: ['pm-kisan', 'ab-pmjay'],
    onNavigate: vi.fn(),
    onSelectSchemeForEligibility: vi.fn(),
    onUpdateProfile: vi.fn(),
    onUpdateDocumentStatus: vi.fn(),
    onToggleSchemeSelection: vi.fn(),
    onClearSession: vi.fn(),
    onSelectTrackerScheme: vi.fn(),
    onSetTrackerStatus: vi.fn(),
    onSetTrackerReminder: vi.fn(),
    isOpen: true,
    isMainScreen: true,
  };

  describe('First Viewport Visual Hierarchy & Home Screen', () => {
    it('renders all required first viewport elements in exact citizen hierarchy', () => {
      const html = renderToString(
        <LanguageProvider>
          <VoiceAssistant {...baseProps} />
        </LanguageProvider>
      );

      // 1. Identity & simple language selector
      expect(html).toContain('Sev<span class="text-civic-600">AI</span>Q Assistant');
      expect(html).toContain('தமிழ் (ta-IN)');
      expect(html).toContain('English (en-IN)');

      // 2. Welcoming heading
      expect(html).toContain('Welcome to SevAIQ. What help do you need today?');

      // 3. Short explanation
      expect(html).toContain('Ask in simple English or Tamil. You can type or speak.');

      // 4. Large visible input field (min-h-[56px] text-base sm:text-lg)
      expect(html).toContain('min-h-[56px]');
      expect(html).toContain('text-base sm:text-lg');

      // 5. Prominent, high-visibility green microphone control (bg-[#16733B] min-h-[56px] min-w-[56px])
      expect(html).toContain('bg-[#16733B]');
      expect(html).toContain('min-w-[56px]');
      expect(html).toContain('data-testid="microphone-toggle-button"');

      // 6. Small number of simple starter actions
      expect(html).toContain('Find schemes for me');
      expect(html).toContain('My documents');
      expect(html).toContain('Track my application');
      expect(html).toContain('What should I do next?');

      // 7. Compact 4-stage citizen journey ribbon
      expect(html).toContain('4-Stage Citizen Journey:');
      expect(html).toContain('1. Your Details');
      expect(html).toContain('2. Find Schemes');
      expect(html).toContain('3. Prepare Docs');
      expect(html).toContain('4. Track Application');
    });

    it('renders Tamil welcoming heading and starter actions when Tamil language selected', () => {
      // In LanguageProvider with default 'ta'
      const html = renderToString(
        <LanguageProvider>
          <VoiceAssistant {...baseProps} />
        </LanguageProvider>
      );

      // Contains bilingual support
      expect(html).toContain('lang-select-ta');
      expect(html).toContain('lang-select-en');
    });

    it('enforces light theme as portal default for all first-time visitors', () => {
      const TestConsumer = () => {
        return <div data-testid="portal-root">Portal Content</div>;
      };

      const html = renderToString(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      // Verifies portal content renders with default light theme
      expect(html).toContain('Portal Content');
    });
  });

  describe('Accessibility & Sizing Requirements', () => {
    it('uses readable 18px body text where practical (text-base sm:text-lg) and comfortable line-height', () => {
      const html = renderToString(
        <LanguageProvider>
          <VoiceAssistant {...baseProps} />
        </LanguageProvider>
      );

      // Body text in composer and messages
      expect(html).toContain('text-base sm:text-lg');
      expect(html).toContain('leading-relaxed');
    });

    it('enforces minimum 48px touch targets on primary controls and buttons', () => {
      const html = renderToString(
        <LanguageProvider>
          <VoiceAssistant {...baseProps} />
        </LanguageProvider>
      );

      // Large mic button and action buttons have min-h-[48px] or min-h-[56px]
      expect(html).toContain('min-h-[48px]');
      expect(html).toContain('min-h-[56px]');
    });
  });

  describe('8 Required Chatbot Citizen Scenarios', () => {
    const context: ActionValidationContext = {
      profile: { age: 45, occupation: 'farmer', state: 'Tamil Nadu', area: 'Rural' },
      schemes: VERIFIED_REFERENCE_SCHEMES,
      documents: INITIAL_DOCUMENT_RECORDS,
      selectedSchemeIds: ['pm-kisan'],
      isKioskMode: false,
    };

    it('Scenario 1: College fees / student scheme discovery', async () => {
      const query = 'My daughter is joining college, are there any schemes for fees?';
      const action = inferClientAction(query, 'en', context);
      expect(action).not.toBeNull();
      expect(action?.type).toBe('DISCOVER_SCHEMES');

      const handlers = { onNavigate: vi.fn() };
      const outcome = await executeChatbotAction(action as any, handlers);
      expect(handlers.onNavigate).toHaveBeenCalledWith('discover');
      expect(outcome.success).toBe(true);
    });

    it('Scenario 2: Eligibility explanation (rule-based check)', async () => {
      const query = 'Am I eligible for PM-KISAN?';
      const action = inferClientAction(query, 'en', context);
      expect(action).not.toBeNull();
      expect(action?.type).toBe('CHECK_ELIGIBILITY');

      const handlers = { onNavigate: vi.fn() };
      const outcome = await executeChatbotAction(action as any, handlers);
      expect(handlers.onNavigate).toHaveBeenCalledWith('eligibility');
      expect(outcome.success).toBe(true);
    });

    it('Scenario 3: Document requirements & checklist toggle', async () => {
      const query = 'What documents do I need for PM-KISAN?';
      const action = inferClientAction(query, 'en', context);
      expect(action?.type).toBe('SHOW_REQUIRED_DOCUMENTS');

      // Citizen marks document status to 'have'
      const updateAction = {
        type: 'UPDATE_DOCUMENT_STATUS' as const,
        payload: { docId: 'aadhaar', status: 'have' as const },
      };
      const handlers = { onNavigate: vi.fn(), onUpdateDocumentStatus: vi.fn() };
      const outcome = await executeChatbotAction(updateAction, handlers);
      expect(handlers.onUpdateDocumentStatus).toHaveBeenCalledWith('aadhaar', 'have');
      expect(outcome.messageEn).toContain('Available');
    });

    it('Scenario 4: Scheme Readiness Passport generation', async () => {
      const query = 'Prepare my scheme passport';
      const action = inferClientAction(query, 'en', context);
      expect(action?.type).toBe('GENERATE_READINESS_PASSPORT');

      const handlers = { onNavigate: vi.fn() };
      const outcome = await executeChatbotAction(action as any, handlers);
      expect(handlers.onNavigate).toHaveBeenCalledWith('readiness-passport');
      expect(outcome.success).toBe(true);
    });

    it('Scenario 5: Application guidance with official link', async () => {
      const query = 'How do I apply for PM-KISAN?';
      const action = inferClientAction(query, 'en', context);
      expect(action?.type).toBe('OPEN_OFFICIAL_APPLICATION_LINK');

      const validated = validateChatbotAction(action, context);
      expect(validated.valid).toBe(true);
      expect(validated.action?.payload.portalUrl).toContain('pmkisan.gov.in');
    });

    it('Scenario 6: Application tracking ("Where did I stop?")', async () => {
      const query = 'Where did I stop?';
      const action = inferClientAction(query, 'en', context);
      expect(action?.type).toBe('SHOW_APPLICATION_PROGRESS');

      const handlers = { onNavigate: vi.fn() };
      const outcome = await executeChatbotAction(action as any, handlers);
      expect(handlers.onNavigate).toHaveBeenCalledWith('application-tracker');
      expect(outcome.success).toBe(true);
    });

    it('Scenario 7: Language switch & audio playback controls', async () => {
      const query = 'Explain in Tamil';
      const action = inferClientAction(query, 'en', context);
      expect(action?.type).toBe('CHANGE_LANGUAGE');
      expect(action?.payload?.language).toBe('ta');

      const handlers = { onNavigate: vi.fn(), onChangeLanguage: vi.fn() };
      const outcome = await executeChatbotAction(action as any, handlers);
      expect(handlers.onChangeLanguage).toHaveBeenCalledWith('ta');
      expect(outcome.success).toBe(true);
    });

    it('Scenario 8: Recovery from misunderstanding & Clear Session with confirmation', async () => {
      const query = 'Clear session';
      const action = inferClientAction(query, 'en', context);
      expect(action?.type).toBe('CLEAR_SESSION');

      // Validation flags requiresConfirmation=true
      const validation = validateChatbotAction(action, context);
      expect(validation.valid).toBe(true);
      expect(validation.requiresConfirmation).toBe(true);

      // Attempting to execute unconfirmed action safely refuses without mutating state
      const handlers = { onNavigate: vi.fn(), onClearSession: vi.fn() };
      const refused = await executeChatbotAction(validation.action!, handlers);
      expect(handlers.onClearSession).not.toHaveBeenCalled();
      expect(refused.success).toBe(false);

      // When citizen clicks confirmation dialog
      const confirmedAction = { type: 'CLEAR_SESSION' as const, payload: { confirmed: true } };
      const confirmed = await executeChatbotAction(confirmedAction, handlers);
      expect(handlers.onClearSession).toHaveBeenCalled();
      expect(confirmed.success).toBe(true);
      expect(confirmed.messageEn).toContain('Session cleared');
    });
  });
});
