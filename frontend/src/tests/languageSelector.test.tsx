import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  LanguageSelector,
  IndicLanguageEmblem,
  INDIAN_LANGUAGES,
} from '../components/LanguageSelector';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage } from '../utils/kioskStorage';

describe('Official myScheme Language Option & Indic Selector', () => {
  beforeEach(() => {
    (globalThis as any).localStorage = new MemoryStorage();
    if (typeof document === 'undefined') {
      (globalThis as any).document = {
        documentElement: { lang: 'en', style: {} },
        body: { classList: { add: vi.fn(), remove: vi.fn() } },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders IndicLanguageEmblem with official green circle and A / अ glyphs', () => {
    const html = renderToString(<IndicLanguageEmblem />);
    // Contains official Indian green #15803d
    expect(html).toContain('#15803d');
    // Contains Latin 'A'
    expect(html).toContain('>A<');
    // Contains Devanagari 'अ'
    expect(html).toContain('>अ<');
    expect(html).toContain('viewBox="0 0 24 24"');
  });

  it('renders myScheme language trigger button displaying active language and chevron in header', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <LanguageSelector variant="header" />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Contains Indic emblem
    expect(html).toContain('#15803d');
    expect(html).toContain('>A<');
    expect(html).toContain('>अ<');

    // Contains active language label (English by default)
    expect(html).toContain('English');

    // Accessible attributes
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('text-emerald-800');
  });

  it('renders myScheme language trigger for Tamil and Hindi when context changes', () => {
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'ta');

    const htmlTamil = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <LanguageSelector variant="header" />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    expect(htmlTamil).toContain('தமிழ்');

    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'hi');

    const htmlHindi = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <LanguageSelector variant="header" />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    expect(htmlHindi).toContain('हिन्दी');
  });

  it('renders mobile variant with official emblem and language selector trigger', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <LanguageSelector variant="mobile" />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    expect(html).toContain('#15803d');
    expect(html).toContain('English');
    expect(html).toContain('aria-haspopup="listbox"');
  });

  it('supports major official Indian languages in INDIAN_LANGUAGES list', () => {
    const codes = INDIAN_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('hi');
    expect(codes).toContain('ta');
    expect(codes).toContain('te');
    expect(codes).toContain('kn');
    expect(codes).toContain('ml');
    expect(codes).toContain('mr');
    expect(codes).toContain('gu');
    expect(codes).toContain('bn');
    expect(codes).toContain('pa');
    expect(codes).toContain('or');
    expect(codes).toContain('as');

    // English, Tamil, and Hindi are marked as fully localized
    const en = INDIAN_LANGUAGES.find((l) => l.code === 'en')!;
    const ta = INDIAN_LANGUAGES.find((l) => l.code === 'ta')!;
    const hi = INDIAN_LANGUAGES.find((l) => l.code === 'hi')!;

    expect(en.isFullyLocalized).toBe(true);
    expect(ta.isFullyLocalized).toBe(true);
    expect(hi.isFullyLocalized).toBe(true);
  });
});
