// NPV Calculation Service with enhanced R&D granularity, proper timing, progressive cannibalization, and simple cannibalized revenue

import { calculateProgressiveCannibalization, AffectedProduct } from '@/types/affectedProducts';

export interface NPVCalculationInput {
  revenue: number[];
  costs: number[];
  discountRate: number; // This should now be properly used from form data
  years: number;
  marketName: string;
  currency: string;
  // Enhanced R&D structure
  rndCosts: {
    workCosts: number;
    materialMachineCosts: number;
    startupProductionCosts: number;
    patentCosts: number;
  };
  rndTimingMonths: {
    workCostsSpread: number;
    materialMachineSpread: number;
    startupProductionSpread: number;
    patentSpread: number;
  };
  developmentPhaseMonths: number; // Months before revenue starts
  // Progressive cannibalization data
  affectedProducts?: AffectedProduct[];
  affectedProductsBaselineRevenue?: Record<string, number[]>; // Monthly baseline revenue for each affected product
  // NEW: Simple cannibalized revenue (monthly amount)
  cannibalizedRevenue?: number;
}

export interface MonthlyResult {
  month: number;
  revenue: number;
  costs: number;
  rndCosts: number;
  netCashFlow: number;
  presentValue: number;
  cumulativeCashFlow: number;
  cannibalizationLoss: number;
  phase: 'development' | 'revenue';
}

export interface NPVCalculationResult {
  npv: number;
  totalRevenue: number;
  totalCosts: number;
  totalRndCosts: number;
  totalCannibalizationLoss: number;
  monthlyNetCashFlow: number[];
  cumulativeNPV: number[];
  monthlyResults: MonthlyResult[];
  irr: number;
  paybackPeriodMonths: number; // Renamed from breakEvenMonths - nominal cash recovery
  npvBreakEvenMonths: number; // NEW - when cumulative discounted cash flow turns positive
  totalProjectedRevenue: number;
  totalProjectedProfit: number;
  averageAnnualProfitMargin: number;
  paybackPeriod?: number; // Deprecated - use paybackPeriodMonths instead
  breakEvenMonths?: number; // Deprecated - use paybackPeriodMonths instead
  marketName: string;
  currency: string;
}

