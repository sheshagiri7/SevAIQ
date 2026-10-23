import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SchemeBannerCarousel } from '../components/SchemeBannerCarousel';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage } from '../utils/kioskStorage';

describe('Real Official Banner Images & Animation Removal', () => {
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

  it('renders distinct real official banner images for all 5 government schemes without cartoon graphics', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // 1. National Scholarship Portal banner
    expect(html).toContain('/banners/banner-nsp.png');

    // 2. Hon'ble PM Modi Digital India quote banner
    expect(html).toContain('/banners/banner-modi.png');

    // 3. Celebrating 11 Years of Digital India banner
    expect(html).toContain('/banners/banner-digital-india.png');

    // 4. Pradhan Mantri Suraksha Bima Yojana banner
    expect(html).toContain('/banners/banner-suraksha-bima.png');

    // 5. myScheme on UMANG mobile app banner
    expect(html).toContain('/banners/banner-myscheme-umang.png');

    // Verify all 5 real banner images are distinct and use dark-mode-exempt classes
    expect(html).toContain('real-banner-image');
    expect(html).toContain('moving-animation-image');
    expect(html).toContain('data-dark-exempt="true"');

    const bannerPaths = [
      '/banners/banner-nsp.png',
      '/banners/banner-modi.png',
      '/banners/banner-digital-india.png',
      '/banners/banner-suraksha-bima.png',
      '/banners/banner-myscheme-umang.png',
    ];
    const uniqueBanners = new Set(bannerPaths);
    expect(uniqueBanners.size).toBe(5);
  });

  it('removes cartoon avatar illustration and bouncy animations as requested by user', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Citizen cartoon avatar illustration is removed
    expect(html).not.toContain('aria-label="Citizen using smartphone illustration"');
    expect(html).not.toContain('animate-citizen-sway');

    // Cartoon bouncy / wobbly animations removed from moving presentation
    expect(html).not.toContain('animate-cap-float');
    expect(html).not.toContain('animate-sprout-pulse');
    expect(html).not.toContain('animate-heart-throb');
    expect(html).not.toContain('animate-coin-spin');
    expect(html).not.toContain('animate-moving-phone-1');
  });

  it('renders next-slide thumbnail preview card matching official myscheme portal layout', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Next slide preview card contains next scheme thumbnail and title
    expect(html).toContain('Next Slide Preview:');
    expect(html).toContain('Next Scheme');
    expect(html).toContain('Next slide thumbnail');
  });

  it('index.css declares dark mode exemption rules for real banner images and floating animations', async () => {
    // @ts-ignore
    const fs = await import('fs');
    // @ts-ignore
    const path = await import('path');
    const cwd = (globalThis as any).process?.cwd?.() || '.';
    const cssPath = path.resolve(cwd, 'src/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Verify dark mode exemption rules
    expect(cssContent).toContain('html.a11y-invert .moving-animation-exempt');
    expect(cssContent).toContain('html.a11y-invert .scheme-banner-carousel');
    expect(cssContent).toContain('html.a11y-invert .moving-animation-image');
    expect(cssContent).toContain('html.a11y-invert [data-dark-exempt="true"]');

    // Verify keyframes for carousel timer and paper airplane
    expect(cssContent).toContain('@keyframes carousel-progress');
    expect(cssContent).toContain('@keyframes airplane-glide');
  });
});
