import React, { useState } from 'react';
import { Search, Filter, AlertCircle, FileCheck, ExternalLink, RefreshCw, Layers } from 'lucide-react';
import { Scheme } from '../types';

interface SchemeDiscoveryProps {
  schemes: Scheme[];
  isLoading: boolean;
  onRefreshSchemes: () => void;
  error?: string | null;
}

const CATEGORIES = [
  'All Sectors',
  'Agriculture & Rural',
  'Healthcare & Wellness',
  'Education & Skilling',
  'Social Security & Pensions',
  'Housing & Infrastructure',
];

export const SchemeDiscovery: React.FC<SchemeDiscoveryProps> = ({
  schemes,
  isLoading,
  onRefreshSchemes,
  error,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Sectors');

  // Filter schemes when populated
  const filteredSchemes = schemes.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.short_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ministry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All Sectors' || s.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <section id="discover" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-civic-700 mb-1">
            <Layers className="w-4 h-4" />
            <span>Scheme Catalog</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Discover Government Schemes
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Search verified welfare initiatives backed by official gazette records.
          </p>
        </div>

        <button
          onClick={onRefreshSchemes}
          disabled={isLoading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync from Backend (/api/schemes)</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mt-8 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by scheme name, ministry, or keywords (e.g. farmer support, pension, health insurance)..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-civic-500 focus:border-civic-500 shadow-sm transition-all"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-medium text-slate-500 flex items-center space-x-1 pr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-civic-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Error state if backend query failed */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Backend sync notification:</span> {error}
            <p className="text-xs text-amber-700 mt-1">
              Ensure the FastAPI backend is running locally on port 8000 (`uvicorn app.main:app --reload`).
            </p>
          </div>
        </div>
      )}

      {/* Schemes Container */}
      <div className="mt-8">
        {isLoading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-civic-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Querying backend /api/schemes...</p>
          </div>
        ) : filteredSchemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemes.map((scheme) => (
              <div
                key={scheme.id}
                className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-civic-50 text-civic-700 border border-civic-200">
                      {scheme.category}
                    </span>
                    {scheme.verified && (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-700">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{scheme.title}</h3>
                  <p className="text-xs text-slate-500 mb-3">{scheme.ministry}</p>
                  <p className="text-sm text-slate-600 line-clamp-3">{scheme.short_description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  {scheme.official_portal_url ? (
                    <a
                      href={scheme.official_portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-civic-600 font-semibold hover:underline"
                    >
                      <span>Official Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-slate-400">Portal link pending</span>
                  )}
                  {scheme.beneficiary_type && (
                    <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {scheme.beneficiary_type}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State Compliant with Zero Hallucination Principle */
          <div className="p-8 sm:p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-4">
              <FileCheck className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Government Scheme Collection Initialized (Empty State)
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              In accordance with our civic integrity standards for the{' '}
              <strong className="text-slate-800">Seva First Innovation Challenge 2026</strong>,{' '}
              we never fabricate or mock welfare schemes.
            </p>
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1.5">
              <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-civic-600"></span>
                <span>Verification & Ingestion Protocol:</span>
              </div>
              <p>
                1. Backend Developer will verify government schemes from official portals (e.g. <em>pmkisan.gov.in</em>, <em>india.gov.in</em>).
              </p>
              <p>
                2. Records will be populated into <code className="text-slate-800 font-mono">backend/app/data/schemes.json</code>.
              </p>
              <p>
                3. The endpoint <code className="text-slate-800 font-mono">GET /api/schemes</code> currently returns <code className="text-slate-800 font-mono">[]</code> as expected during initial setup.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
