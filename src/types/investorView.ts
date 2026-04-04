import type { 
  MarketSizing, 
  ReimbursementStrategy, 
  TeamGaps, 
  RegulatoryTimeline, 
  ClinicalEvidencePlan, 
  ReadinessGates 
} from './investorModules';
import type { RiskSummaryData } from '@/components/investor-view/InvestorRiskSummary';
import type { ScoreBreakdownItem } from '@/services/calculateViabilityScore';

export interface CategoryScoreWithBreakdown {
  score: number;
  maxScore: number;
  source: string;
  breakdown?: ScoreBreakdownItem[];
}

export interface MediaItem {
  type: 'image' | 'video' | '3d';
  url: string;
  label: string;
  thumbnailUrl?: string;
}

export interface VentureBlueprintStep {
  id: number;
  title: string;
  notes: string;
  phaseId: number;
  phaseTitle: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
}

export interface InvestorViewData {
  // Share Settings ID (for investor deal tracker)
  shareSettingsId: string;
  
  // Company and Product IDs (for monitor access requests)
  companyId: string;
  productId: string;
  
  // Company/Founder Info
  companyName: string;
  companyLogo?: string;
  founderEmail: string;
  
  // Product name for display at top
  productName: string;
  
  // Media Gallery
  mediaItems: MediaItem[];
  
  // Viability Snapshot
  viabilityScore: number;
  regulatoryScore: number;
  clinicalScore: number;
  reimbursementScore: number;
  technicalScore: number;
  intendedPurpose: string;
  description: string;
  deviceBadges: string[];
  
  // Score Breakdown for popup
  scoreBreakdown?: {
    regulatory: CategoryScoreWithBreakdown;
    clinical: CategoryScoreWithBreakdown;
    reimbursement: CategoryScoreWithBreakdown;
    technical: CategoryScoreWithBreakdown;
    missingInputs: string[];
  };
  
  // Value Proposition & Key Features
  actualValueProposition: string;
  keyFeatures: string[];

  // TRL (Technology Readiness Level)
  trlLevel: number | null;
  trlLabel: string | null;
  trlDescription: string | null;
  trlNotes: string | null;

  // System Architecture
  systemArchitecture: 'samd' | 'simd' | 'no_software' | null;

  // Funding Requirements
  fundingAmount: number | null;
  fundingCurrency: string | null;
  fundingStage: string | null;
  
  // Venture Blueprint (investor-relevant steps 1-8)
  ventureBlueprintSteps: VentureBlueprintStep[];
  
  // Technical & Regulatory Profile - Device Characteristics
  primaryRegulatoryType: string;
  coreDeviceNature: string | null;
  isActiveDevice: boolean | null;
  targetMarket: string;
  classification: string;
  
  // Business Canvas (all 9 sections)
  keyPartners: string;
  keyActivities: string;
  keyResources: string;
  valuePropositions: string;
  customerRelationships: string;
  channels: string;
  customerSegments: string;
  costStructure: string;
  revenueStreams: string;
  
  // Timeline
  currentPhase: 'concept-planning' | 'design-inputs' | 'design-development' | 'verification-validation' | 'transfer-production' | 'market-surveillance';
  phaseDates?: {
    phaseId: string;
    startDate?: string;
    endDate?: string;
  }[];
  
  // Team Profile
  teamMembers: TeamMember[];
  
  // Verification
  isVerified: boolean;
  generatedAt: string;
  
  // Visibility settings
  showViabilityScore: boolean;
  showTechnicalSpecs: boolean;
  showMediaGallery: boolean;
  showBusinessCanvas: boolean;
  showRoadmap: boolean;
  showTeamProfile: boolean;
  showVentureBlueprint: boolean;
  // Investor Deep Dive Modules
  showMarketSizing: boolean;
  showReimbursementStrategy: boolean;
  showTeamGaps: boolean;
  showRegulatoryTimeline: boolean;
  showClinicalEvidence: boolean;
  showReadinessGates: boolean;
  showUseOfProceeds: boolean;
  showManufacturing: boolean;
  showExitStrategy: boolean;
  // Investor Deep Dive Data
  marketSizingData: MarketSizing | null;
  reimbursementStrategyData: ReimbursementStrategy | null;
  teamGapsData: TeamGaps | null;
  regulatoryTimelineData: RegulatoryTimeline | null;
  clinicalEvidenceData: ClinicalEvidencePlan | null;
  readinessGatesData: ReadinessGates | null;
  useOfProceedsData: UseOfProceedsData | null;
  manufacturingData: ManufacturingData | null;
  exitStrategyData: ExitStrategyViewData | null;
  
