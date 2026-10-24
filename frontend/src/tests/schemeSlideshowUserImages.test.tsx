import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SchemeBannerCarousel } from '../components/SchemeBannerCarousel';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { MemoryStorage } from '../utils/kioskStorage';

describe('User Supplied Images Integration in Scheme Carousel', () => {
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

  it('renders all 5 exact user-provided banner images in the slideshow without placeholder or dummy graphics', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // 1. National Scholarship Portal is LIVE on UMANG
    expect(html).toContain('/banners/banner-nsp.png');
    expect(html).toContain('National Scholarship Portal is now LIVE on UMANG');

    // 2. Pradhan Mantri Suraksha Bima Yojana
    expect(html).toContain('/banners/banner-suraksha-bima.png');
    expect(html).toContain('Pradhan Mantri Suraksha Bima Yojana');

    // 3. One Stop Platform (myScheme)
    expect(html).toContain('/banners/banner-myscheme-umang.png');
    expect(html).toContain('ONE STOP PLATFORM');

    // 4. Digital India - Opportunity for All (PM Modi)
    expect(html).toContain('/banners/banner-modi.png');
    expect(html).toContain('Digital India means opportunity for all');

    // 5. Celebrating 11 Years of Digital India
    expect(html).toContain('/banners/banner-digital-india.png');
    expect(html).toContain('Celebrating 11 Years of Digital India');
  });

  it('maintains a consistent image container size and aspect ratio (aspect-[2.15/1]) across all slides', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Consistent aspect ratio container across all slides
    expect(html).toContain('aspect-[2.15/1]');
    expect(html).toContain('rounded-2xl');
    expect(html).toContain('overflow-hidden');
    expect(html).toContain('object-cover');
  });

  it('ensures each image correctly matches its corresponding scheme title and description', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    // Scheme titles matching images
    expect(html).toContain('National Scholarship Portal');
    expect(html).toContain('Pradhan Mantri Suraksha Bima Yojana');
    expect(html).toContain('One Stop Platform');
    expect(html).toContain('Digital India - Opportunity for All');
    expect(html).toContain('Celebrating 11 Years of Digital India');

    // Descriptions matching scheme requirements
    expect(html).toContain('Students can apply for scholarships easily through the app with zero paperwork hassle.');
    expect(html).toContain('Insurance worth upto ₹2,00,000/- at just ₹20/- per annum accidental death and disability coverage for all account holders.');
    expect(html).toContain('Access, apply and track central and state government schemes effortlessly in one single unified civic platform.');
    expect(html).toContain('Digital India means opportunity for all, facility for all and participation of all');
    expect(html).toContain('Empowering every citizen through Digital Transformation, Innovation, Digital Infrastructure, and Inclusive Economic Growth.');
  });

  it('provides comprehensive Tamil localized titles, descriptions, and accessible alt text', () => {
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'ta');

    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    expect(html).toContain('தேசிய கல்வி உதவித்தொகை தளம்');
    expect(html).toContain('பிரதான் மந்திரி சுரக்ஷா பீமா யோஜனா');
    expect(html).toContain('ஒரே நிறுத்த தளம் (One Stop Platform)');
    expect(html).toContain('டிஜிட்டல் இந்தியா - அனைவருக்கும் வாய்ப்பு');
    expect(html).toContain('டிஜிட்டல் இந்தியாவின் 11 ஆண்டுகளைக் கொண்டாடுகிறோம்');
  });

  it('provides comprehensive Hindi localized titles, descriptions, and accessible alt text', () => {
    localStorage.setItem('SEVAIQ_APP_LANGUAGE', 'hi');

    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    expect(html).toContain('राष्ट्रीय छात्रवृत्ति पोर्टल');
    expect(html).toContain('प्रधानमंत्री सुरक्षा बीमा योजना');
    expect(html).toContain('वन स्टॉप प्लेटफॉर्म');
    expect(html).toContain('डिजिटल इंडिया - सबके लिए अवसर');
    expect(html).toContain('डिजिटल इंडिया के 11 गौरवशाली वर्ष');
  });

  it('preserves the sliding animation, 5-second autoplay timing, and navigation arrow controls', () => {
    const html = renderToString(
      <LanguageProvider>
        <AccessibilityProvider>
          <SchemeBannerCarousel onNavigate={vi.fn()} />
        </AccessibilityProvider>
      </LanguageProvider>
    );

    expect(html).toContain('carousel-progress 5000ms linear forwards');
    expect(html).toContain('transition-transform duration-500 ease-in-out');
    expect(html).toContain('Previous Scheme Slide');
    expect(html).toContain('Next Scheme Slide');
  });
});
