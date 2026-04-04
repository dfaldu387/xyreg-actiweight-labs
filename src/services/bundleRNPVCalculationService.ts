import { NPVCalculationService } from "./npvCalculationService";
import { BundleProductInputData } from "@/types/bundleRNPV";

export class BundleRNPVCalculationService {
  private npvCalculator = new NPVCalculationService();

  /**
   * Calculate NPV for a single product in the bundle
   * @returns Full NPV calculation result including monthly cash flows
   */
  calculateProductNPV(inputData: BundleProductInputData) {
    // Generate revenue and cost arrays
    const revenue: number[] = [];
    const costs: number[] = [];
    
    for (let month = 0; month < inputData.forecastDuration; month++) {
      const year = month / 12;
      const monthlyRevenue = inputData.monthlySalesForecast * 
        inputData.initialUnitPrice * 
        Math.pow(1 + inputData.annualSalesForecastChange / 100, year) *
        Math.pow(1 + inputData.annualUnitPriceChange / 100, year);
      
      const monthlyCost = inputData.monthlySalesForecast * 
        inputData.initialVariableCost * 
        Math.pow(1 + inputData.annualSalesForecastChange / 100, year) *
        Math.pow(1 + inputData.annualVariableCostChange / 100, year) +
        inputData.allocatedMonthlyFixedCosts * 
        Math.pow(1 + inputData.annualFixedCostChange / 100, year);
      
      revenue.push(monthlyRevenue);
      costs.push(monthlyCost);
    }

    return this.npvCalculator.calculateMarketNPV({
      revenue,
      costs,
      discountRate: inputData.discountRate,
      years: inputData.forecastDuration / 12,
      marketName: inputData.marketCode,
      currency: 'USD',
      rndCosts: {
        workCosts: inputData.rndWorkCosts,
        materialMachineCosts: inputData.rndMaterialMachineCosts,
        startupProductionCosts: inputData.rndStartupProductionCosts,
        patentCosts: inputData.rndPatentCosts,
      },
      rndTimingMonths: {
        workCostsSpread: inputData.rndWorkCostsSpread,
        materialMachineSpread: inputData.rndMaterialMachineSpread,
        startupProductionSpread: inputData.rndStartupProductionSpread,
        patentSpread: inputData.rndPatentSpread,
      },
      developmentPhaseMonths: inputData.developmentPhaseMonths,
      affectedProducts: inputData.affectedProducts,
      cannibalizedRevenue: inputData.cannibalizedRevenue,
    });
  }

  /**
   * Calculate total bundle NPV by aggregating individual product NPVs
   */
  calculateBundleNPV(productInputs: BundleProductInputData[]) {
    const productResults = productInputs.map(input => {
      const calculationResult = this.calculateProductNPV(input);
      return {
        productId: input.productId,
        siblingGroupId: input.siblingGroupId,
        productName: input.productName,
        marketCode: input.marketCode,
        npv: calculationResult.npv,
        contributionPercent: 0,
        calculationResult,
      };
    });

    const totalBundleNPV = productResults.reduce((sum, result) => sum + result.npv, 0);

    productResults.forEach(result => {
      result.contributionPercent = totalBundleNPV !== 0 ? (result.npv / totalBundleNPV) * 100 : 0;
    });

    return { totalBundleNPV, productResults };
  }

  /**
   * Calculate sensitivity analysis by varying key parameters
   */
  calculateSensitivityAnalysis(baseInputs: BundleProductInputData[]) {
    const baseNPV = this.calculateBundleNPV(baseInputs).totalBundleNPV;
    
    // Sensitivity parameters: +/- 10% variation
    const variation = 0.1;
    
    // Test discount rate sensitivity
    const discountRateOptimistic = baseInputs.map(input => ({
      ...input,
      discountRate: input.discountRate * (1 - variation)
    }));
    const discountRatePessimistic = baseInputs.map(input => ({
      ...input,
      discountRate: input.discountRate * (1 + variation)
    }));
    
    // Test unit price sensitivity
    const priceOptimistic = baseInputs.map(input => ({
      ...input,
      initialUnitPrice: input.initialUnitPrice * (1 + variation)
    }));
    const pricePessimistic = baseInputs.map(input => ({
      ...input,
      initialUnitPrice: input.initialUnitPrice * (1 - variation)
    }));
    
    // Test sales volume sensitivity
    const volumeOptimistic = baseInputs.map(input => ({
      ...input,
      monthlySalesForecast: input.monthlySalesForecast * (1 + variation)
    }));
    const volumePessimistic = baseInputs.map(input => ({
      ...input,
      monthlySalesForecast: input.monthlySalesForecast * (1 - variation)
    }));
    
    // Test variable cost sensitivity
    const costOptimistic = baseInputs.map(input => ({
      ...input,
      initialVariableCost: input.initialVariableCost * (1 - variation)
    }));
    const costPessimistic = baseInputs.map(input => ({
      ...input,
      initialVariableCost: input.initialVariableCost * (1 + variation)
    }));
    
    return [
      {
        parameter: 'Discount Rate',
        baseCase: baseNPV,
        optimistic: this.calculateBundleNPV(discountRateOptimistic).totalBundleNPV,
        pessimistic: this.calculateBundleNPV(discountRatePessimistic).totalBundleNPV,
      },
      {
        parameter: 'Unit Price',
        baseCase: baseNPV,
        optimistic: this.calculateBundleNPV(priceOptimistic).totalBundleNPV,
        pessimistic: this.calculateBundleNPV(pricePessimistic).totalBundleNPV,
      },
      {
        parameter: 'Sales Volume',
        baseCase: baseNPV,
        optimistic: this.calculateBundleNPV(volumeOptimistic).totalBundleNPV,
        pessimistic: this.calculateBundleNPV(volumePessimistic).totalBundleNPV,
      },
      {
        parameter: 'Variable Costs',
        baseCase: baseNPV,
        optimistic: this.calculateBundleNPV(costOptimistic).totalBundleNPV,
        pessimistic: this.calculateBundleNPV(costPessimistic).totalBundleNPV,
      },
    ];
  }

  compareScenarios(scenario1Inputs: BundleProductInputData[], scenario2Inputs: BundleProductInputData[]) {
    const scenario1 = this.calculateBundleNPV(scenario1Inputs);
    const scenario2 = this.calculateBundleNPV(scenario2Inputs);
    const difference = scenario2.totalBundleNPV - scenario1.totalBundleNPV;
    const percentChange = scenario1.totalBundleNPV !== 0 ? (difference / scenario1.totalBundleNPV) * 100 : 0;

    return {
      scenario1NPV: scenario1.totalBundleNPV,
      scenario2NPV: scenario2.totalBundleNPV,
      difference,
      percentChange,
    };
  }
}
