
// Market currency mapping utility
export interface MarketCurrency {
  code: string;
  symbol: string;
  name: string;
}

export const MARKET_CURRENCIES: Record<string, MarketCurrency> = {
  'EU': { code: 'EUR', symbol: '€', name: 'Euro' },
  'US': { code: 'USD', symbol: '$', name: 'US Dollar' },
  'USA': { code: 'USD', symbol: '$', name: 'US Dollar' },
  'CA': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  'AU': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  'JP': { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  'BR': { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  'CN': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  'IN': { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  'UK': { code: 'GBP', symbol: '£', name: 'British Pound' },
  'CH': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  'KR': { code: 'KRW', symbol: '₩', name: 'South Korean Won' }
};

export function getMarketCurrency(marketCode: string): MarketCurrency {
  return MARKET_CURRENCIES[marketCode] || { code: 'USD', symbol: '$', name: 'US Dollar' };
}

export function formatCurrency(amount: number, marketCode: string): string {
  const currency = getMarketCurrency(marketCode);
  return `${currency.symbol}${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)}`;
}
