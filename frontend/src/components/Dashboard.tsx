import React from 'react';
import {
  Compass,
  CheckSquare,
  Files,
  Award,
  Database,
  Lock,
  Monitor,
  Sparkles,
} from 'lucide-react';
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
  profile,
  schemes,
  eligibleCount,
  documents,
  isKioskMode,
  onSelectCategory,
  onOpenAbout,
  onSelectSchemeForEligibility,
}) => {
  const { language, t } = useLanguage();

  const profileComplete = Boolean(
    profile.age && profile.gender && profile.state && profile.area && profile.occupation
  );

  const readyDocsCount = documents.filter((d) => d.status === 'have').length;
  const totalDocsCount = documents.length;
  const readinessPercentage =
    totalDocsCount > 0 ? Math.round((readyDocsCount / totalDocsCount) * 100) : 0;

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

      {/* 2. Layout for Options (Revealed when user scrolls or clicks floating option) */}
      <section
        id="options-section"
        aria-label="Schemes Discovery & Citizen Readiness Options"
        className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10 scroll-mt-6"
      >
        {/* Find Schemes Based on Categories (myScheme 15-Category Grid matching Image 2) */}
        <CategoryGrid
          onSelectCategory={onSelectCategory || ((_catId) => onNavigate('discover'))}
        />

        {/* Metrics Grid - 4 Summary Cards with equal heights & consistent padding */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {language === 'ta'
                  ? 'அரசின் தகுதி நிலை & கண்காணிப்பு மேலோட்டம்'
                  : language === 'hi'
                  ? 'नागरिक तत्परता एवं योजना विश्लेषण'
                  : 'Citizen Readiness & Scheme Intelligence'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {language === 'ta'
                  ? 'உங்கள் சுயவிவரம் மற்றும் ஆவணங்களின் அடிப்படையில் நேரடி தகுதி பகுப்பாய்வு'
                  : language === 'hi'
                  ? 'आपकी सक्रिय प्रोफ़ाइल और वैधानिक दस्तावेजों के आधार पर वास्तविक समय मूल्यांकन'
                  : 'Real-time assessment based on your active profile and statutory documents'}
              </p>
            </div>
            <span className="text-xs font-bold text-civic-700 bg-civic-50 px-3 py-1 rounded-full border border-civic-200/80 w-fit">
              {language === 'ta' ? '4 முக்கிய நிலைகள்' : language === 'hi' ? '4 तत्परता चरण' : '4 Readiness Milestones'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <button
              type="button"
              onClick={() => onNavigate('discover')}
              className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-civic-300 hover:shadow-md transition-all text-left w-full group focus:outline-none focus:ring-2 focus:ring-civic-500 h-full flex flex-col justify-between"
              aria-label={t.dashboard.metricCataloged}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {t.dashboard.metricCataloged}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-civic-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <Compass className="w-5 h-5" />
                  </div>
                </div>
                <div className="my-3 flex items-baseline justify-between flex-wrap gap-2">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{schemes.length}</span>
                  <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    {t.dashboard.metricVerified}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium pt-2.5 border-t border-slate-100">
                {t.dashboard.metricGazetteLinks}
              </p>
            </button>

            {/* Metric 2 */}
            <button
              type="button"
              onClick={() => onNavigate('eligibility')}
              className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all text-left w-full group focus:outline-none focus:ring-2 focus:ring-emerald-500 h-full flex flex-col justify-between"
              aria-label={t.dashboard.metricEligible}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {t.dashboard.metricEligible}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                </div>
                <div className="my-3 flex items-baseline justify-between flex-wrap gap-2">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{eligibleCount}</span>
                  <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                    {profileComplete ? t.dashboard.metricFullyMet : t.dashboard.metricProfileNeeded}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium pt-2.5 border-t border-slate-100">
                {t.dashboard.metricCriteriaMatched}
              </p>
            </button>

            {/* Metric 3 */}
            <button
              type="button"
              onClick={() => onNavigate('document-mapper')}
              className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all text-left w-full group focus:outline-none focus:ring-2 focus:ring-indigo-500 h-full flex flex-col justify-between"
              aria-label={t.dashboard.metricDocsReady}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {t.dashboard.metricDocsReady}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <Files className="w-5 h-5" />
                  </div>
                </div>
                <div className="my-3 flex items-baseline justify-between flex-wrap gap-2">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {readyDocsCount}/{totalDocsCount}
                  </span>
                  <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                    {readinessPercentage}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium pt-2.5 border-t border-slate-100">
                {t.dashboard.metricDocOverlap}
              </p>
            </button>

            {/* Metric 4 */}
            <button
              type="button"
              onClick={() => onNavigate('readiness-passport')}
              className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all text-left w-full group focus:outline-none focus:ring-2 focus:ring-amber-500 h-full flex flex-col justify-between"
              aria-label={t.dashboard.metricPassport}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {t.dashboard.metricPassport}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <div className="my-3 flex items-baseline justify-between flex-wrap gap-2">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {eligibleCount > 0 && readyDocsCount > 0 ? t.dashboard.metricActive : t.dashboard.metricDraft}
                  </span>
                  <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                    {t.dashboard.metricExportReady}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium pt-2.5 border-t border-slate-100">
                {t.dashboard.metricPrintableDossier}
              </p>
            </button>
          </div>
        </div>

        {/* Quick Launch Banner to Discover Features & Workflow via About Modal */}
        {onOpenAbout && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/90 via-white to-purple-50/90 rounded-3xl border border-civic-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center space-x-3.5 text-left min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-civic-700 to-indigo-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900">
                  {t.dashboard?.workflowTitle || 'How SevAIQ Empowers Your Application'}
                </h4>
                <p className="text-xs text-slate-600 truncate mt-0.5">
                  {t.dashboard?.workflowSubtitle || 'Follow the 4-stage readiness pipeline designed to maximize scheme access.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenAbout}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-civic-800 hover:text-civic-900 border border-civic-300 text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              {language === 'ta'
                ? 'அம்சங்கள் & வழிமுறைகள்'
                : language === 'hi'
                ? 'विशेषताएं और कार्यप्रणाली देखें'
                : 'View Features & Working'}
            </button>
          </div>
        )}

        {/* Privacy First Commitment & Architecture Note */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-sm flex items-start space-x-4">
            <div className="p-3 rounded-2xl bg-slate-800 text-emerald-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{t.dashboard.privacyTitle}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {t.dashboard.privacyDesc}
              </p>
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm flex items-start space-x-4">
            <div className="p-3 rounded-2xl bg-blue-50 text-civic-700 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">{t.dashboard.zeroHallucinationTitle}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t.dashboard.zeroHallucinationDesc}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
