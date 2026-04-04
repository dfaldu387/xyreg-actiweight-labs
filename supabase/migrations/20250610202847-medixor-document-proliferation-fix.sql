
-- Targeted Document Proliferation Fix for Medixor AB
-- Redistributes inappropriate documents from Concept & Feasibility to correct phases

-- Step 1: Create backup of current state for Medixor AB
INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
SELECT 
  'medixor_document_proliferation_backup',
  jsonb_agg(to_jsonb(pad.*)),
  'medixor_document_proliferation_fix'
FROM phase_assigned_documents pad 
JOIN phases p ON p.id = pad.phase_id 
JOIN companies c ON c.id = p.company_id
WHERE c.name = 'Medixor AB' 
AND p.name ILIKE '%Concept%Feasibility%';

-- Step 2: Handle documents that reference phase_assigned_documents via template_source_id
UPDATE documents 
SET template_source_id = NULL 
WHERE template_source_id IN (
  SELECT pad.id 
  FROM phase_assigned_documents pad
  JOIN phases p ON p.id = pad.phase_id
  JOIN companies c ON c.id = p.company_id
  WHERE c.name = 'Medixor AB' 
  AND p.name ILIKE '%Concept%Feasibility%'
);

-- Step 3: Create temporary table for document redistribution mapping
CREATE TEMP TABLE medixor_doc_mapping AS
WITH medixor_phases AS (
  SELECT p.id, p.name, p.company_id
  FROM phases p
  JOIN companies c ON c.id = p.company_id
  WHERE c.name = 'Medixor AB'
),
concept_phase AS (
  SELECT id as concept_phase_id 
  FROM medixor_phases 
  WHERE name ILIKE '%Concept%Feasibility%'
)
SELECT 
  pad.id as doc_id,
  pad.name as doc_name,
  pad.document_type,
  CASE 
    -- Design Input documents
    WHEN pad.name ILIKE '%User Needs Specification%' OR pad.name ILIKE '%UNS%' THEN 'Design Input'
    WHEN pad.name ILIKE '%Design Input%' OR pad.name ILIKE '%Requirements Spec%' THEN 'Design Input'
    WHEN pad.name ILIKE '%Software Requirements%' OR pad.name ILIKE '%SRS%' THEN 'Design Input'
    WHEN pad.name ILIKE '%EMC Requirements%' THEN 'Design Input'
    
    -- Design Output documents
    WHEN pad.name ILIKE '%CAD%' OR pad.name ILIKE '%BOM%' THEN 'Design Output'
    WHEN pad.name ILIKE '%Software Architecture%' OR pad.name ILIKE '%Code Documentation%' THEN 'Design Output'
    WHEN pad.name ILIKE '%Electrical Schematic%' OR pad.name ILIKE '%PCB%' THEN 'Design Output'
    WHEN pad.name ILIKE '%Packaging Design%' THEN 'Design Output'
    WHEN pad.name ILIKE '%Manufacturing Process%' AND pad.name ILIKE '%Flowchart%' THEN 'Design Output'
    WHEN pad.name ILIKE '%Labeling%' AND pad.name ILIKE '%Draft%' THEN 'Design Output'
    
    -- Verification documents
    WHEN pad.name ILIKE '%Verification%' THEN 'Verification'
    WHEN pad.name ILIKE '%Test Method Validation%' THEN 'Verification'
    WHEN pad.name ILIKE '%Calibration Certificate%' THEN 'Verification'
    WHEN pad.name ILIKE '%Testing%' AND NOT pad.name ILIKE '%Plan%' THEN 'Verification'
    
    -- Validation documents
    WHEN pad.name ILIKE '%Validation%' AND NOT pad.name ILIKE '%Test Method%' THEN 'Validation (Design, Clinical, Usability)'
    WHEN pad.name ILIKE '%Clinical Evaluation%' OR pad.name ILIKE '%Clinical Investigation%' THEN 'Validation (Design, Clinical, Usability)'
    WHEN pad.name ILIKE '%Usability Engineering%' OR pad.name ILIKE '%UEF%' THEN 'Validation (Design, Clinical, Usability)'
    
    -- Design Transfer documents
    WHEN pad.name ILIKE '%Design Transfer%' THEN 'Design Transfer'
    WHEN pad.name ILIKE '%Production Equipment%' THEN 'Design Transfer'
    WHEN pad.name ILIKE '%Training Records%' AND pad.name ILIKE '%Production%' THEN 'Design Transfer'
    WHEN pad.name ILIKE '%Manufacturing%' AND NOT pad.name ILIKE '%Process Flowchart%' THEN 'Design Transfer'
    WHEN pad.name ILIKE '%Process Validation%' THEN 'Design Transfer'
    WHEN pad.name ILIKE '%IQ%' OR pad.name ILIKE '%OQ%' OR pad.name ILIKE '%PQ%' THEN 'Design Transfer'
    
    -- Risk Management documents
    WHEN pad.name ILIKE '%Risk Management%' AND NOT pad.name ILIKE '%Draft%' AND NOT pad.name ILIKE '%Plan%' THEN 'Risk Management'
    WHEN pad.name ILIKE '%FMEA%' OR pad.name ILIKE '%Hazard Log%' THEN 'Risk Management'
    WHEN pad.name ILIKE '%Risk Control%' OR pad.name ILIKE '%Risk/Benefit%' THEN 'Risk Management'
    
    -- Technical Documentation
    WHEN pad.name ILIKE '%Technical File%' OR pad.name ILIKE '%Design Dossier%' THEN 'Technical Documentation'
    WHEN pad.name ILIKE '%Device History File%' OR pad.name ILIKE '%DHF%' THEN 'Technical Documentation'
    WHEN pad.name ILIKE '%Traceability%' THEN 'Technical Documentation'
    WHEN pad.name ILIKE '%Software Lifecycle%' THEN 'Technical Documentation'
    WHEN pad.name ILIKE '%510(k)%' OR pad.name ILIKE '%PMA%' THEN 'Technical Documentation'
    WHEN pad.name ILIKE '%CE Marking%' OR pad.name ILIKE '%Declaration of Conformity%' THEN 'Technical Documentation'
    WHEN pad.name ILIKE '%GSPR%' OR pad.name ILIKE '%Essential Requirements%' THEN 'Technical Documentation'
    WHEN pad.name ILIKE '%Instructions for Use%' OR pad.name ILIKE '%IFU%' THEN 'Technical Documentation'
    WHEN pad.name ILIKE '%Device Label%' OR pad.name ILIKE '%Package Label%' THEN 'Technical Documentation'
    WHEN pad.name ILIKE '%UDI%' AND NOT pad.name ILIKE '%Draft%' THEN 'Technical Documentation'
    
    -- Post-Market Surveillance
    WHEN pad.name ILIKE '%Post-Market%' OR pad.name ILIKE '%PMS%' THEN 'Post-Market Surveillance'
    WHEN pad.name ILIKE '%Surveillance%' OR pad.name ILIKE '%Vigilance%' THEN 'Post-Market Surveillance'
    WHEN pad.name ILIKE '%Complaint%' OR pad.name ILIKE '%Adverse Event%' THEN 'Post-Market Surveillance'
    WHEN pad.name ILIKE '%PSUR%' OR pad.name ILIKE '%Safety Update%' THEN 'Post-Market Surveillance'
    WHEN pad.name ILIKE '%Recall%' OR pad.name ILIKE '%Field Safety%' THEN 'Post-Market Surveillance'
    
    -- Design Planning documents
    WHEN pad.name ILIKE '%Design%Plan%' OR pad.name ILIKE '%Development Plan%' THEN 'Design Planning'
    WHEN pad.name ILIKE '%Quality Management Plan%' THEN 'Design Planning'
    WHEN pad.name ILIKE '%Project Schedule%' OR pad.name ILIKE '%Gantt%' THEN 'Design Planning'
    WHEN pad.name ILIKE '%Regulatory Strategy%' OR pad.name ILIKE '%Submission Roadmap%' THEN 'Design Planning'
    
    -- Testing documents
    WHEN pad.name ILIKE '%Biocompatibility%Testing%' OR pad.name ILIKE '%Electrical Safety%Testing%' THEN 'Verification'
    WHEN pad.name ILIKE '%EMC%Testing%' OR pad.name ILIKE '%Software%Testing%' THEN 'Verification'
    WHEN pad.name ILIKE '%Sterilization%Validation%' OR pad.name ILIKE '%Shelf Life%' THEN 'Validation (Design, Clinical, Usability)'
    
    ELSE NULL -- Keep in Concept & Feasibility
  END as target_phase_name
