import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  FileText,
  Sprout,
  ShieldCheck,
  HeartPulse,
  Coins,
  Home,
  Award,
  Search,
  Wifi,
  Battery,
  Signal,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
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
    secondaryCtaText: 'Check Eligibility',
    officialUrl: 'https://scholarships.gov.in',
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
    },
  },
  {
    id: 'pm-kisan',
    schemeId: 'pm-kisan',
    ministryBadge: 'MINISTRY OF AGRICULTURE & FARMERS WELFARE',
    ministrySub: 'GOVERNMENT OF INDIA',
    partnerTag: 'DBT BHARAT',
    titlePrimary: 'PM-KISAN Samman Nidhi',
    statusBadge: 'ACTIVE',
    partnerText: '17th Installment',
    description: 'Direct income support of ₹6,000/year credited directly into bank accounts of verified farmers.',
    benefitPill: '₹6,000 Per Annum via Direct Benefit Transfer (DBT)',
    primaryCtaText: 'Apply Now',
    secondaryCtaText: 'Check Beneficiary',
    officialUrl: 'https://pmkisan.gov.in',
    theme: {
      bgGradient: 'from-[#fefcf2] via-[#f9f5e2] to-[#ecf8eb]',
      headlineColor: 'text-[#1b6b3e]',
      badgeBg: 'bg-[#16a34a]',
      arrowBg: 'bg-[#16a34a] hover:bg-[#15803d]',
      buttonText: 'text-[#16a34a]',
      accentDot: 'bg-[#16a34a]',
      decorCircle: 'bg-amber-300/20',
    },
    phone: {
      title: 'PM-KISAN Farmer Portal',
      shortCode: 'KISAN',
      tagline: 'Farmer Welfare & DBT Disbursal',
      searchPlaceholder: 'Enter Aadhaar or Mobile No...',
      highlightCard: {
        title: '17th Installment DBT Payment',
        btnText: 'CHECK DBT',
        btnColor: 'bg-emerald-600',
      },
      service1: 'e-KYC Biometric Verification',
      service2: 'Land Seeding & Bank Account Link',
      floatingBadge1: {
        title: '₹2,000 Installment DBT',
        tag: 'CREDITED',
        color: 'bg-emerald-600',
        icon: 'sprout',
      },
      floatingBadge2: {
        title: 'e-KYC Biometrics',
        tag: 'VERIFIED',
        color: 'bg-amber-600',
        icon: 'shield',
      },
      floating3DIcon: 'sprout',
    },
  },
  {
    id: 'ab-pmjay',
    schemeId: 'ab-pmjay',
    ministryBadge: 'NATIONAL HEALTH AUTHORITY & MOHFW',
    ministrySub: 'GOVERNMENT OF INDIA',
    partnerTag: 'AYUSHMAN',
    titlePrimary: 'Ayushman Bharat PM-JAY',
    statusBadge: 'CASHLESS',
    partnerText: '₹5 Lakh Health Cover',
    description: 'World’s largest health assurance scheme providing free hospitalization across 28,000+ hospitals.',
    benefitPill: '₹5,00,000 Annual Hospitalization Cover Per Family',
    primaryCtaText: 'Apply Now',
    secondaryCtaText: 'Find Hospitals',
    officialUrl: 'https://pmjay.gov.in',
    theme: {
      bgGradient: 'from-[#f0f9ff] via-[#e2f2fe] to-[#d8eefd]',
      headlineColor: 'text-[#0355a3]',
      badgeBg: 'bg-[#0284c7]',
      arrowBg: 'bg-[#0284c7] hover:bg-[#0369a1]',
      buttonText: 'text-[#0284c7]',
      accentDot: 'bg-[#0284c7]',
      decorCircle: 'bg-sky-300/20',
    },
    phone: {
      title: 'Ayushman Bharat PM-JAY',
      shortCode: 'PM-JAY',
      tagline: 'National Health Authority Digital Portal',
      searchPlaceholder: 'Search hospitals, treatments...',
      highlightCard: {
        title: 'Ayushman Card Generation',
        btnText: 'DOWNLOAD',
        btnColor: 'bg-sky-600',
      },
      service1: 'Find 28,000+ Empanelled Hospitals',
      service2: 'Cashless Treatment History',
      floatingBadge1: {
        title: 'Ayushman Golden Card',
        tag: 'NEW',
        color: 'bg-cyan-600',
        icon: 'heart',
      },
      floatingBadge2: {
        title: '₹5,00,000 Health Cover',
        tag: 'ACTIVE',
        color: 'bg-blue-600',
        icon: 'shield',
      },
      floating3DIcon: 'heart',
    },
  },
  {
    id: 'pm-svanidhi',
    schemeId: 'pm-svanidhi',
    ministryBadge: 'MINISTRY OF HOUSING & URBAN AFFAIRS',
    ministrySub: 'GOVERNMENT OF INDIA',
    partnerTag: 'SVANIDHI',
    titlePrimary: 'PM SVANidhi Micro-Credit',
    statusBadge: 'INSTANT',
    partnerText: '7% Interest Subsidy',
    description: 'Collateral-free working capital loan up to ₹50,000 with monthly digital cashback incentives.',
    benefitPill: '₹10,000 to ₹50,000 Micro-Credit with 7% Interest Subsidy',
    primaryCtaText: 'Apply Now',
    secondaryCtaText: 'Check Loan Status',
    officialUrl: 'https://pmsvanidhi.mohua.gov.in',
    theme: {
      bgGradient: 'from-[#fff8f0] via-[#feeedd] to-[#fae8ff]',
      headlineColor: 'text-[#9a3412]',
      badgeBg: 'bg-[#ea580c]',
      arrowBg: 'bg-[#ea580c] hover:bg-[#c2410c]',
      buttonText: 'text-[#ea580c]',
      accentDot: 'bg-[#ea580c]',
      decorCircle: 'bg-orange-300/20',
    },
    phone: {
      title: 'PM SVANidhi Mobile',
      shortCode: 'SVANIDHI',
      tagline: 'Urban Vendors Micro-Credit Scheme',
      searchPlaceholder: 'Search loan or vending ID...',
      highlightCard: {
        title: 'Working Capital Loan Tranche',
        btnText: 'APPLY ₹10K',
        btnColor: 'bg-orange-600',
      },
      service1: 'Certificate of Vending (CoV) Sync',
      service2: 'Monthly Digital UPI Cashback: ₹100',
      floatingBadge1: {
        title: 'Instant Loan Disbursal',
        tag: 'NEW',
        color: 'bg-orange-600',
        icon: 'coins',
      },
      floatingBadge2: {
        title: '7% Interest Subsidy',
        tag: 'ACTIVE',
        color: 'bg-amber-600',
        icon: 'award',
      },
      floating3DIcon: 'coins',
    },
  },
  {
    id: 'pmay-g',
    schemeId: 'pmay-g',
    ministryBadge: 'MINISTRY OF RURAL DEVELOPMENT',
    ministrySub: 'GOVERNMENT OF INDIA',
    partnerTag: 'AWAAS',
    titlePrimary: 'Pradhan Mantri Awas Yojana',
    statusBadge: 'APPROVED',
    partnerText: 'Pucca House',
    description: 'Financial assistance of ₹1.30 Lakh + 90 days MGNREGS wages for constructing a permanent house.',
    benefitPill: '₹1.30 Lakh Financial Assistance for Pucca House',
    primaryCtaText: 'Apply Now',
    secondaryCtaText: 'Gram Panchayat List',
    officialUrl: 'https://pmayg.nic.in',
    theme: {
      bgGradient: 'from-[#ecfdf5] via-[#e3faf0] to-[#e0f2fe]',
      headlineColor: 'text-[#0f5132]',
      badgeBg: 'bg-[#059669]',
      arrowBg: 'bg-[#059669] hover:bg-[#047857]',
      buttonText: 'text-[#059669]',
      accentDot: 'bg-[#059669]',
      decorCircle: 'bg-teal-300/20',
    },
    phone: {
      title: 'AwaasSoft Rural Housing',
      shortCode: 'PMAY-G',
      tagline: 'Ministry of Rural Development DBT',
      searchPlaceholder: 'Search registration or village...',
      highlightCard: {
        title: 'Housing Sanction Order',
        btnText: 'DOWNLOAD',
        btnColor: 'bg-teal-700',
      },
      service1: 'House Geo-tag Inspection Verification',
      service2: 'Stage-wise Direct DBT Bank Disbursal',
      floatingBadge1: {
        title: 'Pucca House Sanction',
        tag: 'NEW',
        color: 'bg-teal-600',
        icon: 'home',
      },
      floatingBadge2: {
        title: 'DBT Bank Disbursal',
        tag: 'VERIFIED',
        color: 'bg-emerald-600',
        icon: 'check',
      },
      floating3DIcon: 'home',
    },
  },
];

