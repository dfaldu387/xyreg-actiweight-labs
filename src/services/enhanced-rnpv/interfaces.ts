// Enhanced rNPV Model Interfaces - Multi-Factor Phase-Gated Implementation

export interface MarketExtension {
  id: string;
  productId: string;
  companyId: string;
  marketCode: string;
  marketName: string;
  isActive: boolean;
  revenueForecast: MarketRevenueForecast;
  marketSpecificCosts: MarketCosts;
  regulatoryPhases: RegulatoryPhase[];
  commercialFactors: CommercialFactor[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketRevenueForecast {
  currency: string;
  discountRate: number;
  launchDate: Date;
  monthlyRevenue: MonthlyRevenue[];
  peakRevenue?: number;
  totalAddressableMarket?: number;
  marketPenetration?: number;
}

export interface MonthlyRevenue {
  month: number; // months from launch
  revenue: number;
  confidence: number; // 0-100
}

export interface MarketCosts {
  currency: string;
  regulatorySubmissionFees: number;
  clinicalTrialCosts: number;
  marketingInvestment: number;
  distributionCosts: number;
  maintenanceCosts: number;
  additionalCosts: CostItem[];
}

export interface CostItem {
  name: string;
  amount: number;
  phaseId?: string;
  timing: 'upfront' | 'recurring' | 'milestone';
}

export interface RegulatoryPhase {
  id: string;
  name: string;
  description: string;
  marketCode: string;
  likelihoodOfApproval: number; // 0-100
  timelineMonths: number;
  costs: number;
  dependencies: string[]; // phase IDs this depends on
  position: number;
}

export interface CommercialFactor {
  id: string;
  name: string;
  description: string;
  likelihoodOfSuccess: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  timelineMonths: number;
  marketCodes: string[];
  dependencies: string[];
}

export interface RNPVScenario {
  id: string;
  productId: string;
  companyId: string;
  scenarioName: string;
  scenarioDescription?: string;
  coreProjectConfig: CoreProjectConfiguration;
  activeMarkets: string[]; // market codes
  loaAdjustments: Record<string, number>; // phaseId -> adjusted LoA
  isBaseline: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CoreProjectConfiguration {
  projectName: string;
  discountRate: number;
  currency: string;
  developmentPhases: DevelopmentPhase[];
  totalInvestment: number;
  projectTimeline: ProjectTimeline;
}

export interface DevelopmentPhase {
  id: string;
  name: string;
  description: string;
  likelihoodOfSuccess: number; // LoS: 0-100 (renamed from likelihoodOfApproval)
  duration: number; // months
  costs: number;
  startMonth: number;
  dependencies: string[];
  isMarketAgnostic: boolean;
  isContinuous?: boolean; // For continuous phases like Risk Management
  preLaunchCosts?: number; // Costs occurring before launch
  postLaunchCosts?: number; // Recurring costs after launch
  recurringCostFrequency?: 'monthly' | 'quarterly' | 'yearly';
}

export interface ProjectTimeline {
  startDate: Date;
  developmentDurationMonths: number;
  expectedLaunchDate: Date;
  postLaunchAnalysisPeriodMonths: number;
}

export interface RNPVCalculationResult {
  id: string;
  scenarioId: string;
  productId: string;
  companyId: string;
  calculationType: 'core_project' | 'market_extension' | 'total_portfolio';
  marketCode?: string;
  
  // Main results
  expectedCostPV: number;
  expectedRevenuePV: number;
  rnpvValue: number;
  
  // Risk components
  cumulativeTechnicalLoA: number;
  cumulativeCommercialLoA: number;
  
  // Detailed calculations
  phaseCalculations: PhaseCalculation[];
  calculationMetadata: CalculationMetadata;
  
  calculatedAt: Date;
  calculationVersion: string;
}

export interface PhaseCalculation {
  phaseId: string;
  phaseName: string;
  phaseType: 'development' | 'regulatory' | 'commercial';
  
  // Inputs
  cost: number;
  revenue?: number;
  likelihoodOfApproval: number;
  
  // Calculated values
  cumulativeLoAToPreviousPhases: number;
  expectedCost: number;
  expectedRevenue?: number;
  presentValueCost: number;
  presentValueRevenue?: number;
  
  // Timeline
  startMonth: number;
  endMonth: number;
  
  // Continuous phase support
  isContinuous?: boolean;
  preLaunchComponent?: ContinuousPhaseComponent;
  postLaunchComponent?: ContinuousPhaseComponent;
}

export interface ContinuousPhaseComponent {
  cost: number;
  expectedCost: number;
  presentValueCost: number;
  periodStartMonth: number;
  periodEndMonth: number;
  costType: 'upfront' | 'recurring';
  frequency?: 'monthly' | 'quarterly' | 'yearly';
}

export interface CalculationMetadata {
  totalPhases: number;
  totalMarkets: number;
  baselineCurrency: string;
  calculationMethod: 'phase_gated_rnpv' | 'enhanced_phase_gated_rnpv';
  assumptions: Record<string, any>;
  sensitivityAnalysis?: SensitivityAnalysis;
}

export interface SensitivityAnalysis {
  discountRateRange: { min: number; max: number };
  loaRange: { min: number; max: number };
  impactOnRNPV: Record<string, number>;
}

export interface ExpertLoAAssessment {
  id: string;
  productId: string;
  companyId: string;
  phaseId: string;
  expertUserId: string;
  expertEmail?: string;
  expertName?: string;
  expertRole?: string;
  
  // Assessment details
  assessedLoA: number; // 0-100
  confidenceLevel: 'low' | 'medium' | 'high';
  justification?: string;
  riskFactors: RiskFactor[];
  
  // Workflow
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  requestedAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskFactor {
  category: 'technical' | 'regulatory' | 'commercial' | 'competitive';
  description: string;
  impact: 'low' | 'medium' | 'high';
  probability: number; // 0-100
  mitigation?: string;
}

// What-if Analysis Interfaces
export interface WhatIfScenarioOptions {
  adjustLoA: Record<string, number>; // phaseId -> new LoA
  toggleMarkets: string[]; // market codes to toggle
  adjustDiscountRate?: number;
  adjustRevenueForecast?: Record<string, number>; // marketCode -> multiplier
  adjustCosts?: Record<string, number>; // phaseId -> multiplier
}

export interface WhatIfResult {
  originalRNPV: number;
  adjustedRNPV: number;
  deltaRNPV: number;
  deltaPercentage: number;
  keyDrivers: string[];
  recommendations: string[];
}

// Portfolio Analysis Interfaces
export interface PortfolioRNPVAnalysis {
  totalPortfolioRNPV: number;
  marketBreakdown: Record<string, number>;
  riskAdjustedValue: number;
  optimalMarketPriority: string[];
  sensitivityToMarketChanges: Record<string, number>;
}