-- Create user profile if it doesn't exist (using correct columns)
INSERT INTO user_profiles (id, email)
VALUES ('2e4a4fe9-506c-4bc7-be5f-a2d949ea2e97', 'test13@test.com')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = now();

-- Add user access to Medixor AB company  
INSERT INTO user_company_access (user_id, company_id, access_level, is_internal, is_primary)
VALUES ('2e4a4fe9-506c-4bc7-be5f-a2d949ea2e97', 'c6423851-eea1-4a58-8515-d2b93895a508', 'admin', true, true)
ON CONFLICT (user_id, company_id) DO UPDATE SET
  access_level = EXCLUDED.access_level,
  is_internal = EXCLUDED.is_internal,
  updated_at = now();