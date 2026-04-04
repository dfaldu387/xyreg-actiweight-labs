import { EnhancedProductMarket } from '@/utils/enhancedMarketRiskClassMapping';

/**
 * Utility functions for handling market launch status
 */

export interface LaunchStatusInfo {
  isLaunched: boolean;
  launchDate?: string;
  regulatoryStatus?: string;
  triggersRevenue: boolean;
  triggersPMS: boolean;
}

/**
 * Determine if a market is launched based on regulatory status, explicit launch status, and launch date
 */
export function getMarketLaunchStatus(market: EnhancedProductMarket): LaunchStatusInfo {
  // Market-specific launch indicating regulatory statuses
  const launchIndicatingStatuses: Record<string, string[]> = {
    'EU': ['CE_MARKED'],
    'US': ['FDA_APPROVED', 'FDA_CLEARED'],
    'USA': ['FDA_APPROVED', 'FDA_CLEARED'],
    'CA': ['HEALTH_CANADA_LICENSED'],
    'AU': ['TGA_REGISTERED'],
    'JP': ['PMDA_APPROVED'],
    'BR': ['ANVISA_APPROVED'],
    'CN': ['NMPA_APPROVED'],
    'IN': ['CDSCO_APPROVED'],
    'KR': ['KFDA_APPROVED'],
    'UK': ['UKCA_MARKED', 'CE_MARKED'], // UK uses UKCA marking (CE accepted until 2028)
    'CH': ['SWISSMEDIC_APPROVED']  // Switzerland requires Swissmedic approval (MRA lapsed May 2021)
  };
  
  // CRITICAL FIX: Explicit marketLaunchStatus takes priority over auto-detection
  // If user explicitly set 'planned' or 'withdrawn', respect that choice
  if (market.marketLaunchStatus === 'planned' || market.marketLaunchStatus === 'withdrawn') {
    return {
      isLaunched: false,
      launchDate: typeof (market.actualLaunchDate || market.launchDate) === 'string' 
        ? (market.actualLaunchDate || market.launchDate) as string
        : (market.actualLaunchDate || market.launchDate)?.toString(),
      regulatoryStatus: market.regulatoryStatus,
      triggersRevenue: false,
      triggersPMS: false
    };
  }
  
  // Check if regulatory status indicates launch for this specific market
  const marketLaunchStatuses = launchIndicatingStatuses[market.code] || [];
  const isRegulatoryLaunched = market.regulatoryStatus && 
    marketLaunchStatuses.includes(market.regulatoryStatus);
  
  // Explicit launch status
  const isExplicitlyLaunched = market.marketLaunchStatus === 'launched';
  
  // EUDAMED data can hint at launch, but ONLY if user hasn't explicitly set a status.
  // If marketLaunchStatus is set (e.g. 'planned', 'launched', 'withdrawn'), respect it.
  const hasExplicitStatus = !!market.marketLaunchStatus;
  const hasEudamedData = !hasExplicitStatus && market.code === 'EU' && (
    !!(market as any).eudamed_registration_number ||
    !!(market as any).eudamed_basic_udi_di_code ||
    !!(market as any).eudamed_device_name ||
    !!(market as any).eudamed_organization ||
    !!(market as any).eudamed_id_srn
  );
  
  // Check if launch date is in the future (not yet launched)
  const launchDate = market.actualLaunchDate || market.launchDate;
  const isFutureLaunch = launchDate ? new Date(launchDate) > new Date() : false;
  
  // Product is launched if:
  // 1. Regulatory status indicates launch, OR
  // 2. Explicitly marked as launched, OR  
  // 3. EU market with EUDAMED data AND no explicit status set
  // AND launch date is not in the future
  const isLaunched = (isRegulatoryLaunched || isExplicitlyLaunched || hasEudamedData) && !isFutureLaunch;
  
  return {
    isLaunched,
    launchDate: typeof launchDate === 'string' 
      ? launchDate as string
      : launchDate?.toString(),
    regulatoryStatus: market.regulatoryStatus,
    triggersRevenue: isLaunched,
    triggersPMS: isLaunched
  };
}

/**
 * Get all launched markets from a product's markets array
 */
export function getLaunchedMarkets(markets: EnhancedProductMarket[]): EnhancedProductMarket[] {
  return markets.filter(market => {
    const status = getMarketLaunchStatus(market);
    return market.selected && status.isLaunched;
  });
}

/**
 * Check if a product should trigger PMS processes based on launched markets
 */
export function shouldTriggerPMS(markets: EnhancedProductMarket[]): boolean {
  const launchedMarkets = getLaunchedMarkets(markets);
  return launchedMarkets.length > 0;
}

/**
 * Auto-set EU launch status for EUDAMED products
 */
export function autoSetEULaunchStatus(markets: EnhancedProductMarket[], hasEudamedData: boolean): EnhancedProductMarket[] {
  if (!hasEudamedData) return markets;
  
  return markets.map(market => {
    if (market.code === 'EU' && market.selected) {
      return {
        ...market,
        regulatoryStatus: 'CE_MARKED',
        marketLaunchStatus: 'launched' as const,
        actualLaunchDate: market.actualLaunchDate || new Date().toISOString()
      };
    }
    return market;
  });
}

/**
 * Get launch status summary for display
 */
export function getLaunchStatusSummary(markets: EnhancedProductMarket[]): {
  totalMarkets: number;
  launchedMarkets: number;
  plannedMarkets: number;
  launchedMarketCodes: string[];
} {
  const selectedMarkets = markets.filter(m => m.selected);
  const launchedMarkets = getLaunchedMarkets(markets);
  
  return {
    totalMarkets: selectedMarkets.length,
    launchedMarkets: launchedMarkets.length,
    plannedMarkets: selectedMarkets.length - launchedMarkets.length,
    launchedMarketCodes: launchedMarkets.map(m => m.code)
  };
}
