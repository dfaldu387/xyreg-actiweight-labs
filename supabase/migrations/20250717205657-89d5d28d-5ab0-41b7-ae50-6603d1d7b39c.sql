-- Add applicable_phases field to gap_analysis_templates table
ALTER TABLE gap_analysis_templates 
ADD COLUMN applicable_phases JSONB DEFAULT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN gap_analysis_templates.applicable_phases IS 'JSON array of phase IDs that this template applies to. NULL means applies to all phases.';

-- Create index for better performance when filtering by phases
CREATE INDEX idx_gap_analysis_templates_applicable_phases 
ON gap_analysis_templates USING GIN (applicable_phases);