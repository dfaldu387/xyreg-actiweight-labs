-- Add user access to MediCo AG for the current user
-- This will allow them to create products for this company

INSERT INTO user_company_access (
  user_id, 
  company_id, 
  access_level, 
  is_primary, 
  is_internal
) VALUES (
  '89a06c86-f0a3-4844-9911-f14a82804d50', -- User ID from the network requests
  '1305f937-bc29-42d3-8100-02addd837a12', -- MediCo AG company ID
  'admin',
  false,
  false
) ON CONFLICT (user_id, company_id) DO UPDATE SET
  access_level = EXCLUDED.access_level,
  is_primary = EXCLUDED.is_primary,
  is_internal = EXCLUDED.is_internal;