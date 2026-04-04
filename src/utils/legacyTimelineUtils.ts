import { ProductPhase } from '@/types/client';
import { detectProductType } from './productTypeDetection';
import { addDays, subDays } from 'date-fns';

export interface LegacyTimelineConfig {
  isLegacyProduct: boolean;
  launchDate: Date;
  shouldShowLegacyIndicator: boolean;
}

/**
 * Determines if a product is legacy and configures timeline accordingly
 */
export function getLegacyTimelineConfig(product: any): LegacyTimelineConfig {
  const productType = detectProductType(product);
  const isLegacyProduct = productType === 'legacy_product';
  
  // Use actual_launch_date if available, otherwise fall back to inserted_at
  let launchDate = new Date();
  if (product.actual_launch_date) {
    launchDate = new Date(product.actual_launch_date);
  } else if (product.inserted_at) {
    launchDate = new Date(product.inserted_at);
  }
  
  return {
    isLegacyProduct,
    launchDate,
    shouldShowLegacyIndicator: isLegacyProduct
  };
}

/**
 * Adjusts phase dates and statuses for legacy products
 */
export function adjustPhasesForLegacyProduct(
  phases: ProductPhase[], 
  config: LegacyTimelineConfig
): ProductPhase[] {
  if (!config.isLegacyProduct) {
    return phases;
  }

  const { launchDate } = config;
  const sortedPhases = [...phases].sort((a, b) => (a.position || 0) - (b.position || 0));
  
  return sortedPhases.map((phase, index) => {
    const isPostMarketSurveillance = phase.name.toLowerCase().includes('post-market') || 
                                   phase.name.toLowerCase().includes('surveillance') ||
                                   phase.name.toLowerCase().includes('pms');
    
    if (isPostMarketSurveillance) {
      // Post-Market Surveillance is ongoing from launch date with no end date
      return {
        ...phase,
        start_date: launchDate.toISOString().split('T')[0],
        end_date: null, // Ongoing phase
        status: 'In Progress' as const,
        isCurrentPhase: true,
        is_current_phase: true
      };
    } else {
      // All other phases are completed in the past
      // Calculate historical dates based on typical durations
      const typicalDuration = phase.typical_duration_days || 30;
      const daysBeforeLaunch = (sortedPhases.length - index) * typicalDuration;
      
      const phaseEndDate = subDays(launchDate, (sortedPhases.length - index - 1) * typicalDuration);
      const phaseStartDate = subDays(phaseEndDate, typicalDuration);
      
      return {
        ...phase,
        start_date: phaseStartDate.toISOString().split('T')[0],
        end_date: phaseEndDate.toISOString().split('T')[0],
        status: 'Completed' as const,
        isCurrentPhase: false,
        is_current_phase: false
      };
    }
  });
}

/**
 * Creates a visual indicator message for legacy products
 */
export function getLegacyProductMessage(config: LegacyTimelineConfig): string | null {
  if (!config.shouldShowLegacyIndicator) {
    return null;
  }
  
  return `This is a legacy device imported from EUDAMED. All development phases are shown as completed with estimated historical dates. Only Post-Market Surveillance is active.`;
}