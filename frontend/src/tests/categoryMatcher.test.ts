import { describe, it, expect } from 'vitest';
import { matchesCategory, CATEGORY_OPTIONS } from '../utils/categoryMatcher';

describe('Category Normalization and Filter Matcher', () => {
  it('should match all schemes when "all" is selected', () => {
    expect(matchesCategory('Agriculture', 'all')).toBe(true);
    expect(matchesCategory('Healthcare & Wellness', 'all')).toBe(true);
    expect(matchesCategory('Unknown Sector', 'all')).toBe(true);
    expect(matchesCategory('', 'all')).toBe(true);
  });

  it('should match "agriculture" against various valid representations', () => {
    expect(matchesCategory('Agriculture', 'agriculture')).toBe(true);
    expect(matchesCategory('Agriculture & Rural', 'agriculture')).toBe(true);
    expect(matchesCategory('Rural Development', 'agriculture')).toBe(true);
    expect(matchesCategory('Healthcare', 'agriculture')).toBe(false);
  });

  it('should match "healthcare" against various valid representations', () => {
    expect(matchesCategory('Healthcare', 'healthcare')).toBe(true);
    expect(matchesCategory('Healthcare & Wellness', 'healthcare')).toBe(true);
    expect(matchesCategory('Health Assurance', 'healthcare')).toBe(true);
    expect(matchesCategory('Education', 'healthcare')).toBe(false);
  });

  it('should match "livelihood" against street vendor and enterprise schemes', () => {
    expect(matchesCategory('Urban Livelihoods & Enterprise', 'livelihood')).toBe(true);
    expect(matchesCategory('Urban Livelihoods', 'livelihood')).toBe(true);
    expect(matchesCategory('Enterprise', 'livelihood')).toBe(true);
    expect(matchesCategory('Housing', 'livelihood')).toBe(false);
  });

  it('should match "education" against scholarships and skilling', () => {
    expect(matchesCategory('Education & Skilling', 'education')).toBe(true);
    expect(matchesCategory('Education', 'education')).toBe(true);
    expect(matchesCategory('Scholarship', 'education')).toBe(true);
    expect(matchesCategory('Agriculture', 'education')).toBe(false);
  });

  it('should match "housing" against housing and infrastructure', () => {
    expect(matchesCategory('Housing & Infrastructure', 'housing')).toBe(true);
    expect(matchesCategory('Housing', 'housing')).toBe(true);
    expect(matchesCategory('PMAY Housing', 'housing')).toBe(true);
    expect(matchesCategory('Healthcare', 'housing')).toBe(false);
  });

  it('should handle case insensitivity and extra whitespace gracefully', () => {
    expect(matchesCategory('  agriculture & rural  ', 'agriculture')).toBe(true);
    expect(matchesCategory('AGRICULTURE', 'agriculture')).toBe(true);
  });

  it('should have all expected sector options defined', () => {
    const ids = CATEGORY_OPTIONS.map((c) => c.id);
    expect(ids).toContain('all');
    expect(ids).toContain('agriculture');
    expect(ids).toContain('healthcare');
    expect(ids).toContain('livelihood');
    expect(ids).toContain('education');
    expect(ids).toContain('housing');
  });
});
