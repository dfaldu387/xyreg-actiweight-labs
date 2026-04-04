export interface EfficiencyKPIData {
  oee: {
    percentage: number;
    availability: number;
    performance: number;
    quality: number;
    trend: number;
    sparklineData: Array<{ period: string; value: number }>;
  };
  throughput: {
    units: number;
    timeFrame: string;
    trend: number;
    sparklineData: Array<{ period: string; value: number }>;
  };
  cycleTime: {
    hours: number;
    trend: number;
    sparklineData: Array<{ period: string; value: number }>;
  };
  firstPassYield: {
    percentage: number;
    trend: number;
    sparklineData: Array<{ period: string; value: number }>;
  };
  manufacturingCost: {
    cost: number;
    currency: string;
    trend: number;
    sparklineData: Array<{ period: string; value: number }>;
  };
  capacityUtilization: {
    percentage: number;
    trend: number;
    sparklineData: Array<{ period: string; value: number }>;
  };
}

export interface EfficiencyFilters {
  dateRange: {
    start: Date;
    end: Date;
    preset?: 'last7days' | 'last30days' | 'thisQuarter' | 'custom';
  };
  productLine?: string;
  facility?: string;
}

export interface EfficiencyMetricDefinition {
  name: string;
  formula: string;
  description: string;
}