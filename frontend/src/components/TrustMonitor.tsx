import React, { useState } from 'react';
import {
  ShieldCheck,
  ExternalLink,
  Calendar,
  AlertTriangle,
  Building,
  Info,
  CheckCircle2,
  Filter,
  FileText,
  Search,
  ArrowRight,
} from 'lucide-react';
import { Scheme, NavigationTab } from '../types';

interface TrustMonitorProps {
  schemes: Scheme[];
  onNavigate: (tab: NavigationTab) => void;
  onSelectSchemeForEligibility?: (scheme: Scheme) => void;
}

export interface SchemeTrustAudit {
  scheme: Scheme;
  hasOfficialGovDomain: boolean;
  domainName: string | null;
  hasRealDate: boolean;
  verificationDate: string | null;
  hasGazetteCitation: boolean;
  isFullyVerified: boolean;
  flags: string[];
}

export function auditSchemeTrust(scheme: Scheme): SchemeTrustAudit {
  const flags: string[] = [];

  // Check URL & Domain
  let hasOfficialGovDomain = false;
  let domainName: string | null = null;

  if (scheme.official_portal_url) {
    try {
      const url = new URL(scheme.official_portal_url);
      domainName = url.hostname;
      if (
        domainName.endsWith('.gov.in') ||
        domainName.endsWith('.nic.in') ||
        domainName.endsWith('.ac.in')
      ) {
        hasOfficialGovDomain = true;
      } else {
        flags.push('Non-standard government domain (requires verification)');
      }
    } catch {
      flags.push('Malformed portal URL');
    }
  } else {
    flags.push('Official portal URL missing');
  }

  // Check Verification Date
  const hasRealDate = Boolean(
    scheme.verification_date && scheme.verification_date.trim() !== ''
  );
  if (!hasRealDate) {
    flags.push('Last-verification date is not recorded');
  }

  // Check Gazette Citation
  const hasGazetteCitation = Boolean(
    scheme.verification_source && scheme.verification_source.trim() !== ''
  );
  if (!hasGazetteCitation) {
    flags.push('Official gazette citation or ministry source citation missing');
  }

  const isFullyVerified =
    scheme.verified && hasOfficialGovDomain && hasRealDate && hasGazetteCitation;

  return {
    scheme,
    hasOfficialGovDomain,
    domainName,
    hasRealDate,
    verificationDate: hasRealDate ? scheme.verification_date! : null,
    hasGazetteCitation,
    isFullyVerified,
    flags,
  };
}

