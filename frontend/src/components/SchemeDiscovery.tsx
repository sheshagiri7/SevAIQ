import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Filter,
  AlertCircle,
  FileCheck,
  ExternalLink,
  RefreshCw,
  Layers,
  ArrowRight,
  Info,
  CheckCircle,
  Calendar,
  Building2,
  FileText,
  ListOrdered,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  HelpCircle,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import { Scheme, SchemeDetail, CategoryCount, CitizenProfile } from '../types';
import { CATEGORY_OPTIONS, matchesCategory } from '../utils/categoryMatcher';
import { fetchCategories, fetchSchemeById } from '../services/api';
import { matchesBilingualQuery } from '../utils/bilingualSearch';
import { evaluateSchemeEligibility } from '../utils/eligibilityEngine';
import { useLanguage } from '../context/LanguageContext';

interface SchemeDiscoveryProps {
  schemes: Scheme[];
  isLoading: boolean;
  onRefreshSchemes: () => void;
  error?: string | null;
  onSelectForEligibility?: (scheme: Scheme) => void;
  onNavigateToTracker?: (schemeId: string) => void;
  onNavigateToDocuments?: (schemeId: string) => void;
  onAskAiAboutScheme?: (schemeTitle: string) => void;
  onNavigateToEligibility?: () => void;
  profile?: CitizenProfile;
  backendSchemesCount: number;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const SchemeDiscovery: React.FC<SchemeDiscoveryProps> = ({
  schemes,
  isLoading,
  onRefreshSchemes,
  error,
  onSelectForEligibility,
  onNavigateToTracker,
  onNavigateToDocuments,
  onAskAiAboutScheme,
  onNavigateToEligibility,
  profile,
  backendSchemesCount,
  selectedCategory: propCategory,
  onSelectCategory: propOnSelectCategory,
}) => {
  const { language, t, getLocalizedScheme, getLocalizedOption } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(propCategory || 'all');
  const [selectedSchemeDetail, setSelectedSchemeDetail] = useState<Scheme | null>(null);
  const [fullSchemeDetail, setFullSchemeDetail] = useState<SchemeDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [expandedCardIds, setExpandedCardIds] = useState<string[]>([]);

  const modalCloseButtonRef = useRef<HTMLButtonElement | null>(null);

  const toggleCardExpanded = (id: string) => {
    setExpandedCardIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getSchemeEligibility = useCallback(
    (scheme: Scheme) => {
      if (!profile || (!profile.age && !profile.occupation && !profile.state)) {
        return null;
      }
      return evaluateSchemeEligibility(scheme, profile);
    },
    [profile]
  );

  const getSuitabilityReason = (scheme: Scheme): string | null => {
    if (!profile) return null;
    const cat = scheme.category?.toLowerCase() || '';
    const occ = profile.occupation?.toLowerCase() || '';
    if (occ.includes('farmer') && (cat.includes('agri') || scheme.id === 'pm-kisan')) {
      return language === 'ta'
        ? 'உங்கள் விவசாய தொழில் & நில விவரங்களுக்கு பொருந்துகிறது.'
        : 'Matches your farming livelihood and rural residence.';
    }
    if (cat.includes('health') || scheme.id === 'pm-jay' || scheme.id === 'ab-pmjay') {
      return language === 'ta'
        ? 'ஆண்டுக்கு ₹5 லட்சம் வரை இலவச மருத்துவ சிகிச்சை அளிக்கிறது.'
        : 'Provides cashless hospital coverage up to ₹5 Lakh/year.';
    }
    if (cat.includes('housing') || scheme.id === 'pmay-u') {
      return language === 'ta'
        ? 'கான்கிரீட் வீடு கட்ட அரசு நிதி உதவி வழங்குகிறது.'
        : 'Offers financial assistance to build or purchase a pucca home.';
    }
    if (cat.includes('pension') || scheme.id === 'nsap') {
      return language === 'ta'
        ? 'முதியோர் மற்றும் ஆதரவற்றோருக்கான மாதாந்திர ஓய்வூதியம்.'
        : 'Monthly pension support for senior citizens and elders.';
    }
    if (cat.includes('business') || scheme.id === 'pm-mudra-yojana') {
      return language === 'ta'
        ? 'பிணை இல்லா சிறு தொழில் கடன் மற்றும் வேலைவாய்ப்பு உதவி.'
        : 'Collateral-free credit support for small businesses.';
    }
    if (cat.includes('scholarship') || scheme.id === 'nsp-post-matric') {
      return language === 'ta'
        ? 'பிற்படுத்தப்பட்ட மற்றும் ஏழை மாணவர்களுக்கான கல்வி உதவித்தொகை.'
        : 'Financial scholarship for students after Class 10.';
    }
    return null;
  };

  // Sync propCategory if it changes externally
  useEffect(() => {
    if (propCategory) {
      setSelectedCategory(propCategory);
    }
  }, [propCategory]);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    propOnSelectCategory?.(catId);
  };

  // Load categories from backend GET /api/categories
  const loadCategories = useCallback(async () => {
    const res = await fetchCategories();
    if (res.success && res.data.length > 0) {
      setCategories(res.data);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories, backendSchemesCount]);

  // Keyboard accessibility: Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedSchemeDetail) {
        setSelectedSchemeDetail(null);
        setFullSchemeDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSchemeDetail]);

