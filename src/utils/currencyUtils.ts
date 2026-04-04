
// Currency utility functions
export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Record<string, Currency> = {
  'USD': { code: 'USD', symbol: '$', name: 'US Dollar' },
  'EUR': { code: 'EUR', symbol: '€', name: 'Euro' },
  'GBP': { code: 'GBP', symbol: '£', name: 'British Pound' },
  'CAD': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  'AUD': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  'JPY': { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  'BRL': { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  'CNY': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  'INR': { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  'CHF': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  'KRW': { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  // Nordic Currencies
  'ISK': { code: 'ISK', symbol: 'kr', name: 'Icelandic Krona' },
  'NOK': { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  'SEK': { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  'DKK': { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  // Other European Currencies
  'PLN': { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  'CZK': { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  'HUF': { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  'RON': { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  // Other Major Currencies
  'MXN': { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  'ZAR': { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  'SGD': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  'HKD': { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  'NZD': { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  'THB': { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  'RUB': { code: 'RUB', symbol: '₽', name: 'Russian Ruble' }
};

export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCIES[currencyCode]?.symbol || '$';
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)}`;
}

export function formatNumberWithCommas(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export function parseFormattedNumber(value: string): number {
  // Remove commas and parse as float
  const cleanValue = value.replace(/,/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}
