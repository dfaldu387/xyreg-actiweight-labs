interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
}

interface CurrencyConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  exchangeRate: number;
  lastUpdated: Date;
}

export class CurrencyService {
  private static exchangeRates: Map<string, ExchangeRate> = new Map();
  
  // Fallback exchange rates - EUR as base currency (updated Nov 2025)
  private static fallbackRates: Record<string, Record<string, number>> = {
    // EUR to other currencies
    EUR: { 
      USD: 1.09, GBP: 0.83, CAD: 1.47, AUD: 1.65, BRL: 6.15, JPY: 162.0,
      CHF: 0.94, SEK: 11.45, NOK: 11.75, DKK: 7.46, ISK: 150.0,
      PLN: 4.35, CZK: 25.15, HUF: 390.0, RON: 4.97,
      CNY: 7.85, INR: 91.5, KRW: 1450.0, THB: 38.5,
      MXN: 22.0, ZAR: 19.8, SGD: 1.46, HKD: 8.50, NZD: 1.78, RUB: 100.0
    },
    // Other currencies to EUR
    USD: { EUR: 0.92 },
    GBP: { EUR: 1.20 },
    CAD: { EUR: 0.68 },
    AUD: { EUR: 0.61 },
    BRL: { EUR: 0.16 },
    JPY: { EUR: 0.0062 },
    CHF: { EUR: 1.06 },
    SEK: { EUR: 0.087 },
    NOK: { EUR: 0.085 },
    DKK: { EUR: 0.134 },
    ISK: { EUR: 0.0067 },
    PLN: { EUR: 0.23 },
    CZK: { EUR: 0.040 },
    HUF: { EUR: 0.0026 },
    RON: { EUR: 0.20 },
    CNY: { EUR: 0.127 },
    INR: { EUR: 0.011 },
    KRW: { EUR: 0.00069 },
    THB: { EUR: 0.026 },
    MXN: { EUR: 0.045 },
    ZAR: { EUR: 0.051 },
    SGD: { EUR: 0.68 },
    HKD: { EUR: 0.118 },
    NZD: { EUR: 0.56 },
    RUB: { EUR: 0.010 }
  };

  static async convertCurrency(
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<CurrencyConversionResult> {
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: amount,
        targetCurrency: toCurrency,
        exchangeRate: 1,
        lastUpdated: new Date()
      };
    }

    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate.rate;

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      targetCurrency: toCurrency,
      exchangeRate: rate.rate,
      lastUpdated: rate.lastUpdated
    };
  }

  private static async getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
    const key = `${from}-${to}`;
    const cached = this.exchangeRates.get(key);
    
    // Use cached rate if less than 24 hours old
    if (cached && (Date.now() - cached.lastUpdated.getTime()) < 24 * 60 * 60 * 1000) {
      return cached;
    }

    try {
      // In production, replace with real exchange rate API
      // For now, use fallback rates
      const rate = this.fallbackRates[from]?.[to] || 1;
      
      const exchangeRate: ExchangeRate = {
        from,
        to,
        rate,
        lastUpdated: new Date()
      };

      this.exchangeRates.set(key, exchangeRate);
      return exchangeRate;
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      
      // Return fallback rate
      const rate = this.fallbackRates[from]?.[to] || 1;
      return {
        from,
        to,
        rate,
        lastUpdated: new Date()
      };
    }
  }

  static getSupportedCurrencies(): string[] {
    return ['USD', 'EUR', 'CAD', 'AUD', 'BRL', 'JPY', 'GBP'];
  }

  static getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      CAD: 'C$',
      AUD: 'A$',
      BRL: 'R$',
      JPY: '¥',
      GBP: '£'
    };
    return symbols[currency] || currency;
  }

  static formatCurrency(amount: number, currency: string): string {
    const symbol = this.getCurrencySymbol(currency);
    
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(0)}K`;
    }
    return `${symbol}${amount.toLocaleString()}`;
  }
}