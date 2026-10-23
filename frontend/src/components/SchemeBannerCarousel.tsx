import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Home,
  Tractor,
} from 'lucide-react';
import { NavigationTab } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';

interface SchemeBannerCarouselProps {
  onNavigate: (tab: NavigationTab) => void;
  onSelectScheme?: (schemeId: string) => void;
  onSelectSchemeForEligibility?: (schemeId: string) => void;
  onScrollToOptions?: () => void;
  onSelectCategory?: (categoryId: string) => void;
}

interface SchemeSlide {
  id: string;
  schemeId: string;
  ministryBadge: string;
  ministrySub: string;
  partnerTag: string;
  titlePrimary: string;
  statusBadge: string;
  partnerText: string;
  description: string;
  benefitPill: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  officialUrl: string;
  realBannerImage: string;
  theme: {
    bgGradient: string;
    headlineColor: string;
    badgeBg: string;
    arrowBg: string;
    buttonText: string;
    accentDot: string;
    decorCircle: string;
  };
}

const SLIDES: SchemeSlide[] = [
  {
    id: 'nsp',
    schemeId: 'nsp-post-matric',
    ministryBadge: 'MINISTRY OF ELECTRONICS & INFORMATION TECHNOLOGY',
    ministrySub: 'GOVERNMENT OF INDIA',
    partnerTag: 'UMANG',
    titlePrimary: 'National Scholarship Portal',
    statusBadge: 'LIVE',
    partnerText: 'on UMANG',
    description: 'Students can apply for scholarships easily through the app with zero paperwork hassle.',
    benefitPill: '100% Compulsory Fee Reimbursement & Maintenance Support',
    primaryCtaText: 'Apply For Scholarship',
    secondaryCtaText: 'My Applications',
    officialUrl: 'https://scholarships.gov.in',
    realBannerImage: '/banners/banner-nsp.png',
    theme: {
      bgGradient: 'from-[#eef9f2] via-[#e5f4ea] to-[#d8ede0]',
      headlineColor: 'text-[#155e3b]',
      badgeBg: 'bg-[#e53935]',
      arrowBg: 'bg-[#107c41] hover:bg-[#0c6534]',
      buttonText: 'text-[#107c41]',
      accentDot: 'bg-[#107c41]',
      decorCircle: 'bg-emerald-300/20',
    },
  },
  {
    id: 'pm-modi',
    schemeId: 'digital-india-initiative',
    ministryBadge: 'DIGITAL INDIA INITIATIVE',
    ministrySub: 'GOVERNMENT OF INDIA',
    partnerTag: 'TRANSFORMATION',
    titlePrimary: 'Digital India - Transforming Lives',
    statusBadge: 'VISION',
    partnerText: "Hon'ble PM Modi",
    description: '"Digital India isn\'t just about transforming systems, it\'s about transforming lives and empowering every Indian citizen." - Narendra Modi',
    benefitPill: 'Universal Digital Access & Paperless Citizen Governance',
    primaryCtaText: 'Explore Digital India',
    secondaryCtaText: 'Know More',
    officialUrl: 'https://digitalindia.gov.in',
    realBannerImage: '/banners/banner-modi.png',
    theme: {
      bgGradient: 'from-[#fefcf2] via-[#f9f5e2] to-[#ecf8eb]',
      headlineColor: 'text-[#1b6b3e]',
      badgeBg: 'bg-[#16a34a]',
      arrowBg: 'bg-[#16a34a] hover:bg-[#15803d]',
      buttonText: 'text-[#16a34a]',
      accentDot: 'bg-[#16a34a]',
      decorCircle: 'bg-amber-300/20',
    },
  },
  {
    id: 'digital-india',
    schemeId: 'digital-india-11-years',
    ministryBadge: 'MINISTRY OF ELECTRONICS & IT',
    ministrySub: 'GOVERNMENT OF INDIA',
    partnerTag: '11 YEARS',
    titlePrimary: 'Celebrating 11 Years of Digital India',
    statusBadge: 'MILESTONE',
    partnerText: 'Powering India',
    description: 'Over a decade of citizen empowerment, digital inclusion, and world-class digital public infrastructure reaching 1.4 billion citizens.',
    benefitPill: '1,000+ Services Digitally Integrated across Bharat',
    primaryCtaText: 'Discover Schemes',
    secondaryCtaText: 'Digital Initiatives',
    officialUrl: 'https://digitalindia.gov.in',
    realBannerImage: '/banners/banner-digital-india.png',
    theme: {
      bgGradient: 'from-[#f0f9ff] via-[#e2f2fe] to-[#d8eefd]',
      headlineColor: 'text-[#0355a3]',
      badgeBg: 'bg-[#0284c7]',
      arrowBg: 'bg-[#0284c7] hover:bg-[#0369a1]',
      buttonText: 'text-[#0284c7]',
      accentDot: 'bg-[#0284c7]',
      decorCircle: 'bg-sky-300/20',
    },
  },
  {
    id: 'suraksha-bima',
    schemeId: 'pmsby',
    ministryBadge: 'DEPARTMENT OF FINANCIAL SERVICES',
    ministrySub: 'MINISTRY OF FINANCE',
    partnerTag: 'PMSBY',
    titlePrimary: 'Pradhan Mantri Suraksha Bima Yojana',
    statusBadge: 'SECURITY',
    partnerText: '₹2 Lakh Cover',
    description: 'Affordable social security accident insurance of ₹2,00,000 for just ₹20 per year auto-debited from bank account.',
    benefitPill: 'Accidental Death & Disability Cover of ₹2,00,000 for ₹20/Year',
    primaryCtaText: 'Apply for PMSBY',
    secondaryCtaText: 'Claim Status',
    officialUrl: 'https://financialservices.gov.in',
    realBannerImage: '/banners/banner-suraksha-bima.png',
    theme: {
      bgGradient: 'from-[#fffbf0] via-[#fef3c7] to-[#fde68a]',
      headlineColor: 'text-[#b45309]',
      badgeBg: 'bg-[#d97706]',
      arrowBg: 'bg-[#d97706] hover:bg-[#b45309]',
      buttonText: 'text-[#d97706]',
      accentDot: 'bg-[#d97706]',
      decorCircle: 'bg-amber-400/20',
    },
  },
  {
    id: 'myscheme-umang',
    schemeId: 'myscheme-umang',
    ministryBadge: 'NATIONAL E-GOVERNANCE DIVISION & DIGITAL INDIA',
    ministrySub: 'GOVERNMENT OF INDIA',
    partnerTag: 'UMANG APP',
    titlePrimary: 'myScheme is now on UMANG',
    statusBadge: '1000+ SCHEMES',
    partnerText: 'Mobile First',
    description: 'Access 1,000+ Central and State Government schemes anywhere, anytime directly on the UMANG mobile application.',
    benefitPill: 'One Mobile App for All Central & State Government Welfare',
    primaryCtaText: 'Open UMANG',
    secondaryCtaText: 'Download App',
    officialUrl: 'https://web.umang.gov.in',
    realBannerImage: '/banners/banner-myscheme-umang.png',
    theme: {
      bgGradient: 'from-[#f5f3ff] via-[#ede9fe] to-[#ddd6fe]',
      headlineColor: 'text-[#6d28d9]',
      badgeBg: 'bg-[#7c3aed]',
      arrowBg: 'bg-[#7c3aed] hover:bg-[#6d28d9]',
      buttonText: 'text-[#7c3aed]',
      accentDot: 'bg-[#7c3aed]',
      decorCircle: 'bg-purple-300/20',
    },
  },
];

