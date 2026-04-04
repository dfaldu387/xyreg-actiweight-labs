-- Add evidence fields to gap_analysis_items table
ALTER TABLE gap_analysis_items 
ADD COLUMN IF NOT EXISTS evidence_method TEXT,
ADD COLUMN IF NOT EXISTS evidence_of_conformity JSONB DEFAULT '[]'::jsonb;