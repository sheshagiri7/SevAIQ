import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Files,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Building,
  Award,
  ArrowRight,
  Sparkles,
  Info,
  RefreshCw,
  Server,
  AlertCircle,
  ExternalLink,
  X,
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

  const displayedDocs = useMemo(() => {
    if (filterTab === 'shared') {
      return relevantDocuments.filter(
        (doc) =>
          doc.applicableSchemeIds.filter((sId) => activeSchemeIds.includes(sId)).length > 1
      );
    }
    if (filterTab === 'single') {
      return relevantDocuments.filter(
        (doc) =>
          doc.applicableSchemeIds.filter((sId) => activeSchemeIds.includes(sId)).length === 1
      );
    }
    if (filterTab === 'missing') return relevantDocuments.filter((doc) => doc.status === 'missing');
    if (filterTab === 'have') return relevantDocuments.filter((doc) => doc.status === 'have');
    return relevantDocuments;
  }, [relevantDocuments, filterTab, activeSchemeIds]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-civic-700 mb-1">
            <Files className="w-4 h-4" />
            <span>{t.documentMapper.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t.documentMapper.title}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t.documentMapper.subtitle}
          </p>
        </div>

        <button
          onClick={() => onNavigate('readiness-passport')}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-civic-700 hover:bg-civic-800 text-white font-semibold text-xs shadow-md transition-all self-start md:self-auto"
        >
          <Award className="w-4 h-4" />
          <span>{t.documentMapper.proceedPassport}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Backend Synchronization Notification */}
      {isMappingLoading && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl flex items-center space-x-2 text-xs font-medium">
          <RefreshCw className="w-4 h-4 text-civic-600 animate-spin shrink-0" />
          <span>
            {language === 'ta'
              ? 'FastAPI மூலம் பல திட்டங்களுக்கான ஆவண இணைப்பை கணக்கிடுகிறது...'
              : language === 'hi'
              ? 'FastAPI के माध्यम से बहु-योजना दस्तावेज़ तालमेल की गणना की जा रही है...'
              : 'Computing cross-scheme document synergy via FastAPI POST /api/documents/mapper...'}
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
                  ? 'சேவையக ஆவண இணைப்பு:'
                  : language === 'hi'
                  ? 'सर्वर-गणना दस्तावेज़ तालमेल:'
                  : 'Server-Computed Document Synergy:'}
              </strong>{' '}
              {language === 'ta'
                ? `${backendMapping.selected_scheme_ids.length} திட்டங்களில் பகுப்பாய்வு செய்யப்பட்டது (${backendMapping.reusable_documents.length} மறுபயன்பாட்டு ஆவணங்கள், ${backendMapping.single_scheme_documents.length} தனித்த ஆவணங்கள்).`
                : language === 'hi'
                ? `${backendMapping.selected_scheme_ids.length} योजनाओं में विश्लेषण किया गया (${backendMapping.reusable_documents.length} पुन: प्रयोज्य दस्तावेज़, ${backendMapping.single_scheme_documents.length} योजना-विशिष्ट दस्तावेज़)।`
                : `Analyzed across ${backendMapping.selected_scheme_ids.length} schemes (${backendMapping.reusable_documents.length} reusable multi-scheme documents, ${backendMapping.single_scheme_documents.length} scheme-specific).`}
            </span>
          </div>
          <button
            type="button"
            onClick={runDocumentMapping}
            className="text-emerald-800 underline font-semibold flex items-center space-x-1 hover:text-emerald-900"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{language === 'ta' ? 'மீண்டும் பகுப்பாய்வு' : language === 'hi' ? 'पुन: विश्लेषण करें' : 'Re-analyze'}</span>
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
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {t.documentMapper.selectedSchemes}
            </span>
            <span className="text-xs text-slate-400">
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
              className="text-xs text-slate-600 hover:text-slate-900 self-start sm:self-auto underline focus:outline-none focus:ring-2 focus:ring-civic-500 rounded px-1 cursor-pointer"
            >
              {t.documentMapper.resetSelection}
            </button>
          )}
        </div>

        {selectedSchemes.length === 0 ? (
          <div className="py-6 px-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
              <Files className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              {t.documentMapper.emptyState ||
                'No schemes added yet. Explore schemes and click ‘Add to Mapper’ to compare document requirements.'}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('discover')}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-civic-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl text-xs font-semibold bg-civic-800 text-white shadow-xs group"
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
                    className="p-0.5 hover:bg-civic-700 rounded-md transition-colors text-slate-300 hover:text-white focus:outline-none focus:ring-1 focus:ring-white cursor-pointer"
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
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between md:col-span-1">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.documentMapper.readinessScore}
            </span>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-4xl font-extrabold text-slate-900">{readinessPercent}%</span>
              <span className="text-xs text-slate-500">
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
            <div className="mt-4 w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${readinessPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 text-center text-xs">
            <div>
              <span className="text-emerald-700 font-bold block">{haveCount}</span>
              <span className="text-slate-500 text-[10px]">
                {language === 'ta' ? 'தயார்' : language === 'hi' ? 'तैयार' : 'Ready'}
              </span>
            </div>
            <div>
              <span className="text-rose-700 font-bold block">{missingCount}</span>
              <span className="text-slate-500 text-[10px]">
                {language === 'ta' ? 'விடுபட்டவை' : language === 'hi' ? 'अनुपलब्ध' : 'Missing'}
              </span>
            </div>
            <div>
              <span className="text-amber-700 font-bold block">{unconfirmedCount}</span>
              <span className="text-slate-500 text-[10px]">
                {language === 'ta' ? 'உறுதிப்படுத்தப்படவில்லை' : language === 'hi' ? 'अपुष्ट' : 'Unconfirmed'}
              </span>
            </div>
          </div>

          {backendMapping?.readiness_score && (
            <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 space-y-1">
              <span className="font-mono text-slate-700 block font-semibold">
                {backendMapping.readiness_score.formula}
              </span>
              <p className="italic leading-snug">{backendMapping.readiness_score.disclaimer}</p>
            </div>
          )}
        </div>

        {/* Shared Synergy Insight */}
        <div className="p-6 bg-gradient-to-br from-indigo-900 via-civic-900 to-slate-900 text-white rounded-3xl shadow-sm md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-200 text-xs font-semibold mb-3 border border-white/10">
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
                className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-civic-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{locDoc.name}</h3>
                      {isMultiScheme ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          <span>
                            {language === 'ta'
                              ? `${applicableInSelection.length} திட்டங்களுக்கு பொதுவானது (மறுபயன்பாடு)`
                              : language === 'hi'
                              ? `${applicableInSelection.length} योजनाओं में साझा (पुन: प्रयोज्य)`
                              : `Shared across ${applicableInSelection.length} schemes (reusable once)`}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <span>
                            {language === 'ta'
                              ? 'குறிப்பிட்ட திட்டத் தேவை'
                              : language === 'hi'
                              ? 'योजना-विशिष्ट आवश्यकता'
                              : 'Scheme-Specific Requirement'}
                          </span>
                        </span>
                      )}

                      {/* Possession Status Indicator Badge */}
                      {doc.status === 'have' ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>
                            {language === 'ta'
                              ? 'கையில் உள்ளது (தயார்)'
                              : language === 'hi'
                              ? 'पास में है (तैयार)'
                              : 'Possessed (Ready)'}
                          </span>
                        </span>
                      ) : doc.status === 'missing' ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>
                            {language === 'ta'
                              ? 'விடுபட்டது (பெற வேண்டும்)'
                              : language === 'hi'
                              ? 'अनुपलब्ध (प्राप्त करें)'
                              : 'Missing (Must Procure)'}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <HelpCircle className="w-3 h-3 text-amber-600" />
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
                    <p className="text-xs text-slate-600">{locDoc.description}</p>
                  </div>

                  {/* Interactive Status Selector Pill */}
                  <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto shrink-0">
                    <button
                      onClick={() => onUpdateDocumentStatus(doc.id, 'have')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                        doc.status === 'have'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'கையில் உள்ளது' : language === 'hi' ? 'मेरे पास है' : 'I Have This'}</span>
                    </button>

                    <button
                      onClick={() => onUpdateDocumentStatus(doc.id, 'missing')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                        doc.status === 'missing'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'இல்லை' : language === 'hi' ? 'नहीं है' : 'Missing'}</span>
                    </button>

                    <button
                      onClick={() => onUpdateDocumentStatus(doc.id, 'unconfirmed')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                        doc.status === 'unconfirmed'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'தெரியவில்லை' : language === 'hi' ? 'पता नहीं' : 'Unconfirmed'}</span>
                    </button>
                  </div>
                </div>

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
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
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
            <p className="text-xs text-slate-500 max-w-md mx-auto">
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

      {/* Official Source Attributions & Verification Citations */}
      {backendMapping?.official_source_references && backendMapping.official_source_references.length > 0 && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
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
