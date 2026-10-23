import React, { useState, useMemo } from 'react';
import {
  Award,
  ShieldCheck,
  Printer,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  CitizenProfile,
  Scheme,
  DocumentRecord,
  NavigationTab,
  PassportRequest,
} from '../types';
import { evaluateSchemeEligibility } from '../utils/eligibilityEngine';
import { downloadPassportPdfApi, triggerBlobDownload } from '../services/api';
import { adaptProfileToBackend, resolveBackendSchemeId } from '../utils/schemaAdapter';

interface ReadinessPassportProps {
  profile: CitizenProfile;
  schemes: Scheme[];
  documents: DocumentRecord[];
  selectedSchemeIds: string[];
  onNavigate: (tab: NavigationTab) => void;
}

export const ReadinessPassport: React.FC<ReadinessPassportProps> = ({
  profile,
  schemes,
  documents,
  selectedSchemeIds,
  onNavigate,
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);

  const activeSchemeIds =
    selectedSchemeIds.length > 0 ? selectedSchemeIds : schemes.map((s) => s.id);

  // Valid backend scheme IDs (resolving aliases e.g. ab-pmjay -> pm-jay)
  const validBackendSchemeIds = useMemo(() => {
    const backendCatalogIds = new Set(
      schemes.map((s) => resolveBackendSchemeId(s.id).toLowerCase())
    );
    const resolved = activeSchemeIds
      .map((id) => resolveBackendSchemeId(id))
      .filter((id) => backendCatalogIds.has(id.toLowerCase()));
    return Array.from(new Set(resolved));
  }, [activeSchemeIds, schemes]);

  const targetSchemes = schemes.filter((s) => activeSchemeIds.includes(s.id));
  const evaluations = targetSchemes.map((s) => evaluateSchemeEligibility(s, profile));

  const metEvaluations = evaluations.filter((e) => e.overallStatus === 'met');

  const relevantDocuments = documents.filter((doc) =>
    doc.applicableSchemeIds.some((sId) => activeSchemeIds.includes(sId))
  );

  const readyDocs = relevantDocuments.filter((d) => d.status === 'have');
  const missingDocs = relevantDocuments.filter((d) => d.status === 'missing');
  const unconfirmedDocs = relevantDocuments.filter((d) => d.status === 'unconfirmed');

  const readinessScore =
    relevantDocuments.length > 0
      ? Math.round((readyDocs.length / relevantDocuments.length) * 100)
      : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadOfficialPdf = async () => {
    if (validBackendSchemeIds.length === 0) {
      setPdfError(
        'Please select at least one verified government scheme from the catalog to generate the official Passport PDF.'
      );
      return;
    }

    setIsDownloadingPdf(true);
    setPdfError(null);
    setPdfSuccess(null);

    const availableDocNames = documents.filter((d) => d.status === 'have').map((d) => d.name);
    const backendProfile = adaptProfileToBackend(profile, availableDocNames);

    const req: PassportRequest = {
      scheme_ids: validBackendSchemeIds,
      profile: backendProfile,
      citizen_documents: availableDocNames,
      notes: 'Generated via SevAIQ Citizen Self-Service Portal',
    };

    const res = await downloadPassportPdfApi(req);
    setIsDownloadingPdf(false);

    if (res.success && res.blob) {
      triggerBlobDownload(res.blob, res.filename || 'SevAIQ_Scheme_Passport.pdf');
      setPdfSuccess(`Official Passport PDF downloaded successfully (${res.filename || 'SevAIQ_Scheme_Passport.pdf'}).`);
    } else {
      setPdfError(res.error || 'Failed to generate PDF from FastAPI backend service');
    }
  };

  // Generate a non-sensitive unique identifier per generated report session
  // Does not encode or leak citizen personal demographics
  const [passportId] = React.useState(() => {
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timeToken = Date.now().toString(36).slice(-4).toUpperCase();
    return `SEVAIQ-2026-${randomPart}-${timeToken}`;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and Print Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-civic-700 mb-1">
            <Award className="w-4 h-4" />
            <span>Civic Credential</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Scheme Readiness Passport
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Your consolidated, verified civic application dossier ready for submission.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleDownloadOfficialPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-civic-700 hover:bg-civic-800 disabled:bg-civic-400 text-white font-semibold text-xs shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-civic-500"
          >
            {isDownloadingPdf ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isDownloadingPdf ? 'Generating In-Memory PDF...' : 'Download Scheme Passport (PDF)'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
            title="Browser print stylesheet fallback"
          >
            <Printer className="w-4 h-4" />
            <span>Browser Print</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('document-mapper')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Edit in Document Mapper</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {pdfSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl flex items-center space-x-3 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{pdfSuccess}</span>
        </div>
      )}

      {pdfError && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl flex items-start space-x-3 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">PDF Download Notice:</span> {pdfError}
            <p className="text-amber-800 text-[11px] mt-0.5">
              You can still use the <strong>Browser Print</strong> button to view or print the document locally.
            </p>
          </div>
        </div>
      )}

      {/* Informational Legal Advisory Banner */}
      <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 text-[11px] text-slate-600 flex items-start space-x-2.5">
        <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Advisory Civic Assessment:</strong> This Scheme Readiness Passport is an informational preparedness summary generated by SevAIQ based on verified guidelines. It does not constitute an official government application, statutory approval, or entitlement guarantee.
        </p>
      </div>

      {/* Printable Passport Card Shell */}
      <div
        id="passport-dossier"
        className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl overflow-hidden print:border-none print:shadow-none"
      >
        {/* Passport Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-900 via-civic-900 to-indigo-950 text-white p-6 sm:p-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
                <ShieldCheck className="w-8 h-8 text-amber-300 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-widest block">
                  Seva First Innovation Challenge 2026
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  SevAIQ Scheme Readiness Passport
                </h2>
                <p className="text-xs text-slate-300">
                  Civic Intelligence & Verified Entitlement Dossier
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-300 space-y-1">
              <div className="font-mono text-amber-300 font-bold text-sm tracking-wider">
                {passportId}
              </div>
              <div>Generated: {new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center sm:justify-end space-x-1">
                <span>Verified Local Computation</span>
                <span>✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Passport Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Profile Overview (Privacy Preserved) */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Citizen Demographic Profile (Anonymous)
              </h3>
              <span className="text-[11px] text-emerald-700 font-medium">
                No Aadhaar or Bank Data Stored
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Age / Gender</span>
                <span className="font-semibold text-slate-800">
                  {profile.age ? `${profile.age} yrs` : 'Not set'} • {profile.gender || 'Not set'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span className="font-semibold text-slate-800">
                  {profile.state || 'India'} ({profile.area || 'All regions'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Occupation</span>
                <span className="font-semibold text-slate-800">
                  {profile.occupation || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Income & Social Group</span>
                <span className="font-semibold text-slate-800">
                  {profile.incomeBracket || 'Not set'} • {profile.category || 'General'}
                </span>
              </div>
            </div>
          </div>

          {/* Readiness Score Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <span className="text-xs font-bold uppercase tracking-wider block">
                Eligible Schemes (Met)
              </span>
              <span className="text-3xl font-extrabold mt-1 block">{metEvaluations.length}</span>
              <span className="text-xs text-emerald-700">All verified criteria satisfied</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
              <span className="text-xs font-bold uppercase tracking-wider block">
                Document Readiness
              </span>
              <span className="text-3xl font-extrabold mt-1 block">{readinessScore}%</span>
              <span className="text-xs text-blue-700">
                {readyDocs.length} of {relevantDocuments.length} certificates ready
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
              <span className="text-xs font-bold uppercase tracking-wider block">
                Missing Certificates
              </span>
              <span className="text-3xl font-extrabold mt-1 block">{missingDocs.length}</span>
              <span className="text-xs text-amber-700">Action items required before applying</span>
            </div>
          </div>

          {/* Target Schemes & Status */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200">
              2. Target Government Schemes & Eligibility Determination
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {evaluations.map(({ scheme, overallStatus, metCount, totalCriteriaCount }) => (
                <div
                  key={scheme.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{scheme.title}</span>
                      {overallStatus === 'met' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Eligible</span>
                        </span>
                      ) : overallStatus === 'unknown' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          <HelpCircle className="w-3 h-3 text-amber-600" />
                          <span>Needs Info</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Not Met</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{scheme.ministry}</p>
                    {scheme.benefits_summary && (
                      <p className="text-xs text-slate-700 font-medium">
                        Benefit: {scheme.benefits_summary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      {metCount}/{totalCriteriaCount} criteria
                    </span>
                    {scheme.official_portal_url && (
                      <a
                        href={scheme.official_portal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-civic-700 font-semibold hover:underline"
                      >
                        <span>Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document Checklist Roadmap */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200">
              3. Document Checklist & Issuance Roadmap
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ready in Hand */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ready in Hand ({readyDocs.length})</span>
                </span>
                {readyDocs.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {readyDocs.map((doc) => (
                      <li key={doc.id} className="flex items-start space-x-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{doc.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">No certificates marked as ready.</p>
                )}
              </div>

              {/* Missing or Unconfirmed */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Certificates to Procure ({missingDocs.length + unconfirmedDocs.length})</span>
                </span>
                {[...missingDocs, ...unconfirmedDocs].length > 0 ? (
                  <ul className="space-y-2 text-xs text-slate-700">
                    {[...missingDocs, ...unconfirmedDocs].map((doc) => (
                      <li key={doc.id} className="flex flex-col space-y-0.5">
                        <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                          <span className="text-rose-500">•</span>
                          <span>{doc.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 pl-3">
                          Issuing Authority: {doc.issuingAuthority}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-600 font-semibold">
                    All required certificates are ready!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Official Next Steps Guidance */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-civic-950 text-white rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4" />
              <span>4. Recommended Next Steps for Official Submission</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <span className="font-bold text-white block">Step 1: Procure Missing Documents</span>
                <p className="text-[11px] text-slate-400">
                  Visit your local Revenue Office, Tehsildar, or Gram Panchayat to obtain certified copies.
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <span className="font-bold text-white block">Step 2: Visit Common Service Centre (CSC)</span>
                <p className="text-[11px] text-slate-400">
                  Locate your nearest Seva Kendra or CSC kiosk with this readiness dossier.
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <span className="font-bold text-white block">Step 3: Direct Portal Application</span>
                <p className="text-[11px] text-slate-400">
                  Use the verified portal links listed above to submit online with authentic credentials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
