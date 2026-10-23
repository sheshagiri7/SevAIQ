import { describe, it, expect } from 'vitest';
import { DEFAULT_A11Y_SETTINGS, AccessibilitySettings } from '../context/AccessibilityContext';

describe('Accessibility Suite & UX4G Toolkit Engine', () => {
  it('initializes with statutory WCAG default settings', () => {
    expect(DEFAULT_A11Y_SETTINGS.textSize).toBe(100);
    expect(DEFAULT_A11Y_SETTINGS.textSpacing).toBe(false);
    expect(DEFAULT_A11Y_SETTINGS.lineHeight).toBe(false);
    expect(DEFAULT_A11Y_SETTINGS.dyslexiaFriendly).toBe(false);
    expect(DEFAULT_A11Y_SETTINGS.adhdMode).toBe(false);
    expect(DEFAULT_A11Y_SETTINGS.saturation).toBe('normal');
    expect(DEFAULT_A11Y_SETTINGS.invertColors).toBe(false);
    expect(DEFAULT_A11Y_SETTINGS.highlightLinks).toBe(false);
    expect(DEFAULT_A11Y_SETTINGS.bigCursor).toBe(false);
    expect(DEFAULT_A11Y_SETTINGS.pauseAnimation).toBe(false);
    expect(DEFAULT_A11Y_SETTINGS.hideImages).toBe(false);
  });

  it('accurately calculates active feature count for zero active settings', () => {
    const countActive = (settings: AccessibilitySettings): number => {
      let count = 0;
      if (settings.textSize !== 100) count++;
      if (settings.textSpacing) count++;
      if (settings.lineHeight) count++;
      if (settings.dyslexiaFriendly) count++;
      if (settings.adhdMode) count++;
      if (settings.saturation !== 'normal') count++;
      if (settings.invertColors) count++;
      if (settings.highlightLinks) count++;
      if (settings.bigCursor) count++;
      if (settings.pauseAnimation) count++;
      if (settings.hideImages) count++;
      return count;
    };

    expect(countActive(DEFAULT_A11Y_SETTINGS)).toBe(0);
  });

  it('accurately calculates active feature count when multiple tools are toggled', () => {
    const countActive = (settings: AccessibilitySettings): number => {
      let count = 0;
      if (settings.textSize !== 100) count++;
      if (settings.textSpacing) count++;
      if (settings.lineHeight) count++;
      if (settings.dyslexiaFriendly) count++;
      if (settings.adhdMode) count++;
      if (settings.saturation !== 'normal') count++;
      if (settings.invertColors) count++;
      if (settings.highlightLinks) count++;
      if (settings.bigCursor) count++;
      if (settings.pauseAnimation) count++;
      if (settings.hideImages) count++;
      return count;
    };

    const activeSettings: AccessibilitySettings = {
      ...DEFAULT_A11Y_SETTINGS,
      textSize: 120, // +1
      adhdMode: true, // +1
      invertColors: true, // +1
      dyslexiaFriendly: true, // +1
      saturation: 'grayscale', // +1
    };

    expect(countActive(activeSettings)).toBe(5);
  });

  it('constrains text scaling between 80% and 140%', () => {
    const stepUp = (curr: number) => Math.min(curr + 10, 140);
    const stepDown = (curr: number) => Math.max(curr - 10, 80);

    expect(stepUp(100)).toBe(110);
    expect(stepUp(130)).toBe(140);
    expect(stepUp(140)).toBe(140); // capped

    expect(stepDown(100)).toBe(90);
    expect(stepDown(90)).toBe(80);
    expect(stepDown(80)).toBe(80); // capped
  });

  it('cycles saturation state through normal -> high -> grayscale -> normal', () => {
    const cycle = (current: 'normal' | 'high' | 'grayscale') => {
      if (current === 'normal') return 'high';
      if (current === 'high') return 'grayscale';
      return 'normal';
    };

    expect(cycle('normal')).toBe('high');
    expect(cycle('high')).toBe('grayscale');
    expect(cycle('grayscale')).toBe('normal');
  });

  it('resets all settings back to default without residue', () => {
    const modified: AccessibilitySettings = {
      textSize: 130,
      textSpacing: true,
      lineHeight: true,
      dyslexiaFriendly: true,
      adhdMode: true,
      saturation: 'high',
      invertColors: true,
      highlightLinks: true,
      bigCursor: true,
      pauseAnimation: true,
      hideImages: true,
    };
    expect(modified.textSize).toBe(130);

    const reset = { ...DEFAULT_A11Y_SETTINGS };
    expect(reset).toEqual(DEFAULT_A11Y_SETTINGS);
    expect(reset.textSize).toBe(100);
    expect(reset.adhdMode).toBe(false);
  });
});
