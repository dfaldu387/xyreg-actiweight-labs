-- Gap Analysis Template Cleanup and MDR Annex I Addition
-- Step 1: Clean up duplicate templates and fix framework mapping

-- First, let's clean up the duplicates and inconsistent data
DELETE FROM gap_template_items WHERE template_id IN (
  SELECT id FROM gap_analysis_templates 
  WHERE name LIKE '%Annex II%' AND created_at < (
    SELECT MAX(created_at) FROM gap_analysis_templates WHERE name LIKE '%Annex II%'
  )
);

DELETE FROM company_gap_templates WHERE template_id IN (
  SELECT id FROM gap_analysis_templates 
  WHERE name LIKE '%Annex II%' AND created_at < (
    SELECT MAX(created_at) FROM gap_analysis_templates WHERE name LIKE '%Annex II%'
  )
);

DELETE FROM gap_analysis_templates 
WHERE name LIKE '%Annex II%' AND created_at < (
  SELECT MAX(created_at) FROM gap_analysis_templates WHERE name LIKE '%Annex II%'
);

-- Update framework codes to be consistent
UPDATE gap_analysis_templates SET framework = 'MDR_ANNEX_II' WHERE name LIKE '%Annex II%';
UPDATE gap_analysis_templates SET framework = 'MDR_ANNEX_III' WHERE name LIKE '%Annex III%';
UPDATE gap_analysis_templates SET framework = 'ISO_13485' WHERE name LIKE '%ISO 13485%';
UPDATE gap_analysis_templates SET framework = 'ISO_14971' WHERE name LIKE '%ISO 14971%';

-- Step 2: Add the working MDR Annex I template
INSERT INTO gap_analysis_templates (
  id,
  name,
  description,
  framework,
  scope,
  importance,
  is_active,
  is_custom,
  template_type,
  regulatory_framework,
  applicable_device_classes,
  template_config
) VALUES (
  gen_random_uuid(),
  'MDR Annex I - General Safety and Performance Requirements',
  'Essential requirements for medical devices under EU MDR Annex I',
  'MDR_ANNEX_I',
  'regulatory',
  'high',
  true,
  false,
  'checklist',
  'EU_MDR',
  '["I", "IIa", "IIb", "III"]'::jsonb,
  '{"version": "1.0", "regulation": "EU_MDR_2017_745", "annex": "I"}'::jsonb
);

-- Get the template ID for inserting items
DO $$
DECLARE
  template_id uuid;