// Official State Emblem of India SVG (Ashoka Lion Capital with Satyameva Jayate)
const StateEmblemOfIndia: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg
    viewBox="0 0 100 120"
    fill="currentColor"
    className={className}
    aria-label="State Emblem of India"
  >
    {/* Central Lion Head & Mane */}
    <path d="M50 8 C42 8 36 14 36 22 C36 28 39 33 44 36 C42 40 39 46 39 53 C39 60 43 65 47 67 L47 72 L53 72 L53 67 C57 65 61 60 61 53 C61 46 58 40 56 36 C61 33 64 28 64 22 C64 14 58 8 50 8 Z M50 16 C53 16 56 19 56 22 C56 25 53 28 50 28 C47 28 44 25 44 22 C44 19 47 16 50 16 Z" />
    {/* Left Lion Profile */}
    <path d="M34 20 C28 20 22 25 22 32 C22 38 25 43 30 46 C28 50 26 56 27 62 C29 65 33 67 38 67 C36 61 36 53 37 46 C34 44 32 40 32 35 C32 30 35 25 38 22 C36.5 21 35.2 20.4 34 20 Z" />
    {/* Right Lion Profile */}
    <path d="M66 20 C72 20 78 25 78 32 C78 38 75 43 70 46 C72 50 74 56 73 62 C71 65 67 67 62 67 C64 61 64 53 63 46 C66 44 68 40 68 35 C68 30 65 25 62 22 C63.5 21 64.8 20.4 66 20 Z" />
    {/* Abacus / Base Platform */}
    <rect x="18" y="74" width="64" height="12" rx="3" />
    {/* Ashoka Chakra in Center */}
    <circle cx="50" cy="80" r="5" fill="none" stroke="white" strokeWidth="1.5" />
    <circle cx="50" cy="80" r="1.5" fill="white" />
    {/* Bull & Horse accents on abacus */}
    <circle cx="28" cy="80" r="2.5" fill="white" />
    <circle cx="72" cy="80" r="2.5" fill="white" />
    {/* Bell Capital Base */}
    <path d="M26 88 C34 94 42 96 50 96 C58 96 66 94 74 88 L78 94 C68 102 59 104 50 104 C41 104 32 102 22 94 Z" />
    {/* Satyameva Jayate Banner */}
    <text
      x="50"
      y="114"
      textAnchor="middle"
      fontSize="7.5"
      fontWeight="bold"
      letterSpacing="0.8"
      fill="currentColor"
    >
      सत्यமேव जयते
    </text>
  </svg>
);

