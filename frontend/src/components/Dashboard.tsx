import React from 'react';
import {
  Compass,
  CheckSquare,
  Files,
  Award,
  ShieldCheck,
  ArrowRight,
  Database,
  Lock,
  Monitor,
  Mic,
  ListChecks,
} from 'lucide-react';
import { NavigationTab, CitizenProfile, Scheme, DocumentRecord } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { SchemeBannerCarousel } from './SchemeBannerCarousel';

interface DashboardProps {
  onNavigate: (tab: NavigationTab) => void;
  profile: CitizenProfile;
  schemes: Scheme[];
  eligibleCount: number;
  documents: DocumentRecord[];
  isKioskMode: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  profile,
  schemes,
  eligibleCount,
  documents,
  isKioskMode,
}) => {
  const { t } = useLanguage();

  const profileComplete = Boolean(
    profile.age && profile.gender && profile.state && profile.area && profile.occupation
  );

  const readyDocsCount = documents.filter((d) => d.status === 'have').length;
  const totalDocsCount = documents.length;
  const readinessPercentage =
    totalDocsCount > 0 ? Math.round((readyDocsCount / totalDocsCount) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Kiosk Mode Notice if enabled */}
      {isKioskMode && (
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
      )}

      {/* myScheme-Style Interactive Scheme Banner Carousel (5-Second Auto-Scroll) */}
      <SchemeBannerCarousel onNavigate={onNavigate} />

      {/* Metrics Grid - 4 Summary Cards with equal heights & consistent padding */}
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

      {/* Citizen Journey Steps - Workflow Section */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-civic-700 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>{t.dashboard.workflowBadge}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {t.dashboard.workflowTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t.dashboard.workflowSubtitle}
          </p>
        </div>

        {/* Responsive grid: 1 column on mobile, 2 columns on tablet, 4 columns on desktop */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => onNavigate('discover')}
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-blue-50/50 hover:border-civic-200 transition-all text-left flex flex-col justify-between w-full h-full focus:outline-none focus:ring-2 focus:ring-civic-500 group"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-civic-800 font-black text-xs flex items-center justify-center mb-3 shrink-0">
                01
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-civic-800 transition-colors">
                {t.dashboard.step1Title}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                {t.dashboard.step1Desc}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-civic-700">
              <span>{t.dashboard.step1Action}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => onNavigate('eligibility')}
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all text-left flex flex-col justify-between w-full h-full focus:outline-none focus:ring-2 focus:ring-emerald-500 group"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center mb-3 shrink-0">
                02
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors">
                {t.dashboard.step2Title}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                {t.dashboard.step2Desc}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-emerald-700">
              <span>{t.dashboard.step2Action}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => onNavigate('document-mapper')}
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all text-left flex flex-col justify-between w-full h-full focus:outline-none focus:ring-2 focus:ring-indigo-500 group"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center mb-3 shrink-0">
                03
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-800 transition-colors">
                {t.dashboard.step3Title}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                {t.dashboard.step3Desc}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-indigo-700">
              <span>{t.dashboard.step3Action}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          {/* Step 4 */}
          <button
            type="button"
            onClick={() => onNavigate('readiness-passport')}
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-amber-50/50 hover:border-amber-200 transition-all text-left flex flex-col justify-between w-full h-full focus:outline-none focus:ring-2 focus:ring-amber-500 group"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center mb-3 shrink-0">
                04
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-800 transition-colors">
                {t.dashboard.step4Title}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                {t.dashboard.step4Desc}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-amber-700">
              <span>{t.dashboard.step4Action}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        </div>
      </div>

      {/* Advanced Civic Entitlement Tools (Features 5, 6, 7) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t.dashboard.toolsBadge}
          </h3>
          <p className="text-sm font-bold text-slate-900 mt-0.5">
            {t.dashboard.toolsTitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tool 1: Voice Assistant */}
          <button
            type="button"
            onClick={() => onNavigate('voice-assistant')}
            className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-civic-400 hover:shadow-md transition-all text-left flex flex-col justify-between h-full group focus:outline-none focus:ring-2 focus:ring-civic-500"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-civic-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-civic-700">
                Feature 5
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-1">
                {t.dashboard.feat5Title}
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {t.dashboard.feat5Desc}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-civic-700">
              <span>{t.dashboard.feat5Action}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          {/* Tool 2: Trust Monitor */}
          <button
            type="button"
            onClick={() => onNavigate('trust-monitor')}
            className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all text-left flex flex-col justify-between h-full group focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Feature 6
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-1">
                {t.dashboard.feat6Title}
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {t.dashboard.feat6Desc}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-700">
              <span>{t.dashboard.feat6Action}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          {/* Tool 3: Application Tracker */}
          <button
            type="button"
            onClick={() => onNavigate('application-tracker')}
            className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all text-left flex flex-col justify-between h-full group focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shrink-0">
                <ListChecks className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Feature 7
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-1">
                {t.dashboard.feat7Title}
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {t.dashboard.feat7Desc}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-700">
              <span>{t.dashboard.feat7Action}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        </div>
      </div>

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
    </div>
  );
};
