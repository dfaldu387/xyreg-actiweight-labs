export interface InflationAdjustment {
  baseYear: number;
  targetYear: number;
  inflationRate: number;
  adjustedAmount: number;
  totalInflation: number;
}

export interface DeviceClassMultiplier {
  deviceClass: string;
  baseMultiplier: number;
  categoryMultipliers: Record<string, number>;
  description: string;
}

export interface CostScenario {
  name: 'conservative' | 'typical' | 'aggressive';
  label: string;
  description: string;
  multiplier: number;
  confidenceLevel: number;
}

export class SmartCostIntelligence {
  // Device class complexity multipliers
  private static deviceClassMultipliers: Record<string, DeviceClassMultiplier> = {
    'Class I': {
      deviceClass: 'Class I',
      baseMultiplier: 0.6,
      categoryMultipliers: {
        regulatory: 0.4,
        clinical: 0.3,
        manufacturing: 0.8,
        marketing: 0.9,
        distribution: 1.0,
        maintenance: 0.7
      },
      description: 'Low risk devices with simplified regulatory pathways'
    },
    'Class II': {
      deviceClass: 'Class II',
      baseMultiplier: 1.0,
      categoryMultipliers: {
        regulatory: 1.0,
        clinical: 1.0,
        manufacturing: 1.0,
        marketing: 1.0,
        distribution: 1.0,
        maintenance: 1.0
      },
      description: 'Moderate risk devices (baseline for cost calculations)'
    },
    'Class III': {
      deviceClass: 'Class III',
      baseMultiplier: 2.5,
      categoryMultipliers: {
        regulatory: 3.0,
        clinical: 4.0,
        manufacturing: 1.8,
        marketing: 1.2,
        distribution: 1.1,
        maintenance: 2.0
      },
      description: 'High risk devices requiring extensive validation'
    },
    'Class IV': {
      deviceClass: 'Class IV',
      baseMultiplier: 3.5,
      categoryMultipliers: {
        regulatory: 4.0,
        clinical: 5.0,
        manufacturing: 2.2,
        marketing: 1.3,
        distribution: 1.2,
        maintenance: 2.5
      },
      description: 'Highest risk devices (Canada/Australia classification)'
    }
  };

  // Cost scenarios
  private static costScenarios: Record<string, CostScenario> = {
    conservative: {
      name: 'conservative',
      label: 'Conservative (High)',
      description: 'Pessimistic scenario with higher costs and longer timelines',
      multiplier: 1.4,
      confidenceLevel: 90
    },
    typical: {
      name: 'typical',
      label: 'Typical (Most Likely)',
      description: 'Expected scenario based on historical data',
      multiplier: 1.0,
      confidenceLevel: 50
    },
    aggressive: {
      name: 'aggressive',
      label: 'Aggressive (Low)',
      description: 'Optimistic scenario with lower costs and faster execution',
      multiplier: 0.7,
      confidenceLevel: 10
    }
  };

  static calculateInflationAdjustment(
    baseAmount: number,
    launchDate: Date,
    inflationRate: number = 0.03
  ): InflationAdjustment {
    const currentYear = new Date().getFullYear();
    const targetYear = launchDate.getFullYear();
    const yearsFromNow = Math.max(0, targetYear - currentYear);
    
    const totalInflation = Math.pow(1 + inflationRate, yearsFromNow) - 1;
    const adjustedAmount = baseAmount * (1 + totalInflation);

    return {
      baseYear: currentYear,
      targetYear,
      inflationRate,
      adjustedAmount: Math.round(adjustedAmount),
      totalInflation
    };
  }

  static applyDeviceClassMultiplier(
    baseCost: number,
    deviceClass: string,
    costCategory: string
  ): number {
    const multiplier = this.deviceClassMultipliers[deviceClass];
    if (!multiplier) {
      console.warn(`Unknown device class: ${deviceClass}`);
      return baseCost;
    }

    const categoryMultiplier = multiplier.categoryMultipliers[costCategory] || multiplier.baseMultiplier;
    return Math.round(baseCost * categoryMultiplier);
  }

