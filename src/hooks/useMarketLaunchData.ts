
import { useMemo } from 'react';
import { EnhancedProductMarket } from '@/utils/enhancedMarketRiskClassMapping';

interface MarketLaunchData {
  marketCode: string;
  marketName: string;
  launchDate: Date;
  color: string;
}

const MARKET_NAMES: Record<string, string> = {
  'EU': 'European Union',
  'US': 'United States',
  'USA': 'United States', 
  'CA': 'Canada',
  'AU': 'Australia',
  'JP': 'Japan',
  'BR': 'Brazil',
  'CN': 'China',
  'IN': 'India',
  'UK': 'United Kingdom',
  'CH': 'Switzerland',
  'KR': 'South Korea'
};

const MARKET_COLORS: Record<string, string> = {
  'EU': '#3b82f6',
  'US': '#ef4444', 
  'USA': '#ef4444',
  'CA': '#10b981',
  'AU': '#f59e0b',
  'JP': '#8b5cf6',
  'BR': '#06b6d4',
  'CN': '#ec4899',
  'IN': '#84cc16',
  'UK': '#6366f1',
  'CH': '#14b8a6',
  'KR': '#f97316'
};

export function useMarketLaunchData(productMarkets?: EnhancedProductMarket[]): MarketLaunchData[] {
  return useMemo(() => {
    if (!productMarkets || !Array.isArray(productMarkets)) return [];
    
    const launchData: MarketLaunchData[] = [];
    
    productMarkets.forEach((market: EnhancedProductMarket) => {
      // Check if market is selected and has a launch date
      if (market.selected && market.launchDate) {
        launchData.push({
          marketCode: market.code,
          marketName: market.name || MARKET_NAMES[market.code] || market.code,
          launchDate: new Date(market.launchDate),
          color: MARKET_COLORS[market.code] || '#6b7280'
        });
      }
    });
    
    // Sort by launch date
    return launchData.sort((a, b) => a.launchDate.getTime() - b.launchDate.getTime());
  }, [productMarkets]);
}
