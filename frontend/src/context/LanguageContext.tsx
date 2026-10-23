import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  AppLanguage,
  UI_TRANSLATIONS,
  SCHEME_TRANSLATIONS,
  DOCUMENT_TRANSLATIONS,
  LOCALIZED_OPTIONS,
} from '../i18n/translations';
import { Scheme, DocumentRecord } from '../types';

// Types for localized entities are handled via translations mapping

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  t: typeof UI_TRANSLATIONS['en'];
  getLocalizedScheme: (scheme: Scheme) => Scheme;
  getLocalizedDocument: (doc: DocumentRecord) => DocumentRecord;
  getLocalizedOption: (
    type: 'genders' | 'areas' | 'incomes' | 'categories' | 'landholdings' | 'occupations' | 'categoryFilters',
    value: string
  ) => string;
}

const STORAGE_KEY = 'SEVAIQ_APP_LANGUAGE';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ta' || saved === 'en' || saved === 'hi') return saved;
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguageState((prev: AppLanguage) => {
      const next: AppLanguage = prev === 'en' ? 'ta' : prev === 'ta' ? 'hi' : 'en';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Sync document html lang attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = UI_TRANSLATIONS[language];

  // Helper to get localized scheme values
  const getLocalizedScheme = useMemo(() => {
    return (scheme: Scheme): Scheme => {
      if (language === 'en') return scheme;
      const langMap = (SCHEME_TRANSLATIONS as Record<string, Record<string, any>>)[language]?.[scheme.id];
      if (!langMap) return scheme;
      return {
        ...scheme,
        title: langMap.title || scheme.title,
        short_description: langMap.short_description || scheme.short_description,
        category: langMap.category || scheme.category,
        ministry: langMap.ministry || scheme.ministry,
        beneficiary_type: langMap.beneficiary_type || scheme.beneficiary_type,
        benefits_summary: langMap.benefits_summary || scheme.benefits_summary,
        detailed_benefits: langMap.detailed_benefits || scheme.detailed_benefits,
      };
    };
  }, [language]);

  // Helper to get localized document values
  const getLocalizedDocument = useMemo(() => {
    return (doc: DocumentRecord): DocumentRecord => {
      if (language === 'en') return doc;
      const langMap = (DOCUMENT_TRANSLATIONS as Record<string, Record<string, any>>)[language]?.[doc.id];
      if (!langMap) return doc;
      return {
        ...doc,
        name: langMap.name || doc.name,
        description: langMap.description || doc.description,
        issuingAuthority: langMap.issuingAuthority || doc.issuingAuthority,
      };
    };
  }, [language]);

  // Helper to get localized options for select/dropdown fields
  const getLocalizedOption = useMemo(() => {
    return (
      type: 'genders' | 'areas' | 'incomes' | 'categories' | 'landholdings' | 'occupations' | 'categoryFilters',
      value: string
    ): string => {
      const typeOptions = LOCALIZED_OPTIONS[type];
      if (!typeOptions) return value;
      const langOptions = typeOptions[language] as Record<string, string>;
      return langOptions && langOptions[value] ? langOptions[value] : value;
    };
  }, [language]);

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      getLocalizedScheme,
      getLocalizedDocument,
      getLocalizedOption,
    }),
    [language, t, getLocalizedScheme, getLocalizedDocument, getLocalizedOption]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: UI_TRANSLATIONS['en'],
      getLocalizedScheme: (scheme) => scheme,
      getLocalizedDocument: (doc) => doc,
      getLocalizedOption: (_type, value) => value,
    };
  }
  return context;
}