  static applyCostScenario(
    baseCost: number,
    scenario: 'conservative' | 'typical' | 'aggressive'
  ): number {
    const scenarioData = this.costScenarios[scenario];
    if (!scenarioData) {
      console.warn(`Unknown cost scenario: ${scenario}`);
      return baseCost;
    }

    return Math.round(baseCost * scenarioData.multiplier);
  }

  static getDeviceClassInfo(deviceClass: string): DeviceClassMultiplier | null {
    return this.deviceClassMultipliers[deviceClass] || null;
  }

  static getCostScenarios(): CostScenario[] {
    return Object.values(this.costScenarios);
  }

  static getCostScenario(scenario: string): CostScenario | null {
    return this.costScenarios[scenario] || null;
  }

  static calculateSmartCost(
    baseCost: number,
    options: {
      deviceClass: string;
      costCategory: string;
      scenario: 'conservative' | 'typical' | 'aggressive';
      launchDate: Date;
      inflationRate?: number;
      targetCurrency?: string;
      baseCurrency?: string;
    }
  ): {
    originalCost: number;
    deviceClassAdjusted: number;
    scenarioAdjusted: number;
    inflationAdjusted: number;
    finalCost: number;
    adjustments: {
      deviceClass: number;
      scenario: number;
      inflation: InflationAdjustment;
    };
  } {
    // Step 1: Apply device class multiplier
    const deviceClassAdjusted = this.applyDeviceClassMultiplier(
      baseCost,
      options.deviceClass,
      options.costCategory
    );

    // Step 2: Apply scenario multiplier
    const scenarioAdjusted = this.applyCostScenario(
      deviceClassAdjusted,
      options.scenario
    );

    // Step 3: Apply inflation adjustment
    const inflationAdjustment = this.calculateInflationAdjustment(
      scenarioAdjusted,
      options.launchDate,
      options.inflationRate
    );

    const finalCost = inflationAdjustment.adjustedAmount;

    return {
      originalCost: baseCost,
      deviceClassAdjusted,
      scenarioAdjusted,
      inflationAdjusted: finalCost,
      finalCost,
      adjustments: {
        deviceClass: deviceClassAdjusted / baseCost,
        scenario: scenarioAdjusted / deviceClassAdjusted,
        inflation: inflationAdjustment
      }
    };
  }

  static getMarketComplexityFactor(marketCode: string): number {
    // Market complexity factors based on regulatory environment
    const complexityFactors: Record<string, number> = {
      US: 1.2,   // Complex FDA processes
      EU: 1.1,   // Harmonized but still complex
      JP: 1.3,   // Very complex PMDA requirements
      CA: 0.9,   // Streamlined processes
      AU: 0.8,   // Efficient TGA
      BR: 1.0,   // Moderate complexity
      CN: 1.4,   // Complex and evolving regulations
      IN: 1.1,   // Growing complexity
      GB: 0.9    // Post-Brexit streamlined
    };

    return complexityFactors[marketCode] || 1.0;
  }

  static calculateRiskPremium(
    baseCost: number,
    riskFactors: {
      technicalRisk: 'low' | 'medium' | 'high';
      regulatoryRisk: 'low' | 'medium' | 'high';
      marketRisk: 'low' | 'medium' | 'high';
    }
  ): number {
    const riskMultipliers = {
      low: 1.0,
      medium: 1.15,
      high: 1.35
    };

    const avgRiskMultiplier = (
      riskMultipliers[riskFactors.technicalRisk] +
      riskMultipliers[riskFactors.regulatoryRisk] +
      riskMultipliers[riskFactors.marketRisk]
    ) / 3;

    return Math.round(baseCost * avgRiskMultiplier);
  }
}