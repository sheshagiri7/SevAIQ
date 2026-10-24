import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Files,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Building,
  ArrowRight,
  Sparkles,
  Info,
  RefreshCw,
  Server,
  AlertCircle,
  ExternalLink,
  X,
  Printer,
} from 'lucide-react';
import {
  DocumentRecord,
  DocumentPossessionStatus,
  Scheme,
  NavigationTab,
  CitizenProfile,
  BackendDocumentMappingResponse,
} from '../types';
import { mapDocumentsApi } from '../services/api';
import {
  resolveBackendSchemeId,
  adaptProfileToBackend,
} from '../utils/schemaAdapter';
import { useLanguage } from '../context/LanguageContext';

interface DocumentMapperProps {
  documents: DocumentRecord[];
  schemes: Scheme[];
  selectedSchemeIds: string[];
  profile?: CitizenProfile;
  onToggleSchemeSelection: (schemeId: string) => void;
  onRemoveScheme?: (schemeId: string) => void;
  onResetSchemeSelection: () => void;
  onUpdateDocumentStatus: (docId: string, status: DocumentPossessionStatus) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const DocumentMapper: React.FC<DocumentMapperProps> = ({
  documents,
  schemes,
  selectedSchemeIds,
  profile,
  onToggleSchemeSelection,
  onRemoveScheme,
  onResetSchemeSelection,
  onUpdateDocumentStatus,
  onNavigate,
}) => {
  const { t, getLocalizedScheme, getLocalizedDocument, language } = useLanguage();
  const [filterTab, setFilterTab] = useState<'all' | 'shared' | 'single' | 'missing' | 'have'>('all');
  const [schemeFilter, setSchemeFilter] = useState<string>('all');

  // Backend Mapping API state
  const [backendMapping, setBackendMapping] = useState<BackendDocumentMappingResponse | null>(null);
  const [isMappingLoading, setIsMappingLoading] = useState<boolean>(false);
  const [mappingError, setMappingError] = useState<string | null>(null);

  // Active scheme IDs (if none selected, prompt citizen to select)
  const activeSchemeIds = useMemo(() => {
    return selectedSchemeIds.length > 0 ? selectedSchemeIds : [];
  }, [selectedSchemeIds]);

  // Selected schemes to display in the Target Schemes for Synergy Analysis panel
  const selectedSchemes = useMemo(() => {
    const uniqueIds = Array.from(new Set(selectedSchemeIds));
    return uniqueIds
      .map((id) =>
        schemes.find(
          (s) => s.id === id || resolveBackendSchemeId(s.id) === resolveBackendSchemeId(id)
        )
      )
      .filter((s): s is Scheme => Boolean(s));
  }, [schemes, selectedSchemeIds]);

  // Resolve valid backend scheme IDs (normalizing aliases like ab-pmjay -> pm-jay)
  const resolvedBackendIds = useMemo(() => {
    const ids = activeSchemeIds.map((id) => resolveBackendSchemeId(id));
    // Remove duplicates
    return Array.from(new Set(ids));
  }, [activeSchemeIds]);

  // Documents citizen currently marks as available in hand
  const citizenAvailableNames = useMemo(() => {
    return documents.filter((d) => d.status === 'have').map((d) => d.name);
  }, [documents]);

  // Call POST /api/documents/mapper
  const runDocumentMapping = useCallback(async () => {
    if (resolvedBackendIds.length === 0) {
      setBackendMapping(null);
      return;
    }

    setIsMappingLoading(true);
    setMappingError(null);

    const backendProfile = profile ? adaptProfileToBackend(profile, citizenAvailableNames) : null;
    const res = await mapDocumentsApi({
      scheme_ids: resolvedBackendIds,
      citizen_documents: citizenAvailableNames,
      profile: backendProfile,
    });

    setIsMappingLoading(false);

    if (res.success && res.data) {
      setBackendMapping(res.data);
    } else {
      setMappingError(res.error || 'Failed to map documents via backend API');
    }
  }, [resolvedBackendIds, citizenAvailableNames, profile]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runDocumentMapping();
    }, 200);
    return () => clearTimeout(timer);
  }, [runDocumentMapping]);

  // Fallback calculations for local reference schemes
  const relevantDocuments = useMemo(() => {
    if (activeSchemeIds.length === 0) return [];
    return documents.filter((doc) =>
      doc.applicableSchemeIds.some((sId) => activeSchemeIds.includes(sId))
    );
  }, [documents, activeSchemeIds]);

  const haveCount = backendMapping
    ? backendMapping.readiness_score.numerator
    : relevantDocuments.filter((d) => d.status === 'have').length;

  const totalCount = backendMapping
    ? backendMapping.readiness_score.denominator
    : relevantDocuments.length;

  const missingCount = backendMapping
    ? backendMapping.missing_documents.length
    : relevantDocuments.filter((d) => d.status === 'missing').length;

  const unconfirmedCount = backendMapping
    ? Math.max(0, totalCount - haveCount - missingCount)
    : relevantDocuments.filter((d) => d.status === 'unconfirmed').length;

  const readinessPercent = backendMapping
    ? backendMapping.readiness_score.score_percentage
    : totalCount > 0
    ? Math.round((haveCount / totalCount) * 100)
    : 0;

  // Shared documents across 2+ schemes
  const sharedDocuments = useMemo(() => {
    return relevantDocuments.filter(
      (doc) =>
        doc.applicableSchemeIds.filter((sId) => activeSchemeIds.includes(sId)).length > 1
    );
  }, [relevantDocuments, activeSchemeIds]);

  const sharedDocsCount = backendMapping
    ? backendMapping.reusable_documents.length
    : sharedDocuments.length;

  const singleDocsCount = backendMapping
    ? backendMapping.single_scheme_documents.length
    : relevantDocuments.filter(
        (doc) =>
          doc.applicableSchemeIds.filter((sId) => activeSchemeIds.includes(sId)).length === 1
      ).length;

  const isConditionalDoc = useCallback((doc: DocumentRecord) => {
    const text = (doc.id + ' ' + doc.name + ' ' + doc.description).toLowerCase();
    return (
      text.includes('caste') ||
      text.includes('community') ||
      text.includes('disability') ||
      text.includes('divyangjan') ||
      text.includes('vending') ||
      text.includes('vendor') ||
      text.includes('marksheet') ||
      text.includes('education') ||
      text.includes('udyam')
    );
  }, []);

  const filteredByScheme = useMemo(() => {
    if (schemeFilter === 'all') return relevantDocuments;
    return relevantDocuments.filter((doc) => doc.applicableSchemeIds.includes(schemeFilter));
  }, [relevantDocuments, schemeFilter]);

  const displayedDocs = useMemo(() => {
    let docs = filteredByScheme;
    if (filterTab === 'shared') {
      docs = docs.filter(
        (doc) =>
          doc.applicableSchemeIds.filter((sId) => activeSchemeIds.includes(sId)).length > 1
      );
    } else if (filterTab === 'single') {
      docs = docs.filter(
        (doc) =>
          doc.applicableSchemeIds.filter((sId) => activeSchemeIds.includes(sId)).length === 1
      );
    } else if (filterTab === 'missing') {
      docs = docs.filter((doc) => doc.status === 'missing');
    } else if (filterTab === 'have') {
      docs = docs.filter((doc) => doc.status === 'have');
    }
    return docs;
  }, [filteredByScheme, filterTab, activeSchemeIds]);

  const mandatoryDocs = useMemo(() => {
    return displayedDocs.filter((d) => !isConditionalDoc(d));
  }, [displayedDocs, isConditionalDoc]);

  const conditionalDocs = useMemo(() => {
    return displayedDocs.filter((d) => isConditionalDoc(d));
  }, [displayedDocs, isConditionalDoc]);

  const getProcurementGuidance = (docName: string) => {
    const name = docName.toLowerCase();
    if (name.includes('aadhaar')) {
      return {
        text: language === 'ta'
          ? 'ஆதார் அட்டை அல்லது e-Aadhaar நகலை பதிவிறக்க UIDAI போர்ட்டலை அல்லது அருகிலுள்ள இ-சேவை மையத்தை அணுகலாம்.'
          : 'Download e-Aadhaar from the official UIDAI portal or visit any Aadhaar Seva Kendra.',
        url: 'https://uidai.gov.in',
        label: 'uidai.gov.in',
      };
    }
    if (name.includes('bank') || name.includes('passbook')) {
      return {
        text: language === 'ta'
          ? 'உங்கள் வங்கி அல்லது தபால் நிலைய கிளைக்கு சென்று கணக்கு புத்தகத்தை புதுப்பித்துக் கொள்ளவும். IFSC குறியீடு தெளிவாக இருக்க வேண்டும்.'
          : 'Visit your local bank branch or post office to update passbook with clear IFSC and account numbers.',
        url: null,
        label: null,
      };
    }
    if (name.includes('land') || name.includes('patta') || name.includes('ror') || name.includes('record')) {
      return {
        text: language === 'ta'
          ? 'மாநில நில ஆவண போர்டல் (எ.கா. தமிழ்நாடு இ-சேவை / நிலம்) அல்லது தாலுகா வட்டாட்சியர் அலுவலகத்தில் பட்டா/சிட்டா நகல் பெறலாம்.'
          : 'Download certified land record from your State Land Records portal or obtain it from the Taluk/Tehsildar office.',
        url: 'https://eservices.tn.gov.in',
        label: 'State Land Records / e-Services',
      };
    }
    if (name.includes('income')) {
      return {
        text: language === 'ta'
          ? 'அரசு பொது சேவை மையம் (e-Seva Kendra) அல்லது மாவட்ட வருவாய்த் துறை மூலம் வருமானச் சான்றிதழ் பெறலாம்.'
          : 'Apply at your nearest Common Service Centre (CSC / e-Seva) or District Revenue Portal.',
        url: 'https://www.tnesevai.tn.gov.in',
        label: 'e-Seva Portal',
      };
    }
    if (name.includes('caste') || name.includes('community')) {
      return {
        text: language === 'ta'
          ? 'அரசு இ-சேவை மையம் அல்லது வட்டாட்சியர் அலுவலகம் மூலம் சாதிச் சான்றிதழ் பெறலாம்.'
          : 'Apply at your nearest e-Seva Kendra or Taluk Revenue Office.',
        url: 'https://www.tnesevai.tn.gov.in',
        label: 'e-Seva Portal',
      };
    }
    if (name.includes('ration')) {
      return {
        text: language === 'ta'
          ? 'உணவு வழங்கல் துறை போர்ட்டலில் ஸ்மார்ட் குடும்ப அட்டையை பதிவிறக்கலாம் அல்லது சரிபார்க்கலாம்.'
          : 'Check or download smart card from State Food & Civil Supplies portal.',
        url: 'https://www.tnpds.gov.in',
        label: 'State PDS Portal',
      };
    }
    if (name.includes('udyam') || name.includes('business')) {
      return {
        text: language === 'ta'
          ? 'சிறு தொழில் மற்றும் வியாபாரிகளுக்கு அதிகாரப்பூர்வ உத்யாம் பதிவு போர்ட்டலில் இலவசமாக பதிவு செய்யலாம்.'
          : 'Register free of cost at the official Udyam Registration portal (udyamregistration.gov.in).',
        url: 'https://udyamregistration.gov.in',
        label: 'Udyam Registration Portal',
      };
    }
    return {
      text: language === 'ta'
        ? 'அருகிலுள்ள கிராம நிர்வாக அலுவலர் (VAO) அல்லது அரசு பொது சேவை மையத்தை (CSC) அணுகவும்.'
        : 'Visit your nearest Village Administrative Officer (VAO) or Common Service Centre (CSC) for guidance.',
      url: null,
      label: null,
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-civic-700 mb-1">
            <Files className="w-4 h-4" />
            <span>{language === 'ta' ? 'படி 3: ஆவணங்கள் தயார்' : language === 'hi' ? 'चरण 3: दस्तावेज़ तैयारी' : 'Stage 3: Prepare Documents'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {language === 'ta' ? 'தேவையான ஆவணங்கள்: சரிபார்ப்பு பட்டியல்' : language === 'hi' ? 'आवश्यक दस्तावेज़: चेकलिस्ट' : 'Documents You Need: Actionable Checklist'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {language === 'ta'
              ? 'உங்கள் கையில் உள்ள ஆவணங்களை குறிக்கவும், விடுபட்டவற்றை எங்கு பெறலாம் என்பதை அறியவும்.'
              : language === 'hi'
              ? 'अपने पास उपलब्ध दस्तावेज़ों को चिह्नित करें और देखें कि शेष कहां से प्राप्त करें।'
              : 'Mark the documents you have in hand, see what you still need to get, and find where to procure them.'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start md:self-auto flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs shadow-xs transition-all cursor-pointer"
            title="Print or save this checklist as PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>{language === 'ta' ? 'அச்சிடு / PDF சேமி' : 'Print Checklist'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('application-tracker')}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <span>{language === 'ta' ? 'அடுத்த படி: விண்ணப்ப நிலை (படி 4)' : 'Next: Track Application (Stage 4)'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Backend Synchronization Notification */}
      {isMappingLoading && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl flex items-center space-x-2 text-xs font-medium">
          <RefreshCw className="w-4 h-4 text-civic-600 animate-spin shrink-0" />
          <span>
            {language === 'ta'
              ? 'தேர்ந்தெடுத்த திட்டங்களுக்கான ஆவணங்கள் பகுப்பாய்வு செய்யப்படுகின்றன...'
              : 'Organizing your document checklist across selected schemes...'}
          </span>
        </div>
      )}

      {backendMapping && !isMappingLoading && (
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 text-emerald-950 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>
                {language === 'ta'
                  ? 'சரிபார்க்கப்பட்ட ஆவண பட்டியல்:'
                  : 'Verified Document Checklist:'}
              </strong>{' '}
              {language === 'ta'
                ? `${backendMapping.selected_scheme_ids.length} திட்டங்களில் பகுப்பாய்வு செய்யப்பட்டது (${backendMapping.reusable_documents.length} பொது ஆவணங்கள்).`
                : `Checked across ${backendMapping.selected_scheme_ids.length} schemes (${backendMapping.reusable_documents.length} reusable documents you only need to get once).`}
            </span>
          </div>
          <button
            type="button"
            onClick={runDocumentMapping}
            className="text-emerald-800 underline font-semibold flex items-center space-x-1 hover:text-emerald-900 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{language === 'ta' ? 'மீண்டும் புதுப்பி' : 'Refresh'}</span>
          </button>
        </div>
      )}

      {mappingError && !isMappingLoading && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start space-x-3 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {language === 'ta'
                ? 'பின்தள ஆவண இணைப்பு அறிவிப்பு:'
                : language === 'hi'
                ? 'बैकएंड दस्तावेज़ मैपर सूचना:'
                : 'Backend Document Mapper Notice:'}{' '}
              {mappingError}
            </p>
            <p className="text-amber-800 mt-0.5">
              {language === 'ta'
                ? 'உள்ளூர் ஆவண இணைப்பு மாதிரி மாற்றாக காட்டப்படுகிறது.'
                : language === 'hi'
                ? 'वैकल्पिक रूप से स्थानीय दस्तावेज़ तालमेल मॉडल दिखाया जा रहा है।'
                : 'Showing local document synergy model as fallback.'}
            </p>
          </div>
        </div>
      )}

      {/* Target Schemes Selector Pill Bar */}
      <div className="bg-white dark:bg-[#17324D] rounded-xl border border-[#D7DEE5] dark:border-[#223B56] p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#202B36] dark:text-white">
              {t.documentMapper.selectedSchemes}
            </span>
            <span className="text-xs text-[#596775] dark:text-slate-400">
              {language === 'ta'
                ? `(${selectedSchemes.length} தேர்வு செய்யப்பட்டுள்ளது)`
                : language === 'hi'
                ? `(${selectedSchemes.length} चयनित)`
                : `(${selectedSchemes.length} selected)`}
            </span>
          </div>
          {selectedSchemes.length > 0 && (
            <button
              type="button"
              onClick={onResetSchemeSelection}
              className="text-xs text-[#16733B] dark:text-emerald-400 hover:text-[#105C2E] self-start sm:self-auto underline focus:outline-none focus:ring-2 focus:ring-[#16733B] rounded px-1 cursor-pointer"
            >
              {t.documentMapper.resetSelection}
            </button>
          )}
        </div>

        {selectedSchemes.length === 0 ? (
          <div className="py-6 px-4 bg-[#F5F7F8] dark:bg-[#0F2133] border border-dashed border-[#D7DEE5] dark:border-[#223B56] rounded-xl text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-[#596775] dark:text-slate-400 flex items-center justify-center mx-auto">
              <Files className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-[#202B36] dark:text-slate-200">
              {t.documentMapper.emptyState ||
                'No schemes added yet. Explore schemes and click ‘Add to Mapper’ to compare document requirements.'}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('discover')}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#16733B] dark:text-emerald-300 bg-white dark:bg-[#17324D] border border-[#D7DEE5] dark:border-[#223B56] hover:bg-[#EDF6EF] dark:hover:bg-slate-800 rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              <span>{language === 'ta' ? 'திட்டங்களை ஆராய்க' : language === 'hi' ? 'योजनाएं खोजें' : 'Explore Schemes'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedSchemes.map((s) => {
              const locScheme = getLocalizedScheme(s);
              return (
                <div
                  key={s.id}
                  className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl text-xs font-semibold bg-[#17324D] text-white shadow-xs group"
                >
                  <span className="truncate max-w-[220px] sm:max-w-xs">{locScheme.title.split('(')[0].trim()}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onRemoveScheme) {
                        onRemoveScheme(s.id);
                      } else {
                        onToggleSchemeSelection(s.id);
                      }
                    }}
                    aria-label={`Remove ${locScheme.title} from synergy analysis`}
                    title={language === 'ta' ? 'நீக்கு' : language === 'hi' ? 'हटाएं' : 'Remove scheme'}
                    className="p-0.5 hover:bg-slate-700 rounded-md transition-colors text-slate-300 hover:text-white focus:outline-none focus:ring-1 focus:ring-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Readiness Progress Bar & Synergy Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="p-6 bg-white dark:bg-[#17324D] rounded-xl border border-[#D7DEE5] dark:border-[#223B56] shadow-xs flex flex-col justify-between md:col-span-1">
          <div>
            <span className="text-xs font-bold text-[#596775] dark:text-slate-400 uppercase tracking-wider">
              {t.documentMapper.readinessScore}
            </span>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-4xl font-extrabold text-[#202B36] dark:text-white">{readinessPercent}%</span>
              <span className="text-xs text-[#596775] dark:text-slate-400">
                (
                {language === 'ta'
                  ? `${totalCount} இல் ${haveCount} தயார்`
                  : language === 'hi'
                  ? `${totalCount} में से ${haveCount} तैयार`
                  : `${haveCount} of ${totalCount} ready`}
                )
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 w-full h-3 bg-[#F5F7F8] dark:bg-[#0F2133] rounded-full overflow-hidden border border-[#D7DEE5] dark:border-[#223B56]">
              <div
                className="h-full bg-[#16733B] rounded-full transition-all duration-500"
                style={{ width: `${readinessPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D7DEE5] dark:border-[#223B56] grid grid-cols-3 text-center text-xs">
            <div>
              <span className="text-[#16733B] font-bold block">{haveCount}</span>
              <span className="text-[#596775] dark:text-slate-400 text-[10px]">
                {language === 'ta' ? 'தயார்' : language === 'hi' ? 'तैयार' : 'Ready'}
              </span>
            </div>
            <div>
              <span className="text-[#991B1B] font-bold block">{missingCount}</span>
              <span className="text-[#596775] dark:text-slate-400 text-[10px]">
                {language === 'ta' ? 'விடுபட்டவை' : language === 'hi' ? 'अनुपलब्ध' : 'Missing'}
              </span>
            </div>
            <div>
              <span className="text-[#92400E] font-bold block">{unconfirmedCount}</span>
              <span className="text-[#596775] dark:text-slate-400 text-[10px]">
                {language === 'ta' ? 'உறுதிப்படுத்தப்படவில்லை' : language === 'hi' ? 'अपुष्ट' : 'Unconfirmed'}
              </span>
            </div>
          </div>

          {backendMapping?.readiness_score && (
            <div className="mt-3 p-2.5 bg-[#F5F7F8] dark:bg-[#0F2133] rounded-xl border border-[#D7DEE5] dark:border-[#223B56] text-[10px] text-[#596775] dark:text-slate-400 space-y-1">
              <span className="font-mono text-[#202B36] dark:text-white block font-semibold">
                {backendMapping.readiness_score.formula}
              </span>
              <p className="italic leading-snug">{backendMapping.readiness_score.disclaimer}</p>
            </div>
          )}
        </div>

        {/* Shared Synergy Insight */}
        <div className="p-6 bg-[#17324D] text-white rounded-xl border border-[#223B56] shadow-xs md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md bg-white/10 text-[#EDF6EF] text-xs font-semibold mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {language === 'ta'
                  ? 'திட்டங்களுக்கிடையேயான பலன்'
                  : language === 'hi'
                  ? 'योजनाओं के बीच तालमेल'
                  : 'Cross-Scheme Synergy Unlocked'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">
              {language === 'ta'
                ? `${sharedDocsCount} பொது ஆவணங்கள் கண்டறியப்பட்டுள்ளன`
                : language === 'hi'
                ? `${sharedDocsCount} साझा दस्तावेज़ मिले`
                : `${sharedDocsCount} Shared Documents Found`}
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {language === 'ta'
                ? 'பல திட்டங்களுக்கு விண்ணப்பிக்கும்போது ஒவ்வொரு முறையும் ஆவணங்களை புதிதாக பெற வேண்டியதில்லை. ஒரே சான்றிதழ் (வருமானச் சான்றிதழ், இருப்பிடச் சான்றிதழ் போன்றவை) பல அரசு திட்டங்களுக்கு செல்லும்.'
                : language === 'hi'
                ? 'कई योजनाओं के लिए आवेदन करने का अर्थ बार-बार दस्तावेज़ बनवाना नहीं है। एक सत्यापित प्रमाणपत्र (जैसे आय प्रमाणपत्र या मूल निवास प्रमाणपत्र) कई मंत्रालयों की योजनाओं में मान्य होता है।'
                : 'Applying for multiple schemes does not mean duplicating paperwork. One verified document (such as an Income Certificate or Domicile Certificate) satisfies eligibility proof across multiple government ministries.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
            {sharedDocuments.map((doc: DocumentRecord) => {
              const loc = getLocalizedDocument(doc);
              const schemeOverlapCount = doc.applicableSchemeIds.filter((id: string) =>
                activeSchemeIds.includes(id)
              ).length;
              return (
                <span
                  key={doc.id}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/15 text-white text-xs font-medium backdrop-blur-xs"
                >
                  <span>{loc.name}</span>
                  <span className="text-cyan-300 font-mono text-[10px]">
                    (
                    {language === 'ta'
                      ? `${schemeOverlapCount} திட்டங்கள்`
                      : language === 'hi'
                      ? `${schemeOverlapCount} योजनाएं`
                      : `${schemeOverlapCount} schemes`}
                    )
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scheme-Specific Filter Selector */}
      {activeSchemeIds.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {language === 'ta' ? 'திட்டம் வாரியாக வடிகட்டுக:' : 'Filter by Selected Scheme:'}
          </span>
          <button
            type="button"
            onClick={() => setSchemeFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              schemeFilter === 'all'
                ? 'bg-civic-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            {language === 'ta' ? `அனைத்து திட்டங்கள் (${relevantDocuments.length})` : `All Selected Schemes (${relevantDocuments.length})`}
          </button>
          {activeSchemeIds.map((sId) => {
            const s = schemes.find((x) => x.id === sId);
            const title = s ? s.title.split('(')[0].trim() : sId;
            const docCountForScheme = relevantDocuments.filter((d) => d.applicableSchemeIds.includes(sId)).length;
            return (
              <button
                key={sId}
                type="button"
                onClick={() => setSchemeFilter(sId)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  schemeFilter === sId
                    ? 'bg-civic-700 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {title} ({docCountForScheme})
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filterTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {language === 'ta'
            ? `அனைத்து ஆவணங்கள் (${totalCount})`
            : language === 'hi'
            ? `सभी आवश्यक दस्तावेज़ (${totalCount})`
            : `All Required Documents (${totalCount})`}
        </button>

        <button
          onClick={() => setFilterTab('shared')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filterTab === 'shared'
              ? 'bg-indigo-700 text-white'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
          }`}
        >
          {language === 'ta'
            ? `பொதுவானவை (${sharedDocsCount})`
            : language === 'hi'
            ? `साझा तालमेल (${sharedDocsCount})`
            : `Shared Synergies (${sharedDocsCount})`}
        </button>

        <button
          onClick={() => setFilterTab('single')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filterTab === 'single'
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
          }`}
        >
          {language === 'ta'
            ? `குறிப்பிட்டவை (${singleDocsCount})`
            : language === 'hi'
            ? `योजना-विशिष्ट (${singleDocsCount})`
            : `Scheme-Specific (${singleDocsCount})`}
        </button>

        <button
          onClick={() => setFilterTab('missing')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filterTab === 'missing'
              ? 'bg-rose-700 text-white'
              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          {language === 'ta'
            ? `விடுபட்டவை (${missingCount})`
            : language === 'hi'
            ? `प्राप्त करने योग्य (${missingCount})`
            : `Missing to Procure (${missingCount})`}
        </button>

        <button
          onClick={() => setFilterTab('have')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filterTab === 'have'
              ? 'bg-emerald-700 text-white'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          {language === 'ta'
            ? `கையில் உள்ளவை (${haveCount})`
            : language === 'hi'
            ? `पास में उपलब्ध (${haveCount})`
            : `Ready in Hand (${haveCount})`}
        </button>
      </div>

      {/* Category Breakdown Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {language === 'ta' ? 'ஆவண வகைப்பாடு:' : 'Document Classification:'}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
          {language === 'ta'
            ? `அடிப்படை கட்டாய ஆவணங்கள் (${mandatoryDocs.length})`
            : `Mandatory Core (${mandatoryDocs.length})`}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
          {language === 'ta'
            ? `நிபந்தனை / தகுதி சார்ந்த ஆவணங்கள் (${conditionalDocs.length})`
            : `Conditional / Category-Specific (${conditionalDocs.length})`}
        </span>
      </div>

      {/* Document Items List with Explicit Distinction */}
      <div className="space-y-4">
        {displayedDocs.length > 0 ? (
          displayedDocs.map((doc) => {
            const applicableInSelection = schemes.filter(
              (s) =>
                doc.applicableSchemeIds.includes(s.id) && activeSchemeIds.includes(s.id)
            );
            const isMultiScheme = applicableInSelection.length > 1;
            const locDoc = getLocalizedDocument(doc);

            return (
              <div
                key={doc.id}
                className="p-6 bg-white dark:bg-[#17324D] rounded-xl border border-[#D7DEE5] dark:border-[#223B56] shadow-xs hover:border-[#16733B] dark:hover:border-[#16733B] transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-[#202B36] dark:text-white">{locDoc.name}</h3>
                      {isMultiScheme ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#EDF6EF] dark:bg-[#105C2E]/30 text-[#16733B] dark:text-emerald-300 border border-[#D7DEE5] dark:border-[#223B56]">
                          <Sparkles className="w-3 h-3 text-[#16733B]" />
                          <span>
                            {language === 'ta'
                              ? `${applicableInSelection.length} திட்டங்களுக்கு பொதுவானது (மறுபயன்பாடு)`
                              : language === 'hi'
                              ? `${applicableInSelection.length} योजनाओं में साझा (पुन: प्रयोज्य)`
                              : `Shared across ${applicableInSelection.length} schemes (reusable once)`}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#F5F7F8] dark:bg-[#0F2133] text-[#596775] dark:text-slate-300 border border-[#D7DEE5] dark:border-[#223B56]">
                          <span>
                            {language === 'ta'
                              ? 'குறிப்பிட்ட திட்டத் தேவை'
                              : language === 'hi'
                              ? 'योजना-विशिष्ट आवश्यकता'
                              : 'Scheme-Specific Requirement'}
                          </span>
                        </span>
                      )}

                      {isConditionalDoc(doc) ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                          {language === 'ta' ? 'நிபந்தனை ஆவணம்' : 'Conditional / Category'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EDF6EF] text-[#16733B] border border-[#D7DEE5]">
                          {language === 'ta' ? 'அடிப்படை ஆவணம்' : 'Core Mandatory'}
                        </span>
                      )}

                      {/* Possession Status Indicator Badge */}
                      {doc.status === 'have' ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#16733B] bg-[#EDF6EF] px-2 py-0.5 rounded-md border border-[#D7DEE5]">
                          <CheckCircle2 className="w-3 h-3 text-[#16733B]" />
                          <span>
                            {language === 'ta'
                              ? 'கையில் உள்ளது (தயார்)'
                              : language === 'hi'
                              ? 'पास में है (तैयार)'
                              : 'Possessed (Ready)'}
                          </span>
                        </span>
                      ) : doc.status === 'missing' ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#991B1B] bg-[#FEE2E2] px-2 py-0.5 rounded-md border border-[#FECACA]">
                          <XCircle className="w-3 h-3 text-[#991B1B]" />
                          <span>
                            {language === 'ta'
                              ? 'விடுபட்டது (பெற வேண்டும்)'
                              : language === 'hi'
                              ? 'अनुपलब्ध (प्राप्त करें)'
                              : 'Missing (Must Procure)'}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-md border border-[#FDE68A]">
                          <HelpCircle className="w-3 h-3 text-[#92400E]" />
                          <span>
                            {language === 'ta'
                              ? 'உறுதிப்படுத்தப்படவில்லை'
                              : language === 'hi'
                              ? 'अपुष्ट'
                              : 'Unconfirmed'}
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#596775] dark:text-slate-300 leading-relaxed max-w-2xl">{locDoc.description}</p>
                    {applicableInSelection.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {language === 'ta' ? 'தேவைப்படும் திட்டங்கள்:' : 'Required by:'}
                        </span>
                        {applicableInSelection.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                          >
                            {s.title.split('(')[0].trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interactive 3-Way Status Selector */}
                  <div className="flex items-center space-x-1.5 p-1 bg-[#F5F7F8] dark:bg-[#0F2133] border border-[#D7DEE5] dark:border-[#223B56] rounded-xl self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateDocumentStatus(doc.id, 'have')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                        doc.status === 'have'
                          ? 'bg-[#16733B] text-white shadow-xs'
                          : 'text-[#596775] hover:text-[#202B36] dark:hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'கையில் உள்ளது' : language === 'hi' ? 'मेरे पास है' : 'I Have This'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateDocumentStatus(doc.id, 'missing')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                        doc.status === 'missing'
                          ? 'bg-[#D97735] text-white shadow-xs'
                          : 'text-[#596775] hover:text-[#202B36] dark:hover:text-white'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'தேவைப்படுகிறது' : language === 'hi' ? 'चाहिए' : 'I Need This'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateDocumentStatus(doc.id, 'unconfirmed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                        doc.status === 'unconfirmed'
                          ? 'bg-[#596775] text-white shadow-xs'
                          : 'text-[#596775] hover:text-[#202B36] dark:hover:text-white'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'தெரியவில்லை' : language === 'hi' ? 'निश्चित नहीं' : 'Not Sure'}</span>
                    </button>
                  </div>
                </div>

                {/* Procurement Guidance when missing or unconfirmed */}
                {doc.status !== 'have' && (() => {
                  const procurement = getProcurementGuidance(doc.name);
                  return (
                    <div className="p-3 bg-[#FEF3C7]/40 dark:bg-amber-950/30 border border-[#FDE68A] dark:border-amber-900/60 rounded-xl text-xs text-[#92400E] dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-start space-x-2.5">
                        <Info className="w-4 h-4 text-[#92400E] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[#92400E] dark:text-amber-300 block text-[11px]">
                            {language === 'ta' ? 'இதை எவ்வாறு பெறுவது:' : 'How to procure this:'}
                          </span>
                          <p className="text-[11px] text-[#92400E]/90 dark:text-amber-200/90 leading-relaxed">
                            {procurement.text}
                          </p>
                        </div>
                      </div>
                      {procurement.url && (
                        <a
                          href={procurement.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-[#D97735] hover:bg-[#b86128] text-white rounded-lg font-semibold text-[11px] self-start sm:self-auto shrink-0 shadow-xs transition-colors"
                        >
                          <span>{procurement.label}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  );
                })()}

                {/* Details Footer: Issuing Authority & Applicable Schemes */}
                <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Building className="w-4 h-4 text-civic-600 shrink-0" />
                    <span>
                      {t.documentMapper.issuingAuthority}{' '}
                      <strong className="text-slate-800">{locDoc.issuingAuthority}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400">
                      {language === 'ta' ? 'தேவைப்படும் திட்டங்கள்:' : language === 'hi' ? 'आवश्यक योजनाएं:' : 'Required by:'}
                    </span>
                    {applicableInSelection.map((s) => {
                      const locScheme = getLocalizedScheme(s);
                      return (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]"
                        >
                          {locScheme.title.split('(')[0].trim()}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 bg-white dark:bg-[#17324D] rounded-xl border border-[#D7DEE5] dark:border-[#223B56] text-center space-y-2">
            <Info className="w-8 h-8 text-[#596775] mx-auto" />
            <h3 className="text-sm font-bold text-[#202B36] dark:text-white">
              {selectedSchemes.length === 0
                ? language === 'ta'
                  ? 'திட்டங்கள் எதுவும் சேர்க்கப்படவில்லை'
                  : language === 'hi'
                  ? 'कोई योजना नहीं जोड़ी गई है'
                  : 'No schemes added yet'
                : language === 'ta'
                ? 'இப்பிரிவில் ஆவணங்கள் எதுவும் இல்லை'
                : language === 'hi'
                ? 'इस श्रेणी में कोई दस्तावेज़ नहीं'
                : 'No documents in this view'}
            </h3>
            <p className="text-xs text-[#596775] dark:text-slate-400 max-w-md mx-auto">
              {selectedSchemes.length === 0
                ? t.documentMapper.emptyState ||
                  'No schemes added yet. Explore schemes and click ‘Add to Mapper’ to compare document requirements.'
                : language === 'ta'
                ? 'அனைத்து ஆவணங்களையும் காண மேலே உள்ள வடிகட்டியை மாற்றவும்.'
                : language === 'hi'
                ? 'सभी आवश्यक प्रमाणपत्र देखने के लिए ऊपर फ़िल्टर टैब बदलें।'
                : 'Change the filter tab above to view all required certificates.'}
            </p>
          </div>
        )}
      </div>

      {/* You're Ready for the Next Step Transition Card */}
      <div
        className={`p-6 sm:p-8 rounded-xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          readinessPercent >= 80
            ? 'bg-[#EDF6EF] dark:bg-[#17324D] text-[#202B36] dark:text-white border-[#16733B]/40'
            : 'bg-white dark:bg-[#17324D] border-[#D7DEE5] dark:border-[#223B56] text-[#202B36] dark:text-white'
        }`}
      >
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                readinessPercent >= 80 ? 'bg-[#16733B] text-white' : 'bg-[#EDF6EF] text-[#16733B]'
              }`}
            >
              {language === 'ta' ? 'அடுத்த கட்ட நடவடிக்கை' : 'Next Step Guidance'}
            </span>
            <span className={`text-xs font-bold ${readinessPercent >= 80 ? 'text-[#16733B] dark:text-emerald-300' : 'text-[#596775] dark:text-slate-400'}`}>
              {readinessPercent}% {language === 'ta' ? 'தயார்நிலை' : 'Readiness'}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#202B36] dark:text-white">
            {readinessPercent >= 80
              ? language === 'ta'
                ? 'நீங்கள் அடுத்த கட்டத்திற்கு தயாராக உள்ளீர்கள்!'
                : "You're Ready for the Next Step!"
              : language === 'ta'
              ? 'ஆவணங்கள் தயாரானதும் விண்ணப்பிக்கவும்'
              : 'Prepare Remaining Documents to Apply'}
          </h3>

          <p className="text-xs sm:text-sm leading-relaxed max-w-2xl text-[#596775] dark:text-slate-300">
            {readinessPercent >= 80
              ? language === 'ta'
                ? 'உங்கள் முக்கிய ஆவணங்கள் அனைத்தும் கையில் உள்ளன. அதிகாரப்பூர்வ அரசு போர்ட்டலில் விண்ணப்பிக்க படி 4-க்கு செல்லவும்.'
                : 'You have your key documents ready in hand. Move to Stage 4: Track Application to see direct submission portal links and monitor your status.'
              : language === 'ta'
              ? 'விடுபட்ட ஆவணங்களை அருகில் உள்ள இ-சேவை மையம் அல்லது அரசு போர்ட்டல் மூலம் பெற்று, பின்னர் விண்ணப்பிக்கவும்.'
              : 'Procure any missing documents using the links above, or visit your nearest e-Seva Kendra. You can also print this checklist.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs border border-[#D7DEE5] dark:border-[#223B56] bg-white dark:bg-[#0F2133] hover:bg-[#F5F7F8] dark:hover:bg-[#17324D] text-[#202B36] dark:text-white transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'ta' ? 'பட்டியலை அச்சிடு' : 'Print Checklist'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('application-tracker')}
            className="px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer bg-[#16733B] hover:bg-[#105C2E] text-white"
          >
            <span>{language === 'ta' ? 'அடுத்தது: விண்ணப்ப நிலை (படி 4)' : 'Next: Track Application (Stage 4)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Official Source Attributions & Verification Citations */}
      {backendMapping?.official_source_references && backendMapping.official_source_references.length > 0 && (
        <div className="p-6 bg-white dark:bg-[#17324D] rounded-xl border border-[#D7DEE5] dark:border-[#223B56] shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {language === 'ta'
                ? 'சரிபார்க்கப்பட்ட திட்ட ஆவண வழிகாட்டுதல்கள்'
                : language === 'hi'
                ? 'सत्यापित योजना दस्तावेज़ संदर्भ एवं दिशानिर्देश'
                : 'Verified Scheme Document Citations & Operational Guidelines'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {backendMapping.official_source_references.map((ref) => (
              <div
                key={ref.scheme_id}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5"
              >
                <span className="font-bold text-slate-900 block">{ref.scheme_title}</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {ref.verification_source ||
                    (language === 'ta'
                      ? 'சரிபார்க்கப்பட்ட அரசு திட்ட வழிகாட்டுதல்கள்'
                      : language === 'hi'
                      ? 'सत्यापित सरकारी योजना दिशानिर्देश'
                      : 'Verified Government Scheme Guidelines')}
                </p>
                {ref.official_portal_url && (
                  <a
                    href={ref.official_portal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-[11px] text-civic-700 font-semibold hover:underline pt-0.5"
                  >
                    <span>{t.discover.officialPortal}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
