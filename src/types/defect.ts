// Defect Management Type Definitions — Closed-Loop Quality System

// Severity levels aligned with ISO 14971 risk categories
export type DefectSeverity = 'critical' | 'high' | 'medium' | 'low';

// Status workflow: Open → In Progress → Resolved → Closed
export type DefectStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

// State machine gates
export const DEFECT_STATUS_GATES: Record<DefectStatus, DefectStatus[]> = {
  open: ['in_progress'],
  in_progress: ['resolved', 'open'],
  resolved: ['closed', 'in_progress'],
  closed: [],
};

// Status labels
export const DEFECT_STATUS_LABELS: Record<DefectStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

// Status colors (semantic token keys)
export const DEFECT_STATUS_COLORS: Record<DefectStatus, string> = {
  open: 'yellow',
  in_progress: 'blue',
  resolved: 'purple',
  closed: 'green',
};

// Severity labels
export const DEFECT_SEVERITY_LABELS: Record<DefectSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

// Severity colors
export const DEFECT_SEVERITY_COLORS: Record<DefectSeverity, string> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'warning',
  low: 'secondary',
};

// Main DefectRecord interface (matches DB schema)
export interface DefectRecord {
  id: string;
  defect_id: string;
  product_id: string;
  company_id: string;
  title: string;
  description: string;
  severity: DefectSeverity;
  priority: string;
  status: DefectStatus;
  defect_type: string | null;
  discovered_in_phase: string | null;
  test_case_id: string | null;
  test_execution_id: string | null;
  reported_by: string;
  assigned_to: string | null;
  linked_hazard_id: string | null;
  linked_capa_id: string | null;
  linked_ccr_id: string | null;
  root_cause: string | null;
  resolution: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  verified_at: string | null;
  verified_by: string | null;
  jira_issue_key: string | null;
  created_at: string;
  updated_at: string;
}

// Create input
export interface CreateDefectInput {
  product_id: string;
  company_id: string;
  defect_id: string;
  title: string;
  description: string;
  severity: DefectSeverity;
  priority?: string;
  test_case_id?: string | null;
  test_execution_id?: string | null;
  reported_by: string;
  assigned_to?: string | null;
  linked_hazard_id?: string | null;
  discovered_in_phase?: string | null;
}

// Update input
export interface UpdateDefectInput {
  id: string;
  title?: string;
  description?: string;
  severity?: DefectSeverity;
  priority?: string;
  status?: DefectStatus;
  assigned_to?: string | null;
  linked_hazard_id?: string | null;
  linked_capa_id?: string | null;
  linked_ccr_id?: string | null;
  root_cause?: string | null;
  resolution?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

// Analytics shape
export interface DefectAnalytics {
  total: number;
  byStatus: Record<DefectStatus, number>;
  bySeverity: Record<DefectSeverity, number>;
  withCapa: number;
  withCcr: number;
  withHazard: number;
}

// Criticality gate: determines if CAPA is mandatory
export function isCapaRequired(severity: DefectSeverity): boolean {
  return severity === 'critical' || severity === 'high';
}

// Resolution gate: checks if defect can advance to resolved
export function canResolve(defect: Pick<DefectRecord, 'severity' | 'resolution' | 'linked_capa_id'>): { allowed: boolean; reason?: string } {
  if (!defect.resolution) {
    return { allowed: false, reason: 'Resolution notes are required before resolving.' };
  }
  if (defect.severity === 'critical' && !defect.linked_capa_id) {
    return { allowed: false, reason: 'Critical defects require a linked CAPA before resolving.' };
  }
  return { allowed: true };
}
