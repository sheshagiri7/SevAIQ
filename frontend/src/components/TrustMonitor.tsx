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
import { useLanguage } from '../context/LanguageContext';

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
  const { t, getLocalizedScheme, language } = useLanguage();
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
      const locScheme = getLocalizedScheme(a.scheme);
      const matchTitle =
        a.scheme.title.toLowerCase().includes(q) || locScheme.title.toLowerCase().includes(q);
      const matchMinistry =
        a.scheme.ministry.toLowerCase().includes(q) || locScheme.ministry.toLowerCase().includes(q);
      const matchDomain = a.domainName ? a.domainName.toLowerCase().includes(q) : false;
      return matchTitle || matchMinistry || matchDomain;
    }
    return true;
  });

  // Helper to translate trust inspection flag messages
  const getLocalizedFlag = (flag: string): string => {
    if (language === 'en') return flag;
    if (language === 'hi') {
      if (flag.includes('Non-standard government domain')) {
        return 'गैर-मानक सरकारी डोमेन (अतिरिक्त समीक्षा आवश्यक)';
      }
      if (flag.includes('Malformed portal URL')) {
        return 'अमान्य पोर्टल यूआरएल प्रारूप';
      }
      if (flag.includes('Official portal URL missing')) {
        return 'आधिकारिक पोर्टल यूआरएल अनुपलब्ध';
      }
      if (flag.includes('Last-verification date is not recorded')) {
        return 'अंतिम सत्यापन तिथि दर्ज नहीं है';
      }
      if (flag.includes('Official gazette citation')) {
        return 'आधिकारिक राजपत्र अथवा मंत्रालय संदर्भ अनुपलब्ध';
      }
      return flag;
    }
    if (flag.includes('Non-standard government domain')) {
      return 'நிலையான அரசு இணைய முகவரி இல்லை (கூடுதல் ஆய்வு தேவை)';
    }
    if (flag.includes('Malformed portal URL')) {
      return 'தவறான இணைய முகவரி வடிவம்';
    }
    if (flag.includes('Official portal URL missing')) {
      return 'அதிகாரப்பூர்வ இணைய முகவரி விடுபட்டுள்ளது';
    }
    if (flag.includes('Last-verification date is not recorded')) {
      return 'கடைசி சரிபார்ப்பு நாள் பதிவாகவில்லை';
    }
    if (flag.includes('Official gazette citation')) {
      return 'அதிகாரப்பூர்வ அரசிதழ் அல்லது அமைச்சக மேற்கோள் விடுபட்டுள்ளது';
    }
    return flag;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-civic-700 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>{t.trustMonitor.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t.trustMonitor.title}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t.trustMonitor.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('discover')}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs self-start md:self-auto"
        >
          <span>{language === 'ta' ? 'திட்ட பட்டியலுக்கு திரும்பு' : language === 'hi' ? 'कैटलॉग पर लौटें' : 'Return to Catalog'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Honest Labeling & Transparency Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-3xl text-blue-950 text-xs flex items-start space-x-3.5">
        <Info className="w-5 h-5 text-civic-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-civic-900 block text-sm">
            {language === 'ta'
              ? 'அரசிதழ் தகவல் மற்றும் மூல நம்பகத்தன்மை தணிக்கை:'
              : language === 'hi'
              ? 'मेटाडेटा-आधारित राजपत्र एवं स्रोत सत्यनिष्ठा ऑडिट:'
              : 'Metadata-Based Official Gazette & Source Integrity Audit:'}
          </span>
          <p className="text-slate-700 leading-relaxed text-xs">
            {language === 'ta'
              ? 'SevAIQ ஒரு திட்டத்தின் இணைய இணைப்பு உள்ளதால் மட்டுமே அதை சரிபார்க்கப்பட்டதாக அறிவிப்பதில்லை. ஒவ்வொரு பதிவும் வெளியிடப்பட்ட வழிகாட்டுதல்கள், அமைச்சக அரசிதழ்கள் மற்றும் அதிகாரப்பூர்வ .gov.in / .nic.in இணையதளங்களுடன் ஒப்பிடப்பட்டு சரிபார்க்கப்படுகிறது. தானியங்கி தரவு என்ற பொய்யான உரிமை கோரலின்றி உண்மையான சரிபார்ப்பு தேதிகள் இங்கு காட்டப்படுகின்றன.'
              : language === 'hi'
              ? 'SevAIQ किसी योजना को केवल इसलिए सत्यापित नहीं मानता क्योंकि कोई बाहरी URL उपलब्ध है। प्रत्येक रिकॉर्ड का प्रकाशित दिशानिर्देशों, मंत्रालय राजपत्रों एवं आधिकारिक .gov.in / .nic.in पोर्टलों के आधार पर मिलान किया जाता है। यह ट्रस्ट मॉनिटर बिना किसी स्वचालित स्क्रैपिंग के वास्तविक मेटाडेटा तिथियां प्रदर्शित करता है।'
              : 'SevAIQ never marks a scheme as verified merely because an external URL exists. Every record is verified against published operational guidelines, nodal ministry gazettes, and official .gov.in / .nic.in portals. This Trust Monitor displays real metadata dates without claiming automated live scraping.'}
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Schemes Audited */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {language === 'ta' ? 'தணிக்கை செய்யப்பட்ட மொத்த திட்டங்கள்' : language === 'hi' ? 'ऑडिट की गई कुल योजनाएं' : 'Total Schemes Audited'}
            </span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900">{schemes.length}</span>
              <span className="text-xs text-slate-600 font-semibold">
                {language === 'ta' ? 'செயலில் உள்ள அட்டவணை' : language === 'hi' ? 'सक्रिय कैटलॉग' : 'Active catalog'}
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {language === 'ta'
              ? 'FastAPI பின்தளத்துடன் ஒப்பிட்டு சரிபார்க்கப்பட்டது'
              : language === 'hi'
              ? 'FastAPI बैकएंड के साथ सत्यापित'
              : 'Cross-verified against FastAPI backend storage'}
          </p>
        </div>

        {/* Fully Verified Records */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              {language === 'ta' ? 'முழுமையாக சரிபார்க்கப்பட்ட பதிவுகள்' : language === 'hi' ? 'पूर्णतः सत्यापित रिकॉर्ड' : 'Fully Verified Records'}
            </span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-emerald-700">{fullyVerifiedCount}</span>
              <span className="text-xs text-emerald-600 font-semibold">
                ({schemes.length > 0 ? Math.round((fullyVerifiedCount / schemes.length) * 100) : 0}%)
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {language === 'ta'
              ? 'உண்மையான .gov.in முகவரி & அரசிதழ் நாள் கொண்டது'
              : language === 'hi'
              ? 'प्रामाणिक .gov.in डोमेन एवं वास्तविक राजपत्र तिथि युक्त'
              : 'Backed by authentic .gov.in domain & real gazette date'}
          </p>
        </div>

        {/* Records with Flags */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              {language === 'ta' ? 'கூடுதல் ஆய்வு தேவைப்படும் பதிவுகள்' : language === 'hi' ? 'समीक्षाधीन / नोटिस युक्त रिकॉर्ड' : 'Metadata Notices / Pending'}
            </span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-amber-800">{flaggedCount}</span>
              <span className="text-xs text-amber-700 font-semibold">
                {language === 'ta' ? 'ஆய்வு தேவை' : language === 'hi' ? 'समीक्षा आवश्यक' : 'Need review'}
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {language === 'ta'
              ? 'சரிபார்ப்பு நாள் விடுபட்ட அல்லது நிலையற்ற அரசு இணைய முகவரி'
              : language === 'hi'
              ? 'अस्पष्ट तिथि अथवा गैर-मानक पोर्टल यूआरएल युक्त रिकॉर्ड'
              : 'Records missing explicit date or non-standard portal URL'}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1 pr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'தணிக்கை வடிகட்டி:' : language === 'hi' ? 'ऑडिट फ़िल्टर:' : 'Audit Filter:'}</span>
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
            {language === 'ta'
              ? `அனைத்து திட்டங்கள் (${audits.length})`
              : language === 'hi'
              ? `सभी योजनाएं (${audits.length})`
              : `All Schemes (${audits.length})`}
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
            <span>
              {language === 'ta'
                ? `முழுமையாக சரிபார்க்கப்பட்டது (${fullyVerifiedCount})`
                : language === 'hi'
                ? `पूर्णतः सत्यापित (${fullyVerifiedCount})`
                : `Fully Verified (${fullyVerifiedCount})`}
            </span>
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
            <span>
              {language === 'ta'
                ? `கூடுதல் ஆய்வு தேவை (${flaggedCount})`
                : language === 'hi'
                ? `समीक्षाधीन (${flaggedCount})`
                : `Flags / Pending (${flaggedCount})`}
            </span>
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
            placeholder={
              language === 'ta'
                ? 'திட்டம் அல்லது இணைய முகவரி மூலம் தேடுங்கள்...'
                : language === 'hi'
                ? 'योजना या डोमेन द्वारा खोजें...'
                : 'Search by scheme or domain...'
            }
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-civic-500"
          />
        </div>
      </div>

      {/* Audit Scheme Cards */}
      <div className="space-y-4">
        {filteredAudits.length > 0 ? (
          filteredAudits.map((audit) => {
            const { scheme, hasOfficialGovDomain, domainName, hasRealDate, verificationDate, hasGazetteCitation, isFullyVerified, flags } = audit;
            const locScheme = getLocalizedScheme(scheme);

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
                        {locScheme.category}
                      </span>

                      {isFullyVerified ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {language === 'ta'
                              ? 'முழுமையாக சரிபார்க்கப்பட்ட பதிவு'
                              : language === 'hi'
                              ? 'पूर्णतः सत्यापित रिकॉर्ड'
                              : 'Fully Verified Record'}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            {language === 'ta'
                              ? 'சரிபார்ப்பு அறிவிப்பு நிலுவையில் உள்ளது'
                              : language === 'hi'
                              ? 'सत्यापन सूचना लंबित'
                              : 'Verification Notice Pending'}
                          </span>
                        </span>
                      )}

                      {hasOfficialGovDomain && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <span>
                            {language === 'ta'
                              ? `அதிகாரப்பூர்வ தளம்: ${domainName}`
                              : language === 'hi'
                              ? `आधिकारिक पोर्टल: ${domainName}`
                              : `Official Portal: ${domainName}`}
                          </span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{locScheme.title}</h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center space-x-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{locScheme.ministry}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                    {onSelectSchemeForEligibility && (
                      <button
                        type="button"
                        onClick={() => onSelectSchemeForEligibility(scheme)}
                        className="px-3 py-1.5 rounded-xl bg-civic-50 hover:bg-civic-100 text-civic-800 font-semibold text-xs transition-colors"
                      >
                        {language === 'ta' ? 'விரிவான பகுப்பாய்வு' : language === 'hi' ? 'विस्तृत विश्लेषण' : 'Detailed Analysis'}
                      </button>
                    )}
                    {scheme.official_portal_url && (
                      <a
                        href={scheme.official_portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-civic-50 hover:text-civic-800 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <span>{t.trustMonitor.openPortal}</span>
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
                      <span>
                        {language === 'ta'
                          ? 'கடைசி அரசிதழ் சரிபார்ப்பு'
                          : language === 'hi'
                          ? 'अंतिम राजपत्र सत्यापन'
                          : 'Last Gazette Check'}
                      </span>
                    </span>
                    <p className="font-bold text-slate-800">
                      {hasRealDate
                        ? verificationDate
                        : language === 'ta'
                        ? 'சரிபார்ப்பு நாள் பதிவாகவில்லை'
                        : language === 'hi'
                        ? 'सत्यापन तिथि दर्ज नहीं है'
                        : 'No Verification Date on Record'}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {hasRealDate
                        ? language === 'ta'
                          ? 'அதிகாரப்பூர்வ மூலத்தில் சரிபார்க்கப்பட்டது'
                          : language === 'hi'
                          ? 'आधिकारिक स्रोत से सत्यापित'
                          : 'Verified against authentic source'
                        : language === 'ta'
                        ? 'பழைய அல்லது பதிவாகாத சரிபார்ப்பு'
                        : language === 'hi'
                        ? 'पुरानी या अदर्ज समीक्षा'
                        : 'Stale or unrecorded check'}
                    </span>
                  </div>

                  {/* Gazette Provenance */}
                  <div className="p-3 bg-slate-50 rounded-2xl space-y-1 md:col-span-2">
                    <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider block flex items-center space-x-1">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span>
                        {language === 'ta'
                          ? 'ஆதார அரசிதழ் மேற்கோள்'
                          : language === 'hi'
                          ? 'मूल राजपत्र उद्धरण'
                          : 'Source Provenance Citation'}
                      </span>
                    </span>
                    <p className="text-slate-800 font-medium text-xs leading-snug">
                      {hasGazetteCitation
                        ? scheme.verification_source
                        : language === 'ta'
                        ? 'அதிகாரப்பூர்வ அரசிதழ் மேற்கோள் இல்லை'
                        : language === 'hi'
                        ? 'मेटाडेटा में कोई आधिकारिक स्रोत संदर्भ दर्ज नहीं है।'
                        : 'No official source citation recorded in metadata.'}
                    </p>
                  </div>
                </div>

                {/* Metadata Flags Notice if any */}
                {flags.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-1">
                    <span className="font-bold block flex items-center space-x-1 text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>
                        {language === 'ta'
                          ? `நம்பகத்தன்மை ஆய்வு அறிவிப்புகள் (${flags.length}):`
                          : language === 'hi'
                          ? `विश्वसनीयता निरीक्षण सूचनाएं (${flags.length}):`
                          : `Trust Inspection Notices (${flags.length}):`}
                      </span>
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-amber-900 space-y-0.5">
                      {flags.map((flag, idx) => (
                        <li key={idx}>{getLocalizedFlag(flag)}</li>
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
            <h3 className="text-base font-bold text-slate-900">
              {language === 'ta'
                ? 'இந்த வடிகட்டலுக்கு ஏற்ற திட்டங்கள் எதுவும் இல்லை'
                : language === 'hi'
                ? 'इस फ़िल्टर से मेल खाती कोई योजना नहीं मिली'
                : 'No schemes matched the trust filter'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'ta'
                ? '"அனைத்து திட்டங்கள்" என்பதை தேர்வு செய்யவும் அல்லது தேடல் சொல்லை மாற்றவும்.'
                : language === 'hi'
                ? '"सभी योजनाएं" चुनें या खोज शब्द साफ़ करें।'
                : 'Try selecting "All Schemes" or clearing your search term.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