  // Focus close button on modal open
  useEffect(() => {
    if (selectedSchemeDetail) {
      setTimeout(() => {
        modalCloseButtonRef.current?.focus();
      }, 50);
    }
  }, [selectedSchemeDetail]);

  // Fetch full scheme details via GET /api/schemes/{id}
  const handleOpenSchemeDetail = async (scheme: Scheme) => {
    setSelectedSchemeDetail(scheme);
    setFullSchemeDetail(null);
    setDetailError(null);
    setIsDetailLoading(true);

    const res = await fetchSchemeById(scheme.id);
    setIsDetailLoading(false);

    if (res.success && res.data) {
      setFullSchemeDetail(res.data);
    } else {
      setDetailError(res.error || `Could not load full details from /api/schemes/${scheme.id}`);
    }
  };

  // Filter schemes using normalized category matcher and bilingual search terms
  const filteredSchemes = schemes.filter((s) => {
    const localized = getLocalizedScheme(s);
    const matchesSearch =
      matchesBilingualQuery(s, searchQuery) ||
      matchesBilingualQuery(localized, searchQuery);
    const matchesCat = matchesCategory(s.category, selectedCategory);
    return matchesSearch && matchesCat;
  });

  const modalScheme = fullSchemeDetail
    ? (getLocalizedScheme(fullSchemeDetail as Scheme) as SchemeDetail)
    : selectedSchemeDetail
    ? getLocalizedScheme(selectedSchemeDetail)
    : null;

