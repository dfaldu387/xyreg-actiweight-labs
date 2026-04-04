-- Enhanced Gap Analysis Structure Migration
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

-- Update existing gap analysis templates with MDR Annex I structure
-- Insert MDR Annex I Chapter I requirements with the detailed structure
INSERT INTO gap_templates (id, name, framework, description, importance, scope, is_active, is_custom, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'MDR Annex I Enhanced',
  'MDR Annex I',
  'Enhanced MDR Annex I compliance checklist with detailed ownership matrix and evidence requirements',
  'high',
  'product',
  true,
  false,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Get the template ID for MDR Annex I Enhanced
DO $$
DECLARE
  template_uuid uuid;
BEGIN
  SELECT id INTO template_uuid FROM gap_templates WHERE name = 'MDR Annex I Enhanced' LIMIT 1;
  
  -- Insert Chapter I requirements with enhanced structure
  INSERT INTO gap_template_items (
    id, template_id, item_number, clause_reference, requirement_text, requirement_summary,
    guidance_text, evidence_requirements, applicable_standards, key_standards, excludes_if,
    chapter, subsection, qa_ra_owner, rd_owner, mfg_ops_owner, labeling_owner, clinical_owner, other_owner,
    category, priority, sort_order, created_at, updated_at
  ) VALUES
  (gen_random_uuid(), template_uuid, '1', '1', 'Devices must be safe, effective, suitable for their intended purpose, and have an acceptable benefit-risk ratio.', 'Overall device benefit-risk must be positive', 'Review the final RMF and CER to confirm the overall benefit-risk conclusion is positive.', '["Risk Management File review", "Clinical Evaluation Report review"]'::jsonb, '["ISO 14971", "MEDDEV 2.7/1 rev 4"]'::jsonb, 'ISO 14971, MEDDEV 2.7/1 rev 4', 'Never excluded', 'CHAPTER I - GENERAL REQUIREMENTS', null, 'primary', 'secondary', 'none', 'none', 'secondary', 'none', 'compliance', 'high', 1, now(), now()),
  
  (gen_random_uuid(), template_uuid, '2', '2', 'Reducing risk "as far as possible" means doing so without negatively impacting the benefit-risk ratio.', 'Risk reduction without negative benefit-risk impact', 'Review the risk control option analysis and benefit-risk analysis within the RMF.', '["Risk control option analysis", "Benefit-risk analysis"]'::jsonb, '["ISO 14971"]'::jsonb, 'ISO 14971', 'Never excluded', 'CHAPTER I - GENERAL REQUIREMENTS', null, 'primary', 'secondary', 'none', 'none', 'secondary', 'none', 'compliance', 'high', 2, now(), now()),
  
  (gen_random_uuid(), template_uuid, '3', '3', 'A risk management system must be established, implemented, and maintained as a continuous iterative process.', 'Risk management system establishment', 'Review the Risk Management Procedure and Risk Management Plan.', '["Risk Management Procedure", "Risk Management Plan"]'::jsonb, '["ISO 14971", "ISO 13485"]'::jsonb, 'ISO 14971, ISO 13485', 'Never excluded', 'CHAPTER I - GENERAL REQUIREMENTS', null, 'primary', 'secondary', 'none', 'none', 'none', 'none', 'compliance', 'high', 3, now(), now()),
  
  (gen_random_uuid(), template_uuid, '3(a)', '3(a)', 'Establish and document a risk management plan for each device.', 'Device-specific risk management plan', 'Review the device-specific Risk Management Plan to confirm it is complete and approved.', '["Risk Management Plan", "Plan approval records"]'::jsonb, '["ISO 14971"]'::jsonb, 'ISO 14971', 'Never excluded', 'CHAPTER I - GENERAL REQUIREMENTS', 'a', 'primary', 'secondary', 'none', 'none', 'none', 'none', 'documentation', 'high', 4, now(), now()),
  
  (gen_random_uuid(), template_uuid, '3(b)', '3(b)', 'Identify and analyse the known and foreseeable hazards associated with each device.', 'Hazard identification and analysis', 'Review the hazard analysis (e.g., FMEA, PHA) within the RMF.', '["FMEA", "Preliminary Hazard Analysis", "Hazard identification records"]'::jsonb, '["ISO 14971"]'::jsonb, 'ISO 14971', 'Never excluded', 'CHAPTER I - GENERAL REQUIREMENTS', 'b', 'secondary', 'primary', 'none', 'none', 'secondary', 'none', 'verification', 'high', 5, now(), now()),
  
  (gen_random_uuid(), template_uuid, '3(c)', '3(c)', 'Estimate and evaluate the risks associated with intended use and reasonably foreseeable misuse.', 'Risk evaluation for intended and misuse', 'Review the risk evaluation matrices and records within the RMF.', '["Risk evaluation matrices", "Risk assessment records"]'::jsonb, '["ISO 14971"]'::jsonb, 'ISO 14971', 'Never excluded', 'CHAPTER I - GENERAL REQUIREMENTS', 'c', 'secondary', 'primary', 'none', 'none', 'secondary', 'none', 'verification', 'high', 6, now(), now()),
  
  (gen_random_uuid(), template_uuid, '3(d)', '3(d)', 'Eliminate or control risks in accordance with the requirements of Section 4.', 'Risk elimination and control measures', 'Review the risk control measures and their verification of effectiveness within the RMF.', '["Risk control measures", "Effectiveness verification"]'::jsonb, '["ISO 14971"]'::jsonb, 'ISO 14971', 'Never excluded', 'CHAPTER I - GENERAL REQUIREMENTS', 'd', 'secondary', 'primary', 'none', 'none', 'none', 'none', 'verification', 'high', 7, now(), now()),
  
  (gen_random_uuid(), template_uuid, '3(e)', '3(e)', 'Evaluate the impact of production and post-market surveillance (PMS) information on risks.', 'PMS impact on risk evaluation', 'Review the procedure linking the PMS system to the risk management system. Examine records of PMS data being used to update the RMF.', '["PMS procedure", "Risk management integration", "PMS data review records"]'::jsonb, '["ISO 14971", "ISO 13485"]'::jsonb, 'ISO 14971, ISO 13485', 'Never excluded', 'CHAPTER I - GENERAL REQUIREMENTS', 'e', 'primary', 'secondary', 'none', 'none', 'secondary', 'none', 'compliance', 'high', 8, now(), now()),
  
  (gen_random_uuid(), template_uuid, '3(f)', '3(f)', 'If necessary based on PMS data, amend risk control measures.', 'Risk control amendments from PMS', 'Review updated versions of the RMF to confirm that PMS data has led to changes in risk controls where required.', '["Updated RMF versions", "PMS-driven changes"]'::jsonb, '["ISO 14971"]'::jsonb, 'ISO 14971', 'Never excluded', 'CHAPTER I - GENERAL REQUIREMENTS', 'f', 'primary', 'secondary', 'none', 'none', 'none', 'none', 'compliance', 'high', 9, now(), now());
END $$;