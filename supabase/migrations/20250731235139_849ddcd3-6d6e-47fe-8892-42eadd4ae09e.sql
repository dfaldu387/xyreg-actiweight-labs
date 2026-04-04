-- Fix user metadata inconsistency - ensure activeCompany matches the primary company
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data, 
  '{activeCompany}', 
  to_jsonb((
    SELECT uca.company_id::text 
    FROM user_company_access uca 
    WHERE uca.user_id = auth.users.id 
    AND uca.is_primary = true 
    LIMIT 1
  ))
)
WHERE EXISTS (
  SELECT 1 FROM user_company_access uca 
  WHERE uca.user_id = auth.users.id 
  AND uca.is_primary = true
);

-- Remove the conflicting active_company_id field
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data - 'active_company_id'
WHERE raw_user_meta_data ? 'active_company_id';