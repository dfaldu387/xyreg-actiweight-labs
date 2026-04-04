import { PhaseBudgetItem } from './phaseBudgetService';

export interface TimelineBudgetCalculation {
  preLaunchCosts: number;
  postLaunchCosts: number;
  totalCosts: number;
  breakdown: {
    [itemId: string]: {
      preLaunchCost: number;
      postLaunchCost: number;
      frequency: string;
      timing: string;
    };
  };
}

export class TimelineBudgetCalculator {
  
  /**
   * Calculate costs for a phase based on timeline and launch date
   */
  static calculateTimelineCosts(
    items: PhaseBudgetItem[],
    phaseDurationMonths: number,
    isPreLaunch: boolean,
    launchDate?: Date,
    phaseStartDate?: Date,
    phaseEndDate?: Date
  ): TimelineBudgetCalculation {
    
    const calculation: TimelineBudgetCalculation = {
      preLaunchCosts: 0,
      postLaunchCosts: 0,
      totalCosts: 0,
      breakdown: {}
    };

    items.forEach(item => {
      const itemCalculation = this.calculateItemCosts(
        item,
        phaseDurationMonths,
        isPreLaunch,
        launchDate,
        phaseStartDate,
        phaseEndDate
      );

      calculation.preLaunchCosts += itemCalculation.preLaunchCost;
      calculation.postLaunchCosts += itemCalculation.postLaunchCost;
      calculation.breakdown[item.id] = itemCalculation;
    });

    calculation.totalCosts = calculation.preLaunchCosts + calculation.postLaunchCosts;
    return calculation;
  }

  /**
   * Calculate costs for a single budget item based on its timing configuration
   */
  private static calculateItemCosts(
    item: PhaseBudgetItem,
    phaseDurationMonths: number,
    isPreLaunch: boolean,
    launchDate?: Date,
    phaseStartDate?: Date,
    phaseEndDate?: Date
  ) {
    const result = {
      preLaunchCost: 0,
      postLaunchCost: 0,
      frequency: item.frequency,
      timing: item.timing_type
    };

    // Handle different timing types
    switch (item.timing_type) {
      case 'pre_launch':
        if (isPreLaunch) {
          result.preLaunchCost = this.calculateCostForPeriod(item, phaseDurationMonths, item.cost);
        }
        break;

      case 'post_launch':
        if (!isPreLaunch) {
          result.postLaunchCost = this.calculateCostForPeriod(item, phaseDurationMonths, item.cost);
        }
        break;

      case 'both':
        // Use different rates for pre and post launch
        const preLaunchRate = item.cost;
        const postLaunchRate = item.post_launch_cost ?? item.cost;
        
        if (isPreLaunch) {
          result.preLaunchCost = this.calculateCostForPeriod(item, phaseDurationMonths, preLaunchRate);
        } else {
          result.postLaunchCost = this.calculateCostForPeriod(item, phaseDurationMonths, postLaunchRate);
        }
        break;

      case 'milestone':
        // Milestone costs occur once during the phase they're defined in
        if (item.frequency === 'one_time') {
          if (isPreLaunch) {
            result.preLaunchCost = item.cost;
          } else {
            result.postLaunchCost = item.cost;
          }
        }
        break;
    }

    return result;
  }

  /**
   * Calculate cost for a period based on frequency
   */
  private static calculateCostForPeriod(
    item: PhaseBudgetItem,
    durationMonths: number,
    costPerPeriod: number
  ): number {
    switch (item.frequency) {
      case 'one_time':
        return costPerPeriod;
      
      case 'monthly':
        return costPerPeriod * durationMonths;
      
      case 'quarterly':
        return costPerPeriod * Math.ceil(durationMonths / 3);
      
      case 'yearly':
        return costPerPeriod * Math.ceil(durationMonths / 12);
      
      default:
        return costPerPeriod * durationMonths; // Default to monthly
    }
  }

  /**
   * Get default timing type based on phase name patterns
   */
  static getDefaultTimingType(phaseName: string): 'pre_launch' | 'post_launch' | 'both' | 'milestone' {
    const normalizedName = phaseName.toLowerCase();
    
    // Technical Documentation: 95% pre-launch, 5% post-launch
    if (normalizedName.includes('technical') && normalizedName.includes('documentation')) {
      return 'both';
    }
    
    // Risk Management: Continues throughout lifecycle
    if (normalizedName.includes('risk') && normalizedName.includes('management')) {
      return 'both';
    }
    
    // Post-market surveillance: Mainly post-launch
    if (normalizedName.includes('post-market') || normalizedName.includes('surveillance')) {
      return 'post_launch';
    }
    
    // Regulatory submission: One-time milestone
    if (normalizedName.includes('regulatory') && normalizedName.includes('submission')) {
      return 'milestone';
    }
    
    // Default to both (can be split)
    return 'both';
  }

  /**
   * Get default cost split for "both" timing type phases
   */
  static getDefaultCostSplit(phaseName: string): { preLaunchPercentage: number; postLaunchPercentage: number } {
    const normalizedName = phaseName.toLowerCase();
    
    // Technical Documentation: 95% pre-launch, 5% post-launch
    if (normalizedName.includes('technical') && normalizedName.includes('documentation')) {
      return { preLaunchPercentage: 95, postLaunchPercentage: 5 };
    }
    
    // Risk Management: 70% pre-launch, 30% post-launch
    if (normalizedName.includes('risk') && normalizedName.includes('management')) {
      return { preLaunchPercentage: 70, postLaunchPercentage: 30 };
    }
    
    // Quality Management: 60% pre-launch, 40% post-launch
    if (normalizedName.includes('quality') && normalizedName.includes('management')) {
      return { preLaunchPercentage: 60, postLaunchPercentage: 40 };
    }
    
    // Default split: 80% pre-launch, 20% post-launch
    return { preLaunchPercentage: 80, postLaunchPercentage: 20 };
  }
}