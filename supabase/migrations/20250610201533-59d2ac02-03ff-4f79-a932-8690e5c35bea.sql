
-- Fix Document Proliferation: Clean up and redistribute documents from Concept & Feasibility phase
-- This migration addresses the system-wide template proliferation issue
-- Updated to handle foreign key constraints properly

-- Step 1: Create a backup of current state
INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
VALUES (
  'document_proliferation_fix_backup',
  (SELECT jsonb_agg(to_jsonb(pad.*)) FROM phase_assigned_documents pad 
   JOIN phases p ON p.id = pad.phase_id 
   WHERE p.name = '(1) Concept & Feasibility'),
  'document_proliferation_fix'
);

-- Step 2: First, handle documents that reference phase_assigned_documents via template_source_id
-- Update any product documents that reference templates we're about to move/delete
UPDATE documents 
SET template_source_id = NULL 
WHERE template_source_id IN (
  SELECT pad.id 
  FROM phase_assigned_documents pad
  JOIN phases p ON p.id = pad.phase_id
  WHERE p.name = '(1) Concept & Feasibility'
);

-- Step 3: Create temporary mapping table for document redistribution
CREATE TEMP TABLE document_phase_mapping AS
WITH phase_mappings AS (
  SELECT 
    pad.id,
    pad.name as doc_name,
    pad.document_type,
    p.company_id,
    CASE 
      -- Concept & Feasibility documents (keep these)
      WHEN pad.name ILIKE '%Business Case%' OR pad.name ILIKE '%Project Charter%' THEN '(1) Concept & Feasibility'
      WHEN pad.name ILIKE '%Market Analysis%' OR pad.name ILIKE '%Preliminary%Market%' THEN '(1) Concept & Feasibility'
      WHEN pad.name ILIKE '%User Needs Overview%' THEN '(1) Concept & Feasibility'
      WHEN pad.name ILIKE '%Preliminary Hazard%' OR pad.name ILIKE '%PHA%' THEN '(1) Concept & Feasibility'
      WHEN pad.name ILIKE '%Feasibility%' AND NOT pad.name ILIKE '%Report%' THEN '(1) Concept & Feasibility'
      
      -- Design Planning documents
      WHEN pad.name ILIKE '%Design%Plan%' OR pad.name ILIKE '%Development Plan%' THEN '(2) Design Planning'
      WHEN pad.name ILIKE '%Quality Management Plan%' THEN '(2) Design Planning'
      WHEN pad.name ILIKE '%Project Schedule%' OR pad.name ILIKE '%Gantt%' THEN '(2) Design Planning'
      WHEN pad.name ILIKE '%Regulatory Strategy%' OR pad.name ILIKE '%Submission Roadmap%' THEN '(2) Design Planning'
      
      -- Design Input documents
      WHEN pad.name ILIKE '%User Needs Specification%' OR pad.name ILIKE '%UNS%' THEN '(3) Design Input'
      WHEN pad.name ILIKE '%Design Input%' OR pad.name ILIKE '%Requirements Spec%' THEN '(3) Design Input'
      WHEN pad.name ILIKE '%Software Requirements%' OR pad.name ILIKE '%SRS%' THEN '(3) Design Input'
      WHEN pad.name ILIKE '%EMC Requirements%' THEN '(3) Design Input'
      
      -- Design Output documents
      WHEN pad.name ILIKE '%CAD%' OR pad.name ILIKE '%BOM%' THEN '(4) Design Output'
      WHEN pad.name ILIKE '%Software Architecture%' OR pad.name ILIKE '%Code Documentation%' THEN '(4) Design Output'
      WHEN pad.name ILIKE '%Electrical Schematic%' OR pad.name ILIKE '%PCB%' THEN '(4) Design Output'
      WHEN pad.name ILIKE '%Packaging Design%' THEN '(4) Design Output'
      WHEN pad.name ILIKE '%Manufacturing Process%' AND pad.name ILIKE '%Flowchart%' THEN '(4) Design Output'
      WHEN pad.name ILIKE '%Labeling%' AND pad.name ILIKE '%Draft%' THEN '(4) Design Output'
      
      -- Verification documents
      WHEN pad.name ILIKE '%Verification%' THEN '(5) Verification'
      WHEN pad.name ILIKE '%Test Method Validation%' THEN '(5) Verification'
      WHEN pad.name ILIKE '%Calibration Certificate%' THEN '(5) Verification'
      
      -- Validation documents
      WHEN pad.name ILIKE '%Validation%' AND NOT pad.name ILIKE '%Test Method%' THEN '(6) Validation (Design, Clinical, Usability)'
      WHEN pad.name ILIKE '%Clinical Evaluation%' OR pad.name ILIKE '%Clinical Investigation%' THEN '(6) Validation (Design, Clinical, Usability)'
      WHEN pad.name ILIKE '%Usability Engineering%' OR pad.name ILIKE '%UEF%' THEN '(6) Validation (Design, Clinical, Usability)'
      
      -- Design Transfer documents
      WHEN pad.name ILIKE '%Design Transfer%' THEN '(7) Design Transfer'
      WHEN pad.name ILIKE '%Production Equipment%' THEN '(7) Design Transfer'
      WHEN pad.name ILIKE '%Training Records%' AND pad.name ILIKE '%Production%' THEN '(7) Design Transfer'
      
      -- Risk Management documents
      WHEN pad.name ILIKE '%Risk Management%' AND NOT pad.name ILIKE '%Draft%' THEN '(9) Risk Management'
      WHEN pad.name ILIKE '%FMEA%' OR pad.name ILIKE '%Hazard Log%' THEN '(9) Risk Management'
      WHEN pad.name ILIKE '%Risk Control%' OR pad.name ILIKE '%Risk/Benefit%' THEN '(9) Risk Management'
      
      -- Technical Documentation
      WHEN pad.name ILIKE '%Technical File%' OR pad.name ILIKE '%Design Dossier%' THEN '(11) Technical Documentation'
      WHEN pad.name ILIKE '%Device History File%' OR pad.name ILIKE '%DHF%' THEN '(11) Technical Documentation'
      WHEN pad.name ILIKE '%Traceability%' THEN '(11) Technical Documentation'
      WHEN pad.name ILIKE '%Software Lifecycle%' THEN '(11) Technical Documentation'
      
      -- Clinical Evaluation
      WHEN pad.name ILIKE '%Clinical%' AND NOT pad.name ILIKE '%Pre-%' THEN '(12) Clinical Evaluation'
      
      -- Post-Market Surveillance
      WHEN pad.name ILIKE '%Post-Market%' OR pad.name ILIKE '%PMS%' THEN '(13) Post-Market Surveillance'
      WHEN pad.name ILIKE '%Surveillance%' OR pad.name ILIKE '%Vigilance%' THEN '(13) Post-Market Surveillance'
      WHEN pad.name ILIKE '%Complaint%' OR pad.name ILIKE '%Adverse Event%' THEN '(13) Post-Market Surveillance'
      WHEN pad.name ILIKE '%PSUR%' OR pad.name ILIKE '%Safety Update%' THEN '(13) Post-Market Surveillance'
      WHEN pad.name ILIKE '%Recall%' OR pad.name ILIKE '%Field Safety%' THEN '(13) Post-Market Surveillance'
      
      -- Regulatory documents (various phases based on content)
      WHEN pad.name ILIKE '%510(k)%' OR pad.name ILIKE '%PMA%' THEN '(11) Technical Documentation'
      WHEN pad.name ILIKE '%CE Marking%' OR pad.name ILIKE '%Declaration of Conformity%' THEN '(11) Technical Documentation'
      WHEN pad.name ILIKE '%GSPR%' OR pad.name ILIKE '%Essential Requirements%' THEN '(11) Technical Documentation'
      
      -- Testing documents
      WHEN pad.name ILIKE '%Biocompatibility%Testing%' OR pad.name ILIKE '%Electrical Safety%Testing%' THEN '(5) Verification'
      WHEN pad.name ILIKE '%EMC%Testing%' OR pad.name ILIKE '%Software%Testing%' THEN '(5) Verification'
      WHEN pad.name ILIKE '%Sterilization%Validation%' OR pad.name ILIKE '%Shelf Life%' THEN '(6) Validation (Design, Clinical, Usability)'
      
      -- Manufacturing documents
      WHEN pad.name ILIKE '%Manufacturing%' AND NOT pad.name ILIKE '%Process Flowchart%' THEN '(7) Design Transfer'
      WHEN pad.name ILIKE '%Process Validation%' THEN '(7) Design Transfer'
      WHEN pad.name ILIKE '%IQ%' OR pad.name ILIKE '%OQ%' OR pad.name ILIKE '%PQ%' THEN '(7) Design Transfer'
      WHEN pad.name ILIKE '%Supplier%' AND pad.name ILIKE '%Agreement%' THEN '(7) Design Transfer'
      
      -- Quality documents
      WHEN pad.name ILIKE '%Quality Manual%' OR pad.name ILIKE '%Quality Policy%' THEN '(2) Design Planning'
      WHEN pad.name ILIKE '%Document Control%' OR pad.name ILIKE '%Management Review%' THEN '(2) Design Planning'
      WHEN pad.name ILIKE '%CAPA%' OR pad.name ILIKE '%Internal Audit%' THEN '(2) Design Planning'
      
      -- Instructions for Use and Labeling
      WHEN pad.name ILIKE '%Instructions for Use%' OR pad.name ILIKE '%IFU%' THEN '(11) Technical Documentation'
      WHEN pad.name ILIKE '%Device Label%' OR pad.name ILIKE '%Package Label%' THEN '(11) Technical Documentation'
      WHEN pad.name ILIKE '%UDI%' AND NOT pad.name ILIKE '%Draft%' THEN '(11) Technical Documentation'
      
      -- Default: if we can't categorize it properly, keep in original phase but mark for review
      ELSE '(1) Concept & Feasibility'
    END as target_phase_name
  FROM phase_assigned_documents pad
  JOIN phases p ON p.id = pad.phase_id
  WHERE p.name = '(1) Concept & Feasibility'
)
SELECT 
  pm.*,
  tp.id as target_phase_id
