/**
 * Speech Recognition (STT) and Synthesis (TTS) Utilities for SevAIQ.
 * 
 * Provides:
 * - BCP 47 locale mappings (ta-IN, en-IN)
 * - Browser capability detection
 * - Recognition error classification (permission denied, no-speech, network)
 * - Truthful privacy disclosures (disclosing browser vendor cloud processing)
 * - Transcript sanitization & validation
 */

import { AssistantLanguage } from '../types';

export type SpeechRecognitionState =
  | 'idle'
  | 'listening'
  | 'reviewing'
  | 'permission_denied'
  | 'error';

export interface ClassifiedSpeechError {
  type: 'permission_denied' | 'no_speech' | 'network' | 'audio_capture' | 'unsupported' | 'unknown';
  message: string;
  isRetryable: boolean;
}

/**
 * Returns the exact BCP 47 language tag for speech recognition and synthesis.
 */
export function getSpeechLocale(language: AssistantLanguage): 'ta-IN' | 'en-IN' | 'hi-IN' {
  if (language === 'ta') return 'ta-IN';
  if (language === 'hi') return 'hi-IN';
  return 'en-IN';
}

/**
 * Checks if the browser supports the Web Speech API recognition interface.
 * Typically supported in Chromium (Chrome, Edge) and Safari.
 * Typically NOT supported in default Firefox without experimental flags.
 */
export function isSpeechRecognitionSupported(): boolean {
  const win = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  return !!(
    win.SpeechRecognition ||
    win.webkitSpeechRecognition ||
    (globalThis as any).SpeechRecognition ||
    (globalThis as any).webkitSpeechRecognition
  );
}

/**
 * Checks if the browser supports SpeechSynthesis for Text-to-Speech.
 */
export function isSpeechSynthesisSupported(): boolean {
  const win = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
  return 'speechSynthesis' in win || 'speechSynthesis' in (globalThis as any);
}

/**
 * Categorizes browser Web Speech recognition errors and provides localized,
 * citizen-friendly guidance in Tamil or English.
 */
export function classifySpeechError(
  errorCode: string,
  language: AssistantLanguage
): ClassifiedSpeechError {
  const code = (errorCode || '').toLowerCase();

  if (code === 'not-allowed' || code === 'service-not-allowed') {
    return {
      type: 'permission_denied',
      message:
        language === 'ta'
          ? 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. உலாவி அமைப்பில் மைக்ரோஃபோனை அனுமதிக்கவும் அல்லது கீழே உள்ள உரை பெட்டியில் தட்டச்சு செய்யவும்.'
          : language === 'hi'
          ? 'माइक्रोफ़ोन की अनुमति अस्वीकृत कर दी गई। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें या नीचे टेक्स्ट दर्ज करें।'
          : 'Microphone permission was denied. Please allow microphone access in your browser settings (site permissions) or use manual text input below.',
      isRetryable: true,
    };
  }

  if (code === 'no-speech') {
    return {
      type: 'no_speech',
      message:
        language === 'ta'
          ? 'குரல் எதுவும் கேட்கவில்லை. மைக்ரோஃபோன் அருகில் பேசி மீண்டும் முயற்சிக்கவும் அல்லது தட்டச்சு செய்யவும்.'
          : language === 'hi'
          ? 'कोई आवाज़ नहीं सुनी गई। कृपया माइक्रोफ़ोन के करीब बोलें या नीचे टेक्स्ट दर्ज करें।'
          : 'No speech was detected. Please speak closer to the microphone or use the text input below.',
      isRetryable: true,
    };
  }

  if (code === 'network') {
    return {
      type: 'network',
      message:
        language === 'ta'
          ? 'உலாவியின் குரல் சேவை பிணைய பிழை (Network Error). உங்கள் இணைய இணைப்பை சரிபார்க்கவும் அல்லது தட்டச்சு செய்து கேட்கவும்.'
          : language === 'hi'
          ? 'ब्राउज़र ध्वनि पहचान नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें या नीचे प्रश्न टाइप करें।'
          : 'Browser speech recognition network failure. The browser speech service could not be reached. Manual text input remains available.',
      isRetryable: true,
    };
  }

  if (code === 'audio-capture') {
    return {
      type: 'audio_capture',
      message:
        language === 'ta'
          ? 'மைக்ரோஃபோன் சாதனம் கண்டறியப்படவில்லை அல்லது பயன்பாட்டில் உள்ளது. மைக்ரோஃபோனை சரிபார்க்கவும்.'
          : language === 'hi'
          ? 'कोई माइक्रोफ़ोन नहीं मिला या यह किसी अन्य एप्लिकेशन द्वारा उपयोग में है। कृपया अपना ऑडियो डिवाइस जांचें।'
          : 'No microphone was detected or it is in use by another application. Please check your audio input device.',
      isRetryable: true,
    };
  }

  return {
    type: 'unknown',
    message:
      language === 'ta'
        ? `குரல் அறிதல் பிழை ஏற்பட்டது (${errorCode}). மீண்டும் முயற்சிக்கவும் அல்லது தட்டச்சு செய்யவும்.`
        : language === 'hi'
        ? `ध्वनि पहचान त्रुटि (${errorCode})। कृपया पुनः प्रयास करें या नीचे प्रश्न टाइप करें।`
        : `Speech recognition error (${errorCode}). Please try again or type your question below.`,
    isRetryable: true,
  };
}

