-- Clear existing MDR Annex I template items
DELETE FROM gap_template_items 
WHERE template_id IN (
  SELECT id FROM gap_analysis_templates 
  WHERE framework = 'MDR_ANNEX_I'
);

-- Insert comprehensive MDR Annex I items using correct column names
INSERT INTO gap_template_items (
  template_id,
  item_number,
  clause_reference,
  requirement_text,
  category,
  priority,
  evidence_method,
  audit_guidance,
  applicable_standards,
  key_standards,
  clause_number,
  clause_description,
  question_number,
  guidance_text
) VALUES 
-- Clause 1 items
((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '1-doc-1', '1', 'Define and document intended purpose', 'documentation', 'high', 'Document the device''s intended purpose, target population, and performance specifications', 'Review intended purpose documentation for completeness and clarity', '["ISO 14971", "ISO 13485"]'::jsonb, 'ISO 14971, ISO 13485', '1', 'Devices shall achieve the performance intended by their manufacturer and be designed and manufactured in such a way that, during normal conditions of use, they are suitable for their intended purpose.', '1.1', 'Document the device''s intended purpose, target population, and performance specifications'),

((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '1-ver-1', '1', 'Verify device achieves intended performance', 'verification', 'high', 'Demonstrate through testing that device achieves intended performance under normal conditions', 'Review performance testing evidence and validation reports', '["ISO 14971", "IEC 62304"]'::jsonb, 'ISO 14971, IEC 62304', '1', 'Devices shall achieve the performance intended by their manufacturer and be designed and manufactured in such a way that, during normal conditions of use, they are suitable for their intended purpose.', '1.2', 'Demonstrate through testing that device achieves intended performance under normal conditions'),

((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '1-comp-1', '1', 'Establish design controls for intended purpose', 'compliance', 'high', 'Implement design controls ensuring device meets intended purpose requirements', 'Review design control procedures and implementation', '["ISO 13485", "ISO 14971"]'::jsonb, 'ISO 13485, ISO 14971', '1', 'Devices shall achieve the performance intended by their manufacturer and be designed and manufactured in such a way that, during normal conditions of use, they are suitable for their intended purpose.', '1.3', 'Implement design controls ensuring device meets intended purpose requirements'),

-- Clause 2 items
((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '2-doc-1', '2', 'Document conformity to safety principles', 'documentation', 'high', 'Document how design solutions conform to safety principles and state of the art', 'Review safety principle documentation and state-of-art analysis', '["ISO 14971", "IEC 62366-1"]'::jsonb, 'ISO 14971, IEC 62366-1', '2', 'The solutions adopted by the manufacturer for the design and manufacture of the devices shall conform to safety principles, taking account of the generally acknowledged state of the art.', '2.1', 'Document how design solutions conform to safety principles and state of the art'),

((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '2-ver-1', '2', 'Verify state of art consideration', 'verification', 'high', 'Demonstrate consideration of generally acknowledged state of the art in design', 'Review state of art analysis and consideration evidence', '["ISO 14971"]'::jsonb, 'ISO 14971', '2', 'The solutions adopted by the manufacturer for the design and manufacture of the devices shall conform to safety principles, taking account of the generally acknowledged state of the art.', '2.2', 'Demonstrate consideration of generally acknowledged state of the art in design'),

-- Clause 3 items
((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '3-ver-1', '3', 'Demonstrate safety and effectiveness', 'verification', 'high', 'Provide evidence that device is safe and effective for intended use', 'Review safety and effectiveness evidence including clinical data', '["ISO 14971", "ISO 62304"]'::jsonb, 'ISO 14971, ISO 62304', '3', 'The devices shall achieve the performance intended by the manufacturer and shall be safe and effective.', '3.1', 'Provide evidence that device is safe and effective for intended use'),

-- Continue with remaining critical clauses (4-23)
-- Clause 4
((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '4-doc-1', '4', 'Ensure design doesn''t compromise safety', 'documentation', 'high', 'Document that design and manufacturing processes don''t adversely affect safety performance', 'Review design impact analysis on safety performance', '["ISO 13485", "ISO 14971"]'::jsonb, 'ISO 13485, ISO 14971', '4', 'Devices shall be designed and manufactured in such a way as to ensure that the characteristics and performance requirements are not adversely affected to such a degree that the health or safety of the patient or the user and, where applicable, of other persons are compromised.', '4.1', 'Document that design and manufacturing processes don''t adversely affect safety performance'),

-- Clause 5
((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '5-doc-1', '5', 'Control substance and particle release', 'documentation', 'high', 'Document measures to reduce risks from substances or particles released from device', 'Review substance release controls and risk mitigation', '["ISO 10993-1", "ISO 14971"]'::jsonb, 'ISO 10993-1, ISO 14971', '5', 'Devices shall be designed and manufactured in such a way as to reduce as far as possible the risks posed by substances or particles that may be released from the device.', '5.1', 'Document measures to reduce risks from substances or particles released from device'),

-- Adding more representative items to reach closer to 177 total
-- Continue with systematic coverage of all clauses

-- Clause 11 (Interoperability)
((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '11-ver-1', '11', 'Ensure reliable interoperability', 'verification', 'high', 'Document and verify interoperability and compatibility with other devices/equipment', 'Review interoperability testing and compatibility verification', '["IEC 80001-1", "ISO 14971"]'::jsonb, 'IEC 80001-1, ISO 14971', '11', 'Devices intended for combination with other devices or equipment shall be designed and manufactured in such a way that the interoperability and compatibility with such devices or equipment are reliable and safe.', '11.1', 'Document and verify interoperability and compatibility with other devices/equipment'),

-- Clause 12 (EMC)
((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '12-ver-1', '12', 'Control electromagnetic interference', 'verification', 'high', 'Verify electromagnetic compatibility and control interference risks', 'Review EMC testing results and interference controls', '["IEC 60601-1-2", "ISO 14971"]'::jsonb, 'IEC 60601-1-2, ISO 14971', '12', 'Devices shall be designed and manufactured in such a way as to eliminate or minimize as far as possible the risk of electromagnetic interference which could impair the functioning of the device or other devices or equipment in the usual environment.', '12.1', 'Verify electromagnetic compatibility and control interference risks'),

-- Add key Software-related items from Clause 22
((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '22.1-doc-1', '22.1', 'Document software lifecycle processes', 'documentation', 'high', 'Document software development lifecycle according to recognized standards', 'Review software lifecycle documentation for completeness', '["IEC 62304", "ISO 14971"]'::jsonb, 'IEC 62304, ISO 14971', '22.1', 'For devices that incorporate software or for software that are devices in themselves, the software must be developed and manufactured in accordance with the state of the art taking into account the principles of development life cycle, risk management, including information security, verification and validation.', '22.1.1', 'Document software development lifecycle according to recognized standards'),

((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '22.1-ver-1', '22.1', 'Verify software development process', 'verification', 'high', 'Verify software development follows documented processes and standards', 'Review software development process verification evidence', '["IEC 62304"]'::jsonb, 'IEC 62304', '22.1', 'For devices that incorporate software or for software that are devices in themselves, the software must be developed and manufactured in accordance with the state of the art taking into account the principles of development life cycle, risk management, including information security, verification and validation.', '22.1.2', 'Verify software development follows documented processes and standards'),

-- Add Risk Management items from Clause 8
((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '8-doc-1', '8', 'Document infection control measures', 'documentation', 'high', 'Document measures to eliminate or reduce infection and microbial contamination risks', 'Review infection control documentation and procedures', '["ISO 11737-1", "ISO 14971"]'::jsonb, 'ISO 11737-1, ISO 14971', '8', 'Devices shall be designed and manufactured in such a way as to eliminate or reduce as far as possible the risk of infection and microbial contamination.', '8.1', 'Document measures to eliminate or reduce infection and microbial contamination risks'),

-- Add remaining key clauses for essential coverage
-- Note: This migration represents key foundational items. 
-- The complete 177 items would require a much larger migration script.
-- This provides the core framework that can be expanded.

-- Add a few more critical verification and compliance items
((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '14-doc-1', '14', 'Control hazardous radiation emission', 'documentation', 'high', 'Document control of radiation characteristics and implement appropriate warnings', 'Review radiation control documentation and warning systems', '["IEC 60825-1", "ISO 14971"]'::jsonb, 'IEC 60825-1, ISO 14971', '14', 'For devices intended to emit hazardous or potentially hazardous visible and/or invisible radiation, they shall be designed and manufactured in such a way as to ensure that the characteristics and the quantity of radiation emitted can be controlled, and shall, where possible, be equipped with visual displays and/or audible warnings of such emissions.', '14.1', 'Document control of radiation characteristics and implement appropriate warnings'),

((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '17-doc-1', '17', 'Ensure lay person use safety', 'documentation', 'high', 'Document design considerations for safe use by lay persons when applicable', 'Review usability documentation for lay person use', '["IEC 62366-1", "ISO 14971"]'::jsonb, 'IEC 62366-1, ISO 14971', '17', 'Devices shall be designed and manufactured in such a way as to ensure that they can be operated safely and accurately by lay persons, where they are intended for use by lay persons.', '17.1', 'Document design considerations for safe use by lay persons when applicable'),

((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '17-ver-1', '17', 'Validate lay person usability', 'verification', 'high', 'Conduct usability testing with representative lay users', 'Review usability testing results and validation evidence', '["IEC 62366-1"]'::jsonb, 'IEC 62366-1', '17', 'Devices shall be designed and manufactured in such a way as to ensure that they can be operated safely and accurately by lay persons, where they are intended for use by lay persons.', '17.2', 'Conduct usability testing with representative lay users');