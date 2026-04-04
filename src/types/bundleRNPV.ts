import { AffectedProduct } from "@/types/affectedProducts";

// Database table types matching bundle_rnpv_analyses
export interface BundleRNPVAnalysis {
  id: string;
  bundle_id: string;
  scenario_name: string;
  total_bundle_rnpv: number;
  currency: string;
  calculation_date: string;
  created_at: string;
  updated_at: string;
}

// Database table types matching bundle_product_rnpv_inputs
export interface BundleProductRNPVInput {
  id: string;
  bundle_analysis_id: string;
  product_id?: string;
  sibling_group_id?: string;
  market_code: string;
  
  // Market timing
  market_launch_date?: string;
  forecast_duration: number;
  development_phase_months: number;
  
  // Revenue inputs
  monthly_sales_forecast: number;
  annual_sales_forecast_change: number;
  initial_unit_price: number;
  annual_unit_price_change: number;
  
  // Cost inputs
  initial_variable_cost: number;
  annual_variable_cost_change: number;
  allocated_monthly_fixed_costs: number;
  annual_fixed_cost_change: number;
  
  // R&D costs
  rnd_work_costs: number;
  rnd_work_costs_spread: number;
  rnd_material_machine_costs: number;
  rnd_material_machine_spread: number;
  rnd_startup_production_costs: number;
  rnd_startup_production_spread: number;
  rnd_patent_costs: number;
  rnd_patent_spread: number;
  
  // Marketing
  total_marketing_budget: number;
  marketing_spread_months: number;
  
  // Financial
  royalty_rate: number;
  discount_rate: number;
  
  // Patent
  patent_expiry: number;
  post_patent_decline_rate: number;
  
  // Cannibalization
  cannibalized_revenue: number;
  affected_products: AffectedProduct[];
  
  // Results
  product_npv: number;
  
  created_at: string;
  updated_at: string;
}

// Frontend working types
export interface BundleProductInputData {
  productId?: string;
  siblingGroupId?: string;
  productName: string;
  marketCode: string;
  marketLaunchDate?: Date;
  forecastDuration: number;
  developmentPhaseMonths: number;
  monthlySalesForecast: number;
  annualSalesForecastChange: number;
  initialUnitPrice: number;
  annualUnitPriceChange: number;
  initialVariableCost: number;
  annualVariableCostChange: number;
  allocatedMonthlyFixedCosts: number;
  annualFixedCostChange: number;
  rndWorkCosts: number;
  rndWorkCostsSpread: number;
  rndMaterialMachineCosts: number;
  rndMaterialMachineSpread: number;
  rndStartupProductionCosts: number;
  rndStartupProductionSpread: number;
  rndPatentCosts: number;
  rndPatentSpread: number;
  totalMarketingBudget: number;
  marketingSpreadMonths: number;
  royaltyRate: number;
  discountRate: number;
  patentExpiry: number;
  postPatentDeclineRate: number;
  cannibalizedRevenue: number;
  affectedProducts: AffectedProduct[];
}

export interface BundleRNPVResult {
  totalBundleNPV: number;
  productBreakdown: Array<{
    productId?: string;
    siblingGroupId?: string;
    productName: string;
    marketCode: string;
    npv: number;
    contributionPercent: number;
  }>;
  scenarioName: string;
  currency: string;
  calculationDate: Date;
}

export interface CashFlowDataPoint {
  month: number;
  cumulativeCashFlow: number;
  productId?: string;
  productName?: string;
}

export interface SensitivityDataPoint {
  parameter: string;
  baseCase: number;
  optimistic: number;
  pessimistic: number;
}

export interface BundleRNPVScenario {
  id: string;
  scenarioName: string;
  bundleId: string;
  totalNPV: number;
  productCount: number;
  createdAt: Date;
}
