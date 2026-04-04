export type SignatureMeaning = 'author' | 'reviewer' | 'approver';
export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'voided';
export type SignerStatus = 'pending' | 'awaiting' | 'signed' | 'rejected';
export type SigningOrder = 'sequential' | 'parallel';
export type AuthMethod = 'password_reauth' | 'totp_authenticator' | 'email_otp';

export interface ESignRequest {
  id: string;
  document_id: string;
  document_hash: string;
  created_by: string;
  status: RequestStatus;
  signing_order: SigningOrder;
  created_at: string;
  signers: ESignSigner[];
}

export interface ESignSigner {
  id: string;
  request_id: string;
  user_id: string;
  display_name: string;
  order_index: number;
  meaning: SignatureMeaning;
  status: SignerStatus;
  signed_at?: string;
  rejection_reason?: string;
}

export interface ESignRecord {
  id: string;
  request_id: string | null;
  signer_id: string | null;
  user_id: string;
  document_id?: string | null;
  document_hash: string;
  meaning: string;
  full_legal_name?: string | null;
  ip_address?: string;
  user_agent?: string;
  auth_method: AuthMethod;
  signed_at: string;
}

export interface AuditLogEntry {
  id: string;
  document_id: string;
  request_id?: string;
  user_id: string;
  user_name: string;
  action: string;
  metadata: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface ESignPopupProps {
  documentId: string;
  documentName: string;
  onComplete?: (request: ESignRequest) => void;
  onClose?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
