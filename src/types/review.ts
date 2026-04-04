
export type ReviewRecordType = 'document' | 'gap_analysis_item' | 'audit' | 'ci_instance';

export type ReviewWorkflowStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'changes_requested';

export type ReviewPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ReviewAssignmentStatus = 'pending' | 'in_review' | 'completed' | 'skipped';

export type ReviewDecision = 'approved' | 'rejected' | 'changes_requested' | 'abstain';

export type ReviewAssignmentType = 'required' | 'optional' | 'notification_only';

export type ReviewerRole = 'reviewer' | 'lead' | 'observer';

export type ReviewNotificationType = 'assignment' | 'reminder' | 'decision' | 'completion' | 'escalation';

export type ReviewCommentType = 'general' | 'change_request' | 'approval_note' | 'question';

export interface ReviewWorkflow {
  id: string;
  record_type: ReviewRecordType;
  record_id: string;
  workflow_name: string;
  workflow_description?: string;
  total_stages: number;
  current_stage: number;
  overall_status: ReviewWorkflowStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  due_date?: string;
  priority: ReviewPriority;
  metadata: Record<string, any>;
}

export interface ReviewWorkflowStage {
  id: string;
  workflow_id: string;
  stage_number: number;
  stage_name: string;
  stage_description?: string;
  required_approvals: number;
  approval_threshold: number;
  is_parallel: boolean;
  auto_advance: boolean;
  created_at: string;
}

export interface ReviewerGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: ReviewerRole;
  can_approve: boolean;
  can_request_changes: boolean;
  can_reject: boolean;
  notification_preferences: {
    email: boolean;
    in_app: boolean;
  };
  added_at: string;
  added_by?: string;
  is_active: boolean;
}

export interface ReviewAssignment {
  id: string;
  workflow_id: string;
  stage_number: number;
  reviewer_group_id: string;
  assignment_type: ReviewAssignmentType;
  assigned_at: string;
  assigned_by?: string;
  due_date?: string;
  status: ReviewAssignmentStatus;
  completed_at?: string;
  notes?: string;
}

export interface ReviewDecisionRecord {
  id: string;
  assignment_id: string;
  reviewer_id: string;
  decision: ReviewDecision;
  comments?: string;
  decision_at: string;
  updated_at: string;
  is_final: boolean;
  metadata: Record<string, any>;
}

export interface ReviewNotification {
  id: string;
  workflow_id: string;
  user_id: string;
  notification_type: ReviewNotificationType;
  title: string;
  message?: string;
  is_read: boolean;
  sent_at: string;
  metadata: Record<string, any>;
}

export interface ReviewComment {
  id: string;
  workflow_id: string;
  assignment_id?: string;
  parent_comment_id?: string;
  commenter_id: string;
  comment_text: string;
  comment_type: ReviewCommentType;
  position?: Record<string, any>;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewTemplate {
  id: string;
  name: string;
  description?: string;
  record_type: ReviewRecordType;
  template_config: {
    stages: Array<{
      name: string;
      description?: string;
      reviewer_groups: string[];
      required_approvals: number;
      approval_threshold: number;
    }>;
    default_priority: ReviewPriority;
    auto_assign: boolean;
  };
  is_active: boolean;
  is_default: boolean;
  created_by?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowRequest {
  record_type: ReviewRecordType;
  record_id: string;
  workflow_name: string;
  workflow_description?: string;
  template_id?: string;
  stages: Array<{
    stage_name: string;
    stage_description?: string;
    reviewer_groups: string[];
    required_approvals?: number;
    approval_threshold?: number;
  }>;
  due_date?: string;
  priority?: ReviewPriority;
}

export interface WorkflowProgress {
  current_stage: number;
  total_stages: number;
  completed_stages: number;
  pending_decisions: number;
  total_decisions: number;
  stage_progress: Array<{
    stage_number: number;
    stage_name: string;
    status: 'completed' | 'in_progress' | 'pending';
    decisions_made: number;
    decisions_required: number;
  }>;
}
