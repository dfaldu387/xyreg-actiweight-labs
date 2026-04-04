import { supabase } from "@/integrations/supabase/client";
import { ProductLifecycleService } from "./productLifecycleService";
import { CommercialSuccessFactorService } from "./commercialSuccessFactorService";

export interface MilestoneData {
  id: string;
  name: string;
  phaseId: string;
  phaseName: string;
  likelihood_of_success: number;
  estimated_budget?: number;
  start_date?: string;
  end_date?: string;
  status: string;
  position: number;
}

export interface RNPVScenario {
  name: 'best' | 'likely' | 'worst';
  label: string;
  probability: number;
  assumptions: {
    marketPenetration: number;
    pricePremium: number;
    timeToMarket: number; // months delay/acceleration
    developmentCostMultiplier: number;
    technicalRiskAdjustment: number;
  };
}

export interface DevelopmentRNPVInputs {
  // Product basics
  productId: string;
  productName: string;
  
  // Market parameters
  targetMarkets: string[];
  totalAddressableMarket: number;
  expectedMarketShare: number;
  launchYear: number;
  productLifespan: number; // years
  
  // Revenue model
  averageSellingPrice: number;
  annualPriceChange: number; // percentage
  annualVolumeGrowth: number; // percentage
  
  // Cost structure
  unitCost: number;
  annualCostChange: number; // percentage
  fixedCosts: number;
  
  // Development costs from milestones
  totalDevelopmentCosts: number;
  developmentTimelineMonths: number;
  
  // Financial parameters
  discountRate: number; // Financial risk - time value of money
  taxRate: number;
  
  // Risk factors (separate from LoA)
  marketRisk: number;
  competitiveRisk: number;
  technicalRisk: number;
  regulatoryRisk: number;
}

export interface DevelopmentRNPVResult {
  scenarios: {
    best: RNPVCalculationResult;
    likely: RNPVCalculationResult;
    worst: RNPVCalculationResult;
  };
  portfolioSummary: {
    expectedRNPV: number; // Probability-weighted average
    standardDeviation: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  };
  milestoneImpact: {
    totalLoA: number; // Combined LoS from all critical milestones (kept as totalLoA for backward compatibility)
    criticalPath: MilestoneData[];
    riskContribution: { [phaseId: string]: number };
  };
  sensitivityAnalysis: {
    parameter: string;
    impact: number; // Change in rNPV for 10% change in parameter
  }[];
}

export interface RNPVCalculationResult {
  npv: number; // Standard NPV using discount rate
  rnpv: number; // Risk-adjusted NPV (NPV × Technical LoA × Commercial LoA)
  totalRevenue: number;
  totalCosts: number;
  developmentCosts: number;
  roi: number;
  paybackPeriod: number; // months
  breakEvenUnits: number;
  riskAdjustmentFactor: number; // Combined Technical LoA
  commercialRiskFactor: number; // Combined Commercial LoA
  finalRiskAdjustment: number; // Technical × Commercial LoA
  monthlyProjections: MonthlyProjection[];
}

export interface MonthlyProjection {
  month: number;
  phase: 'development' | 'launch' | 'growth' | 'maturity';
  revenue: number;
  costs: number;
  developmentCosts: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  unitsShipped: number;
}

export class DevelopmentRNPVService {
  
  /**
   * Get milestone data with LoA for a development product
   */
  static async getMilestoneData(productId: string): Promise<MilestoneData[]> {
    try {
      const { data: phases, error } = await supabase
        .from('lifecycle_phases')
        .select(`
          id,
          name,
          phase_id,
          likelihood_of_success,
          start_date,
          end_date,
          status,
          company_phases!inner(
            id,
            name,
            estimated_budget,
            position
          )
        `)
        .eq('product_id', productId)
        .order('company_phases(position)');

      if (error) {
        console.error('Error fetching milestone data:', error);
        return [];
      }

      return phases?.map(phase => ({
        id: phase.id,
        name: phase.name,
        phaseId: phase.phase_id,
        phaseName: phase.company_phases?.name || phase.name,
        likelihood_of_success: phase.likelihood_of_success || 85,
        estimated_budget: phase.company_phases?.estimated_budget || 0,
        start_date: phase.start_date,
        end_date: phase.end_date,
        status: phase.status || 'Not Started',
        position: phase.company_phases?.position || 0
      })) || [];
    } catch (error) {
      console.error('Error in getMilestoneData:', error);
      return [];
    }
  }