export class NPVCalculationService {
  calculateMarketNPV(input: NPVCalculationInput): NPVCalculationResult {
  const { 
    revenue, 
    costs, 
    discountRate, 
    rndCosts, 
    rndTimingMonths, 
    developmentPhaseMonths,
    affectedProducts = [],
    affectedProductsBaselineRevenue = {},
    cannibalizedRevenue = 0, // NEW: Simple cannibalized revenue
    marketName,
    currency
  } = input;
  
  // Use the configurable discount rate
  const monthlyDiscountRate = discountRate / 100 / 12;
  console.log(`NPV Calculation for ${marketName} - Using discount rate: ${discountRate}% (monthly: ${monthlyDiscountRate})`);
  
  let npv = 0;
  let totalRevenue = 0;
  let totalCosts = 0;
  let totalRndCosts = 0;
  let totalCannibalizationLoss = 0;
  let cumulativeCashFlow = 0;
  let paybackPeriodMonths = -1; // Nominal cash recovery (undiscounted)
  let npvBreakEvenMonths = -1; // NPV breakeven (discounted cash flow)
  
  const monthlyNetCashFlow: number[] = [];
  const cumulativeNPV: number[] = [];
  const monthlyResults: MonthlyResult[] = [];
  
  // Calculate total months including development phase
  const totalMonths = developmentPhaseMonths + revenue.length;
  
  console.log(`Timeline: ${developmentPhaseMonths} months development + ${revenue.length} months operation = ${totalMonths} total months`);
  
  for (let month = 0; month < totalMonths; month++) {
    let monthlyRevenue = 0;
    let monthlyCosts = 0;
    let monthlyRndCosts = 0;
    let cannibalizationLoss = 0;
    
    // Development phase (before revenue starts)
    if (month < developmentPhaseMonths) {
      // Calculate R&D costs during development phase - these are expenses (negative cash flow)
      monthlyRndCosts += this.calculateMonthlyRndCost(month, rndCosts.workCosts, rndTimingMonths.workCostsSpread);
      monthlyRndCosts += this.calculateMonthlyRndCost(month, rndCosts.materialMachineCosts, rndTimingMonths.materialMachineSpread);
      monthlyRndCosts += this.calculateMonthlyRndCost(month, rndCosts.startupProductionCosts, rndTimingMonths.startupProductionSpread);
      monthlyRndCosts += this.calculateMonthlyRndCost(month, rndCosts.patentCosts, rndTimingMonths.patentSpread);
      
      console.log(`Month ${month + 1} (Development): R&D costs = ${monthlyRndCosts}`);
    } else {
      // Revenue phase (after development completion)
      const revenueMonth = month - developmentPhaseMonths;
      if (revenueMonth < revenue.length) {
        monthlyRevenue = revenue[revenueMonth];
        monthlyCosts = costs[revenueMonth];
        
        // Apply simple cannibalized revenue (subtract from gross revenue)
        cannibalizationLoss += cannibalizedRevenue;
        
        // Calculate progressive cannibalization impact for this month (if using advanced system)
        if (affectedProducts.length > 0) {
          for (const affectedProduct of affectedProducts) {
            const baselineRevenue = affectedProductsBaselineRevenue[affectedProduct.productId];
            if (baselineRevenue && baselineRevenue[revenueMonth]) {
              const productCannibalizationLoss = calculateProgressiveCannibalization(
                affectedProduct,
                revenueMonth + 1, // Month 1-based for calculation
                baselineRevenue[revenueMonth]
              );
              cannibalizationLoss += productCannibalizationLoss;
            }
          }
        }
        
        console.log(`Month ${month + 1} (Revenue Month ${revenueMonth + 1}): Revenue = ${monthlyRevenue}, Costs = ${monthlyCosts}, Total Cannibalization = ${cannibalizationLoss} (Simple: ${cannibalizedRevenue})`);
      }
    }
    
    // Net cash flow = Revenue - Operating Costs - R&D Costs - Cannibalization Loss
    const netCashFlow = monthlyRevenue - monthlyCosts - monthlyRndCosts - cannibalizationLoss;
    
    // Calculate present value using proper discounting
    const discountFactor = Math.pow(1 + monthlyDiscountRate, month + 1);
    const presentValue = netCashFlow / discountFactor;
    
    // Update totals
    npv += presentValue;
    totalRevenue += monthlyRevenue;
    totalCosts += monthlyCosts;
    totalRndCosts += monthlyRndCosts;
    totalCannibalizationLoss += cannibalizationLoss;
    cumulativeCashFlow += netCashFlow;
    
    monthlyNetCashFlow.push(netCashFlow);
    cumulativeNPV.push(npv);
    
    // Track payback period (when cumulative nominal cash flow turns positive)
    if (paybackPeriodMonths === -1 && cumulativeCashFlow >= 0) {
      paybackPeriodMonths = month + 1;
    }
    
    // Track NPV breakeven (when cumulative discounted cash flow/NPV turns positive)
    if (npvBreakEvenMonths === -1 && npv >= 0) {
      npvBreakEvenMonths = month + 1;
    }
    
    monthlyResults.push({
      month: month + 1, // 1-based month numbering
      revenue: monthlyRevenue,
      costs: monthlyCosts,
      rndCosts: monthlyRndCosts,
      netCashFlow,
      presentValue,
      cumulativeCashFlow,
      cannibalizationLoss,
      phase: month < developmentPhaseMonths ? 'development' : 'revenue'
    });
  }
  
  // Calculate IRR (simplified approximation)
  const irr = this.calculateIRR(monthlyNetCashFlow, monthlyDiscountRate);
  
  // Calculate payback period (months to recover initial investment)
  const paybackPeriod = this.calculatePaybackPeriod(monthlyNetCashFlow);
  
  // Calculate total projected profit
  const totalProjectedProfit = totalRevenue - totalCosts - totalRndCosts - totalCannibalizationLoss;
  
  // Calculate average annual profit margin
  const averageAnnualProfitMargin = totalRevenue > 0 ? (totalProjectedProfit / totalRevenue) * 100 : 0;
  
  console.log(`NPV Calculation Summary for ${marketName}:
    - NPV: ${npv.toFixed(2)} ${currency}
    - Total Revenue: ${totalRevenue.toFixed(2)} ${currency}
    - Total R&D Costs: ${totalRndCosts.toFixed(2)} ${currency}
    - Total Operating Costs: ${totalCosts.toFixed(2)} ${currency}
    - Total Cannibalization Loss: ${totalCannibalizationLoss.toFixed(2)} ${currency}
    - Total Projected Profit: ${totalProjectedProfit.toFixed(2)} ${currency}
    - Payback Period (nominal): Month ${paybackPeriodMonths}
    - NPV Breakeven (discounted): Month ${npvBreakEvenMonths}
    - Legacy Payback Period: ${paybackPeriod} months`);
  
  return {
    npv,
    totalRevenue,
    totalCosts,
    totalRndCosts,
    totalCannibalizationLoss,
    monthlyNetCashFlow,
    cumulativeNPV,
    monthlyResults,
    irr,
    paybackPeriodMonths: paybackPeriodMonths > 0 ? paybackPeriodMonths : -1,
    npvBreakEvenMonths: npvBreakEvenMonths > 0 ? npvBreakEvenMonths : -1,
    totalProjectedRevenue: totalRevenue,
    totalProjectedProfit,
    averageAnnualProfitMargin,
    paybackPeriod, // Legacy field
    breakEvenMonths: paybackPeriodMonths > 0 ? paybackPeriodMonths : 0, // Legacy field for backward compatibility
    marketName,
    currency
  };
}

