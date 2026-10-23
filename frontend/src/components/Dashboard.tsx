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
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs flex items-center justify-between">
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

      {/* Welcome & Challenge Header */}
      <div className="bg-gradient-to-r from-slate-900 via-civic-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold mb-4 backdrop-blur-xs border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Seva First Innovation Challenge 2026</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Civic Intelligence & Scheme Readiness
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            SevAIQ bridges the gap between citizens and welfare entitlements. Discover verified central
            and state government programs, assess multi-criteria eligibility transparently, and prepare
            your application documents without data privacy risk.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('eligibility')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-civic-600 hover:bg-civic-700 text-white font-semibold text-sm shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-white"
            >
              <span>{profileComplete ? 'View Eligibility Results' : 'Check Your Eligibility'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('discover')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white"
            >
              <span>Explore Scheme Catalog</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid - Semantic Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <button
          type="button"
          onClick={() => onNavigate('discover')}
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-civic-300 hover:shadow-md transition-all text-left w-full group focus:outline-none focus:ring-2 focus:ring-civic-500"
          aria-label="View Cataloged Schemes"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Cataloged Schemes
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-civic-700 group-hover:scale-110 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{schemes.length}</span>
            <span className="text-xs text-emerald-700 font-semibold">Verified Sources</span>
          </div>
          <p className="mt-1 text-xs text-slate-600 font-medium">Official gazette & portal links</p>
        </button>

        {/* Metric 2 */}
        <button
          type="button"
          onClick={() => onNavigate('eligibility')}
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all text-left w-full group focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="View Eligible Matches"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Eligible Matches
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{eligibleCount}</span>
            <span className="text-xs text-slate-600 font-semibold">
              {profileComplete ? 'Fully Met' : 'Profile needed'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600 font-medium">Criteria matched against profile</p>
        </button>

        {/* Metric 3 */}
        <button
          type="button"
          onClick={() => onNavigate('document-mapper')}
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all text-left w-full group focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="View Document Mapper"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Documents Ready
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 group-hover:scale-110 transition-transform">
              <Files className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {readyDocsCount}/{totalDocsCount}
            </span>
            <span className="text-xs text-indigo-700 font-bold">{readinessPercentage}%</span>
          </div>
          <p className="mt-1 text-xs text-slate-600 font-medium">Cross-scheme document overlap</p>
        </button>

        {/* Metric 4 */}
        <button
          type="button"
          onClick={() => onNavigate('readiness-passport')}
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all text-left w-full group focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="View Readiness Passport"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Readiness Passport
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {eligibleCount > 0 && readyDocsCount > 0 ? 'Active' : 'Draft'}
            </span>
            <span className="text-xs text-amber-800 font-semibold">Export Ready</span>
          </div>
          <p className="mt-1 text-xs text-slate-600 font-medium">Printable civic dossier</p>
        </button>
      </div>

      {/* Citizen Journey Steps - Semantic Buttons */}
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

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => onNavigate('discover')}
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-blue-50/50 hover:border-civic-200 transition-all text-left flex flex-col justify-between w-full focus:outline-none focus:ring-2 focus:ring-civic-500"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-civic-800 font-bold text-xs flex items-center justify-center mb-3">
                01
              </div>
              <h3 className="font-bold text-sm text-slate-900">Discover Schemes</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                Browse verified central and state welfare initiatives with zero simulated data.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-civic-700">
              <span>Explore catalog</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => onNavigate('eligibility')}
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all text-left flex flex-col justify-between w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center mb-3">
                02
              </div>
              <h3 className="font-bold text-sm text-slate-900">Check Eligibility</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                Fill an anonymous profile to evaluate criteria with Met, Not Met, and Unknown explanations.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-emerald-700">
              <span>Assess profile</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => onNavigate('document-mapper')}
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all text-left flex flex-col justify-between w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center mb-3">
                03
              </div>
              <h3 className="font-bold text-sm text-slate-900">Map Documents</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                Discover shared documents across schemes, track missing certificates, and locate issuing offices.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-indigo-700">
              <span>View mapper</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </button>

          {/* Step 4 */}
          <button
            type="button"
            onClick={() => onNavigate('readiness-passport')}
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-amber-50/50 hover:border-amber-200 transition-all text-left flex flex-col justify-between w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center mb-3">
                04
              </div>
              <h3 className="font-bold text-sm text-slate-900">Readiness Passport</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                Generate an exportable civic dossier with verified links, checklist, and Seva Kendra next steps.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-amber-700">
              <span>Generate passport</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
            Voice Access, Government Source Audits & Submission Tracking
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tool 1: Voice Assistant */}
          <button
            type="button"
            onClick={() => onNavigate('voice-assistant')}
            className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-civic-400 hover:shadow-md transition-all text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-civic-500"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-civic-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-civic-700">
                Feature 5
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-1">
                Tamil & English Voice Assistant
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Ask scheme questions verbally or via text in everyday Tamil or English. Web Speech API with zero cloud audio leakage.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-civic-700">
              <span>Open Voice Assistant</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </div>
          </button>

          {/* Tool 2: Trust Monitor */}
          <button
            type="button"
            onClick={() => onNavigate('trust-monitor')}
            className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </div>
          </button>

          {/* Tool 3: Application Tracker */}
          <button
            type="button"
            onClick={() => onNavigate('application-tracker')}
            className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
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