// Healthcare Cross with Caring Hands Icon
const HealthcareCrossIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Healthcare & Wellness">
    <rect x="10" y="3" width="4" height="10" rx="1" fill="#16a34a" />
    <rect x="7" y="6" width="10" height="4" rx="1" fill="#16a34a" />
    <path
      d="M3 13C4 17 8 20 12 20C16 20 20 17 21 13C21 13 18 16 12 16C6 16 3 13 3 13Z"
      fill="#15803d"
    />
    <path
      d="M5 14C3 15 2 17 2 19C4 21 7 22 12 22C17 22 20 21 22 19C22 17 21 15 19 14"
      stroke="#16a34a"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Green Origami Paper Airplane
const PaperAirplane: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`moving-animation-image animate-airplane-glide ${className}`}
    aria-hidden="true"
    role="img"
    data-dark-exempt="true"
  >
    <path d="M36 4L4 18L18 24L36 4Z" fill="#16a34a" className="drop-shadow-sm" />
    <path d="M36 4L22 36L18 24L36 4Z" fill="#15803d" />
    <path d="M18 24L24 30L22 36L18 24Z" fill="#166534" />
    <path d="M18 24L36 4" stroke="#bbf7d0" strokeWidth="1.2" />
  </svg>
);

const FLOATING_OPTIONS = [
  {
    id: 'opt-health',
    categoryId: 'healthcare',
    titleEn: 'Health & Wellness',
    titleTa: 'சுகாதாரம் & நல்வாழ்வு',
    titleHi: 'स्वास्थ्य एवं कल्याण',
    iconType: 'health',
    floatClass: 'animate-float-1',
  },
  {
    id: 'opt-education',
    categoryId: 'education',
    titleEn: 'Education & Learning',
    titleTa: 'கல்வி & கற்றல்',
    titleHi: 'शिक्षा एवं शिक्षण',
    iconType: 'education',
    floatClass: 'animate-float-2',
  },
  {
    id: 'opt-agriculture',
    categoryId: 'agriculture',
    titleEn: 'Agriculture & Rural',
    titleTa: 'வேளாண்மை & ஊரகம்',
    titleHi: 'कृषि एवं ग्रामीण',
    iconType: 'agriculture',
    floatClass: 'animate-float-3',
  },
  {
    id: 'opt-housing',
    categoryId: 'housing',
    titleEn: 'Housing & Shelter',
    titleTa: 'வீட்டுவசதி & இருப்பிடம்',
    titleHi: 'ஆवास एवं आश्रय',
    iconType: 'housing',
    floatClass: 'animate-float-4',
  },
];

