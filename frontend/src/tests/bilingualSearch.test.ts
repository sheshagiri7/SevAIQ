import { describe, it, expect } from 'vitest';
import { matchesBilingualQuery, normalizeQuery, BILINGUAL_TOPICS } from '../utils/bilingualSearch';
import { Scheme } from '../types';

describe('Bilingual Search & Intent Matching Suite', () => {
  const sampleScheme: Scheme = {
    id: 'pm-kisan',
    title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    short_description: 'Income support of ₹6,000 per year directly to farmer families.',
    category: 'Agriculture & Rural',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    verified: true,
  };

  const healthScheme: Scheme = {
    id: 'pm-jay',
    title: 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)',
    short_description: 'Health insurance cover of ₹5,00,000 per family per year.',
    category: 'Healthcare & Wellness',
    ministry: 'Ministry of Health and Family Welfare',
    verified: true,
  };

  it('normalizes query strings by trimming and lowercasing', () => {
    expect(normalizeQuery('  KISAN  ')).toBe('kisan');
    expect(normalizeQuery('விவசாயி  ')).toBe('விவசாயி');
  });

  it('matches English title and description keywords', () => {
    expect(matchesBilingualQuery(sampleScheme, 'kisan')).toBe(true);
    expect(matchesBilingualQuery(sampleScheme, 'farmer')).toBe(true);
    expect(matchesBilingualQuery(sampleScheme, 'agriculture')).toBe(true);
    expect(matchesBilingualQuery(sampleScheme, 'hospital')).toBe(false);
  });

  it('matches Tamil queries to relevant agricultural scheme', () => {
    expect(matchesBilingualQuery(sampleScheme, 'விவசாயி')).toBe(true);
    expect(matchesBilingualQuery(sampleScheme, 'பயிர் கடன் உதவி')).toBe(true);
    expect(matchesBilingualQuery(sampleScheme, 'உழவர் நலன்')).toBe(true);
  });

  it('matches Tamil queries to relevant healthcare scheme', () => {
    expect(matchesBilingualQuery(healthScheme, 'மருத்துவம்')).toBe(true);
    expect(matchesBilingualQuery(healthScheme, 'சிகிச்சை')).toBe(true);
    expect(matchesBilingualQuery(healthScheme, 'காப்பீடு')).toBe(true);
    expect(matchesBilingualQuery(healthScheme, 'விவசாயி')).toBe(false);
  });

  it('returns true for empty query strings', () => {
    expect(matchesBilingualQuery(sampleScheme, '')).toBe(true);
    expect(matchesBilingualQuery(sampleScheme, '   ')).toBe(true);
  });

  it('contains expected predefined bilingual topics', () => {
    expect(BILINGUAL_TOPICS.length).toBeGreaterThanOrEqual(5);
    const agTopic = BILINGUAL_TOPICS.find((t) => t.id === 'agriculture');
    expect(agTopic).toBeDefined();
    expect(agTopic?.keywordsTa).toContain('விவசாயி');
  });
});
