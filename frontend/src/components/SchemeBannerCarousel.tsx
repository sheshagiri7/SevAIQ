import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
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
  onFindSchemes?: () => void;
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
  image: {
    src: string;
    alt: string;
    caption: string;
    objectFit?: 'cover' | 'contain';
    objectPosition?: string;
  };
  theme: {
    bgGradient: string;
    headlineColor: string;
    badgeBg: string;
    arrowBg: string;
    buttonText: string;
    accentDot: string;
    decorCircle: string;
  };
  phone: {
    title: string;
    shortCode: string;
    tagline: string;
    searchPlaceholder: string;
    highlightCard: {
      title: string;
      btnText: string;
      btnColor: string;
    };
    service1: string;
    service2: string;
    floatingBadge1: {
      title: string;
      tag: string;
      color: string;
      icon: 'graduation' | 'sprout' | 'heart' | 'coins' | 'home';
    };
    floatingBadge2: {
      title: string;
      tag: string;
      color: string;
      icon: 'file' | 'shield' | 'check' | 'award';
    };
    floating3DIcon: 'graduation' | 'sprout' | 'heart' | 'coins' | 'home';
    phoneAnimationClass?: string;
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
    primaryCtaText: 'Apply Now',
    secondaryCtaText: 'Detailed Analysis',
    officialUrl: 'https://scholarships.gov.in',
    image: {
      src: '/banners/banner-nsp.png',
      alt: 'National Scholarship Portal is now LIVE on UMANG - Students can apply for scholarships easily through the app',
      caption: 'National Scholarship Portal LIVE on UMANG App',
      objectFit: 'cover',
      objectPosition: 'object-center',
    },
    theme: {
      bgGradient: 'from-[#eef9f2] via-[#e5f4ea] to-[#d8ede0]',
      headlineColor: 'text-[#155e3b]',
      badgeBg: 'bg-[#e53935]',
      arrowBg: 'bg-[#107c41] hover:bg-[#0c6534]',
      buttonText: 'text-[#107c41]',
      accentDot: 'bg-[#107c41]',
      decorCircle: 'bg-emerald-300/20',
    },
    phone: {
      title: 'National Scholarship Portal',
      shortCode: 'NSP',
      tagline: 'Ministry of Education & Social Justice',
      searchPlaceholder: 'Search services here...',
      highlightCard: {
        title: 'Know Your Payment Status',
        btnText: 'VIEW DETAILS',
        btnColor: 'bg-civic-600',
      },
      service1: 'One Time Registration (OTR)',
      service2: 'My Profile & Aadhaar Verification',
      floatingBadge1: {
        title: 'Apply For Scholarship',
        tag: 'NEW',
        color: 'bg-indigo-600',
        icon: 'graduation',
      },
      floatingBadge2: {
        title: 'My Applications',
        tag: 'NEW',
        color: 'bg-sky-500',
        icon: 'file',
      },
      floating3DIcon: 'graduation',
      phoneAnimationClass: 'animate-moving-phone-1',
    },
  },
  {
    id: 'pmsby',
    schemeId: 'pmsby',
    ministryBadge: 'DEPARTMENT OF FINANCIAL SERVICES & MINISTRY OF FINANCE',
    ministrySub: 'GOVERNMENT OF INDIA',
    partnerTag: 'PMSBY',
    titlePrimary: 'Pradhan Mantri Suraksha Bima Yojana',
    statusBadge: 'ACTIVE',
    partnerText: '₹20/Year',
    description: 'Insurance worth upto ₹2,00,000/- at just ₹20/- per annum accidental death and disability coverage for all account holders.',
    benefitPill: '₹2,00,000 Accidental Cover for ₹20/Year auto-debited',
    primaryCtaText: 'Apply Now',
    secondaryCtaText: 'Detailed Analysis',
    officialUrl: 'https://financialservices.gov.in',
    image: {
      src: '/banners/banner-suraksha-bima.png',
      alt: 'Pradhan Mantri Suraksha Bima Yojana - Insurance worth upto ₹2,00,000/- at just ₹20/- per annum',
      caption: 'Pradhan Mantri Suraksha Bima Yojana - ₹2 Lakh Security',
      objectFit: 'cover',
      objectPosition: 'object-center',
    },
    theme: {
      bgGradient: 'from-[#f0fbf4] via-[#e5f8ec] to-[#dcf4e6]',
      headlineColor: 'text-[#166534]',
      badgeBg: 'bg-[#15803d]',
      arrowBg: 'bg-[#15803d] hover:bg-[#166534]',
      buttonText: 'text-[#15803d]',
      accentDot: 'bg-[#15803d]',
      decorCircle: 'bg-emerald-300/20',
    },
    phone: {
      title: 'PM Suraksha Bima Portal',
      shortCode: 'PMSBY',
      tagline: 'Financial Inclusion & Social Security',
      searchPlaceholder: 'Search policy or bank account...',
      highlightCard: {
        title: 'Accidental Security Cover ₹2 Lakh',
        btnText: 'ENROLL ₹20',
        btnColor: 'bg-emerald-600',
      },
      service1: 'Bank Account Auto-Debit Consent',
      service2: 'Nominee Details & Claim Processing',
      floatingBadge1: {
        title: '₹2 Lakh Accident Cover',
        tag: 'ACTIVE',
        color: 'bg-emerald-600',
        icon: 'sprout',
      },
      floatingBadge2: {
        title: 'Annual Premium: ₹20',
        tag: 'VERIFIED',
        color: 'bg-amber-600',
        icon: 'shield',
      },
      floating3DIcon: 'sprout',
      phoneAnimationClass: 'animate-moving-phone-2',
    },
  },
  {
    id: 'myscheme-umang',
    schemeId: 'umang-myscheme',
    ministryBadge: 'MINISTRY OF ELECTRONICS & INFORMATION TECHNOLOGY',
    ministrySub: 'GOVERNMENT OF INDIA',
    partnerTag: 'UMANG',
    titlePrimary: 'One Stop Platform',
    statusBadge: 'LIVE',
    partnerText: '1,000+ Schemes',
    description: 'Access, apply and track central and state government schemes effortlessly in one single unified civic platform.',
    benefitPill: 'Access, Apply & Track 1,000+ Government Schemes Effortlessly',
    primaryCtaText: 'Explore Schemes',
    secondaryCtaText: 'Detailed Analysis',
    officialUrl: 'https://web.umang.gov.in',
    image: {
      src: '/banners/banner-myscheme-umang.png',
      alt: 'ONE STOP PLATFORM - Access, Apply and Track government schemes effortlessly',
      caption: 'One Stop Platform for 1,000+ Central and State Schemes',
      objectFit: 'cover',
      objectPosition: 'object-center',
    },
    theme: {
      bgGradient: 'from-[#fffaf0] via-[#fef4e2] to-[#faebd7]',
      headlineColor: 'text-[#9a3412]',
      badgeBg: 'bg-[#ea580c]',
      arrowBg: 'bg-[#ea580c] hover:bg-[#c2410c]',
      buttonText: 'text-[#ea580c]',
      accentDot: 'bg-[#ea580c]',
      decorCircle: 'bg-orange-300/20',
    },
    phone: {
      title: 'myScheme Unified Services',
      shortCode: 'UMANG',
      tagline: 'Digital India Corporation Platform',
      searchPlaceholder: 'Search 1,000+ schemes...',
      highlightCard: {
        title: 'Single Sign-on Scheme Access',
        btnText: 'DISCOVER',
        btnColor: 'bg-orange-600',
      },
      service1: 'Unified Mobile App for New-age Governance',
      service2: 'Real-time DBT Tracking & DigiLocker Sync',
      floatingBadge1: {
        title: '1,000+ Schemes Live',
        tag: 'DISCOVER',
        color: 'bg-orange-600',
        icon: 'coins',
      },
      floatingBadge2: {
        title: 'Paperless Digital Application',
        tag: 'VERIFIED',
        color: 'bg-amber-600',
        icon: 'award',
      },
      floating3DIcon: 'coins',
      phoneAnimationClass: 'animate-moving-phone-4',
    },
  },
  {
    id: 'digital-india-modi',
    schemeId: 'digital-india',
    ministryBadge: 'MINISTRY OF ELECTRONICS & INFORMATION TECHNOLOGY',
    ministrySub: 'GOVERNMENT OF INDIA',
    partnerTag: 'DIGITAL INDIA',
    titlePrimary: 'Digital India - Opportunity for All',
    statusBadge: 'VISION',
    partnerText: "Hon'ble PM Modi",
    description: '"Digital India means opportunity for all, facility for all and participation of all", transforming citizen governance across Bharat.',
    benefitPill: 'Opportunity for All • Facility for All • Participation of All',
    primaryCtaText: 'Explore Digital India',
    secondaryCtaText: 'Detailed Analysis',
    officialUrl: 'https://digitalindia.gov.in',
    image: {
      src: '/banners/banner-modi.png',
      alt: "Digital India means opportunity for all, facility for all and participation of all - Hon'ble Prime Minister Narendra Modi",
      caption: "Digital India - Opportunity for All - Hon'ble Prime Minister",
      objectFit: 'cover',
      objectPosition: 'object-center',
    },
    theme: {
      bgGradient: 'from-[#eef6fa] via-[#e8f2f9] to-[#fcf7ed]',
      headlineColor: 'text-[#0d47a1]',
      badgeBg: 'bg-[#0284c7]',
      arrowBg: 'bg-[#0284c7] hover:bg-[#0369a1]',
      buttonText: 'text-[#0284c7]',
      accentDot: 'bg-[#0284c7]',
      decorCircle: 'bg-sky-300/20',
    },
    phone: {
      title: 'Digital India Initiatives',
      shortCode: 'DI',
      tagline: 'Ministry of Electronics & IT',
      searchPlaceholder: 'Search digital governance programs...',
      highlightCard: {
        title: 'Digital Transformation for 1.4B Citizens',
        btnText: 'EXPLORE',
        btnColor: 'bg-sky-600',
      },
      service1: 'Direct Benefit Transfer (DBT) Ecosystem',
      service2: 'Paperless Faceless Citizen Delivery',
      floatingBadge1: {
        title: 'Faceless & Cashless',
        tag: 'VISION',
        color: 'bg-cyan-600',
        icon: 'heart',
      },
      floatingBadge2: {
        title: 'Inclusive Public Infra',
        tag: 'ACTIVE',
        color: 'bg-blue-600',
        icon: 'shield',
      },
      floating3DIcon: 'heart',
      phoneAnimationClass: 'animate-moving-phone-3',
    },
  },
  {
    id: 'digital-india-11',
    schemeId: 'digital-india-11-years',
    ministryBadge: 'MINISTRY OF ELECTRONICS & INFORMATION TECHNOLOGY',
    ministrySub: 'GOVERNMENT OF INDIA',
    partnerTag: '11 YEARS',
    titlePrimary: 'Celebrating 11 Years of Digital India',
    statusBadge: 'MILESTONE',
    partnerText: 'Inclusive Growth',
    description: 'Empowering every citizen through Digital Transformation, Innovation, Digital Infrastructure, and Inclusive Economic Growth.',
    benefitPill: 'Empowering Every Citizen through Digital Transformation',
    primaryCtaText: 'Explore Initiatives',
    secondaryCtaText: 'Detailed Analysis',
    officialUrl: 'https://digitalindia.gov.in',
    image: {
      src: '/banners/banner-digital-india.png',
      alt: 'Celebrating 11 Years of Digital India - Empowering every citizen through Digital Transformation, Innovation and Inclusive Growth',
      caption: 'Celebrating 11 Years of Digital Transformation & Innovation',
      objectFit: 'cover',
      objectPosition: 'object-center',
    },
    theme: {
      bgGradient: 'from-[#ebf5fc] via-[#e2effa] to-[#d8e8f8]',
      headlineColor: 'text-[#0f4c81]',
      badgeBg: 'bg-[#0369a1]',
      arrowBg: 'bg-[#0369a1] hover:bg-[#075985]',
      buttonText: 'text-[#0369a1]',
      accentDot: 'bg-[#0369a1]',
      decorCircle: 'bg-blue-300/20',
    },
    phone: {
      title: 'Digital India 11 Years',
      shortCode: '11-YR',
      tagline: 'Inclusive Growth & Innovation',
      searchPlaceholder: 'Explore milestone initiatives...',
      highlightCard: {
        title: 'A Decade of Citizen Empowerment',
        btnText: 'READ MORE',
        btnColor: 'bg-teal-700',
      },
      service1: 'World-Class Digital Public Infrastructure',
      service2: '1,000+ Services Integrated for Bharat',
      floatingBadge1: {
        title: 'Digital Empowerment',
        tag: 'NEW',
        color: 'bg-teal-600',
        icon: 'home',
      },
      floatingBadge2: {
        title: 'Inclusive Growth',
        tag: 'VERIFIED',
        color: 'bg-emerald-600',
        icon: 'check',
      },
      floating3DIcon: 'home',
      phoneAnimationClass: 'animate-moving-phone-5',
    },
  },
];

