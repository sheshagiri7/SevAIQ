import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { LanguageProvider } from '../context/LanguageContext';
import { MemoryStorage } from '../utils/kioskStorage';
import { VERIFIED_REFERENCE_SCHEMES } from '../data/verifiedReferenceSchemes';

describe('VoiceAssistant Component UI Suite', () => {
  beforeEach(() => {
    (globalThis as any).localStorage = new MemoryStorage();
    if (typeof document === 'undefined') {
      (globalThis as any).document = {
        documentElement: { lang: 'en', style: {} },
        body: { classList: { add: vi.fn(), remove: vi.fn() } },
      };
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders open assistant window with bilingual (ta-IN / en-IN) selectors', () => {
    const html = renderToString(
      <LanguageProvider>
        <VoiceAssistant
          schemes={VERIFIED_REFERENCE_SCHEMES}
          onNavigate={vi.fn()}
          isOpen={true}
        />
      </LanguageProvider>
    );

    // Title and branding
    expect(html).toContain('Sev<span class="text-civic-600">AI</span>Q Voice AI');
    // Language selector with BCP 47 tags
    expect(html).toContain('தமிழ் (ta-IN)');
    expect(html).toContain('English (en-IN)');
    // Truthful privacy disclosure
    expect(html).toContain('Browser Web Speech API');
    expect(html).toContain('Transcripts sent to Gemini only upon your review &amp; confirmation');
    // Bottom dock input bar with mic and text placeholder
    expect(html).toContain('Ask welfare questions in English or Tamil...');
    expect(html).toContain('Press Enter to send');
    expect(html).toContain('Speak in தமிழ் (ta-IN) or English (en-IN)');
  });

  it('renders closed floating trigger launcher button when isOpen=false', () => {
    const html = renderToString(
      <LanguageProvider>
        <VoiceAssistant
          schemes={VERIFIED_REFERENCE_SCHEMES}
          onNavigate={vi.fn()}
          isOpen={false}
        />
      </LanguageProvider>
    );

    // Trigger button is present
    expect(html).toContain('Voice AI');
    expect(html).toContain('ta-IN / en-IN');
    expect(html).toContain('Ask welfare schemes');
    // Assistant window is not mounted
    expect(html).not.toContain('Review Voice Transcript');
  });

  it('renders with Kiosk Mode safely enabled', () => {
    const html = renderToString(
      <LanguageProvider>
        <VoiceAssistant
          schemes={VERIFIED_REFERENCE_SCHEMES}
          onNavigate={vi.fn()}
          isOpen={true}
          isKioskMode={true}
        />
      </LanguageProvider>
    );

    expect(html).toContain('Sev<span class="text-civic-600">AI</span>Q Voice AI');
    expect(html).toContain('Welcome! I am the SevAIQ Voice &amp; Text Assistant.');
  });
});
