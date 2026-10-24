import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Footer } from '../components/Footer';
import { AboutModal } from '../components/AboutModal';
import { LanguageProvider } from '../context/LanguageContext';

describe('Play Intro Button Mobile Responsive Alignment Suite', () => {
  const VIEWPORT_WIDTHS = [320, 360, 375, 390, 430];

  it('renders horizontally centered Play Intro button with fit-content and nowrap in English', () => {
    const handleReplay = vi.fn();
    const handleAbout = vi.fn();

    const html = renderToString(
      <LanguageProvider>
        <Footer onReplayIntro={handleReplay} onOpenAbout={handleAbout} />
      </LanguageProvider>
    );

    // 1. Centering container
    expect(html).toContain('justify-center');
    expect(html).toContain('items-center');

    // 2. Button styling: width fit-content, no text wrapping
    expect(html).toContain('w-fit');
    expect(html).toContain('whitespace-nowrap');
    expect(html).toContain('width:fit-content');

    // 3. Generous padding & pill border
    expect(html).toContain('px-3.5');
    expect(html).toContain('py-1.5');
    expect(html).toContain('rounded-full');
    expect(html).toContain('border');
    expect(html).toContain('gap-1.5');

    // 4. Movie icon and label
    expect(html).toContain('🎬');
    expect(html).toContain('Play Intro');
    expect(html).toContain('aria-label="Replay SevAIQ Cinematic Intro"');
  });

  VIEWPORT_WIDTHS.forEach((width) => {
    it(`guarantees mobile alignment and non-wrapping at viewport width ${width}px`, () => {
      const handleReplay = vi.fn();

      const html = renderToString(
        <LanguageProvider>
          <div style={{ width: `${width}px`, maxWidth: '100%', overflow: 'hidden' }}>
            <Footer onReplayIntro={handleReplay} />
          </div>
        </LanguageProvider>
      );

      // Verify the button is wrapped in a full-width centering container on mobile
      expect(html).toContain('w-full sm:w-auto');
      expect(html).toContain('justify-center');
      expect(html).toContain('Play Intro');
      expect(html).toContain('🎬');
      expect(html).toContain('whitespace-nowrap');
    });
  });

  it('renders Play Intro button in AboutModal with fit-content and mobile visibility', () => {
    const handleReplay = vi.fn();
    const handleClose = vi.fn();
    const handleNav = vi.fn();

    const html = renderToString(
      <LanguageProvider>
        <AboutModal
          isOpen={true}
          onClose={handleClose}
          onNavigate={handleNav}
          onReplayIntro={handleReplay}
        />
      </LanguageProvider>
    );

    expect(html).toContain('Replay Intro');
    expect(html).toContain('🎬');
    expect(html).toContain('w-fit');
    expect(html).toContain('whitespace-nowrap');
    expect(html).toContain('rounded-full');
  });
});