// UMANG Emblem Badge matching image 1
const UmangEmblem: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <div className={`flex flex-col items-center justify-center p-1 rounded-xl bg-white border border-slate-200/90 shadow-2xs ${className}`}>
    <div className="w-5 h-6 rounded-md border-2 border-civic-600 relative flex items-center justify-center bg-civic-50">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-0.5 right-0.5" />
      <span className="text-[7px] font-black text-civic-700 leading-none">U</span>
    </div>
    <span className="text-[7px] font-black text-slate-800 tracking-tight leading-none mt-0.5">UMANG</span>
  </div>
);

// Floating Badge Icon Component
const FloatingBadgeIcon: React.FC<{ type: string; className?: string }> = ({ type, className = 'w-4 h-4' }) => {
  switch (type) {
    case 'graduation':
      return <GraduationCap className={className} />;
    case 'sprout':
      return <Sprout className={className} />;
    case 'heart':
      return <HeartPulse className={className} />;
    case 'coins':
      return <Coins className={className} />;
    case 'home':
      return <Home className={className} />;
    case 'file':
      return <FileText className={className} />;
    case 'shield':
      return <ShieldCheck className={className} />;
    case 'award':
      return <Award className={className} />;
    default:
      return <CheckCircle2 className={className} />;
  }
};

