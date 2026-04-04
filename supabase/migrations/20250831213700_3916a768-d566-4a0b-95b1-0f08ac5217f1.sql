-- Enhanced Gap Analysis Structure Migration - Part 1
-- Add missing fields for comprehensive gap analysis support

-- Add subsection field to gap_template_items
ALTER TABLE gap_template_items ADD COLUMN IF NOT EXISTS subsection text;

-- Add requirement summary field (more concise than requirement_text)
ALTER TABLE gap_template_items ADD COLUMN IF NOT EXISTS requirement_summary text;

-- Add ownership matrix fields for departmental assignments
ALTER TABLE gap_template_items ADD COLUMN IF NOT EXISTS qa_ra_owner text CHECK (qa_ra_owner IN ('primary', 'secondary', 'none'));
ALTER TABLE gap_template_items ADD COLUMN IF NOT EXISTS rd_owner text CHECK (rd_owner IN ('primary', 'secondary', 'none'));
ALTER TABLE gap_template_items ADD COLUMN IF NOT EXISTS mfg_ops_owner text CHECK (mfg_ops_owner IN ('primary', 'secondary', 'none'));
ALTER TABLE gap_template_items ADD COLUMN IF NOT EXISTS labeling_owner text CHECK (labeling_owner IN ('primary', 'secondary', 'none'));
ALTER TABLE gap_template_items ADD COLUMN IF NOT EXISTS clinical_owner text CHECK (clinical_owner IN ('primary', 'secondary', 'none'));
ALTER TABLE gap_template_items ADD COLUMN IF NOT EXISTS other_owner text CHECK (other_owner IN ('primary', 'secondary', 'none'));

-- Add chapter field for better organization
ALTER TABLE gap_template_items ADD COLUMN IF NOT EXISTS chapter text;

-- Add the same fields to gap_analysis_items for consistency
ALTER TABLE gap_analysis_items ADD COLUMN IF NOT EXISTS subsection text;
ALTER TABLE gap_analysis_items ADD COLUMN IF NOT EXISTS requirement_summary text;
ALTER TABLE gap_analysis_items ADD COLUMN IF NOT EXISTS qa_ra_owner text CHECK (qa_ra_owner IN ('primary', 'secondary', 'none'));
ALTER TABLE gap_analysis_items ADD COLUMN IF NOT EXISTS rd_owner text CHECK (rd_owner IN ('primary', 'secondary', 'none'));
ALTER TABLE gap_analysis_items ADD COLUMN IF NOT EXISTS mfg_ops_owner text CHECK (mfg_ops_owner IN ('primary', 'secondary', 'none'));
ALTER TABLE gap_analysis_items ADD COLUMN IF NOT EXISTS labeling_owner text CHECK (labeling_owner IN ('primary', 'secondary', 'none'));
ALTER TABLE gap_analysis_items ADD COLUMN IF NOT EXISTS clinical_owner text CHECK (clinical_owner IN ('primary', 'secondary', 'none'));
ALTER TABLE gap_analysis_items ADD COLUMN IF NOT EXISTS other_owner text CHECK (other_owner IN ('primary', 'secondary', 'none'));
ALTER TABLE gap_analysis_items ADD COLUMN IF NOT EXISTS chapter text;

-- Create index for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_gap_template_items_chapter ON gap_template_items(chapter);
CREATE INDEX IF NOT EXISTS idx_gap_template_items_owners ON gap_template_items(qa_ra_owner, rd_owner, mfg_ops_owner, labeling_owner, clinical_owner, other_owner);
CREATE INDEX IF NOT EXISTS idx_gap_analysis_items_chapter ON gap_analysis_items(chapter);
CREATE INDEX IF NOT EXISTS idx_gap_analysis_items_owners ON gap_analysis_items(qa_ra_owner, rd_owner, mfg_ops_owner, labeling_owner, clinical_owner, other_owner);