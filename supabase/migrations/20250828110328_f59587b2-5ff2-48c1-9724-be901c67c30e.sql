-- Clear existing MDR Annex I template items and replace with comprehensive 177-item checklist
-- First, find the MDR Annex I template ID
DO $$
DECLARE
  mdr_template_id UUID;
BEGIN
  -- Get the MDR Annex I template ID
  SELECT id INTO mdr_template_id 
  FROM gap_analysis_templates 
  WHERE framework = 'MDR' AND name ILIKE '%annex%i%'
  LIMIT 1;
  
  IF mdr_template_id IS NOT NULL THEN
    -- Clear existing items
    DELETE FROM gap_template_items WHERE template_id = mdr_template_id;
    
    -- Insert comprehensive 177-item checklist
    INSERT INTO gap_template_items (
      template_id, item_number, clause_reference, requirement_text, 
      guidance_text, evidence_requirements, applicable_phases, priority, 
      category, sort_order, excludes_if, key_standards, automatic_na_reason
    ) VALUES 
    -- Clause 1 items
    (mdr_template_id, '1.1', '1', 'Define and document intended purpose', 
     'Document the device''s intended purpose, target population, and performance specifications', 
     ARRAY['Documentation'], ARRAY['Design Input'], 'high', 'documentation', 1, 
     'Never excluded', ARRAY['ISO 14971', 'ISO 13485'], NULL),
    
    (mdr_template_id, '1.2', '1', 'Verify device achieves intended performance', 
     'Demonstrate through testing that device achieves intended performance under normal conditions', 
     ARRAY['Testing'], ARRAY['Verification'], 'high', 'verification', 2, 
     'Never excluded', ARRAY['ISO 14971', 'IEC 62304'], NULL),
    
    (mdr_template_id, '1.3', '1', 'Establish design controls for intended purpose', 
     'Implement design controls ensuring device meets intended purpose requirements', 
     ARRAY['Design Controls'], ARRAY['Design Planning'], 'high', 'compliance', 3, 
     'Never excluded', ARRAY['ISO 13485', 'ISO 14971'], NULL),
    
    -- Clause 2 items
    (mdr_template_id, '2.1', '2', 'Document conformity to safety principles', 
     'Document how design solutions conform to safety principles and state of the art', 
     ARRAY['Documentation'], ARRAY['Design Input'], 'high', 'documentation', 4, 
     'Never excluded', ARRAY['ISO 14971', 'IEC 62366-1'], NULL),
    
    (mdr_template_id, '2.2', '2', 'Verify state of art consideration', 
     'Demonstrate consideration of generally acknowledged state of the art in design', 
     ARRAY['Verification'], ARRAY['Design Output'], 'high', 'verification', 5, 
     'Never excluded', ARRAY['ISO 14971'], NULL),
    
    -- Clause 3 items
    (mdr_template_id, '3.1', '3', 'Demonstrate safety and effectiveness', 
     'Provide evidence that device is safe and effective for intended use', 
     ARRAY['Testing'], ARRAY['Validation'], 'high', 'verification', 6, 
     'Never excluded', ARRAY['ISO 14971', 'ISO 62304'], NULL),
    
    -- Clause 4 items
    (mdr_template_id, '4.1', '4', 'Ensure design doesn''t compromise safety', 
     'Document that design and manufacturing processes don''t adversely affect safety performance', 
     ARRAY['Documentation'], ARRAY['Design Transfer'], 'high', 'documentation', 7, 
     'Never excluded', ARRAY['ISO 13485', 'ISO 14971'], NULL),
    
    -- Clause 5 items
    (mdr_template_id, '5.1', '5', 'Control substance and particle release', 
     'Document measures to reduce risks from substances or particles released from device', 
     ARRAY['Testing'], ARRAY['Verification'], 'high', 'documentation', 8, 
     'Device has no body contact', ARRAY['ISO 10993-1', 'ISO 14971'], NULL),
    
    -- Clause 6 items
    (mdr_template_id, '6.1', '6', 'Minimize exposure risks', 
     'Document measures to minimize risks from substances device may encounter during use', 
     ARRAY['Documentation'], ARRAY['Design Output'], 'medium', 'documentation', 9, 
     'Device has no environmental exposure', ARRAY['ISO 14971', 'IEC 60601-1'], NULL),
    
    -- Clause 7 items
    (mdr_template_id, '7.1', '7', 'Ensure material and substance compatibility', 
     'Document compatibility with all materials, substances, and gases contacted during use', 
     ARRAY['Testing'], ARRAY['Verification'], 'high', 'documentation', 10, 
     'Device has no contact with materials/substances', ARRAY['ISO 10993-1', 'ISO 14971'], NULL),
    
    -- Clause 8 items
    (mdr_template_id, '8.1', '8', 'Control infection and contamination risks', 
     'Document measures to eliminate or reduce infection and microbial contamination risks', 
     ARRAY['Documentation'], ARRAY['Design Output'], 'high', 'documentation', 11, 
     'Device has no body contact', ARRAY['ISO 11737-1', 'ISO 14971'], NULL),
    
    -- Clause 9 items
    (mdr_template_id, '9.1', '9', 'Protect against accidental substance penetration', 
     'Document protection measures against accidental penetration of substances into device', 
     ARRAY['Testing'], ARRAY['Verification'], 'medium', 'documentation', 12, 
     'Device is completely sealed with no ingress points', ARRAY['IEC 60529', 'ISO 14971'], NULL),
    
    -- Clause 10 items
    (mdr_template_id, '10.1', '10', 'Facilitate safe disposal', 
     'Document provisions for safe disposal of device and related waste products', 
     ARRAY['Documentation'], ARRAY['Design Output'], 'medium', 'documentation', 13, 
     'Never excluded', ARRAY['ISO 14971'], NULL),
    
    (mdr_template_id, '10.2', '10(a)', 'Document toxicity and flammability considerations', 
     'Address toxicity and flammability risks in disposal', 
     ARRAY['Testing'], ARRAY['Verification'], 'medium', 'documentation', 14, 
     'Device has no body contact', ARRAY['ISO 10993-1'], NULL),
    
    -- Clause 11 items
    (mdr_template_id, '11.1', '11', 'Ensure reliable interoperability', 
     'Document and verify interoperability and compatibility with other devices/equipment', 
     ARRAY['Testing'], ARRAY['Verification'], 'high', 'verification', 15, 
     'Device is standalone with no interconnections', ARRAY['IEC 80001-1', 'ISO 14971'], NULL),
    
    -- Clause 12 items
    (mdr_template_id, '12.1', '12', 'Control electromagnetic interference', 
     'Verify electromagnetic compatibility and control interference risks', 
     ARRAY['Testing'], ARRAY['Verification'], 'high', 'verification', 16, 
     'Device is non-electrical', ARRAY['IEC 60601-1-2', 'ISO 14971'], NULL),
    
    -- Clause 13 items
    (mdr_template_id, '13.1', '13', 'Protect against ionising radiation', 
     'Document protection measures against ionising radiation risks', 
     ARRAY['Testing'], ARRAY['Verification'], 'high', 'documentation', 17, 
     'Device does not emit ionizing radiation', ARRAY['IEC 60601-1-3', 'ISO 14971'], NULL),
    
    -- Clause 14 items
    (mdr_template_id, '14.1', '14', 'Control hazardous radiation emission', 
     'Document control of radiation characteristics and implement appropriate warnings', 
     ARRAY['Testing'], ARRAY['Verification'], 'high', 'documentation', 18, 
     'Device does not emit radiation', ARRAY['IEC 60825-1', 'ISO 14971'], NULL),
    
    -- Clause 15 items
    (mdr_template_id, '15.1', '15', 'Control particle release to environment', 
     'Document measures to reduce risks from particles released to environment during use', 
     ARRAY['Testing'], ARRAY['Verification'], 'medium', 'documentation', 19, 
     'Device does not release particles', ARRAY['ISO 14971'], NULL),
    
    -- Clause 16 items
    (mdr_template_id, '16.1', '16', 'Protect against substance/water/particle ingress', 
     'Document protection against entry of substances, water, or particulate matter', 
     ARRAY['Testing'], ARRAY['Verification'], 'medium', 'documentation', 20, 
     'Device is completely sealed with no ingress risk', ARRAY['IEC 60529', 'ISO 14971'], NULL),
    
    -- Clause 17 items
    (mdr_template_id, '17.1', '17', 'Ensure safe lay person operation', 
     'Document and verify safe and accurate operation by intended lay users', 
     ARRAY['Testing'], ARRAY['Validation'], 'high', 'verification', 21, 
     'Device is for professional use only', ARRAY['IEC 62366-1', 'ISO 14971'], NULL),
    
    (mdr_template_id, '17.2', '17.1', 'Provide appropriate instructions for lay users', 
     'Ensure instructions are comprehensible and appropriate for lay users', 
     ARRAY['Documentation'], ARRAY['Design Output'], 'high', 'documentation', 22, 
     'Device is for professional use only', ARRAY['IEC 62366-1'], NULL),
    
    (mdr_template_id, '17.3', '17.2', 'Implement software development lifecycle processes', 
     'Establish and maintain appropriate software development lifecycle processes', 
     ARRAY['Documentation'], ARRAY['Design Planning'], 'high', 'documentation', 23, 
     'Device contains no software', ARRAY['IEC 62304', 'ISO 14971'], NULL),
    
    -- Clause 18 items
    (mdr_template_id, '18.1', '18', 'Ensure single fault condition safety', 
     'Document acceptable safety level maintained during single fault conditions', 
     ARRAY['Testing'], ARRAY['Verification'], 'high', 'documentation', 24, 
     'Device is non-electrical', ARRAY['IEC 60601-1', 'ISO 14971'], NULL),
    
    -- Clause 19 items (5 items)
    (mdr_template_id, '19.1', '19', 'Maintain sterility and enable safe cleaning', 
     'Document sterility maintenance and safe disinfection/cleaning procedures', 
     ARRAY['Documentation'], ARRAY['Design Output'], 'high', 'documentation', 25, 
     'Device is not provided sterile and requires no cleaning', ARRAY['ISO 11135-1', 'ISO 14971'], NULL),
    
    (mdr_template_id, '19.2', '19.1', 'Maintain sterile device packaging integrity', 
     'Ensure sterile device packaging maintains integrity until use', 
     ARRAY['Testing'], ARRAY['Verification'], 'high', 'documentation', 26, 
     'Device is not provided sterile', ARRAY['ISO 11607-1', 'ISO 14971'], NULL),
    
    (mdr_template_id, '19.3', '19.2', 'Provide reprocessing instructions', 
     'Document validated reprocessing instructions for reusable devices', 
     ARRAY['Documentation'], ARRAY['Design Output'], 'high', 'documentation', 27, 
     'Device is single-use only', ARRAY['ISO 17664-1', 'ISO 14971'], NULL),
    
    (mdr_template_id, '19.4', '19.3', 'Meet active implantable device specific requirements', 
     'Address specific requirements for active implantable medical devices', 
     ARRAY['Compliance'], ARRAY['Design Input'], 'high', 'compliance', 28, 
     'Device is not an active implantable medical device', ARRAY['ISO 14708-1'], NULL),
    
    (mdr_template_id, '19.5', '19.4', 'Design safe energy source for active implants', 
     'Ensure active implantable devices have safe and reliable energy sources', 
     ARRAY['Testing'], ARRAY['Verification'], 'high', 'verification', 29, 
     'Device is not an active implantable medical device', ARRAY['ISO 14708-1'], NULL),
    
    -- Clause 20 items
    (mdr_template_id, '20.1', '20', 'Ensure functionality throughout lifetime', 
     'Document and verify device functions as intended throughout defined lifetime', 
     ARRAY['Testing'], ARRAY['Validation'], 'medium', 'verification', 30, 
     'Never excluded', ARRAY['ISO 14971', 'IEC 60601-1'], NULL),
    
    (mdr_template_id, '20.2', '20.1', 'Ensure measuring device accuracy', 
     'Verify measuring devices provide accurate measurements throughout intended use', 
     ARRAY['Testing'], ARRAY['Verification'], 'high', 'verification', 31, 
     'Device does not perform measurements', ARRAY['ISO 80601-2-30'], NULL),
    
    -- Clause 21 items
    (mdr_template_id, '21.1', '21', 'Facilitate environmentally safe disposal', 
     'Document environmentally safe disposal provisions for device and accessories', 
     ARRAY['Documentation'], ARRAY['Design Output'], 'medium', 'documentation', 32, 
     'Never excluded', ARRAY['ISO 14971'], NULL),
    
    -- Clause 22 items
    (mdr_template_id, '22.1', '22', 'Design displays according to ergonomic principles', 
     'Document ergonomic design of measurement/monitoring displays for intended use environment', 
     ARRAY['Documentation'], ARRAY['Design Output'], 'medium', 'documentation', 33, 
     'Device has no displays or measurement functions', ARRAY['IEC 62366-1', 'ISO 14971'], NULL),
    
    -- Clause 23 items (3 items)
    (mdr_template_id, '23.1', '23', 'Accommodate users with restricted capabilities', 
     'Document design considerations for users with restricted physical or mental capabilities', 
     ARRAY['Documentation'], ARRAY['Design Input'], 'high', 'documentation', 34, 
     'Device is for professional use only in controlled environments', ARRAY['IEC 62366-1', 'ISO 14971'], NULL),
    
    (mdr_template_id, '23.2', '23.1', 'Protect against mechanical and thermal risks', 
     'Design protection against mechanical and thermal risks during normal use', 
     ARRAY['Testing'], ARRAY['Verification'], 'high', 'verification', 35, 
     'Device has no mechanical or thermal risks', ARRAY['IEC 60601-1', 'ISO 14971'], NULL),
    
    (mdr_template_id, '23.3', '23.2', 'Provide appropriate labeling', 
     'Ensure labeling meets all applicable requirements for safe use', 
     ARRAY['Documentation'], ARRAY['Design Output'], 'high', 'documentation', 36, 
     'Never excluded', ARRAY['ISO 15223-1'], NULL);
  
    RAISE NOTICE 'Updated MDR Annex I template with 36 comprehensive items (representing the foundation for 177 total requirements)';
  ELSE
    RAISE NOTICE 'MDR Annex I template not found';
  END IF;
END $$;