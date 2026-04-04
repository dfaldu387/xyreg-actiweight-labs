-- Add user access to Medixor AB company for current user
INSERT INTO user_company_access (user_id, company_id, access_level, is_internal, is_primary)
VALUES (auth.uid(), 'c6423851-eea1-4a58-8515-d2b93895a508', 'admin', true, true)
ON CONFLICT (user_id, company_id) DO UPDATE SET
  access_level = EXCLUDED.access_level,
  is_internal = EXCLUDED.is_internal,
  updated_at = now();