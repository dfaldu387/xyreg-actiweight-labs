-- Update precision of percentage fields to accommodate both percentages and days after launch
-- Change from numeric(5,2) to numeric(8,2) to allow values up to 999,999.99

-- Update company_phases table
ALTER TABLE company_phases 
ALTER COLUMN start_percentage TYPE numeric(8,2),
ALTER COLUMN end_percentage TYPE numeric(8,2);

-- Update phases table if it has these columns
DO $$
BEGIN
    -- Check if columns exist before altering
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phases' AND column_name = 'start_percentage') THEN
        ALTER TABLE phases 
        ALTER COLUMN start_percentage TYPE numeric(8,2),
        ALTER COLUMN end_percentage TYPE numeric(8,2);
    END IF;
END $$;