import React, { useState, useEffect } from 'react';
import {
  ListChecks,
  ExternalLink,
  ShieldCheck,
  Building,
  ArrowRight,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { Scheme, NavigationTab } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ApplicationTrackerProps {
  schemes: Scheme[];
  initialSchemeId?: string;
  onNavigate: (tab: NavigationTab) => void;
  isKioskMode: boolean;
}

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
          : `Review verified eligibility rules for ${activeScheme.title}. Ensure citizen meets age, income, and occupational requirements.`,
      isCompleted: currentCompleted.includes('step-eligibility'),
    });

    // 2. Document Collection Steps
    const docs = activeScheme.required_documents || ['Aadhaar Card', 'Bank Account Passbook'];
    docs.forEach((doc, idx) => {
      const docStepId = `step-doc-${idx}`;
      steps.push({
        id: docStepId,
        title: language === 'ta' ? `படி 2: ${doc} ஆவணத்தை தயார் செய்தல்` : `Stage 2: Procure ${doc}`,
        description:
          language === 'ta'
            ? `${doc} ஆவணத்தின் அசல் அல்லது சுய கையொப்பமிட்ட நகலை கையில் தயாராக வைத்திருக்கவும்.`
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
          : `Submit application through official mode: ${activeScheme.application_mode}.`
        : language === 'ta'
        ? `அதிகாரப்பூர்வ இணையதளத்தில் நேரடியாக விண்ணப்பிக்கவும் (${activeScheme.official_portal_url || 'இ-சேவை மையம்'}).`
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
            <span>{t.tracker.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t.tracker.title}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t.tracker.subtitle}
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
            title={language === 'ta' ? 'இத்திட்டத்திற்கான வழிகாட்டலை மீட்டமை' : 'Reset checklist progress for this scheme'}
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
              : 'Official Portal Scrutiny & Status Policy:'}
          </span>
          <p className="text-slate-600 leading-relaxed text-xs">
            {language === 'ta'
              ? 'விண்ணப்ப செயலாக்கம், சரிபார்ப்பு மற்றும் வங்கி கணக்கு சரிபார்த்தல் ஆகியவை அதிகாரப்பூர்வ அரசு அமைப்புகளில் மட்டுமே நடைபெறும். SevAIQ தயார்நிலை சரிபார்ப்பு பட்டியல் மற்றும் நேரடி இணையதள இணைப்புகளை மட்டுமே வழங்குகிறது. போலியான கண்காணிப்பு எண்களையோ ஒப்புதல் நிலைகளையோ உருவாக்குவதில்லை. விண்ணப்பதாரர்கள் தங்கள் நேரடி நிலையை அதிகாரப்பூர்வ அரசு தளத்திலேயே சரிபார்க்க வேண்டும்.'
              : 'Live application processing, scrutiny, and bank verification occur exclusively on official government systems. SevAIQ provides preparation checklists and direct portal links, but does not fabricate tracking numbers or simulate government approval statuses. Users must check live progress directly on the authorized government portal.'}
          </p>
        </div>
      </div>

      {/* Active Scheme Summary Card */}
      {locActiveScheme && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
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
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-civic-700 hover:bg-civic-800 text-white font-semibold text-xs shadow-md transition-all shrink-0 self-start sm:self-auto"
              >
                <span>{t.tracker.visitPortal}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Progress Bar */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>{t.tracker.overallProgress}</span>
              <span>
                {language === 'ta'
                  ? `${progressPercent}% முடிந்தது (${completedCount}/${steps.length} படிகள்)`
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
          {language === 'ta' ? 'படிபடியான தயாரிப்பு சரிபார்ப்பு பட்டியல்:' : 'Step-by-Step Preparation Checklist:'}
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
                    {language === 'ta' ? `படி ${idx + 1}` : `Step ${idx + 1}`}
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
            {language === 'ta' ? 'அதிகாரப்பூர்வ விண்ணப்ப நடைமுறை:' : 'Official Application Procedure:'}
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
              {language === 'ta' ? 'பொது கியோஸ்க்: குறிப்புகள் நினைவகத்தில் மட்டுமே இருக்கும்' : 'Public Kiosk: Notes in volatile memory'}
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
              : 'Prepare Required Documents in Document Mapper'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('readiness-passport')}
          className="inline-flex items-center space-x-1.5 text-civic-700 hover:text-civic-900 font-semibold"
        >
          <span>{language === 'ta' ? 'திட்ட பாஸ்போர்ட்டை பதிவிறக்கவும்' : 'Download Scheme Passport'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
