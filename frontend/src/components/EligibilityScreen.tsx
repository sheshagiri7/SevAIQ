import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  User,
  Shield,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
  ArrowRight,
  Filter,
  RefreshCw,
  Server,
  ExternalLink,
  X,
} from 'lucide-react';
import {
  CitizenProfile,
  Scheme,
  SchemeEvaluationResult,
  EligibilityStatus,
  NavigationTab,
  DocumentRecord,
  BackendEligibilityCheckResponse,
} from '../types';
import { evaluateSchemeEligibility } from '../utils/eligibilityEngine';
import { checkEligibilityApi } from '../services/api';
import {
  adaptProfileToBackend,
  adaptBackendEligibilityResult,
  resolveBackendSchemeId,
} from '../utils/schemaAdapter';
import { useLanguage } from '../context/LanguageContext';


interface EligibilityScreenProps {
  schemes: Scheme[];
  profile: CitizenProfile;
  documents?: DocumentRecord[];
  onUpdateProfile: (updated: Partial<CitizenProfile>) => void;
  onNavigate: (tab: NavigationTab) => void;
  onSelectForMapper: (schemeId: string) => void;
  selectedSchemeIdsForMapper: string[];
  isKioskMode?: boolean;
  onResetProfile?: () => void;
  onPreFillDemoProfile?: () => void;
  targetSchemeId?: string | null;
  onClearTargetScheme?: () => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi (NCT)', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
];

const OCCUPATIONS = [
  'Farmer / Cultivator',
  'Agricultural Worker',
  'Street Vendor / Hawker',
  'Small Business / Artisan',
  'Daily Wage / Informal Worker',
  'Self-Employed',
  'Student / Scholar',
  'Salaried Employee (Private)',
  'Homemaker',
  'Senior Citizen / Retired',
  'Unemployed / Jobseeker',
];

