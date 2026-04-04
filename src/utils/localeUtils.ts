/**
 * Utility functions for locale detection and currency mapping
 */

export interface LocaleCurrency {
  locale: string;
  currency: string;
  symbol: string;
}

// Comprehensive locale to currency mapping
const LOCALE_CURRENCY_MAP: Record<string, LocaleCurrency> = {
  'en-US': { locale: 'en-US', currency: 'USD', symbol: '$' },
  'en-GB': { locale: 'en-GB', currency: 'GBP', symbol: '£' },
  'en-CA': { locale: 'en-CA', currency: 'CAD', symbol: 'C$' },
  'en-AU': { locale: 'en-AU', currency: 'AUD', symbol: 'A$' },
  'en-NZ': { locale: 'en-NZ', currency: 'NZD', symbol: 'NZ$' },
  
  // Europe
  'de-DE': { locale: 'de-DE', currency: 'EUR', symbol: '€' },
  'de-AT': { locale: 'de-AT', currency: 'EUR', symbol: '€' },
  'de-CH': { locale: 'de-CH', currency: 'CHF', symbol: 'CHF' },
  'fr-FR': { locale: 'fr-FR', currency: 'EUR', symbol: '€' },
  'fr-BE': { locale: 'fr-BE', currency: 'EUR', symbol: '€' },
  'fr-CH': { locale: 'fr-CH', currency: 'CHF', symbol: 'CHF' },
  'es-ES': { locale: 'es-ES', currency: 'EUR', symbol: '€' },
  'it-IT': { locale: 'it-IT', currency: 'EUR', symbol: '€' },
  'nl-NL': { locale: 'nl-NL', currency: 'EUR', symbol: '€' },
  'pt-PT': { locale: 'pt-PT', currency: 'EUR', symbol: '€' },
  'pl-PL': { locale: 'pl-PL', currency: 'PLN', symbol: 'zł' },
  
  // Nordics
  'sv-SE': { locale: 'sv-SE', currency: 'SEK', symbol: 'kr' },
  'nb-NO': { locale: 'nb-NO', currency: 'NOK', symbol: 'kr' },
  'da-DK': { locale: 'da-DK', currency: 'DKK', symbol: 'kr' },
  'is-IS': { locale: 'is-IS', currency: 'ISK', symbol: 'kr' },
  
  // Asia
  'ja-JP': { locale: 'ja-JP', currency: 'JPY', symbol: '¥' },
  'zh-CN': { locale: 'zh-CN', currency: 'CNY', symbol: '¥' },
  'ko-KR': { locale: 'ko-KR', currency: 'KRW', symbol: '₩' },
  'th-TH': { locale: 'th-TH', currency: 'THB', symbol: '฿' },
  'hi-IN': { locale: 'hi-IN', currency: 'INR', symbol: '₹' },
  
  // South America
  'pt-BR': { locale: 'pt-BR', currency: 'BRL', symbol: 'R$' },
  'es-MX': { locale: 'es-MX', currency: 'MXN', symbol: '$' },
  
  // Default fallback
  'default': { locale: 'en-US', currency: 'EUR', symbol: '€' },
};

/**
 * Detects the user's locale and maps it to a currency
 */
export function detectUserLocaleCurrency(): LocaleCurrency {
  try {
    // Try to get locale from browser
    const userLocale = navigator.language || 
                       (navigator as any).userLanguage || 
                       'en-US';
    
    // Direct match
    if (LOCALE_CURRENCY_MAP[userLocale]) {
      return LOCALE_CURRENCY_MAP[userLocale];
    }
    
    // Try base language (e.g., 'en' from 'en-US')
    const baseLocale = userLocale.split('-')[0];
    const matchingLocale = Object.keys(LOCALE_CURRENCY_MAP).find(
      key => key.startsWith(baseLocale)
    );
    
    if (matchingLocale) {
      return LOCALE_CURRENCY_MAP[matchingLocale];
    }
    
    // Default to EUR
    return LOCALE_CURRENCY_MAP['default'];
  } catch (error) {
    console.error('Error detecting locale:', error);
    return LOCALE_CURRENCY_MAP['default'];
  }
}

/**
 * Gets currency for a specific locale string
 */
export function getCurrencyForLocale(locale: string): LocaleCurrency {
  return LOCALE_CURRENCY_MAP[locale] || LOCALE_CURRENCY_MAP['default'];
}

/**
 * Format a price in the user's local currency
 */
export function formatLocalPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    // Fallback if Intl fails
    const symbols: Record<string, string> = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'CAD': 'C$',
      'AUD': 'A$', 'JPY': '¥', 'BRL': 'R$', 'CHF': 'CHF',
      'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr',
    };
    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toFixed(0)}`;
  }
}
