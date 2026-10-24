import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { BottomNavigation } from '../components/BottomNavigation';
import { Header } from '../components/Header';
import App from '../App';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage } from '../utils/kioskStorage';

describe('Project-Wide Responsive Navigation Redesign', () => {
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

  describe('BottomNavigation component', () => {
    it('renders the 5 primary mobile destinations with touch-friendly hit areas and safe-area insets', () => {
      const html = renderToString(
        <LanguageProvider>
          <BottomNavigation
            activeTab="chat"
            onSelectTab={() => {}}
            eligibleCount={4}
          />
        </LanguageProvider>
      );

      // Verify container responsiveness and safe area
      expect(html).toContain('md:hidden fixed bottom-0');
      expect(html).toContain('pb-[max(0.375rem,env(safe-area-inset-bottom))]');
      expect(html).toContain('aria-label="Mobile Bottom Navigation"');

      // Verify all 5 primary destinations are present
      expect(html).toContain('Home');
      expect(html).toContain('Chat');
      expect(html).toContain('Schemes');
      expect(html).toContain('Documents');
      expect(html).toContain('Track');

      // Verify badge on eligible schemes
      expect(html).toContain('4');
    });

    it('sets aria-current="page" and active styling on the currently selected tab', () => {
      // 1. Chat active
      const chatHtml = renderToString(
        <LanguageProvider>
          <BottomNavigation activeTab="chat" onSelectTab={() => {}} />
        </LanguageProvider>
      );
      expect(chatHtml).toContain('aria-current="page"');
      expect(chatHtml).toContain('bg-emerald-50/70');

      // 2. Home/Dashboard active
      const homeHtml = renderToString(
        <LanguageProvider>
          <BottomNavigation activeTab="dashboard" onSelectTab={() => {}} />
        </LanguageProvider>
      );
      expect(homeHtml).toContain('aria-label="Home - Dashboard"');
      expect(homeHtml).toContain('aria-current="page"');

      // 3. Discover active
      const discoverHtml = renderToString(
        <LanguageProvider>
          <BottomNavigation activeTab="discover" onSelectTab={() => {}} />
        </LanguageProvider>
      );
      expect(discoverHtml).toContain('aria-label="Schemes - 2. Find Schemes"');
      expect(discoverHtml).toContain('aria-current="page"');

      // 4. Demographic profile also highlights Schemes
      const demoHtml = renderToString(
        <LanguageProvider>
          <BottomNavigation activeTab="demographic-profile" onSelectTab={() => {}} />
        </LanguageProvider>
      );
      expect(demoHtml).toContain('aria-current="page"');

      // 5. Document mapper active
      const docsHtml = renderToString(
        <LanguageProvider>
          <BottomNavigation activeTab="document-mapper" onSelectTab={() => {}} />
        </LanguageProvider>
      );
      expect(docsHtml).toContain('aria-label="Documents - 3. Prepare Documents"');
      expect(docsHtml).toContain('aria-current="page"');

      // 6. Application tracker active
      const trackHtml = renderToString(
        <LanguageProvider>
          <BottomNavigation activeTab="application-tracker" onSelectTab={() => {}} />
        </LanguageProvider>
      );
      expect(trackHtml).toContain('aria-label="Track - 4. Track Application"');
      expect(trackHtml).toContain('aria-current="page"');
    });

    it('provides authentic Tamil labels on mobile bottom navigation', () => {
      localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'ta');

      const html = renderToString(
        <LanguageProvider>
          <BottomNavigation activeTab="dashboard" onSelectTab={() => {}} />
        </LanguageProvider>
      );

      // Tamil 5 destinations
      expect(html).toContain('முகப்பு');
      expect(html).toContain('அரட்டை');
      expect(html).toContain('திட்டங்கள்');
      expect(html).toContain('ஆவணங்கள்');
      expect(html).toContain('கண்காணிப்பு');
    });

    it('provides authentic Hindi labels on mobile bottom navigation', () => {
      localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'hi');

      const html = renderToString(
        <LanguageProvider>
          <BottomNavigation activeTab="dashboard" onSelectTab={() => {}} />
        </LanguageProvider>
      );

      // Hindi 5 destinations
      expect(html).toContain('होम');
      expect(html).toContain('चैट');
      expect(html).toContain('योजनाएं');
      expect(html).toContain('दस्तावेज़');
      expect(html).toContain('ट्रैक');
    });
  });

  describe('Header responsive architecture', () => {
    it('uses md:flex for tablet/desktop and md:hidden for mobile drawer', () => {
      const html = renderToString(
        <LanguageProvider>
          <AccessibilityProvider>
            <Header
              activeTab="chat"
              onSelectTab={() => {}}
              eligibleCount={0}
              isKioskMode={false}
            />
          </AccessibilityProvider>
        </LanguageProvider>
      );

      // Navigation bar is displayed for tablet & desktop (768px+)
      expect(html).toContain('hidden md:flex items-center justify-center flex-1 min-w-0');

      // Does NOT contain overflow-x-auto with justify-center (the clipping root cause)
      expect(html).not.toContain('overflow-x-auto [scrollbar-width:none]');

      // Hamburger button is hidden on tablet/desktop (md:hidden)
      expect(html).toContain('md:hidden h-8 w-8 inline-flex items-center justify-center');
    });

    it('renders More tools dropdown containing secondary tools (Dashboard, Passport, Trust)', () => {
      const html = renderToString(
        <LanguageProvider>
          <AccessibilityProvider>
            <Header
              activeTab="chat"
              onSelectTab={() => {}}
              eligibleCount={0}
              isKioskMode={false}
            />
          </AccessibilityProvider>
        </LanguageProvider>
      );

      expect(html).toContain('More');
      expect(html).toContain('Secondary Tools');
      expect(html).toContain('Dashboard');
      expect(html).toContain('Passport');
      expect(html).toContain('Trust');
    });
  });

  describe('App layout integration and safe-area padding', () => {
    it('provides bottom padding on main element on mobile to avoid bottom nav content overlap', () => {
      const tree = React.createElement(
        LanguageProvider,
        null,
        React.createElement(
          AccessibilityProvider,
          null,
          React.createElement(App)
        )
      );

      const html = renderToString(tree);

      // Main container has pb-20 on mobile and pb-0 on tablet/desktop
      expect(html).toContain('flex-1 flex flex-col pb-20 md:pb-0');

      // Floating action buttons sit at bottom-20 on mobile and bottom-6 on tablet/desktop
      expect(html).toContain('bottom-20 md:bottom-6 left-4');

      // Dedicated bottom navigation is included in App
      expect(html).toContain('aria-label="Mobile Bottom Navigation"');
    });
  });
});
