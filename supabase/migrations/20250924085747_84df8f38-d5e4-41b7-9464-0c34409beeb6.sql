-- Step 1: Fix the primary company issue by ensuring only ONE company per user is marked as primary
-- First, unmark all companies as primary for this specific user
UPDATE user_company_access 
SET is_primary = false 
WHERE user_id = 'ae396acb-2acd-4db1-87b5-b5875451d949';

-- Then, set the first alphabetically sorted company as primary (to avoid "Heena Test" preference)
UPDATE user_company_access 
SET is_primary = true 
WHERE user_id = 'ae396acb-2acd-4db1-87b5-b5875451d949'
  AND company_id = (
    SELECT uca.company_id 
    FROM user_company_access uca
    JOIN companies c ON c.id = uca.company_id
    WHERE uca.user_id = 'ae396acb-2acd-4db1-87b5-b5875451d949'
      AND c.is_archived = false
    ORDER BY c.name ASC
    LIMIT 1
  );

-- Step 2: Clear the user's metadata that forces "Heena Test" selection
-- This will be handled in the application code as Supabase SQL can't directly update auth.users