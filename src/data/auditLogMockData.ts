import { AuditLogEntry } from '@/types/auditLog';

/**
 * Mock data for audit log entries
 * Contains realistic examples of all entity types and action types
 */
export const mockAuditLogData: AuditLogEntry[] = [
  {
    id: '1',
    document_id: 'doc-001',
    user_id: 'user-001',
    company_id: 'company-001',
    action: 'view' as const,
    action_details: {},
    created_at: '2025-06-24T09:15:23Z',
    actionType: 'Document Uploaded',
    entityType: 'Document',
    entityId: 'doc-001',
    entityName: 'Risk Management Plan v2.1',
    description: 'Risk Management Plan document uploaded for regulatory review',
    user: 'Sarah Johnson',
    date: '2025-06-24',
    time: '09:15:23',
    ipAddress: '192.168.1.45'
  },
  {
    id: '2',
    document_id: 'doc-002',
    user_id: 'user-002',
    company_id: 'company-001',
    action: 'edit' as const,
    action_details: {},
    created_at: '2025-06-24T10:22:17Z',
    actionType: 'Gap Analysis Created',
    entityType: 'Gap Analysis',
    entityId: 'gap-001',
    entityName: 'MDR Compliance Gap Analysis',
    description: 'New gap analysis created for MDR compliance assessment',
    user: 'Michael Chen',
    date: '2025-06-24',
    time: '10:22:17',
    ipAddress: '10.0.0.156'
  },
  {
    id: '3',
    document_id: 'doc-003',
    user_id: 'user-003',
    company_id: 'company-001',
    action: 'view' as const,
    action_details: {},
    created_at: '2025-06-24T11:30:45Z',
    actionType: 'Audit Scheduled',
    entityType: 'Audit',
    entityId: 'audit-001',
    entityName: 'Internal Quality Audit Q2 2025',
    description: 'Internal quality audit scheduled for next month',
    user: 'Emma Rodriguez',
    date: '2025-06-24',
    time: '11:30:45',
    ipAddress: '172.16.0.23'
  },
  {
    id: '4',
    document_id: 'doc-004',
    user_id: 'user-004',
    company_id: 'company-001',
    action: 'edit' as const,
    action_details: {},
    created_at: '2025-06-24T14:18:32Z',
    actionType: 'Activity Assigned',
    entityType: 'Activity',
    entityId: 'act-001',
    entityName: 'Design Control Review',
    description: 'Design control review activity assigned to engineering team',
    user: 'David Kim',
    date: '2025-06-24',
    time: '14:18:32',
    ipAddress: '192.168.1.78'
  },
  {
    id: '5',
    document_id: 'doc-005',
    user_id: 'user-005',
    company_id: 'company-001',
    action: 'download' as const,
    action_details: {},
    created_at: '2025-06-23T16:45:12Z',
    actionType: 'Document Downloaded',
    entityType: 'Document',
    entityId: 'doc-002',
    entityName: 'Clinical Evaluation Report',
    description: 'Clinical evaluation report downloaded by external reviewer',
    user: 'Dr. Lisa Anderson',
    date: '2025-06-23',
    time: '16:45:12',
    ipAddress: '203.0.113.42'
  }
];