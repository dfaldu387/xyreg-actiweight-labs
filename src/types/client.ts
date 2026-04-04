import { User } from "@supabase/supabase-js";
import type {
  EnhancedProductMarket,
  MarketSponsorDetails,
  MarketAgentDetails,
  MarketAuthorizedRepDetails,
  MarketImporterDetails,
  MarketRegistrationHolderDetails,
  MarketLegalAgentDetails,
  MarketMAHDetails,
  MarketLicenseDetails
} from '@/utils/enhancedMarketRiskClassMapping';

export interface Company {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  owner?: string;
  description?: string;
  logo_url?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  website?: string;
  industry?: string;
  size?: string;
  plan?: string;
  is_active?: boolean;
  is_archived?: boolean;
  archive_reason?: string;
  archive_date?: string;
}

// Client interface with UI-specific properties
export interface Client extends Company {
  status?: "On Track" | "At Risk" | "Needs Attention";
  products?: number;
  progress?: number;
  alerts?: any[];
}

// Simple DeviceCharacteristics interface to avoid conflicts
export interface DeviceCharacteristics {
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
}

export interface Product {
  id: string;
  name: string;
  company_id: string;
  company?: string;
  description?: string;
  article_number?: string;
  class?: string;
  device_category?: string;
  intended_use?: string;
  indications_for_use?: string[];
  contraindications?: string[];
  version?: string;
  base_product_name?: string;
  product_platform?: string;
  parent_product_id?: string;
  is_line_extension?: boolean;
  project_types?: string[];
  manufacturer?: string;
  trade_name?: string;
  eu_representative?: string;
  basic_udi_di?: string;
  udi_di?: string;
  udi_pi?: string;
  gtin?: string;
  model_version?: string;
  eudamed_registration_number?: string;
  registration_status?: string;
  registration_date?: Date | string;
  market_authorization_holder?: string;
  facility_locations?: string;
  facility_street_address?: string;
  facility_city?: string;
  facility_postal_code?: string;
  facility_state_province?: string;
  facility_country?: string;
  image?: string | string[];
  videos?: string[];
  models_3d?: Array<{
    url: string;
    name: string;
    format: string;
  }>;
  markets?: EnhancedProductMarket[];
  market_launch_dates?: Record<string, string>;
  key_features?: string[];
  clinical_benefits?: string[];
  intended_users?: string[];
  iso_certifications?: string[];
  device_compliance?: string[];
  device_components?: Array<{
    name: string;
    description: string;
  }>;
  user_instructions?: any;
  intended_purpose_data?: any;
  regulatory_status?: string;
  current_lifecycle_phase?: string;
  status?: "On Track" | "At Risk" | "Needs Attention";
  progress?: number;
  lifecyclePhases?: ProductPhase[];
  teamMembers?: any[];
  gapAnalysis?: any[];
  created_at?: string;
  updated_at?: string;
  inserted_at?: string;
  is_archived?: boolean;

  // Add missing properties that components expect
  model_reference?: string;
  device_type?: string | DeviceCharacteristics;
  ce_mark_status?: string;
  notified_body?: string;
  design_freeze_date?: string;
  timeline_confirmed?: boolean | null;
  projected_launch_date?: string;
  actual_launch_date?: string;
  conformity_assessment_route?: string;
  conformity_route?: string;
  device_summary?: string;
  documents?: DocumentItem[];
  certifications?: Certification[];
  audits?: Audit[];
}

export interface ProductPhase {
  id: string;
  created_at?: string;
  updated_at?: string;
  product_id: string;
  phase_id: string;
  is_current_phase: boolean;
  deadline?: Date;

  // Budget and cost tracking fields for rNPV integration
  estimated_budget?: number;
  is_pre_launch?: boolean;
  cost_category?: 'development' | 'regulatory' | 'clinical' | 'operational';
  budget_currency?: string;

  // Additional properties that components expect
  name?: string;
  description?: string;
  status?: "Not Started" | "In Progress" | "Completed";
  progress?: number;
  position?: number;
  company_id?: string;
  documents?: LifecycleDocument[];
  start_date?: string;
  end_date?: string;
  is_overdue?: boolean;
  likelihood_of_success?: number;

  // Template data for auto-sequencing
  typical_start_day?: number;
  typical_duration_days?: number;
  is_continuous_process?: boolean;

  // Legacy property alias for backward compatibility
  isCurrentPhase?: boolean;
}

export interface Phase {
  id: string;
  created_at?: string;
  updated_at?: string;
  name: string;
  description?: string;
  status?: "Not Started" | "In Progress" | "Completed";
  progress?: number;
  position?: number;
  company_id: string;
}

// Document-related interfaces
export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  description?: string;
  status?: string;
  version?: string;
  lastUpdated?: string;
  dueDate?: string; // Add missing dueDate property
  phases: string[];
  reviewers: ReviewerItem[];
  reviewerGroups?: ReviewerGroupAssignment[]; // New: Multiple reviewer groups
  techApplicability?: any;
  isPredefinedCore?: boolean;
  isActiveForCompany?: boolean;
  // File-related properties
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  public_url?: string;
  uploaded_at?: string;
  uploaded_by?: string;
  created_at?: string;
  is_protected?: boolean;
  // Gap analysis related properties
  assignedTo?: string;
  priority?: string;
  gapDescription?: string;
}

export interface ReviewerItem {
  id: string;
  name: string;
  email: string;
  role?: string;
  status?: "Pending" | "Approved" | "Rejected";
  lastAction?: string;
}

export interface ReviewerGroupAssignment {
  id: string;
  groupId: string;
  groupName: string;
  groupType: 'internal' | 'external' | 'regulatory';
  assignedDate: string;
  dueDate?: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'changes_requested';
  members: ReviewerGroupMember[];
}

