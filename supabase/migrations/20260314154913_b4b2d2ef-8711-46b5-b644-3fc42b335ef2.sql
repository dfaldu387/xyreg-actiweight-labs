
ALTER TABLE gap_analysis_templates ADD COLUMN is_core boolean NOT NULL DEFAULT false;

UPDATE gap_analysis_templates SET is_core = true 
WHERE framework IN ('ISO_13485', 'ISO_14971', 'MDR_ANNEX_I', 'MDR_ANNEX_II', 'MDR_ANNEX_III');