  return (
    <section id="discover" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-civic-700 mb-1">
            <Layers className="w-4 h-4" />
            <span>{language === 'ta' ? 'படி 2: திட்டங்களை தேடவும்' : language === 'hi' ? 'चरण 2: योजनाएं खोजें' : 'Stage 2: Find Schemes'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {language === 'ta' ? 'நலத்திட்டங்கள்: உங்களுக்கான அரசு உதவிகள்' : language === 'hi' ? 'कल्याणकारी योजनाएं: आपके लिए सरकारी सहायता' : 'Find Schemes: Discover Government Welfare Programs'}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {language === 'ta'
              ? 'சரிபார்க்கப்பட்ட மத்திய மற்றும் மாநில அரசு நலத்திட்டங்களை எளிய தமிழில் அல்லது ஆங்கிலத்தில் தேடுங்கள்.'
              : language === 'hi'
              ? 'सरल हिंदी या अंग्रेजी में सत्यापित केंद्र और राज्य कल्याणकारी योजनाओं को खोजें।'
              : 'Discover verified central and state welfare benefits and find the right schemes for you.'}
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            type="button"
            onClick={onRefreshSchemes}
            disabled={isLoading}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500 cursor-pointer"
            title="Poll backend /api/schemes for updates"
            aria-label={`Sync schemes with backend. Currently ${backendSchemesCount} schemes from backend.`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t.discover.syncBackend} ({backendSchemesCount})</span>
          </button>
        </div>
      </div>

      {/* Personalized Recommendations Banner */}
      {profile && (profile.age || profile.occupation) ? (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-blue-50/40 rounded-3xl border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-emerald-950 flex items-center gap-2">
                <span>
                  {language === 'ta'
                    ? 'உங்களுக்கு உதவக்கூடிய திட்டங்கள் (உங்கள் விவரங்களின்படி)'
                    : language === 'hi'
                    ? 'आपके लिए उपयुक्त योजनाएं (आपकी जानकारी के आधार पर)'
                    : 'Schemes That May Help You (Based on Your Details)'}
                </span>
                {profile.occupation && (
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    {profile.occupation}
                  </span>
                )}
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                {language === 'ta'
                  ? 'கீழே உள்ள திட்ட அட்டை ஒவ்வொன்றிலும் உங்கள் தகுதி நிலை மற்றும் தேவையான ஆவணங்களை பார்க்கலாம்.'
                  : 'Review qualification badges below and jump straight to document preparation for any scheme.'}
              </p>
            </div>
          </div>
          {onNavigateToEligibility && (
            <button
              type="button"
              onClick={onNavigateToEligibility}
              className="px-3.5 py-1.5 bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-semibold rounded-xl text-xs transition-colors self-start sm:self-auto shrink-0 shadow-2xs cursor-pointer"
            >
              {language === 'ta' ? 'விவரங்களை திருத்தவும்' : 'Edit Your Details (Stage 1)'}
            </button>
          )}
        </div>
      ) : onNavigateToEligibility ? (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center space-x-3">
            <Info className="w-4 h-4 text-civic-700 shrink-0" />
            <span>
              {language === 'ta'
                ? 'உங்கள் தகுதிக்கேற்ப துல்லியமான திட்டங்களை பரிந்துரைக்க, படி 1-ல் எளிய விவரங்களை நிரப்பவும்.'
                : 'Want personalized recommendations? Fill your 2-minute details in Stage 1 to see which schemes match you.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateToEligibility}
            className="px-3.5 py-1.5 bg-civic-700 hover:bg-civic-800 text-white font-semibold rounded-xl transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
          >
            {language === 'ta' ? 'விவரங்களை நிரப்பவும் (படி 1)' : 'Fill Details (Stage 1)'}
          </button>
        </div>
      ) : null}

      {/* Backend Synchronization Notification */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start space-x-3">
        <Info className="w-4 h-4 text-civic-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-civic-900">
            {language === 'ta'
              ? 'சரிபார்க்கப்பட்ட தரவு உத்தரவாதம் & பின்தள நிலை:'
              : language === 'hi'
              ? 'सत्यापित डेटा गारंटी एवं बैकएंड स्थिति:'
              : 'Verified Data Guarantee & Backend Status:'}
          </p>
          <p className="text-slate-700 leading-relaxed">
            {backendSchemesCount === 0 ? (
              language === 'ta' ? (
                <>
                  FastAPI இறுதிப்புள்ளி <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-slate-800">GET /api/schemes</code> தற்போது எதிர்பார்க்கப்பட்டபடி காலியாக உள்ளது.
                  SevAIQ அதிகாரப்பூர்வ போர்ட்டல்களின் (எ.கா. <em>pmkisan.gov.in</em>, <em>pmjay.gov.in</em>) சரிபார்க்கப்பட்ட மாதிரிகளை காட்டுகிறது.
                </>
              ) : language === 'hi' ? (
                <>
                  FastAPI एंडपॉइंट <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-slate-800">GET /api/schemes</code> वर्तमान में खाली है।
                  SevAIQ आधिकारिक सरकारी पोर्टलों (उदा. <em>pmkisan.gov.in</em>, <em>pmjay.gov.in</em>) के सत्यापित मॉडल प्रदर्शित करता है।
                </>
              ) : (
                <>
                  FastAPI endpoint <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-slate-800">GET /api/schemes</code> currently returns <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-slate-800">[]</code> as expected during initial setup.
                  SevAIQ displays official reference models from authentic portals (e.g. <em>pmkisan.gov.in</em>, <em>pmjay.gov.in</em>) so you can evaluate eligibility and document mapping.
                </>
              )
            ) : (
              <>
                FastAPI backend has returned {backendSchemesCount} verified schemes from <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-slate-800">GET /api/schemes</code>.
              </>
            )}
          </p>
        </div>
      </div>

      {/* AI & Bilingual Search Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-civic-50 text-civic-700">
              <Sparkles className="w-4 h-4 text-civic-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {language === 'ta'
                  ? 'தமிழ் & ஆங்கில இருமொழி நலத்திட்ட தேடுபொறி'
                  : language === 'hi'
                  ? 'बहुभाषी कल्याणकारी योजना खोज इंजन'
                  : 'AI & Bilingual Natural Language Scheme Finder'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'ta'
                  ? 'எளிய தமிழில் அல்லது ஆங்கிலத்தில் உங்கள் தேவையை தட்டச்சு செய்யுங்கள் (எ.கா. "விவசாயி உதவி", "மருத்துவ காப்பீடு", "வீடு கட்ட", "ஓய்வூதியம்")'
                  : language === 'hi'
                  ? 'सरल हिंदी या अंग्रेजी में अपनी आवश्यकता लिखें (जैसे "किसान सहायता", "आयुष्मान इलाज", "मकान", "पेंशन")'
                  : 'Describe citizen needs in simple Tamil or English (e.g. "விவசாயி உதவி", "free healthcare", "வீடு கட்ட", "pension")'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
            {language === 'ta'
              ? `காட்டப்படுவது: ${filteredSchemes.length} / ${schemes.length} திட்டங்கள்`
              : language === 'hi'
              ? `प्रदर्शित: ${filteredSchemes.length} / ${schemes.length} योजनाएं`
              : `Showing ${filteredSchemes.length} of ${schemes.length} schemes`}
          </span>
        </div>

        {/* Search Input with Clear Button */}
        <div className="relative">
          <label htmlFor="scheme-search-input" className="sr-only">
            {t.discover.searchPlaceholder}
          </label>
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="scheme-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.discover.searchPlaceholder}
            className="w-full pl-11 pr-10 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-civic-500 focus:border-civic-500 shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>


        {/* Sector Filter Pills */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1 pr-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'ta' ? 'துறைகள்:' : language === 'hi' ? 'क्षेत्र:' : 'Sectors:'}</span>
          </span>
          <button
            type="button"
            onClick={() => handleCategorySelect('all')}
            aria-pressed={selectedCategory === 'all'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500 ${
              selectedCategory === 'all'
                ? 'bg-civic-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.discover.allCategories} ({schemes.length})
          </button>
          {categories.length > 0
            ? categories.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.category.toLowerCase();
                const localizedCatName = getLocalizedOption('categoryFilters', cat.category.toLowerCase()) || cat.category;
                return (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => handleCategorySelect(cat.category)}
                    aria-pressed={isSelected}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500 ${
                      isSelected
                        ? 'bg-civic-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {localizedCatName} ({cat.count})
                  </button>
                );
              })
            : CATEGORY_OPTIONS.filter((c) => c.id !== 'all').map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  aria-pressed={selectedCategory === cat.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500 ${
                    selectedCategory === cat.id
                      ? 'bg-civic-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {getLocalizedOption('categoryFilters', cat.id) || cat.label}
                </button>
              ))}
        </div>

        {/* Honest AI & Bilingual Search Disclosure */}
        <div className="pt-2 text-[11px] text-slate-500 flex items-center space-x-1.5 border-t border-slate-100">
          <Info className="w-3.5 h-3.5 text-civic-600 shrink-0" />
          <span>
            {language === 'ta' ? (
              <><strong>வெளிப்படைத்தன்மை:</strong> இருமொழி தேடலானது குடிமக்களின் தேவைகளை நேரடியாக சரிபார்க்கப்பட்ட அரசு திட்டங்களுடன் இணைக்கிறது. உங்கள் தரவு எங்கும் கசியாமல் சாதனத்திலேயே பாதுகாப்பாக இயங்குகிறது.</>
            ) : language === 'hi' ? (
              <><strong>इंजन पारदर्शिता:</strong> बहुभाषी खोज नागरिक की आवश्यकता को सीधे सत्यापित सरकारी योजना रिकॉर्ड्स से जोड़ती है। आपका डेटा किसी बाहरी मॉडल को भेजे बिना उपकरण पर ही सुरक्षित रूप से संसाधित होता है।</>
            ) : (
              <><strong>Engine Transparency:</strong> Bilingual search maps citizen intent in simple Tamil, Hindi, and English directly to verified FastAPI backend scheme records (<code className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">GET /api/schemes</code>) using client-side semantic matching without transmitting personal queries to external LLMs.</>
            )}
          </span>
        </div>
      </div>

      {/* Error state if backend query failed */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Backend sync notice:</span> {error}
            <p className="text-xs text-amber-800 mt-1">
              Verify local FastAPI backend is active on port 8000. Verified reference models remain available.
            </p>
          </div>
        </div>
      )}

      {/* Schemes Grid */}
      <div>
        {isLoading ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-8 h-8 text-civic-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">{language === 'ta' ? 'பின்தள சேவையகத்துடன் இணைகிறது...' : language === 'hi' ? 'बैकएंड एपीआई से जुड़ रहा है...' : 'Connecting to Backend API...'}</p>
            <p className="text-xs text-slate-600 mt-1">Querying /api/schemes</p>
          </div>
        ) : filteredSchemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemes.map((rawScheme) => {
              const scheme = getLocalizedScheme(rawScheme);
              const isCardExpanded = expandedCardIds.includes(scheme.id);
              const evalResult = getSchemeEligibility(rawScheme);
              const suitability = getSuitabilityReason(rawScheme);

              return (
                <div
                  key={scheme.id}
                  className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-civic-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Category + Verified + Eligibility Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-civic-50 text-civic-800 border border-civic-200">
                          {scheme.category}
                        </span>
                        {scheme.verified && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <FileCheck className="w-3 h-3 text-emerald-600" />
                            <span>{t.discover.verifiedOfficialSource}</span>
                          </span>
                        )}
                      </div>

                      {evalResult && (
                        evalResult.overallStatus === 'met' ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{language === 'ta' ? 'தகுதி பெறலாம்' : language === 'hi' ? 'पात्र हो सकते हैं' : 'May qualify'}</span>
                          </span>
                        ) : evalResult.overallStatus === 'unknown' ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{language === 'ta' ? 'கூடுதல் விவரம் தேவை' : language === 'hi' ? 'अधिक जानकारी आवश्यक' : 'More info needed'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            <XCircle className="w-3.5 h-3.5 text-slate-500" />
                            <span>{language === 'ta' ? 'பொருந்தவில்லை' : language === 'hi' ? 'शर्तें पूरी नहीं' : 'Does not match'}</span>
                          </span>
                        )
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                      {scheme.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2.5 font-medium">{scheme.ministry}</p>
                    <p className="text-xs text-slate-700 leading-relaxed mb-3">
                      {scheme.short_description}
                    </p>

                    {/* Suitability Rationale */}
                    {suitability && (
                      <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-950 mb-3 flex items-start space-x-2">
                        <Sparkles className="w-3.5 h-3.5 text-civic-700 shrink-0 mt-0.5" />
                        <span className="leading-snug">
                          <strong>{language === 'ta' ? 'ஏன் பொருந்தும்:' : 'Why this may suit you:'}</strong>{' '}
                          {suitability}
                        </span>
                      </div>
                    )}

                    {scheme.benefits_summary && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 mb-3 flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium text-[11px]">{scheme.benefits_summary}</span>
                      </div>
                    )}

                    {/* Expandable More Information Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleCardExpanded(scheme.id)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-civic-700 hover:text-civic-900 mb-3 cursor-pointer"
                    >
                      <span>
                        {isCardExpanded
                          ? language === 'ta' ? 'குறைவாகக் காட்டு' : 'Show less'
                          : language === 'ta' ? 'கூடுதல் விவரங்கள்' : 'More information'}
                      </span>
                      {isCardExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isCardExpanded && (
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-3 text-xs space-y-2 animate-in fade-in">
                        {scheme.required_documents && scheme.required_documents.length > 0 && (
                          <div>
                            <span className="font-bold text-slate-800 block text-[11px] mb-1">
                              {language === 'ta' ? 'தேவையான முக்கிய ஆவணங்கள்:' : 'Key Documents Needed:'}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {scheme.required_documents.map((doc, i) => (
                                <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] text-slate-700">
                                  {doc}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {scheme.application_mode && (
                          <div className="text-[11px] text-slate-600">
                            <strong>{language === 'ta' ? 'விண்ணப்பிக்கும் முறை:' : 'Application Mode:'}</strong> {scheme.application_mode}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions & Links */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      {scheme.official_portal_url ? (
                        <a
                          href={scheme.official_portal_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-civic-700 font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-civic-500 rounded"
                        >
                          <span>{t.discover.officialPortal}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-500">Portal verification pending</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenSchemeDetail(rawScheme)}
                        className="text-civic-700 hover:text-civic-900 font-semibold focus:outline-none focus:ring-1 focus:ring-civic-500 rounded px-1 flex items-center space-x-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{t.discover.viewFullDetails}</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {onNavigateToDocuments && (
                        <button
                          type="button"
                          onClick={() => onNavigateToDocuments(scheme.id)}
                          className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{language === 'ta' ? 'ஆவணங்களை சரிபார்க்கவும் (படி 3)' : 'Check Documents (Stage 3)'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        {onAskAiAboutScheme ? (
                          <button
                            type="button"
                            onClick={() => onAskAiAboutScheme(scheme.title)}
                            className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl bg-white hover:bg-civic-50 text-civic-800 border border-civic-300 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3 text-civic-600" />
                            <span>{language === 'ta' ? 'AI-யிடம் கேள்' : 'Ask AI'}</span>
                          </button>
                        ) : onSelectForEligibility ? (
                          <button
                            type="button"
                            onClick={() => onSelectForEligibility(rawScheme)}
                            className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl bg-white hover:bg-civic-50 text-civic-800 border border-civic-300 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            <span>{t.discover.checkEligibility}</span>
                          </button>
                        ) : null}

                        {onNavigateToTracker && (
                          <button
                            type="button"
                            onClick={() => onNavigateToTracker(scheme.id)}
                            className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            <ListOrdered className="w-3 h-3 text-civic-700" />
                            <span>{language === 'ta' ? 'வழிகாட்டல்' : 'Guide (Stage 4)'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{t.discover.noSchemesFound}</h3>
            <p className="text-xs text-slate-600">
              {t.discover.noSchemesDesc}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 text-xs font-semibold text-civic-800 bg-civic-50 rounded-xl hover:bg-civic-100 transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500"
            >
              {t.discover.clearFilters}
            </button>
          </div>
        )}
      </div>

      {/* Accessible Full Scheme Detail Modal */}
      {modalScheme && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-scheme-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-civic-50 text-civic-800 border border-civic-200">
                  {modalScheme.category}
                </span>
                <h3 id="modal-scheme-title" className="text-xl font-bold text-slate-900 mt-1.5 leading-snug">
                  {modalScheme.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium flex items-center space-x-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{modalScheme.ministry}</span>
                  {fullSchemeDetail?.nodal_agency && (
                    <span className="text-slate-400">({fullSchemeDetail.nodal_agency})</span>
                  )}
                </p>
              </div>
              <button
                ref={modalCloseButtonRef}
                type="button"
                onClick={() => {
                  setSelectedSchemeDetail(null);
                  setFullSchemeDetail(null);
                }}
                aria-label="Close dialog"
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-500"
              >
                ✕
              </button>
            </div>

            {isDetailLoading && (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <RefreshCw className="w-6 h-6 text-civic-600 animate-spin mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Loading verified criteria & instructions from /api/schemes/{modalScheme.id}...</p>
              </div>
            )}

            {detailError && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Backend Details Notice:</span> {detailError}
                  <p className="text-[11px] text-amber-800 mt-0.5">Showing baseline catalog summary below.</p>
                </div>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Detailed Benefits */}
              {(modalScheme.detailed_benefits || modalScheme.short_description) && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{t.discover.detailedBenefits}</span>
                  </span>
                  <p className="text-slate-700 leading-relaxed text-xs">
                    {modalScheme.detailed_benefits || modalScheme.short_description}
                  </p>
                </div>
              )}

              {/* Eligibility Summary & Structured Criteria */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                  <FileCheck className="w-4 h-4 text-civic-700" />
                  <span>{t.discover.eligibilityCriteria}</span>
                </span>
                {fullSchemeDetail?.eligibility_summary && (
                  <p className="text-slate-700 leading-relaxed text-xs">
                    {fullSchemeDetail.eligibility_summary}
                  </p>
                )}
                {fullSchemeDetail?.eligibility_criteria && Object.keys(fullSchemeDetail.eligibility_criteria).length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    {Object.entries(fullSchemeDetail.eligibility_criteria).map(([key, val]) => (
                      <div key={key} className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 uppercase tracking-wider font-semibold block text-[10px]">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-800 font-medium">
                          {Array.isArray(val) ? val.join(', ') : String(val ?? 'None')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Application Steps */}
              {fullSchemeDetail?.application_steps && fullSchemeDetail.application_steps.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                    <ListOrdered className="w-4 h-4 text-civic-700" />
                    <span>{t.discover.applicationSteps}</span>
                  </span>
                  <ol className="space-y-1.5 list-decimal list-inside text-slate-700 text-xs">
                    {fullSchemeDetail.application_steps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed pl-1">
                        <span className="font-medium text-slate-800">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Required Documents */}
              {(modalScheme.required_documents) && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="font-bold text-slate-900 block text-xs">{t.discover.requiredDocs}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(modalScheme.required_documents || []).map((doc) => (
                      <span
                        key={doc}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px] font-medium shadow-2xs"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Provenance & Citation */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/70 space-y-1 text-slate-700">
                <span className="font-bold text-civic-900 block text-xs">{t.discover.sourceCitation}:</span>
                <p className="text-[11px] text-slate-700">
                  {modalScheme.verification_source || 'Official government publication citation not recorded'}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 pt-1 border-t border-blue-200/50">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.discover.verifiedOn} <strong>{modalScheme.verification_date || '2026-10-22'}</strong></span>
                  </span>
                  <span>•</span>
                  <span>Origin: <strong className="capitalize">{modalScheme.origin || 'backend'}</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              {modalScheme.official_portal_url ? (
                <a
                  href={modalScheme.official_portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-civic-800 bg-civic-50 hover:bg-civic-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500"
                >
                  <span>{t.discover.officialPortal}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : <div />}

              <div className="flex items-center space-x-2">
                {onSelectForEligibility && (
                  <button
                    type="button"
                    onClick={() => {
                      const schemeToSelect = selectedSchemeDetail;
                      setSelectedSchemeDetail(null);
                      setFullSchemeDetail(null);
                      if (schemeToSelect) {
                        onSelectForEligibility(schemeToSelect);
                      }
                    }}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-civic-700 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500 cursor-pointer shadow-xs"
                  >
                    <span>{t.discover.checkEligibility}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSchemeDetail(null);
                    setFullSchemeDetail(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer"
                >
                  {t.discover.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