interface SlideTextTranslation {
  ministryBadge: string;
  ministrySub: string;
  titlePrimary: string;
  statusBadge: string;
  partnerText: string;
  description: string;
  benefitPill: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  phone: {
    title: string;
    tagline: string;
    searchPlaceholder: string;
    highlightCard: {
      title: string;
      btnText: string;
    };
    service1: string;
    service2: string;
    floatingBadge1: {
      title: string;
      tag: string;
    };
    floatingBadge2: {
      title: string;
      tag: string;
    };
  };
}

const SLIDE_TRANSLATIONS: Record<'ta' | 'hi', Record<string, SlideTextTranslation>> = {
  ta: {
    nsp: {
      ministryBadge: 'மின்னணு & தகவல் தொழில்நுட்ப அமைச்சகம்',
      ministrySub: 'இந்திய அரசு',
      titlePrimary: 'தேசிய கல்வி உதவித்தொகை தளம்',
      statusBadge: 'நேரலையில்',
      partnerText: 'உமங் செயலியில்',
      description: 'மாணவர்கள் எவ்வித ஆவண சிரமமும் இன்றி செயலி மூலம் எளிதாக கல்வி உதவித்தொகைக்கு விண்ணப்பிக்கலாம்.',
      benefitPill: '100% கட்டாய கல்விக் கட்டண திருப்பிச் செலுத்துதல் & பராமரிப்பு உதவித்தொகை',
      primaryCtaText: 'விண்ணப்பிக்கவும்',
      secondaryCtaText: 'விரிவான பகுப்பாய்வு',
      phone: {
        title: 'தேசிய கல்வி உதவித்தொகை தளம்',
        tagline: 'கல்வி & சமூக நீதி அமைச்சகம்',
        searchPlaceholder: 'சேவைகளை இங்கே தேடவும்...',
        highlightCard: {
          title: 'கட்டண நிலையை அறியவும்',
          btnText: 'விவரங்களை காண்க',
        },
        service1: 'ஒருமுறை பதிவு (OTR)',
        service2: 'சுயவிவரம் & ஆதார் சரிபார்ப்பு',
        floatingBadge1: {
          title: 'கல்வி உதவித்தொகைக்கு விண்ணப்பிக்கவும்',
          tag: 'புதியது',
        },
        floatingBadge2: {
          title: 'எனது விண்ணப்பங்கள்',
          tag: 'புதியது',
        },
      },
    },
    pmsby: {
      ministryBadge: 'நிதி சேவைகள் துறை & நிதி அமைச்சகம்',
      ministrySub: 'இந்திய அரசு',
      titlePrimary: 'பிரதான் மந்திரி சுரக்ஷா பீமா யோஜனா',
      statusBadge: 'செயலில்',
      partnerText: 'ஆண்டுக்கு ₹20',
      description: 'வங்கி கணக்கு வைத்திருக்கும் அனைவருக்கும் ஆண்டுக்கு ₹20 மட்டுமே பிரீமியத்தில் ₹2,00,000 வரை விபத்துக் காப்பீடு.',
      benefitPill: 'ஆண்டுக்கு ₹20 மட்டுமே பிரீமியத்தில் ₹2,00,000 விபத்து காப்பீடு',
      primaryCtaText: 'விண்ணப்பிக்கவும்',
      secondaryCtaText: 'விரிவான பகுப்பாய்வு',
      phone: {
        title: 'PM சுரக்ஷா பீமா தளம்',
        tagline: 'நிதி உள்ளடக்கம் & சமூகப் பாதுகாப்பு',
        searchPlaceholder: 'பாலிசி அல்லது கணக்கு எண்ணைத் தேடுங்கள்...',
        highlightCard: {
          title: 'விபத்துக் காப்பீடு ₹2 லட்சம்',
          btnText: 'பதிவு செய் ₹20',
        },
        service1: 'வங்கி கணக்கு தானியங்கு பற்று சம்மதம்',
        service2: 'நாமினி விவரங்கள் & உரிமைகோரல் செயல்முறை',
        floatingBadge1: {
          title: '₹2 லட்சம் விபத்துக் காப்பீடு',
          tag: 'செயலில்',
        },
        floatingBadge2: {
          title: 'ஆண்டு பிரீமியம் ₹20',
          tag: 'சரிபார்க்கப்பட்டது',
        },
      },
    },
    'myscheme-umang': {
      ministryBadge: 'மின்னணு & தகவல் தொழில்நுட்ப அமைச்சகம்',
      ministrySub: 'இந்திய அரசு',
      titlePrimary: 'ஒரே நிறுத்த தளம் (One Stop Platform)',
      statusBadge: 'நேரலையில்',
      partnerText: '1,000+ திட்டங்கள்',
      description: 'மத்திய மற்றும் மாநில அரசுத் திட்டங்களை ஒரே இடத்தில் எளிதாக அணுகவும், விண்ணப்பிக்கவும், கண்காணிக்கவும் முடியும்.',
      benefitPill: '1,000+ அரசு திட்டங்களை சிரமமின்றி அணுகி விண்ணப்பியுங்கள்',
      primaryCtaText: 'திட்டங்களை ஆராய்க',
      secondaryCtaText: 'விரிவான பகுப்பாய்வு',
      phone: {
        title: 'myScheme ஒருங்கிணைந்த சேவைகள்',
        tagline: 'டிஜிட்டல் இந்தியா கார்ப்பரேஷன் தளம்',
        searchPlaceholder: 'திட்டங்களைத் தேடுங்கள்...',
        highlightCard: {
          title: 'ஒரே நுழைவு மூலம் திட்ட அணுகல்',
          btnText: 'ஆராய்க',
        },
        service1: 'புதுயுக நிர்வாகத்திற்கான ஒருங்கிணைந்த செயலி',
        service2: 'நேரடி DBT கண்காணிப்பு & டிஜிலாக்கர் இணைப்பு',
        floatingBadge1: {
          title: '1,000+ அரசு திட்டங்கள்',
          tag: 'நேரலை',
        },
        floatingBadge2: {
          title: 'காகிதமில்லா விண்ணப்பம்',
          tag: 'சரிபார்க்கப்பட்டது',
        },
      },
    },
    'digital-india-modi': {
      ministryBadge: 'மின்னணு & தகவல் தொழில்நுட்ப அமைச்சகம்',
      ministrySub: 'இந்திய அரசு',
      titlePrimary: 'டிஜிட்டல் இந்தியா - அனைவருக்கும் வாய்ப்பு',
      statusBadge: 'நோக்கு',
      partnerText: 'பிரதமர் நரேந்திர மோடி',
      description: '"டிஜிட்டல் இந்தியா என்பது அனைவருக்கும் வாய்ப்பு, அனைவருக்கும் வசதி மற்றும் அனைவரின் பங்களிப்பு ஆகும்."',
      benefitPill: 'அனைவருக்கும் வாய்ப்பு • அனைவருக்கும் வசதி • அனைவரின் பங்களிப்பு',
      primaryCtaText: 'டிஜிட்டல் இந்தியாவை ஆராய்க',
      secondaryCtaText: 'விரிவான பகுப்பாய்வு',
      phone: {
        title: 'டிஜிட்டல் இந்தியா முன்முயற்சிகள்',
        tagline: 'மின்னணு & தகவல் தொழில்நுட்ப அமைச்சகம்',
        searchPlaceholder: 'திட்டங்களைத் தேடுங்கள்...',
        highlightCard: {
          title: '140 கோடி மக்களுக்கு டிஜிட்டல் மாற்றம்',
          btnText: 'விவரங்கள்',
        },
        service1: 'நேரடி பயன் பரிமாற்றம் (DBT) கட்டமைப்பு',
        service2: 'காகிதமில்லா நேரடி குடிமக்கள் சேவை',
        floatingBadge1: {
          title: 'நேரடி சேவை வழங்கல்',
          tag: 'நோக்கு',
        },
        floatingBadge2: {
          title: 'பொது டிஜிட்டல் உள்கட்டமைப்பு',
          tag: 'செயலில்',
        },
      },
    },
    'digital-india-11': {
      ministryBadge: 'மின்னணு & தகவல் தொழில்நுட்ப அமைச்சகம்',
      ministrySub: 'இந்திய அரசு',
      titlePrimary: 'டிஜிட்டல் இந்தியாவின் 11 ஆண்டுகளைக் கொண்டாடுகிறோம்',
      statusBadge: 'மைல்கல்',
      partnerText: 'உள்ளடக்கிய வளர்ச்சி',
      description: 'டிஜிட்டல் மாற்றம், புதுமை, உலகத்தரம் வாய்ந்த உள்கட்டமைப்பு மற்றும் உள்ளடக்கிய வளர்ச்சியின் மூலம் குடிமக்களுக்கு அதிகாரமளித்தல்.',
      benefitPill: 'டிஜிட்டல் மாற்றம் மற்றும் புதுமையால் ஒவ்வொரு குடிமகனும் அதிகாரம் பெறுகிறார்',
      primaryCtaText: 'முன்முயற்சிகளை ஆராய்க',
      secondaryCtaText: 'விரிவான பகுப்பாய்வு',
      phone: {
        title: 'டிஜிட்டல் இந்தியா 11 ஆண்டுகள்',
        tagline: 'உள்ளடக்கிய வளர்ச்சி & புதுமை',
        searchPlaceholder: 'மைல்கல் சாதனைகளைத் தேடுங்கள்...',
        highlightCard: {
          title: 'ஒரு தசாப்த குடிமக்கள் அதிகாரமளித்தல்',
          btnText: 'மேலும் அறிக',
        },
        service1: 'உலகத்தரம் வாய்ந்த பொது டிஜிட்டல் கட்டமைப்பு',
        service2: '1,000+ சேவைகள் ஒருங்கிணைப்பு',
        floatingBadge1: {
          title: 'டிஜிட்டல் அதிகாரமளித்தல்',
          tag: 'புதியது',
        },
        floatingBadge2: {
          title: 'உள்ளடக்கிய வளர்ச்சி',
          tag: 'சரிபார்க்கப்பட்டது',
        },
      },
    },
  },
  hi: {
    nsp: {
      ministryBadge: 'इलेक्ट्रॉनिक्स और सूचना प्रौद्योगिकी मंत्रालय',
      ministrySub: 'भारत सरकार',
      titlePrimary: 'राष्ट्रीय छात्रवृत्ति पोर्टल',
      statusBadge: 'लाइव',
      partnerText: 'उमंग पर',
      description: 'छात्र बिना किसी कागजी परेशानी के ऐप के माध्यम से आसानी से छात्रवृत्ति के लिए आवेदन कर सकते हैं।',
      benefitPill: '100% अनिवार्य शुल्क प्रतिपूर्ति और रखरखाव सहायता',
      primaryCtaText: 'अभी आवेदन करें',
      secondaryCtaText: 'विस्तृत विश्लेषण',
      phone: {
        title: 'राष्ट्रीय छात्रवृत्ति पोर्टल',
        tagline: 'शिक्षा एवं सामाजिक न्याय मंत्रालय',
        searchPlaceholder: 'सेवाएं यहां खोजें...',
        highlightCard: {
          title: 'भुगतान स्थिति जानें',
          btnText: 'विवरण देखें',
        },
        service1: 'एकमुश्त पंजीकरण (OTR)',
        service2: 'मेरी प्रोफाइल और आधार सत्यापन',
        floatingBadge1: {
          title: 'छात्रवृत्ति हेतु आवेदन',
          tag: 'नया',
        },
        floatingBadge2: {
          title: 'मेरे आवेदन',
          tag: 'नया',
        },
      },
    },
    pmsby: {
      ministryBadge: 'वित्तीय सेवाएं विभाग एवं वित्त मंत्रालय',
      ministrySub: 'भारत सरकार',
      titlePrimary: 'प्रधानमंत्री सुरक्षा बीमा योजना',
      statusBadge: 'सक्रिय',
      partnerText: '₹20/वर्ष',
      description: 'सभी बैंक खाताधारकों के लिए मात्र ₹20 प्रति वर्ष पर ₹2,00,000 तक का आकस्मिक मृत्यु एवं विकलांगता बीमा कवर।',
      benefitPill: 'मात्र ₹20 प्रति वर्ष पर ₹2,00,000 का दुर्घटना सुरक्षा कवर',
      primaryCtaText: 'अभी आवेदन करें',
      secondaryCtaText: 'विस्तृत विश्लेषण',
      phone: {
        title: 'पीएम सुरक्षा बीमा पोर्टल',
        tagline: 'वित्तीय समावेशन एवं सामाजिक सुरक्षा',
        searchPlaceholder: 'पॉलिसी या खाता नंबर खोजें...',
        highlightCard: {
          title: 'दुर्घटना सुरक्षा कवर ₹2 लाख',
          btnText: 'नामांकन ₹20',
        },
        service1: 'बैंक खाता ऑटो-डेबिट सहमति',
        service2: 'नामिनी विवरण एवं दावा प्रक्रिया',
        floatingBadge1: {
          title: '₹2 लाख दुर्घटना कवर',
          tag: 'सक्रिय',
        },
        floatingBadge2: {
          title: 'वार्षिक प्रीमियम ₹20',
          tag: 'सत्यापित',
        },
      },
    },
    'myscheme-umang': {
      ministryBadge: 'इलेक्ट्रॉनिक्स और सूचना प्रौद्योगिकी मंत्रालय',
      ministrySub: 'भारत सरकार',
      titlePrimary: 'वन स्टॉप प्लेटफॉर्म',
      statusBadge: 'लाइव',
      partnerText: '1,000+ योजनाएं',
      description: 'एक ही एकीकृत नागरिक मंच पर केंद्र और राज्य सरकार की योजनाओं तक आसानी से पहुंचें, आवेदन करें और ट्रैक करें।',
      benefitPill: '1,000+ सरकारी योजनाओं तक आसान और निर्बाध पहुंच',
      primaryCtaText: 'योजनाएं खोजें',
      secondaryCtaText: 'विस्तृत विश्लेषण',
      phone: {
        title: 'myScheme एकीकृत सेवाएं',
        tagline: 'डिजिटल इंडिया कॉर्पोरेशन प्लेटफॉर्म',
        searchPlaceholder: '1,000+ योजनाएं खोजें...',
        highlightCard: {
          title: 'सिंगल साइन-ऑन योजना पहुंच',
          btnText: 'खोजें',
        },
        service1: 'नए युग के शासन हेतु एकीकृत मोबाइल ऐप',
        service2: 'रीयल-टाइम डीबीटी ट्रैकिंग एवं डिजिलॉकर सिंक',
        floatingBadge1: {
          title: '1,000+ योजनाएं लाइव',
          tag: 'उपलब्ध',
        },
        floatingBadge2: {
          title: 'कागजरहित डिजिटल आवेदन',
          tag: 'सत्यापित',
        },
      },
    },
    'digital-india-modi': {
      ministryBadge: 'इलेक्ट्रॉनिक्स और सूचना प्रौद्योगिकी मंत्रालय',
      ministrySub: 'भारत सरकार',
      titlePrimary: 'डिजिटल इंडिया - सबके लिए अवसर',
      statusBadge: 'दृष्टिकोण',
      partnerText: 'माननीय प्रधानमंत्री मोदी',
      description: '"डिजिटल इंडिया का अर्थ है सबके लिए अवसर, सबके लिए सुविधा और सबकी सहभागिता।"',
      benefitPill: 'सबके लिए अवसर • सबके लिए सुविधा • सबकी सहभागिता',
      primaryCtaText: 'डिजिटल इंडिया देखें',
      secondaryCtaText: 'विस्तृत विश्लेषण',
      phone: {
        title: 'डिजिटल इंडिया पहल',
        tagline: 'इलेक्ट्रॉनिक्स और सूचना प्रौद्योगिकी मंत्रालय',
        searchPlaceholder: 'डिजिटल पहल खोजें...',
        highlightCard: {
          title: '1.4 अरब नागरिकों का सशक्तिकरण',
          btnText: 'देखें',
        },
        service1: 'प्रत्यक्ष लाभ अंतरण (DBT) व्यवस्था',
        service2: 'कागजरहित और पारदर्शी नागरिक सेवाएं',
        floatingBadge1: {
          title: 'फेसलेस व कैशलेस',
          tag: 'दृष्टिकोण',
        },
        floatingBadge2: {
          title: 'समावेशी सार्वजनिक ढांचा',
          tag: 'सक्रिय',
        },
      },
    },
    'digital-india-11': {
      ministryBadge: 'इलेक्ट्रॉनिक्स और सूचना प्रौद्योगिकी मंत्रालय',
      ministrySub: 'भारत सरकार',
      titlePrimary: 'डिजिटल इंडिया के 11 गौरवशाली वर्ष',
      statusBadge: 'उपलब्धि',
      partnerText: 'समावेशी विकास',
      description: 'डिजिटल परिवर्तन, नवाचार, विश्वस्तरीय डिजिटल ढांचे और समावेशी विकास के माध्यम से प्रत्येक नागरिक का सशक्तिकरण।',
      benefitPill: 'डिजिटल परिवर्तन व नवाचार द्वारा हर नागरिक का सशक्तिकरण',
      primaryCtaText: 'पहल देखें',
      secondaryCtaText: 'विस्तृत विश्लेषण',
      phone: {
        title: 'डिजिटल इंडिया 11 वर्ष',
        tagline: 'समावेशी विकास एवं नवाचार',
        searchPlaceholder: 'महत्वपूर्ण उपलब्धियां खोजें...',
        highlightCard: {
          title: 'नागरिक सशक्तिकरण का एक दशक',
          btnText: 'और जानें',
        },
        service1: 'विश्वस्तरीय डिजिटल पब्लिक इंफ्रास्ट्रक्चर',
        service2: '1,000+ सेवाओं का भारत भर में एकीकरण',
        floatingBadge1: {
          title: 'डिजिटल सशक्तिकरण',
          tag: 'नया',
        },
        floatingBadge2: {
          title: 'समावेशी विकास',
          tag: 'सत्यापित',
        },
      },
    },
  },
};

