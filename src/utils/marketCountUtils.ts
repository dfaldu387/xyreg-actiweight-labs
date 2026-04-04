import { getMarketLaunchStatus } from './launchStatusUtils';

export interface MarketCountResult {
  code: string;
  count: number;
}

/**
 * Aggregate market counts across multiple products
 * Returns counts of devices launched and planned per market
 */
export function aggregateMarketCounts(products: any[]): {
  launchedMarkets: MarketCountResult[];
  plannedMarkets: MarketCountResult[];
} {
  const launchedCounts: Record<string, number> = {};
  const plannedCounts: Record<string, number> = {};
  
  products.forEach(product => {
    // Check if product has EUDAMED data (product-level)
    const hasEudamedData = 
      !!(product as any)?.eudamed_registration_number || 
      !!(product as any)?.eudamed_basic_udi_di_code ||
      !!(product as any)?.eudamed_device_name ||
      !!(product as any)?.eudamed_organization || 
      !!(product as any)?.eudamed_id_srn;
    
    // CRITICAL: Any product with EUDAMED data is automatically launched in EU
    if (hasEudamedData) {
      launchedCounts['EU'] = (launchedCounts['EU'] || 0) + 1;
    }
    
    // Process all selected markets
    if (!product.markets || !Array.isArray(product.markets)) return;
    
    product.markets.forEach((market: any) => {
      if (market.selected) {
        // Skip EU if already counted via EUDAMED
        if (market.code === 'EU' && hasEudamedData) {
          return; // Already counted above
        }
        
        const status = getMarketLaunchStatus(market);
        if (status.isLaunched) {
          launchedCounts[market.code] = (launchedCounts[market.code] || 0) + 1;
        } else {
          plannedCounts[market.code] = (plannedCounts[market.code] || 0) + 1;
        }
      }
    });
  });
  
  // Convert to array format and sort alphabetically
  const launchedMarkets = Object.entries(launchedCounts)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => a.code.localeCompare(b.code));
    
  const plannedMarkets = Object.entries(plannedCounts)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => a.code.localeCompare(b.code));
  
  return { launchedMarkets, plannedMarkets };
}
