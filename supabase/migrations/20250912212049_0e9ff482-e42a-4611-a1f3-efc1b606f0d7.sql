-- Add audit_interval field to suppliers table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='suppliers' AND column_name='audit_interval') THEN
        ALTER TABLE suppliers ADD COLUMN audit_interval TEXT;
    END IF;
END $$;