  /**
   * Calculate combined Likelihood of Success (LoS) from milestones
   */
  static calculateCombinedLoS(milestones: MilestoneData[]): number {
    if (milestones.length === 0) return 0.85; // Default 85%
    
    // Convert percentages to decimal probabilities
    const probabilities = milestones.map(m => m.likelihood_of_success / 100);
    
    // Calculate combined probability (multiplicative for sequential gates)
    const combinedProbability = probabilities.reduce((acc, prob) => acc * prob, 1);
    
    return combinedProbability;
  }

  /**
   * Generate scenario assumptions for Monte Carlo analysis
   */
  static generateScenarios(): RNPVScenario[] {
    return [
      {
        name: 'best',
        label: 'Best Case',
        probability: 0.25,
        assumptions: {
          marketPenetration: 1.3, // 30% higher than base
          pricePremium: 1.15, // 15% price premium
          timeToMarket: -3, // 3 months early
          developmentCostMultiplier: 0.85, // 15% cost savings
          technicalRiskAdjustment: 0.5 // Lower technical risk
        }
      },
      {
        name: 'likely',
        label: 'Most Likely',
        probability: 0.5,
        assumptions: {
          marketPenetration: 1.0, // Base case
          pricePremium: 1.0, // No premium/discount
          timeToMarket: 0, // On time
          developmentCostMultiplier: 1.0, // On budget
          technicalRiskAdjustment: 1.0 // Base technical risk
        }
      },
      {
        name: 'worst',
        label: 'Worst Case',
        probability: 0.25,
        assumptions: {
          marketPenetration: 0.6, // 40% lower penetration
          pricePremium: 0.85, // 15% price pressure
          timeToMarket: 8, // 8 months delay
          developmentCostMultiplier: 1.4, // 40% cost overrun
          technicalRiskAdjustment: 1.8 // Higher technical risk
        }
      }
    ];
  }

  /**
   * Calculate rNPV for a development product using milestone LoA data and commercial factors
   */
  static async calculateDevelopmentRNPV(
    inputs: DevelopmentRNPVInputs,
    milestones: MilestoneData[]
  ): Promise<DevelopmentRNPVResult> {
    
    const scenarios = this.generateScenarios();
    const scenarioResults: { [key: string]: RNPVCalculationResult } = {};
    
    // Calculate combined technical/regulatory LoS from milestones
    const technicalLoS = this.calculateCombinedLoS(milestones);
    
    // Get commercial success factors and calculate commercial LoS
    const commercialFactors = await CommercialSuccessFactorService.getCommercialFactors(inputs.productId);
    const commercialRiskCalculation = CommercialSuccessFactorService.calculateCombinedCommercialLoS(commercialFactors);
    const commercialLoS = commercialRiskCalculation.combinedCommercialLoS;
    
    // Calculate each scenario with two-step risk adjustment
    for (const scenario of scenarios) {
      scenarioResults[scenario.name] = this.calculateScenarioRNPV(inputs, scenario, technicalLoS, commercialLoS);
    }

    // Calculate probability-weighted expected rNPV
    const expectedRNPV = scenarios.reduce((acc, scenario) => {
      return acc + (scenarioResults[scenario.name].rnpv * scenario.probability);
    }, 0);

    // Calculate standard deviation
    const variance = scenarios.reduce((acc, scenario) => {
      const diff = scenarioResults[scenario.name].rnpv - expectedRNPV;
      return acc + (diff * diff * scenario.probability);
    }, 0);
    const standardDeviation = Math.sqrt(variance);

    // 90% confidence interval
    const confidenceInterval = {
      lower: expectedRNPV - (1.645 * standardDeviation),
      upper: expectedRNPV + (1.645 * standardDeviation)
    };

    // Identify critical path (phases with lowest LoS)
    const criticalPath = milestones
      .filter(m => m.likelihood_of_success < 90)
      .sort((a, b) => a.likelihood_of_success - b.likelihood_of_success)
      .slice(0, 3);

    // Calculate risk contribution by phase
    const riskContribution: { [phaseId: string]: number } = {};
    milestones.forEach(milestone => {
      const riskFactor = (100 - milestone.likelihood_of_success) / 100;
      riskContribution[milestone.phaseId] = riskFactor * inputs.totalDevelopmentCosts;
    });

    // Basic sensitivity analysis
    const sensitivityAnalysis = [
      { parameter: 'Market Share', impact: this.calculateSensitivity(inputs, 'marketShare', 0.1) },
      { parameter: 'Selling Price', impact: this.calculateSensitivity(inputs, 'price', 0.1) },
      { parameter: 'Development Costs', impact: this.calculateSensitivity(inputs, 'devCosts', 0.1) },
      { parameter: 'Time to Market', impact: this.calculateSensitivity(inputs, 'timeToMarket', 0.1) },
    ];

    return {
      scenarios: {
        best: scenarioResults['best'],
        likely: scenarioResults['likely'],
        worst: scenarioResults['worst']
      },
      portfolioSummary: {
        expectedRNPV,
        standardDeviation,
        confidenceInterval
      },
      milestoneImpact: {
        totalLoA: technicalLoS, // Keep property name for backward compatibility
        criticalPath,
        riskContribution
      },
      sensitivityAnalysis
    };
  }