BEGIN
  SELECT id INTO template_id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I';
  
  -- Insert MDR Annex I requirements (based on working checklist)
  INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, clause_reference, priority, sort_order) VALUES
  (template_id, '1.1', 'The devices shall achieve the performance intended by their manufacturer and shall be designed and manufactured in such a way that, during normal conditions of use, they are suitable for their intended purpose.', 'General Requirements', 'Chapter I, Section 1.1', 'high', 1),
  (template_id, '1.2', 'The solutions adopted by the manufacturer for the design and manufacture of the devices shall conform to safety principles, taking account of the generally acknowledged state of the art.', 'General Requirements', 'Chapter I, Section 1.2', 'high', 2),
  (template_id, '2.1', 'The devices shall be designed and manufactured in such a way that they can be used safely and effectively for their intended purpose.', 'Design and Manufacturing Requirements', 'Chapter I, Section 2.1', 'high', 3),
  (template_id, '2.2', 'The devices shall be designed and manufactured in such a way that the risks which may be associated with their use constitute acceptable risks when weighed against the benefits to the patient.', 'Design and Manufacturing Requirements', 'Chapter I, Section 2.2', 'high', 4),
  (template_id, '3.1', 'The devices shall achieve the performance intended by their manufacturer.', 'Performance Requirements', 'Chapter I, Section 3.1', 'high', 5),
  (template_id, '3.2', 'The devices shall be designed and manufactured in such a way that they are suitable for the purposes referred to in Article 1(2)(a).', 'Performance Requirements', 'Chapter I, Section 3.2', 'high', 6),
  (template_id, '4.1', 'The devices shall be designed and manufactured in such a way that, under normal conditions of use, they do not compromise the clinical condition or the safety of patients.', 'Safety Requirements', 'Chapter I, Section 4.1', 'high', 7),
  (template_id, '4.2', 'The devices shall be designed and manufactured in such a way that they do not present any risk to the persons implanting them or, in the case of radioactive devices, other persons.', 'Safety Requirements', 'Chapter I, Section 4.2', 'high', 8),
  (template_id, '5.1', 'Devices shall be designed and manufactured in such a way that the risk of infection and microbial contamination is minimised.', 'Infection and Microbial Contamination', 'Chapter I, Section 5.1', 'high', 9),
  (template_id, '5.2', 'Devices that are intended to come into contact with the human body shall be designed and manufactured in such a way that the risk of infection is minimised.', 'Infection and Microbial Contamination', 'Chapter I, Section 5.2', 'high', 10),
  (template_id, '6.1', 'Devices shall be designed and manufactured in such a way that the materials and substances that they contain, if they are intended to be absorbed by, or to locally interact with, the human body, are suitable for their intended purpose.', 'Biocompatibility', 'Chapter I, Section 6.1', 'high', 11),
  (template_id, '6.2', 'Devices shall be designed and manufactured in such a way as to reduce to a minimum the risks posed by substances or particles, including wear debris, degradation products and processing residues.', 'Biocompatibility', 'Chapter I, Section 6.2', 'high', 12),
  (template_id, '7.1', 'Devices with a measuring function shall be designed and manufactured in such a way as to provide sufficient accuracy and stability for their intended purpose.', 'Devices with Measuring Function', 'Chapter I, Section 7.1', 'medium', 13),
  (template_id, '7.2', 'The measurement, monitoring and display scale shall be designed in line with ergonomic principles.', 'Devices with Measuring Function', 'Chapter I, Section 7.2', 'medium', 14),
  (template_id, '8.1', 'Devices and their manufacturing processes shall be designed in such a way as to eliminate or reduce as far as possible the risk of infection to users and other persons.', 'Protection Against Radiation', 'Chapter I, Section 8.1', 'high', 15),
  (template_id, '9.1', 'Devices shall be designed and manufactured in such a way that they satisfy the general safety requirements applicable to them.', 'Devices Incorporating Software', 'Chapter I, Section 9.1', 'high', 16),
  (template_id, '9.2', 'Software that is intended to be used in combination with mobile computing platforms shall be designed and manufactured taking into account the particular features of the mobile platform.', 'Devices Incorporating Software', 'Chapter I, Section 9.2', 'medium', 17),
  (template_id, '10.1', 'Devices shall be designed and manufactured in such a way that they can be operated safely.', 'Active Devices and Devices Connected to Energy', 'Chapter I, Section 10.1', 'high', 18),
  (template_id, '10.2', 'In the case of adjustment, calibration or modification of the device, the manufacturer shall ensure that these operations can be carried out safely.', 'Active Devices and Devices Connected to Energy', 'Chapter I, Section 10.2', 'medium', 19),
  (template_id, '11.1', 'Devices shall be designed and manufactured in such a way as to facilitate their safe disposal and the safe disposal of related waste materials.', 'Protection Against Mechanical and Thermal Risks', 'Chapter I, Section 11.1', 'medium', 20),
  (template_id, '12.1', 'Devices shall be designed and manufactured in such a way that they provide the performance intended by their manufacturer and are sufficiently accurate for their intended purpose.', 'Devices Intended for Use by Lay Persons', 'Chapter I, Section 12.1', 'high', 21),
  (template_id, '12.2', 'Devices intended for use by lay persons shall be designed and manufactured in such a way that the medical or lay user can use them safely and accurately.', 'Devices Intended for Use by Lay Persons', 'Chapter I, Section 12.2', 'high', 22),
  (template_id, '13.1', 'All devices shall be accompanied by the information needed to identify the device and its manufacturer, and any safety and performance information relevant to the user.', 'Information Supplied by the Manufacturer', 'Chapter I, Section 13.1', 'high', 23),
  (template_id, '13.2', 'Each device shall be accompanied by instructions for use.', 'Information Supplied by the Manufacturer', 'Chapter I, Section 13.2', 'high', 24),
  (template_id, '13.3', 'The information and instructions provided by the manufacturer shall be presented in a form that is readily understood by the intended user.', 'Information Supplied by the Manufacturer', 'Chapter I, Section 13.3', 'high', 25);
END $$;

-- Step 3: Ensure all companies have access to the core templates
INSERT INTO company_gap_templates (company_id, template_id, is_enabled)
SELECT DISTINCT c.id, gat.id, true
FROM companies c, gap_analysis_templates gat
WHERE gat.framework IN ('MDR_ANNEX_I', 'MDR_ANNEX_II', 'MDR_ANNEX_III', 'ISO_13485', 'ISO_14971')
  AND NOT EXISTS (
    SELECT 1 FROM company_gap_templates cgt 
    WHERE cgt.company_id = c.id AND cgt.template_id = gat.id
  );

-- Step 4: Update template names to be cleaner
UPDATE gap_analysis_templates SET name = 'ISO 13485 - Quality Management Systems' WHERE framework = 'ISO_13485';
UPDATE gap_analysis_templates SET name = 'ISO 14971 - Risk Management' WHERE framework = 'ISO_14971';
UPDATE gap_analysis_templates SET name = 'MDR Annex II - Technical Documentation' WHERE framework = 'MDR_ANNEX_II';
UPDATE gap_analysis_templates SET name = 'MDR Annex III - Clinical Evaluation and PMCF' WHERE framework = 'MDR_ANNEX_III';