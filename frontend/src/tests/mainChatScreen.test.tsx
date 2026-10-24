import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from '../App';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { Header } from '../components/Header';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage } from '../utils/kioskStorage';
import { VERIFIED_REFERENCE_SCHEMES } from '../data/verifiedReferenceSchemes';
import { SAMPLE_PROMPTS } from '../utils/voiceAssistantEngine';
import { UI_TRANSLATIONS } from '../i18n/translations';

describe('Main Chatbot Screen Experience Suite', () => {
  beforeEach(() => {
    (globalThis as any).localStorage = new MemoryStorage();
    if (typeof document === 'undefined') {
      (globalThis as any).document = {
        documentElement: { lang: 'en', style: {} },
        body: { classList: { add: vi.fn(), remove: vi.fn() } },
        getElementById: vi.fn(),
      };
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders App with Chat as the primary default workspace on initial load', () => {
    const tree = (
      <LanguageProvider>
        <AccessibilityProvider>
          <App />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    const html = renderToString(tree);

    // Chat is the default active nav item in the header
    expect(html).toContain('Chat');
    // Welcoming assistant workspace is rendered
    expect(html).toContain('Sev<span class="text-civic-600">AI</span>Q Assistant');
    expect(html).toContain('How can SevAIQ help you today?');
    // The 5 large suggested question cards are visible in the hero
    expect(html).toContain('Farmer Financial Assistance');
    expect(html).toContain('Free Healthcare Schemes');
    expect(html).toContain('Housing Assistance');
    expect(html).toContain('Senior Citizen Pension');
    expect(html).toContain('Small-Business Loans');

    // On the main chat screen, the secondary floating launcher button should NOT be rendered
    expect(html).not.toContain('Return to Chat');
  });

  it('Header places Chat as the 1st primary navigation tab', () => {
    const html = renderToString(
      <LanguageProvider>
        <Header
          apiState={{
            status: 'connected',
            baseUrl: 'https://sevaiq-backend.vercel.app',
            health: null,
            latencyMs: 42,
            errorMessage: null,
            lastChecked: new Date(),
          }}
          activeTab="chat"
          onSelectTab={vi.fn()}
          onRefreshHealth={vi.fn()}
          eligibleCount={5}
        />
      </LanguageProvider>
    );

    expect(html).toContain('Chat');
    expect(html).toContain('Dashboard');
    expect(html).toContain('Schemes');
    expect(html).toContain('Your Details');
    // Active styling for chat tab
    expect(html).toContain('bg-civic-50 text-civic-800');
    expect(html).toContain('aria-current="page"');
  });

  it('VoiceAssistant renders full-width citizen workspace when isMainScreen=true', () => {
    const html = renderToString(
      <LanguageProvider>
        <VoiceAssistant
          schemes={VERIFIED_REFERENCE_SCHEMES}
          onNavigate={vi.fn()}
          isMainScreen={true}
          isOpen={true}
        />
      </LanguageProvider>
    );

    // Rendered as semantic region, not dialog popup
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="SevAIQ Tamil &amp; English Voice Assistant"');
    // Contains bottom composer bar
    expect(html).toContain('Ask welfare questions in English or Tamil...');
    expect(html).toContain('Press Enter to send');
    // Contains Tamil and English language toggles
    expect(html).toContain('தமிழ் (ta-IN)');
    expect(html).toContain('English (en-IN)');
  });

  it('VoiceAssistant renders floating dialog popup when isMainScreen=false', () => {
    const html = renderToString(
      <LanguageProvider>
        <VoiceAssistant
          schemes={VERIFIED_REFERENCE_SCHEMES}
          onNavigate={vi.fn()}
          isMainScreen={false}
          isOpen={true}
        />
      </LanguageProvider>
    );

    // Floating window uses dialog role
    expect(html).toContain('role="dialog"');
    expect(html).toContain('fixed z-50');
  });

  it('SAMPLE_PROMPTS has 5 comprehensive categories with rich descriptions and icons', () => {
    const enPrompts = SAMPLE_PROMPTS.en;
    expect(enPrompts).toHaveLength(5);

    const labels = enPrompts.map((p) => p.label);
    expect(labels.some((l) => l.includes('Farmer'))).toBe(true);
    expect(labels.some((l) => l.includes('Healthcare'))).toBe(true);
    expect(labels.some((l) => l.includes('Housing'))).toBe(true);
    expect(labels.some((l) => l.includes('Pension'))).toBe(true);
    expect(labels.some((l) => l.includes('Business'))).toBe(true);

    // All prompts have query, description, and icon
    enPrompts.forEach((p) => {
      expect(p.query.length).toBeGreaterThan(15);
      expect(p.description).toBeDefined();
      expect(p.icon).toBeDefined();
    });

    // Tamil prompts also have 5 complete categories
    const taPrompts = SAMPLE_PROMPTS.ta;
    expect(taPrompts).toHaveLength(5);
    taPrompts.forEach((p) => {
      expect(p.query.length).toBeGreaterThan(10);
      expect(p.description).toBeDefined();
      expect(p.icon).toBeDefined();
    });
  });

  it('UI_TRANSLATIONS provides chat navigation labels across English, Tamil, and Hindi', () => {
    expect(UI_TRANSLATIONS.en.header.chat).toBe('Chat');
    expect(UI_TRANSLATIONS.ta.header.chat).toBe('அரட்டை');
    expect(UI_TRANSLATIONS.hi.header.chat).toBe('चैट');
  });
});
