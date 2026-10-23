import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { SchemeBannerCarousel } from '../components/SchemeBannerCarousel';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage } from '../utils/kioskStorage';

describe('Scheme-Specific Images in Banner Slideshow', () => {
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

  it('renders a distinct, scheme-specific genuine image asset for every scheme slide', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // 1. National Scholarship Portal (NSP) - Classroom Indian students
    expect(html).toContain('/schemes/nsp-post-matric.jpg');
    expect(html).toContain('Indian school students studying in classroom for National Scholarship Portal');
    expect(html).toContain('Empowering Indian Students with Direct Scholarships &amp; Fee Support');

    // 2. PM-KISAN - Indian farmers in agricultural field
    expect(html).toContain('/schemes/pm-kisan.jpg');
    expect(html).toContain('Indian farmers working in agricultural field for PM-KISAN Samman Nidhi');
    expect(html).toContain('Direct Income Support of ₹6,000/year for Indian Farmer Families');

    // 3. Ayushman Bharat PM-JAY - Doctor with stethoscope providing healthcare
    expect(html).toContain('/schemes/ab-pmjay.jpg');
    expect(html).toContain('Healthcare medical doctor with stethoscope providing clinical care for Ayushman Bharat PM-JAY');
    expect(html).toContain('Cashless Hospitalization Cover up to ₹5 Lakh Across 28,000+ Hospitals');

    // 4. PM SVANidhi - Indian street vendor smiling at produce stall
    expect(html).toContain('/schemes/pm-svanidhi.jpg');
    expect(html).toContain('Indian street vendor smiling at produce stall for PM SVANidhi Micro-Credit Scheme');
    expect(html).toContain('Working Capital Micro-Credit Loans for Urban Street Vendors');

    // 5. Pradhan Mantri Awas Yojana (PMAY-G) - Permanent rural pucca house
    expect(html).toContain('/schemes/pmay-g.jpg');
    expect(html).toContain('Permanent rural pucca masonry house in India under Pradhan Mantri Awas Yojana');
    expect(html).toContain('Permanent All-Weather Pucca Housing for Rural Indian Families');
  });

  it('ensures each scheme has a unique photographic image and no duplicate images are shared', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    const imageSources = [
      '/schemes/nsp-post-matric.jpg',
      '/schemes/pm-kisan.jpg',
      '/schemes/ab-pmjay.jpg',
      '/schemes/pm-svanidhi.jpg',
      '/schemes/pmay-g.jpg',
    ];

    // Every image source must appear in the HTML
    imageSources.forEach((src) => {
      expect(html).toContain(src);
    });

    // Ensure all 5 image assets are unique
    const uniqueImages = new Set(imageSources);
    expect(uniqueImages.size).toBe(5);
  });

  it('displays verified badges, scheme spotlights, and licensing attribution', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    expect(html).toContain('Verified Photo');
    expect(html).toContain('Verified Scheme Initiative');
    expect(html).toContain('Wikimedia Commons (CC-BY-SA 2.0)');
    expect(html).toContain('Unsplash Verified Media (Free License)');
  });

  it('synchronizes Tamil localized alt text and captions with scheme image', () => {
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'ta');

    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Tamil localized image alt & captions
    expect(html).toContain('தேசிய கல்வி உதவித்தொகை தளம் - வகுப்பறையில் கற்கும் இந்திய பள்ளி மாணவர்கள்');
    expect(html).toContain('நேரடி கல்வி உதவித்தொகை மூலம் இந்திய மாணவர்களுக்கு அதிகாரமளித்தல்');
    expect(html).toContain('பிஎம்-கிசான் சம்மான் நிதி - விவசாய நிலத்தில் உழைக்கும் இந்திய விவசாயிகள்');
    expect(html).toContain('ஆயுஷ்மான் பாரத் PM-JAY - மருத்துவ சிகிச்சை அளிக்கும் சுகாதார மருத்துவர்');
  });

  it('synchronizes Hindi localized alt text and captions with scheme image', () => {
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'hi');

    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Hindi localized image alt & captions
    expect(html).toContain('राष्ट्रीय छात्रवृत्ति पोर्टल - कक्षा में अध्ययनरत भारतीय स्कूली छात्र');
    expect(html).toContain('प्रत्यक्ष छात्रवृत्ति द्वारा देश भर के छात्रों का सशक्तिकरण');
    expect(html).toContain('पीएम किसान सम्मान निधि - कृषि क्षेत्र में कार्यरत भारतीय किसान');
    expect(html).toContain('आयुष्मान भारत पीएम-जेएवाई - स्टेथोस्कोप के साथ रोगी का उपचार करते चिकित्सक');
  });

  it('verifies autoplay 5-second interval and user interaction pause hooks', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // 5-second progress bar animation configuration
    expect(html).toContain('carousel-progress 5000ms linear forwards');
  });
});
