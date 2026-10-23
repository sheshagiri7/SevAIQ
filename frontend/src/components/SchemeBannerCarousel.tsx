import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Sparkles,
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
      phoneAnimationClass: 'animate-moving-phone-1',
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
      phoneAnimationClass: 'animate-moving-phone-2',
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
      phoneAnimationClass: 'animate-moving-phone-3',
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
      phoneAnimationClass: 'animate-moving-phone-4',
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
      secondaryCtaText: 'தகுதியை சரிபார்க்கவும்',
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
    'pm-kisan': {
      ministryBadge: 'வேளாண்மை & உழவர் நல அமைச்சகம்',
      ministrySub: 'இந்திய அரசு',
      titlePrimary: 'பிரதான் மந்திரி கிசான் சம்மான் நிதி',
      statusBadge: 'செயலில்',
      partnerText: '17-வது தவணை',
      description: 'விவசாயிகளின் வங்கிக் கணக்கில் நேரடியாக ஆண்டுக்கு ₹6,000 வருமான ஆதரவு செலுத்தப்படுகிறது.',
      benefitPill: 'நேரடி பயன் பரிமாற்றம் (DBT) மூலம் ஆண்டுக்கு ₹6,000',
      primaryCtaText: 'விண்ணப்பிக்கவும்',
      secondaryCtaText: 'பயனாளியை சரிபார்க்கவும்',
      phone: {
        title: 'PM-KISAN உழவர் தளம்',
        tagline: 'விவசாயிகள் நலம் & DBT பரிமாற்றம்',
        searchPlaceholder: 'ஆதார் அல்லது மொபைல் எண்ணை உள்ளிடவும்...',
        highlightCard: {
          title: '17-வது தவணை DBT கட்டணம்',
          btnText: 'DBT சரிபார்',
        },
        service1: 'இ-கேஒய்சி பயோமெட்ரிக் சரிபார்ப்பு',
        service2: 'நில விவரம் & வங்கி கணக்கு இணைப்பு',
        floatingBadge1: {
          title: '₹2,000 தவணை DBT',
          tag: 'வரவு',
        },
        floatingBadge2: {
          title: 'இ-கேஒய்சி பயோமெட்ரிக்',
          tag: 'சரிபார்க்கப்பட்டது',
        },
      },
    },
    'ab-pmjay': {
      ministryBadge: 'தேசிய சுகாதார ஆணையம் & MOHFW',
      ministrySub: 'இந்திய அரசு',
      titlePrimary: 'ஆயுஷ்மான் பாரத் PM-JAY',
      statusBadge: 'ரொக்கமில்லா',
      partnerText: '₹5 லட்சம் மருத்துவக் காப்பீடு',
      description: '28,000+ மருத்துவமனைகளில் இலவச சிகிச்சை அளிக்கும் உலகின் மிகப்பெரிய மருத்துவக் காப்பீட்டுத் திட்டம்.',
      benefitPill: 'ஆண்டுக்கு குடும்பத்திற்கு ₹5,00,000 வரை ரொக்கமில்லா மருத்துவ சிகிச்சை',
      primaryCtaText: 'விண்ணப்பிக்கவும்',
      secondaryCtaText: 'மருத்துவமனைகளைக் கண்டறியவும்',
      phone: {
        title: 'ஆயுஷ்மான் பாரத் PM-JAY',
        tagline: 'தேசிய சுகாதார ஆணைய டிஜிட்டல் தளம்',
        searchPlaceholder: 'மருத்துவமனைகள், சிகிச்சைகளைத் தேடுங்கள்...',
        highlightCard: {
          title: 'ஆயுஷ்மான் அட்டை பெறுதல்',
          btnText: 'பதிவிறக்கு',
        },
        service1: '28,000+ அங்கீகரிக்கப்பட்ட மருத்துவமனைகள்',
        service2: 'ரொக்கமில்லா சிகிச்சை வரலாறு',
        floatingBadge1: {
          title: 'ஆயுஷ்மான் கோல்டன் அட்டை',
          tag: 'புதியது',
        },
        floatingBadge2: {
          title: '₹5,00,000 மருத்துவக் காப்பீடு',
          tag: 'செயலில்',
        },
      },
    },
    'pm-svanidhi': {
      ministryBadge: 'வீட்டுவசதி & நகர்ப்புற விவகாரங்கள் அமைச்சகம்',
      ministrySub: 'இந்திய அரசு',
      titlePrimary: 'பிஎம் ஸ்வநிதி நுண்கடன் திட்டம்',
      statusBadge: 'உடனடி',
      partnerText: '7% வட்டி மானியம்',
      description: 'மாதாந்திர டிஜிட்டல் பணத்திருப்ப சலுகைகளுடன் ₹50,000 வரை பிணையில்லா செயல்பாட்டு மூலதனக் கடன்.',
      benefitPill: '7% வட்டி மானியத்துடன் ₹10,000 முதல் ₹50,000 வரை நுண்கடன்',
      primaryCtaText: 'விண்ணப்பிக்கவும்',
      secondaryCtaText: 'கடன் நிலையை சரிபார்க்கவும்',
      phone: {
        title: 'PM SVANidhi மொபைல்',
        tagline: 'நகர்ப்புற வியாபாரிகள் நுண்கடன் திட்டம்',
        searchPlaceholder: 'கடன் அல்லது விற்பனையாளர் ஐடியைத் தேடுங்கள்...',
        highlightCard: {
          title: 'செயல்பாட்டு மூலதனக் கடன் தவணை',
          btnText: '₹10K விண்ணப்பி',
        },
        service1: 'விற்பனை சான்றிதழ் (CoV) இணைப்பு',
        service2: 'மாதாந்திர டிஜிட்டல் UPI கேஷ்பேக்: ₹100',
        floatingBadge1: {
          title: 'உடனடி கடன் வழங்கல்',
          tag: 'புதியது',
        },
        floatingBadge2: {
          title: '7% வட்டி மானியம்',
          tag: 'செயலில்',
        },
      },
    },
    'pmay-g': {
      ministryBadge: 'ஊரக வளர்ச்சி அமைச்சகம்',
      ministrySub: 'இந்திய அரசு',
      titlePrimary: 'பிரதான் மந்திரி ஆவாஸ் திட்டம்',
      statusBadge: 'அங்கீகரிக்கப்பட்டது',
      partnerText: 'நிரந்தர பக்கா வீடு',
      description: 'நிரந்தர வீடு கட்ட ₹1.30 லட்சம் நேரடி நிதி உதவி + 90 நாட்கள் MGNREGS ஊதியம்.',
      benefitPill: 'பக்கா வீடு கட்ட ₹1.30 லட்சம் நேரடி நிதி உதவி',
      primaryCtaText: 'விண்ணப்பிக்கவும்',
      secondaryCtaText: 'கிராம பஞ்சாயத்து பட்டியல்',
      phone: {
        title: 'ஆவாஸ்சாஃப்ட் கிராமப்புற வீட்டுவசதி',
        tagline: 'ஊரக வளர்ச்சி அமைச்சக DBT',
        searchPlaceholder: 'பதிவு எண் அல்லது கிராமத்தைத் தேடுங்கள்...',
        highlightCard: {
          title: 'வீட்டு அனுமதி ஆணை',
          btnText: 'பதிவிறக்கு',
        },
        service1: 'வீடு ஜியோ-டேக் ஆய்வு சரிபார்ப்பு',
        service2: 'படிநிலை வாரியான நேரடி DBT வங்கி பரிமாற்றம்',
        floatingBadge1: {
          title: 'பக்கா வீடு அனுமதி',
          tag: 'புதியது',
        },
        floatingBadge2: {
          title: 'வங்கி DBT வழங்கல்',
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
      secondaryCtaText: 'पात्रता जांचें',
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
    'pm-kisan': {
      ministryBadge: 'कृषि एवं किसान कल्याण मंत्रालय',
      ministrySub: 'भारत सरकार',
      titlePrimary: 'प्रधानमंत्री किसान सम्मान निधि',
      statusBadge: 'सक्रिय',
      partnerText: '17वीं किस्त',
      description: 'सत्यापित किसानों के बैंक खातों में सीधे ₹6,000/वर्ष की प्रत्यक्ष आय सहायता जमा की जाती है।',
      benefitPill: 'प्रत्यक्ष लाभ अंतरण (DBT) के माध्यम से ₹6,000 प्रति वर्ष',
      primaryCtaText: 'अभी आवेदन करें',
      secondaryCtaText: 'लाभार्थी स्थिति जांचें',
      phone: {
        title: 'पीएम-किसान किसान पोर्टल',
        tagline: 'किसान कल्याण और डीबीटी वितरण',
        searchPlaceholder: 'आधार या मोबाइल नंबर दर्ज करें...',
        highlightCard: {
          title: '17वीं किस्त डीबीटी भुगतान',
          btnText: 'डीबीटी जांचें',
        },
        service1: 'ई-केवाईसी बायोमेट्रिक सत्यापन',
        service2: 'भूमि विवरण और बैंक खाता लिंकिंग',
        floatingBadge1: {
          title: '₹2,000 किस्त डीबीटी',
          tag: 'जमा',
        },
        floatingBadge2: {
          title: 'ई-केवाईसी बायोमेट्रिक्स',
          tag: 'सत्यापित',
        },
      },
    },
    'ab-pmjay': {
      ministryBadge: 'राष्ट्रीय स्वास्थ्य प्राधिकरण एवं स्वास्थ्य मंत्रालय',
      ministrySub: 'भारत सरकार',
      titlePrimary: 'आयुष्मान भारत पीएम-जेएवाई',
      statusBadge: 'कैशलेस',
      partnerText: '₹5 लाख स्वास्थ्य कवर',
      description: '28,000+ अस्पतालों में मुफ्त अस्पताल में भर्ती की सुविधा प्रदान करने वाली विश्व की सबसे बड़ी स्वास्थ्य योजना।',
      benefitPill: 'प्रति परिवार ₹5,00,000 वार्षिक निःशुल्क अस्पताल उपचार',
      primaryCtaText: 'अभी आवेदन करें',
      secondaryCtaText: 'अस्पताल खोजें',
      phone: {
        title: 'आयुष्मान भारत पीएम-जेएवाई',
        tagline: 'राष्ट्रीय स्वास्थ्य प्राधिकरण डिजिटल पोर्टल',
        searchPlaceholder: 'अस्पताल, उपचार खोजें...',
        highlightCard: {
          title: 'आयुष्मान कार्ड निर्माण',
          btnText: 'डाउनलोड',
        },
        service1: '28,000+ सूचीबद्ध अस्पताल खोजें',
        service2: 'कैशलेस उपचार इतिहास',
        floatingBadge1: {
          title: 'आयुष्मान गोल्डन कार्ड',
          tag: 'नया',
        },
        floatingBadge2: {
          title: '₹5,00,000 स्वास्थ्य कवर',
          tag: 'सक्रिय',
        },
      },
    },
    'pm-svanidhi': {
      ministryBadge: 'आवासन और शहरी कार्य मंत्रालय',
      ministrySub: 'भारत सरकार',
      titlePrimary: 'पीएम स्वनिधि सूक्ष्म-ऋण योजना',
      statusBadge: 'त्वरित',
      partnerText: '7% ब्याज सब्सिडी',
      description: 'मासिक डिजिटल कैशबैक प्रोत्साहनों के साथ ₹50,000 तक का संपार्श्विक-मुक्त कार्यशील पूंजी ऋण।',
      benefitPill: '7% ब्याज सब्सिडी के साथ ₹10,000 से ₹50,000 तक सूक्ष्म ऋण',
      primaryCtaText: 'अभी आवेदन करें',
      secondaryCtaText: 'ऋण स्थिति जांचें',
      phone: {
        title: 'पीएम स्वनिधि मोबाइल',
        tagline: 'शहरी विक्रेता सूक्ष्म ऋण योजना',
        searchPlaceholder: 'ऋण या वेंडिंग आईडी खोजें...',
        highlightCard: {
          title: 'कार्यशील पूंजी ऋण किश्त',
          btnText: '₹10 हजार आवेदन',
        },
        service1: 'वेंडिंग प्रमाणपत्र (CoV) सिंक',
        service2: 'मासिक डिजिटल यूपीआई कैशबैक: ₹100',
        floatingBadge1: {
          title: 'त्वरित ऋण वितरण',
          tag: 'नया',
        },
        floatingBadge2: {
          title: '7% ब्याज सब्सिडी',
          tag: 'सक्रिय',
        },
      },
    },
    'pmay-g': {
      ministryBadge: 'ग्रामीण विकास मंत्रालय',
      ministrySub: 'भारत सरकार',
      titlePrimary: 'प्रधानमंत्री आवास योजना',
      statusBadge: 'स्वीकृत',
      partnerText: 'पक्का मकान',
      description: 'पक्का मकान बनाने के लिए ₹1.30 लाख की वित्तीय सहायता + 90 दिनों की मनरेगा मजदूरी।',
      benefitPill: 'पक्के मकान हेतु ₹1.30 लाख की प्रत्यक्ष वित्तीय सहायता',
      primaryCtaText: 'अभी आवेदन करें',
      secondaryCtaText: 'ग्राम पंचायत सूची',
      phone: {
        title: 'आवाससॉफ्ट ग्रामीण आवास',
        tagline: 'ग्रामीण विकास मंत्रालय डीबीटी',
        searchPlaceholder: 'पंजीकरण या गांव खोजें...',
        highlightCard: {
          title: 'आवास स्वीकृति आदेश',
          btnText: 'डाउनलोड',
        },
        service1: 'मकान जियो-टैग निरीक्षण सत्यापन',
        service2: 'चरणबद्ध प्रत्यक्ष डीबीटी बैंक वितरण',
        floatingBadge1: {
          title: 'पक्का मकान स्वीकृति',
          tag: 'नया',
        },
        floatingBadge2: {
          title: 'डीबीटी बैंक वितरण',
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
    ministryBadge: trans.ministryBadge,
    ministrySub: trans.ministrySub,
    titlePrimary: trans.titlePrimary,
    statusBadge: trans.statusBadge,
    partnerText: trans.partnerText,
    description: trans.description,
    benefitPill: trans.benefitPill,
    primaryCtaText: trans.primaryCtaText,
    secondaryCtaText: trans.secondaryCtaText,
    phone: {
      ...slide.phone,
      title: trans.phone.title,
      tagline: trans.phone.tagline,
      searchPlaceholder: trans.phone.searchPlaceholder,
      highlightCard: {
        ...slide.phone.highlightCard,
        title: trans.phone.highlightCard.title,
        btnText: trans.phone.highlightCard.btnText,
      },
      service1: trans.phone.service1,
      service2: trans.phone.service2,
      floatingBadge1: {
        ...slide.phone.floatingBadge1,
        title: trans.phone.floatingBadge1.title,
        tag: trans.phone.floatingBadge1.tag,
      },
      floatingBadge2: {
        ...slide.phone.floatingBadge2,
        title: trans.phone.floatingBadge2.title,
        tag: trans.phone.floatingBadge2.tag,
      },
    },
  };
};

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
          aria-label={t.banner?.prevSlide || (isTamil ? 'முந்தைய திட்டம்' : isHindi ? 'पिछली योजना' : 'Previous Scheme Slide')}
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>

        {/* Right Navigation Arrow Button (Green rounded rectangle matching Image 1) */}
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-40 w-7 sm:w-8.5 lg:w-9 h-14 sm:h-18 lg:h-20 rounded-l-xl bg-[#166534] hover:bg-[#14532d] text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          aria-label={t.banner?.nextSlide || (isTamil ? 'அடுத்த திட்டம்' : isHindi ? 'अगली योजना' : 'Next Scheme Slide')}
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>

        {/* Scrolling Horizontal Slide Track (Animated smoothly every 5s) */}
        <div
          className="flex-1 flex transition-transform duration-500 ease-in-out w-full h-full"
          style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}
        >
          {SLIDES.map((slide) => {
            const locSlide = getLocalizedSlide(slide, language);
            return (
              <div
                key={slide.id}
                className={`w-full h-full shrink-0 bg-gradient-to-r ${slide.theme.bgGradient} px-4 sm:px-8 lg:px-12 py-4 sm:py-6 relative flex items-center justify-center overflow-hidden`}
              >
              {/* Subtle background decorative shapes */}
              <div
                className={`absolute -right-20 -bottom-20 w-96 h-96 rounded-full ${slide.theme.decorCircle} blur-3xl pointer-events-none`}
              />
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#155e3b_1px,transparent_1px)] [background-size:20px_20px]" />

              {/* Bottom Landscape Green Hill (Subtle clean background) */}
              <div className="absolute bottom-0 left-0 right-0 h-14 sm:h-18 pointer-events-none z-10 overflow-hidden">
                <svg
                  viewBox="0 0 1440 80"
                  preserveAspectRatio="none"
                  className="w-full h-full text-emerald-200/50 fill-current"
                >
                  <path d="M0,45 C320,15 620,65 980,30 C1200,10 1340,35 1440,25 L1440,80 L0,80 Z" />
                </svg>
              </div>

              {/* Main Content Layout: Left Scheme Info + Right Text Information Cards */}
              <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center px-4 sm:px-8 lg:px-12 relative z-20">
                {/* Left Column: Scheme Title, Emblems, Description, CTA */}
                <div className="lg:col-span-7 flex flex-col justify-center text-left space-y-3 sm:space-y-4 lg:space-y-4.5 z-10">
                  {/* Government Emblem & Partner Logos */}
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="flex items-center space-x-2.5 text-slate-800 shrink-0">
                      <StateEmblemOfIndia className="w-9 h-11 sm:w-10 sm:h-12 text-slate-800" />
                      <div className="flex flex-col leading-tight border-l-2 border-slate-400/50 pl-2.5 sm:pl-3">
                        <span className="text-[10px] sm:text-xs font-black tracking-wider text-slate-900 uppercase">
                          {locSlide.ministryBadge}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                          {locSlide.ministrySub}
                        </span>
                      </div>
                    </div>

                    {/* UMANG / Portal Badge */}
                    <div className="shrink-0 pl-1">
                      <UmangEmblem className="h-10 w-11 sm:h-11 sm:w-12" />
                    </div>
                  </div>

                  {/* Main Headline with LIVE badge */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <h2
                      className={`text-2xl sm:text-3.5xl lg:text-[40px] xl:text-[44px] font-black tracking-tight leading-[1.12] ${slide.theme.headlineColor}`}
                    >
                      {locSlide.titlePrimary}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-slate-900 leading-none">
                      <span>{t.banner?.isNow || (isTamil ? 'தற்போது' : isHindi ? 'अब है' : 'is now')}</span>
                      <span
                        className={`${slide.theme.badgeBg} text-white font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-md tracking-wider shadow-sm uppercase animate-pulse inline-flex items-center`}
                      >
                        {locSlide.statusBadge}
                      </span>
                      <span>{locSlide.partnerText}</span>
                    </div>
                  </div>

                  {/* Scheme Description */}
                  <p className="text-xs sm:text-sm lg:text-base text-slate-700 font-medium leading-relaxed max-w-lg">
                    {locSlide.description}
                  </p>

                  {/* Key Guarantee Benefit Tag */}
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/85 border border-slate-200/90 text-xs sm:text-[13px] font-semibold text-slate-800 shadow-2xs backdrop-blur-xs w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{locSlide.benefitPill}</span>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePrimaryClick(slide)}
                      className={`px-7 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white hover:bg-slate-50 ${slide.theme.buttonText} font-black text-xs sm:text-sm shadow-md hover:shadow-xl border border-slate-200/90 transition-all hover:scale-105 active:scale-95 inline-flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer`}
                    >
                      <span>{locSlide.primaryCtaText}</span>
                      <ExternalLink className="w-4 h-4 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={handleSecondaryClick}
                      className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-slate-900/10 hover:bg-slate-900/15 text-slate-800 font-bold text-xs sm:text-sm border border-slate-400/30 transition-all hover:scale-105 active:scale-95 inline-flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-slate-700 cursor-pointer"
                    >
                      <span>{locSlide.secondaryCtaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Area: Scheme Action Badges, Key Services & Category Links (Pure Text Information) */}
                <div className="lg:col-span-5 flex flex-col justify-center space-y-3 sm:space-y-3.5 z-20">
                  {/* Floating Action Badges as Clean Text Badges */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/95 border border-slate-200/90 shadow-xs text-slate-800 text-xs sm:text-sm font-bold animate-badge-float-1">
                      <div className={`w-2 h-2 rounded-full ${slide.phone.floatingBadge1.color}`} />
                      <span>{locSlide.phone.floatingBadge1.title}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        {locSlide.phone.floatingBadge1.tag}
                      </span>
                    </div>

                    <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/95 border border-slate-200/90 shadow-xs text-slate-800 text-xs sm:text-sm font-bold animate-badge-float-2">
                      <div className={`w-2 h-2 rounded-full ${slide.phone.floatingBadge2.color}`} />
                      <span>{locSlide.phone.floatingBadge2.title}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        {locSlide.phone.floatingBadge2.tag}
                      </span>
                    </div>
                  </div>

                  {/* Scheme Services Text Card */}
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-4.5 border border-slate-200/90 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500">
                        {isTamil ? 'அதிகாரப்பூர்வ சேவைகள்' : isHindi ? 'आधिकारिक सेवाएं' : 'Official Portal Services'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {locSlide.phone.shortCode}
                      </span>
                    </div>

                    {/* Highlight Service Row */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug">
                          {locSlide.phone.highlightCard.title}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{locSlide.phone.tagline}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePrimaryClick(slide)}
                        className={`px-3 py-1.5 rounded-lg ${locSlide.phone.highlightCard.btnColor} text-white font-bold text-[9px] sm:text-[10px] uppercase tracking-wider shadow-2xs hover:opacity-90 transition-opacity shrink-0 cursor-pointer`}
                      >
                        {locSlide.phone.highlightCard.btnText}
                      </button>
                    </div>

                    {/* Key Services Rows */}
                    <div className="space-y-1.5">
                      <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-800">
                        <span className="truncate">{locSlide.phone.service1}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-800">
                        <span className="truncate">{locSlide.phone.service2}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                      </div>
                    </div>
                  </div>

                  {/* 4 Category Text Options with float animations */}
                  <div className="space-y-1.5 pt-0.5">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-600 block pl-0.5">
                      {isTamil ? 'துறை வாரியாக திட்டங்கள்' : isHindi ? 'श्रेणी अनुसार योजनाएं' : 'Explore by Category'}
                    </span>
                    <div
                      className="grid grid-cols-2 gap-2"
                      aria-label="Floating Scheme Category Options"
                    >
                      {FLOATING_OPTIONS.map((opt) => {
                        const title = isTamil
                          ? opt.titleTa
                          : isHindi
                          ? opt.titleHi
                          : opt.titleEn;
                        return (
                          <div key={opt.id} className={`relative group ${opt.floatClass}`}>
                            <button
                              type="button"
                              onClick={() => handleSelectFloatingCategory(opt.categoryId)}
                              className={`w-full px-3 py-2 rounded-xl bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-xs font-bold text-left flex items-center justify-between group cursor-pointer ${opt.floatClass}`}
                              title={title}
                              aria-label={`Explore ${opt.titleEn} floating option`}
                            >
                              <span className="truncate">{title}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Bottom Area: Slide Indicator Dots + Floating Options Launcher */}
        <div className="relative z-30 pb-3 sm:pb-5 pt-1 flex flex-col items-center justify-center space-y-2.5">
          {/* Carousel Slide Indicators with 5-Second Progress Bar Timer */}
          <div className="flex items-center space-x-2">
            {SLIDES.map((slide, index) => {
              const isActive = index === currentSlideIndex;
              const locSlide = getLocalizedSlide(slide, language);
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`relative h-2 rounded-full overflow-hidden transition-all duration-300 ${
                    isActive ? 'w-10 bg-slate-300/90 shadow-2xs' : 'w-2.5 bg-slate-400/50 hover:bg-slate-500'
                  }`}
                  aria-label={`${t.banner?.goToSlide || (isTamil ? 'திட்டம்' : isHindi ? 'योजना' : 'Go to slide')} ${index + 1}: ${locSlide.titlePrimary}`}
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
              {t.banner?.hashtag || (isTamil ? '#அரசுதிட்டங்கள் / #உங்களுக்கானதிட்டங்கள்' : isHindi ? '#सरकारीयोजनाएं / #आपकेलिएयोजनाएं' : '#GOVERNMENTSCHEMES / #SCHEMESFORYOU')}
            </p>
            <button
              type="button"
              onClick={handleScrollToOptions}
              className="inline-flex items-center space-x-2 px-6 sm:px-8 py-2 sm:py-2.5 rounded-xl bg-[#107c41] hover:bg-[#0c6534] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600"
              aria-label={t.banner?.findSchemesAria || (isTamil ? 'உங்களுக்கான திட்டங்களைக் கண்டறியவும் - விருப்பங்களை ஆராய கீழே உருட்டவும்' : isHindi ? 'आपके लिए योजनाएं खोजें - विकल्प देखने के लिए नीचे स्क्रॉल करें' : 'Find Schemes For You - scroll to options')}
            >
              <span>{t.banner?.findSchemes || (isTamil ? 'உங்களுக்கான திட்டங்களைக் கண்டறியவும்' : isHindi ? 'आपके लिए योजनाएं खोजें' : 'Find Schemes For You')}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover/float:translate-x-1 transition-transform" />
            </button>
            <button
              type="button"
              onClick={handleScrollToOptions}
              className="flex items-center space-x-1 text-[10px] font-bold text-slate-500 hover:text-emerald-700 mt-1 transition-colors cursor-pointer"
            >
              <span>{t.banner?.scrollDown || (isTamil ? 'விருப்பங்களை ஆராய கீழே உருட்டவும்' : isHindi ? 'विकल्प देखने के लिए नीचे स्क्रॉल करें' : 'Scroll down to explore options')}</span>
              <ChevronDown className="w-3.5 h-3.5 animate-bounce text-emerald-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
