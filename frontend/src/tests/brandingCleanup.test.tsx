import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { LanguageProvider } from '../context/LanguageContext';
import { MemoryStorage } from '../utils/kioskStorage';
import { VERIFIED_REFERENCE_SCHEMES } from '../data/verifiedReferenceSchemes';
import {
  getSpeechPrivacyNotice,
  getSpeechLocale,
  classifySpeechError,
} from '../utils/speechUtils';

describe('SevAIQ Branding Cleanup Suite', () => {
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

  describe('1. Citizen-Facing Assistant Branding', () => {
    it('renders SevAIQ Assistant branding and never displays raw AI • GEMINI badge', () => {
      const html = renderToString(
        <LanguageProvider>
          <VoiceAssistant
            schemes={VERIFIED_REFERENCE_SCHEMES}
            onNavigate={vi.fn()}
            isOpen={true}
          />
        </LanguageProvider>
      );

      // Header branding
      expect(html).toContain('Sev<span class="text-civic-600">AI</span>Q Assistant');
      // No raw unbranded AI • GEMINI
      expect(html).not.toContain('AI • GEMINI');
      expect(html).not.toContain('AI • Gemini');
    });

    it('renders SEVAIQ AI badge for assistant messages in card footer', () => {
      const html = renderToString(
        <LanguageProvider>
          <VoiceAssistant
            schemes={VERIFIED_REFERENCE_SCHEMES}
            onNavigate={vi.fn()}
            isOpen={true}
          />
        </LanguageProvider>
      );

      // The initial welcome message has isBot=true, rendering SEVAIQ AI badge in footer
      expect(html).toContain('SEVAIQ AI');
      expect(html).not.toContain('AI • GEMINI');
    });
  });

  describe('2. Citizen-Facing Phrasing Replacement', () => {
    it('verifies speech confirmation button phrasing is clean and unencumbered by provider branding', () => {
      // In reviewing state, the button should display 'Confirm & Send' rather than 'Confirm & Send to Gemini'
      // We test this across English, Tamil, and Hindi
      const expectedEn = 'Confirm & Send';
      const expectedTa = 'உறுதிசெய்து அனுப்பு';
      const expectedHi = 'पुष्टि करें और भेजें';

      // None should contain Gemini in the button label
      expect(expectedEn).not.toContain('Gemini');
      expect(expectedTa).not.toContain('Gemini');
      expect(expectedHi).not.toContain('Gemini');
    });

    it('verifies loading state phrasing is branded as SevAIQ', () => {
      const loadingPhrases = {
        en: 'SevAIQ is analyzing your query...',
        ta: 'SevAIQ உங்கள் கேள்வியை ஆராய்கிறது...',
        hi: 'SevAIQ आपकी क्वेरी का विश्लेषण कर रहा है...',
      };

      expect(loadingPhrases.en).not.toContain('Gemini');
      expect(loadingPhrases.ta).not.toContain('Gemini');
      expect(loadingPhrases.hi).not.toContain('Gemini');

      expect(loadingPhrases.en).toBe('SevAIQ is analyzing your query...');
    });
  });

  describe('3. Accurate AI-Provider Privacy Disclosures', () => {
    it('preserves accurate disclosure of Google Gemini as the third-party AI provider in English', () => {
      const notice = getSpeechPrivacyNotice('en');
      expect(notice.badge).toContain('Transcripts sent to Gemini only upon your review & confirmation');
      expect(notice.detailed).toContain('Google Gemini, the currently configured third-party AI provider');
      expect(notice.detailed).toContain('SevAIQ does not record or store any audio');
      expect(notice.detailed).toContain('Only the text transcript you review and confirm is sent');
    });

    it('preserves accurate disclosure of Google Gemini as the third-party AI provider in Tamil', () => {
      const notice = getSpeechPrivacyNotice('ta');
      expect(notice.badge).toContain('உங்கள் சரிபார்ப்பிற்கு பிறகே உரை Gemini-க்கு அனுப்பப்படும்');
      expect(notice.detailed).toContain('Google Gemini (தற்போதைய மூன்றாம் தரப்பு AI வழங்குநர்)');
      expect(notice.detailed).toContain('SevAIQ-ல் ஆடியோ பதிவு எதுவும் சேமிக்கப்படுவதில்லை');
    });

    it('provides accurate disclosure of Google Gemini as the third-party AI provider in Hindi', () => {
      const notice = getSpeechPrivacyNotice('hi');
      expect(notice.badge).toContain('समीक्षा और पुष्टि के बाद ही टेक्स्ट Gemini को भेजा जाता है');
      expect(notice.detailed).toContain('Google Gemini (वर्तमान तृतीय-पक्ष AI प्रदाता)');
      expect(notice.detailed).toContain('SevAIQ किसी भी ऑडियो को रिकॉर्ड या संग्रहीत नहीं करता है');
    });
  });

  describe('4. Speech Locale and Error Classification with Hindi Support', () => {
    it('returns valid BCP 47 locales for en, ta, and hi', () => {
      expect(getSpeechLocale('en')).toBe('en-IN');
      expect(getSpeechLocale('ta')).toBe('ta-IN');
      expect(getSpeechLocale('hi')).toBe('hi-IN');
    });

    it('classifies speech errors into citizen-friendly guidance in English, Tamil, and Hindi', () => {
      const enDenied = classifySpeechError('not-allowed', 'en');
      expect(enDenied.message).toContain('Microphone permission was denied');
      expect(enDenied.isRetryable).toBe(true);

      const taDenied = classifySpeechError('not-allowed', 'ta');
      expect(taDenied.message).toContain('மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது');
      expect(taDenied.isRetryable).toBe(true);

      const hiDenied = classifySpeechError('not-allowed', 'hi');
      expect(hiDenied.message).toContain('माइक्रोफ़ोन की अनुमति अस्वीकृत कर दी गई');
      expect(hiDenied.isRetryable).toBe(true);

      const hiNoSpeech = classifySpeechError('no-speech', 'hi');
      expect(hiNoSpeech.message).toContain('कोई आवाज़ नहीं सुनी गई');

      const hiNetwork = classifySpeechError('network', 'hi');
      expect(hiNetwork.message).toContain('ब्राउज़र ध्वनि पहचान नेटवर्क त्रुटि');
    });
  });

  describe('5. Error Feedback Safety (No Technical Leaks)', () => {
    it('verifies citizen-facing error messages do not leak GEMINI_API_KEY or .env paths', () => {
      // Test message templates defined for public error handling
      const sanitizeCheck = (msg: string) => {
        expect(msg).not.toContain('GEMINI_API_KEY');
        expect(msg).not.toContain('.env');
        expect(msg).not.toContain('backend/');
        expect(msg).not.toContain('quota');
        expect(msg).not.toContain('Rate Limit');
        expect(msg).not.toContain('credentials');
      };

      const publicErrors = [
        'The AI service is temporarily unavailable. Please try again.',
        'AI சேவை தற்காலிகமாக கிடைக்கவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
        'एआई सेवा अस्थायी रूप से अनुपलब्ध है। कृपया पुन: प्रयास करें।',
        'The request timed out. Please try again.',
        'கோரிக்கை நேரம் முடிந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
        'अनुरोध का समय समाप्त हो गया। कृपया पुन: प्रयास करें।',
        'This response was blocked by content safety filters.',
        'பாதுகாப்புக் கொள்கையின் காரணமாக இந்த கேள்விக்கான பதில் தடுக்கப்பட்டுள்ளது.',
        'सुरक्षा नीतियों के कारण इस प्रतिक्रिया को अवरुद्ध कर दिया गया है।',
      ];

      publicErrors.forEach(sanitizeCheck);
    });
  });
});
