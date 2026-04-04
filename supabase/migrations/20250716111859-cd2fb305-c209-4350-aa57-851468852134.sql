-- Add "N/A" as a valid status value for lifecycle phases
-- This allows phases to be marked as "N/A" when they don't apply to a particular product

-- Check if there are any constraints on the status column
-- We need to ensure "N/A" is supported as a valid status value
-- If there are check constraints, we may need to update them

-- For now, let's just verify that the status column can accept "N/A" values
-- The column should be text type and allow various status values

-- Update any existing "Not Started" statuses that should be "N/A" 
-- This is optional and depends on business requirements
-- UPDATE lifecycle_phases SET status = 'N/A' WHERE status = 'Not Started' AND [some condition];

-- Let's first check what status values currently exist
SELECT DISTINCT status FROM lifecycle_phases WHERE status IS NOT NULL;