import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { UI_TRANSLATIONS, SCHEME_TRANSLATIONS, DOCUMENT_TRANSLATIONS, LOCALIZED_OPTIONS } from '../i18n/translations';
import { VERIFIED_REFERENCE_SCHEMES, INITIAL_DOCUMENT_RECORDS } from '../data/verifiedReferenceSchemes';
import { MemoryStorage } from '../utils/kioskStorage';

describe('LanguageContext and Complete Trilingual Support (English, Tamil & Hindi)', () => {
  beforeEach(() => {
    (globalThis as any).localStorage = new MemoryStorage();
    if (typeof document === 'undefined') {
      (globalThis as any).document = {
        documentElement: { lang: 'en' },
      };
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders default English translations in component tree', () => {
    const Consumer = () => {
      const { language, t } = useLanguage();
      return (
        <div>
          <span data-testid="lang">{language}</span>
          <span data-testid="title">{t.header.schemes}</span>
        </div>
      );
    };

    const html = renderToString(
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>
    );

    expect(html).toContain('en');
    expect(html).toContain(UI_TRANSLATIONS.en.header.schemes);
  });

  it('provides comprehensive Tamil translations in UI_TRANSLATIONS dictionary', () => {
    expect(UI_TRANSLATIONS.ta.header.schemes).toBe('திட்டங்கள்');
    expect(UI_TRANSLATIONS.ta.header.documents).toBe('ஆவணங்கள்');
    expect(UI_TRANSLATIONS.ta.header.dashboard).toBe('முகப்பு');
    expect(UI_TRANSLATIONS.ta.footer.rights).toContain('குடிமக்களை வலுப்படுத்துதல்');
  });

  it('provides comprehensive Hindi translations in UI_TRANSLATIONS dictionary', () => {
    expect(UI_TRANSLATIONS.hi.header.schemes).toBe('योजनाएं');
    expect(UI_TRANSLATIONS.hi.header.documents).toBe('दस्तावेज');
    expect(UI_TRANSLATIONS.hi.header.dashboard).toBe('डैशबोर्ड');
    expect(UI_TRANSLATIONS.hi.footer.rights).toContain('सशक्तिकरण');
  });

  it('localizes scheme details accurately when language is Tamil', () => {
    const pmKisan = VERIFIED_REFERENCE_SCHEMES.find((s) => s.id === 'pm-kisan')!;
    expect(pmKisan).toBeDefined();

    const taTranslation = SCHEME_TRANSLATIONS.ta['pm-kisan'];
    expect(taTranslation).toBeDefined();
    expect(taTranslation.title).toBe('பிரதான் மந்திரி கிசான் சம்மான் நிதி (PM-KISAN)');
    expect(taTranslation.category).toBe('வேளாண்மை & கிராமப்புறம்');
    expect(taTranslation.ministry).toContain('அமைச்சகம்');
    expect(taTranslation.benefits_summary).toContain('₹6,000');
  });

  it('localizes scheme details accurately when language is Hindi', () => {
    const pmKisan = VERIFIED_REFERENCE_SCHEMES.find((s) => s.id === 'pm-kisan')!;
    expect(pmKisan).toBeDefined();

    const hiTranslation = SCHEME_TRANSLATIONS.hi['pm-kisan'];
    expect(hiTranslation).toBeDefined();
    expect(hiTranslation.title).toBe('प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)');
    expect(hiTranslation.category).toBe('कृषि एवं ग्रामीण विकास');
    expect(hiTranslation.ministry).toContain('कृषि एवं किसान कल्याण मंत्रालय');
    expect(hiTranslation.benefits_summary).toContain('₹6,000');
  });

  it('localizes document names and issuing authorities accurately in Tamil', () => {
    const aadhaar = INITIAL_DOCUMENT_RECORDS.find((d) => d.id === 'aadhaar-card')!;
    expect(aadhaar).toBeDefined();

    const taDoc = DOCUMENT_TRANSLATIONS.ta['aadhaar-card'];
    expect(taDoc).toBeDefined();
    expect(taDoc.name).toBe('ஆதார் அட்டை');
    expect(taDoc.issuingAuthority).toBe('இந்திய தனித்துவ அடையாள ஆணையம் (UIDAI)');
  });

  it('localizes document names and issuing authorities accurately in Hindi', () => {
    const aadhaar = INITIAL_DOCUMENT_RECORDS.find((d) => d.id === 'aadhaar-card')!;
    expect(aadhaar).toBeDefined();

    const hiDoc = DOCUMENT_TRANSLATIONS.hi['aadhaar-card'];
    expect(hiDoc).toBeDefined();
    expect(hiDoc.name).toBe('आधार कार्ड (Aadhaar Card)');
    expect(hiDoc.issuingAuthority).toBe('भारतीय विशिष्ट पहचान प्राधिकरण (UIDAI)');
  });

  it('localizes demographic form dropdown options in Tamil and Hindi', () => {
    // Tamil
    expect(LOCALIZED_OPTIONS.genders.ta['Female']).toContain('பெண்');
    expect(LOCALIZED_OPTIONS.areas.ta['Rural']).toContain('கிராமப்புறம்');
    expect(LOCALIZED_OPTIONS.occupations.ta['Farmer / Cultivator']).toContain('விவசாயி');
    expect(LOCALIZED_OPTIONS.incomes.ta['< 1 Lakh']).toContain('₹1 லட்சத்திற்கும் குறைவு');
    expect(LOCALIZED_OPTIONS.categories.ta['SC']).toContain('ஆதிதிராவிடர்');
    expect(LOCALIZED_OPTIONS.landholdings.ta['Marginal (< 1 ha)']).toContain('குறு விவசாயி');

    // Hindi
    expect(LOCALIZED_OPTIONS.genders.hi['Female']).toContain('महिला');
    expect(LOCALIZED_OPTIONS.areas.hi['Rural']).toContain('ग्रामीण');
    expect(LOCALIZED_OPTIONS.occupations.hi['Farmer / Cultivator']).toContain('किसान');
    expect(LOCALIZED_OPTIONS.incomes.hi['< 1 Lakh']).toContain('₹1 लाख से कम');
    expect(LOCALIZED_OPTIONS.categories.hi['SC']).toContain('अनुसूचित जाति');
    expect(LOCALIZED_OPTIONS.landholdings.hi['Marginal (< 1 ha)']).toContain('सीमांत');
  });

  it('returns default fallback values when hook is rendered outside provider', () => {
    const FallbackConsumer = () => {
      const { language, t } = useLanguage();
      const combined = `${language}:${t.header.schemes}`;
      return <div>{combined}</div>;
    };

    const html = renderToString(<FallbackConsumer />);
    expect(html).toContain('en:Schemes');
  });
});