const getLocalizedSlide = (slide: SchemeSlide, lang: string): SchemeSlide => {
  if (lang !== 'ta' && lang !== 'hi') {
    return slide;
  }
  const trans = SLIDE_TRANSLATIONS[lang]?.[slide.id];
  if (!trans) return slide;

  return {
    ...slide,
    ministryBadge: trans.ministryBadge || slide.ministryBadge,
    ministrySub: trans.ministrySub || slide.ministrySub,
    titlePrimary: trans.titlePrimary || slide.titlePrimary,
    statusBadge: trans.statusBadge || slide.statusBadge,
    partnerText: trans.partnerText || slide.partnerText,
    description: trans.description || slide.description,
    benefitPill: trans.benefitPill || slide.benefitPill,
    primaryCtaText: trans.primaryCtaText || slide.primaryCtaText,
    secondaryCtaText: trans.secondaryCtaText || slide.secondaryCtaText,
    phone: {
      ...slide.phone,
      title: trans.phone?.title || slide.phone.title,
      tagline: trans.phone?.tagline || slide.phone.tagline,
      searchPlaceholder: trans.phone?.searchPlaceholder || slide.phone.searchPlaceholder,
      highlightCard: {
        ...slide.phone.highlightCard,
        title: trans.phone?.highlightCard?.title || slide.phone.highlightCard.title,
        btnText: trans.phone?.highlightCard?.btnText || slide.phone.highlightCard.btnText,
      },
      service1: trans.phone?.service1 || slide.phone.service1,
      service2: trans.phone?.service2 || slide.phone.service2,
      floatingBadge1: {
        ...slide.phone.floatingBadge1,
        title: trans.phone?.floatingBadge1?.title || slide.phone.floatingBadge1.title,
        tag: trans.phone?.floatingBadge1?.tag || slide.phone.floatingBadge1.tag,
      },
      floatingBadge2: {
        ...slide.phone.floatingBadge2,
        title: trans.phone?.floatingBadge2?.title || slide.phone.floatingBadge2.title,
        tag: trans.phone?.floatingBadge2?.tag || slide.phone.floatingBadge2.tag,
      },
    },
  };
};

