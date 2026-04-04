-- Add structure column to store full template structure including sections and fields
ALTER TABLE company_document_templates 
ADD COLUMN structure JSONB DEFAULT NULL;

-- Add comment to explain the structure column
COMMENT ON COLUMN company_document_templates.structure IS 'Stores the complete template structure including sections and fields from AI analysis';