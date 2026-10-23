import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Header } from '../components/Header';
import { SchemeBannerCarousel } from '../components/SchemeBannerCarousel';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { ThemeProvider, useTheme, THEME_STORAGE_KEY } from '../context/ThemeContext';
import { MemoryStorage } from '../utils/kioskStorage';

describe('Professional Light / Dark Mode & Moving Animation Images Exemption', () => {
  let mockClassList: { add: any; remove: any; contains: any };

  beforeEach(() => {
    (globalThis as any).localStorage = new MemoryStorage();
    mockClassList = {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn().mockReturnValue(false),
    };

    (globalThis as any).document = {
      documentElement: {
        lang: 'en',
        style: {},
        classList: mockClassList,
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
      },
      body: { classList: { add: vi.fn(), remove: vi.fn() } },
      getElementById: vi.fn().mockReturnValue({ scrollIntoView: vi.fn() }),
    };

    (globalThis as any).window = {
      matchMedia: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('verifies dark mode toggle is available in Header with accessible controls and localized labels', () => {
    // English rendering
    const enHtml = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <ThemeProvider>
            <Header
              activeTab="dashboard"
              onSelectTab={vi.fn()}
              eligibleCount={0}
              isKioskMode={false}
              onToggleKioskMode={vi.fn()}
              onClearSession={vi.fn()}
            />
          </ThemeProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // English Light Mode state should offer switch to dark theme
    expect(enHtml).toContain('Switch to dark theme');
    expect(enHtml).toContain('Dark Mode');
  });

  it('verifies dark mode toggle provides Tamil and Hindi localization in Header', () => {
    // Tamil localized Header
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'ta');
    const taHtml = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <ThemeProvider>
            <Header
              activeTab="dashboard"
              onSelectTab={vi.fn()}
              eligibleCount={0}
              isKioskMode={false}
              onToggleKioskMode={vi.fn()}
              onClearSession={vi.fn()}
            />
          </ThemeProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    );

    expect(taHtml).toContain('இருண்ட பயன்முறை');
    expect(taHtml).toContain('இருண்ட பயன்முறைக்கு மாறவும்');

    // Hindi localized Header
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'hi');
    const hiHtml = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <ThemeProvider>
            <Header
              activeTab="dashboard"
              onSelectTab={vi.fn()}
              eligibleCount={0}
              isKioskMode={false}
              onToggleKioskMode={vi.fn()}
              onClearSession={vi.fn()}
            />
          </ThemeProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    );

    expect(hiHtml).toContain('डार्क मोड');
    expect(hiHtml).toContain('डार्क थीम पर स्विच करें');
  });

  it('verifies ThemeContext persists dark theme in localStorage and applies dark class', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const TestThemeConsumer: React.FC = () => {
      const { theme, isDark } = useTheme();
      return (
        <div data-testid="theme-status">
          {`${theme}:${isDark}`}
        </div>
      );
    };

    const html = renderToString(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    expect(html).toContain('dark:true');
    expect(mockClassList.add).toHaveBeenCalledWith('dark');
  });

  it('verifies ThemeContext detects system preference when no localStorage entry exists', () => {
    // Simulate OS dark mode preference
    (globalThis as any).window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-color-scheme: dark'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const TestConsumer: React.FC = () => {
      const { isDark } = useTheme();
      return <div>{`system-dark:${isDark}`}</div>;
    };

    const html = renderToString(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(html).toContain('system-dark:true');
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

    // Verify professional navy and blue theme rules
    expect(cssContent).toContain('SevAIQ Professional Navy & Blue Dark Theme');
    expect(cssContent).toContain('html.dark body');
  });
});
