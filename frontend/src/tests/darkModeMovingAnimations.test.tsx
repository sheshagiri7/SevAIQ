import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Header } from '../components/Header';
import { AccessibilityDrawer } from '../components/AccessibilityDrawer';
import { SchemeBannerCarousel } from '../components/SchemeBannerCarousel';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage } from '../utils/kioskStorage';

describe('Dark Mode Removal & Moving Animation Images Exemption', () => {
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

  it('verifies dark mode option is completely removed from Header', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <Header
            activeTab="dashboard"
            onSelectTab={vi.fn()}
            eligibleCount={0}
            isKioskMode={false}
            onToggleKioskMode={vi.fn()}
            onClearSession={vi.fn()}
          />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Dark mode / High contrast theme toggle button is removed from header
    expect(html).not.toContain('Switch to high contrast dark theme');
    expect(html).not.toContain('High Contrast Theme (Dark)');
    expect(html).not.toContain('Standard Theme');
    expect(html).not.toContain('dark-mode-toggle');
    expect(html).not.toContain('Switch to dark mode');
    expect(html).not.toContain('Dark Mode');
    expect(html).not.toContain('Switch to standard light theme');
  });

  it('verifies dark mode option is completely removed from AccessibilityDrawer', () => {
    localStorage.setItem('SEVAIQ_A11Y_OPEN', 'true');
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <AccessibilityDrawer />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Invert colors / dark mode button is removed from drawer
    expect(html).not.toContain('Invert Colors');
    expect(html).not.toContain('வண்ணங்களை மாற்று');
    expect(html).not.toContain('रंग उलटें');
  });

  it('renders SchemeBannerCarousel with dark mode exempt classes and data attributes', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Verifies the carousel banner container is exempt from dark mode inversion
    expect(html).toContain('moving-animation-exempt');
    expect(html).toContain('scheme-banner-carousel');
    expect(html).toContain('data-dark-exempt="true"');
    expect(html).toContain('data-moving-animation="true"');
  });

  it('verifies mobile mockup, citizen girl avatar, and moving image illustrations are removed while preserving text', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Citizen mobile user graphic is removed
    expect(html).not.toContain('aria-label="Citizen using smartphone illustration"');

    // 3D Floating Graduation Cap is removed
    expect(html).not.toContain('3D Floating Graduation Cap');

    // Origami Paper Airplane is removed
    expect(html).not.toContain('animate-airplane-glide');

    // Mobile mockup is removed
    expect(html).not.toContain('animate-moving-phone-1');

    // QR Code graphic removed
    expect(html).not.toContain('aria-label="Scheme QR Code"');
    expect(html).not.toContain('Scan the');

    // Scheme texts are preserved
    expect(html).toContain('National Scholarship Portal');
    expect(html).toContain('Apply For Scholarship');
    expect(html).toContain('Official Portal Services');
  });

  it('index.css specifies dark mode re-inversion rules for moving animation images and carousel', async () => {
    // @ts-ignore
    const fs = await import('fs');
    // @ts-ignore
    const path = await import('path');
    const cwd = (globalThis as any).process?.cwd?.() || '.';
    const cssPath = path.resolve(cwd, 'src/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Verify dark mode base rule
    expect(cssContent).toContain('html.a11y-invert');

    // Verify re-inversion rules for moving animations, carousel, and graphics
    expect(cssContent).toContain('html.a11y-invert .moving-animation-exempt');
    expect(cssContent).toContain('html.a11y-invert .scheme-banner-carousel');
    expect(cssContent).toContain('html.a11y-invert .moving-animation-image');
    expect(cssContent).toContain('html.a11y-invert [data-dark-exempt="true"]');
    expect(cssContent).toContain('html.a11y-invert [data-moving-animation="true"]');
  });
});
