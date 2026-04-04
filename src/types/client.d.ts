import { TechApplicability, DocumentTechApplicability } from './documentTypes';

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  description?: string;
  status?: string;
  version?: string;
  lastUpdated?: string;
  phases: string[];
  reviewers: ReviewerItem[];
  techApplicability?: DocumentTechApplicability;
  // Core content protection flags
  isPredefinedCore?: boolean;
  isActiveForCompany?: boolean;
}

export interface ReviewerItem {
  id: string;
  name: string;
  email: string;
  role?: string;
  status?: "Pending" | "Approved" | "Rejected";
  lastAction?: string;
}

export interface LifecycleDocument {
  id?: string;
  name: string;
  status: string;
  deadline?: string;
  description?: string;
  type?: string;
  classes?: string[];
}

export interface ProductPhase {
  id: string;
  name: string;
  description: string;
  status: "Completed" | "In Progress" | "Not Started";
  deadline?: Date;
  isCurrentPhase?: boolean;
  position: number;
  company_id: string;
  progress: number;
  phase_id?: string;
  _matchAttempts?: string; // Added property for debugging purposes
}

export interface PhaseGroup {
  id: string;
  name: string;
  position: number;
  is_default: boolean;
  is_deletable: boolean;
  company_id: string;
  phases?: ProductPhase[];
}

export interface Client {
  id: string;
  name: string;
  country: string;
  products: number;
  progress: number;
  status: "On Track" | "At Risk" | "Needs Attention";
  alerts: string[];
}

// ProductMarket interface
export interface ProductMarket {
  code: string;
  selected: boolean;
  riskClass?: string;
  regulatoryStatus?: string;
  reauditTimeline?: string | Date;
  customReauditTimeline?: boolean;
}

export interface EnhancedProductMarket extends ProductMarket {
  name: string; // Add required name property
  
  // Launch information
  launchDate?: string | Date;
  
  // Certification information
  certificateNumber?: string;
  certificateType?: string;

  // Component-based classification for procedure packs and SiMD
  componentClassification?: {
    components: Array<{
      id: string;
      name: string;
      description?: string;
      riskClass: string;
      componentType: 'device' | 'software';
    }>;
    overallRiskClass?: string;
  };
  
  // Regulatory requirements
  conformityAssessmentRoute?: string;
  clinicalTrialsRequired?: boolean;
  labelingRequirements?: string[];
  
  // Post-market requirements
  pmsRequirement?: string;
  pmcfRequired?: boolean;
  
  // Additional market-specific data
  udiRequirements?: string;
  customRequirements?: string;
  
  // New fields for NPV analysis
  localAuthorizedRep?: string;
  marketLaunchStatus?: string;
  approvalExpiryDate?: string | Date;
  responsiblePerson?: string;
  currency?: string;
  riskClassification?: string;
}

// DeviceCharacteristics interface
export interface DeviceCharacteristics {
  // Core MDR classification fields
  invasivenessLevel?: 'non-invasive' | 'body-orifice' | 'surgically-invasive' | 'implantable' | string;
  durationOfContact?: 'transient' | 'short-term' | 'long-term' | string;
  
