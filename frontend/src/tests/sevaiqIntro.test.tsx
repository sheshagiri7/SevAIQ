import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from '../App';
import {
  SevAIQIntro,
  hasSeenIntro,
  markIntroSeen,
  resetIntroSeen,
  SEVAIQ_INTRO_SEEN_KEY,
} from '../components/SevAIQIntro';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage } from '../utils/kioskStorage';

describe('SevAIQ Cinematic Website Intro Suite', () => {
  beforeEach(() => {
    (globalThis as any).localStorage = new MemoryStorage();
    (globalThis as any).sessionStorage = new MemoryStorage();
    if (typeof document === 'undefined') {
      (globalThis as any).document = {
        documentElement: { lang: 'en', style: {} },
        body: { classList: { add: vi.fn(), remove: vi.fn() } },
        getElementById: vi.fn(),
      };
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Session Storage & Lifecycle Utilities', () => {
    it('correctly reports intro seen status when sessionStorage is empty', () => {
      expect(hasSeenIntro()).toBe(false);
    });

    it('sets session flag when markIntroSeen is called', () => {
      markIntroSeen();
      expect(sessionStorage.getItem(SEVAIQ_INTRO_SEEN_KEY)).toBe('true');
      expect(hasSeenIntro()).toBe(true);
    });

    it('removes session flag when resetIntroSeen is called to allow replay', () => {
      markIntroSeen();
      expect(hasSeenIntro()).toBe(true);
      resetIntroSeen();
      expect(sessionStorage.getItem(SEVAIQ_INTRO_SEEN_KEY)).toBeNull();
      expect(hasSeenIntro()).toBe(false);
    });

    it('safely handles missing window or sessionStorage without throwing', () => {
      const originalSessionStorage = (globalThis as any).sessionStorage;
      try {
        delete (globalThis as any).sessionStorage;
        expect(() => hasSeenIntro()).not.toThrow();
        expect(hasSeenIntro()).toBe(false);
        expect(() => markIntroSeen()).not.toThrow();
        expect(() => resetIntroSeen()).not.toThrow();
      } finally {
        (globalThis as any).sessionStorage = originalSessionStorage;
      }
    });
  });

  describe('SevAIQIntro Component Rendering & Accessibility', () => {
    it('renders the cinematic dialog overlay with full accessibility attributes', () => {
      const onComplete = vi.fn();
      const html = renderToString(<SevAIQIntro onComplete={onComplete} />);

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-label="SevAIQ Website Introduction"');
    });

    it('renders the Skip Intro button with proper ARIA label and keyboard accessibility', () => {
      const onComplete = vi.fn();
      const html = renderToString(<SevAIQIntro onComplete={onComplete} />);

      expect(html).toContain('Skip Intro');
      expect(html).toContain('aria-label="Skip Introduction"');
      expect(html).toContain('focus:ring-teal-400');
    });

    it('renders the custom SVG emblem representing AI, voice accessibility, and citizen service', () => {
      const onComplete = vi.fn();
      const html = renderToString(<SevAIQIntro onComplete={onComplete} />);

      expect(html).toContain('role="img"');
      expect(html).toContain('aria-label="SevAIQ AI and Citizen Service Emblem"');
      expect(html).toContain('viewBox="0 0 240 240"');
      // Contains the soft glow filter and linear gradients
      expect(html).toContain('id="sevaiq-soft-glow"');
      expect(html).toContain('id="sevaiq-grad-teal"');
      expect(html).toContain('id="sevaiq-grad-blue"');
      expect(html).toContain('id="sevaiq-grad-saffron"');
      // Contains the protective civic base and apex beacon
      expect(html).toContain('fill="url(#sevaiq-grad-saffron)"');
    });

    it('renders the exact wordmark SevAIQ with glowing gradient AI and saffron accent', () => {
      const onComplete = vi.fn();
      const html = renderToString(<SevAIQIntro onComplete={onComplete} />);

      expect(html).toContain('Sev');
      expect(html).toContain('AI');
      expect(html).toContain('Q');
      expect(html).toContain('from-[#20C9B7]');
      expect(html).toContain('bg-[#FF9F2F]');
    });

    it('renders the official tagline INTELLIGENCE THAT SERVES in bold tracking', () => {
      const onComplete = vi.fn();
      const html = renderToString(<SevAIQIntro onComplete={onComplete} />);

      expect(html).toContain('INTELLIGENCE THAT SERVES');
      expect(html).toContain('Citizen Welfare Discovery');
      expect(html).toContain('அரசு நலத்திட்ட வழிகாட்டி');
    });

    it('renders ambient micro-particles and subtle circuit grid overlay', () => {
      const onComplete = vi.fn();
      const html = renderToString(<SevAIQIntro onComplete={onComplete} />);

      expect(html).toContain('animate-sevaiq-particle');
      expect(html).toContain('background-size:48px 48px');
    });
  });

  describe('Integration with App Shell', () => {
    it('renders SevAIQIntro on initial visit when sessionStorage is not set', () => {
      sessionStorage.clear();

      const tree = (
        <LanguageProvider>
          <AccessibilityProvider>
            <App />
          </AccessibilityProvider>
        </LanguageProvider>
      );

      const html = renderToString(tree);
      expect(html).toContain('SevAIQ Website Introduction');
      expect(html).toContain('Skip Intro');
      expect(html).toContain('INTELLIGENCE THAT SERVES');
    });

    it('does NOT render SevAIQIntro if already seen in current session', () => {
      sessionStorage.setItem(SEVAIQ_INTRO_SEEN_KEY, 'true');

      const tree = (
        <LanguageProvider>
          <AccessibilityProvider>
            <App />
          </AccessibilityProvider>
        </LanguageProvider>
      );

      const html = renderToString(tree);
      expect(html).not.toContain('SevAIQ Website Introduction');
      expect(html).not.toContain('Skip Intro');
      // The rest of the page remains intact
      expect(html).toContain('SevAIQ');
      expect(html).toContain('Dashboard');
    });

    it('provides replay options in the footer and about modal', () => {
      sessionStorage.setItem(SEVAIQ_INTRO_SEEN_KEY, 'true');

      const tree = (
        <LanguageProvider>
          <AccessibilityProvider>
            <App />
          </AccessibilityProvider>
        </LanguageProvider>
      );

      const html = renderToString(tree);
      expect(html).toContain('Play Intro');
      expect(html).toContain('aria-label="Replay SevAIQ Cinematic Intro"');
    });
  });
});
