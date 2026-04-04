import { 
  RNPVScenario, 
  RNPVCalculationResult, 
  PhaseCalculation, 
  MarketExtension,
  WhatIfScenarioOptions,
  WhatIfResult,
  ContinuousPhaseComponent
} from './interfaces';
import { ContinuousPhaseCalculator } from './continuousPhaseCalculator';
import { CannibalizationImpactService, BidirectionalCannibalizationData } from '../cannibalizationImpactService';

/**
 * Enhanced rNPV Calculation Engine
 * Implements the multi-factor, phase-gated model for medical device valuation
 */
export class RNPVCalculationEngine {
  private discountRate: number;
  private currency: string;
  private cannibalizationService: CannibalizationImpactService;

  constructor(discountRate: number = 0.10, currency: string = 'USD') {
    this.discountRate = discountRate;
    this.currency = currency;
    this.cannibalizationService = new CannibalizationImpactService();
  }

  /**
   * Calculate the complete rNPV for a scenario including core project and all market extensions
   */
  async calculateCompleteRNPV(
    scenario: RNPVScenario,
    marketExtensions: MarketExtension[]
  ): Promise<RNPVCalculationResult[]> {
    const results: RNPVCalculationResult[] = [];

    // 1. Calculate Core Project rNPV (market-agnostic development costs)
    const coreResult = await this.calculateCoreProjectRNPV(scenario);
    results.push(coreResult);

    // 2. Load cannibalization data for this product
    const cannibalizationData = await this.cannibalizationService.getBidirectionalCannibalizationData(scenario.productId);

    // 3. Calculate each Market Extension rNPV (with cannibalization adjustments)
    const activeMarketExtensions = marketExtensions.filter(
      ext => scenario.activeMarkets.includes(ext.marketCode)
    );

    for (const marketExt of activeMarketExtensions) {
      const marketResult = await this.calculateMarketExtensionRNPV(
        scenario, 
        marketExt, 
        coreResult.cumulativeTechnicalLoA,
        cannibalizationData
      );
      results.push(marketResult);
    }

    // 4. Calculate Total Portfolio rNPV
    const portfolioResult = await this.calculatePortfolioRNPV(results, scenario, cannibalizationData);
    results.push(portfolioResult);

    return results;
  }

