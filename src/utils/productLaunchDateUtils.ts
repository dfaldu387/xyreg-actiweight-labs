import { EnhancedProductMarket } from '@/utils/enhancedMarketRiskClassMapping';

/**
 * Central utility for deriving product-level launch dates from market data.
 * 
 * SSOT: Market-level launch dates (Markets & Regulatory tab) are the single source of truth.
 * The DB trigger `sync_launch_dates_from_markets` auto-syncs these to products.projected_launch_date
 * and products.actual_launch_date whenever markets JSON is updated.
 * 
 * This utility provides the same logic on the frontend for real-time display
 * before a save round-trip.
 */

export interface ProductLaunchDates {
  /** Earliest launch date among all launched markets */
  actualLaunchDate: string | null;
  /** Earliest planned date among all selected markets */
  projectedLaunchDate: string | null;
  /** Whether any market is launched */
  isLaunched: boolean;
}

/**
 * Derive product-level launch dates from market data.
 * Mirrors the DB trigger logic in `sync_launch_dates_from_markets`.
 */
export function deriveProductLaunchDates(markets?: EnhancedProductMarket[]): ProductLaunchDates {
  if (!markets || !Array.isArray(markets)) {
    return { actualLaunchDate: null, projectedLaunchDate: null, isLaunched: false };
  }

  let earliestActual: string | null = null;
  let earliestProjected: string | null = null;

  for (const market of markets) {
    if (!market.selected) continue;

    // Actual: from launched markets
    if (market.marketLaunchStatus === 'launched') {
      const date = (market.actualLaunchDate || market.launchDate) as string | undefined;
      if (date && (!earliestActual || date < earliestActual)) {
        earliestActual = date;
      }
    }

    // Projected: from any selected market's planned launch date
    const plannedDate = market.launchDate as string | undefined;
    if (plannedDate && (!earliestProjected || plannedDate < earliestProjected)) {
      earliestProjected = plannedDate;
    }
  }

  return {
    actualLaunchDate: earliestActual,
    projectedLaunchDate: earliestProjected,
    isLaunched: earliestActual !== null,
  };
}

/**
 * Get effective launch date (actual if launched, projected otherwise).
 * Use this when you need a single "best available" date.
 */
export function getEffectiveLaunchDate(
  product?: { actual_launch_date?: string | null; projected_launch_date?: string | null },
  markets?: EnhancedProductMarket[]
): Date | null {
  // If markets provided, derive from them (real-time)
  if (markets && markets.length > 0) {
    const derived = deriveProductLaunchDates(markets);
    const dateStr = derived.actualLaunchDate || derived.projectedLaunchDate;
    return dateStr ? new Date(dateStr) : null;
  }

  // Fallback to product-level fields (already synced by DB trigger)
  if (product?.actual_launch_date) return new Date(product.actual_launch_date);
  if (product?.projected_launch_date) return new Date(product.projected_launch_date);
  return null;
}
