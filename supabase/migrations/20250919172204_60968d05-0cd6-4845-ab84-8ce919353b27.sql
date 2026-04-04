-- Add support for 'both' option in scope field
-- First update existing records that might need the 'both' value
-- Then add a check constraint to ensure only valid values

-- Update the company_document_templates table to support 'both'
ALTER TABLE company_document_templates 
DROP CONSTRAINT IF EXISTS company_document_templates_scope_check;

ALTER TABLE company_document_templates 
ADD CONSTRAINT company_document_templates_scope_check 
CHECK (scope IN ('company', 'product', 'both'));

-- Update the default_company_document_template table to support 'both'  
ALTER TABLE default_company_document_template 
DROP CONSTRAINT IF EXISTS default_company_document_template_scope_check;

ALTER TABLE default_company_document_template 
ADD CONSTRAINT default_company_document_template_scope_check 
CHECK (scope IN ('company', 'product', 'both'));

-- Set a default value for scope if it's null
UPDATE company_document_templates 
SET scope = 'company' 
WHERE scope IS NULL;

UPDATE default_company_document_template 
SET scope = 'company' 
WHERE scope IS NULL;