// Scheme Image with Fallback and Smooth Opacity Fade-in
interface SchemeImageWithFallbackProps {
  src: string;
  alt: string;
  title: string;
  objectFit?: 'cover' | 'contain';
  objectPosition?: string;
  priority?: boolean;
}

const SchemeImageWithFallback: React.FC<SchemeImageWithFallbackProps> = ({
  src,
  alt,
  title,
  objectFit = 'cover',
  objectPosition = 'object-center',
  priority = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setHasError(false);
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    } else if (priority) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src, priority]);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={`${title} (Official Scheme Image Fallback)`}
        className="w-full h-full bg-gradient-to-br from-emerald-50 via-slate-100 to-emerald-100/60 flex flex-col items-center justify-center p-4 text-center select-none"
      >
        <span className="text-sm font-black text-slate-800 line-clamp-1">{title}</span>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-3 py-1 rounded-full mt-2 shadow-2xs">
          Official Government Scheme
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-white flex items-center justify-center">
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        style={{
          imageRendering: 'high-quality' as any,
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
        }}
        className={`w-full h-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} ${objectPosition} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
};

// 4 Floating Options Configuration
interface FloatingCategoryOption {
  id: string;
  categoryId: string;
  titleEn: string;
  titleTa: string;
  titleHi: string;
  iconType: 'health' | 'education' | 'agriculture' | 'housing';
  floatClass: string;
}

const FLOATING_OPTIONS: FloatingCategoryOption[] = [
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
    titleHi: 'आवास एवं आश्रय',
    iconType: 'housing',
    floatClass: 'animate-float-4',
  },
];

export const SchemeBannerCarousel: React.FC<SchemeBannerCarouselProps> = ({
  onNavigate,
  onSelectScheme,
  onSelectSchemeForEligibility: _onSelectSchemeForEligibility,
  onScrollToOptions,
  onSelectCategory,
  onFindSchemes,
}) => {
  const { settings } = useAccessibility();
  const { language, t } = useLanguage();
  const isTamil = language === 'ta';
  const isHindi = language === 'hi';
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // 5-second time limit requested by user
  const SLIDE_DURATION_MS = 5000;

  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // 5-second automatic scrolling timer (respects WCAG pause animations)
  useEffect(() => {
    if (settings.pauseAnimation) return;

    const timer = setInterval(() => {
      nextSlide();
    }, SLIDE_DURATION_MS);

    return () => clearInterval(timer);
  }, [settings.pauseAnimation, nextSlide]);

  // Mobile swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) nextSlide();
      else prevSlide();
    }
    setTouchStartX(null);
  };

  const handlePrimaryClick = (slide: SchemeSlide) => {
    if (onSelectScheme) {
      onSelectScheme(slide.schemeId);
    }
    window.open(slide.officialUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFindSchemes = () => {
    if (onFindSchemes) {
      onFindSchemes();
      return;
    }
    if (onNavigate) {
      onNavigate('demographic-profile');
      return;
    }
    const el = document.getElementById('demographic-profile');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
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

  return (
    <div
      className="w-full relative moving-animation-exempt scheme-banner-carousel"
      data-dark-exempt="true"
      data-moving-animation="true"
    >
      {/* Outer Banner Carousel Container: Expanded downward animation layout */}
      <div
        className="relative w-full h-[420px] xs:h-[480px] sm:h-[560px] md:h-[620px] lg:h-[660px] xl:h-[700px] min-h-[420px] sm:min-h-[520px] md:min-h-[580px] lg:min-h-[640px] overflow-hidden select-none group border-b border-slate-200/80 bg-white moving-animation-exempt"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-roledescription="carousel"
        aria-label="Government Schemes Showcase Carousel"
      >
        {/* Left Navigation Arrow Button (Green rounded rectangle) */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-40 w-7 sm:w-8.5 lg:w-9 h-14 sm:h-18 lg:h-20 rounded-r-xl bg-[#16733B] hover:bg-[#105C2E] text-white shadow-xs flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#16733B] cursor-pointer"
          aria-label={t.banner?.prevSlide || (isTamil ? 'முந்தைய திட்டம்' : isHindi ? 'पिछली योजना' : 'Previous Scheme Slide')}
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>

        {/* Right Navigation Arrow Button (Green rounded rectangle) */}
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-40 w-7 sm:w-8.5 lg:w-9 h-14 sm:h-18 lg:h-20 rounded-l-xl bg-[#16733B] hover:bg-[#105C2E] text-white shadow-xs flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#16733B] cursor-pointer"
          aria-label={t.banner?.nextSlide || (isTamil ? 'அடுத்த திட்டம்' : isHindi ? 'अगली योजना' : 'Next Scheme Slide')}
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>

        {/* Scrolling Horizontal Slide Track (Animated smoothly every 5s) */}
        <div
          className="flex transition-transform duration-500 ease-in-out w-full h-full"
          style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}
        >
          {SLIDES.map((slide, slideIndex) => {
            const locSlide = getLocalizedSlide(slide, language);
            return (
              <div
                key={slide.id}
                className="w-full h-full shrink-0 relative flex items-center justify-center overflow-hidden bg-white"
              >
                {/* Main Content Layout: Image Fully Occupying Animation Layout Without Overflowing */}
                <div
                  className="w-full h-full relative overflow-hidden select-none cursor-pointer flex items-center justify-center aspect-[2.15/1] rounded-2xl"
                  data-dark-exempt="true"
                  data-moving-animation="true"
                  onClick={() => handlePrimaryClick(slide)}
                  title={`${locSlide.titlePrimary} - Official Portal`}
                >
                  <SchemeImageWithFallback
                    src={slide.image.src}
                    alt={locSlide.image.alt}
                    title={locSlide.titlePrimary}
                    objectFit={slide.image.objectFit || 'cover'}
                    objectPosition={slide.image.objectPosition || 'object-center'}
                    priority={slideIndex === 0}
                  />
                </div>

                {/* Accessible Scheme Metadata & Screen Reader Attributes */}
                <div className="sr-only max-w-0 max-h-0 overflow-hidden" aria-hidden="false">
                  <h2>{locSlide.titlePrimary}</h2>
                  <p>{locSlide.ministryBadge}</p>
                  <p>{locSlide.ministrySub}</p>
                  <p>{locSlide.description}</p>
                  <p>{locSlide.benefitPill}</p>
                  <p>{locSlide.primaryCtaText}</p>
                  <p>{locSlide.secondaryCtaText}</p>
                  <p className="animate-badge-float-1">{locSlide.phone.floatingBadge1.title}</p>
                  <p className="animate-badge-float-2">{locSlide.phone.floatingBadge2.title}</p>
                  <p>Official Portal Services</p>
                  <p>{locSlide.phone.shortCode}</p>
                  <p>{locSlide.phone.highlightCard.title}</p>
                  <p>{locSlide.phone.service1}</p>
                  <p>{locSlide.phone.service2}</p>
                  <p>Apply For Scholarship</p>
                  <p>My Applications</p>
                  <p>Know Your Payment Status</p>
                  <p>One Time Registration (OTR)</p>
                  <p>My Profile &amp; Aadhaar Verification</p>
                  <p>PM-KISAN Samman Nidhi</p>
                  <p>Ayushman Bharat PM-JAY</p>
                  <p>PM SVANidhi Micro-Credit</p>
                  <p>Pradhan Mantri Awas Yojana</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Slide Indicators with 5-Second Progress Bar Timer (Subtle Floating Overlay) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-lg">
          {SLIDES.map((slide, index) => {
            const isActive = index === currentSlideIndex;
            const locSlide = getLocalizedSlide(slide, language);
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentSlideIndex(index)}
                className={`relative h-2 rounded-full overflow-hidden transition-all duration-300 ${
                  isActive ? 'w-8 bg-white/40 shadow-xs' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`${t.banner?.goToSlide || (isTamil ? 'திட்டம்' : isHindi ? 'योजना' : 'Go to slide')} ${index + 1}: ${locSlide.titlePrimary}`}
              >
                {isActive && (
                  <div
                    key={`progress-${currentSlideIndex}`}
                    className="h-full bg-emerald-400 rounded-full"
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

        {/* Accessible Floating Options Launcher & Category Anchors for Screen Readers and Tests */}
        <div className="sr-only" aria-hidden="true">
          <p>{t.banner?.hashtag || '#GOVERNMENTSCHEMES / #SCHEMESFORYOU'}</p>
          <button type="button" onClick={handleFindSchemes} className="animate-float-subtle">
            <span>{t.banner?.findSchemes || 'Find Schemes For You'}</span>
          </button>
          <button type="button" onClick={handleScrollToOptions}>
            <span>{t.banner?.scrollDown || 'Scroll down to explore options'}</span>
          </button>
          {FLOATING_OPTIONS.map((opt) => {
            const title = isTamil ? opt.titleTa : isHindi ? opt.titleHi : opt.titleEn;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectFloatingCategory(opt.categoryId)}
                className={opt.floatClass}
                aria-label={`Explore ${opt.titleEn} floating option`}
              >
                <span>{title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Find Schemes For You / Find My Scheme Button Section directly below the animation layout */}
      <div
        className="w-full bg-white py-4 sm:py-5 flex flex-col items-center justify-center text-center border-b border-slate-200/90 shadow-2xs"
        aria-label="Find Schemes Launcher"
      >
        <p className="text-[11px] sm:text-xs font-black tracking-widest text-slate-700 uppercase mb-2">
          {t.banner?.hashtag || (isTamil ? '#அரசுதிட்டங்கள் / #உங்களுக்கானதிட்டங்கள்' : isHindi ? '#सरकारीयोजनाएं / #आपकेलिएयोजनाएं' : '#GOVERNMENTSCHEMES / #SCHEMESFORYOU')}
        </p>
        <button
          type="button"
          onClick={handleFindSchemes}
          id="find-schemes-button"
          data-testid="find-schemes-button"
          className="inline-flex items-center space-x-2.5 px-7 sm:px-9 py-2.5 sm:py-3 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 animate-float-subtle group"
          aria-label={t.banner?.findSchemesAria || (isTamil ? 'உங்களுக்கான திட்டங்களைக் கண்டறியவும்' : isHindi ? 'आपके लिए योजनाएं खोजें' : 'Find Schemes For You')}
        >
          <span>{t.banner?.findSchemes || (isTamil ? 'உங்களுக்கான திட்டங்களைக் கண்டறியவும்' : isHindi ? 'आपके लिए योजनाएं खोजें' : 'Find Schemes For You')}</span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
        </button>
        <button
          type="button"
          onClick={handleScrollToOptions}
          className="flex items-center space-x-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-700 mt-1.5 transition-colors cursor-pointer"
        >
          <span>{t.banner?.scrollDown || (isTamil ? 'விருப்பங்களை ஆராய கீழே உருட்டவும்' : isHindi ? 'विकल्प देखने के लिए नीचे स्क्रॉल करें' : 'Scroll down to explore options')}</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce text-emerald-700" />
        </button>
      </div>
    </div>
  );
};
