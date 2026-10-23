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
  Sparkles,
  Monitor,
  Mic,
  ListChecks,
} from 'lucide-react';
import { NavigationTab, CitizenProfile, Scheme, DocumentRecord } from '../types';

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
              Public Kiosk Mode Active:
            </span>
            <span className="text-amber-800">
              Profile answers and document statuses exist in volatile browser memory only. No data is stored on this computer.
            </span>
          </div>
        </div>
      )}

      {/* Welcome & Challenge Header (Polished Hero) */}
      <div className="bg-gradient-to-r from-slate-900 via-civic-950 to-blue-950 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold mb-4 backdrop-blur-xs border border-white/10 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Seva First Innovation Challenge 2026</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Civic Intelligence &amp; Scheme Readiness
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            SevAIQ bridges the gap between citizens and welfare entitlements. Discover verified central
            and state government programs, assess multi-criteria eligibility transparently, and prepare
            your application documents without data privacy risk.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3.5 sm:items-center">
            <button
              type="button"
              onClick={() => onNavigate('eligibility')}
              className="h-11 px-5 rounded-xl bg-civic-600 hover:bg-civic-700 text-white font-semibold text-sm shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-white inline-flex items-center justify-center space-x-2"
            >
              <span>{profileComplete ? 'View Eligibility Results' : 'Check Your Eligibility'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('discover')}
              className="h-11 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white inline-flex items-center justify-center space-x-2"
            >
              <span>Explore Scheme Catalog</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid - 4 Summary Cards with equal heights & consistent padding */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <button
          type="button"
          onClick={() => onNavigate('discover')}
          className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-civic-300 hover:shadow-md transition-all text-left w-full group focus:outline-none focus:ring-2 focus:ring-civic-500 h-full flex flex-col justify-between"
          aria-label="View Cataloged Schemes"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Cataloged Schemes
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-civic-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Compass className="w-5 h-5" />
              </div>
            </div>
            <div className="my-3 flex items-baseline justify-between flex-wrap gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{schemes.length}</span>
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                Verified Sources
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium pt-2.5 border-t border-slate-100">
            Official gazette &amp; portal links
          </p>
        </button>

        {/* Metric 2 */}
        <button
          type="button"
          onClick={() => onNavigate('eligibility')}
          className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all text-left w-full group focus:outline-none focus:ring-2 focus:ring-emerald-500 h-full flex flex-col justify-between"
          aria-label="View Eligible Matches"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Eligible Matches
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
            </div>
            <div className="my-3 flex items-baseline justify-between flex-wrap gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{eligibleCount}</span>
              <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                {profileComplete ? 'Fully Met' : 'Profile needed'}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium pt-2.5 border-t border-slate-100">
            Criteria matched against profile
          </p>
        </button>

        {/* Metric 3 */}
        <button
          type="button"
          onClick={() => onNavigate('document-mapper')}
          className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all text-left w-full group focus:outline-none focus:ring-2 focus:ring-indigo-500 h-full flex flex-col justify-between"
          aria-label="View Document Mapper"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Documents Ready
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
            Cross-scheme document overlap
          </p>
        </button>

        {/* Metric 4 */}
        <button
          type="button"
          onClick={() => onNavigate('readiness-passport')}
          className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all text-left w-full group focus:outline-none focus:ring-2 focus:ring-amber-500 h-full flex flex-col justify-between"
          aria-label="View Readiness Passport"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Readiness Passport
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="my-3 flex items-baseline justify-between flex-wrap gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {eligibleCount > 0 && readyDocsCount > 0 ? 'Active' : 'Draft'}
              </span>
              <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                Export Ready
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium pt-2.5 border-t border-slate-100">
            Printable civic dossier
          </p>
        </button>
      </div>

      {/* Citizen Journey Steps - Workflow Section */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-civic-700 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Structured Citizen Workflow</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            How SevAIQ Empowers Your Application
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Follow the 4-stage readiness pipeline designed to maximize scheme access and minimize rejected applications.
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
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-civic-800 transition-colors">Discover Schemes</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                Browse verified central and state welfare initiatives with zero simulated data.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-civic-700">
              <span>Explore catalog</span>
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
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors">Check Eligibility</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                Fill an anonymous profile to evaluate criteria with Met, Not Met, and Unknown explanations.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-emerald-700">
              <span>Assess profile</span>
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
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-800 transition-colors">Map Documents</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                Discover shared documents across schemes, track missing certificates, and locate issuing offices.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-indigo-700">
              <span>View mapper</span>
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
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-800 transition-colors">Readiness Passport</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                Generate an exportable civic dossier with verified links, checklist, and Seva Kendra next steps.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-amber-700">
              <span>Generate passport</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        </div>
      </div>

      {/* Advanced Civic Entitlement Tools (Features 5, 6, 7) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Specialized Citizen Tools
          </h3>
          <p className="text-sm font-bold text-slate-900 mt-0.5">
            Voice Access, Government Source Audits &amp; Submission Tracking
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
                Tamil &amp; English Voice Assistant
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Ask scheme questions verbally or via text in everyday Tamil or English. Web Speech API with zero cloud audio leakage.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-civic-700">
              <span>Open Voice Assistant</span>
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
                Official-Source Trust Monitor
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Inspect government domain authenticity (.gov.in / .nic.in), real verification dates, and gazette citations for every scheme.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-700">
              <span>View Trust Audit</span>
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
                Application Guidance Tracker
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Interactive step-by-step preparation checklist from document gathering to visiting CSC centers and official portals.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-700">
              <span>Track Application Guidance</span>
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
            <h3 className="font-bold text-base text-white">Privacy-First Architecture</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              SevAIQ strictly respects citizen privacy: we <strong>never</strong> collect Aadhaar numbers,
              bank account details, or contact identifiers. Eligibility evaluation is performed
              locally on anonymous demographic parameters.
            </p>
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm flex items-start space-x-4">
          <div className="p-3 rounded-2xl bg-blue-50 text-civic-700 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Zero Hallucination Standard</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Every scheme displayed is referenced from official government gazettes and ministry portals
              (such as <a href="https://pmkisan.gov.in" target="_blank" rel="noreferrer" className="text-civic-700 font-semibold underline">pmkisan.gov.in</a> and <a href="https://pmjay.gov.in" target="_blank" rel="noreferrer" className="text-civic-700 font-semibold underline">pmjay.gov.in</a>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
