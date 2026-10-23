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
import { useLanguage } from '../context/LanguageContext';

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
  const { t, getLocalizedScheme, getLocalizedDocument, getLocalizedOption, language } = useLanguage();
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
        language === 'ta'
          ? 'அதிகாரப்பூர்வ பாஸ்போர்ட் PDF உருவாக்க திட்ட அட்டவணையில் இருந்து குறைந்தபட்சம் ஒரு திட்டத்தையாவது தேர்ந்தெடுக்கவும்.'
          : 'Please select at least one verified government scheme from the catalog to generate the official Passport PDF.'
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
      setPdfSuccess(
        language === 'ta'
          ? `அதிகாரப்பூர்வ பாஸ்போர்ட் PDF வெற்றிகரமாக பதிவிறக்கப்பட்டது (${res.filename || 'SevAIQ_Scheme_Passport.pdf'}).`
          : `Official Passport PDF downloaded successfully (${res.filename || 'SevAIQ_Scheme_Passport.pdf'}).`
      );
    } else {
      setPdfError(res.error || (language === 'ta' ? 'FastAPI பின்தள சேவையிலிருந்து PDF உருவாக்க முடியவில்லை' : 'Failed to generate PDF from FastAPI backend service'));
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
            <span>{t.readinessPassport.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t.readinessPassport.title}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t.readinessPassport.subtitle}
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
            <span>
              {isDownloadingPdf
                ? t.readinessPassport.downloadingPdf
                : t.readinessPassport.downloadPdf}
            </span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
            title="Browser print stylesheet fallback"
          >
            <Printer className="w-4 h-4" />
            <span>{t.readinessPassport.printDossier}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('document-mapper')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
          >
            <span>{language === 'ta' ? 'ஆவண வரைபடத்தில் திருத்து' : 'Edit in Document Mapper'}</span>
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
            <span className="font-semibold">
              {language === 'ta' ? 'PDF பதிவிறக்க அறிவிப்பு:' : 'PDF Download Notice:'}
            </span>{' '}
            {pdfError}
            <p className="text-amber-800 text-[11px] mt-0.5">
              {language === 'ta'
                ? 'ஆவணத்தை உள்ளூரில் அச்சிட அல்லது பார்க்க உலாவி அச்சிடு பொத்தானைப் பயன்படுத்தலாம்.'
                : 'You can still use the Browser Print button to view or print the document locally.'}
            </p>
          </div>
        </div>
      )}

      {/* Informational Legal Advisory Banner */}
      <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 text-[11px] text-slate-600 flex items-start space-x-2.5">
        <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>
            {language === 'ta' ? 'ஆலோசனை குடிமக்கள் மதிப்பீடு:' : 'Advisory Civic Assessment:'}
          </strong>{' '}
          {language === 'ta'
            ? 'இந்த திட்ட தயார்நிலை பாஸ்போர்ட் என்பது சரிபார்க்கப்பட்ட அரசு வழிகாட்டுதல்களின் அடிப்படையில் SevAIQ உருவாக்கிய தகவல் தொகுப்பு மட்டுமே. இது அதிகாரப்பூர்வ அரசு விண்ணப்பமோ அல்லது சலுகைக்கான உத்தரவாதமோ அல்ல.'
            : 'This Scheme Readiness Passport is an informational preparedness summary generated by SevAIQ based on verified guidelines. It does not constitute an official government application, statutory approval, or entitlement guarantee.'}
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
                  {language === 'ta' ? 'சேவா முதல் கண்டுபிடிப்பு சவால் 2026' : 'Seva First Innovation Challenge 2026'}
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  SevAIQ {t.readinessPassport.title}
                </h2>
                <p className="text-xs text-slate-300">
                  {language === 'ta'
                    ? 'குடிமக்கள் தகவல் நுண்ணறிவு & சரிபார்க்கப்பட்ட ஆவணக் கோப்பு'
                    : 'Civic Intelligence & Verified Entitlement Dossier'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-300 space-y-1">
              <div className="font-mono text-amber-300 font-bold text-sm tracking-wider">
                {passportId}
              </div>
              <div>
                {language === 'ta'
                  ? `உருவாக்கப்பட்டது: ${new Date().toLocaleDateString('ta-IN', { dateStyle: 'medium' })}`
                  : `Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}`}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center sm:justify-end space-x-1">
                <span>{language === 'ta' ? 'சரிபார்க்கப்பட்ட உள்ளூர் கணக்கீடு' : 'Verified Local Computation'}</span>
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
                {language === 'ta'
                  ? '1. குடிமக்கள் புள்ளிவிவரக் குறிப்பு (பெயர் குறிப்பிடாதது)'
                  : '1. Citizen Demographic Profile (Anonymous)'}
              </h3>
              <span className="text-[11px] text-emerald-700 font-medium">
                {language === 'ta'
                  ? 'ஆதார் அல்லது வங்கி விவரங்கள் சேமிக்கப்படவில்லை'
                  : 'No Aadhaar or Bank Data Stored'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">
                  {language === 'ta' ? 'வயது / பாலினம்' : 'Age / Gender'}
                </span>
                <span className="font-semibold text-slate-800">
                  {profile.age
                    ? `${profile.age} ${language === 'ta' ? 'ஆண்டுகள்' : 'yrs'}`
                    : language === 'ta' ? 'குறிப்பிடப்படவில்லை' : 'Not set'}{' '}
                  •{' '}
                  {profile.gender
                    ? getLocalizedOption('genders', profile.gender)
                    : language === 'ta' ? 'குறிப்பிடப்படவில்லை' : 'Not set'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  {language === 'ta' ? 'வசிப்பிடம்' : 'Location'}
                </span>
                <span className="font-semibold text-slate-800">
                  {profile.state || (language === 'ta' ? 'இந்தியா' : 'India')} (
                  {profile.area
                    ? getLocalizedOption('areas', profile.area)
                    : language === 'ta' ? 'அனைத்து பகுதிகள்' : 'All regions'}
                  )
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  {language === 'ta' ? 'தொழில்' : 'Occupation'}
                </span>
                <span className="font-semibold text-slate-800">
                  {profile.occupation
                    ? getLocalizedOption('occupations', profile.occupation)
                    : language === 'ta' ? 'குறிப்பிடப்படவில்லை' : 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  {language === 'ta' ? 'வருமானம் & சமூகப் பிரிவு' : 'Income & Social Group'}
                </span>
                <span className="font-semibold text-slate-800">
                  {profile.incomeBracket
                    ? getLocalizedOption('incomes', profile.incomeBracket)
                    : language === 'ta' ? 'குறிப்பிடப்படவில்லை' : 'Not set'}{' '}
                  •{' '}
                  {profile.category
                    ? getLocalizedOption('categories', profile.category)
                    : language === 'ta' ? 'பொதுப்பிரிவு' : 'General'}
                </span>
              </div>
            </div>
          </div>

          {/* Readiness Score Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <span className="text-xs font-bold uppercase tracking-wider block">
                {language === 'ta' ? 'தகுதியான திட்டங்கள்' : 'Eligible Schemes (Met)'}
              </span>
              <span className="text-3xl font-extrabold mt-1 block">{metEvaluations.length}</span>
              <span className="text-xs text-emerald-700">
                {language === 'ta'
                  ? 'அனைத்து விதிகளும் பூர்த்தி செய்யப்பட்டுள்ளன'
                  : 'All verified criteria satisfied'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
              <span className="text-xs font-bold uppercase tracking-wider block">
                {t.readinessPassport.readinessIndex}
              </span>
              <span className="text-3xl font-extrabold mt-1 block">{readinessScore}%</span>
              <span className="text-xs text-blue-700">
                {language === 'ta'
                  ? `${relevantDocuments.length} இல் ${readyDocs.length} ஆவணங்கள் தயார்`
                  : `${readyDocs.length} of ${relevantDocuments.length} certificates ready`}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
              <span className="text-xs font-bold uppercase tracking-wider block">
                {language === 'ta' ? 'விடுபட்ட சான்றிதழ்கள்' : 'Missing Certificates'}
              </span>
              <span className="text-3xl font-extrabold mt-1 block">{missingDocs.length}</span>
              <span className="text-xs text-amber-700">
                {language === 'ta'
                  ? 'விண்ணப்பிக்கும் முன் எடுக்க வேண்டிய நடவடிக்கைகள்'
                  : 'Action items required before applying'}
              </span>
            </div>
          </div>

          {/* Target Schemes & Status */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200">
              {language === 'ta'
                ? '2. இலக்கு அரசு திட்டங்கள் & தகுதி நிர்ணயம்'
                : '2. Target Government Schemes & Eligibility Determination'}
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {evaluations.map(({ scheme, overallStatus, metCount, totalCriteriaCount }) => {
                const locScheme = getLocalizedScheme(scheme);
                return (
                  <div
                    key={scheme.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{locScheme.title}</span>
                        {overallStatus === 'met' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{language === 'ta' ? 'தகுதி பூர்த்தி' : 'Eligible'}</span>
                          </span>
                        ) : overallStatus === 'unknown' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            <HelpCircle className="w-3 h-3 text-amber-600" />
                            <span>{language === 'ta' ? 'விவரம் தேவை' : 'Needs Info'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>{language === 'ta' ? 'தகுதியில்லை' : 'Not Met'}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{locScheme.ministry}</p>
                      {locScheme.benefits_summary && (
                        <p className="text-xs text-slate-700 font-medium">
                          {language === 'ta' ? 'பயன்:' : 'Benefit:'} {locScheme.benefits_summary}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">
                        {language === 'ta'
                          ? `${metCount}/${totalCriteriaCount} விதிகள்`
                          : `${metCount}/${totalCriteriaCount} criteria`}
                      </span>
                      {scheme.official_portal_url && (
                        <a
                          href={scheme.official_portal_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-civic-700 font-semibold hover:underline"
                        >
                          <span>{language === 'ta' ? 'தளம்' : 'Portal'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document Checklist Roadmap */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200">
              {language === 'ta'
                ? '3. ஆவண சரிபார்ப்பு பட்டியல் & வழிகாட்டுதல்'
                : '3. Document Checklist & Issuance Roadmap'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ready in Hand */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === 'ta'
                      ? `கையில் தயார் (${readyDocs.length})`
                      : `Ready in Hand (${readyDocs.length})`}
                  </span>
                </span>
                {readyDocs.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {readyDocs.map((doc) => {
                      const locDoc = getLocalizedDocument(doc);
                      return (
                        <li key={doc.id} className="flex items-start space-x-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{locDoc.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    {language === 'ta' ? 'தயாரான ஆவணங்கள் எதுவும் இல்லை.' : 'No certificates marked as ready.'}
                  </p>
                )}
              </div>

              {/* Missing or Unconfirmed */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>
                    {language === 'ta'
                      ? `பெற வேண்டிய சான்றிதழ்கள் (${missingDocs.length + unconfirmedDocs.length})`
                      : `Certificates to Procure (${missingDocs.length + unconfirmedDocs.length})`}
                  </span>
                </span>
                {[...missingDocs, ...unconfirmedDocs].length > 0 ? (
                  <ul className="space-y-2 text-xs text-slate-700">
                    {[...missingDocs, ...unconfirmedDocs].map((doc) => {
                      const locDoc = getLocalizedDocument(doc);
                      return (
                        <li key={doc.id} className="flex flex-col space-y-0.5">
                          <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                            <span className="text-rose-500">•</span>
                            <span>{locDoc.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 pl-3">
                            {language === 'ta'
                              ? `வழங்கும் அதிகாரம்: ${locDoc.issuingAuthority}`
                              : `Issuing Authority: ${doc.issuingAuthority}`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-600 font-semibold">
                    {language === 'ta'
                      ? 'தேவையான அனைத்து சான்றிதழ்களும் தயார் நிலையில் உள்ளன!'
                      : 'All required certificates are ready!'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Official Next Steps Guidance */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-civic-950 text-white rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4" />
              <span>
                {language === 'ta'
                  ? '4. அதிகாரப்பூர்வ சமர்ப்பிப்பிற்கான பரிந்துரைக்கப்பட்ட அடுத்த படிகள்'
                  : '4. Recommended Next Steps for Official Submission'}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <span className="font-bold text-white block">
                  {language === 'ta' ? 'படி 1: விடுபட்ட ஆவணங்களை பெறுதல்' : 'Step 1: Procure Missing Documents'}
                </span>
                <p className="text-[11px] text-slate-400">
                  {language === 'ta'
                    ? 'உங்கள் உள்ளூர் வருவாய் அலுவலகம், வட்டாட்சியர் அல்லது கிராம ஊராட்சியை அணுகி சான்றிதழ்களைப் பெறவும்.'
                    : 'Visit your local Revenue Office, Tehsildar, or Gram Panchayat to obtain certified copies.'}
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <span className="font-bold text-white block">
                  {language === 'ta' ? 'படி 2: பொது சேவை மையத்திற்கு (CSC) செல்லுதல்' : 'Step 2: Visit Common Service Centre (CSC)'}
                </span>
                <p className="text-[11px] text-slate-400">
                  {language === 'ta'
                    ? 'இந்த தயார்நிலை ஆவணக் கோப்புடன் உங்கள் அருகிலுள்ள இ-சேவை மையம் அல்லது CSC கியோஸ்க்கை அணுகவும்.'
                    : 'Locate your nearest Seva Kendra or CSC kiosk with this readiness dossier.'}
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <span className="font-bold text-white block">
                  {language === 'ta' ? 'படி 3: அதிகாரப்பூர்வ தளத்தில் விண்ணப்பித்தல்' : 'Step 3: Direct Portal Application'}
                </span>
                <p className="text-[11px] text-slate-400">
                  {language === 'ta'
                    ? 'மேலே பட்டியலிடப்பட்டுள்ள சரிபார்க்கப்பட்ட அரசு இணையதள இணைப்புகளைப் பயன்படுத்தி ஆன்லைனில் விண்ணப்பிக்கவும்.'
                    : 'Use the verified portal links listed above to submit online with authentic credentials.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
