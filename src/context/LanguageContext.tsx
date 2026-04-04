import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Load ALL translations synchronously — they're bundled and available instantly
import enTranslations from '@/locales/en.json';
import deTranslations from '@/locales/de.json';
import frTranslations from '@/locales/fr.json';
import fiTranslations from '@/locales/fi.json';

// Active: EN, DE, FR, FI | Reserved for future: IT, ES
export type Language = 'en' | 'de' | 'fr' | 'fi';

type Translations = Record<string, any>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: Translations;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'xyreg_language';

// Pre-loaded translation map — instant switching, no network requests
const TRANSLATIONS_MAP: Record<Language, Translations> = {
  en: enTranslations,
  de: deTranslations,
  fr: frTranslations,
  fi: fiTranslations,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'en' || stored === 'de' || stored === 'fr' || stored === 'fi') {
      return stored;
    }
    return 'en';
  });

  // Initialize with the stored language's translations immediately
  const [translations, setTranslations] = useState<Translations>(
    TRANSLATIONS_MAP[language] || enTranslations
  );

  // Switch translations instantly when language changes
  useEffect(() => {
    setTranslations(TRANSLATIONS_MAP[language] || enTranslations);
  }, [language]);

  // Persist language to localStorage
  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations, isLoading: false }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    console.info('[useLanguage] Context not available, returning safe defaults');
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      translations: enTranslations,
      isLoading: false
    };
  }
  return context;
}
