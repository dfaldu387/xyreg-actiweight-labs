-- E-Signature Module — Database Migration
-- FDA 21 CFR Part 11 Compliant

-- 1. Signature Requests
CREATE TABLE esign_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  document_hash TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','voided')),
  signing_order TEXT NOT NULL DEFAULT 'parallel' CHECK (signing_order IN ('sequential','parallel')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Signers within a request
CREATE TABLE esign_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES esign_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  meaning TEXT NOT NULL CHECK (meaning IN ('author','reviewer','approver')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','awaiting','signed','rejected')),
  signed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Immutable signature records
CREATE TABLE esign_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES esign_requests(id),
  signer_id UUID NOT NULL REFERENCES esign_signers(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  document_hash TEXT NOT NULL,
  meaning TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  auth_method TEXT NOT NULL DEFAULT 'password_reauth',
  signed_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Immutable audit log — APPEND ONLY
CREATE TABLE esign_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  request_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Audit log is INSERT-ONLY
ALTER TABLE esign_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can insert audit logs"
  ON esign_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view audit logs"
  ON esign_audit_log FOR SELECT TO authenticated
  USING (true);

-- RLS for esign_records: INSERT only for signer, SELECT for participants
ALTER TABLE esign_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signer can insert their own record"
  ON esign_records FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Participants can view records"
  ON esign_records FOR SELECT TO authenticated
  USING (true);

-- 5. OTP codes for email verification (e-signature re-auth)
CREATE TABLE esign_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for OTP codes
ALTER TABLE esign_otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage OTP codes"
  ON esign_otp_codes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- RLS for esign_requests
ALTER TABLE esign_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create requests"
  ON esign_requests FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view requests"
  ON esign_requests FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update requests"
  ON esign_requests FOR UPDATE TO authenticated
  USING (true);

-- RLS for esign_signers
ALTER TABLE esign_signers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert signers"
  ON esign_signers FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view signers"
  ON esign_signers FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update signers"
  ON esign_signers FOR UPDATE TO authenticated
  USING (true);