FROM phase_mappings pm
JOIN phases tp ON tp.name = pm.target_phase_name AND tp.company_id = pm.company_id;

-- Step 4: Instead of deleting duplicates, update phase_id for documents that should be moved
UPDATE phase_assigned_documents 
SET 
  phase_id = dm.target_phase_id,
  updated_at = now()
FROM document_phase_mapping dm
WHERE phase_assigned_documents.id = dm.id
AND dm.target_phase_name != '(1) Concept & Feasibility';

-- Step 5: For true duplicates (same name, same target phase), delete the extras
WITH duplicate_docs AS (
  SELECT 
    dm.id,
    ROW_NUMBER() OVER (
      PARTITION BY dm.doc_name, dm.company_id, dm.target_phase_name 
      ORDER BY dm.id
    ) as rn
  FROM document_phase_mapping dm
  WHERE dm.target_phase_name != '(1) Concept & Feasibility'
)
DELETE FROM phase_assigned_documents 
WHERE id IN (
  SELECT dm.id 
  FROM document_phase_mapping dm
  JOIN duplicate_docs dd ON dd.id = dm.id
  WHERE dd.rn > 1
);

-- Step 6: Remove inappropriate documents that stayed in Concept & Feasibility
-- Only delete those that are clearly wrong and not referenced
DELETE FROM phase_assigned_documents 
WHERE id IN (
  SELECT pad.id
  FROM phase_assigned_documents pad
  JOIN phases p ON p.id = pad.phase_id
  WHERE p.name = '(1) Concept & Feasibility'
  AND (
    -- Remove detailed technical documents that don't belong in concept phase
    pad.name ILIKE '%Technical File%' OR
    pad.name ILIKE '%Device History File%' OR
    pad.name ILIKE '%Software Lifecycle%' OR
    pad.name ILIKE '%IQ%' OR pad.name ILIKE '%OQ%' OR pad.name ILIKE '%PQ%' OR
    pad.name ILIKE '%Validation Report%' OR
    pad.name ILIKE '%Test Report%' OR
    pad.name ILIKE '%Manufacturing Procedure%' OR
    pad.name ILIKE '%Supplier Quality Agreement%' OR
    pad.name ILIKE '%Post-Market%' OR
    pad.name ILIKE '%Vigilance%' OR
    pad.name ILIKE '%PSUR%' OR
    pad.name ILIKE '%510(k)%' OR
    pad.name ILIKE '%PMA%' OR
    pad.name ILIKE '%CE Marking Technical File%' OR
    pad.name ILIKE '%Declaration of Conformity%' OR
    pad.name ILIKE '%Medical Device License%' OR
    pad.name ILIKE '%Clinical Study Report%' OR
    pad.name ILIKE '%Usability Validation%' OR
    pad.name ILIKE '%Biocompatibility Testing%' OR
    pad.name ILIKE '%EMC Testing%' OR
    pad.name ILIKE '%Sterilization Validation%'
  )
  -- Only delete if not referenced by any documents
  AND NOT EXISTS (
    SELECT 1 FROM documents d WHERE d.template_source_id = pad.id
  )
);