FROM phase_assigned_documents pad
CROSS JOIN concept_phase cp
WHERE pad.phase_id = cp.concept_phase_id
AND pad.name NOT ILIKE '%Concept%'
AND pad.name NOT ILIKE '%Feasibility Study%'
AND pad.name NOT ILIKE '%Business Case%'
AND pad.name NOT ILIKE '%Project Charter%'
AND pad.name NOT ILIKE '%Preliminary%'
AND pad.name NOT ILIKE '%Market Analysis%';

-- Step 4: Update phase assignments for inappropriate documents
UPDATE phase_assigned_documents 
SET 
  phase_id = mp.id,
  updated_at = now()
FROM medixor_doc_mapping mdm
JOIN phases mp ON mp.name ILIKE '%' || mdm.target_phase_name || '%'
JOIN companies c ON c.id = mp.company_id
WHERE phase_assigned_documents.id = mdm.doc_id
AND mdm.target_phase_name IS NOT NULL
AND c.name = 'Medixor AB';

-- Step 5: Delete documents that couldn't be mapped to existing phases
DELETE FROM phase_assigned_documents 
WHERE id IN (
  SELECT mdm.doc_id
  FROM medixor_doc_mapping mdm
  WHERE mdm.target_phase_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM phases mp 
    JOIN companies c ON c.id = mp.company_id
    WHERE c.name = 'Medixor AB'
    AND mp.name ILIKE '%' || mdm.target_phase_name || '%'
  )
  -- Only delete if not referenced by any documents
  AND NOT EXISTS (
    SELECT 1 FROM documents d WHERE d.template_source_id = mdm.doc_id
  )
);

