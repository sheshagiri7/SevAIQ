import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  CitizenProfile,
  Scheme,
  SchemeEvaluationResult,
  EligibilityStatus,
  NavigationTab,
} from '../types';
import { evaluateSchemeEligibility } from '../utils/eligibilityEngine';

interface EligibilityScreenProps {
  schemes: Scheme[];
  profile: CitizenProfile;
  onUpdateProfile: (updated: Partial<CitizenProfile>) => void;
  onNavigate: (tab: NavigationTab) => void;
  onSelectForMapper: (schemeId: string) => void;
  selectedSchemeIdsForMapper: string[];
  isKioskMode?: boolean;
  onResetProfile?: () => void;
  onPreFillDemoProfile?: () => void;
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
  onUpdateProfile,
  onNavigate,
  onSelectForMapper,
  selectedSchemeIdsForMapper,
  isKioskMode = false,
  onResetProfile,
  onPreFillDemoProfile,
}) => {
  const [profileEditorOpen, setProfileEditorOpen] = useState(
    !profile.age || !profile.occupation
  );
  const [statusFilter, setStatusFilter] = useState<'all' | EligibilityStatus>('all');
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

  // Evaluate all schemes against current profile
  const evaluationResults: SchemeEvaluationResult[] = schemes.map((scheme) =>
    evaluateSchemeEligibility(scheme, profile)
  );

  const metCount = evaluationResults.filter((r) => r.overallStatus === 'met').length;
  const unknownCount = evaluationResults.filter((r) => r.overallStatus === 'unknown').length;
  const notMetCount = evaluationResults.filter((r) => r.overallStatus === 'not_met').length;

  const filteredResults = evaluationResults.filter((r) => {
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
            <span>Eligibility Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Citizen Eligibility Assessment
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Transparent, multi-criteria evaluation with detailed explanations for Met, Unknown, and Not Met criteria.
          </p>
        </div>

        <button
          onClick={() => setProfileEditorOpen(!profileEditorOpen)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs self-start md:self-auto"
        >
          <User className="w-4 h-4 text-civic-700" />
          <span>{profileEditorOpen ? 'Hide Profile Settings' : 'Edit Citizen Profile'}</span>
          {profileEditorOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
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
                  Citizen Eligibility Profile
                </h3>
                <p className="text-xs text-slate-500">
                  Parameters are processed exclusively in your browser for rule evaluation.
                </p>
              </div>
            </div>

            {/* Privacy Guarantee Pill */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium self-start sm:self-auto">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>No Aadhaar / Bank account required</span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Age */}
            <div>
              <label htmlFor="field-age" className="block font-semibold text-slate-700 mb-1.5">
                Age (Years)
              </label>
              <input
                id="field-age"
                type="number"
                min="0"
                max="120"
                value={profile.age ?? ''}
                onChange={(e) =>
                  handleProfileFieldChange(
                    'age',
                    e.target.value === '' ? null : parseInt(e.target.value, 10)
                  )
                }
                placeholder="e.g. 35"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              />
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="field-gender" className="block font-semibold text-slate-700 mb-1.5">
                Gender
              </label>
              <select
                id="field-gender"
                value={profile.gender}
                onChange={(e) => handleProfileFieldChange('gender', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">Select Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Transgender">Transgender</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {/* State / UT */}
            <div>
              <label htmlFor="field-state" className="block font-semibold text-slate-700 mb-1.5">
                State / UT
              </label>
              <select
                id="field-state"
                value={profile.state}
                onChange={(e) => handleProfileFieldChange('state', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">Select State / UT</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Residence Area */}
            <div>
              <label htmlFor="field-area" className="block font-semibold text-slate-700 mb-1.5">
                Residence Area
              </label>
              <select
                id="field-area"
                value={profile.area}
                onChange={(e) => handleProfileFieldChange('area', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">Select Area</option>
                <option value="Rural">Rural</option>
                <option value="Urban">Urban</option>
              </select>
            </div>

            {/* Occupation */}
            <div>
              <label htmlFor="field-occupation" className="block font-semibold text-slate-700 mb-1.5">
                Primary Occupation
              </label>
              <select
                id="field-occupation"
                value={profile.occupation}
                onChange={(e) => handleProfileFieldChange('occupation', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">Select Occupation</option>
                {OCCUPATIONS.map((occ) => (
                  <option key={occ} value={occ}>
                    {occ}
                  </option>
                ))}
              </select>
            </div>

            {/* Annual Family Income */}
            <div>
              <label htmlFor="field-income" className="block font-semibold text-slate-700 mb-1.5">
                Annual Family Income
              </label>
              <select
                id="field-income"
                value={profile.incomeBracket}
                onChange={(e) => handleProfileFieldChange('incomeBracket', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">Select Income Bracket</option>
                <option value="< 1 Lakh">Below ₹1,00,000</option>
                <option value="1 - 2.5 Lakh">₹1,00,000 to ₹2,50,000</option>
                <option value="2.5 - 5 Lakh">₹2,50,000 to ₹5,00,000</option>
                <option value="5 - 8 Lakh">₹5,00,000 to ₹8,00,000</option>
                <option value="> 8 Lakh">Above ₹8,00,000</option>
              </select>
            </div>

            {/* Social Category */}
            <div>
              <label htmlFor="field-category" className="block font-semibold text-slate-700 mb-1.5">
                Social Category
              </label>
              <select
                id="field-category"
                value={profile.category}
                onChange={(e) => handleProfileFieldChange('category', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">Select Category</option>
                <option value="General">General</option>
                <option value="OBC">OBC (Other Backward Class)</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="EWS">EWS (Economically Weaker Section)</option>
              </select>
            </div>

            {/* Landholding Status */}
            <div>
              <label htmlFor="field-landholding" className="block font-semibold text-slate-700 mb-1.5">
                Agricultural Landholding
              </label>
              <select
                id="field-landholding"
                value={profile.landholding}
                onChange={(e) => handleProfileFieldChange('landholding', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900"
              >
                <option value="">Select Landholding</option>
                <option value="None">None (Landless)</option>
                <option value="Marginal (< 1 ha)">Marginal (Under 1 Hectare)</option>
                <option value="Small (1-2 ha)">Small (1 to 2 Hectares)</option>
                <option value="Medium/Large (> 2 ha)">Medium / Large (&gt; 2 Hectares)</option>
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
              <span className="font-semibold">Currently enrolled as an active student</span>
            </label>

            <label htmlFor="field-disability" className="flex items-center space-x-2 cursor-pointer">
              <input
                id="field-disability"
                type="checkbox"
                checked={profile.hasDisability}
                onChange={(e) => handleProfileFieldChange('hasDisability', e.target.checked)}
                className="w-4 h-4 rounded text-civic-600 focus:ring-civic-500 border-slate-300"
              />
              <span className="font-semibold">Person with Disability (Divyangjan)</span>
            </label>
          </div>

          {/* Profile Actions: Pre-fill & Clear */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-600 font-medium">
              {isKioskMode && (
                <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Public Kiosk Mode: Answers stored in memory only
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
                  Clear Profile Answers
                </button>
              )}
              {onPreFillDemoProfile && (
                <button
                  type="button"
                  onClick={onPreFillDemoProfile}
                  className="px-3 py-1.5 text-xs font-semibold text-civic-800 hover:bg-civic-50 border border-civic-200 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500"
                >
                  Pre-fill Sample Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs by Status */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1 pr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Results ({evaluationResults.length})
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
            <span>Eligible / Met ({metCount})</span>
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
            <span>Needs Info / Unknown ({unknownCount})</span>
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
            <span>Not Met ({notMetCount})</span>
          </button>
        </div>

        <button
          onClick={() => onNavigate('document-mapper')}
          className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-semibold text-civic-700 hover:underline"
        >
          <span>Go to Document Mapper</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Evaluation Results List */}
      <div className="space-y-4">
        {filteredResults.length > 0 ? (
          filteredResults.map((result) => {
            const { scheme, overallStatus, criteriaResults, metCount, totalCriteriaCount } =
              result;
            const isExpanded = expandedSchemeId === scheme.id;
            const isSelectedForMapper = selectedSchemeIdsForMapper.includes(scheme.id);

            return (
              <div
                key={scheme.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden"
              >
                {/* Scheme Header Row */}
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-civic-50 text-civic-700">
                        {scheme.category}
                      </span>

                      {/* Overall Status Badge */}
                      {overallStatus === 'met' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Met (Eligible)</span>
                        </span>
                      ) : overallStatus === 'unknown' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Unknown (Missing Details)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Not Met</span>
                        </span>
                      )}

                      <span className="text-xs text-slate-400">
                        {metCount}/{totalCriteriaCount} criteria met
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
                      <span>{isSelectedForMapper ? 'In Document Mapper ✓' : '+ Add to Mapper'}</span>
                    </button>

                    <button
                      onClick={() =>
                        setExpandedSchemeId(isExpanded ? null : scheme.id)
                      }
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center space-x-1"
                    >
                      <span>{isExpanded ? 'Hide Criteria' : 'View Criteria Breakdown'}</span>
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
                      Official Criteria Breakdown for {scheme.title}
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
                                  ? 'Met'
                                  : crit.status === 'unknown'
                                  ? 'Unknown'
                                  : 'Not Met'}
                              </span>
                            </div>

                            <p className="text-slate-600">{crit.explanation}</p>

                            {crit.expectedRule && (
                              <div className="mt-1 flex items-center space-x-3 text-[11px] text-slate-500">
                                <span>
                                  Expected:{' '}
                                  <strong className="text-slate-700">{crit.expectedRule}</strong>
                                </span>
                                {crit.citizenValue && (
                                  <span>
                                    Profile Value:{' '}
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

                    <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Source: {scheme.verification_source || 'Official Gazette'}</span>
                      <a
                        href={scheme.official_portal_url ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-civic-700 font-semibold hover:underline"
                      >
                        Official Guidelines ↗
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
            <h3 className="text-base font-bold text-slate-900">No schemes in this status filter</h3>
            <p className="text-xs text-slate-500">
              Try changing the status filter above or updating your citizen profile.
            </p>
            <button
              onClick={() => setStatusFilter('all')}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl"
            >
              Show All Statuses
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
