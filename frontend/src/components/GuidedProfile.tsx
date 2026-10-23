import React, { useState } from 'react';
import {
  User,
  MapPin,
  Briefcase,
  Home,
  HeartHandshake,
  Check,
  ArrowRight,
  ArrowLeft,
  Lock,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { CitizenProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface GuidedProfileProps {
  profile: CitizenProfile;
  onUpdateProfile: (updated: Partial<CitizenProfile>) => void;
  onComplete: () => void;
  onPreFillDemoProfile?: () => void;
  onResetProfile?: () => void;
  isKioskMode?: boolean;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi (NCT)', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
];

const OCCUPATION_OPTIONS = [
  { id: 'Farmer / Cultivator', labelEn: '🌾 Farmer / Cultivator', labelTa: '🌾 விவசாயி / பயிரிடுபவர்', labelHi: '🌾 किसान / काश्तकार' },
  { id: 'Agricultural Worker', labelEn: '🚜 Agricultural Worker', labelTa: '🚜 விவசாய கூலித் தொழிலாளி', labelHi: '🚜 कृषि मजदूर' },
  { id: 'Street Vendor / Hawker', labelEn: '🛒 Street Vendor / Hawker', labelTa: '🛒 தெருவோர வியாபாரி', labelHi: '🛒 रेहड़ी-पटरी / फेरीवाले' },
  { id: 'Small Business / Artisan', labelEn: '🔨 Small Business / Artisan', labelTa: '🔨 சிறு தொழில் / கைவினைஞர்', labelHi: '🔨 लघु उद्योग / कारीगर' },
  { id: 'Daily Wage / Informal Worker', labelEn: '🧱 Daily-Wage Worker', labelTa: '🧱 தினக்கூலி தொழிலாளி', labelHi: '🧱 दैनिक वेतन भोगी' },
  { id: 'Student / Scholar', labelEn: '🎓 Student / Scholar', labelTa: '🎓 மாணவர்', labelHi: '🎓 विद्यार्थी / छात्र' },
  { id: 'Senior Citizen / Retired', labelEn: '👴 Senior Citizen / Retired', labelTa: '👴 முதியோர் / ஓய்வுபெற்றவர்', labelHi: '👴 वरिष्ठ नागरिक / सेवानिवृत्त' },
  { id: 'Homemaker', labelEn: '🏡 Homemaker', labelTa: '🏡 இல்லத்தரசி', labelHi: '🏡 गृहिणी' },
  { id: 'Unemployed / Jobseeker', labelEn: '💼 Jobseeker / Unemployed', labelTa: '💼 வேலை தேடுபவர்', labelHi: '💼 बेरोजगार / रोजगारार्थी' },
  { id: 'Self-Employed', labelEn: '💼 Self-Employed / Other', labelTa: '💼 சுயதொழில் / பிற', labelHi: '💼 स्व-रोजगार / अन्य' },
];

const INCOME_OPTIONS = [
  { id: '< 1 Lakh', labelEn: 'Below ₹1 Lakh / year', labelTa: 'ஆண்டுக்கு ₹1 லட்சத்திற்கும் கீழ்', labelHi: '₹1 लाख से कम / वर्ष' },
  { id: '1 - 2.5 Lakh', labelEn: '₹1 Lakh to ₹2.5 Lakh', labelTa: '₹1 லட்சம் முதல் ₹2.5 லட்சம் வரை', labelHi: '₹1 लाख से ₹2.5 लाख तक' },
  { id: '2.5 - 5 Lakh', labelEn: '₹2.5 Lakh to ₹5 Lakh', labelTa: '₹2.5 லட்சம் முதல் ₹5 லட்சம் வரை', labelHi: '₹2.5 लाख से ₹5 लाख तक' },
  { id: '5 - 8 Lakh', labelEn: '₹5 Lakh to ₹8 Lakh', labelTa: '₹5 லட்சம் முதல் ₹8 லட்சம் வரை', labelHi: '₹5 लाख से ₹8 लाख तक' },
  { id: '> 8 Lakh', labelEn: 'Above ₹8 Lakh / year', labelTa: 'ஆண்டுக்கு ₹8 லட்சத்திற்கும் மேல்', labelHi: '₹8 लाख से अधिक / वर्ष' },
];

export const GuidedProfile: React.FC<GuidedProfileProps> = ({
  profile,
  onUpdateProfile,
  onComplete,
  onPreFillDemoProfile,
  onResetProfile,
  isKioskMode = false,
}) => {
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;

  const isFarmer =
    profile.occupation === 'Farmer / Cultivator' ||
    profile.occupation === 'Agricultural Worker' ||
    profile.area === 'Rural';

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const stepTitles = [
    {
      num: 1,
      title: language === 'ta' ? 'இடம் & வயது' : language === 'hi' ? 'स्थान व आयु' : 'Location & Age',
      icon: MapPin,
    },
    {
      num: 2,
      title: language === 'ta' ? 'தொழில் & வருமானம்' : language === 'hi' ? 'कार्य व आय' : 'Work & Income',
      icon: Briefcase,
    },
    {
      num: 3,
      title: language === 'ta' ? 'நிலம் & வாழும் சூழல்' : language === 'hi' ? 'भूमि व आवास' : 'Land & Criteria',
      icon: Home,
    },
    {
      num: 4,
      title: language === 'ta' ? 'உதவித் தேவை' : language === 'hi' ? 'आवश्यक सहायता' : 'Needed Help',
      icon: HeartHandshake,
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0c1834] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-8 space-y-6">
      {/* Top Banner: Step Progress & Privacy Guarantee */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-civic-700 dark:text-civic-400 uppercase tracking-wider">
            <User className="w-4 h-4" />
            <span>
              {language === 'ta'
                ? `படிநிலை ${currentStep} / ${totalSteps}`
                : language === 'hi'
                ? `चरण ${currentStep} / ${totalSteps}`
                : `Step ${currentStep} of ${totalSteps}`}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            {language === 'ta'
              ? 'உங்கள் விவரங்கள்: எளிய வழிகாட்டி'
              : language === 'hi'
              ? 'आपके विवरण: सरल चरणबद्ध मार्गदर्शिका'
              : 'Your Details: Guided Scheme Matcher'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            {language === 'ta'
              ? 'சில எளிய கேள்விகளுக்கு பதிலளியுங்கள். எந்த அரசு திட்டங்கள் உங்களுக்கு உதவும் என்பதை நாங்கள் சரிபார்ப்போம்.'
              : language === 'hi'
              ? 'कुछ सरल प्रश्नों के उत्तर दें। हम जांचेंगे कि कौन सी सरकारी योजनाएं आपके लिए उपयुक्त हैं।'
              : 'Answer a few simple questions. We will check which central and state government schemes may help you.'}
          </p>
        </div>

        {/* Reassurance Privacy Pill */}
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold self-start sm:self-auto shrink-0">
          <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            {language === 'ta'
              ? 'ஆதார் / வங்கி விவரங்கள் தேவையில்லை'
              : language === 'hi'
              ? 'आधार / बैंक विवरण की आवश्यकता नहीं'
              : 'No Aadhaar or Bank details needed'}
            {isKioskMode && (
              <span className="ml-1 opacity-80 text-[11px]">
                ({language === 'ta' ? 'கியோஸ்க் முறை: அமர்வு முடிந்ததும் அழிக்கப்படும்' : 'Kiosk: Cleared on exit'})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Step Indicators Bar */}
      <nav aria-label="Profile Progress" className="grid grid-cols-4 gap-2">
        {stepTitles.map((step) => {
          const isDone = currentStep > step.num;
          const isCurrent = currentStep === step.num;
          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setCurrentStep(step.num)}
              className={`p-2 sm:p-3 rounded-2xl border text-left transition-all flex items-center space-x-2 cursor-pointer ${
                isCurrent
                  ? 'bg-civic-50 dark:bg-civic-950/70 border-civic-400 dark:border-civic-600 ring-2 ring-civic-500/20 shadow-xs'
                  : isDone
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 opacity-80'
              }`}
            >
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isCurrent
                    ? 'bg-civic-700 text-white'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.num}
              </div>
              <div className="hidden md:block min-w-0">
                <p className="text-[11px] font-bold truncate leading-tight">{step.title}</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                  {isDone
                    ? language === 'ta' ? 'முடிந்தது' : 'Done'
                    : isCurrent
                    ? language === 'ta' ? 'தற்போது' : 'Active'
                    : ''}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* STEP 1: Location & Age */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="space-y-4">
            {/* Question 1: State */}
            <div>
              <label htmlFor="guided-state" className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                {language === 'ta' ? '1. நீங்கள் எந்த மாநிலத்தில் வசிக்கிறீர்கள்?' : language === 'hi' ? '1. आप किस राज्य में रहते हैं?' : '1. Which state or union territory do you live in?'}
              </label>
              <select
                id="guided-state"
                value={profile.state}
                onChange={(e) => onUpdateProfile({ state: e.target.value })}
                className="w-full sm:w-80 px-3.5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-civic-500 focus:bg-white dark:focus:bg-slate-900"
              >
                <option value="">{language === 'ta' ? '-- மாநிலத்தை தேர்ந்தெடுக்கவும் --' : language === 'hi' ? '-- राज्य चुनें --' : '-- Select your State / UT --'}</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Question 2: Age */}
            <div>
              <label htmlFor="guided-age" className="block text-sm font-bold text-slate-900 dark:text-white mb-1">
                {language === 'ta' ? '2. உங்கள் வயது என்ன?' : language === 'hi' ? '2. आपकी आयु क्या है?' : '2. How old are you?'}
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {language === 'ta'
                  ? 'காரணம்: அடல் பென்ஷன் (18-40), ஆயுஷ்மான் மூத்தோர் அட்டை (70+) போன்ற திட்டங்கள் வயதை அடிப்படையாகக் கொண்டவை.'
                  : language === 'hi'
                  ? 'कारण: अटल पेंशन (18-40) व वरिष्ठ नागरिक स्वास्थ्य कार्ड (70+) आयु पर आधारित हैं।'
                  : 'Why we ask: Schemes like Atal Pension (18-40) and Senior Citizen Health Card (70+) have specific age rules.'}
              </p>
              <div className="flex items-center space-x-3">
                <input
                  id="guided-age"
                  type="number"
                  min="0"
                  max="125"
                  value={profile.age ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                    onUpdateProfile({ age: val });
                  }}
                  placeholder="e.g. 35"
                  className="w-36 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-civic-500 text-center"
                />
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  {language === 'ta' ? 'ஆண்டுகள்' : language === 'hi' ? 'वर्ष' : 'years old'}
                </span>
              </div>
            </div>

            {/* Question 3: Area (Village vs City) */}
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                {language === 'ta' ? '3. நீங்கள் கிராமத்தில் வசிக்கிறீர்களா அல்லது நகரத்திலா?' : language === 'hi' ? '3. आप गांव में रहते हैं या शहर में?' : '3. Do you live in a village or a town/city?'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => onUpdateProfile({ area: 'Rural' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 cursor-pointer ${
                    profile.area === 'Rural'
                      ? 'bg-civic-50 dark:bg-civic-950 border-civic-500 ring-2 ring-civic-500/20 text-civic-900 dark:text-civic-200'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-2xl">🌾</span>
                  <div>
                    <p className="text-sm font-bold">{language === 'ta' ? 'கிராமப்புறம் (Village)' : language === 'hi' ? 'ग्रामीण (गांव)' : 'Village (Rural)'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{language === 'ta' ? 'விவசாயம் & கிராம திட்டங்கள்' : 'Gramin & village schemes'}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateProfile({ area: 'Urban' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 cursor-pointer ${
                    profile.area === 'Urban'
                      ? 'bg-civic-50 dark:bg-civic-950 border-civic-500 ring-2 ring-civic-500/20 text-civic-900 dark:text-civic-200'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-2xl">🏙️</span>
                  <div>
                    <p className="text-sm font-bold">{language === 'ta' ? 'நகர்ப்புறம் (Town / City)' : language === 'hi' ? 'शहरी (नगर / शहर)' : 'Town / City (Urban)'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{language === 'ta' ? 'நகர வாழ்வாதாரம் & ஸ்வநிதி' : 'Urban livelihood & SVANidhi'}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Work & Income */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Question 4: Occupation */}
          <div>
            <label htmlFor="guided-occupation" className="block text-sm font-bold text-slate-900 dark:text-white mb-1">
              {language === 'ta' ? '4. உங்கள் முக்கிய தொழில் அல்லது வாழ்வாதாரம் என்ன?' : language === 'hi' ? '4. आपका मुख्य कार्य या आजीविका क्या है?' : '4. What best describes your work or daily occupation?'}
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
              {language === 'ta'
                ? 'காரணம்: பல நலத்திட்டங்கள் (விவசாயி உதவி, தெருவோர வியாபாரி கடன், கைவினைஞர் நிதி) குறிப்பிட்ட தொழில்களுக்காக உருவாக்கப்பட்டவை.'
                : 'Why we ask: Many welfare schemes are created for specific occupations like farming, street vending, and traditional craftsmanship.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-3xl">
              {OCCUPATION_OPTIONS.map((occ) => {
                const isSelected = profile.occupation === occ.id;
                const label = language === 'ta' ? occ.labelTa : language === 'hi' ? occ.labelHi : occ.labelEn;
                return (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => onUpdateProfile({ occupation: occ.id })}
                    className={`p-3 rounded-xl border text-left transition-all text-xs font-bold cursor-pointer ${
                      isSelected
                        ? 'bg-civic-50 dark:bg-civic-950 border-civic-500 ring-2 ring-civic-500/20 text-civic-900 dark:text-civic-200'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 5: Annual Household Income */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">
              {language === 'ta' ? '5. உங்கள் குடும்பத்தின் தோராயமான ஆண்டு வருமானம் என்ன?' : language === 'hi' ? '5. आपके परिवार की अनुमानित वार्षिक आय क्या है?' : '5. What is your approximate annual household income?'}
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              {language === 'ta'
                ? 'தோராயமான தொகையை தேர்வு செய்யலாம். சான்றிதழ் எண் தேவையில்லை.'
                : 'Select an approximate bracket. You do not need an official income certificate number to check.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {INCOME_OPTIONS.map((inc) => {
                const isSelected = profile.incomeBracket === inc.id;
                const label = language === 'ta' ? inc.labelTa : language === 'hi' ? inc.labelHi : inc.labelEn;
                return (
                  <button
                    key={inc.id}
                    type="button"
                    onClick={() => onUpdateProfile({ incomeBracket: inc.id as any })}
                    className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-civic-700 text-white border-civic-700 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => onUpdateProfile({ incomeBracket: '' })}
                className={`px-3 py-2 rounded-xl border text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 ${
                  profile.incomeBracket === '' ? 'border-slate-400' : 'border-dashed border-slate-200 dark:border-slate-800'
                }`}
              >
                {language === 'ta' ? 'தெரியவில்லை / பின்னர் முடிவு செய்கிறேன்' : 'Not sure / Skip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Land, Housing & Specific Criteria (Progressive Disclosure) */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Progressive Landholding Question for Farmers / Rural Citizens */}
          {isFarmer ? (
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <label className="block text-sm font-bold text-amber-950 dark:text-amber-200">
                {language === 'ta'
                  ? '6. உங்கள் பெயரில் சாகுபடி செய்யக்கூடிய விவசாய நிலம் உள்ளதா?'
                  : language === 'hi'
                  ? '6. क्या आपके नाम पर कृषि भूमि दर्ज है?'
                  : '6. Do you own cultivable agricultural land registered in your name?'}
              </label>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/80">
                {language === 'ta'
                  ? 'PM-KISAN ₹6,000 ஆண்டு நிதியுதவிக்கு நில உரிமை ஆவணம் (பட்டா / சிட்டா) அவசியம்.'
                  : 'PM-KISAN ₹6,000 annual assistance requires cultivable land title (Patta / Khasra).'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {[
                  { id: 'Marginal (< 1 ha)', labelEn: 'Marginal Land (< 1 hectare / 2.5 acres)', labelTa: 'குறு விவசாயி (< 2.5 ஏக்கர்)' },
                  { id: 'Small (1-2 ha)', labelEn: 'Small Land (1-2 hectares / 2.5 to 5 acres)', labelTa: 'சிறு விவசாயி (2.5 முதல் 5 ஏக்கர்)' },
                  { id: 'Medium/Large (> 2 ha)', labelEn: 'Medium / Large (> 2 hectares / > 5 acres)', labelTa: 'நடுத்தர / பெரிய நிலம் (> 5 ஏக்கர்)' },
                  { id: 'None', labelEn: 'No agricultural land owned', labelTa: 'சொந்த விவசாய நிலம் இல்லை' },
                ].map((land) => (
                  <button
                    key={land.id}
                    type="button"
                    onClick={() => onUpdateProfile({ landholding: land.id as any })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                      profile.landholding === land.id
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900 text-slate-800 dark:text-slate-200 hover:bg-amber-100/50'
                    }`}
                  >
                    {language === 'ta' ? land.labelTa : land.labelEn}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center space-x-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {language === 'ta'
                  ? 'நில உரிமை தேவையில்லாத நகர்ப்புற அல்லது மாற்றுத் தொழில் தேர்ந்தெடுக்கப்பட்டுள்ளது.'
                  : 'Agricultural landholding questions skipped based on your selected occupation.'}
              </span>
            </div>
          )}

          {/* Housing Status Question */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
              {language === 'ta' ? '7. நீங்கள் தற்போது எத்தகைய வீட்டில் வசிக்கிறீர்கள்?' : language === 'hi' ? '7. आप वर्तमान में किस प्रकार के मकान में रहते हैं?' : '7. What type of house do you currently live in?'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => onUpdateProfile({ ownsPuccaHouse: false })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  profile.ownsPuccaHouse === false
                    ? 'bg-civic-50 dark:bg-civic-950 border-civic-500 ring-2 ring-civic-500/20 text-civic-900 dark:text-civic-200'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <p className="text-xs font-bold">{language === 'ta' ? 'குடிசை / தகர வீடு (Kutcha House)' : 'Kutcha / Temporary House'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{language === 'ta' ? 'PMAY வீட்டு மானியத்திற்கு முன்னுரிமை' : 'Eligible for PMAY house grant'}</p>
              </button>

              <button
                type="button"
                onClick={() => onUpdateProfile({ ownsPuccaHouse: true })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  profile.ownsPuccaHouse === true
                    ? 'bg-civic-50 dark:bg-civic-950 border-civic-500 ring-2 ring-civic-500/20 text-civic-900 dark:text-civic-200'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <p className="text-xs font-bold">{language === 'ta' ? 'கான்கிரீட் / பக்கா வீடு (Pucca House)' : 'Own Pucca / Concrete House'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{language === 'ta' ? 'ஏற்கனவே சொந்த பக்கா வீடு உள்ளது' : 'Already own permanent pucca house'}</p>
              </button>
            </div>
          </div>

          {/* Additional Criteria Checkboxes (Student, Disability) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {language === 'ta' ? 'கூடுதல் தகுதி விவரங்கள் (பொருந்தினால்):' : 'Additional Applicable Criteria (Optional):'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={profile.isStudent}
                  onChange={(e) => onUpdateProfile({ isStudent: e.target.checked })}
                  className="w-4 h-4 text-civic-600 rounded focus:ring-civic-500"
                />
                <span>{language === 'ta' ? 'பள்ளி அல்லது கல்லூரி மாணவர் (Student)' : 'Enrolled Student in School / College'}</span>
              </label>

              <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={profile.hasDisability}
                  onChange={(e) => onUpdateProfile({ hasDisability: e.target.checked })}
                  className="w-4 h-4 text-civic-600 rounded focus:ring-civic-500"
                />
                <span>{language === 'ta' ? 'மாற்றுத்திறனாளி (Divyangjan / PwD)' : 'Person with Disability (Divyangjan)'}</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: What Help Do You Need? */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
              {language === 'ta'
                ? '8. அரசு திட்டங்கள் மூலம் உங்களுக்கு எந்த வகையான உதவி தேவை?'
                : language === 'hi'
                ? '8. आपको किस प्रकार की सरकारी सहायता की आवश्यकता है?'
                : '8. What kind of government assistance are you looking for?'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              {language === 'ta'
                ? 'உங்களுக்குத் தேவையானதை தேர்வு செய்யுங்கள். உங்கள் சுயவிவரத்துடன் பொருந்தும் திட்டங்களை உடனடியாகக் காண்பிப்போம்.'
                : 'Select the primary help you need. We will match you with authentic, verified welfare schemes.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 'farming', icon: '🌾', titleEn: 'Farming Support', descEn: 'PM-KISAN ₹6,000 direct income', titleTa: 'விவசாய நிதி உதவி', descTa: 'PM-KISAN ₹6,000 நேரடி உதவி' },
                { id: 'healthcare', icon: '🏥', titleEn: 'Free Hospital Treatment', descEn: 'Ayushman Bharat ₹5 Lakh cover', titleTa: 'இலவச மருத்துவ காப்பீடு', descTa: 'ஆயுஷ்மான் ₹5 லட்சம் சிகிச்சை' },
                { id: 'housing', icon: '🏠', titleEn: 'House Construction Grant', descEn: 'PMAY ₹1.2L - ₹2.5L house subsidy', titleTa: 'வீடு கட்ட மானியம்', descTa: 'PMAY சொந்த வீடு கட்ட உதவி' },
                { id: 'pension', icon: '👴', titleEn: 'Senior Citizen Pension', descEn: 'Atal Pension guaranteed monthly sum', titleTa: 'முதியோர் பென்ஷன்', descTa: 'அடல் பென்ஷன் மாத ஓய்வூதியம்' },
                { id: 'business', icon: '💼', titleEn: 'Small Business / Street Loan', descEn: 'MUDRA & SVANidhi collateral-free', titleTa: 'சிறு தொழில் & வியாபார கடன்', descTa: 'முத்ரா & ஸ்வநிதி பிணையமில்லா கடன்' },
                { id: 'education', icon: '🎓', titleEn: 'Scholarships & Education', descEn: 'NSP post-matric tuition reimbursement', titleTa: 'கல்வி உதவித்தொகை', descTa: 'பள்ளி & கல்லூரி கட்டண மானியம்' },
              ].map((need) => (
                <div
                  key={need.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-civic-300 dark:hover:border-civic-600 transition-all flex items-start space-x-3 text-left"
                >
                  <span className="text-2xl mt-0.5">{need.icon}</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {language === 'ta' ? need.titleTa : need.titleEn}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'ta' ? need.descTa : need.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Review Summary Box */}
          <div className="p-4 rounded-2xl bg-civic-50/70 dark:bg-civic-950/60 border border-civic-200 dark:border-civic-800 text-xs text-civic-950 dark:text-civic-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold block text-sm">
                {language === 'ta' ? 'அனைத்து விவரங்களும் தயாராக உள்ளன!' : 'Your details are ready!'}
              </span>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5 text-xs">
                {language === 'ta'
                  ? `${profile.state || 'இந்தியா'} • ${profile.age ? `${profile.age} வயது` : 'வயது பதிவு செய்யப்படவில்லை'} • ${profile.occupation || 'தொழில் பதிவு செய்யப்படவில்லை'}`
                  : `${profile.state || 'India'} • ${profile.age ? `${profile.age} years old` : 'Age pending'} • ${profile.occupation || 'Occupation general'}`}
              </p>
            </div>
            <button
              type="button"
              onClick={onComplete}
              className="px-5 py-2.5 rounded-xl bg-civic-700 hover:bg-civic-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{language === 'ta' ? 'எனக்கான திட்டங்களை காண்க' : 'Find Government Schemes for Me'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Controls: Back, Continue, Demo Fill & Reset */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'முந்தைய படி' : 'Back'}</span>
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-civic-700 hover:bg-civic-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <span>{language === 'ta' ? 'அடுத்த படி' : 'Continue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onComplete}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{language === 'ta' ? 'திட்டங்களைக் கண்டறியவும்' : 'Find Government Schemes for Me'}</span>
            </button>
          )}
        </div>

        {/* Demo & Reset Controls */}
        <div className="flex items-center space-x-2">
          {onPreFillDemoProfile && (
            <button
              type="button"
              onClick={onPreFillDemoProfile}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {language === 'ta' ? 'மாதிரி விவரங்கள் (Demo)' : 'Sample Profile (Demo)'}
            </button>
          )}

          {onResetProfile && (
            <button
              type="button"
              onClick={onResetProfile}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{language === 'ta' ? 'அழித்து தொடங்கு' : 'Clear Form'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