export const EligibilityScreen: React.FC<EligibilityScreenProps> = ({
  schemes,
  profile,
  documents = [],
  onUpdateProfile,
  onNavigate,
  onSelectForMapper,
  selectedSchemeIdsForMapper,
  isKioskMode = false,
  onResetProfile,
  onPreFillDemoProfile,
  targetSchemeId,
  onClearTargetScheme,
}) => {
  const { language, t, getLocalizedScheme, getLocalizedOption } = useLanguage();
  const [profileEditorOpen, setProfileEditorOpen] = useState(
    !profile.age || !profile.occupation
  );
  const [statusFilter, setStatusFilter] = useState<'all' | EligibilityStatus>('all');
  const isSchemeMatching = useCallback((schemeId: string, filterId: string) => {
    if (!schemeId || !filterId) return false;
    const sId = schemeId.toLowerCase();
    const fId = filterId.toLowerCase();
    if (sId === fId) return true;
    return resolveBackendSchemeId(sId).toLowerCase() === resolveBackendSchemeId(fId).toLowerCase();
  }, []);

  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(() => {
    if (targetSchemeId) {
      const matched = schemes.find((s) => isSchemeMatching(s.id, targetSchemeId));
      return matched ? matched.id : targetSchemeId;
    }
    return null;
  });

  const [selectedSchemeFilter, setSelectedSchemeFilter] = useState<string>(targetSchemeId || 'all');

  useEffect(() => {
    if (targetSchemeId) {
      setSelectedSchemeFilter(targetSchemeId);
      const matched = schemes.find((s) => isSchemeMatching(s.id, targetSchemeId));
      const targetId = matched ? matched.id : targetSchemeId;
      setExpandedSchemeId(targetId);
      setStatusFilter('all');

      const timer = setTimeout(() => {
        const el = document.getElementById(`eligibility-scheme-${targetId}`) || document.getElementById(`eligibility-scheme-${targetSchemeId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setSelectedSchemeFilter('all');
    }
  }, [targetSchemeId, schemes, isSchemeMatching]);

  const activeTargetScheme = useMemo(() => {
    if (!selectedSchemeFilter || selectedSchemeFilter === 'all') return null;
    return schemes.find((s) => isSchemeMatching(s.id, selectedSchemeFilter)) || null;
  }, [schemes, selectedSchemeFilter, isSchemeMatching]);

  // Server-side eligibility state
  const [backendResponse, setBackendResponse] = useState<BackendEligibilityCheckResponse | null>(null);
  const [isEvaluatingBackend, setIsEvaluatingBackend] = useState<boolean>(false);
  const [backendEvalError, setBackendEvalError] = useState<string | null>(null);
  const [lastEvaluatedAt, setLastEvaluatedAt] = useState<Date | null>(null);

  const availableDocNames = useMemo(() => {
    return documents.filter((d) => d.status === 'have').map((d) => d.name);
  }, [documents]);

  const runBackendEvaluation = useCallback(async () => {
    setIsEvaluatingBackend(true);
    setBackendEvalError(null);

    const backendProfile = adaptProfileToBackend(profile, availableDocNames);
    const result = await checkEligibilityApi(backendProfile);
    setIsEvaluatingBackend(false);

    if (result.success && result.data) {
      setBackendResponse(result.data);
      setLastEvaluatedAt(new Date());
    } else {
      setBackendEvalError(result.error || 'Failed to evaluate eligibility with backend service');
    }
  }, [profile, availableDocNames]);

  // Debounced auto-evaluation when profile or documents change
  useEffect(() => {
    const timer = setTimeout(() => {
      runBackendEvaluation();
    }, 200);
    return () => clearTimeout(timer);
  }, [runBackendEvaluation]);

  // Compute unified evaluation results:
  // If backend returned results, map each scheme; fallback to client evaluator for local-only schemes or if backend is offline.
  const evaluationResults: SchemeEvaluationResult[] = useMemo(() => {
    if (backendResponse && backendResponse.schemes && backendResponse.schemes.length > 0) {
      const backendMap = new Map<string, typeof backendResponse.schemes[0]>();
      backendResponse.schemes.forEach((s) => {
        backendMap.set(s.scheme_id.toLowerCase(), s);
      });

      return schemes.map((scheme) => {
        const canonicalId = resolveBackendSchemeId(scheme.id);
        const bResult = backendMap.get(canonicalId.toLowerCase());
        if (bResult) {
          return adaptBackendEligibilityResult(bResult, scheme);
        }
        // Local-only scheme (e.g. nsp-post-matric)
        return evaluateSchemeEligibility(scheme, profile);
      });
    }

    // Fallback: evaluate all schemes client-side
    return schemes.map((scheme) => evaluateSchemeEligibility(scheme, profile));
  }, [schemes, profile, backendResponse]);

  const metCount = evaluationResults.filter((r) => r.overallStatus === 'met').length;
  const unknownCount = evaluationResults.filter((r) => r.overallStatus === 'unknown').length;
  const notMetCount = evaluationResults.filter((r) => r.overallStatus === 'not_met').length;

  const filteredResults = evaluationResults.filter((r) => {
    if (selectedSchemeFilter !== 'all') {
      if (!isSchemeMatching(r.scheme.id, selectedSchemeFilter)) {
        return false;
      }
    }
    if (statusFilter === 'all') return true;
    return r.overallStatus === statusFilter;
  });

  const handleProfileFieldChange = (field: keyof CitizenProfile, value: any) => {
    onUpdateProfile({ [field]: value });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Screen Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-civic-700 mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>{t.eligibility.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t.eligibility.title}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t.eligibility.subtitle}
          </p>
        </div>

        <button
          onClick={() => setProfileEditorOpen(!profileEditorOpen)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs self-start md:self-auto"
        >
          <User className="w-4 h-4 text-civic-700" />
          <span>{profileEditorOpen ? t.eligibility.collapseProfile : t.eligibility.editProfile}</span>
          {profileEditorOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Statutory Legal Notice & Non-Guarantee Advisory */}
      <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-700 flex items-start space-x-3">
        <Shield className="w-4 h-4 text-civic-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900 block">
            {language === 'ta' ? 'சட்டப்பூர்வ வெளிப்படைத்தன்மை உத்தரவாதம்:' : 'Statutory Legal Notice & Transparency Mandate:'}
          </span>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            {language === 'ta'
              ? 'SevAIQ குடிமக்கள் தகவல் & ஆவண தயார்நிலை தளம். இங்கு காட்டப்படும் மதிப்பீடுகள் அனைத்தும் வெளியிடப்பட்ட அரசிதழ் விதிகளின் அடிப்படையிலானவை. அரசு அதிகாரிகளின் நேரடி சரிபார்ப்பிற்கு பின்னரே முறையான பலன்கள் கிடைக்கும்.'
              : 'SevAIQ is a civic intelligence and document-readiness platform. All evaluation outcomes represent an explainable assessment against published statutory guidelines. SevAIQ does not guarantee scheme approval and does not replace official verification by statutory government authorities.'}
          </p>
        </div>
      </div>

      {/* Citizen Profile Configuration Card */}
      {profileEditorOpen && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-civic-50 text-civic-700">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t.eligibility.profileTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  {t.eligibility.privacyNotice}
                </p>
              </div>
            </div>

            {/* Privacy Guarantee Pill */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium self-start sm:self-auto">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'ta' ? 'ஆதார் / வங்கி கணக்கு தேவையில்லை' : 'No Aadhaar / Bank account required'}</span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Age */}
            <div>
              <label htmlFor="field-age" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.ageLabel}
              </label>
              <input
                id="field-age"
                type="number"
                min="0"
                max="130"
                value={profile.age ?? ''}
                onChange={(e) =>
                  handleProfileFieldChange(
                    'age',
                    e.target.value === '' ? null : parseInt(e.target.value, 10)
                  )
                }
                placeholder={t.eligibility.agePlaceholder}
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900 ${
                  profile.age !== null && (profile.age < 0 || profile.age > 130)
                    ? 'border-rose-400 bg-rose-50/50'
                    : 'border-slate-300'
                }`}
              />
              {profile.age !== null && (profile.age < 0 || profile.age > 130) && (
                <p className="text-[11px] text-rose-600 mt-1">Please enter a valid age between 0 and 130.</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="field-gender" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.genderLabel}
              </label>
              <select
                id="field-gender"
                value={profile.gender}
                onChange={(e) => handleProfileFieldChange('gender', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">{t.eligibility.genderSelect}</option>
                <option value="Female">{getLocalizedOption('genders', 'Female')}</option>
                <option value="Male">{getLocalizedOption('genders', 'Male')}</option>
                <option value="Transgender">{getLocalizedOption('genders', 'Transgender')}</option>
                <option value="Prefer not to say">{getLocalizedOption('genders', 'Prefer not to say')}</option>
              </select>
            </div>

            {/* State / UT */}
            <div>
              <label htmlFor="field-state" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.stateLabel}
              </label>
              <select
                id="field-state"
                value={profile.state}
                onChange={(e) => handleProfileFieldChange('state', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">{t.eligibility.stateSelect}</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st === 'Tamil Nadu' && language === 'ta' ? 'தமிழ்நாடு (Tamil Nadu)' : st}
                  </option>
                ))}
              </select>
            </div>

            {/* Residence Area */}
            <div>
              <label htmlFor="field-area" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.areaLabel}
              </label>
              <select
                id="field-area"
                value={profile.area}
                onChange={(e) => handleProfileFieldChange('area', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">{t.eligibility.areaSelect}</option>
                <option value="Rural">{getLocalizedOption('areas', 'Rural')}</option>
                <option value="Urban">{getLocalizedOption('areas', 'Urban')}</option>
              </select>
            </div>

            {/* Occupation */}
            <div>
              <label htmlFor="field-occupation" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.occupationLabel}
              </label>
              <select
                id="field-occupation"
                value={profile.occupation}
                onChange={(e) => handleProfileFieldChange('occupation', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">{t.eligibility.occupationSelect}</option>
                {OCCUPATIONS.map((occ) => (
                  <option key={occ} value={occ}>
                    {getLocalizedOption('occupations', occ)}
                  </option>
                ))}
              </select>
            </div>

            {/* Annual Family Income */}
            <div>
              <label htmlFor="field-income" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.incomeLabel}
              </label>
              <select
                id="field-income"
                value={profile.incomeBracket}
                onChange={(e) => handleProfileFieldChange('incomeBracket', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">{t.eligibility.incomeSelect}</option>
                <option value="< 1 Lakh">{getLocalizedOption('incomes', '< 1 Lakh')}</option>
                <option value="1 - 2.5 Lakh">{getLocalizedOption('incomes', '1 - 2.5 Lakh')}</option>
                <option value="2.5 - 5 Lakh">{getLocalizedOption('incomes', '2.5 - 5 Lakh')}</option>
                <option value="5 - 8 Lakh">{getLocalizedOption('incomes', '5 - 8 Lakh')}</option>
                <option value="> 8 Lakh">{getLocalizedOption('incomes', '> 8 Lakh')}</option>
              </select>
            </div>

            {/* Social Category */}
            <div>
              <label htmlFor="field-category" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.categoryLabel}
              </label>
              <select
                id="field-category"
                value={profile.category}
                onChange={(e) => handleProfileFieldChange('category', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">{t.eligibility.categorySelect}</option>
                <option value="General">{getLocalizedOption('categories', 'General')}</option>
                <option value="OBC">{getLocalizedOption('categories', 'OBC')}</option>
                <option value="SC">{getLocalizedOption('categories', 'SC')}</option>
                <option value="ST">{getLocalizedOption('categories', 'ST')}</option>
                <option value="EWS">{getLocalizedOption('categories', 'EWS')}</option>
              </select>
            </div>

            {/* Landholding Status */}
            <div>
              <label htmlFor="field-landholding" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.landholdingLabel}
              </label>
              <select
                id="field-landholding"
                value={profile.landholding}
                onChange={(e) => handleProfileFieldChange('landholding', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">{t.eligibility.landholdingSelect}</option>
                <option value="None">{getLocalizedOption('landholdings', 'None')}</option>
                <option value="Marginal (< 1 ha)">{getLocalizedOption('landholdings', 'Marginal (< 1 ha)')}</option>
                <option value="Small (1-2 ha)">{getLocalizedOption('landholdings', 'Small (1-2 ha)')}</option>
                <option value="Medium/Large (> 2 ha)">{getLocalizedOption('landholdings', 'Medium/Large (> 2 ha)')}</option>
              </select>
            </div>

            {/* Exact Annual Household Income */}
            <div>
              <label htmlFor="field-annual-income" className="block font-semibold text-slate-700 mb-1.5">
                {language === 'ta' ? 'துல்லிய ஆண்டு வருமானம் (₹)' : 'Exact Annual Income (₹)'} <span className="text-[10px] text-slate-500 font-normal">({language === 'ta' ? 'விருப்பம்' : 'Optional'})</span>
              </label>
              <input
                id="field-annual-income"
                type="number"
                min="0"
                step="5000"
                value={profile.annualIncome ?? ''}
                onChange={(e) =>
                  handleProfileFieldChange(
                    'annualIncome',
                    e.target.value === '' ? null : parseFloat(e.target.value)
                  )
                }
                placeholder="e.g. 120000"
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900 ${
                  profile.annualIncome !== null && profile.annualIncome !== undefined && profile.annualIncome < 0
                    ? 'border-rose-400 bg-rose-50/50'
                    : 'border-slate-300'
                }`}
              />
              {profile.annualIncome !== null && profile.annualIncome !== undefined && profile.annualIncome < 0 && (
                <p className="text-[11px] text-rose-600 mt-1">Income cannot be negative.</p>
              )}
            </div>

            {/* Owns Pucca House */}
            <div>
              <label htmlFor="field-pucca-house" className="block font-semibold text-slate-700 mb-1.5">
                {language === 'ta' ? 'சொந்த கான்கிரீட் வீடு உள்ளதா?' : 'Owns Pucca House?'} <span className="text-[10px] text-slate-500 font-normal">({language === 'ta' ? 'விருப்பம்' : 'Optional'})</span>
              </label>
              <select
                id="field-pucca-house"
                value={
                  profile.ownsPuccaHouse === true
                    ? 'true'
                    : profile.ownsPuccaHouse === false
                    ? 'false'
                    : ''
                }
                onChange={(e) =>
                  handleProfileFieldChange(
                    'ownsPuccaHouse',
                    e.target.value === '' ? null : e.target.value === 'true'
                  )
                }
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">{language === 'ta' ? 'குறிப்பிடப்படவில்லை' : 'Unanswered (Unknown)'}</option>
                <option value="false">{language === 'ta' ? 'இல்லை (குடிசை / வீடற்ற)' : 'No (Kutcha / Homeless)'}</option>
                <option value="true">{language === 'ta' ? 'ஆம் (சொந்த கான்கிரீட் வீடு உண்டு)' : 'Yes (Owns Pucca House)'}</option>
              </select>
            </div>

            {/* Income Tax Payer */}
            <div>
              <label htmlFor="field-tax-payer" className="block font-semibold text-slate-700 mb-1.5">
                {language === 'ta' ? 'வருமான வரி செலுத்துபவரா?' : 'Income Tax Payer?'} <span className="text-[10px] text-slate-500 font-normal">({language === 'ta' ? 'விருப்பம்' : 'Optional'})</span>
              </label>
              <select
                id="field-tax-payer"
                value={
                  profile.isTaxPayer === true
                    ? 'true'
                    : profile.isTaxPayer === false
                    ? 'false'
                    : ''
                }
                onChange={(e) =>
                  handleProfileFieldChange(
                    'isTaxPayer',
                    e.target.value === '' ? null : e.target.value === 'true'
                  )
                }
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">{language === 'ta' ? 'குறிப்பிடப்படவில்லை' : 'Unanswered (Unknown)'}</option>
                <option value="false">{language === 'ta' ? 'இல்லை (வரி செலுத்துவதில்லை)' : 'No (Non-Taxpayer)'}</option>
                <option value="true">{language === 'ta' ? 'ஆம் (வருமான வரி செலுத்துகிறார்)' : 'Yes (Income Tax Payer)'}</option>
              </select>
            </div>

            {/* Government Employee */}
            <div>
              <label htmlFor="field-govt-employee" className="block font-semibold text-slate-700 mb-1.5">
                {language === 'ta' ? 'அரசு ஊழியரா?' : 'Govt Employee?'} <span className="text-[10px] text-slate-500 font-normal">({language === 'ta' ? 'விருப்பம்' : 'Optional'})</span>
              </label>
              <select
                id="field-govt-employee"
                value={
                  profile.isGovernmentEmployee === true
                    ? 'true'
                    : profile.isGovernmentEmployee === false
                    ? 'false'
                    : ''
                }
                onChange={(e) =>
                  handleProfileFieldChange(
                    'isGovernmentEmployee',
                    e.target.value === '' ? null : e.target.value === 'true'
                  )
                }
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">{language === 'ta' ? 'குறிப்பிடப்படவில்லை' : 'Unanswered (Unknown)'}</option>
                <option value="false">{language === 'ta' ? 'இல்லை (அரசு ஊழியர் அல்ல)' : 'No (Non-Govt Worker)'}</option>
                <option value="true">{language === 'ta' ? 'ஆம் (பணியிலுள்ள/ஓய்வுபெற்ற அரசு ஊழியர்)' : 'Yes (Serving/Retired Govt Employee)'}</option>
              </select>
            </div>
          </div>

          {/* Toggle Checkboxes */}
          <div className="pt-2 flex flex-wrap gap-6 text-xs text-slate-700">
            <label htmlFor="field-student" className="flex items-center space-x-2 cursor-pointer">
              <input
                id="field-student"
                type="checkbox"
                checked={profile.isStudent}
                onChange={(e) => handleProfileFieldChange('isStudent', e.target.checked)}
                className="w-4 h-4 rounded text-civic-600 focus:ring-civic-500 border-slate-300"
              />
              <span className="font-semibold">{t.eligibility.isStudent}</span>
            </label>

            <label htmlFor="field-disability" className="flex items-center space-x-2 cursor-pointer">
              <input
                id="field-disability"
                type="checkbox"
                checked={profile.hasDisability}
                onChange={(e) => handleProfileFieldChange('hasDisability', e.target.checked)}
                className="w-4 h-4 rounded text-civic-600 focus:ring-civic-500 border-slate-300"
              />
              <span className="font-semibold">{t.eligibility.hasDisability}</span>
            </label>
          </div>

          {/* Profile Actions: Pre-fill & Clear */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-600 font-medium">
              {isKioskMode && (
                <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {language === 'ta' ? 'பொது கியோஸ்க் முறை: விவரங்கள் நினைவகத்தில் மட்டுமே இருக்கும்' : 'Public Kiosk Mode: Answers stored in memory only'}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {onResetProfile && (
                <button
                  type="button"
                  onClick={onResetProfile}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {t.eligibility.resetProfile}
                </button>
              )}
              {onPreFillDemoProfile && (
                <button
                  type="button"
                  onClick={onPreFillDemoProfile}
                  className="px-3 py-1.5 text-xs font-semibold text-civic-800 hover:bg-civic-50 border border-civic-200 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500"
                >
                  {t.eligibility.loadDemo}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backend Evaluation Status Notice */}
      {isEvaluatingBackend && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl flex items-center space-x-2.5 text-xs font-medium">
          <RefreshCw className="w-4 h-4 text-civic-600 animate-spin shrink-0" />
          <span>Evaluating citizen profile against statutory criteria via FastAPI <code className="bg-white/80 px-1 py-0.5 rounded font-mono">POST /api/eligibility/check</code>...</span>
        </div>
      )}

      {backendResponse && !isEvaluatingBackend && (
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 text-emerald-950 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center space-x-2.5">
            <Server className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Server-Computed 3-Valued Logic:</strong> Evaluated across {backendResponse.total_schemes_evaluated} verified schemes ({backendResponse.summary.meets_known_criteria} met, {backendResponse.summary.needs_verification} need information, {backendResponse.summary.does_not_meet_known_criteria} disqualified)
              {lastEvaluatedAt && <span className="text-emerald-700"> at {lastEvaluatedAt.toLocaleTimeString()}</span>}.
            </span>
          </div>
          <button
            type="button"
            onClick={runBackendEvaluation}
            className="text-emerald-800 underline font-semibold flex items-center space-x-1 hover:text-emerald-900 self-start sm:self-auto"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Re-evaluate</span>
          </button>
        </div>
      )}

      {backendEvalError && !isEvaluatingBackend && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">FastAPI Backend Notice: {backendEvalError}</p>
              <p className="text-amber-800 mt-0.5">
                Showing local client assessment as fallback. The application will evaluate locally or you can retry the backend check.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={runBackendEvaluation}
            className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-semibold rounded-xl self-start sm:self-auto transition-colors flex items-center space-x-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Backend Check</span>
          </button>
        </div>
      )}

      {/* Target Scheme Focused Banner */}
      {activeTargetScheme && selectedSchemeFilter !== 'all' && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-civic-50 via-blue-50/50 to-indigo-50/40 border-2 border-civic-400/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-civic-700 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-civic-800 bg-civic-100/90 px-2 py-0.5 rounded-md">
                  {t.eligibility.targetSchemeBannerTitle}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                  {activeTargetScheme.category}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {getLocalizedScheme(activeTargetScheme).title}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {t.eligibility.targetSchemeBannerDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedSchemeFilter('all');
              onClearTargetScheme?.();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 transition-colors shadow-xs hover:border-slate-400 self-start sm:self-auto shrink-0 flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-civic-500 cursor-pointer"
          >
            <span>{t.eligibility.viewAllSchemes} ({evaluationResults.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Tabs by Statutory Outcome & Scheme Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Scheme Selector Dropdown */}
          <div className="flex items-center space-x-1.5 mr-2">
            <label htmlFor="eligibility-scheme-filter" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              {t.eligibility.filterByScheme}
            </label>
            <div className="relative">
              <select
                id="eligibility-scheme-filter"
                value={selectedSchemeFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSchemeFilter(val);
                  setStatusFilter('all');
                  if (val === 'all') {
                    onClearTargetScheme?.();
                  } else {
                    setExpandedSchemeId(val);
                  }
                }}
                className="pl-2.5 pr-7 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 hover:border-civic-400 focus:ring-2 focus:ring-civic-500 focus:outline-none shadow-2xs appearance-none cursor-pointer max-w-[200px] sm:max-w-xs truncate"
              >
                <option value="all">
                  {t.eligibility.allSchemesOption} ({evaluationResults.length})
                </option>
                {evaluationResults.map((r) => {
                  const loc = getLocalizedScheme(r.scheme);
                  return (
                    <option key={r.scheme.id} value={r.scheme.id}>
                      {loc.title}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {selectedSchemeFilter !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSchemeFilter('all');
                  onClearTargetScheme?.();
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                title={t.eligibility.clearSchemeFilter}
                aria-label="Clear scheme filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1 pr-1 border-l border-slate-200 pl-2">
            <Filter className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'முடிவு:' : 'Outcome:'}</span>
          </span>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.eligibility.allSchemes} ({evaluationResults.length})
          </button>

          <button
            onClick={() => setStatusFilter('met')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              statusFilter === 'met'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.eligibility.eligibleMet} ({metCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('unknown')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              statusFilter === 'unknown'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t.eligibility.needsVerification} ({unknownCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('not_met')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              statusFilter === 'not_met'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{t.eligibility.notEligible} ({notMetCount})</span>
          </button>
        </div>

        <button
          onClick={() => onNavigate('document-mapper')}
          className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-semibold text-civic-700 hover:underline"
        >
          <span>{language === 'ta' ? 'ஆவண வரைபடத்திற்கு செல்' : 'Go to Document Mapper'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Evaluation Results List */}
      <div className="space-y-4">
        {filteredResults.length > 0 ? (
          filteredResults.map((result) => {
            const rawScheme = result.scheme;
            const scheme = getLocalizedScheme(rawScheme);
            const { overallStatus, criteriaResults, metCount, totalCriteriaCount } = result;
            const isTargetScheme = isSchemeMatching(scheme.id, selectedSchemeFilter);
            const isExpanded = expandedSchemeId === scheme.id;
            const isSelectedForMapper = selectedSchemeIdsForMapper.includes(scheme.id);

            return (
              <div
                key={scheme.id}
                id={`eligibility-scheme-${scheme.id}`}
                className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                  isTargetScheme
                    ? 'border-civic-500 shadow-md ring-4 ring-civic-100/90'
                    : 'border-slate-200 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Scheme Header Row */}
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-civic-50 text-civic-700">
                        {scheme.category}
                      </span>

                      {/* Focused Scheme Badge */}
                      {isTargetScheme && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-civic-700 text-white shadow-2xs">
                          <span>{`🎯 ${t.eligibility.targetSchemeBadge}`}</span>
                        </span>
                      )}

                      {/* Engine Source Badge */}
                      {backendResponse && backendResponse.schemes.some((s) => s.scheme_id.toLowerCase() === resolveBackendSchemeId(scheme.id).toLowerCase()) ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          <Server className="w-3 h-3 text-blue-600" />
                          <span>FastAPI Verified Engine</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <span>Local Reference Model</span>
                        </span>
                      )}

                      {/* 3 Explainable Statutory Outcome Badges */}
                      {overallStatus === 'met' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t.eligibility.met}</span>
                        </span>
                      ) : overallStatus === 'unknown' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>{t.eligibility.needsVerification}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{t.eligibility.notEligible}</span>
                        </span>
                      )}

                      <span className="text-xs text-slate-400">
                        {language === 'ta' ? `${metCount}/${totalCriteriaCount} தகுதிகள் பூர்த்தி` : `${metCount}/${totalCriteriaCount} criteria evaluated`}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{scheme.title}</h3>
                    <p className="text-xs text-slate-500">{scheme.ministry}</p>
                    <p className="text-xs text-slate-600 line-clamp-2">{scheme.short_description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 md:pt-0">
                    <button
                      onClick={() => onSelectForMapper(scheme.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                        isSelectedForMapper
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isSelectedForMapper ? (language === 'ta' ? 'வரைபடத்தில் உள்ளது ✓' : 'In Document Mapper ✓') : (language === 'ta' ? '+ வரைபடத்தில் சேர்' : '+ Add to Mapper')}</span>
                    </button>

                    <button
                      onClick={() =>
                        setExpandedSchemeId(isExpanded ? null : scheme.id)
                      }
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center space-x-1"
                    >
                      <span>{isExpanded ? (language === 'ta' ? 'விதிமுறைகளை மறை' : 'Hide Criteria') : (language === 'ta' ? 'விதிமுறை விவரங்கள்' : 'View Criteria Breakdown')}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Criteria Breakdown Accordion */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-100 p-6 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      {language === 'ta' ? `${scheme.title} - அதிகாரப்பூர்வ தகுதி விதிகள்` : `Official Criteria Breakdown for ${scheme.title}`}
                    </h4>

                    <div className="space-y-2">
                      {criteriaResults.map((crit) => (
                        <div
                          key={crit.id}
                          className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-start space-x-3 text-xs"
                        >
                          <div className="mt-0.5 shrink-0">
                            {crit.status === 'met' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : crit.status === 'unknown' ? (
                              <HelpCircle className="w-4 h-4 text-amber-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-500" />
                            )}
                          </div>

                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{crit.label}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  crit.status === 'met'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : crit.status === 'unknown'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {crit.status === 'met'
                                  ? (language === 'ta' ? 'பூர்த்தி' : 'Met')
                                  : crit.status === 'unknown'
                                  ? (language === 'ta' ? 'சரிபார்ப்பு தேவை' : 'Unknown')
                                  : (language === 'ta' ? 'தகுதியில்லை' : 'Not Met')}
                              </span>
                            </div>

                            <p className="text-slate-600">{crit.explanation}</p>

                            {crit.expectedRule && (
                              <div className="mt-1 flex items-center space-x-3 text-[11px] text-slate-500">
                                <span>
                                  {language === 'ta' ? 'எதிர்பார்க்கப்படும் விதி:' : 'Expected:'}{' '}
                                  <strong className="text-slate-700">{crit.expectedRule}</strong>
                                </span>
                                {crit.citizenValue && (
                                  <span>
                                    {language === 'ta' ? 'உங்கள் விவரம்:' : 'Profile Value:'}{' '}
                                    <strong className="text-slate-700">
                                      {crit.citizenValue}
                                    </strong>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Unassessed criteria disclaimer */}
                    <div className="p-3 bg-slate-100/70 rounded-xl text-[11px] text-slate-600 space-y-1">
                      <span className="font-semibold text-slate-700 block">
                        {language === 'ta' ? 'திட்ட விதிகளில் தேவையில்லாத காரணிகள்:' : 'Criteria Not Evaluated by Scheme Rules:'}
                      </span>
                      <p>
                        {language === 'ta'
                          ? 'திட்ட விதிகளில் குறிப்பிடப்படாத பாலினம், ஊனம் அல்லது சமூகப் பிரிவு போன்ற விவரங்கள் அனைத்து குடிமக்களுக்கும் பொதுவானவை.'
                          : 'Criteria such as gender, student status, disability, or social category were not assessed if not specified in official scheme rules (open to all citizens).'}
                      </p>
                    </div>

                    <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>{t.eligibility.officialVerificationSource} {scheme.verification_source || 'Official Gazette'}</span>
                      <a
                        href={scheme.official_portal_url ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-civic-700 font-semibold hover:underline inline-flex items-center space-x-1"
                      >
                        <span>{language === 'ta' ? 'அதிகாரப்பூர்வ வழிகாட்டுதல்கள்' : 'Official Guidelines'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">{t.eligibility.noResultsMatching}</h3>
            <p className="text-xs text-slate-500">
              {language === 'ta' ? 'வேறு தகுதி வடிகட்டலைத் தேர்ந்தெடுக்கவும் அல்லது உங்கள் விவரங்களை புதுப்பிக்கவும்.' : 'Try changing the status filter above or updating your citizen profile.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setStatusFilter('all')}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {language === 'ta' ? 'அனைத்து முடிவுகளையும் காட்டு' : 'Show All Statuses'}
              </button>
              {selectedSchemeFilter !== 'all' && (
                <button
                  onClick={() => {
                    setSelectedSchemeFilter('all');
                    setStatusFilter('all');
                    onClearTargetScheme?.();
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-civic-700 text-white hover:bg-civic-800 rounded-xl transition-colors shadow-2xs"
                >
                  {t.eligibility.viewAllSchemes}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