export interface ReviewerGroupMember {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatar?: string;
  role: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'changes_requested';
  approvedAt?: string;
  comments?: string;
}

export interface ReviewerStatus {
  id: string;
  name: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  avatar?: string;
  role?: string;
  assignedAt?: string;
  approvedAt?: string;
}

export interface ReviewerGroupStatus {
  id: string;
  groupId: string;
  groupName: string;
  groupType: 'internal' | 'external' | 'regulatory';
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  members: ReviewerStatus[];
}

export interface LifecycleDocument {
  id: string;
  name: string;
  status?: string;
  dueDate?: string;
  description?: string;
}

export interface LifecyclePhase {
  id: string;
  name: string;
  description?: string;
  status: "Completed" | "In Progress" | "Not Started";
  deadline?: Date;
  isCurrentPhase?: boolean;
  position: number;
  company_id: string;
  progress: number;
  documents?: LifecycleDocument[];
}

export interface PhaseItem {
  id: string;
  name: string;
  status?: string;
  description?: string;
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

export interface GapAnalysisItem {
  id: string;
  product_id?: string;
  title?: string;
  description?: string;
  status: "Open" | "In Progress" | "Closed" | "compliant" | "non_compliant" | "partially_compliant" | "not_applicable";
  assigned_to?: string;
  due_date?: Date;
  dueDate?: Date | string;
  milestoneDate?: Date | string;
  framework?: string;
  clauseId?: string;
  clauseSummary?: string;
  section?: string;
  priority?: string;
  category?: string;
  requirement?: string;
  action_needed?: string;
  evidence_links?: any[];
  evidenceLinks?: any[];
  assignedTo?: string;
  gapDescription?: string;
  last_updated_by?: string;
  milestone_due_date?: Date | string;
  updatedAt?: string;
  lastUpdated?: string;
  applicable_phases?: string[];
  applicablePhases?: string[];
  phase_time?: string[];
  // Admin approval fields
  admin_approved?: boolean;
  admin_approved_by?: string;
  admin_approved_at?: Date | string;
  admin_comments?: string;
}

export interface Certification {
  id: string;
  name: string;
  status?: string;
  expiryDate?: string;
  description?: string;
}

export interface Audit {
  id: string;
  name: string;
  status?: string;
  date?: string;
  description?: string;
  // Admin approval fields
  admin_approved?: boolean;
  admin_approved_by?: string;
  admin_approved_at?: string;
  admin_comments?: string;
}

export interface ChartProduct {
  id: string;
  name: string;
  progress: number;
  status?: string;
  class?: string;
  phase?: string;
}

export interface TeamMember {
  id: string;
  created_at?: string;
  updated_at?: string;
  product_id: string;
  user_id: string;
  role: string;

  // Additional properties that components expect
  name?: string;
}

export interface UserProfile {
  id: string;
  created_at?: string;
  updated_at?: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone_number?: string;
  company_id?: string;
  role?: string;
  job_title?: string;
  is_active?: boolean;
}

export interface SupabaseUser extends User {
  user_metadata: {
    avatar_url: string;
    email: string;
    full_name: string;
    iss: string;
    name: string;
    phone_number: string;
    provider_id: string;
    sub: string;
  };
}

export interface Market {
  id: string;
  created_at?: string;
  updated_at?: string;
  code: string;
  name: string;
  riskClass: string;
  regulatoryStatus?: string;
  company_id?: string;
}

export interface ProductMarket extends Market {
  selected: boolean;
}

export interface GapItem {
  id: string;
  created_at?: string;
  updated_at?: string;
  product_id: string;
  title?: string;
  description?: string;
  status: "Open" | "In Progress" | "Closed" | "compliant" | "non_compliant" | "partially_compliant" | "not_applicable";
  assigned_to?: string;
  due_date?: Date;
  framework?: string;
  clauseId?: string;
  clauseSummary?: string;
  section?: string;
  priority?: string;
  category?: string;
  requirement?: string;
  action_needed?: string;
  evidence_links?: any[];
  evidenceLinks?: any[];
  assignedTo?: string;
  gapDescription?: string;
  last_updated_by?: string;
  milestone_due_date?: Date | string;
  dueDate?: Date | string;
  milestoneDate?: Date | string;
  updatedAt?: string;
}

export interface IntendedPurposeData {
  indications: string;
  contraindications: string;
  target_patient_population: string;
  intended_users: string;
  environment_of_use: string;
  principles_of_operation: string;
  duration_of_use: string;
  single_use_or_reusable: string;
}

export interface Device3DModel {
  id: string;
  name: string;
  url: string;
  fileType: string;
  size: number;
  thumbnailUrl?: string;
}

export interface AuditOrReview {
  id: string;
  name: string;
  type: "audit" | "review";
  status: string;
  date?: string;
  description?: string;
}

// Add OptimizedProduct interface with all required properties for compatibility
export interface OptimizedProduct {
  id: string;
  name: string;
  company_id: string; // Required for Product compatibility
  company: string; // Required for Product compatibility - company name
  progress?: number;
  status?: "On Track" | "At Risk" | "Needs Attention";
  class?: string;
  current_phase?: string;
  phase?: string;
  created_at?: string;
  updated_at?: string;
  description?: string;
  image?: string;
  targetDate?: string;
  project_types?: string[];
  is_line_extension?: boolean;
  parent_product_id?: string;
}

// Re-export the enhanced market types for use throughout the application
export type {
  EnhancedProductMarket,
  MarketSponsorDetails,
  MarketAgentDetails,
  MarketAuthorizedRepDetails,
  MarketImporterDetails,
  MarketRegistrationHolderDetails,
  MarketLegalAgentDetails,
  MarketMAHDetails,
  MarketLicenseDetails
};