  // Helper function to calculate monthly R&D costs during development phase
  private calculateMonthlyRndCost(currentMonth: number, totalCost: number, spreadMonths: number): number {
    if (currentMonth >= spreadMonths || spreadMonths === 0 || totalCost === 0) {
      return 0;
    }
    return totalCost / spreadMonths;
  }

  // Enhanced IRR calculation with proper handling of cash flows
  private calculateIRR(cashFlows: number[], guess: number = 0.1): number {
    if (cashFlows.length === 0) return 0;
    
    let rate = guess;
    const tolerance = 0.0001;
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let npvDerivative = 0;
      
      for (let j = 0; j < cashFlows.length; j++) {
        const factor = Math.pow(1 + rate, j + 1);
        npv += cashFlows[j] / factor;
        npvDerivative -= (j + 1) * cashFlows[j] / Math.pow(1 + rate, j + 2);
      }
      
      if (Math.abs(npv) < tolerance) {
        return rate * 12 * 100;
      }
      
      if (npvDerivative === 0) break;
      
      rate = rate - npv / npvDerivative;
      
      if (rate < -0.99) rate = -0.99;
      if (rate > 10) rate = 10;
    }
    
    return rate * 12 * 100;
  }

  // Calculate payback period in months
  private calculatePaybackPeriod(cashFlows: number[]): number {
    let cumulativeCashFlow = 0;
    
    for (let i = 0; i < cashFlows.length; i++) {
      cumulativeCashFlow += cashFlows[i];
      if (cumulativeCashFlow >= 0) {
        if (i === 0) return 1;
        
        const previousCumulative = cumulativeCashFlow - cashFlows[i];
        const interpolation = -previousCumulative / cashFlows[i];
        return i + interpolation + 1;
      }
    }
    
    return -1;
  }
}

export function calculateMarketNPV(input: NPVCalculationInput): NPVCalculationResult {
  const service = new NPVCalculationService();
  return service.calculateMarketNPV(input);
}
