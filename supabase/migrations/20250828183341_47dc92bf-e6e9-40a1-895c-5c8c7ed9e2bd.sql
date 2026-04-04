-- Add percentage-based timeline fields for continuous phases
ALTER TABLE company_phases 
ADD COLUMN start_percentage numeric(5,2) DEFAULT NULL,
ADD COLUMN end_percentage numeric(5,2) DEFAULT NULL;

-- Add constraints to ensure valid percentage ranges
ALTER TABLE company_phases 
ADD CONSTRAINT start_percentage_range CHECK (start_percentage >= 0 AND start_percentage <= 100),
ADD CONSTRAINT end_percentage_range CHECK (end_percentage >= 0 AND end_percentage <= 100),
ADD CONSTRAINT percentage_order CHECK (start_percentage IS NULL OR end_percentage IS NULL OR start_percentage < end_percentage);

-- Set default percentages for existing continuous phases
UPDATE company_phases 
SET start_percentage = 0, end_percentage = 100 
WHERE is_continuous_process = true AND name ILIKE '%risk%';

UPDATE company_phases 
SET start_percentage = 7.5, end_percentage = 70 
WHERE is_continuous_process = true AND (name ILIKE '%technical%' OR name ILIKE '%documentation%');

UPDATE company_phases 
SET start_percentage = 0, end_percentage = 100 
WHERE is_continuous_process = true AND start_percentage IS NULL;