import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CivicMarkdown, isOfficialGovDomain } from '../components/CivicMarkdown';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { LanguageProvider } from '../context/LanguageContext';
import { MemoryStorage } from '../utils/kioskStorage';
import { VERIFIED_REFERENCE_SCHEMES } from '../data/verifiedReferenceSchemes';

describe('Chatbot Quality, Trust Signals, and Government UX Suite', () => {
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

  describe('1. Assistant Markdown Rendering & Visual Dignity', () => {
    it('renders real headings, bold highlights, and bullet lists without raw symbols', () => {
      const responseText = `
PM-KISAN is an income-support scheme for eligible landholding farmer families.

* **Assistance Amount:** **₹6,000** per year in three installments of **₹2,000**.
* **Eligible Groups:** Small and marginal farmers with cultivable land.
* **Official Portal:** [PM-KISAN Portal](https://pmkisan.gov.in)
      `;

      const html = renderToString(<CivicMarkdown content={responseText} />);

      // Formatted elements present
      expect(html).toContain('<ul');
      expect(html).toContain('<li');
      expect(html).toContain('<strong class="font-bold text-slate-900">₹6,000</strong>');
      expect(html).toContain('href="https://pmkisan.gov.in"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).toContain('Govt'); // Official Government trust emblem

      // Raw syntax symbols eliminated
      expect(html).not.toContain('**₹6,000**');
      expect(html).not.toContain('* **Assistance');
      expect(html).not.toContain('[PM-KISAN Portal]');
    });

    it('renders numbered procedure steps with accessible step badge pills', () => {
      const stepsText = `
1. Visit the official portal at https://pmkisan.gov.in
2. Click on 'New Farmer Registration' under Farmers Corner
3. Enter your Aadhaar number and verify via OTP
      `;

      const html = renderToString(<CivicMarkdown content={stepsText} />);

      expect(html).toContain('<ol');
      expect(html).toContain('1');
      expect(html).toContain('2');
      expect(html).toContain('3');
      expect(html).toContain('New Farmer Registration');
      expect(html).not.toContain('1. Visit');
    });

    it('renders dividers and privacy notices cleanly', () => {
      const content = `
Income support guidelines.

---

*Privacy Note: Never share your Aadhaar number or OTP in public chat.*
      `;

      const html = renderToString(<CivicMarkdown content={content} />);

      expect(html).toContain('<hr');
      expect(html).toContain('<aside');
      expect(html).toContain('Never share your Aadhaar number');
    });
  });

  describe('2. Official Source Trust Signals', () => {
    it('validates government domains and flags unofficial sites', () => {
      expect(isOfficialGovDomain('https://pmkisan.gov.in')).toBe(true);
      expect(isOfficialGovDomain('https://pmjay.gov.in')).toBe(true);
      expect(isOfficialGovDomain('https://pmayg.nic.in')).toBe(true);
      expect(isOfficialGovDomain('https://myscheme.gov.in')).toBe(true);
      expect(isOfficialGovDomain('https://fake-scheme-claim.com')).toBe(false);
      expect(isOfficialGovDomain('https://unverified-blog.in')).toBe(false);
    });

    it('renders clickable links for official sources in assistant messages', () => {
      const text = 'For official guidelines, visit [Ayushman Bharat Portal](https://pmjay.gov.in).';
      const html = renderToString(<CivicMarkdown content={text} />);

      expect(html).toContain('href="https://pmjay.gov.in"');
      expect(html).toContain('Ayushman Bharat Portal');
      expect(html).toContain('Govt');
    });
  });

  describe('3. Tamil Unicode & Bilingual Support', () => {
    it('renders natural Tamil welfare information and currency amounts without clipping', () => {
      const tamilContent = `
பிரதான் மந்திரி கிசான் சம்மான் நிதி (PM-KISAN) திட்டத்தின் கீழ் தகுதியுள்ள விவசாயிகளுக்கு ஆண்டுக்கு **₹6,000** வழங்கப்படுகிறது.

* ஆதார் அட்டை
* நில உரிமை ஆவணம் (பட்டா / சிட்டா)
* வங்கி கணக்கு புத்தகம்

விண்ணப்பிக்க [அதிகாரப்பூர்வ தளம்](https://pmkisan.gov.in) பார்க்கவும்.
      `;

      const html = renderToString(<CivicMarkdown content={tamilContent} />);

      expect(html).toContain('பிரதான் மந்திரி கிசான் சம்மான் நிதி');
      expect(html).toContain('₹6,000');
      expect(html).toContain('பட்டா / சிட்டா');
      expect(html).toContain('ஆதார் அட்டை');
      expect(html).toContain('https://pmkisan.gov.in');
      expect(html).toContain('Govt');
      expect(html).not.toContain('**₹6,000**');
    });
  });

  describe('4. Security & XSS Immunity', () => {
    it('neutralizes malicious HTML and script tags from untrusted content', () => {
      const malicious = '<script>alert("xss")</script><a href="javascript:void(0)" onclick="hack()">Click</a>';
      const html = renderToString(<CivicMarkdown content={malicious} />);

      // Must never render unescaped active HTML elements
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<a href="javascript:void(0)"');
      // Safely rendered as escaped text
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&lt;a href=');
    });
  });

  describe('5. Genuine Gemini Attribution & Kiosk Context', () => {
    it('displays open assistant interface with accessible controls and Kiosk safety', () => {
      const html = renderToString(
        <LanguageProvider>
          <VoiceAssistant
            schemes={VERIFIED_REFERENCE_SCHEMES}
            onNavigate={vi.fn()}
            isOpen={true}
            isKioskMode={true}
          />
        </LanguageProvider>
      );

      // Verify header, language selectors with BCP 47 tags
      expect(html).toContain('Sev<span class="text-civic-600">AI</span>Q Assistant');
      expect(html).toContain('தமிழ் (ta-IN)');
      expect(html).toContain('English (en-IN)');
      // Truthful privacy disclosure
      expect(html).toContain('Browser Web Speech API · Transcripts sent to Gemini only upon your review &amp; confirmation');
      // Tactile mic & input
      expect(html).toContain('Ask welfare questions in English or Tamil...');
    });
  });
});