  // Risk Summary (Executive level)
  showRiskSummary: boolean;
  riskSummaryData: RiskSummaryData | null;
  
  // Revenue/NPV Data for Lifecycle Chart
  launchDate?: string | null;
  npvData?: {
    npv: number;
    marketInputData?: Record<string, any>;
  } | null;

  // Selected market code for chart
  selectedMarketCode?: string;

  // Part II: Stakeholder Profiles (Steps 8-9)
  stakeholderProfilesData?: {
    intendedPatientPopulation?: string[];
    environmentOfUse?: string[];
    intendedUsers?: string;
    clinicalBenefits?: string;
    buyerType?: string;
    budgetType?: string;
    salesCycleWeeks?: number;
  } | null;

  // Part II: Target Markets (Step 10)
  marketsData?: {
    code: string;
    name: string;
    selected: boolean;
    riskClass?: string;
    regulatoryStatus?: string;
    marketLaunchStatus?: string;
    launchDate?: string;
  }[];
  territoryPriority?: {
    code: string;
    name: string;
    priority: number;
    rationale?: string;
  }[];

  // Part II: Competitor Analysis (Step 12)
  competitorsData?: {
    id: string;
    competitor_company: string;
    product_name?: string;
    market?: string;
    device_classification?: string;
    regulatory_status?: string;
    market_share_estimate?: number | string;
    homepage_url?: string;
  }[];

  // Part III: IP Strategy (Step 13)
  ipStrategyData?: {
    assets: { id: string; type: string; title: string; status: string; filingDate?: string; expiryDate?: string | null; jurisdiction?: string | null; }[];
    ftoStatus: string | null;
    ftoCertainty: string | null;
    ftoNotes: string | null;
  } | null;

  // Part III: HEOR (Step 15)
  heorData?: {
    healthEconomicsEvidence: string | null;
    heorAssumptions: string | null;
    heorByMarket: Record<string, any> | null;
  } | null;

  // Part III: GTM Strategy Data (Step 18)
  gtmData?: {
    channels: any[];
    buyerPersona: string | null;
    salesCycleWeeks: number | null;
    budgetCycle: string | null;
  } | null;

  // Part V: Strategic Partners (Step 20)
  strategicPartnersData?: {
    distributionPartners: { name: string; markets: string[] }[];
    clinicalPartners: { name: string; markets: string[] }[];
    regulatoryPartners: { name: string; markets: string[] }[];
    notifiedBodies: { name: string; nbNumber: number; markets: string[] }[];
    hasNotifiedBodyRequirement: boolean;
    notifiedBodyStatus: 'not_needed' | 'not_defined' | 'assigned' | null;
  } | null;

  // Target population & use environment
  targetPopulation?: string[];
  useEnvironment?: string[];

  // GTM Strategy visibility
  showGTMStrategy?: boolean;
}

// Types for new Genesis sections
export interface UseOfProceedsData {
  rd_percent: number | null;
  rd_activities: string | null;
  regulatory_percent: number | null;
  regulatory_activities: string | null;
  team_percent: number | null;
  team_activities: string | null;
  commercial_percent: number | null;
  commercial_activities: string | null;
  operations_percent: number | null;
  operations_activities: string | null;
  total_raise_amount: number | null;
  raise_currency: string;
}

export interface ManufacturingData {
  current_stage: string | null;
  commercial_location: string | null;
  commercial_model: string | null;
  cmo_partners: {
    name: string;
    status: string;
    notes?: string;
  }[];
  cogs_at_scale: number | null;
  cogs_at_scale_currency: string;
  single_source_components: {
    component: string;
    supplier: string;
    risk_level: 'low' | 'medium' | 'high';
  }[];
  supply_chain_risks: string | null;
  notes: string | null;
}

export interface ExitStrategyViewData {
  potential_acquirers: {
    id: string;
    name: string;
    type: 'strategic' | 'private_equity' | 'other';
    rationale: string;
    acquisition_history?: string;
  }[];
  comparable_transactions: {
    id: string;
    target_company: string;
    acquirer: string;
    date: string;
    deal_value?: string;
    multiple_type?: 'revenue' | 'ebitda';
    multiple_value?: number;
  }[];
  strategic_rationale: string | null;
  exit_timeline_years: number | null;
  preferred_exit_type: string | null;
  selected_endgame: string | null;
  endgame_metrics_focus: string | null;
}
