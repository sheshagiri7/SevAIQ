import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SchemeBannerCarousel } from '../components/SchemeBannerCarousel';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage } from '../utils/kioskStorage';

describe('Distinct Moving Image Animations', () => {
  beforeEach(() => {
    (globalThis as any).localStorage = new MemoryStorage();
    if (typeof document === 'undefined') {
      (globalThis as any).document = {
        documentElement: { lang: 'en', style: {}, classList: { add: vi.fn(), remove: vi.fn() } },
        body: { classList: { add: vi.fn(), remove: vi.fn() } },
        getElementById: vi.fn().mockReturnValue({ scrollIntoView: vi.fn() }),
      };
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('verifies 3D moving image icons, mobile mockup, and citizen girl avatar are removed from DOM', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // 3D image icons are removed
    expect(html).not.toContain('animate-cap-float');
    expect(html).not.toContain('animate-icon-graduation');
    expect(html).not.toContain('animate-sprout-pulse');
    expect(html).not.toContain('animate-icon-sprout');
    expect(html).not.toContain('animate-heart-throb');
    expect(html).not.toContain('animate-icon-heart');
    expect(html).not.toContain('animate-coin-spin');
    expect(html).not.toContain('animate-icon-coins');
    expect(html).not.toContain('animate-home-glide');
    expect(html).not.toContain('animate-icon-home');

    // Citizen girl avatar is removed
    expect(html).not.toContain('animate-citizen-sway');
    expect(html).not.toContain('aria-label="Citizen using smartphone illustration"');

    // Paper airplane is removed
    expect(html).not.toContain('animate-airplane-glide');

    // Mobile phone mockups are removed
    expect(html).not.toContain('animate-moving-phone-1');
    expect(html).not.toContain('animate-moving-phone-2');
    expect(html).not.toContain('animate-moving-phone-3');
    expect(html).not.toContain('animate-moving-phone-4');
    expect(html).not.toContain('animate-moving-phone-5');
  });

  it('renders clean text badges, portal services, and category options in place of graphic illustrations', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Action Badges rendered as clean text badges
    expect(html).toContain('animate-badge-float-1');
    expect(html).toContain('animate-badge-float-2');
    expect(html).toContain('Apply For Scholarship');
    expect(html).toContain('My Applications');

    // Official portal services text
    expect(html).toContain('Official Portal Services');
    expect(html).toContain('Know Your Payment Status');
    expect(html).toContain('One Time Registration (OTR)');
    expect(html).toContain('My Profile &amp; Aadhaar Verification');
  });

  it('preserves all scheme texts and portal information across slides', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Verifies primary text content is preserved
    expect(html).toContain('National Scholarship Portal');
    expect(html).toContain('PM-KISAN Samman Nidhi');
    expect(html).toContain('Ayushman Bharat PM-JAY');
    expect(html).toContain('PM SVANidhi Micro-Credit');
    expect(html).toContain('Pradhan Mantri Awas Yojana');
  });

  it('index.css declares all distinct keyframe animations for moving images', async () => {
    // @ts-ignore
    const fs = await import('fs');
    // @ts-ignore
    const path = await import('path');
    const cwd = (globalThis as any).process?.cwd?.() || '.';
    const cssPath = path.resolve(cwd, 'src/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Verify 3D image keyframes
    expect(cssContent).toContain('@keyframes cap-float');
    expect(cssContent).toContain('@keyframes sprout-sway');
    expect(cssContent).toContain('@keyframes heart-pulse-float');
    expect(cssContent).toContain('@keyframes coin-flip-float');
    expect(cssContent).toContain('@keyframes home-glide');

    // Verify illustration & element keyframes
    expect(cssContent).toContain('@keyframes airplane-glide');
    expect(cssContent).toContain('@keyframes citizen-sway');
    expect(cssContent).toContain('@keyframes moving-phone-1');
    expect(cssContent).toContain('@keyframes moving-phone-2');
    expect(cssContent).toContain('@keyframes moving-phone-3');
    expect(cssContent).toContain('@keyframes moving-phone-4');
    expect(cssContent).toContain('@keyframes moving-phone-5');
    expect(cssContent).toContain('@keyframes badge-float-1');
    expect(cssContent).toContain('@keyframes badge-float-2');
  });
});
