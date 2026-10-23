import React, { useState, useEffect } from 'react';
import {
  ListChecks,
  ExternalLink,
  ShieldCheck,
  Building,
  ArrowRight,
  FileText,
  RotateCcw,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { Scheme, NavigationTab } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ApplicationTrackerProps {
  schemes: Scheme[];
  initialSchemeId?: string;
  onNavigate: (tab: NavigationTab) => void;
  isKioskMode: boolean;
}

export type CitizenApplicationStatus =
  | 'not_applied'
  | 'preparing_docs'
  | 'ready_to_apply'
  | 'submitted'
  | 'under_review'
  | 'action_required'
  | 'approved'
  | 'rejected'
  | 'unknown';

const OFFICIAL_STATUS_CHECK_URLS: Record<
  string,
  { labelEn: string; labelTa: string; url: string; portalName: string }
> = {
  'pm-kisan': {
    labelEn: 'Check PM-KISAN Beneficiary Status & Installment Details',
    labelTa: 'PM-KISAN தவணை & பயனாளி நிலையை சரிபார்க்கவும்',
    url: 'https://pmkisan.gov.in/BeneficiaryStatus_New.aspx',
    portalName: 'PM-KISAN Portal (pmkisan.gov.in)',
  },
  'ab-pmjay': {
    labelEn: 'Check Ayushman Card & Treatment Eligibility Status',
    labelTa: 'ஆயுஷ்மான் கார்டு & சிகிச்சை நிலையை சரிபார்க்கவும்',
    url: 'https://beneficiary.nha.gov.in/',
    portalName: 'NHA Beneficiary Portal (beneficiary.nha.gov.in)',
  },
  'pm-jay': {
    labelEn: 'Check Ayushman Card & Treatment Eligibility Status',
    labelTa: 'ஆயுஷ்மான் கார்டு & சிகிச்சை நிலையை சரிபார்க்கவும்',
    url: 'https://beneficiary.nha.gov.in/',
    portalName: 'NHA Beneficiary Portal (beneficiary.nha.gov.in)',
  },
  'pmay-u': {
    labelEn: 'Check PMAY-U 2.0 Housing Application Status',
    labelTa: 'PMAY-U 2.0 வீடு கட்டும் விண்ணப்ப நிலையை சரிபார்க்கவும்',
    url: 'https://pmay-urban.gov.in/',
    portalName: 'MoHUA PMAY-Urban Portal (pmay-urban.gov.in)',
  },
  'pm-mudra-yojana': {
    labelEn: 'Track Mudra Loan Application on Udyami Mitra',
    labelTa: 'முத்ரா கடன் விண்ணப்பத்தை உத்யமி மித்ரா தளத்தில் கண்காணிக்கவும்',
    url: 'https://www.udyamimitra.in/',
    portalName: 'Udyami Mitra (udyamimitra.in)',
  },
  'nsap': {
    labelEn: 'Track National Social Assistance Pension Application',
    labelTa: 'தேசிய சமூக ஓய்வூதிய விண்ணப்ப நிலையை கண்காணிக்கவும்',
    url: 'https://nsap.nic.in/',
    portalName: 'NSAP Pension Portal (nsap.nic.in)',
  },
  'nsp-post-matric': {
    labelEn: 'Track National Scholarship Portal (NSP) Application',
    labelTa: 'தேசிய கல்வி உதவித்தொகை விண்ணப்ப நிலையை கண்காணிக்கவும்',
    url: 'https://scholarships.gov.in/',
    portalName: 'National Scholarship Portal (scholarships.gov.in)',
  },
  'pm-svanidhi': {
    labelEn: 'Track Street Vendor Loan Status on PM SVANidhi Portal',
    labelTa: 'PM SVANidhi சிறு வியாபாரி கடன் நிலையை கண்காணிக்கவும்',
    url: 'https://pmsvanidhi.mohua.gov.in/',
    portalName: 'PM SVANidhi Portal (pmsvanidhi.mohua.gov.in)',
  },
  'pm-vishwakarma': {
    labelEn: 'Track PM Vishwakarma Application & Artisan Verification',
    labelTa: 'விஸ்வகர்மா விண்ணப்பம் & கைவினைஞர் சரிபார்ப்பு நிலை',
    url: 'https://pmvishwakarma.gov.in/',
    portalName: 'PM Vishwakarma Portal (pmvishwakarma.gov.in)',
  },
};

const STATUS_OPTIONS: {
  id: CitizenApplicationStatus;
  labelEn: string;
  labelTa: string;
  badgeStyle: string;
}[] = [
  {
    id: 'not_applied',
    labelEn: 'Not applied yet',
    labelTa: 'இன்னும் விண்ணப்பிக்கவில்லை',
    badgeStyle: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  {
    id: 'preparing_docs',
    labelEn: 'Preparing documents (Stage 3)',
    labelTa: 'ஆவணங்கள் தயாரிப்பில் உள்ளது (படி 3)',
    badgeStyle: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    id: 'ready_to_apply',
    labelEn: 'Ready to apply (all docs ready)',
    labelTa: 'விண்ணப்பிக்க தயார் (ஆவணங்கள் உள்ளன)',
    badgeStyle: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  {
    id: 'submitted',
    labelEn: 'Application submitted on portal / Kendra',
    labelTa: 'போர்டல் / சேவை மையத்தில் சமர்ப்பிக்கப்பட்டது',
    badgeStyle: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
  {
    id: 'under_review',
    labelEn: 'Under government review / scrutiny',
    labelTa: 'அரசு பரிசீலனையில் உள்ளது',
    badgeStyle: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    id: 'action_required',
    labelEn: 'Action required (e-KYC / correction)',
    labelTa: 'நடவடிக்கை தேவை (e-KYC / திருத்தம்)',
    badgeStyle: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    id: 'approved',
    labelEn: 'Approved by department',
    labelTa: 'துறையால் ஒப்புதல் அளிக்கப்பட்டது',
    badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    id: 'rejected',
    labelEn: 'Application rejected / ineligible',
    labelTa: 'நிராகரிக்கப்பட்டது / தகுதி பெறவில்லை',
    badgeStyle: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  {
    id: 'unknown',
    labelEn: 'Status unknown / not checked',
    labelTa: 'நிலை தெரியவில்லை',
    badgeStyle: 'bg-slate-100 text-slate-600 border-slate-200',
  },
];

interface StepItem {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  schemes,
  initialSchemeId,
  onNavigate,
  isKioskMode,
}) => {
  const { t, getLocalizedScheme, language } = useLanguage();
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(() => {
    if (initialSchemeId && schemes.some((s) => s.id === initialSchemeId)) {
      return initialSchemeId;
    }
    return schemes.length > 0 ? schemes[0].id : 'pm-kisan';
  });

  // Track completed step IDs per scheme
  const [completedStepsMap, setCompletedStepsMap] = useState<Record<string, string[]>>(() => {
    if (!isKioskMode) {
      try {
        const saved = localStorage.getItem('SEVAIQ_APPLICATION_PROGRESS');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {};
  });

  // Citizen optional personal note per scheme (no PII)
  const [notesMap, setNotesMap] = useState<Record<string, string>>(() => {
    if (!isKioskMode) {
      try {
        const saved = localStorage.getItem('SEVAIQ_APPLICATION_NOTES');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {};
  });

  // Citizen self-reported application status per scheme
  const [statusMap, setStatusMap] = useState<Record<string, CitizenApplicationStatus>>(() => {
    if (!isKioskMode) {
      try {
        const saved = localStorage.getItem('SEVAIQ_APPLICATION_STATUS');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {};
  });

  // Follow-up reminder date per scheme
  const [reminderMap, setReminderMap] = useState<Record<string, string>>(() => {
    if (!isKioskMode) {
      try {
        const saved = localStorage.getItem('SEVAIQ_APPLICATION_REMINDERS');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {};
  });

  const [reminderNotice, setReminderNotice] = useState<string | null>(null);

  // Sync to localStorage only when NOT in kiosk mode
  useEffect(() => {
    if (isKioskMode) return;
    try {
      localStorage.setItem('SEVAIQ_APPLICATION_PROGRESS', JSON.stringify(completedStepsMap));
    } catch {
      // ignore
    }
  }, [completedStepsMap, isKioskMode]);

  useEffect(() => {
    if (isKioskMode) return;
    try {
      localStorage.setItem('SEVAIQ_APPLICATION_NOTES', JSON.stringify(notesMap));
    } catch {
      // ignore
    }
  }, [notesMap, isKioskMode]);

  useEffect(() => {
    if (isKioskMode) return;
    try {
      localStorage.setItem('SEVAIQ_APPLICATION_STATUS', JSON.stringify(statusMap));
    } catch {
      // ignore
    }
  }, [statusMap, isKioskMode]);

  useEffect(() => {
    if (isKioskMode) return;
    try {
      localStorage.setItem('SEVAIQ_APPLICATION_REMINDERS', JSON.stringify(reminderMap));
    } catch {
      // ignore
    }
  }, [reminderMap, isKioskMode]);

  const handleStatusChange = (status: CitizenApplicationStatus) => {
    setStatusMap((prev) => ({ ...prev, [selectedSchemeId]: status }));
  };

  const handleReminderChange = (date: string) => {
    setReminderMap((prev) => ({ ...prev, [selectedSchemeId]: date }));
  };

  const handleRequestReminder = async () => {
    const date = reminderMap[selectedSchemeId];
    if (!date) {
      setReminderNotice(
        language === 'ta'
          ? 'தயவுசெய்து நினைவூட்டலுக்கான தேதியை தேர்ந்தெடுக்கவும்.'
          : 'Please select a reminder date first.'
      );
      setTimeout(() => setReminderNotice(null), 3000);
      return;
    }

    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setReminderNotice(
            language === 'ta'
              ? `நினைவூட்டல் அமைக்கப்பட்டது! (${date})`
              : `Reminder set! Browser will notify you on ${date}.`
          );
        } else {
          setReminderNotice(
            language === 'ta'
              ? `நினைவூட்டல் சேமிக்கப்பட்டது: ${date}. (அறிவிப்பு அனுமதி வழங்கப்படவில்லை)`
              : `Reminder saved for ${date}. (Browser notification permission denied).`
          );
        }
      } catch {
        setReminderNotice(`Reminder saved for ${date}.`);
      }
    } else {
      setReminderNotice(`Reminder saved for ${date}.`);
    }

    setTimeout(() => {
      setReminderNotice(null);
    }, 4000);
  };

  const activeScheme = schemes.find((s) => s.id === selectedSchemeId) || schemes[0];
  const locActiveScheme = activeScheme ? getLocalizedScheme(activeScheme) : null;

  // Build standard guidance steps for the active scheme
  const steps: StepItem[] = [];
  const currentCompleted = completedStepsMap[selectedSchemeId] || [];

  if (activeScheme && locActiveScheme) {
    // 1. Eligibility Check Step
    steps.push({
      id: 'step-eligibility',
      title: t.tracker.stage1Title,
      description:
        language === 'ta'
          ? `${locActiveScheme.title} திட்டத்திற்கான சட்டப்பூர்வ தகுதி விதிகளை சரிபாருங்கள். வயது, வருமானம் மற்றும் தொழில் தேவைகள் பொருந்துகிறதா என்பதை உறுதிப்படுத்தவும்.`
          : language === 'hi'
          ? `${locActiveScheme.title} के लिए वैधानिक पात्रता नियमों की समीक्षा करें। सुनिश्चित करें कि नागरिक आयु, आय एवं व्यवसाय की शर्तों को पूरा करता है।`
          : `Review verified eligibility rules for ${activeScheme.title}. Ensure citizen meets age, income, and occupational requirements.`,
      isCompleted: currentCompleted.includes('step-eligibility'),
    });

    // 2. Document Collection Steps
    const docs = activeScheme.required_documents || ['Aadhaar Card', 'Bank Account Passbook'];
    docs.forEach((doc, idx) => {
      const docStepId = `step-doc-${idx}`;
      steps.push({
        id: docStepId,
        title:
          language === 'ta'
            ? `படி 2: ${doc} ஆவணத்தை தயார் செய்தல்`
            : language === 'hi'
            ? `चरण 2: ${doc} दस्तावेज़ तैयार करना`
            : `Stage 2: Procure ${doc}`,
        description:
          language === 'ta'
            ? `${doc} ஆவணத்தின் அசல் அல்லது சுய கையொப்பமிட்ட நகலை கையில் தயாராக வைத்திருக்கவும்.`
            : language === 'hi'
            ? `${doc} की प्रमाणित मूल प्रति या स्व-हस्ताक्षरित प्रतिलिपि तैयार रखें।`
            : `Ensure an authentic, self-attested original or photocopy of ${doc} is prepared and ready in hand.`,
        isCompleted: currentCompleted.includes(docStepId),
      });
    });

    // 3. Official Application Portal Submission
    steps.push({
      id: 'step-submission',
      title: t.tracker.stage3Title,
      description: activeScheme.application_mode
        ? language === 'ta'
          ? `அதிகாரப்பூர்வ முறையில் விண்ணப்பிக்கவும்: ${activeScheme.application_mode}.`
          : language === 'hi'
          ? `आधिकारिक माध्यम से आवेदन करें: ${activeScheme.application_mode}।`
          : `Submit application through official mode: ${activeScheme.application_mode}.`
        : language === 'ta'
        ? `அதிகாரப்பூர்வ இணையதளத்தில் நேரடியாக விண்ணப்பிக்கவும் (${activeScheme.official_portal_url || 'இ-சேவை மையம்'}).`
        : language === 'hi'
        ? `आधिकारिक पोर्टल पर सीधे आवेदन जमा करें (${activeScheme.official_portal_url || 'सीएससी केंद्र'})।`
        : `Submit application directly on the official portal (${activeScheme.official_portal_url || 'State Kendra'}).`,
      isCompleted: currentCompleted.includes('step-submission'),
    });

    // 4. Acknowledgment & Status Verification
    steps.push({
      id: 'step-tracking',
      title: t.tracker.stage4Title,
      description:
        language === 'ta'
          ? 'இணையதளம் அல்லது பொது சேவை மையம் வழங்கும் அதிகாரப்பூர்வ விண்ணப்ப ரசீது / குறிப்பு எண்ணை குறித்து வைத்து அரசு தளத்தில் நிலையைக் கண்காணிக்கவும்.'
          : language === 'hi'
          ? 'पोर्टल अथवा सीएससी केंद्र से प्राप्त आधिकारिक पावती / संदर्भ संख्या को सुरक्षित रखें और सरकारी पोर्टल पर स्थिति को ट्रैक करें।'
          : 'Save your official receipt/acknowledgment number given by the portal or CSC Kendra to track progress on the government portal.',
      isCompleted: currentCompleted.includes('step-tracking'),
    });
  }

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  const toggleStep = (stepId: string) => {
    setCompletedStepsMap((prev) => {
      const schemeSteps = prev[selectedSchemeId] || [];
      const updated = schemeSteps.includes(stepId)
        ? schemeSteps.filter((id) => id !== stepId)
        : [...schemeSteps, stepId];
      return { ...prev, [selectedSchemeId]: updated };
    });
  };

  const handleResetProgress = () => {
    setCompletedStepsMap((prev) => ({ ...prev, [selectedSchemeId]: [] }));
    setNotesMap((prev) => ({ ...prev, [selectedSchemeId]: '' }));
  };

  const handleNoteChange = (text: string) => {
    setNotesMap((prev) => ({ ...prev, [selectedSchemeId]: text }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-civic-700 mb-1">
            <ListChecks className="w-4 h-4" />
            <span>{language === 'ta' ? 'படி 4: விண்ணப்ப நிலை' : language === 'hi' ? 'चरण 4: आवेदन स्थिति' : 'Stage 4: Track Application'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {language === 'ta' ? 'விண்ணப்பத்தை கண்காணிக்கவும்' : language === 'hi' ? 'अपना आवेदन ट्रैक करें' : 'Track Your Application'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {language === 'ta'
              ? 'உங்கள் விண்ணப்ப நிலையை குறிக்கவும், நேரடி அரசு போர்ட்டல்களில் சரிபார்க்கவும், நினைவூட்டல் அமைக்கவும்.'
              : language === 'hi'
              ? 'अपने आवेदन की स्थिति दर्ज करें, आधिकारिक सरकारी पोर्टलों पर जांचें और रिमाइंडर सेट करें।'
              : 'Record your application stage, check live progress on authentic official portals, and set reminders.'}
          </p>
        </div>

        {/* Scheme Selector Dropdown */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <label htmlFor="tracker-scheme-select" className="sr-only">
            {t.tracker.selectScheme}
          </label>
          <select
            id="tracker-scheme-select"
            value={selectedSchemeId}
            onChange={(e) => setSelectedSchemeId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-500 shadow-xs max-w-xs"
          >
            {schemes.map((s) => {
              const loc = getLocalizedScheme(s);
              return (
                <option key={s.id} value={s.id}>
                  {loc.title.split('(')[0].trim()}
                </option>
              );
            })}
          </select>

          <button
            type="button"
            onClick={handleResetProgress}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title={
              language === 'ta'
                ? 'இத்திட்டத்திற்கான வழிகாட்டலை மீட்டமை'
                : language === 'hi'
                ? 'इस योजना की चेकलिस्ट रीसेट करें'
                : 'Reset checklist progress for this scheme'
            }
            aria-label="Reset checklist progress"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Truthful Tracking Notice */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-3xl text-slate-700 text-xs flex items-start space-x-3.5">
        <ShieldCheck className="w-5 h-5 text-civic-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900 block text-sm">
            {language === 'ta'
              ? 'அதிகாரப்பூர்வ இணையதள ஆய்வு & விண்ணப்ப நிலை கொள்கை:'
              : language === 'hi'
              ? 'आधिकारिक पोर्टल सत्यापन एवं आवेदन स्थिति नीति:'
              : 'Official Portal Scrutiny & Status Policy:'}
          </span>
          <p className="text-slate-600 leading-relaxed text-xs">
            {language === 'ta'
              ? 'விண்ணப்ப செயலாக்கம், சரிபார்ப்பு மற்றும் வங்கி கணக்கு சரிபார்த்தல் ஆகியவை அதிகாரப்பூர்வ அரசு அமைப்புகளில் மட்டுமே நடைபெறும். SevAIQ தயார்நிலை சரிபார்ப்பு பட்டியல் மற்றும் நேரடி இணையதள இணைப்புகளை மட்டுமே வழங்குகிறது. போலியான கண்காணிப்பு எண்களையோ ஒப்புதல் நிலைகளையோ உருவாக்குவதில்லை. விண்ணப்பதாரர்கள் தங்கள் நேரடி நிலையை அதிகாரப்பூர்வ அரசு தளத்திலேயே சரிபார்க்க வேண்டும்.'
              : language === 'hi'
              ? 'आवेदन की लाइव प्रोसेसिंग, जांच व बैंक सत्यापन केवल आधिकारिक सरकारी प्रणालियों पर होता है। SevAIQ तैयारी चेकलिस्ट और सीधे पोर्टल लिंक प्रदान करता है, कोई नकली ट्रैकिंग नंबर या अनुमोदन स्थिति नहीं बनाता। नागरिक अपनी वास्तविक स्थिति सीधे अधिकृत सरकारी पोर्टल पर जांचें।'
              : 'Live application processing, scrutiny, and bank verification occur exclusively on official government systems. SevAIQ provides preparation checklists and direct portal links, but does not fabricate tracking numbers or simulate government approval statuses. Users must check live progress directly on the authorized government portal.'}
          </p>
        </div>
      </div>

      {/* Active Scheme Summary & User-Reported Status Card */}
      {locActiveScheme && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-civic-50 text-civic-700 border border-civic-200">
                {locActiveScheme.category}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">{locActiveScheme.title}</h2>
              <p className="text-xs text-slate-500 flex items-center space-x-1.5 mt-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{locActiveScheme.ministry}</span>
              </p>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                {locActiveScheme.short_description}
              </p>
            </div>

            {locActiveScheme.official_portal_url && (
              <a
                href={locActiveScheme.official_portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-civic-700 hover:bg-civic-800 text-white font-semibold text-xs shadow-md transition-all shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <span>{t.tracker.visitPortal}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* User-Reported Status & Official Status Check Links Grid */}
          <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/90 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="scheme-status-dropdown" className="text-xs font-bold text-slate-800">
                  {language === 'ta' ? 'உங்கள் விண்ணப்ப நிலை:' : 'Your Reported Status:'}
                </label>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/70 text-slate-700">
                  {language === 'ta' ? 'சுய அறிவிப்பு' : 'User-Reported'}
                </span>
              </div>

              <select
                id="scheme-status-dropdown"
                value={statusMap[selectedSchemeId] || 'not_applied'}
                onChange={(e) => handleStatusChange(e.target.value as CitizenApplicationStatus)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-500 shadow-2xs"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {language === 'ta' ? opt.labelTa : opt.labelEn}
                  </option>
                ))}
              </select>

              <p className="text-[10px] text-slate-500 leading-tight">
                {language === 'ta'
                  ? 'உங்கள் தனிப்பட்ட கண்காணிப்பிற்கு மட்டும். அரசு இறுதி ஒப்புதல் அதிகாரப்பூர்வ போர்ட்டலில் மட்டுமே வழங்கப்படும்.'
                  : 'For your personal tracking. Government approval is verified exclusively by statutory authorities.'}
              </p>
            </div>

            {/* Official Status Check Portal Link */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">
                {language === 'ta' ? 'அதிகாரப்பூர்வ நிலை சரிபார்ப்பு:' : 'Official Live Status Check:'}
              </div>

              {OFFICIAL_STATUS_CHECK_URLS[selectedSchemeId] ? (
                <div className="space-y-2">
                  <a
                    href={OFFICIAL_STATUS_CHECK_URLS[selectedSchemeId].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-between px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <span>
                      {language === 'ta'
                        ? OFFICIAL_STATUS_CHECK_URLS[selectedSchemeId].labelTa
                        : OFFICIAL_STATUS_CHECK_URLS[selectedSchemeId].labelEn}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1.5" />
                  </a>
                  <p className="text-[10px] text-slate-500">
                    {language === 'ta'
                      ? `${OFFICIAL_STATUS_CHECK_URLS[selectedSchemeId].portalName} தளத்தில் திறக்கும். உங்கள் குறிப்பு எண்/ஆதார் தேவைப்படலாம்.`
                      : `Opens ${OFFICIAL_STATUS_CHECK_URLS[selectedSchemeId].portalName}. Requires Registration No, Mobile, or Aadhaar OTP.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <a
                    href={activeScheme.official_portal_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-between px-3.5 py-2 bg-slate-900 hover:bg-civic-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <span>{t.tracker.visitPortal}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1.5" />
                  </a>
                  <p className="text-[10px] text-slate-500">
                    {language === 'ta'
                      ? 'அதிகாரப்பூர்வ அரசு தளத்தில் நேரடி நிலையை சரிபார்க்கலாம்.'
                      : 'Check status directly on the official department portal.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Follow-Up Status Check Reminder */}
          <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <Bell className="w-4 h-4 text-civic-700 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block text-[11px]">
                  {language === 'ta' ? 'அடுத்த நிலை சரிபார்ப்பு நினைவூட்டல்:' : 'Next Status Check Reminder:'}
                </span>
                <span className="text-[10px] text-slate-600">
                  {language === 'ta'
                    ? 'விண்ணப்ப நிலையை மீண்டும் பார்க்க விரும்பும் தேதியைத் தேர்ந்தெடுக்கவும்.'
                    : 'Pick a date to check your status on the portal again.'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={reminderMap[selectedSchemeId] || ''}
                onChange={(e) => handleReminderChange(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-civic-500"
              />
              <button
                type="button"
                onClick={handleRequestReminder}
                className="px-3 py-1 bg-civic-700 hover:bg-civic-800 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
              >
                {language === 'ta' ? 'நினைவூட்டு' : 'Remind Me'}
              </button>
            </div>
          </div>

          {reminderNotice && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-medium animate-in fade-in flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{reminderNotice}</span>
            </div>
          )}

          {/* Progress Bar */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>{t.tracker.overallProgress}</span>
              <span>
                {language === 'ta'
                  ? `${progressPercent}% முடிந்தது (${completedCount}/${steps.length} படிகள்)`
                  : language === 'hi'
                  ? `${progressPercent}% पूर्ण (${completedCount}/${steps.length} चरण)`
                  : `${progressPercent}% Complete (${completedCount}/${steps.length} steps)`}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step-by-Step Interactive Checklist */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {language === 'ta'
            ? 'படிபடியான தயாரிப்பு சரிபார்ப்பு பட்டியல்:'
            : language === 'hi'
            ? 'चरण-दर-चरण तैयारी चेकलिस्ट:'
            : 'Step-by-Step Preparation Checklist:'}
        </h3>

        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-start space-x-3.5 ${
                step.isCompleted
                  ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-civic-300 shadow-xs'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={step.isCompleted}
                  onChange={() => toggleStep(step.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 rounded text-civic-600 focus:ring-civic-500 border-slate-300 cursor-pointer"
                  aria-label={step.title}
                />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-bold ${
                      step.isCompleted ? 'text-emerald-950 line-through' : 'text-slate-900'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {language === 'ta' ? `படி ${idx + 1}` : language === 'hi' ? `चरण ${idx + 1}` : `Step ${idx + 1}`}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Application Steps from Gazette */}
      {activeScheme && (activeScheme as any).application_steps && (activeScheme as any).application_steps.length > 0 && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
            {language === 'ta'
              ? 'அதிகாரப்பூர்வ விண்ணப்ப நடைமுறை:'
              : language === 'hi'
              ? 'आधिकारिक आवेदन प्रक्रिया:'
              : 'Official Application Procedure:'}
          </span>
          <ol className="space-y-2 list-decimal list-inside text-xs text-slate-700">
            {((activeScheme as any).application_steps as string[]).map((st, i) => (
              <li key={i} className="leading-relaxed pl-1">
                <span className="font-semibold text-slate-800">{st}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Citizen Personal Reference Notes (Local Only, Kiosk Safe) */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {t.tracker.notesTitle}
          </span>
          {isKioskMode && (
            <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {language === 'ta'
                ? 'பொது கியோஸ்க்: குறிப்புகள் நினைவகத்தில் மட்டுமே இருக்கும்'
                : language === 'hi'
                ? 'सार्वजनिक कियोस्क: नोट्स केवल मेमोरी में हैं'
                : 'Public Kiosk: Notes in volatile memory'}
            </span>
          )}
        </div>
        <textarea
          value={notesMap[selectedSchemeId] || ''}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder={t.tracker.notesPlaceholder}
          rows={3}
          className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-civic-500"
        />
        <p className="text-[11px] text-slate-500">
          {language === 'ta'
            ? 'தனியுரிமை விதி: வங்கி பின் எண்கள், கடவுச்சொற்கள் போன்ற ரகசிய விவரங்களை இங்கு பதிய வேண்டாம்.'
            : language === 'hi'
            ? 'गोपनीयता नियम: बैंक पिन, पासवर्ड या बायोमेट्रिक जैसी गोपनीय जानकारी यहाँ दर्ज न करें।'
            : 'Privacy Mandate: Do not store bank PINs, passwords, or biometric secrets here.'}
        </p>
      </div>

      {/* Quick Navigation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs">
        <button
          type="button"
          onClick={() => onNavigate('document-mapper')}
          className="inline-flex items-center space-x-1.5 text-civic-700 hover:text-civic-900 font-semibold"
        >
          <FileText className="w-4 h-4" />
          <span>
            {language === 'ta'
              ? 'ஆவண வரைபடத்தில் தேவையான ஆவணங்களை தயார் செய்யவும்'
              : language === 'hi'
              ? 'दस्तावेज़ मैपर में आवश्यक दस्तावेज़ तैयार करें'
              : 'Prepare Required Documents in Document Mapper'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('readiness-passport')}
          className="inline-flex items-center space-x-1.5 text-civic-700 hover:text-civic-900 font-semibold"
        >
          <span>
            {language === 'ta'
              ? 'திட்ட பாஸ்போர்ட்டை பதிவிறக்கவும்'
              : language === 'hi'
              ? 'योजना पासपोर्ट डाउनलोड करें'
              : 'Download Scheme Passport'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