// 3D Isometric Floating Graphics
const FloatingGraphic3D: React.FC<{ type: string }> = ({ type }) => {
  if (type === 'graduation') {
    return (
      <div
        role="img"
        aria-label="3D Floating Graduation Cap"
        data-dark-exempt="true"
        className="relative animate-bounce animate-icon-bounce moving-animation-image"
      >
        <svg viewBox="0 0 100 80" className="w-16 h-14 drop-shadow-2xl">
          <polygon points="50,10 92,28 50,46 8,28" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <polygon points="50,13 88,28 50,43 12,28" fill="#0f172a" />
          <path d="M28,37 L28,52 C28,62 72,62 72,52 L72,37 Z" fill="#1e293b" />
          <path d="M32,40 L32,50 C32,58 68,58 68,50 L68,40 Z" fill="#334155" />
          <circle cx="50" cy="28" r="4" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
          <path d="M50,28 C64,28 80,38 84,48" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="81" y="47" width="6" height="12" rx="2" fill="#d97706" />
        </svg>
      </div>
    );
  }

  if (type === 'sprout') {
    return (
      <div
        role="img"
        aria-label="3D Floating Sprout"
        data-dark-exempt="true"
        className="relative animate-bounce animate-icon-bounce moving-animation-image"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 text-white flex items-center justify-center shadow-xl border-2 border-white/80">
          <Sprout className="w-8 h-8 stroke-[2.2]" />
        </div>
      </div>
    );
  }

  if (type === 'heart') {
    return (
      <div
        role="img"
        aria-label="3D Floating Heart"
        data-dark-exempt="true"
        className="relative animate-bounce animate-icon-bounce moving-animation-image"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-xl border-2 border-white/80">
          <HeartPulse className="w-8 h-8 stroke-[2.2]" />
        </div>
      </div>
    );
  }

  if (type === 'coins') {
    return (
      <div
        role="img"
        aria-label="3D Floating Coins"
        data-dark-exempt="true"
        className="relative animate-bounce animate-icon-bounce moving-animation-image"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xl border-2 border-white/80">
          <Coins className="w-8 h-8 stroke-[2.2]" />
        </div>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label="3D Floating Home"
      data-dark-exempt="true"
      className="relative animate-bounce animate-icon-bounce moving-animation-image"
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-xl border-2 border-white/80">
        <Home className="w-8 h-8 stroke-[2.2]" />
      </div>
    </div>
  );
};

// Healthcare Cross with Caring Hands Icon (matching Image 1)
const HealthcareCrossIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Healthcare & Wellness">
    {/* Central medical cross */}
    <rect x="10" y="3" width="4" height="10" rx="1" fill="#16a34a" />
    <rect x="7" y="6" width="10" height="4" rx="1" fill="#16a34a" />
    {/* Caring hands underneath */}
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

// Green Origami Paper Airplane (matching Image 1 flight path)
const PaperAirplane: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`moving-animation-image ${className}`}
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