  isImplantable?: boolean;
  isActive?: boolean;
  isNonInvasive?: boolean;
  isReusableSurgicalInstrument?: boolean;
  isCustomMade?: boolean;
  isInVitroDiagnostic?: boolean;
  isSoftwareMobileApp?: boolean;
  isSystemOrProcedurePack?: boolean;
  containsHumanAnimalMaterial?: boolean;
  incorporatesMedicinalSubstance?: boolean;
  isAccessoryToMedicalDevice?: boolean;
  isSingleUse?: boolean;
  isReusable?: boolean;
  isSoftwareAsaMedicalDevice?: boolean;
  noSoftware?: boolean;
  isIntendedToBeSterile?: boolean; // Keep for backward compatibility
  isNonSterile?: boolean;
  isDeliveredSterile?: boolean;
  canBeSterilized?: boolean;
  hasMeasuringFunction?: boolean;
  // Anatomical location/body contact
  anatomicalLocation?: string;
  surfaceArea?: number; // Surface area in cm² for toxicological risk assessment (ISO 10993-17)
  // Energy delivery characteristics
  deliversTherapeuticEnergy?: boolean;
  deliversDiagnosticEnergy?: boolean;
  energyType?: string;
  // Energy transfer to/from patient (IEC 60601-1 SSOT)
  energyTransferDirection?: string;
  energyTransferType?: string;
  // Special properties
  biologicalOrigin?: string;
  isAbsorbedByBody?: boolean;
  administersMedicine?: boolean;
  containsNanomaterials?: boolean;
  // Power Source characteristics
  isBatteryPowered?: boolean;
  isMainsPowered?: boolean;
  isManualOperation?: boolean;
  isWirelessCharging?: boolean;
  // Connectivity characteristics
  hasBluetooth?: boolean;
  hasWifi?: boolean;
  hasCellular?: boolean;
  hasUsb?: boolean;
  hasNoConnectivity?: boolean;
  // AI/ML characteristics
  hasImageAnalysis?: boolean;
  hasPredictiveAnalytics?: boolean;
  hasNaturalLanguageProcessing?: boolean;
  hasPatternRecognition?: boolean;
  hasNoAiMlFeatures?: boolean;
  // IEC 60601-1 SSOT fields
  expectedServiceLife?: string;
  transportTempRange?: string;
  transportHumidity?: string;
  transportPressure?: string;
  operatingTempRange?: string;
  operatingHumidity?: string;
  operatingPressure?: string;
  ratedVoltage?: string;
  ratedFrequency?: string;
  ratedCurrentPower?: string;
  protectionClass?: string;
  appliedPartType?: string;
  ipWaterRating?: string;
  portabilityClass?: string;
  operationMode?: string;
  dutyCycle?: string;
}

// Adding the IntendedPurposeData interface
export interface IntendedPurposeData {
  clinicalPurpose?: string;
  indications?: string;
  targetPopulation?: string;
  userProfile?: string;
  useEnvironment?: string;
  durationOfUse?: string;
  modeOfAction?: string;
  warnings?: string[];
  essentialPerformance?: string[];
}

// Strategic Partners interface for Value Map
export interface StrategicPartners {
  distributionPartners?: string;
  manufacturingPartners?: string;
  clinicalPartners?: string;
  regulatoryPartners?: string;
}

// Additional missing interfaces
export interface GapAnalysisItem {
  id: string;
  requirement: string;
  category?: string;
  status?: "compliant" | "non_compliant" | "not_applicable" | "in_progress" | "partially_compliant";
  action_needed?: string;
  framework?: string;
  section?: string;
  clause_id?: string;
  clauseId?: string; // Add both for compatibility
  clause_summary?: string;
  clauseSummary?: string; // Add both for compatibility
  priority?: string;
  assigned_to?: string;
  assignedTo?: string; // Add both for compatibility
  evidenceLinks?: any[]; // Add missing property
  evidence_links?: any[]; // Add both for compatibility
  gapDescription?: string; // Add missing property
}

export interface LifecyclePhase {
  id: string;
  name: string;
  description: string;
  status: "Completed" | "In Progress" | "Not Started";
  deadline?: Date;
  isCurrentPhase?: boolean;
  position: number;
  company_id: string;
  progress: number;
  phase_id?: string;
  documents?: DocumentItem[];
}

export interface PhaseItem {
  name: string;
  status: "Completed" | "In Progress" | "Not Started";
}

export interface Certification {
  id: string;
  name: string;
  status: "Valid" | "Expired" | "Pending" | "Expiring";
  expiry_date?: string;
  expiryDate?: string; // Add both for compatibility
  description?: string;
}

