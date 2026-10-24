import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Lock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Check,
  ExternalLink,
  FileCheck,
  ArrowRight,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { CitizenProfile, Scheme } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { isProfileEmpty } from '../utils/kioskStorage';
import { evaluateSchemeEligibility } from '../utils/eligibilityEngine';
import { VERIFIED_REFERENCE_SCHEMES } from '../data/verifiedReferenceSchemes';

export interface DemographicProfileProps {
  id?: string;
  profile: CitizenProfile;
  onUpdateProfile: (updated: Partial<CitizenProfile>) => void;
  onResetProfile?: () => void;
  onPreFillDemoProfile?: () => void;
  isKioskMode?: boolean;
  eligibleCount?: number;
  totalSchemesCount?: number;
  showFilterToggle?: boolean;
  onlyEligibleFilter?: boolean;
  onToggleOnlyEligible?: (val: boolean) => void;
  onNavigateToEligibility?: (scheme?: Scheme) => void;
  defaultExpanded?: boolean;
  forceOpen?: boolean;
  className?: string;
  schemes?: Scheme[];
  onSelectSchemeForEligibility?: (scheme: Scheme) => void;
  selectedSchemeIdsForMapper?: string[];
  onSelectForMapper?: (schemeId: string) => void;
  onNavigateToTracker?: (schemeId: string) => void;
  defaultShowSchemeOptions?: boolean;
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

const INCOME_BRACKET_INDEX: Record<string, number> = {
  '< 1 Lakh': 0,
  '1 - 2.5 Lakh': 1,
  '2.5 - 5 Lakh': 2,
  '5 - 8 Lakh': 3,
  '> 8 Lakh': 4,
};

export const DemographicProfile: React.FC<DemographicProfileProps> = ({
  id = 'demographic-profile',
  profile,
  onUpdateProfile,
  onResetProfile,
  onPreFillDemoProfile: _onPreFillDemoProfile,
  isKioskMode = false,
  eligibleCount = 0,
  totalSchemesCount = 0,
  showFilterToggle = true,
  onlyEligibleFilter = false,
  onToggleOnlyEligible,
  onNavigateToEligibility,
  defaultExpanded = true,
  forceOpen,
  className = '',
  schemes,
  onSelectSchemeForEligibility,
  selectedSchemeIdsForMapper = [],
  onSelectForMapper,
  defaultShowSchemeOptions = false,
}) => {
  const { language, t, getLocalizedOption, getLocalizedScheme } = useLanguage();

  const [isOpen, setIsOpen] = useState<boolean>(defaultExpanded);
  const [showSchemeOptions, setShowSchemeOptions] = useState<boolean>(defaultShowSchemeOptions);
  const [optionsFilter, setOptionsFilter] = useState<'all' | 'eligible'>('all');

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  useEffect(() => {
    if (defaultShowSchemeOptions !== undefined) {
      setShowSchemeOptions(defaultShowSchemeOptions);
    }
  }, [defaultShowSchemeOptions]);

  const [showAdvanced, setShowAdvanced] = useState<boolean>(() => {
    return (
      (profile.annualIncome !== null && profile.annualIncome !== undefined) ||
      (profile.ownsPuccaHouse !== null && profile.ownsPuccaHouse !== undefined) ||
      (profile.isTaxPayer !== null && profile.isTaxPayer !== undefined) ||
      (profile.isGovernmentEmployee !== null && profile.isGovernmentEmployee !== undefined)
    );
  });

  const hasEnteredData = !isProfileEmpty(profile);

  const handleProfileFieldChange = (field: keyof CitizenProfile, value: any) => {
    onUpdateProfile({ [field]: value });
  };

  const handleToggleSchemeOptions = () => {
    if (!isOpen) {
      setIsOpen(true);
    }
    setShowSchemeOptions((prev) => {
      const next = !prev;
      if (next && typeof document !== 'undefined') {
        setTimeout(() => {
          const el = document.getElementById('demographic-scheme-options');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 100);
      }
      return next;
    });
  };

  // Build active summary chips for quick glance
  const summaryChips = [
    profile.state ? (profile.state === 'Tamil Nadu' && language === 'ta' ? 'தமிழ்நாடு' : profile.state) : null,
    profile.occupation ? getLocalizedOption('occupations', profile.occupation) : null,
    profile.age !== null && profile.age !== undefined ? `${profile.age} ${language === 'ta' ? 'வயது' : language === 'hi' ? 'वर्ष' : 'yrs'}` : null,
    profile.gender ? getLocalizedOption('genders', profile.gender) : null,
    profile.area ? getLocalizedOption('areas', profile.area) : null,
    profile.incomeBracket ? getLocalizedOption('incomes', profile.incomeBracket) : null,
    profile.category ? getLocalizedOption('categories', profile.category) : null,
    profile.landholding ? getLocalizedOption('landholdings', profile.landholding) : null,
    profile.isStudent ? (language === 'ta' ? 'மாணவர்' : language === 'hi' ? 'विद्यार्थी' : 'Student') : null,
    profile.hasDisability ? (language === 'ta' ? 'மாற்றுத்திறனாளி' : language === 'hi' ? 'दिव்யாங்' : 'PwD') : null,
  ].filter(Boolean);

  // Compute scheme options tailored to profile details
  const schemeCatalog = schemes && schemes.length > 0 ? schemes : VERIFIED_REFERENCE_SCHEMES;

  const schemeOptionsList = useMemo(() => {
    return schemeCatalog.map((s) => {
      const evaluation = evaluateSchemeEligibility(s, profile);
      const matchReasons: { field: string; label: string; value: string }[] = [];

      // 1. Occupation Match
      if (
        profile.occupation &&
        s.rules?.allowedOccupations &&
        s.rules.allowedOccupations.length > 0 &&
        s.rules.allowedOccupations.includes(profile.occupation)
      ) {
        matchReasons.push({
          field: 'occupation',
          label: language === 'ta' ? 'தொழில்' : language === 'hi' ? 'व्यवसाय' : 'Occupation',
          value: getLocalizedOption('occupations', profile.occupation),
        });
      }

      // 2. Age Match
      if (profile.age !== null && profile.age !== undefined) {
        const min = s.rules?.minAge ?? 0;
        const max = s.rules?.maxAge ?? 120;
        if (s.rules?.minAge !== undefined || s.rules?.maxAge !== undefined) {
          if (profile.age >= min && profile.age <= max) {
            matchReasons.push({
              field: 'age',
              label: language === 'ta' ? 'வயது' : language === 'hi' ? 'आयु' : 'Age',
              value: `${profile.age} ${language === 'ta' ? 'வயது' : language === 'hi' ? 'वर्ष' : 'yrs'} (${min}-${max})`,
            });
          }
        }
      }

      // 3. Residence Area Match
      if (
        profile.area &&
        s.rules?.allowedAreas &&
        s.rules.allowedAreas.length > 0 &&
        !s.rules.allowedAreas.includes('All') &&
        s.rules.allowedAreas.includes(profile.area)
      ) {
        matchReasons.push({
          field: 'area',
          label: language === 'ta' ? 'பகுதி' : language === 'hi' ? 'क्षेत्र' : 'Residence',
          value: getLocalizedOption('areas', profile.area),
        });
      }

      // 4. Landholding Match
      if (
        profile.landholding &&
        s.rules?.allowedLandholding &&
        s.rules.allowedLandholding.length > 0 &&
        s.rules.allowedLandholding.includes(profile.landholding as any)
      ) {
        matchReasons.push({
          field: 'landholding',
          label: language === 'ta' ? 'நில உரிமை' : language === 'hi' ? 'भूमि' : 'Landholding',
          value: getLocalizedOption('landholdings', profile.landholding),
        });
      }

      // 5. Social Category Match
      if (
        profile.category &&
        s.rules?.allowedCategories &&
        s.rules.allowedCategories.length > 0 &&
        s.rules.allowedCategories.includes(profile.category as any)
      ) {
        matchReasons.push({
          field: 'category',
          label: language === 'ta' ? 'பிரிவு' : language === 'hi' ? 'वर्ग' : 'Category',
          value: getLocalizedOption('categories', profile.category),
        });
      }

      // 6. Student status
      if (profile.isStudent && s.rules?.mustBeStudent) {
        matchReasons.push({
          field: 'student',
          label: language === 'ta' ? 'படிப்பு' : language === 'hi' ? 'शिक्षा' : 'Education',
          value: language === 'ta' ? 'மாணவர் நலன்' : language === 'hi' ? 'छात्र कल्याण' : 'Student Welfare',
        });
      }

      // 7. Disability status
      if (profile.hasDisability && s.rules?.requiresDisability) {
        matchReasons.push({
          field: 'disability',
          label: language === 'ta' ? 'மாற்றுத்திறனாளி' : language === 'hi' ? 'दिव्यांग' : 'Support',
          value: language === 'ta' ? 'திவ்யாங்ஜன் நலன்' : language === 'hi' ? 'दिव्यांग सहायता' : 'Divyangjan Support',
        });
      }

      // 8. Income bracket
      if (
        profile.incomeBracket &&
        s.rules?.maxIncomeBracketIndex !== undefined &&
        (INCOME_BRACKET_INDEX[profile.incomeBracket] ?? 99) <= s.rules.maxIncomeBracketIndex
      ) {
        matchReasons.push({
          field: 'income',
          label: language === 'ta' ? 'வருமானம்' : language === 'hi' ? 'आय' : 'Income',
          value: `≤ ${getLocalizedOption('incomes', profile.incomeBracket)}`,
        });
      }

      // 9. Housing
      if (
        profile.ownsPuccaHouse === false &&
        (s.id === 'pmay-g' || s.id === 'pmay-u')
      ) {
        matchReasons.push({
          field: 'housing',
          label: language === 'ta' ? 'வீடு' : language === 'hi' ? 'आवास' : 'Housing',
          value: language === 'ta' ? 'குடிசை / வீடற்ற குடும்பம்' : language === 'hi' ? 'कच्चा मकान / बेघर' : 'Kutcha / Houseless',
        });
      }

      // Calculate score for ranking
      let score = 0;
      const isFullyEligible = evaluation.overallStatus === 'met';
      if (isFullyEligible) {
        score = 1000 + matchReasons.length * 50;
      } else if (evaluation.overallStatus === 'unknown') {
        score = 500 + evaluation.metCount * 40 + matchReasons.length * 20;
      } else {
        score = evaluation.metCount * 10;
      }

      return {
        scheme: s,
        evaluation,
        matchReasons,
        isFullyEligible,
        score,
      };
    }).sort((a, b) => b.score - a.score);
  }, [schemeCatalog, profile, language, getLocalizedOption]);

  const fullyEligibleCount = useMemo(() => {
    return schemeOptionsList.filter((item) => item.isFullyEligible).length;
  }, [schemeOptionsList]);

  const displayedSchemeOptions = useMemo(() => {
    if (optionsFilter === 'eligible') {
      return schemeOptionsList.filter((item) => item.isFullyEligible);
    }
    return schemeOptionsList;
  }, [schemeOptionsList, optionsFilter]);

  return (
    <section
      id={id}
      data-testid="demographic-profile"
      aria-label={t.eligibility.profileTitle}
      tabIndex={-1}
      className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/40 scroll-mt-6 ${className}`}
    >
      {/* Top Banner / Header Bar */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 border-b border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-civic-600 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {t.eligibility.profileTitle}
                </h2>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>
                    {language === 'ta'
                      ? 'ஆதார் தேவையில்லை • தனிநபர் தரவு சேமிக்கப்படாது'
                      : language === 'hi'
                      ? 'आधार आवश्यक नहीं • शून्य डेटा संग्रह'
                      : 'Zero PII • No Aadhaar Required'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {language === 'ta'
                  ? 'உங்கள் புள்ளிவிவரங்களை உள்ளிட்டு உங்களுக்கான அரசு திட்டங்களை கண்டறியவும்.'
                  : language === 'hi'
                  ? 'अपने जनसांख्यिकीय विवरण दर्ज करें और आपके लिए उपयुक्त सरकारी योजनाएं खोजें।'
                  : 'Enter your demographic parameters to match verified central and state welfare programs.'}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 self-start md:self-auto">
            {hasEnteredData && (
              <div className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-civic-50 text-civic-800 border border-civic-200 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-civic-600" />
                <span>
                  {`${eligibleCount}${totalSchemesCount > 0 ? ` / ${totalSchemesCount}` : ''} ${
                    language === 'ta'
                      ? 'திட்டங்கள் தகுதியானவை'
                      : language === 'hi'
                      ? 'योजनाएं पात्र'
                      : 'Schemes Eligible'
                  }`}
                </span>
              </div>
            )}

            {/* Give Scheme Options Action Button in Header */}
            <button
              id="give-scheme-options-btn"
              type="button"
              onClick={handleToggleSchemeOptions}
              data-testid="give-scheme-options-btn"
              aria-expanded={showSchemeOptions}
              aria-controls="demographic-scheme-options"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-100" />
              <span>
                {showSchemeOptions ? t.eligibility.hideSchemeOptions : t.eligibility.giveSchemeOptions}
              </span>
              {schemeOptionsList.length > 0 && (
                <span className="ml-1 bg-white/20 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {schemeOptionsList.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-civic-500"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-civic-600" />
              <span>
                {isOpen ? t.eligibility.collapseProfile : t.eligibility.editProfile}
              </span>
              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Quick Summary Chips if profile has data */}
        {hasEnteredData && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              {language === 'ta' ? 'செயலில் உள்ள சுயவிவரம்:' : language === 'hi' ? 'सक्रिय प्रोफ़ाइल:' : 'Active Profile:'}
            </span>
            {summaryChips.map((chip, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium text-[11px] shadow-2xs"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Profile Form Body */}
      {isOpen && (
        <div className="p-5 sm:p-6 lg:p-8 space-y-6">
          {/* Core Demographic Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Age */}
            <div>
              <label htmlFor="demo-field-age" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.ageLabel}
              </label>
              <input
                id="demo-field-age"
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
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900 transition-colors ${
                  profile.age !== null && (profile.age < 0 || profile.age > 130)
                    ? 'border-rose-400 bg-rose-50/50'
                    : 'border-slate-300'
                }`}
              />
              {profile.age !== null && (profile.age < 0 || profile.age > 130) && (
                <p className="text-[11px] text-rose-600 mt-1">Please enter a valid age between 0 and 130.</p>
              )}
            </div>

            {/* 2. Gender */}
            <div>
              <label htmlFor="demo-field-gender" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.genderLabel}
              </label>
              <select
                id="demo-field-gender"
                value={profile.gender}
                onChange={(e) => handleProfileFieldChange('gender', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900 transition-colors"
              >
                <option value="">{t.eligibility.genderSelect}</option>
                <option value="Female">{getLocalizedOption('genders', 'Female')}</option>
                <option value="Male">{getLocalizedOption('genders', 'Male')}</option>
                <option value="Transgender">{getLocalizedOption('genders', 'Transgender')}</option>
                <option value="Prefer not to say">{getLocalizedOption('genders', 'Prefer not to say')}</option>
              </select>
            </div>

            {/* 3. State / UT */}
            <div>
              <label htmlFor="demo-field-state" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.stateLabel}
              </label>
              <select
                id="demo-field-state"
                value={profile.state}
                onChange={(e) => handleProfileFieldChange('state', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900 transition-colors"
              >
                <option value="">{t.eligibility.stateSelect}</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st === 'Tamil Nadu'
                      ? language === 'ta'
                        ? 'தமிழ்நாடு (Tamil Nadu)'
                        : language === 'hi'
                        ? 'तमिलनाडु (Tamil Nadu)'
                        : st
                      : st}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Residence Area */}
            <div>
              <label htmlFor="demo-field-area" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.areaLabel}
              </label>
              <select
                id="demo-field-area"
                value={profile.area}
                onChange={(e) => handleProfileFieldChange('area', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900 transition-colors"
              >
                <option value="">{t.eligibility.areaSelect}</option>
                <option value="Rural">{getLocalizedOption('areas', 'Rural')}</option>
                <option value="Urban">{getLocalizedOption('areas', 'Urban')}</option>
              </select>
            </div>

            {/* 5. Occupation */}
            <div>
              <label htmlFor="demo-field-occupation" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.occupationLabel}
              </label>
              <select
                id="demo-field-occupation"
                value={profile.occupation}
                onChange={(e) => handleProfileFieldChange('occupation', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900 transition-colors"
              >
                <option value="">{t.eligibility.occupationSelect}</option>
                {OCCUPATIONS.map((occ) => (
                  <option key={occ} value={occ}>
                    {getLocalizedOption('occupations', occ)}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Annual Family Income */}
            <div>
              <label htmlFor="demo-field-income" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.incomeLabel}
              </label>
              <select
                id="demo-field-income"
                value={profile.incomeBracket}
                onChange={(e) => handleProfileFieldChange('incomeBracket', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900 transition-colors"
              >
                <option value="">{t.eligibility.incomeSelect}</option>
                <option value="< 1 Lakh">{getLocalizedOption('incomes', '< 1 Lakh')}</option>
                <option value="1 - 2.5 Lakh">{getLocalizedOption('incomes', '1 - 2.5 Lakh')}</option>
                <option value="2.5 - 5 Lakh">{getLocalizedOption('incomes', '2.5 - 5 Lakh')}</option>
                <option value="5 - 8 Lakh">{getLocalizedOption('incomes', '5 - 8 Lakh')}</option>
                <option value="> 8 Lakh">{getLocalizedOption('incomes', '> 8 Lakh')}</option>
              </select>
            </div>

            {/* 7. Social Category */}
            <div>
              <label htmlFor="demo-field-category" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.categoryLabel}
              </label>
              <select
                id="demo-field-category"
                value={profile.category}
                onChange={(e) => handleProfileFieldChange('category', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900 transition-colors"
              >
                <option value="">{t.eligibility.categorySelect}</option>
                <option value="General">{getLocalizedOption('categories', 'General')}</option>
                <option value="OBC">{getLocalizedOption('categories', 'OBC')}</option>
                <option value="SC">{getLocalizedOption('categories', 'SC')}</option>
                <option value="ST">{getLocalizedOption('categories', 'ST')}</option>
                <option value="EWS">{getLocalizedOption('categories', 'EWS')}</option>
              </select>
            </div>

            {/* 8. Agricultural Landholding */}
            <div>
              <label htmlFor="demo-field-landholding" className="block font-semibold text-slate-700 mb-1.5">
                {t.eligibility.landholdingLabel}
              </label>
              <select
                id="demo-field-landholding"
                value={profile.landholding}
                onChange={(e) => handleProfileFieldChange('landholding', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 focus:bg-white text-slate-900 transition-colors"
              >
                <option value="">{t.eligibility.landholdingSelect}</option>
                <option value="None">{getLocalizedOption('landholdings', 'None')}</option>
                <option value="Marginal (< 1 ha)">{getLocalizedOption('landholdings', 'Marginal (< 1 ha)')}</option>
                <option value="Small (1-2 ha)">{getLocalizedOption('landholdings', 'Small (1-2 ha)')}</option>
                <option value="Medium/Large (> 2 ha)">{getLocalizedOption('landholdings', 'Medium/Large (> 2 ha)')}</option>
              </select>
            </div>
          </div>

          {/* Toggle Checkboxes for Student and Disability */}
          <div className="pt-2 flex flex-wrap gap-6 text-xs text-slate-700 border-t border-slate-100">
            <label htmlFor="demo-field-student" className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                id="demo-field-student"
                type="checkbox"
                checked={profile.isStudent}
                onChange={(e) => handleProfileFieldChange('isStudent', e.target.checked)}
                className="w-4 h-4 rounded text-civic-600 focus:ring-civic-500 border-slate-300"
              />
              <span className="font-semibold">{t.eligibility.isStudent}</span>
            </label>

            <label htmlFor="demo-field-disability" className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                id="demo-field-disability"
                type="checkbox"
                checked={profile.hasDisability}
                onChange={(e) => handleProfileFieldChange('hasDisability', e.target.checked)}
                className="w-4 h-4 rounded text-civic-600 focus:ring-civic-500 border-slate-300"
              />
              <span className="font-semibold">{t.eligibility.hasDisability}</span>
            </label>

            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="text-xs text-civic-700 hover:text-civic-900 font-semibold flex items-center space-x-1 ml-auto cursor-pointer"
            >
              <span>
                {showAdvanced
                  ? (language === 'ta' ? 'கூடுதல் விவரங்களை மறை' : language === 'hi' ? 'अतिरिक्त मानदंड छुपाएं' : 'Hide Additional Criteria')
                  : (language === 'ta' ? '+ கூடுதல் விவரங்கள் (வருமானம், வீடு, வரி, அரசு பணி)' : language === 'hi' ? '+ अतिरिक्त मानदंड (आय, आवास, कर, सरकारी नौकरी)' : '+ Additional Criteria (Tax, Housing, Govt Employee)')}
              </span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Collapsible Advanced Criteria (Income, Housing, Tax, Govt Employee) */}
          {showAdvanced && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
              {/* Exact Annual Household Income */}
              <div>
                <label htmlFor="demo-field-annual-income" className="block font-semibold text-slate-700 mb-1.5">
                  {language === 'ta'
                    ? 'துல்லிய ஆண்டு வருமானம் (₹)'
                    : language === 'hi'
                    ? 'सटीक वार्षिक आय (₹)'
                    : 'Exact Annual Income (₹)'}
                </label>
                <input
                  id="demo-field-annual-income"
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
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 text-slate-900"
                />
              </div>

              {/* Owns Pucca House */}
              <div>
                <label htmlFor="demo-field-pucca-house" className="block font-semibold text-slate-700 mb-1.5">
                  {language === 'ta'
                    ? 'சொந்த கான்கிரீட் வீடு உள்ளதா?'
                    : language === 'hi'
                    ? 'क्या पक्का मकान है?'
                    : 'Owns Pucca House?'}
                </label>
                <select
                  id="demo-field-pucca-house"
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
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 text-slate-900"
                >
                  <option value="">{language === 'ta' ? 'தெரியவில்லை / கூற விரும்பவில்லை' : language === 'hi' ? 'उत्तर नहीं दिया' : 'Unanswered (Unknown)'}</option>
                  <option value="false">{language === 'ta' ? 'இல்லை (குடிசை / வீடற்ற)' : language === 'hi' ? 'नहीं (कच्चा मकान / बेघर)' : 'No (Kutcha / Homeless)'}</option>
                  <option value="true">{language === 'ta' ? 'ஆம் (சொந்த கான்கிரீட் வீடு உண்டு)' : language === 'hi' ? 'हाँ (स्वयं का पक्का मकान है)' : 'Yes (Owns Pucca House)'}</option>
                </select>
              </div>

              {/* Income Tax Payer */}
              <div>
                <label htmlFor="demo-field-tax-payer" className="block font-semibold text-slate-700 mb-1.5">
                  {language === 'ta'
                    ? 'வருமான வரி செலுத்துபவரா?'
                    : language === 'hi'
                    ? 'क्या आयकर दाता हैं?'
                    : 'Income Tax Payer?'}
                </label>
                <select
                  id="demo-field-tax-payer"
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
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 text-slate-900"
                >
                  <option value="">{language === 'ta' ? 'தெரியவில்லை' : language === 'hi' ? 'उत्तर नहीं दिया' : 'Unanswered (Unknown)'}</option>
                  <option value="false">{language === 'ta' ? 'இல்லை (வரி செலுத்துவதில்லை)' : language === 'hi' ? 'नहीं (गैर-करदाता)' : 'No (Non-Taxpayer)'}</option>
                  <option value="true">{language === 'ta' ? 'ஆம் (வரி செலுத்துகிறார்)' : language === 'hi' ? 'हाँ (आयकर दाता)' : 'Yes (Income Tax Payer)'}</option>
                </select>
              </div>

              {/* Government Employee */}
              <div>
                <label htmlFor="demo-field-govt-employee" className="block font-semibold text-slate-700 mb-1.5">
                  {language === 'ta'
                    ? 'அரசு ஊழியரா?'
                    : language === 'hi'
                    ? 'क्या सरकारी कर्मचारी हैं?'
                    : 'Govt Employee?'}
                </label>
                <select
                  id="demo-field-govt-employee"
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
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500 text-slate-900"
                >
                  <option value="">{language === 'ta' ? 'தெரியவில்லை' : language === 'hi' ? 'उत्तर नहीं दिया' : 'Unanswered (Unknown)'}</option>
                  <option value="false">{language === 'ta' ? 'இல்லை (அரசு ஊழியர் அல்ல)' : language === 'hi' ? 'नहीं (गैर-सरकारी)' : 'No (Non-Govt Worker)'}</option>
                  <option value="true">{language === 'ta' ? 'ஆம் (அரசு ஊழியர்)' : language === 'hi' ? 'हाँ (सरकारी कर्मचारी)' : 'Yes (Serving/Retired Govt Employee)'}</option>
                </select>
              </div>
            </div>
          )}

          {/* Footer Controls: Give Scheme Options, Pre-fill demo, Reset, and Eligibility Filter Toggle */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center flex-wrap gap-2">
              {/* Give Scheme Options Action Button in Footer */}
              <button
                id="give-scheme-options-footer-btn"
                type="button"
                onClick={handleToggleSchemeOptions}
                data-testid="give-scheme-options-footer-btn"
                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-xl transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>{showSchemeOptions ? t.eligibility.hideSchemeOptions : t.eligibility.giveSchemeOptions}</span>
                {schemeOptionsList.length > 0 && (
                  <span className="bg-emerald-900/40 text-emerald-100 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {schemeOptionsList.length}
                  </span>
                )}
              </button>

              {onResetProfile && (
                <button
                  type="button"
                  onClick={onResetProfile}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200/80 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>{t.eligibility.resetProfile}</span>
                </button>
              )}

              {isKioskMode && (
                <span className="font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-[11px]">
                  {language === 'ta'
                    ? 'பொது கியோஸ்க் முறை: விவரங்கள் நினைவகத்தில் மட்டுமே இருக்கும்'
                    : language === 'hi'
                    ? 'सार्वजनिक कियोस्क मोड: उत्तर मेमोरी में सुरक्षित'
                    : 'Public Kiosk Mode: Session ephemeral in memory'}
                </span>
              )}
            </div>

            {/* Eligibility Summary & Optional Filter Switch */}
            <div className="flex items-center space-x-2">
              {showFilterToggle && onToggleOnlyEligible && hasEnteredData && (
                <button
                  type="button"
                  onClick={() => onToggleOnlyEligible(!onlyEligibleFilter)}
                  aria-pressed={onlyEligibleFilter}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-civic-500 flex items-center space-x-1.5 cursor-pointer ${
                    onlyEligibleFilter
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {onlyEligibleFilter
                      ? (language === 'ta' ? 'தகுதியானவை மட்டும் (செயலில்)' : language === 'hi' ? 'केवल पात्र योजनाएं (सक्रिय)' : `Filtering: Eligible (${eligibleCount})`)
                      : (language === 'ta' ? `தகுதியான ${eligibleCount} திட்டங்களை மட்டும் காட்டு` : language === 'hi' ? `केवल ${eligibleCount} पात्र योजनाएं दिखाएं` : `Show Only Eligible (${eligibleCount})`)}
                  </span>
                </button>
              )}

              {onNavigateToEligibility && (
                <button
                  type="button"
                  onClick={() => onNavigateToEligibility()}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  {language === 'ta' ? 'முழு ஆய்வு →' : language === 'hi' ? 'विस्तृत जांच →' : 'Detailed Analysis →'}
                </button>
              )}
            </div>
          </div>

          {/* Scheme Options According to Profile Details */}
          {showSchemeOptions && (
            <div
              id="demographic-scheme-options"
              data-testid="demographic-scheme-options"
              className="mt-6 pt-6 border-t border-slate-200 scroll-mt-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        {t.eligibility.schemeOptionsTitle}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {displayedSchemeOptions.length} {t.eligibility.schemeOptionsCount}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {t.eligibility.schemeOptionsSubtitle}
                    </p>
                  </div>
                </div>

                {/* Filter toggle: All Options vs Fully Eligible Only */}
                <div className="flex items-center space-x-1.5 self-start md:self-auto bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setOptionsFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      optionsFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.eligibility.filterAllOptions} ({schemeOptionsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOptionsFilter('eligible')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      optionsFilter === 'eligible'
                        ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.eligibility.filterEligibleOnly} ({fullyEligibleCount})
                  </button>
                </div>
              </div>

              {/* Active Demographic Matching Indicators */}
              {hasEnteredData && summaryChips.length > 0 && (
                <div className="mb-4 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-semibold text-emerald-900 mr-1 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    {language === 'ta'
                      ? 'பொருந்தும் சுயவிவர விவரங்கள்:'
                      : language === 'hi'
                      ? 'मिलान के लिए सक्रिय प्रोफ़ाइल विवरण:'
                      : 'Matching against profile details:'}
                  </span>
                  {summaryChips.map((chip, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-900 font-medium text-[11px] shadow-2xs"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}

              {/* Empty state or Scheme Options Cards Grid */}
              {!hasEnteredData ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    {t.eligibility.emptyProfilePrompt}
                  </p>
                </div>
              ) : displayedSchemeOptions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-600">
                    {t.eligibility.noMatchingSchemes}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedSchemeOptions.map(({ scheme, evaluation, matchReasons, isFullyEligible }) => {
                    const locScheme = getLocalizedScheme(scheme);
                    const isSelectedForMapper = selectedSchemeIdsForMapper?.includes(scheme.id);
                    return (
                      <div
                        key={scheme.id}
                        data-testid={`scheme-option-card-${scheme.id}`}
                        className={`rounded-2xl border transition-all flex flex-col justify-between p-4 sm:p-5 bg-white ${
                          isFullyEligible
                            ? 'border-emerald-200 hover:border-emerald-400 shadow-2xs ring-1 ring-emerald-500/10'
                            : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        {/* Top: Category and Status Badge */}
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">
                              {locScheme.category}
                            </span>
                            {isFullyEligible ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>{t.eligibility.matchedDemographicsBadge}</span>
                              </span>
                            ) : evaluation.overallStatus === 'unknown' ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                                <HelpCircle className="w-3 h-3 text-blue-600" />
                                <span>{t.eligibility.needsVerification}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                                <AlertCircle className="w-3 h-3 text-slate-500" />
                                <span>{t.eligibility.notEligible}</span>
                              </span>
                            )}
                          </div>

                          {/* Title & Ministry */}
                          <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                            {locScheme.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 mb-2.5 line-clamp-1">
                            {locScheme.ministry}
                          </p>

                          {/* Benefits summary callout */}
                          {locScheme.benefits_summary && (
                            <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-emerald-900 text-xs font-semibold flex items-center space-x-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="line-clamp-1">{locScheme.benefits_summary}</span>
                            </div>
                          )}

                          {/* Short Description */}
                          <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                            {locScheme.short_description}
                          </p>

                          {/* Profile Match Reasons List */}
                          {matchReasons.length > 0 && (
                            <div className="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                {t.eligibility.whyMatched}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {matchReasons.map((reason, rIdx) => (
                                  <span
                                    key={rIdx}
                                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-[10px] font-semibold flex items-center space-x-1 shadow-2xs"
                                  >
                                    <span className="text-emerald-700 font-bold">✓</span>
                                    <span className="text-slate-500">{`${reason.label}:`}</span>
                                    <span>{reason.value}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom: Action buttons */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            {(onSelectSchemeForEligibility || onNavigateToEligibility) && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectSchemeForEligibility) {
                                    onSelectSchemeForEligibility(scheme);
                                  } else if (onNavigateToEligibility) {
                                    onNavigateToEligibility(scheme);
                                  }
                                }}
                                className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold text-civic-800 bg-civic-50 hover:bg-civic-100 border border-civic-200 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                              >
                                <span>{t.eligibility.viewSchemeDetails}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}

                            {onSelectForMapper && (
                              <button
                                type="button"
                                onClick={() => onSelectForMapper(scheme.id)}
                                className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center space-x-1 cursor-pointer ${
                                  isSelectedForMapper
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                                title={isSelectedForMapper ? t.eligibility.inMapper : t.eligibility.addToMapper}
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">
                                  {isSelectedForMapper ? t.eligibility.inMapper : t.eligibility.addToMapper}
                                </span>
                              </button>
                            )}

                            {scheme.official_portal_url && (
                              <a
                                href={scheme.official_portal_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Official Portal"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