-- Step 6: Remove true duplicates within Concept & Feasibility
WITH concept_duplicates AS (
  SELECT 
    pad.id,
    ROW_NUMBER() OVER (
      PARTITION BY pad.name, p.company_id 
      ORDER BY pad.created_at
    ) as rn
  FROM phase_assigned_documents pad
  JOIN phases p ON p.id = pad.phase_id
  JOIN companies c ON c.id = p.company_id
  WHERE c.name = 'Medixor AB' 
  AND p.name ILIKE '%Concept%Feasibility%'
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

-- Step 7: Ensure core concept documents exist
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
JOIN companies c ON c.id = p.company_id
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
WHERE c.name = 'Medixor AB' 
AND p.name ILIKE '%Concept%Feasibility%'
AND NOT EXISTS (
  SELECT 1 FROM phase_assigned_documents pad2 
  WHERE pad2.phase_id = p.id 
  AND pad2.name = core_docs.name
);

-- Step 8: Clean up temporary table
DROP TABLE medixor_doc_mapping;

-- Step 9: Log the completion
INSERT INTO archived_pms_data (table_name, migration_phase, archived_data, archived_at)
VALUES (
  'medixor_document_proliferation_fix_completed',
  'medixor_document_proliferation_fix',
  jsonb_build_object(
    'fix_completed_at', now(),
    'medixor_concept_feasibility_docs_after_fix', (
      SELECT COUNT(*) FROM phase_assigned_documents pad 
      JOIN phases p ON p.id = pad.phase_id 
      JOIN companies c ON c.id = p.company_id
      WHERE c.name = 'Medixor AB' 
      AND p.name ILIKE '%Concept%Feasibility%'
    )
  ),
  now()
);
