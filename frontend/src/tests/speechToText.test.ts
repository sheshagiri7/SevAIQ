import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSpeechLocale,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  classifySpeechError,
  getSpeechPrivacyNotice,
  sanitizeTranscript,
  isValidTranscript,
} from '../utils/speechUtils';

describe('Speech-to-Text (STT) and Voice Integration Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('BCP 47 Language Locales', () => {
    it('maps Tamil to ta-IN', () => {
      expect(getSpeechLocale('ta')).toBe('ta-IN');
    });

    it('maps English to en-IN', () => {
      expect(getSpeechLocale('en')).toBe('en-IN');
    });
  });

  describe('Browser Speech Capability Detection', () => {
    it('detects when SpeechRecognition is available', () => {
      const target = typeof window !== 'undefined' ? window : globalThis;
      const origSpeech = (target as any).SpeechRecognition;
      (target as any).SpeechRecognition = class MockSpeechRecognition {};
      expect(isSpeechRecognitionSupported()).toBe(true);
      if (origSpeech) {
        (target as any).SpeechRecognition = origSpeech;
      } else {
        delete (target as any).SpeechRecognition;
      }
    });

    it('detects when webkitSpeechRecognition is available', () => {
      const target = typeof window !== 'undefined' ? window : globalThis;
      const origSpeech = (target as any).SpeechRecognition;
      const origWebkit = (target as any).webkitSpeechRecognition;
      delete (target as any).SpeechRecognition;
      (target as any).webkitSpeechRecognition = class MockWebkitSpeechRecognition {};

      expect(isSpeechRecognitionSupported()).toBe(true);

      if (origSpeech) (target as any).SpeechRecognition = origSpeech;
      if (origWebkit) {
        (target as any).webkitSpeechRecognition = origWebkit;
      } else {
        delete (target as any).webkitSpeechRecognition;
      }
    });

    it('handles unsupported browsers (e.g., standard Firefox)', () => {
      const target = typeof window !== 'undefined' ? window : globalThis;
      const origSpeech = (target as any).SpeechRecognition;
      const origWebkit = (target as any).webkitSpeechRecognition;
      delete (target as any).SpeechRecognition;
      delete (target as any).webkitSpeechRecognition;
      delete (globalThis as any).SpeechRecognition;
      delete (globalThis as any).webkitSpeechRecognition;

      expect(isSpeechRecognitionSupported()).toBe(false);

      if (origSpeech) (target as any).SpeechRecognition = origSpeech;
      if (origWebkit) (target as any).webkitSpeechRecognition = origWebkit;
    });

    it('detects when SpeechSynthesis is available', () => {
      const target = typeof window !== 'undefined' ? window : globalThis;
      const origSynthesis = (target as any).speechSynthesis;
      (target as any).speechSynthesis = { speak: vi.fn(), cancel: vi.fn() };
      expect(isSpeechSynthesisSupported()).toBe(true);
      if (origSynthesis) {
        (target as any).speechSynthesis = origSynthesis;
      } else {
        delete (target as any).speechSynthesis;
      }
    });
  });

  describe('Recognition Error Classification', () => {
    it('classifies not-allowed as permission_denied with localized instructions', () => {
      const errEn = classifySpeechError('not-allowed', 'en');
      expect(errEn.type).toBe('permission_denied');
      expect(errEn.message).toContain('Microphone permission was denied');
      expect(errEn.isRetryable).toBe(true);

      const errTa = classifySpeechError('not-allowed', 'ta');
      expect(errTa.type).toBe('permission_denied');
      expect(errTa.message).toContain('மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது');
      expect(errTa.isRetryable).toBe(true);
    });

    it('classifies service-not-allowed as permission_denied', () => {
      const err = classifySpeechError('service-not-allowed', 'en');
      expect(err.type).toBe('permission_denied');
    });

    it('classifies no-speech error with gentle speaking prompt', () => {
      const errEn = classifySpeechError('no-speech', 'en');
      expect(errEn.type).toBe('no_speech');
      expect(errEn.message).toContain('No speech was detected');

      const errTa = classifySpeechError('no-speech', 'ta');
      expect(errTa.type).toBe('no_speech');
      expect(errTa.message).toContain('குரல் எதுவும் கேட்கவில்லை');
    });

    it('classifies network errors without obscuring text input', () => {
      const err = classifySpeechError('network', 'en');
      expect(err.type).toBe('network');
      expect(err.message).toContain('Manual text input remains available');
    });

    it('classifies audio-capture errors', () => {
      const err = classifySpeechError('audio-capture', 'en');
      expect(err.type).toBe('audio_capture');
      expect(err.message).toContain('No microphone was detected');
    });

    it('classifies unknown errors gracefully', () => {
      const err = classifySpeechError('bad-grammar', 'en');
      expect(err.type).toBe('unknown');
      expect(err.isRetryable).toBe(true);
    });
  });

  describe('Truthful Privacy Disclosures', () => {
    it('discloses browser Web Speech API remote cloud processing honestly', () => {
      const noticeEn = getSpeechPrivacyNotice('en');
      expect(noticeEn.badge).toContain('Transcripts sent to Gemini only upon your review & confirmation');
      expect(noticeEn.detailed).toContain('browser vendor cloud services');
      expect(noticeEn.detailed).toContain('SevAIQ does not record or store any audio');
      // Must NOT falsely claim 100% on-device local speech recognition
      expect(noticeEn.badge).not.toContain('100% on-device');
      expect(noticeEn.detailed).not.toContain('100% on-device');
    });

    it('provides truthful Tamil privacy notice', () => {
      const noticeTa = getSpeechPrivacyNotice('ta');
      expect(noticeTa.badge).toContain('உங்கள் சரிபார்ப்பிற்கு பிறகே உரை Gemini-க்கு அனுப்பப்படும்');
      expect(noticeTa.detailed).toContain('ஆடியோ பதிவு எதுவும் சேமிக்கப்படுவதில்லை');
    });
  });

  describe('Transcript Sanitization and Validation', () => {
    it('sanitizes extra whitespace from speech events', () => {
      expect(sanitizeTranscript('  விவசாயி   கடன்  திட்டம்  ')).toBe('விவசாயி கடன் திட்டம்');
      expect(sanitizeTranscript('   housing   grant   pmay   ')).toBe('housing grant pmay');
    });

    it('correctly validates whether transcript contains actionable words', () => {
      expect(isValidTranscript('')).toBe(false);
      expect(isValidTranscript('   ')).toBe(false);
      expect(isValidTranscript('pm kisan eligibility')).toBe(true);
      expect(isValidTranscript('மருத்துவ காப்பீடு')).toBe(true);
    });
  });
});