  /**
   * Calculate Core Project rNPV - market-agnostic development phases
   * Enhanced to handle continuous phases with pre/post launch components
   * Formula: PVCosts = PV(PreLaunchCosts) + PV(PostLaunchCosts) with risk adjustments
   */
  private async calculateCoreProjectRNPV(scenario: RNPVScenario): Promise<RNPVCalculationResult> {
    const { coreProjectConfig } = scenario;
    const developmentPhases = coreProjectConfig.developmentPhases
      .filter(phase => phase.isMarketAgnostic)
      .sort((a, b) => a.startMonth - b.startMonth);

    let totalExpectedCostPV = 0;
    let cumulativeLoA = 1.0;
    const phaseCalculations: PhaseCalculation[] = [];

    for (let i = 0; i < developmentPhases.length; i++) {
      const phase = developmentPhases[i];
      
      // Apply LoS adjustments if any
      const adjustedLoS = scenario.loaAdjustments[phase.id] ?? phase.likelihoodOfSuccess;
      const loSProbability = adjustedLoS / 100;

      // Enhanced handling for continuous phases
      if (phase.isContinuous || ContinuousPhaseCalculator.isContinuousPhase(phase.name)) {
        // Ensure cost breakdown is available
        if (!phase.preLaunchCosts && !phase.postLaunchCosts) {
          const breakdown = ContinuousPhaseCalculator.estimateCostBreakdown(
            phase, 
            coreProjectConfig.projectTimeline
          );
          phase.preLaunchCosts = breakdown.preLaunchCosts;
          phase.postLaunchCosts = breakdown.postLaunchCosts;
          phase.recurringCostFrequency = phase.recurringCostFrequency || 'yearly';
        }

        // Split continuous phase into components
        const { preLaunchComponent, postLaunchComponent } = ContinuousPhaseCalculator.splitContinuousPhase(
          phase,
          coreProjectConfig.projectTimeline,
          this.discountRate
        );

        // Calculate total expected cost for continuous phase
        let phaseExpectedCost = 0;
        let phasePVCost = 0;

        if (preLaunchComponent) {
          const preLaunchExpected = preLaunchComponent.presentValueCost * cumulativeLoA;
          phaseExpectedCost += preLaunchExpected;
          phasePVCost += preLaunchComponent.presentValueCost;
        }

        if (postLaunchComponent) {
          // Post-launch costs are discounted but not risk-adjusted (they're operational)
          phaseExpectedCost += postLaunchComponent.presentValueCost;
          phasePVCost += postLaunchComponent.presentValueCost;
        }

        totalExpectedCostPV += phaseExpectedCost;

        // Store enhanced phase calculation details
        phaseCalculations.push({
          phaseId: phase.id,
          phaseName: phase.name,
          phaseType: 'development',
          cost: phase.costs,
          likelihoodOfApproval: adjustedLoS,
          cumulativeLoAToPreviousPhases: cumulativeLoA,
          expectedCost: phaseExpectedCost,
          presentValueCost: phasePVCost,
          startMonth: phase.startMonth,
          endMonth: phase.startMonth + (phase.duration || 12),
          isContinuous: true,
          preLaunchComponent,
          postLaunchComponent
        });
      } else {
        // Traditional discrete phase calculation
        const pvCost = this.calculatePresentValue(
          phase.costs,
          phase.startMonth,
          this.discountRate
        );

        const expectedCost = pvCost * cumulativeLoA;
        totalExpectedCostPV += expectedCost;

        phaseCalculations.push({
          phaseId: phase.id,
          phaseName: phase.name,
          phaseType: 'development',
          cost: phase.costs,
          likelihoodOfApproval: adjustedLoS,
          cumulativeLoAToPreviousPhases: cumulativeLoA,
          expectedCost,
          presentValueCost: pvCost,
          startMonth: phase.startMonth,
          endMonth: phase.startMonth + phase.duration,
          isContinuous: false
        });
      }

      // Update cumulative LoA for next phase (only for non-continuous phases)
      if (!phase.isContinuous && !ContinuousPhaseCalculator.isContinuousPhase(phase.name)) {
        cumulativeLoA *= loSProbability;
      }
    }

    return {
      id: `core_${scenario.id}`,
      scenarioId: scenario.id,
      productId: scenario.productId,
      companyId: scenario.companyId,
      calculationType: 'core_project',
      expectedCostPV: totalExpectedCostPV,
      expectedRevenuePV: 0, // Core project generates no revenue
      rnpvValue: -totalExpectedCostPV, // Negative because it's pure cost
      cumulativeTechnicalLoA: cumulativeLoA,
      cumulativeCommercialLoA: 1.0,
      phaseCalculations,
      calculationMetadata: {
        totalPhases: developmentPhases.length,
        totalMarkets: 0,
        baselineCurrency: this.currency,
        calculationMethod: 'enhanced_phase_gated_rnpv',
        assumptions: {
          discountRate: this.discountRate,
          calculationDate: new Date().toISOString(),
          continuousPhasesSupported: true,
          launchDate: coreProjectConfig.projectTimeline.expectedLaunchDate.toISOString()
        }
      },
      calculatedAt: new Date(),
      calculationVersion: '2.0'
    };
  }

