import { DevelopmentPhase, ContinuousPhaseComponent, ProjectTimeline } from './interfaces';

/**
 * Calculator for continuous phases that span pre and post-launch periods
 * Handles phases like Risk Management, Post-Market Surveillance that have both
 * development investments and ongoing operational costs
 */
export class ContinuousPhaseCalculator {
  
  /**
   * Split a continuous phase into pre-launch and post-launch components
   */
  static splitContinuousPhase(
    phase: DevelopmentPhase,
    projectTimeline: ProjectTimeline,
    discountRate: number
  ): {
    preLaunchComponent: ContinuousPhaseComponent | null;
    postLaunchComponent: ContinuousPhaseComponent | null;
  } {
    if (!phase.isContinuous) {
      return { preLaunchComponent: null, postLaunchComponent: null };
    }

    const projectStartMonth = 0;
    const launchMonth = this.calculateLaunchMonth(projectTimeline);
    const analysisEndMonth = launchMonth + projectTimeline.postLaunchAnalysisPeriodMonths;

    let preLaunchComponent: ContinuousPhaseComponent | null = null;
    let postLaunchComponent: ContinuousPhaseComponent | null = null;

    // Calculate pre-launch component if phase starts before launch
    if (phase.startMonth < launchMonth) {
      const preLaunchDuration = Math.min(
        phase.duration || (launchMonth - phase.startMonth),
        launchMonth - phase.startMonth
      );
      
      const preLaunchCost = phase.preLaunchCosts || (phase.costs * (preLaunchDuration / (phase.duration || 12)));
      
      preLaunchComponent = {
        cost: preLaunchCost,
        expectedCost: preLaunchCost, // Will be adjusted by LoA later
        presentValueCost: this.calculatePresentValue(preLaunchCost, phase.startMonth, discountRate),
        periodStartMonth: phase.startMonth,
        periodEndMonth: launchMonth,
        costType: 'upfront'
      };
    }

    // Calculate post-launch component for ongoing operational costs
    if (phase.postLaunchCosts && phase.postLaunchCosts > 0) {
      const postLaunchDuration = analysisEndMonth - launchMonth;
      const recurringFrequency = phase.recurringCostFrequency || 'yearly';
      
      // Calculate total recurring costs over the analysis period
      const periodsPerYear = this.getPeriodsPerYear(recurringFrequency);
      const totalPeriods = (postLaunchDuration / 12) * periodsPerYear;
      const totalRecurringCost = phase.postLaunchCosts * totalPeriods;
      
      // Calculate present value of recurring costs
      const presentValueRecurring = this.calculateRecurringPresentValue(
        phase.postLaunchCosts,
        launchMonth,
        postLaunchDuration,
        recurringFrequency,
        discountRate
      );

      postLaunchComponent = {
        cost: totalRecurringCost,
        expectedCost: totalRecurringCost, // Will be adjusted by LoA later
        presentValueCost: presentValueRecurring,
        periodStartMonth: launchMonth,
        periodEndMonth: analysisEndMonth,
        costType: 'recurring',
        frequency: recurringFrequency
      };
    }

    return { preLaunchComponent, postLaunchComponent };
  }

  /**
   * Calculate the launch month from project start
   */
  private static calculateLaunchMonth(projectTimeline: ProjectTimeline): number {
    const projectStart = projectTimeline.startDate;
    const launchDate = projectTimeline.expectedLaunchDate;
    
    const monthsDiff = (launchDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    return Math.round(monthsDiff);
  }

  /**
   * Get number of periods per year for different frequencies
   */
  private static getPeriodsPerYear(frequency: 'monthly' | 'quarterly' | 'yearly'): number {
    switch (frequency) {
      case 'monthly': return 12;
      case 'quarterly': return 4;
      case 'yearly': return 1;
      default: return 1;
    }
  }

  /**
   * Calculate present value of recurring costs
   */
  private static calculateRecurringPresentValue(
    periodicCost: number,
    startMonth: number,
    durationMonths: number,
    frequency: 'monthly' | 'quarterly' | 'yearly',
    discountRate: number
  ): number {
    const periodsPerYear = this.getPeriodsPerYear(frequency);
    const periodLengthMonths = 12 / periodsPerYear;
    const totalPeriods = Math.floor(durationMonths / periodLengthMonths);
    
    let totalPV = 0;
    
    for (let period = 0; period < totalPeriods; period++) {
      const paymentMonth = startMonth + (period * periodLengthMonths);
      const pv = this.calculatePresentValue(periodicCost, paymentMonth, discountRate);
      totalPV += pv;
    }
    
    return totalPV;
  }

  /**
   * Calculate present value of a future cash flow
   */
  private static calculatePresentValue(
    futureValue: number,
    months: number,
    discountRate: number
  ): number {
    const years = months / 12;
    return futureValue / Math.pow(1 + discountRate, years);
  }

  /**
   * Check if a phase is continuous based on its characteristics
   */
  static isContinuousPhase(phaseName: string): boolean {
    const continuousPhaseNames = [
      'risk management',
      'post-market surveillance',
      'design change control',
      'configuration management',
      'supplier management',
      'quality management',
      'regulatory compliance'
    ];
    
    const normalizedName = phaseName.toLowerCase();
    return continuousPhaseNames.some(name => normalizedName.includes(name));
  }

  /**
   * Estimate cost breakdown for continuous phases if not provided
   */
  static estimateCostBreakdown(
    phase: DevelopmentPhase,
    projectTimeline: ProjectTimeline
  ): { preLaunchCosts: number; postLaunchCosts: number } {
    if (!phase.isContinuous) {
      return { preLaunchCosts: phase.costs, postLaunchCosts: 0 };
    }

    const launchMonth = this.calculateLaunchMonth(projectTimeline);
    const preLaunchDuration = Math.max(0, launchMonth - phase.startMonth);
    const totalPhaseDuration = phase.duration || 12;

    // For continuous phases, estimate breakdown based on phase characteristics
    if (phase.name.toLowerCase().includes('risk management')) {
      // Risk Management: 60% pre-launch, 40% post-launch
      return {
        preLaunchCosts: phase.costs * 0.6,
        postLaunchCosts: (phase.costs * 0.4) / (projectTimeline.postLaunchAnalysisPeriodMonths / 12) // Annual recurring
      };
    } else if (phase.name.toLowerCase().includes('post-market surveillance')) {
      // Post-Market Surveillance: 10% pre-launch setup, 90% post-launch
      return {
        preLaunchCosts: phase.costs * 0.1,
        postLaunchCosts: (phase.costs * 0.9) / (projectTimeline.postLaunchAnalysisPeriodMonths / 12) // Annual recurring
      };
    } else {
      // Default: Equal distribution
      const preLaunchRatio = preLaunchDuration / totalPhaseDuration;
      return {
        preLaunchCosts: phase.costs * preLaunchRatio,
        postLaunchCosts: phase.costs * (1 - preLaunchRatio) / (projectTimeline.postLaunchAnalysisPeriodMonths / 12)
      };
    }
  }
}