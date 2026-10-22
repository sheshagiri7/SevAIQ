import React from 'react';
import { Sparkles, Shield, CheckCircle, Database, ArrowRight } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-20 bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-200/50 via-indigo-100/40 to-emerald-100/40 blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Project Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-civic-50 border border-civic-200 text-civic-800 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-civic-600" />
          <span>Seva First Innovation Challenge 2026</span>
          <span className="text-civic-300">•</span>
          <span className="text-slate-600 font-normal">Civic Tech Track</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-tight">
          Empowering Citizens with{' '}
          <span className="bg-gradient-to-r from-blue-700 via-civic-600 to-indigo-700 bg-clip-text text-transparent">
            Verifiable Government Schemes
          </span>
        </h1>

        {/* Description */}
        <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          <strong className="text-slate-800">SevAIQ</strong> connects citizens directly to central and state
          welfare programs through verifiable, hallucination-free civic intelligence.
        </p>

        {/* CTA Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-civic-600 hover:bg-civic-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
          >
            <span>Discover Government Schemes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#architecture"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 shadow-sm transition-all"
          >
            <span>View Architecture & API Contract</span>
          </a>
        </div>

        {/* Key Guarantees */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Zero Hallucination</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Schemes are added only after verification against official government portals.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Targeted Eligibility</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Matches citizens to schemes tailored to their occupation, location, and demographic profile.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Decoupled Architecture</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                FastAPI backend + Vite React frontend, built collaboratively for national scale.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
