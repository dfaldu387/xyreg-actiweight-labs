import { useLanguage } from '@/context/LanguageContext';

/**
 * Hook to access translations
 * @param key - Translation key in dot notation (e.g., "gantt.taskName")
 * @param variables - Optional object with variables to interpolate (e.g., { count: 5, name: "Test" })
 * @returns Translated string with variables replaced
 */
export function useTranslation() {
  const { translations, isLoading } = useLanguage();

  const lang = (key: string, variables?: Record<string, string | number>): string => {
    // Even during loading, we have effectiveTranslations from LanguageContext
    // which provides previous translations for smooth UX
    if (!translations) {
      return key;
    }

    // Navigate through nested object using dot notation
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Key not found - return key
        return key;
      }
    }

    let result = typeof value === 'string' ? value : key;

    // Interpolate variables if provided
    if (variables && typeof result === 'string') {
      Object.entries(variables).forEach(([varName, varValue]) => {
        result = result.replace(new RegExp(`{{${varName}}}`, 'g'), String(varValue));
      });
    }

    return result;
  };

  return { lang, isLoading };
}

