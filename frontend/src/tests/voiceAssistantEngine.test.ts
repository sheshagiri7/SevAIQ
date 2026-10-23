import { describe, it, expect } from 'vitest';
import {
  processCitizenQuery,
  SAMPLE_PROMPTS,
  prepareSpeechText,
  getBestVoice,
  VoiceCandidate,
} from '../utils/voiceAssistantEngine';
import { Scheme } from '../types';

describe('Voice Assistant Engine Suite', () => {
  const sampleSchemes: Scheme[] = [
    {
      id: 'pm-kisan',
      title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
      short_description: 'Income support of ₹6,000 per year directly to farmer families.',
      category: 'Agriculture & Rural',
      ministry: 'Ministry of Agriculture and Farmers Welfare',
      verified: true,
    },
    {
      id: 'pm-jay',
      title: 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)',
      short_description: 'Health insurance cover of ₹5,00,000 per family per year.',
      category: 'Healthcare & Wellness',
      ministry: 'Ministry of Health and Family Welfare',
      verified: true,
    },
    {
      id: 'pmay-g',
      title: 'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)',
      short_description: 'Financial grant for building a permanent pucca house in rural areas.',
      category: 'Housing & Infrastructure',
      ministry: 'Ministry of Rural Development',
      verified: true,
    },
    {
      id: 'atal-pension-yojana',
      title: 'Atal Pension Yojana (APY)',
      short_description: 'Guaranteed monthly pension of ₹1,000 to ₹5,000 starting at age 60.',
      category: 'Social Security & Pensions',
      ministry: 'Ministry of Finance',
      verified: true,
    },
  ];

  it('answers farmer queries in Tamil with verified PM-KISAN guidance', () => {
    const answer = processCitizenQuery('விவசாயிகளுக்கு என்ன திட்டம் இருக்கிறது?', 'ta', sampleSchemes);
    expect(answer.text).toContain('PM-KISAN');
    expect(answer.text).toContain('₹6,000');
    expect(answer.matchedSchemes.some((s) => s.id === 'pm-kisan')).toBe(true);
    expect(answer.suggestedAction?.tab).toBe('eligibility');
  });

  it('answers farmer queries in English with verified PM-KISAN guidance', () => {
    const answer = processCitizenQuery('What schemes support farmers?', 'en', sampleSchemes);
    expect(answer.text).toContain('PM-KISAN');
    expect(answer.text).toContain('₹6,000');
    expect(answer.matchedSchemes.some((s) => s.id === 'pm-kisan')).toBe(true);
  });

  it('answers healthcare queries in Tamil and English', () => {
    const ansTa = processCitizenQuery('மருத்துவ காப்பீடு எப்படி பெறுவது?', 'ta', sampleSchemes);
    expect(ansTa.text).toContain('ஆயுஷ்மான் பாரத்');
    expect(ansTa.text).toContain('₹5,00,000');

    const ansEn = processCitizenQuery('How to get health insurance coverage?', 'en', sampleSchemes);
    expect(ansEn.text).toContain('Ayushman Bharat');
    expect(ansEn.text).toContain('₹5 Lakh');
  });

  it('answers housing queries with PMAY details', () => {
    const ans = processCitizenQuery('வீடு கட்ட உதவி கிடைக்குமா?', 'ta', sampleSchemes);
    expect(ans.text).toContain('PMAY-G');
    expect(ans.text).toContain('பக்கா வீடு');
  });

  it('provides truthful fallback response for unmatched query', () => {
    const ans = processCitizenQuery('random unknown query xyz', 'en', sampleSchemes);
    expect(ans.text).toContain('SevAIQ verified');
    expect(ans.suggestedAction?.tab).toBe('discover');
  });

  it('has sample prompts available in both Tamil and English', () => {
    expect(SAMPLE_PROMPTS.ta.length).toBeGreaterThanOrEqual(4);
    expect(SAMPLE_PROMPTS.en.length).toBeGreaterThanOrEqual(4);
  });

  describe('Speech Synthesis Preparation (Tamil & English)', () => {
    it('normalizes Tamil currency amounts to natural spoken numbers', () => {
      const input = 'விவசாயிகளுக்கு ₹6,000 மற்றும் தவணையாக ₹2,000 வழங்கப்படுகிறது. சிகிச்சை ₹5,00,000 வரை.';
      const output = prepareSpeechText(input, 'ta');
      expect(output).toContain('ஆறாயிரம் ரூபாய்');
      expect(output).toContain('இரண்டாயிரம் ரூபாய்');
      expect(output).toContain('ஐந்து லட்சம் ரூபாய்');
      expect(output).not.toContain('₹');
    });

    it('expands English acronyms to Tamil phonetic syllables', () => {
      const input = 'PM-KISAN திட்டத்தில் RoR மற்றும் DBT மூலம் CSC மையத்தில் விண்ணப்பிக்கவும்.';
      const output = prepareSpeechText(input, 'ta');
      expect(output).toContain('பி எம் கிசான்');
      expect(output).toContain('பட்டா சிட்டா');
      expect(output).toContain('நேரடி வங்கி பரிமாற்றம்');
      expect(output).toContain('பொது சேவை மையம்');
    });

    it('replaces official URLs and parentheticals with natural spoken Tamil', () => {
      const input = 'விவரங்களை pmkisan.gov.in (Check Eligibility) பக்கத்தில் பார்க்கவும்.';
      const output = prepareSpeechText(input, 'ta');
      expect(output).toContain('பி எம் கிசான் இணையதளம்');
      expect(output).not.toContain('(Check Eligibility)');
      expect(output).not.toContain('pmkisan.gov.in');
    });

    it('normalizes platform name SevAIQ to சேவை ஐ க்யூ for natural Tamil TTS', () => {
      const input = 'நான் SevAIQ குரல் உதவியாளர்.';
      const output = prepareSpeechText(input, 'ta');
      expect(output).toContain('சேவை ஐ க்யூ');
    });

    it('cleans up English currency and percentages', () => {
      const input = 'Annual support of ₹6,000 with 7% interest subsidy.';
      const output = prepareSpeechText(input, 'en');
      expect(output).toContain('6,000 Rupees');
      expect(output).toContain('7 percent');
      expect(output).not.toContain('₹');
    });
  });

  describe('Voice Discovery Engine (getBestVoice)', () => {
    const mockVoices: VoiceCandidate[] = [
      { name: 'Samantha', lang: 'en-US' },
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Google UK English Female', lang: 'en-GB' },
      { name: 'Rishi', lang: 'en-IN' },
      { name: 'Vani', lang: 'ta-IN' },
      { name: 'Google தமிழ்', lang: 'ta-IN' },
    ];

    it('selects preferred Tamil voice (Google தமிழ் or Vani) when available', () => {
      const selected = getBestVoice(mockVoices, 'ta');
      expect(selected).toBeDefined();
      expect(selected?.lang).toBe('ta-IN');
      expect(['Vani', 'Google தமிழ்'].includes(selected?.name || '')).toBe(true);
    });

    it('returns null if no Tamil voice exists in voice list', () => {
      const englishOnlyVoices: VoiceCandidate[] = [
        { name: 'Samantha', lang: 'en-US' },
        { name: 'Alex', lang: 'en-US' },
      ];
      const selected = getBestVoice(englishOnlyVoices, 'ta');
      expect(selected).toBeNull();
    });

    it('selects Indian English voice when available for English language', () => {
      const selected = getBestVoice(mockVoices, 'en');
      expect(selected).toBeDefined();
      expect(selected?.name).toBe('Rishi');
      expect(selected?.lang).toBe('en-IN');
    });

    it('handles empty voice lists gracefully', () => {
      expect(getBestVoice([], 'ta')).toBeNull();
      expect(getBestVoice([], 'en')).toBeNull();
    });
  });
});