export const TrustMonitor: React.FC<TrustMonitorProps> = ({
  schemes,
  onNavigate,
  onSelectSchemeForEligibility,
}) => {
  const [filter, setFilter] = useState<'all' | 'verified' | 'flagged'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const audits: SchemeTrustAudit[] = schemes.map(auditSchemeTrust);

  const fullyVerifiedCount = audits.filter((a) => a.isFullyVerified).length;
  const flaggedCount = audits.filter((a) => a.flags.length > 0).length;

  const filteredAudits = audits.filter((a) => {
    if (filter === 'verified' && !a.isFullyVerified) return false;
    if (filter === 'flagged' && a.flags.length === 0) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = a.scheme.title.toLowerCase().includes(q);
      const matchMinistry = a.scheme.ministry.toLowerCase().includes(q);
      const matchDomain = a.domainName ? a.domainName.toLowerCase().includes(q) : false;
      return matchTitle || matchMinistry || matchDomain;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-civic-700 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Civic Provenance Audit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Official-Source Trust Monitor
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Transparent metadata verification, gazette citations, and authentic government domain checks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('discover')}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs self-start md:self-auto"
        >
          <span>Return to Catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Honest Labeling & Transparency Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-3xl text-blue-950 text-xs flex items-start space-x-3.5">
        <Info className="w-5 h-5 text-civic-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-civic-900 block text-sm">
            Metadata-Based Official Gazette & Source Integrity Audit:
          </span>
          <p className="text-slate-700 leading-relaxed text-xs">
            SevAIQ never marks a scheme as verified merely because an external URL exists. Every record is verified against published operational guidelines, nodal ministry gazettes, and official <code className="bg-white/90 px-1 py-0.5 rounded font-mono text-slate-800">.gov.in</code> / <code className="bg-white/90 px-1 py-0.5 rounded font-mono text-slate-800">.nic.in</code> portals. This Trust Monitor displays real metadata dates without claiming automated live scraping.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Schemes Audited */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Schemes Audited
            </span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900">{schemes.length}</span>
              <span className="text-xs text-slate-600 font-semibold">Active catalog</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Cross-verified against FastAPI backend storage</p>
        </div>

        {/* Fully Verified Records */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Fully Verified Records
            </span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-emerald-700">{fullyVerifiedCount}</span>
              <span className="text-xs text-emerald-600 font-semibold">
                ({schemes.length > 0 ? Math.round((fullyVerifiedCount / schemes.length) * 100) : 0}%)
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Backed by authentic .gov.in domain & real gazette date
          </p>
        </div>

        {/* Records with Flags */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Metadata Notices / Pending
            </span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-amber-800">{flaggedCount}</span>
              <span className="text-xs text-amber-700 font-semibold">Need review</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Records missing explicit date or non-standard portal URL
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1 pr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Audit Filter:</span>
          </span>

          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Schemes ({audits.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter('verified')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              filter === 'verified'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Fully Verified ({fullyVerifiedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('flagged')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              filter === 'flagged'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Flags / Pending ({flaggedCount})</span>
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by scheme or domain..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-civic-500"
          />
        </div>
      </div>

      {/* Audit Scheme Cards */}
      <div className="space-y-4">
        {filteredAudits.length > 0 ? (
          filteredAudits.map((audit) => {
            const { scheme, hasOfficialGovDomain, domainName, hasRealDate, verificationDate, hasGazetteCitation, isFullyVerified, flags } = audit;

            return (
              <div
                key={scheme.id}
                className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-civic-300 transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-civic-50 text-civic-700">
                        {scheme.category}
                      </span>

                      {isFullyVerified ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Fully Verified Record</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Verification Notice Pending</span>
                        </span>
                      )}

                      {hasOfficialGovDomain && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <span>Official Portal: {domainName}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{scheme.title}</h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center space-x-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{scheme.ministry}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                    {onSelectSchemeForEligibility && (
                      <button
                        type="button"
                        onClick={() => onSelectSchemeForEligibility(scheme)}
                        className="px-3 py-1.5 rounded-xl bg-civic-50 hover:bg-civic-100 text-civic-800 font-semibold text-xs transition-colors"
                      >
                        Check Eligibility
                      </button>
                    )}
                    {scheme.official_portal_url && (
                      <a
                        href={scheme.official_portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-civic-50 hover:text-civic-800 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <span>Open Official Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Audit Grid Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
                  {/* Verification Date */}
                  <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                    <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider block flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Last Gazette Check</span>
                    </span>
                    <p className="font-bold text-slate-800">
                      {hasRealDate ? verificationDate : 'No Verification Date on Record'}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {hasRealDate ? 'Verified against authentic source' : 'Stale or unrecorded check'}
                    </span>
                  </div>

                  {/* Gazette Provenance */}
                  <div className="p-3 bg-slate-50 rounded-2xl space-y-1 md:col-span-2">
                    <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider block flex items-center space-x-1">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span>Source Provenance Citation</span>
                    </span>
                    <p className="text-slate-800 font-medium text-xs leading-snug">
                      {hasGazetteCitation ? scheme.verification_source : 'No official source citation recorded in metadata.'}
                    </p>
                  </div>
                </div>

                {/* Metadata Flags Notice if any */}
                {flags.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-1">
                    <span className="font-bold block flex items-center space-x-1 text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Trust Inspection Notices ({flags.length}):</span>
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-amber-900 space-y-0.5">
                      {flags.map((flag, idx) => (
                        <li key={idx}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No schemes matched the trust filter</h3>
            <p className="text-xs text-slate-500">
              Try selecting "All Schemes" or clearing your search term.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
