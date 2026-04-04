// Training Management System Types

export type TrainingModuleType = 'sop' | 'video' | 'workshop' | 'course' | 'external';
export type DeliveryMethod = 'self_paced' | 'live_session' | 'blended';
export type TrainingStatus = 'not_started' | 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'expired';
export type DueType = 'days_after_assignment' | 'days_after_hire' | 'annual' | 'one_time';

export interface TrainingModule {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  type: TrainingModuleType;
  document_id: string | null;
  external_url: string | null;
  delivery_method: DeliveryMethod;
  requires_signature: boolean;
  estimated_minutes: number | null;
  validity_days: number | null;
  version: string;
  is_active: boolean;
  group_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleTrainingRequirement {
  id: string;
  company_id: string;
  role_id: string;
  training_module_id: string;
  due_type: DueType;
  due_days: number;
  annual_due_month: number | null;
  annual_due_day: number | null;
  is_mandatory: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  training_module?: TrainingModule;
  role?: { id: string; name: string };
}

export interface TrainingRecord {
  id: string;
  company_id: string;
  user_id: string;
  training_module_id: string;
  role_requirement_id: string | null;
  status: TrainingStatus;
  assigned_at: string;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  scheduled_session_date: string | null;
  assigned_trainer_id: string | null;
  signature_data: SignatureData | null;
  completion_notes: string | null;
  score: number | null;
  previous_record_id: string | null;
  reissue_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  training_module?: TrainingModule;
}

export interface SignatureData {
  signedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: unknown;
}

// Form types
export interface TrainingModuleFormData {
  name: string;
  description: string;
  type: TrainingModuleType;
  document_id: string | null;
  external_url: string;
  delivery_method: DeliveryMethod;
  requires_signature: boolean;
  estimated_minutes: number | null;
  validity_days: number | null;
  version: string;
}

// Stats types
export interface UserTrainingStats {
  total: number;
  completed: number;
  in_progress: number;
  overdue: number;
  upcoming: number;
  completionRate: number;
}
