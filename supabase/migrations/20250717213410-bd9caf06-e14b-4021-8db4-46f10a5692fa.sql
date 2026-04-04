-- Add applicable_phases column to gap_analysis_items table
ALTER TABLE gap_analysis_items 
ADD COLUMN applicable_phases JSONB DEFAULT '[]'::jsonb;

-- Add index for performance on applicable_phases
CREATE INDEX idx_gap_analysis_items_applicable_phases 
ON gap_analysis_items USING GIN (applicable_phases);

-- Add comment to document the column
COMMENT ON COLUMN gap_analysis_items.applicable_phases IS 'Array of phase IDs that this gap analysis item applies to. Empty array means applies to all phases.';