-- Step 7: Clean up remaining duplicates in Concept & Feasibility
WITH concept_duplicates AS (
  SELECT 
    pad.id,
    ROW_NUMBER() OVER (
      PARTITION BY pad.name, p.company_id 
      ORDER BY pad.created_at
    ) as rn
  FROM phase_assigned_documents pad
  JOIN phases p ON p.id = pad.phase_id
  WHERE p.name = '(1) Concept & Feasibility'
)
DELETE FROM phase_assigned_documents 
WHERE id IN (
  SELECT cd.id 
  FROM concept_duplicates cd
  WHERE cd.rn > 1
  -- Only delete if not referenced by any documents
  AND NOT EXISTS (
    SELECT 1 FROM documents d WHERE d.template_source_id = cd.id
  )
);

-- Step 8: Ensure we have the core concept documents
INSERT INTO phase_assigned_documents (phase_id, name, document_type, status, tech_applicability, markets, classes_by_market, document_scope)
SELECT DISTINCT
  p.id as phase_id,
  core_docs.name,
  core_docs.doc_type,
  'Not Started',
  'All device types',
  '["US", "EU", "CA", "AU", "JP"]'::jsonb,
  '{"US": ["I", "II", "III"], "EU": ["I", "IIa", "IIb", "III"], "CA": ["I", "II", "III", "IV"]}'::jsonb,
  'company_template'::document_scope