// Citizen Mobile User Vector Graphic matching Image 1
const CitizenMobileUser: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    role="img"
    aria-label="Citizen using smartphone illustration"
    data-dark-exempt="true"
    className={`relative hidden xl:flex flex-col items-center justify-end select-none pointer-events-none moving-animation-image animate-float-subtle ${className}`}
  >
    <svg viewBox="0 0 160 280" className="w-40 h-72 drop-shadow-xl" fill="none">
      {/* Hair */}
      <path
        d="M50 45 C45 30 65 20 80 20 C95 20 115 30 110 45 C120 50 125 65 120 78 C110 82 105 75 100 80 C95 70 70 70 65 80 C60 75 55 82 45 78 C40 65 45 50 50 45 Z"
        fill="#1e293b"
      />
      {/* Face */}
      <path
        d="M55 58 C55 45 105 45 105 58 C105 85 98 100 80 100 C62 100 55 85 55 58 Z"
        fill="#d4a373"
      />
      {/* Smile & Eyes */}
      <circle cx="68" cy="68" r="2" fill="#78350f" />
      <circle cx="92" cy="68" r="2" fill="#78350f" />
      <path d="M72 82 C76 88 84 88 88 82" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
      {/* Neck */}
      <rect x="74" y="98" width="12" height="14" fill="#c68a4c" />
      {/* Blue Shirt Body */}
      <path
        d="M40 120 C55 110 105 110 120 120 L135 260 L25 260 Z"
        fill="#1d4ed8"
      />
      {/* Arms holding phone */}
      <path
        d="M36 135 C30 165 60 190 70 180"
        stroke="#d4a373"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M124 135 C130 165 100 190 90 180"
        stroke="#d4a373"
        strokeWidth="14"
        strokeLinecap="round"
      />
      {/* Phone in hands */}
      <rect
        x="68"
        y="162"
        width="24"
        height="42"
        rx="4"
        fill="#ea580c"
        stroke="#c2410c"
        strokeWidth="1.5"
      />
      <rect x="71" y="166" width="18" height="32" rx="2" fill="#fed7aa" />
    </svg>
  </div>
);

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
  onSelectSchemeForEligibility,
  onScrollToOptions,
  onSelectCategory,
}) => {
  const { settings } = useAccessibility();
  const { language } = useLanguage();
  const isTamil = language === 'ta';
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

  const activeSlide = SLIDES[currentSlideIndex];

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

  const handleSecondaryClick = () => {
    if (onSelectSchemeForEligibility && activeSlide) {
      onSelectSchemeForEligibility(activeSlide.schemeId);
    } else {
      onNavigate('eligibility');
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
      {/* Outer Banner Carousel Container: Occupies Full Frame Viewport */}
      <div
        className="relative w-full h-[calc(100vh-4.25rem)] min-h-[640px] max-h-[960px] flex flex-col justify-between overflow-hidden select-none group border-b border-slate-200/80 bg-slate-50 moving-animation-exempt"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-roledescription="carousel"
        aria-label="Government Schemes Showcase Carousel"
      >
        {/* Left Navigation Arrow Button (Green rounded rectangle matching Image 1) */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-40 w-7 sm:w-8.5 lg:w-9 h-14 sm:h-18 lg:h-20 rounded-r-xl bg-[#166534] hover:bg-[#14532d] text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          aria-label="Previous Scheme Slide"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>

        {/* Right Navigation Arrow Button (Green rounded rectangle matching Image 1) */}
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
              className={`w-full h-full shrink-0 bg-gradient-to-r ${slide.theme.bgGradient} px-4 sm:px-8 lg:px-12 py-4 sm:py-6 relative flex items-center justify-center overflow-hidden`}
            >
              {/* Subtle background decorative shapes */}
              <div
                className={`absolute -right-20 -bottom-20 w-96 h-96 rounded-full ${slide.theme.decorCircle} blur-3xl pointer-events-none`}
              />
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#155e3b_1px,transparent_1px)] [background-size:20px_20px]" />

              {/* Bottom Landscape Green Hill with Tree (Exact replica of Image 1) */}
              <div className="absolute bottom-0 left-0 right-0 h-14 sm:h-18 pointer-events-none z-10 overflow-hidden">
                <svg
                  viewBox="0 0 1440 80"
                  preserveAspectRatio="none"
                  className="w-full h-full text-emerald-200/50 fill-current"
                >
                  <path d="M0,45 C320,15 620,65 980,30 C1200,10 1340,35 1440,25 L1440,80 L0,80 Z" />
                </svg>
                {/* Little Tree on Hill */}
                <div className="absolute left-[16%] bottom-3 sm:bottom-4 hidden md:flex items-end">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600/80 -mb-1 shadow-xs" />
                    <div className="w-4 h-4 rounded-full bg-green-500/90 -mb-1" />
                    <div className="w-1 h-3 bg-amber-800 rounded-xs" />
                  </div>
                </div>
              </div>

              {/* Main Content Layout: Left Scheme Info + Middle Floating Options + Right Phone Mockup */}
              <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center px-4 sm:px-8 lg:px-12 relative z-20">
                {/* Left Column: Scheme Title, Emblems, Description, CTA */}
                <div className="lg:col-span-5 flex flex-col justify-center text-left space-y-3 sm:space-y-4 lg:space-y-4.5 z-10">
                  {/* Government Emblem & Partner Logos */}
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="flex items-center space-x-2.5 text-slate-800 shrink-0">
                      <StateEmblemOfIndia className="w-9 h-11 sm:w-10 sm:h-12 text-slate-800" />
                      <div className="flex flex-col leading-tight border-l-2 border-slate-400/50 pl-2.5 sm:pl-3">
                        <span className="text-[10px] sm:text-xs font-black tracking-wider text-slate-900 uppercase">
                          {slide.ministryBadge}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                          {slide.ministrySub}
                        </span>
                      </div>
                    </div>

                    {/* UMANG / Portal Badge */}
                    <div className="shrink-0 pl-1">
                      <UmangEmblem className="h-10 w-11 sm:h-11 sm:w-12" />
                    </div>
                  </div>

                  {/* Main Headline with LIVE badge (matching image 1) */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <h2
                      className={`text-2xl sm:text-3.5xl lg:text-[40px] xl:text-[44px] font-black tracking-tight leading-[1.12] ${slide.theme.headlineColor}`}
                    >
                      {slide.titlePrimary}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-slate-900 leading-none">
                      <span>is now</span>
                      <span
                        className={`${slide.theme.badgeBg} text-white font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-md tracking-wider shadow-sm uppercase animate-pulse inline-flex items-center`}
                      >
                        {slide.statusBadge}
                      </span>
                      <span>{slide.partnerText}</span>
                    </div>
                  </div>

                  {/* Scheme Description */}
                  <p className="text-xs sm:text-sm lg:text-base text-slate-700 font-medium leading-relaxed max-w-lg">
                    {slide.description}
                  </p>

                  {/* Key Guarantee Benefit Tag */}
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/85 border border-slate-200/90 text-xs sm:text-[13px] font-semibold text-slate-800 shadow-2xs backdrop-blur-xs w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{slide.benefitPill}</span>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePrimaryClick(slide)}
                      className={`px-7 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white hover:bg-slate-50 ${slide.theme.buttonText} font-black text-xs sm:text-sm shadow-md hover:shadow-xl border border-slate-200/90 transition-all hover:scale-105 active:scale-95 inline-flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer`}
                    >
                      <span>{slide.primaryCtaText}</span>
                      <ExternalLink className="w-4 h-4 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={handleSecondaryClick}
                      className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-slate-900/10 hover:bg-slate-900/15 text-slate-800 font-bold text-xs sm:text-sm border border-slate-400/30 transition-all hover:scale-105 active:scale-95 inline-flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-slate-700 cursor-pointer"
                    >
                      <span>{slide.secondaryCtaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Area: 4 Floating Options + S-Curve Flight Path + Smartphone Mockup + Citizen */}
                <div className="lg:col-span-7 flex items-center justify-center lg:justify-end relative py-2 sm:py-4 gap-3 sm:gap-5">
                  {/* The 4 Floating Options along Dotted S-Curve Flight Path + QR Code */}
                  <div className="relative flex flex-col justify-between py-1 shrink-0 z-20">
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

                  {/* Smartphone Mockup with Overlapping Badges */}
                  <div className="relative shrink-0 flex items-center justify-center animate-float-subtle">
                    {/* 3D Floating Graphic */}
                    <div className="absolute -top-3 right-4 sm:right-10 z-20 pointer-events-none drop-shadow-xl">
                      <FloatingGraphic3D type={slide.phone.floating3DIcon} />
                    </div>

                    {/* Floating Action Badge 1 (overlapping the phone) */}
                    <div className="absolute top-16 sm:top-20 -right-2 sm:right-2 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 shadow-xl border border-slate-100 flex items-center space-x-2 hover:scale-105 transition-transform max-w-[190px] sm:max-w-[220px]">
                      <div
                        className={`w-8 h-8 rounded-xl ${slide.phone.floatingBadge1.color} text-white flex items-center justify-center shrink-0 shadow-xs`}
                      >
                        <FloatingBadgeIcon type={slide.phone.floatingBadge1.icon} className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-900 leading-snug truncate">
                          {slide.phone.floatingBadge1.title}
                        </span>
                        <span className="mt-0.5 inline-flex items-center px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider w-fit">
                          {slide.phone.floatingBadge1.tag}
                        </span>
                      </div>
                    </div>

                    {/* Floating Action Badge 2 (overlapping lower phone edge) */}
                    <div className="absolute top-32 sm:top-36 -right-3 sm:right-0 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 shadow-xl border border-slate-100 flex items-center space-x-2 hover:scale-105 transition-transform max-w-[180px] sm:max-w-[210px]">
                      <div
                        className={`w-8 h-8 rounded-xl ${slide.phone.floatingBadge2.color} text-white flex items-center justify-center shrink-0 shadow-xs`}
                      >
                        <FloatingBadgeIcon type={slide.phone.floatingBadge2.icon} className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-900 leading-snug truncate">
                          {slide.phone.floatingBadge2.title}
                        </span>
                        <span className="mt-0.5 inline-flex items-center px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider w-fit">
                          {slide.phone.floatingBadge2.tag}
                        </span>
                      </div>
                    </div>

                    {/* Smartphone Outer Shell */}
                    <div className="w-[220px] sm:w-[250px] lg:w-[270px] h-[380px] sm:h-[430px] lg:h-[460px] bg-slate-950 rounded-[36px] p-2.5 shadow-2xl border-[5px] sm:border-[6px] border-slate-800/95 relative overflow-hidden flex flex-col justify-between animate-moving-image">
                      {/* Dynamic Island / Speaker Pill */}
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-18 h-3.5 bg-slate-950 rounded-full z-30 flex items-center justify-end pr-2 space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                        <div className="w-1 h-1 rounded-full bg-blue-950/80" />
                      </div>

                      {/* Phone Screen Container */}
                      <div className="w-full h-full bg-slate-50 rounded-[26px] overflow-hidden flex flex-col text-slate-900 relative">
                        {/* Status Bar */}
                        <div className="h-6 px-3.5 pt-0.5 flex items-center justify-between text-[9px] font-bold text-slate-900 bg-white shrink-0 z-20">
                          <span>12:28</span>
                          <div className="flex items-center space-x-1 text-slate-800">
                            <Signal className="w-2.5 h-2.5" />
                            <Wifi className="w-2.5 h-2.5" />
                            <div className="flex items-center space-x-0.5">
                              <span className="text-[8px]">89</span>
                              <Battery className="w-3 h-3 fill-current" />
                            </div>
                          </div>
                        </div>

                        {/* App Navigation Bar */}
                        <div className="px-2.5 py-1.5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                          <div className="flex items-center space-x-1 min-w-0">
                            <ChevronLeft className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                            <span className="text-[10px] font-bold text-slate-900 truncate">
                              {slide.phone.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-slate-600 shrink-0">
                            <Search className="w-3 h-3" />
                            <div className="text-[8px] font-semibold flex items-center text-slate-700 bg-slate-100 px-1 py-0.5 rounded">
                              <span>En</span>
                              <ChevronDown className="w-2 h-2 ml-0.5" />
                            </div>
                          </div>
                        </div>

                        {/* Phone Inner Content */}
                        <div className="p-2 space-y-1.5 flex-1 overflow-hidden bg-slate-50/80">
                          {/* Scheme Header Card */}
                          <div className="p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs flex items-center space-x-1.5">
                            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0 border border-emerald-200">
                              {slide.phone.shortCode}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[9px] font-bold text-slate-900 truncate">
                                {slide.phone.title}
                              </p>
                              <p className="text-[7.5px] text-slate-500 truncate">{slide.phone.tagline}</p>
                            </div>
                          </div>

                          {/* Search Bar Input */}
                          <div className="relative">
                            <Search className="w-2.5 h-2.5 text-slate-400 absolute left-2 top-2" />
                            <input
                              type="text"
                              readOnly
                              placeholder={slide.phone.searchPlaceholder}
                              className="w-full pl-5.5 pr-2 py-1 rounded-lg bg-white border border-slate-200 text-[8px] text-slate-700 placeholder-slate-400 cursor-default focus:outline-none"
                            />
                          </div>

                          {/* Highlight Feature Card */}
                          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                            <span className="text-[9px] font-bold text-slate-800 block leading-tight">
                              {slide.phone.highlightCard.title}
                            </span>
                            <button
                              type="button"
                              className={`w-full py-0.5 rounded-md ${slide.phone.highlightCard.btnColor} text-white text-[8px] font-bold shadow-2xs tracking-wider uppercase`}
                            >
                              {slide.phone.highlightCard.btnText}
                            </button>
                          </div>

                          {/* Service Row 1 */}
                          <div className="p-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                            <span className="text-[8px] font-semibold text-slate-800 truncate">
                              {slide.phone.service1}
                            </span>
                            <ChevronRight className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          </div>

                          {/* Service Row 2 */}
                          <div className="p-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                            <span className="text-[8px] font-semibold text-slate-800 truncate">
                              {slide.phone.service2}
                            </span>
                            <ChevronRight className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          </div>
                        </div>

                        {/* Bottom Home Indicator Bar */}
                        <div className="h-3.5 bg-white flex items-center justify-center shrink-0">
                          <div className="w-16 h-1 bg-slate-300 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Citizen Using Smartphone Illustration */}
                  <CitizenMobileUser />
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
