-- WHX Event Codes Table
-- Stores access codes for WHX Dubai event and Genesis signups

CREATE TABLE IF NOT EXISTS whx_event_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER, -- NULL means unlimited
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_whx_event_codes_code ON whx_event_codes(code);
CREATE INDEX IF NOT EXISTS idx_whx_event_codes_is_active ON whx_event_codes(is_active);

-- WHX Access Requests Table
-- Stores requests from users who don't have an access code

CREATE TABLE IF NOT EXISTS whx_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  assigned_code VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_whx_access_requests_status ON whx_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_whx_access_requests_email ON whx_access_requests(email);

-- Enable RLS
ALTER TABLE whx_event_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE whx_access_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whx_event_codes
-- Super admins can do everything
CREATE POLICY "Super admins can manage event codes"
  ON whx_event_codes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  );

-- Anonymous users can read active codes (for validation)
CREATE POLICY "Anyone can validate codes"
  ON whx_event_codes
  FOR SELECT
  TO anon
  USING (is_active = true);

-- RLS Policies for whx_access_requests
-- Super admins can manage all requests
CREATE POLICY "Super admins can manage access requests"
  ON whx_access_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  );

-- Anonymous users can insert requests
CREATE POLICY "Anyone can submit access requests"
  ON whx_access_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Insert default ORIGIN500 code
INSERT INTO whx_event_codes (code, description, is_active, max_uses)
VALUES ('ORIGIN500', 'Genesis 500 - Original founding members code', true, 500)
ON CONFLICT (code) DO NOTHING;

-- Function to increment code usage
CREATE OR REPLACE FUNCTION increment_code_usage(code_value VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  code_record whx_event_codes%ROWTYPE;
BEGIN
  SELECT * INTO code_record
  FROM whx_event_codes
  WHERE code = code_value
  AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if code has expired
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
    RETURN false;
  END IF;

  -- Check if max uses reached
  IF code_record.max_uses IS NOT NULL AND code_record.current_uses >= code_record.max_uses THEN
    RETURN false;
  END IF;

  -- Increment usage
  UPDATE whx_event_codes
  SET current_uses = current_uses + 1
  WHERE id = code_record.id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
