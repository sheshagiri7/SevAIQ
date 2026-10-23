import React from 'react';
import { Monitor } from 'lucide-react';
import { NavigationTab, CitizenProfile, Scheme, DocumentRecord } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { SchemeBannerCarousel } from './SchemeBannerCarousel';
import { CategoryGrid } from './CategoryGrid';

interface DashboardProps {
  onNavigate: (tab: NavigationTab) => void;
  profile: CitizenProfile;
  schemes: Scheme[];
  eligibleCount: number;
  documents: DocumentRecord[];
  isKioskMode: boolean;
  onSelectCategory?: (categoryId: string) => void;
  onOpenAbout?: () => void;
  onSelectSchemeForEligibility?: (schemeId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  isKioskMode,
  onSelectCategory,
  onSelectSchemeForEligibility,
}) => {
  const { t } = useLanguage();

  const handleScrollToOptions = () => {
    const el = document.getElementById('options-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* Kiosk Mode Notice if enabled */}
      {isKioskMode && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4 text-amber-800 shrink-0" />
              <span className="font-semibold">
                {t.dashboard.kioskNoticeTitle}
              </span>
              <span className="text-amber-800">
                {t.dashboard.kioskNoticeDesc}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1. Full Frame Interactive Scheme Banner Carousel (Occupies full viewport frame) */}
      <section aria-label="Featured Government Schemes Showcase" className="w-full">
        <SchemeBannerCarousel
          onNavigate={onNavigate}
          onSelectSchemeForEligibility={onSelectSchemeForEligibility}
          onScrollToOptions={handleScrollToOptions}
          onSelectCategory={onSelectCategory}
        />
      </section>

      {/* 2. Floating Layout for Options (Floating over the bottom edge of hero carousel) */}
      <section
        id="options-section"
        aria-label="Schemes Discovery Options"
        className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 md:-mt-16 relative z-30 pb-16 sm:pb-24 scroll-mt-6"
      >
        {/* Find Schemes Based on Categories (myScheme 15-Category Grid) */}
        <CategoryGrid
          onSelectCategory={onSelectCategory || ((_catId) => onNavigate('discover'))}
        />
      </section>
    </div>
  );
};
