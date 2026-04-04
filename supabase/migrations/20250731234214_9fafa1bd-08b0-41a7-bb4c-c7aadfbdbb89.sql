-- Fix multiple primary companies issue and add constraints

-- First, let's see which users have multiple primary companies
DO $$ 
DECLARE
    user_record RECORD;
    company_record RECORD;
    first_primary uuid;
BEGIN
    -- For each user with multiple primary companies
    FOR user_record IN 
        SELECT user_id, COUNT(*) as primary_count
        FROM user_company_access 
        WHERE is_primary = true 
        GROUP BY user_id 
        HAVING COUNT(*) > 1
    LOOP
        RAISE NOTICE 'User % has % primary companies', user_record.user_id, user_record.primary_count;
        
        -- Get the first primary company (we'll keep this one as primary)
        SELECT company_id INTO first_primary
        FROM user_company_access 
        WHERE user_id = user_record.user_id AND is_primary = true
        ORDER BY updated_at ASC  -- Keep the oldest as primary
        LIMIT 1;
        
        -- Set all other primary companies to non-primary
        UPDATE user_company_access 
        SET is_primary = false, updated_at = now()
        WHERE user_id = user_record.user_id 
        AND is_primary = true 
        AND company_id != first_primary;
        
        RAISE NOTICE 'Fixed user % - kept company % as primary', user_record.user_id, first_primary;
    END LOOP;
END $$;

-- Add unique constraint to prevent multiple primary companies per user
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS unique_primary_company_per_user 
ON user_company_access (user_id) 
WHERE is_primary = true;

-- Add a check constraint to ensure data integrity
ALTER TABLE user_company_access 
ADD CONSTRAINT check_single_primary_per_user 
EXCLUDE (user_id WITH =) 
WHERE (is_primary = true);

-- Update user metadata to match the corrected primary company
DO $$
DECLARE
    user_record RECORD;
    primary_company_id uuid;
BEGIN
    -- For each user, ensure their metadata points to their primary company
    FOR user_record IN 
        SELECT DISTINCT user_id FROM user_company_access WHERE is_primary = true
    LOOP
        -- Get their primary company
        SELECT company_id INTO primary_company_id
        FROM user_company_access 
        WHERE user_id = user_record.user_id AND is_primary = true;
        
        -- Update user metadata
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object('active_company_id', primary_company_id)
        WHERE id = user_record.user_id;
        
        RAISE NOTICE 'Updated metadata for user % with primary company %', user_record.user_id, primary_company_id;
    END LOOP;
END $$;