export interface Document {
  id: string;
  name: string;
  status: "Approved" | "Pending" | "Draft" | "Under Review" | "Overdue";
  description?: string;
  due_date?: string;
  dueDate?: string; // Add both for compatibility
  type?: string; // Add type property
}

export interface Audit {
  id: string;
  name: string;
  status: "Completed" | "In Progress" | "Planned" | "Scheduled" | "Unscheduled";
  date?: string;
  description?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  email?: string;
}

export interface ChartProduct {
  id: string;
  name: string;
  progress: number;
  status: "On Track" | "At Risk" | "Needs Attention";
  phase?: string; // Add phase property
}

export type Product = {
  id: string;
  name: string;
  description?: string;
  company_id?: string;
  company?: string;
  progress?: number;
  class?: string;
  status?: "On Track" | "At Risk" | "Needs Attention";
  image?: string | string[];
  videos?: string[]; // Added videos field to support video URLs array
  markets?: ProductMarket[] | EnhancedProductMarket[];
  intended_use?: string;
  intendedUse?: string; // Add both for compatibility
  indications_for_use?: string[];
  contraindications?: string[]; 
  device_category?: string;
  article_number?: string;
  basic_udi_di?: string;
  udi_di?: string;
  udi_pi?: string; // Added the UDI-PI field
  gtin?: string;
  model_version?: string;
  manufacturer?: string;
  eu_representative?: string;
  facility_locations?: string;
  facility_street_address?: string;
  facility_city?: string;
  facility_postal_code?: string;
  facility_state_province?: string;
  facility_country?: string;
  // EUDAMED Registration fields
  eudamed_registration_number?: string; // Added EUDAMED registration number
  registration_status?: string; // Added registration status
  registration_date?: string | Date; // Added registration date
  market_authorization_holder?: string; // Added market authorization holder
  notified_body?: string;
  conformity_route?: string;
  ce_mark_status?: string;
  conformity_assessment_route?: string;
  ec_certificate?: string; // Add missing property
  is_archived?: boolean;
  archived_at?: string;
  archived_by?: string;
  inserted_at?: string;
  updated_at?: string;
  
  // NEW FIELDS - Product Overview
  model_reference?: string;
  device_type?: string | DeviceCharacteristics; // Updated to support both string and object format
  regulatory_status?: string;

  // NEW FIELDS - Key Features (stored as JSON array)
  key_features?: string[];

  // NEW FIELDS - Device Components (stored as JSON array with name and description)
  device_components?: Array<{
    name: string;
    description: string;
  }>;

  // NEW FIELDS - Regulatory and Compliance Information
  iso_certifications?: string[];

  // NEW FIELDS - Lifecycle Information
  design_freeze_date?: string | Date;
  current_lifecycle_phase?: string;
  projected_launch_date?: string | Date;
  project_start_date?: string | Date;

  // NEW FIELDS - Intended Users (stored as JSON array)
  intended_users?: string[];

  // NEW FIELDS - Clinical Benefits (stored as JSON array)
  clinical_benefits?: string[];

  // NEW FIELDS - User Instructions (stored as JSON with different instruction types)
  user_instructions?: {
    how_to_use?: string;
    charging?: string;
    maintenance?: string;
  };

  // NEW FIELDS - Device Compliance (additional to regulatory info)
  device_compliance?: string[];

  // NEW FIELDS - Summary
  device_summary?: string;
  
  // Adding IntendedPurposeData field
  intended_purpose_data?: IntendedPurposeData; 
  
  // NPV Analysis fields - Added missing fields
  total_npv?: number;
  selected_currency?: string;
  
  // Related entities
  lifecyclePhases?: LifecyclePhase[];
  certifications?: Certification[];
  documents?: Document[];
  gapAnalysis?: GapAnalysisItem[];
  audits?: Audit[];
  teamMembers?: TeamMember[];
};
