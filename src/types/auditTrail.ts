export type AuditCategory =
  | 'document_record'
  | 'e_signature'
  | 'user_access_security'
  | 'quality_process';

export const AUDIT_CATEGORY_LABELS: Record<AuditCategory, string> = {
  document_record: 'Documents & Records',
  e_signature: 'E-Signatures',
  user_access_security: 'User Access & Security',
  quality_process: 'Quality Processes',
};

export const AUDIT_CATEGORY_COLORS: Record<AuditCategory, string> = {
  document_record: 'bg-blue-100 text-blue-800 border-blue-200',
  e_signature: 'bg-purple-100 text-purple-800 border-purple-200',
  user_access_security: 'bg-amber-100 text-amber-800 border-amber-200',
  quality_process: 'bg-green-100 text-green-800 border-green-200',
};

export interface FieldChange {
  field: string;
  oldValue?: string;
  newValue?: string;
  /** Raw IDs for hybrid resolution — resolve at display time, fall back to stored names */
  oldIds?: string[];
  newIds?: string[];
  /** Table to resolve IDs from: 'document_authors' | 'reviewer_groups' | 'reference_documents' | 'company_phases' */
  resolveFrom?: string;
}

export interface UnifiedAuditTrailEntry {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: AuditCategory;
  action: string;
  entityType: string;
  entityId?: string;
  entityName: string;
  timestamp: string;
  reason: string;
  changes?: FieldChange[];
  actionDetails?: Record<string, any>;
  ipAddress?: string;
  sourceTable: 'document_audit_logs' | 'product_audit_logs' | 'audit_trail_logs';
}

export interface AuditTrailFilters {
  category?: AuditCategory;
  actionType?: string;
  entityType?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}
