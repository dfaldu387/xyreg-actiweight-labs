-- Add start_date and end_date fields to company_audits table
ALTER TABLE company_audits 
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;

-- Add start_date and end_date fields to product_audits table  
ALTER TABLE product_audits 
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;

-- Add phase_id field to company_audits and product_audits for multi-phase support
ALTER TABLE company_audits 
ADD COLUMN phase_id UUID REFERENCES phases(id);

ALTER TABLE product_audits 
ADD COLUMN phase_id UUID REFERENCES phases(id);

-- Update existing records to use deadline_date as end_date for backward compatibility
UPDATE company_audits 
SET end_date = deadline_date 
WHERE deadline_date IS NOT NULL AND end_date IS NULL;

UPDATE product_audits 
SET end_date = deadline_date 
WHERE deadline_date IS NOT NULL AND end_date IS NULL;