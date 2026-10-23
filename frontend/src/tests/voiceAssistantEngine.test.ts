import { describe, it, expect } from 'vitest';
import { processCitizenQuery, SAMPLE_PROMPTS } from '../utils/voiceAssistantEngine';
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
});
