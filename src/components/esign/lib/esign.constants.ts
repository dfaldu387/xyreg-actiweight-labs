export const SIGNATURE_MEANINGS = [
  { value: 'author', label: 'Author — I created this document' },
  { value: 'reviewer', label: 'Reviewer — I have reviewed this document' },
  { value: 'approver', label: 'Approver — I approve this document' },
] as const;

export const AUDIT_ACTIONS = {
  REQUEST_CREATED: 'request_created',
  DOCUMENT_VIEWED: 'document_viewed',
  SIGNER_AUTHENTICATED: 'signer_authenticated',
  SIGNATURE_APPLIED: 'signature_applied',
  SIGNATURE_REJECTED: 'signature_rejected',
  REQUEST_COMPLETED: 'request_completed',
  REQUEST_VOIDED: 'request_voided',
  HASH_MISMATCH: 'hash_mismatch_detected',
} as const;

export const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Signatures' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Progress' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Fully Signed' },
  voided: { bg: 'bg-red-100', text: 'text-red-800', label: 'Voided' },
  none: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'No Signature Requested' },
};