export const SchemeBannerCarousel: React.FC<SchemeBannerCarouselProps> = ({
  onNavigate,
  onSelectScheme,
  onSelectSchemeForEligibility,
  onScrollToOptions,
  onSelectCategory,
}) => {
  const { settings } = useAccessibility();
  const { language } = useLanguage();
  const isTamil = language === 'ta';
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // 5-second slide duration
  const SLIDE_DURATION_MS = 5000;

  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Auto-advance slides every 5 seconds unless animations are paused
  useEffect(() => {
    if (settings.pauseAnimation) return;

    const timer = setInterval(() => {
      nextSlide();
    }, SLIDE_DURATION_MS);

    return () => clearInterval(timer);
  }, [nextSlide, settings.pauseAnimation, SLIDE_DURATION_MS]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    setTouchStartX(null);
  };

  const activeSlide = SLIDES[currentSlideIndex];

  const handlePrimaryClick = (slide: SchemeSlide) => {
    if (slide.officialUrl) {
      window.open(slide.officialUrl, '_blank', 'noopener,noreferrer');
    } else if (onSelectSchemeForEligibility) {
      onSelectSchemeForEligibility(slide.schemeId);
    } else if (onSelectScheme) {
      onSelectScheme(slide.schemeId);
    } else {
      onNavigate('discover');
    }
  };

  const handleSecondaryClick = () => {
    if (onSelectScheme) {
      onSelectScheme(activeSlide.schemeId);
    } else {
      onNavigate('discover');
    }
  };

  const handleScrollToOptions = () => {
    if (onScrollToOptions) {
      onScrollToOptions();
      return;
    }
    const el = document.getElementById('options-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate('discover');
    }
  };

  const handleSelectFloatingCategory = (catId: string) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    } else {
      handleScrollToOptions();
    }
  };

  const nextSlideData = SLIDES[(currentSlideIndex + 1) % SLIDES.length];

  return (
    <div
      className="w-full relative moving-animation-exempt scheme-banner-carousel"
      data-dark-exempt="true"
      data-moving-animation="true"
    >
      {/* Outer Banner Carousel Container: Occupies Full Frame Viewport */}
      <div
        className="relative w-full h-[calc(100vh-4.25rem)] min-h-[640px] max-h-[960px] flex flex-col justify-between overflow-hidden select-none group border-b border-slate-200/80 bg-slate-50 moving-animation-exempt"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-roledescription="carousel"
        aria-label="Government Schemes Showcase Carousel"
      >
        {/* Left Navigation Arrow Button */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-40 w-7 sm:w-8.5 lg:w-9 h-14 sm:h-18 lg:h-20 rounded-r-xl bg-[#166534] hover:bg-[#14532d] text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          aria-label="Previous Scheme Slide"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>

        {/* Right Navigation Arrow Button */}
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-40 w-7 sm:w-8.5 lg:w-9 h-14 sm:h-18 lg:h-20 rounded-l-xl bg-[#166534] hover:bg-[#14532d] text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          aria-label="Next Scheme Slide"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>

        {/* Scrolling Horizontal Slide Track (Animated smoothly every 5s) */}
        <div
          className="flex-1 flex transition-transform duration-500 ease-in-out w-full h-full"
          style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}
        >
          {SLIDES.map((slide) => (
            <div
              key={slide.id}
              className={`w-full h-full shrink-0 bg-gradient-to-r ${slide.theme.bgGradient} px-3 sm:px-8 lg:px-12 py-3 sm:py-6 relative flex items-center justify-center overflow-hidden`}
            >
              {/* Subtle background decorative shapes */}
              <div
                className={`absolute -right-20 -bottom-20 w-96 h-96 rounded-full ${slide.theme.decorCircle} blur-3xl pointer-events-none`}
              />
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#155e3b_1px,transparent_1px)] [background-size:20px_20px]" />

              {/* Main Content Layout: Real Government Banner Image + Floating Options */}
              <div className="w-full max-w-7xl mx-auto flex items-center justify-center px-2 sm:px-6 lg:px-8 relative z-20">
                <div className="relative w-full flex items-center justify-center">
                  {/* Real Official Government Banner Container */}
                  <div
                    className="relative w-full max-w-5xl rounded-2xl shadow-xl overflow-hidden border border-slate-200/90 bg-white group/banner transition-all duration-300 hover:shadow-2xl"
                    data-dark-exempt="true"
                  >
                    {/* The Real Banner Image from official portal */}
                    <img
                      src={slide.realBannerImage}
                      alt={`${slide.titlePrimary} - Official Government Portal Banner`}
                      className="real-banner-image moving-animation-image w-full h-auto max-h-[440px] sm:max-h-[460px] object-cover sm:object-contain rounded-2xl transition-transform duration-500 group-hover/banner:scale-[1.01] cursor-pointer"
                      data-dark-exempt="true"
                      data-moving-animation="true"
                      onClick={() => handlePrimaryClick(slide)}
                      loading="eager"
                    />

                    {/* Interactive Overlay CTA Buttons (matching official banner buttons) */}
                    <div className="absolute bottom-2.5 sm:bottom-4 left-3 sm:left-6 flex flex-wrap items-center gap-2 sm:gap-2.5 z-20">
                      <button
                        type="button"
                        onClick={() => handlePrimaryClick(slide)}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#107c41] hover:bg-[#0c6534] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg border border-emerald-700/30 transition-all hover:scale-105 active:scale-95 inline-flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        aria-label={slide.primaryCtaText}
                      >
                        <span>{slide.primaryCtaText}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </button>

                      {slide.secondaryCtaText && (
                        <button
                          type="button"
                          onClick={handleSecondaryClick}
                          className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/95 hover:bg-white text-slate-800 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg border border-slate-300/80 transition-all hover:scale-105 active:scale-95 inline-flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-slate-600 cursor-pointer"
                          aria-label={slide.secondaryCtaText}
                        >
                          <span>{slide.secondaryCtaText}</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                        </button>
                      )}
                    </div>

                    {/* Next-Slide Thumbnail Preview Card (Matching official myscheme.gov.in portal) */}
                    <button
                      type="button"
                      onClick={nextSlide}
                      className="absolute bottom-2.5 sm:bottom-4 right-3 sm:right-5 z-30 hidden md:flex items-center space-x-2.5 p-1.5 sm:p-2 rounded-xl bg-white/95 hover:bg-white text-slate-800 shadow-lg hover:shadow-xl border border-slate-200/90 transition-all hover:scale-105 active:scale-95 cursor-pointer group/next focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      aria-label={`Next Slide Preview: ${nextSlideData.titlePrimary}`}
                    >
                      <div className="w-14 sm:w-16 h-9 sm:h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                        <img
                          src={nextSlideData.realBannerImage}
                          alt="Next slide thumbnail"
                          className="w-full h-full object-cover group-hover/next:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex flex-col text-left pr-1">
                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">
                          Next Scheme
                        </span>
                        <span className="text-[11px] font-bold text-slate-800 line-clamp-1 max-w-[130px]">
                          {nextSlideData.titlePrimary}
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover/next:translate-x-0.5 transition-transform">
                        <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </button>

                    {/* Accessible Screen Reader Information */}
                    <div className="sr-only">
                      <h2>{slide.titlePrimary}</h2>
                      <p>{slide.description}</p>
                      <span>{slide.ministryBadge}</span>
                      <span>{slide.benefitPill}</span>
                      <button onClick={() => handlePrimaryClick(slide)}>{slide.primaryCtaText}</button>
                      <button onClick={handleSecondaryClick}>{slide.secondaryCtaText}</button>
                    </div>
                  </div>

                  {/* 4 Floating Options along S-Curve Flight Path (Right Side Overlay) */}
                  <div className="absolute -right-3 lg:right-2 top-1/2 -translate-y-1/2 hidden xl:flex flex-col justify-between py-1 shrink-0 z-30 pointer-events-auto">
                    {/* Dotted S-Curve Line SVG */}
                    <svg
                      viewBox="0 0 160 300"
                      className="absolute -left-6 sm:-left-8 top-0 w-36 sm:w-44 h-full pointer-events-none text-emerald-700/35 overflow-visible"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M-20 180 C30 220 10 110 60 70 C100 40 120 95 145 20"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeDasharray="5 5"
                        strokeLinecap="round"
                      />
                    </svg>

                    {/* Green Paper Airplane at apex of flight path */}
                    <div className="absolute -top-4 right-1 z-20 pointer-events-none drop-shadow-md animate-float-subtle">
                      <PaperAirplane className="w-7 h-7 sm:w-8 sm:h-8 rotate-12" />
                    </div>

                    {/* The 4 Floating Option Buttons */}
                    <div
                      className="flex flex-col space-y-2.5 sm:space-y-3.5 relative z-20"
                      aria-label="Floating Scheme Category Options"
                    >
                      {FLOATING_OPTIONS.map((opt, idx) => {
                        const title = isTamil
                          ? opt.titleTa
                          : language === 'hi'
                          ? opt.titleHi
                          : opt.titleEn;
                        const offsetClass =
                          idx === 0
                            ? 'translate-x-0'
                            : idx === 1
                            ? 'translate-x-2 sm:translate-x-3'
                            : idx === 2
                            ? 'translate-x-4 sm:translate-x-5'
                            : 'translate-x-1 sm:translate-x-2';

                        return (
                          <div key={opt.id} className={`relative group ${offsetClass} ${opt.floatClass}`}>
                            <button
                              type="button"
                              onClick={() => handleSelectFloatingCategory(opt.categoryId)}
                              className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-lg hover:shadow-2xl hover:border-emerald-400 flex items-center justify-center transition-transform duration-200 hover:scale-115 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${opt.floatClass}`}
                              title={title}
                              aria-label={`Explore ${opt.titleEn} floating option`}
                            >
                              <div className="group-hover:scale-110 transition-transform">
                                {opt.iconType === 'health' && <HealthcareCrossIcon className="w-6 h-6" />}
                                {opt.iconType === 'education' && (
                                  <GraduationCap className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 text-[#026bc9] stroke-[2.2]" />
                                )}
                                {opt.iconType === 'agriculture' && (
                                  <Tractor className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 text-[#ea580c] stroke-[2.2]" />
                                )}
                                {opt.iconType === 'housing' && (
                                  <Home className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 text-[#0284c7] stroke-[2.2]" />
                                )}
                              </div>
                            </button>

                            {/* Floating Tooltip Label on hover */}
                            <span className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none px-2 py-1 rounded-md bg-slate-900/95 text-white text-[10px] font-bold whitespace-nowrap z-30 shadow-md">
                              {title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Area: Slide Indicator Dots + Floating Options Launcher */}
        <div className="relative z-30 pb-3 sm:pb-5 pt-1 flex flex-col items-center justify-center space-y-2.5">
          {/* Carousel Slide Indicators with 5-Second Progress Bar Timer */}
          <div className="flex items-center space-x-2">
            {SLIDES.map((slide, index) => {
              const isActive = index === currentSlideIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`relative h-2 rounded-full overflow-hidden transition-all duration-300 ${
                    isActive ? 'w-10 bg-slate-300/90 shadow-2xs' : 'w-2.5 bg-slate-400/50 hover:bg-slate-500'
                  }`}
                  aria-label={`Go to slide ${index + 1}: ${slide.titlePrimary}`}
                >
                  {isActive && (
                    <div
                      key={`progress-${currentSlideIndex}`}
                      className={`h-full ${activeSlide.theme.accentDot} rounded-full`}
                      style={{
                        animation: settings.pauseAnimation
                          ? 'none'
                          : `carousel-progress ${SLIDE_DURATION_MS}ms linear forwards`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Floating Options Launcher Bar (Exact replica of Image 1) */}
          <div className="inline-flex flex-col items-center px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl hover:shadow-2xl transition-all duration-300 group/float animate-float-subtle">
            <p className="text-[10px] sm:text-xs font-black tracking-widest text-slate-700 uppercase mb-1.5">
              #GOVERNMENTSCHEMES / #SCHEMESFORYOU
            </p>
            <button
              type="button"
              onClick={handleScrollToOptions}
              className="inline-flex items-center space-x-2 px-6 sm:px-8 py-2 sm:py-2.5 rounded-xl bg-[#107c41] hover:bg-[#0c6534] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600"
              aria-label="Find Schemes For You - scroll to options"
            >
              <span>Find Schemes For You</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover/float:translate-x-1 transition-transform" />
            </button>
            <button
              type="button"
              onClick={handleScrollToOptions}
              className="flex items-center space-x-1 text-[10px] font-bold text-slate-500 hover:text-emerald-700 mt-1 transition-colors cursor-pointer"
            >
              <span>Scroll down to explore options</span>
              <ChevronDown className="w-3.5 h-3.5 animate-bounce text-emerald-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
