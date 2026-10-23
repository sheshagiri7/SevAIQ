import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FloatingAccessibilityButton } from '../components/FloatingAccessibilityButton';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage } from '../utils/kioskStorage';

describe('FloatingAccessibilityButton (myScheme style)', () => {
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

  it('renders docked on the left edge with royal purple gradient styling', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <FloatingAccessibilityButton />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Left docked placement
    expect(html).toContain('fixed left-0');
    // Royal purple gradient matching UX4G and myScheme
    expect(html).toContain('from-[#6342E8]');
    expect(html).toContain('to-[#7952F5]');
    // Accessibility aria label
    expect(html).toContain('Accessibility options');
    // myScheme badge
    expect(html).toContain('myScheme');
  });

  it('renders Tamil localized accessibility label when language is Tamil', () => {
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'ta');

    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <FloatingAccessibilityButton />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    expect(html).toContain('அணுகல்தன்மை விருப்பங்கள்');
  });

  it('displays active settings badge count when settings are active', () => {
    // Enable text size modification
    localStorage.setItem(
      'SEVAIQ_A11Y_SETTINGS',
      JSON.stringify({
        textSize: 120,
        textSpacing: true,
        lineHeight: false,
        dyslexiaFriendly: false,
        adhdMode: false,
        saturation: 'normal',
        invertColors: false,
        highlightLinks: false,
        bigCursor: false,
        pauseAnimation: false,
        hideImages: false,
      })
    );

    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <FloatingAccessibilityButton />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Expect badge indicator with count
    expect(html).toContain('active settings');
    expect(html).toContain('2');
  });
});
