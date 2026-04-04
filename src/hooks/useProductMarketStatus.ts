import { useMemo } from 'react';
import { getMarketLaunchStatus } from '@/utils/launchStatusUtils';

export interface MarketStatusBadge {
  code: string;
  count: number;
}

export interface MarketStatusResult {
  launchedMarkets: MarketStatusBadge[];
  plannedMarkets: MarketStatusBadge[];
}

export function useProductMarketStatus(markets?: any[]): MarketStatusResult {
  return useMemo(() => {
    if (!markets || !Array.isArray(markets)) {
      return { launchedMarkets: [], plannedMarkets: [] };
    }

    const launchedMarkets: MarketStatusBadge[] = [];
    const plannedMarkets: MarketStatusBadge[] = [];
    const marketCounts: Record<string, { launched: boolean; count: number }> = {};

    markets.forEach((m) => {
      if (m.selected) {
        const status = getMarketLaunchStatus(m);
        const isLaunched = status.isLaunched;

        if (!marketCounts[m.code]) {
          marketCounts[m.code] = { launched: isLaunched, count: 1 };
          if (isLaunched) {
            launchedMarkets.push({ code: m.code, count: 1 });
          } else {
            plannedMarkets.push({ code: m.code, count: 1 });
          }
        }
      }
    });

    return { launchedMarkets, plannedMarkets };
  }, [markets]);
}