/**
 * Truthful privacy disclosure text regarding browser speech recognition.
 * Browser Web Speech API implementations (e.g. Google Chrome, Apple Safari)
 * may send audio to vendor cloud servers for recognition.
 * SevAIQ itself does not record, retain, or store voice audio.
 * Only the confirmed text transcript is transmitted to Google Gemini.
 */
export function getSpeechPrivacyNotice(language: AssistantLanguage): {
  badge: string;
  detailed: string;
} {
  if (language === 'ta') {
    return {
      badge: 'உலாவியின் வெப் ஸ்பீச் ஏபிஐ · உங்கள் சரிபார்ப்பிற்கு பிறகே உரை Gemini-க்கு அனுப்பப்படும்',
      detailed:
        'குரல் அறிதல் உங்கள் உலாவியின் வெப் ஸ்பீச் ஏபிஐ மூலம் இயங்குகிறது (உலாவி வழங்குநரின் சேவையைப் பயன்படுத்தலாம்). SevAIQ-ல் ஆடியோ பதிவு எதுவும் சேமிக்கப்படுவதில்லை. நீங்கள் சரிபார்த்து உறுதிசெய்த உரை மட்டுமே Google Gemini (தற்போதைய மூன்றாம் தரப்பு AI வழங்குநர்)-க்கு செயலாக்கத்திற்காக அனுப்பப்படும்.',
    };
  }

  if (language === 'hi') {
    return {
      badge: 'ब्राउज़र वेब स्पीच एपीआई · समीक्षा और पुष्टि के बाद ही टेक्स्ट Gemini को भेजा जाता है',
      detailed:
        'ध्वनि पहचान आपके ब्राउज़र के वेब स्पीच एपीआई का उपयोग करती है (जो वेंडर क्लाउड सेवाओं का उपयोग कर सकती है)। SevAIQ किसी भी ऑडियो को रिकॉर्ड या संग्रहीत नहीं करता है। केवल आपके द्वारा सत्यापित टेक्स्ट प्रोसेसिंग के लिए Google Gemini (वर्तमान तृतीय-पक्ष AI प्रदाता) को भेजा जाता है।',
    };
  }

  return {
    badge: 'Browser Web Speech API · Transcripts sent to Gemini only upon your review & confirmation',
    detailed:
      "Speech recognition uses your browser's Web Speech API (which may process audio via browser vendor cloud services). SevAIQ does not record or store any audio. Only the text transcript you review and confirm is sent to Google Gemini, the currently configured third-party AI provider, for processing.",
  };
}

/**
 * Sanitizes speech transcript text by collapsing duplicate whitespace and trimming.
 */
export function sanitizeTranscript(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\s+/g, ' ').trim();
}

/**
 * Checks whether a transcript contains non-empty, actionable text.
 */
export function isValidTranscript(text: string): boolean {
  return sanitizeTranscript(text).length > 0;
}
