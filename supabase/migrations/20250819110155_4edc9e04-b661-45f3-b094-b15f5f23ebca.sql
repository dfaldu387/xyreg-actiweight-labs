-- Add template_data column to phase_assigned_documents for storing AI-generated template structures
ALTER TABLE phase_assigned_documents 
ADD COLUMN IF NOT EXISTS template_data jsonb DEFAULT NULL;

-- Add description column if it doesn't exist
ALTER TABLE phase_assigned_documents 
ADD COLUMN IF NOT EXISTS description text DEFAULT NULL;

-- Create index for template_data queries
CREATE INDEX IF NOT EXISTS idx_phase_assigned_documents_template_data 
ON phase_assigned_documents USING gin(template_data);