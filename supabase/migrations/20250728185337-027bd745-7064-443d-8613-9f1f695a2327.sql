-- Add is_pre_launch column to phases table and set correct values
-- Only phases "8" (Launch & Post-Launch) and "C4" (Post-Market Surveillance) are post-revenue

-- Add the is_pre_launch column if it doesn't exist
ALTER TABLE phases 
ADD COLUMN IF NOT EXISTS is_pre_launch boolean DEFAULT true;

-- Set all phases to pre-revenue (is_pre_launch = true) by default
UPDATE phases SET is_pre_launch = true;

-- Then set only the specific post-revenue phases to false
UPDATE phases 
SET is_pre_launch = false 
WHERE name IN (
  '(08) Launch & Post-Launch',
  '(C4) Post-Market Surveillance (PMS)'
);