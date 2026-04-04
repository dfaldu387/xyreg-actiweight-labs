-- Add category column to requirement_specifications table
ALTER TABLE requirement_specifications 
ADD COLUMN category text DEFAULT 'system_use';