  /**
   * Calculate Market Extension rNPV
   * Formula: rNPV = PV(Revenue) × TechnicalLoA × CommercialLoA - PV(MarketCosts) × TechnicalLoA - CannibalizationLoss
   */
  private async calculateMarketExtensionRNPV(
    scenario: RNPVScenario,
    marketExtension: MarketExtension,
    coreProjectLoA: number,
    cannibalizationData?: BidirectionalCannibalizationData
  ): Promise<RNPVCalculationResult> {
    const { revenueForecast, marketSpecificCosts, regulatoryPhases, commercialFactors } = marketExtension;

    // Calculate regulatory phase costs and LoA
    let totalRegulatoryLoA = 1.0;
    let totalMarketCostsPV = 0;
    const phaseCalculations: PhaseCalculation[] = [];

    // Process regulatory phases
    for (const regPhase of regulatoryPhases.sort((a, b) => a.position - b.position)) {
      const adjustedLoA = scenario.loaAdjustments[regPhase.id] ?? regPhase.likelihoodOfApproval;
      const loAProbability = adjustedLoA / 100;

      const pvCost = this.calculatePresentValue(
        regPhase.costs,
        regPhase.timelineMonths,
        this.discountRate
      );

      const expectedCost = pvCost * totalRegulatoryLoA;
      totalMarketCostsPV += expectedCost;

      phaseCalculations.push({
        phaseId: regPhase.id,
        phaseName: regPhase.name,
        phaseType: 'regulatory',
        cost: regPhase.costs,
        likelihoodOfApproval: adjustedLoA,
        cumulativeLoAToPreviousPhases: totalRegulatoryLoA,
        expectedCost,
        presentValueCost: pvCost,
        startMonth: regPhase.timelineMonths,
        endMonth: regPhase.timelineMonths + 3 // Assuming 3 month regulatory review
      });

      totalRegulatoryLoA *= loAProbability;
    }

    // Calculate commercial success factor LoA
    let totalCommercialLoA = 1.0;
    for (const factor of commercialFactors) {
      const adjustedLoA = scenario.loaAdjustments[factor.id] ?? factor.likelihoodOfSuccess;
      totalCommercialLoA *= (adjustedLoA / 100);
    }

    // Calculate expected revenue PV
    const totalRevenuePV = this.calculateRevenuePresentValue(revenueForecast);
    let expectedRevenuePV = totalRevenuePV * coreProjectLoA * totalRegulatoryLoA * totalCommercialLoA;

    // Apply cannibalization impact to revenue
    let cannibalizationLossPV = 0;
    if (cannibalizationData) {
      const marketImpacts = cannibalizationData.thisProductCannibalizes.filter(
        impact => impact.marketCode === marketExtension.marketCode
      );
      
      for (const impact of marketImpacts) {
        // Calculate present value of cannibalization loss over time
        const lossPerMonth = impact.estimatedMonthlyLoss;
        const monthsToRoof = impact.monthsToReachRoof;
        
        // Progressive cannibalization: starts at 0, reaches peak at monthsToRoof
        for (let month = 1; month <= monthsToRoof; month++) {
          const progressiveCannibaliation = (lossPerMonth * month) / monthsToRoof;
          const monthlyLossPV = this.calculatePresentValue(
            progressiveCannibaliation,
            month,
            this.discountRate
          );
          cannibalizationLossPV += monthlyLossPV;
        }
      }
      
      // Reduce expected revenue by cannibalization loss
      expectedRevenuePV = Math.max(0, expectedRevenuePV - cannibalizationLossPV);
    }

    // Add market-specific costs
    totalMarketCostsPV += this.calculatePresentValue(
      marketSpecificCosts.regulatorySubmissionFees + 
      marketSpecificCosts.clinicalTrialCosts +
      marketSpecificCosts.marketingInvestment,
      0, // Assume upfront costs
      this.discountRate
    );

    // Final rNPV = Expected Revenue (after cannibalization) - Expected Costs
    const rnpvValue = expectedRevenuePV - totalMarketCostsPV;

    return {
      id: `market_${marketExtension.id}`,
      scenarioId: scenario.id,
      productId: scenario.productId,
      companyId: scenario.companyId,
      calculationType: 'market_extension',
      marketCode: marketExtension.marketCode,
      expectedCostPV: totalMarketCostsPV,
      expectedRevenuePV: expectedRevenuePV,
      rnpvValue,
      cumulativeTechnicalLoA: coreProjectLoA * totalRegulatoryLoA,
      cumulativeCommercialLoA: totalCommercialLoA,
      phaseCalculations,
      calculationMetadata: {
        totalPhases: regulatoryPhases.length + commercialFactors.length,
        totalMarkets: 1,
        baselineCurrency: this.currency,
        calculationMethod: 'phase_gated_rnpv',
        assumptions: {
          discountRate: this.discountRate,
          coreProjectLoA,
          marketCode: marketExtension.marketCode,
          cannibalizationLossPV: cannibalizationLossPV || 0,
          cannibalizationImpactsCount: cannibalizationData?.thisProductCannibalizes.filter(
            impact => impact.marketCode === marketExtension.marketCode
          ).length || 0
        }
      },
      calculatedAt: new Date(),
      calculationVersion: '1.0'
    };
  }

  /**
   * Calculate Total Portfolio rNPV
   * Formula: Total rNPV = Core Project Costs + Σ(Market Extension rNPVs) - Net Cannibalization Impact
   */
  private async calculatePortfolioRNPV(
    results: RNPVCalculationResult[],
    scenario: RNPVScenario,
    cannibalizationData?: BidirectionalCannibalizationData
  ): Promise<RNPVCalculationResult> {
    const coreResult = results.find(r => r.calculationType === 'core_project');
    const marketResults = results.filter(r => r.calculationType === 'market_extension');

    if (!coreResult) {
      throw new Error('Core project calculation not found');
    }

    const totalCosts = coreResult.expectedCostPV + 
      marketResults.reduce((sum, r) => sum + r.expectedCostPV, 0);
    
    const totalRevenue = marketResults.reduce((sum, r) => sum + r.expectedRevenuePV, 0);
    
    // Apply portfolio-level cannibalization impact
    const netCannibalizationImpact = cannibalizationData?.netPortfolioImpact || 0;
    const totalRNPV = totalRevenue - totalCosts + netCannibalizationImpact;

    return {
      id: `portfolio_${scenario.id}`,
      scenarioId: scenario.id,
      productId: scenario.productId,
      companyId: scenario.companyId,
      calculationType: 'total_portfolio',
      expectedCostPV: totalCosts,
      expectedRevenuePV: totalRevenue,
      rnpvValue: totalRNPV,
      cumulativeTechnicalLoA: coreResult.cumulativeTechnicalLoA,
      cumulativeCommercialLoA: marketResults.length > 0 
        ? marketResults.reduce((avg, r) => avg + r.cumulativeCommercialLoA, 0) / marketResults.length 
        : 1.0,
      phaseCalculations: [
        ...coreResult.phaseCalculations,
        ...marketResults.flatMap(r => r.phaseCalculations)
      ],
      calculationMetadata: {
        totalPhases: coreResult.calculationMetadata.totalPhases + 
          marketResults.reduce((sum, r) => sum + r.calculationMetadata.totalPhases, 0),
        totalMarkets: marketResults.length,
        baselineCurrency: this.currency,
        calculationMethod: 'phase_gated_rnpv',
        assumptions: {
          discountRate: this.discountRate,
          activeMarkets: scenario.activeMarkets,
          portfolioCalculation: true,
          netCannibalizationImpact: netCannibalizationImpact,
          cannibalizationDataIncluded: !!cannibalizationData
        }
      },
      calculatedAt: new Date(),
      calculationVersion: '1.0'
    };
  }