FROM phases p
CROSS JOIN (VALUES 
  ('Business Case / Project Charter', 'Standard'),
  ('Preliminary Market Analysis', 'Standard'),
  ('User Needs Overview', 'Regulatory'),
  ('Preliminary Hazard Analysis (PHA)', 'Regulatory'),
  ('Draft Risk Management Plan', 'Regulatory'),
  ('Stakeholder Requirements Specification', 'Technical'),
  ('High-Level Architecture / Concept Diagram', 'Technical'),
  ('Regulatory Strategy Outline', 'Regulatory'),
  ('Intellectual Property (IP) Review', 'Standard'),
  ('Resource & Budget Feasibility Study', 'Standard')
) AS core_docs(name, doc_type)
WHERE p.name = '(1) Concept & Feasibility'
AND NOT EXISTS (
  SELECT 1 FROM phase_assigned_documents pad2 
  WHERE pad2.phase_id = p.id 
  AND pad2.name = core_docs.name
);

-- Step 9: Log the completion
INSERT INTO archived_pms_data (table_name, migration_phase, archived_data, archived_at)
VALUES (
  'document_proliferation_fix_completed',
  'document_proliferation_fix',
  jsonb_build_object(
    'fix_completed_at', now(),
    'concept_feasibility_docs_after_fix', (
      SELECT COUNT(*) FROM phase_assigned_documents pad 
      JOIN phases p ON p.id = pad.phase_id 
      WHERE p.name = '(1) Concept & Feasibility'
    )
  ),
  now()
);
