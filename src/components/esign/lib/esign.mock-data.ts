import { ESignSigner, ESignRequest, AuditLogEntry } from './esign.types';

export const MOCK_SIGNERS: ESignSigner[] = [
  {
    id: 'signer-001',
    request_id: 'req-001',
    user_id: 'user-001',
    display_name: 'Dr. Sarah Chen',
    order_index: 0,
    meaning: 'author',
    status: 'signed',
    signed_at: '2026-02-16T09:15:00Z',
  },
  {
    id: 'signer-002',
    request_id: 'req-001',
    user_id: 'user-002',
    display_name: 'James Rodriguez',
    order_index: 1,
    meaning: 'reviewer',
    status: 'signed',
    signed_at: '2026-02-16T10:30:00Z',
  },
  {
    id: 'signer-003',
    request_id: 'req-001',
    user_id: 'user-003',
    display_name: 'Emily Watson',
    order_index: 2,
    meaning: 'approver',
    status: 'pending',
  },
];

export const MOCK_AVAILABLE_USERS = [
  { id: 'user-001', name: 'Dr. Sarah Chen', email: 'sarah.chen@company.com', role: 'Quality Manager' },
  { id: 'user-002', name: 'James Rodriguez', email: 'james.r@company.com', role: 'Regulatory Affairs' },
  { id: 'user-003', name: 'Emily Watson', email: 'emily.w@company.com', role: 'VP Engineering' },
  { id: 'user-004', name: 'Michael Park', email: 'michael.p@company.com', role: 'Clinical Specialist' },
  { id: 'user-005', name: 'Lisa Thompson', email: 'lisa.t@company.com', role: 'Design Engineer' },
];

export const MOCK_DOCUMENT_HASH = 'a7f3b2c9e1d4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4';

export const MOCK_REQUEST: ESignRequest = {
  id: 'req-001',
  document_id: 'doc-001',
  document_hash: MOCK_DOCUMENT_HASH,
  created_by: 'user-001',
  status: 'in_progress',
  signing_order: 'sequential',
  created_at: '2026-02-16T08:00:00Z',
  signers: MOCK_SIGNERS,
};

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'audit-001',
    document_id: 'doc-001',
    request_id: 'req-001',
    user_id: 'user-001',
    user_name: 'Dr. Sarah Chen',
    action: 'request_created',
    metadata: { signing_order: 'sequential', signers_count: 3 },
    ip_address: '192.168.1.100',
    created_at: '2026-02-16T08:00:00Z',
  },
  {
    id: 'audit-002',
    document_id: 'doc-001',
    request_id: 'req-001',
    user_id: 'user-001',
    user_name: 'Dr. Sarah Chen',
    action: 'document_viewed',
    metadata: { document_hash: MOCK_DOCUMENT_HASH },
    ip_address: '192.168.1.100',
    created_at: '2026-02-16T09:10:00Z',
  },
  {
    id: 'audit-003',
    document_id: 'doc-001',
    request_id: 'req-001',
    user_id: 'user-001',
    user_name: 'Dr. Sarah Chen',
    action: 'signer_authenticated',
    metadata: { auth_method: 'password_reauth' },
    ip_address: '192.168.1.100',
    created_at: '2026-02-16T09:14:00Z',
  },
  {
    id: 'audit-004',
    document_id: 'doc-001',
    request_id: 'req-001',
    user_id: 'user-001',
    user_name: 'Dr. Sarah Chen',
    action: 'signature_applied',
    metadata: { meaning: 'author', signer_id: 'signer-001' },
    ip_address: '192.168.1.100',
    created_at: '2026-02-16T09:15:00Z',
  },
  {
    id: 'audit-005',
    document_id: 'doc-001',
    request_id: 'req-001',
    user_id: 'user-002',
    user_name: 'James Rodriguez',
    action: 'document_viewed',
    metadata: { document_hash: MOCK_DOCUMENT_HASH },
    ip_address: '10.0.0.55',
    created_at: '2026-02-16T10:25:00Z',
  },
  {
    id: 'audit-006',
    document_id: 'doc-001',
    request_id: 'req-001',
    user_id: 'user-002',
    user_name: 'James Rodriguez',
    action: 'signer_authenticated',
    metadata: { auth_method: 'password_reauth' },
    ip_address: '10.0.0.55',
    created_at: '2026-02-16T10:29:00Z',
  },
  {
    id: 'audit-007',
    document_id: 'doc-001',
    request_id: 'req-001',
    user_id: 'user-002',
    user_name: 'James Rodriguez',
    action: 'signature_applied',
    metadata: { meaning: 'reviewer', signer_id: 'signer-002' },
    ip_address: '10.0.0.55',
    created_at: '2026-02-16T10:30:00Z',
  },
];

export const MOCK_CURRENT_USER = {
  id: 'user-003',
  name: 'Emily Watson',
  email: 'emily.w@company.com',
};