  /**
   * Calculate present value of a future cash flow
   */
  private calculatePresentValue(
    futureValue: number,
    months: number,
    discountRate: number
  ): number {
    const years = months / 12;
    return futureValue / Math.pow(1 + discountRate, years);
  }

  /**
   * Calculate present value of revenue forecast
   */
  private calculateRevenuePresentValue(revenueForecast: any): number {
    if (!revenueForecast.monthlyRevenue || !Array.isArray(revenueForecast.monthlyRevenue)) {
      return 0;
    }

    return revenueForecast.monthlyRevenue.reduce((totalPV, monthlyData) => {
      const pv = this.calculatePresentValue(
        monthlyData.revenue,
        monthlyData.month,
        this.discountRate
      );
      return totalPV + pv;
    }, 0);
  }

  /**
   * Perform What-If Analysis
   */
  async performWhatIfAnalysis(
    baselineScenario: RNPVScenario,
    marketExtensions: MarketExtension[],
    options: WhatIfScenarioOptions
  ): Promise<WhatIfResult> {
    // Calculate baseline
    const baselineResults = await this.calculateCompleteRNPV(baselineScenario, marketExtensions);
    const originalRNPV = baselineResults.find(r => r.calculationType === 'total_portfolio')?.rnpvValue || 0;

    // Create adjusted scenario
    const adjustedScenario: RNPVScenario = {
      ...baselineScenario,
      loaAdjustments: { ...baselineScenario.loaAdjustments, ...options.adjustLoA },
      activeMarkets: options.toggleMarkets.length > 0 ? options.toggleMarkets : baselineScenario.activeMarkets
    };

    if (options.adjustDiscountRate) {
      this.discountRate = options.adjustDiscountRate;
    }

    // Calculate adjusted scenario
    const adjustedResults = await this.calculateCompleteRNPV(adjustedScenario, marketExtensions);
    const adjustedRNPV = adjustedResults.find(r => r.calculationType === 'total_portfolio')?.rnpvValue || 0;

    const deltaRNPV = adjustedRNPV - originalRNPV;
    const deltaPercentage = originalRNPV !== 0 ? (deltaRNPV / originalRNPV) * 100 : 0;

    return {
      originalRNPV,
      adjustedRNPV,
      deltaRNPV,
      deltaPercentage,
      keyDrivers: this.identifyKeyDrivers(options, deltaRNPV),
      recommendations: this.generateRecommendations(deltaRNPV, deltaPercentage)
    };
  }

  private identifyKeyDrivers(options: WhatIfScenarioOptions, deltaRNPV: number): string[] {
    const drivers: string[] = [];
    
    if (Object.keys(options.adjustLoA).length > 0) {
      drivers.push('Likelihood of Approval adjustments');
    }
    
    if (options.toggleMarkets.length > 0) {
      drivers.push('Market selection changes');
    }
    
    if (options.adjustDiscountRate) {
      drivers.push('Discount rate adjustment');
    }

    return drivers;
  }

  private generateRecommendations(deltaRNPV: number, deltaPercentage: number): string[] {
    const recommendations: string[] = [];
    
    if (deltaRNPV > 0) {
      recommendations.push('Positive impact on project value - consider implementing these changes');
    } else {
      recommendations.push('Negative impact on project value - reassess assumptions');
    }
    
    if (Math.abs(deltaPercentage) > 20) {
      recommendations.push('High sensitivity detected - focus on risk mitigation');
    }

    return recommendations;
  }
}