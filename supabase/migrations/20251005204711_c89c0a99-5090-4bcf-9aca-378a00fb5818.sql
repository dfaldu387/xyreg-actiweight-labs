
-- Add user access to SoftOx Ukraine company
INSERT INTO user_company_access (user_id, company_id, access_level, affiliation_type)
VALUES (
  'ae396acb-2acd-4db1-87b5-b5875451d949',
  '8cad1a99-b1db-498f-8f11-6c5209fc270e',
  'admin',
  'internal'
)
ON CONFLICT (user_id, company_id) DO UPDATE
SET access_level = 'admin',
    affiliation_type = 'internal';
