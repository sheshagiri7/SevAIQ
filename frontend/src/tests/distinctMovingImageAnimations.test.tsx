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

  it('renders distinct animation classes for each different 3D moving image icon', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // 1. Education: Graduation Cap has academic cap float & tilt
    expect(html).toContain('animate-cap-float');
    expect(html).toContain('animate-icon-graduation');

    // 2. Agriculture: Sprout has organic growth & breeze sway
    expect(html).toContain('animate-sprout-pulse');
    expect(html).toContain('animate-icon-sprout');

    // 3. Healthcare: Heart has rhythmic vital dual heartbeat throb
    expect(html).toContain('animate-heart-throb');
    expect(html).toContain('animate-icon-heart');

    // 4. Finance: Coins has 3D perspective spin and sparkle jingle
    expect(html).toContain('animate-coin-spin');
    expect(html).toContain('animate-icon-coins');

    // 5. Housing: Home has permanent masonry hover glide & foundation stability
    expect(html).toContain('animate-home-glide');
    expect(html).toContain('animate-icon-home');

    // Verify all 5 image animations are mutually distinct
    const animationClasses = [
      'animate-cap-float',
      'animate-sprout-pulse',
      'animate-heart-throb',
      'animate-coin-spin',
      'animate-home-glide',
    ];
    const uniqueAnimations = new Set(animationClasses);
    expect(uniqueAnimations.size).toBe(5);
  });

  it('renders different moving animations for paper airplane, citizen, and action badges', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Origami paper airplane has aerodynamic banking glide
    expect(html).toContain('animate-airplane-glide');

    // Citizen mobile user illustration has natural human breathing sway
    expect(html).toContain('animate-citizen-sway');

    // Action Badges have parallax floating movements
    expect(html).toContain('animate-badge-float-1');
    expect(html).toContain('animate-badge-float-2');
  });

  it('renders distinct slide-specific smartphone mockup floating animations', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Each slide's phone mockup has its own animation profile
    expect(html).toContain('animate-moving-phone-1');
    expect(html).toContain('animate-moving-phone-2');
    expect(html).toContain('animate-moving-phone-3');
    expect(html).toContain('animate-moving-phone-4');
    expect(html).toContain('animate-moving-phone-5');
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
