-- Add new enum values for functional_area to support department structure names
ALTER TYPE functional_area ADD VALUE IF NOT EXISTS 'design_development';

-- Update the user_company_access table to handle the new department structure
-- We'll keep both the old enum values and add support for the new department names