-- Remove old percentage range constraints for company_phases
-- These constraints were designed for percentages (0-100) but now we need to support days after launch (0-999999)

-- Drop the existing check constraints that limit percentage ranges
ALTER TABLE company_phases 
DROP CONSTRAINT IF EXISTS end_percentage_range,
DROP CONSTRAINT IF EXISTS start_percentage_range;

-- Add new more flexible constraints that allow both percentages and days
-- For percentages: 0-100, for days after launch: 0-999999
ALTER TABLE company_phases 
ADD CONSTRAINT start_percentage_range CHECK (start_percentage >= 0 AND start_percentage <= 999999),
ADD CONSTRAINT end_percentage_range CHECK (end_percentage >= 0 AND end_percentage <= 999999);

-- Also update phases table if it has similar constraints
DO $$
BEGIN
    -- Check if constraints exist and drop them
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'phases' AND constraint_name = 'start_percentage_range') THEN
        ALTER TABLE phases DROP CONSTRAINT start_percentage_range;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'phases' AND constraint_name = 'end_percentage_range') THEN
        ALTER TABLE phases DROP CONSTRAINT end_percentage_range;
    END IF;
    
    -- Add new flexible constraints for phases table if it has the columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phases' AND column_name = 'start_percentage') THEN
        ALTER TABLE phases 
        ADD CONSTRAINT start_percentage_range CHECK (start_percentage >= 0 AND start_percentage <= 999999),
        ADD CONSTRAINT end_percentage_range CHECK (end_percentage >= 0 AND end_percentage <= 999999);
    END IF;
END $$;