  /**
   * Calculate rNPV for a specific scenario with two-step risk adjustment
   */
  private static calculateScenarioRNPV(
    inputs: DevelopmentRNPVInputs,
    scenario: RNPVScenario,
    technicalLoA: number,
    commercialLoA: number
  ): RNPVCalculationResult {
    
    const monthlyProjections: MonthlyProjection[] = [];
    let cumulativeCashFlow = 0;
    let totalRevenue = 0;
    let totalCosts = 0;
    let developmentCosts = 0;
    
    // Adjust parameters based on scenario
    const adjustedMarketShare = inputs.expectedMarketShare * scenario.assumptions.marketPenetration;
    const adjustedPrice = inputs.averageSellingPrice * scenario.assumptions.pricePremium;
    const adjustedDevCosts = inputs.totalDevelopmentCosts * scenario.assumptions.developmentCostMultiplier;
    const adjustedTimeToMarket = inputs.developmentTimelineMonths + scenario.assumptions.timeToMarket;
    
    const totalProjectMonths = adjustedTimeToMarket + (inputs.productLifespan * 12);
    
    // Project timeline calculations
    for (let month = 1; month <= totalProjectMonths; month++) {
      let monthlyRevenue = 0;
      let monthlyOperatingCosts = 0;
      let monthlyDevelopmentCosts = 0;
      let unitsShipped = 0;
      let phase: 'development' | 'launch' | 'growth' | 'maturity' = 'development';
      
      if (month <= adjustedTimeToMarket) {
        // Development phase
        monthlyDevelopmentCosts = adjustedDevCosts / adjustedTimeToMarket;
        phase = 'development';
      } else {
        // Revenue phase
        const monthsFromLaunch = month - adjustedTimeToMarket;
        const yearsFromLaunch = monthsFromLaunch / 12;
        
        // Determine phase
        if (monthsFromLaunch <= 12) phase = 'launch';
        else if (monthsFromLaunch <= 36) phase = 'growth';
        else phase = 'maturity';
        
        // Calculate revenue with growth patterns
        const baseUnitsPerMonth = (inputs.totalAddressableMarket * adjustedMarketShare) / 12;
        const growthFactor = Math.pow(1 + inputs.annualVolumeGrowth / 100, yearsFromLaunch);
        const priceWithInflation = adjustedPrice * Math.pow(1 + inputs.annualPriceChange / 100, yearsFromLaunch);
        
        unitsShipped = baseUnitsPerMonth * growthFactor;
        monthlyRevenue = unitsShipped * priceWithInflation;
        
        // Calculate costs
        const costWithInflation = inputs.unitCost * Math.pow(1 + inputs.annualCostChange / 100, yearsFromLaunch);
        monthlyOperatingCosts = (unitsShipped * costWithInflation) + (inputs.fixedCosts / 12);
      }
      
      const netCashFlow = monthlyRevenue - monthlyOperatingCosts - monthlyDevelopmentCosts;
      cumulativeCashFlow += netCashFlow;
      
      // Discount to present value
      const discountFactor = Math.pow(1 + inputs.discountRate / 100 / 12, month - 1);
      totalRevenue += monthlyRevenue / discountFactor;
      totalCosts += monthlyOperatingCosts / discountFactor;
      developmentCosts += monthlyDevelopmentCosts / discountFactor;
      
      monthlyProjections.push({
        month,
        phase,
        revenue: monthlyRevenue,
        costs: monthlyOperatingCosts,
        developmentCosts: monthlyDevelopmentCosts,
        netCashFlow,
        cumulativeCashFlow,
        unitsShipped
      });
    }
    
    // Two-step risk calculation
    const npv = totalRevenue - totalCosts - developmentCosts;
    
    // Step 1: Apply technical/regulatory risk to revenue streams
    const technicalRiskAdjustedRevenue = totalRevenue * technicalLoA;
    
    // Step 2: Apply commercial risk only to post-launch revenues (not sunk costs)
    const commercialRiskAdjustedRevenue = technicalRiskAdjustedRevenue * commercialLoA;
    
    // Final rNPV: sunk costs + commercial risk-adjusted revenues
    const rnpv = commercialRiskAdjustedRevenue - totalCosts - developmentCosts;
    
    const finalRiskAdjustment = technicalLoA * commercialLoA;
    const roi = developmentCosts > 0 ? (rnpv / developmentCosts) * 100 : 0;
    
    // Calculate payback period
    let paybackPeriod = 0;
    for (let i = 0; i < monthlyProjections.length; i++) {
      if (monthlyProjections[i].cumulativeCashFlow >= 0) {
        paybackPeriod = monthlyProjections[i].month;
        break;
      }
    }
    
    // Calculate break-even units
    const contributionMargin = inputs.averageSellingPrice - inputs.unitCost;
    const breakEvenUnits = contributionMargin > 0 ? (developmentCosts + inputs.fixedCosts) / contributionMargin : 0;
    
    return {
      npv,
      rnpv,
      totalRevenue,
      totalCosts,
      developmentCosts,
      roi,
      paybackPeriod,
      breakEvenUnits,
      riskAdjustmentFactor: technicalLoA,
      commercialRiskFactor: commercialLoA,
      finalRiskAdjustment,
      monthlyProjections
    };
  }

  /**
   * Calculate sensitivity of rNPV to parameter changes
   */
  private static calculateSensitivity(
    inputs: DevelopmentRNPVInputs,
    parameter: string,
    changePercent: number
  ): number {
    // Simplified sensitivity calculation
    // In a real implementation, you'd recalculate the full rNPV with parameter changes
    
    const baseValue = inputs.totalAddressableMarket * inputs.expectedMarketShare * inputs.averageSellingPrice;
    
    switch (parameter) {
      case 'marketShare':
        return baseValue * changePercent * 0.8; // Market share has high impact
      case 'price':
        return baseValue * changePercent * 0.6; // Price has medium-high impact
      case 'devCosts':
        return inputs.totalDevelopmentCosts * changePercent * -0.4; // Cost increase reduces NPV
      case 'timeToMarket':
        return baseValue * changePercent * -0.3; // Delays reduce NPV
      default:
        return 0;
    }
  }

  /**
   * Check if a product should use development rNPV analysis
   */
  static async shouldUseDevelopmentRNPV(productId: string): Promise<boolean> {
    const lifecycleInfo = await ProductLifecycleService.getProductLifecycleInfo(productId);
    return lifecycleInfo?.isReadyForRNPVAnalysis ?? false;
  }
}