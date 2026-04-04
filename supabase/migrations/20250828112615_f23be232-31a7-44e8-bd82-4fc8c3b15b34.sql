-- Clear existing MDR Annex I template items
DELETE FROM gap_template_items 
WHERE template_id = (
  SELECT id FROM gap_analysis_templates 
  WHERE framework = 'MDR_ANNEX_I' 
  LIMIT 1
);

-- Insert comprehensive MDR Annex I items (starting with first 10)
INSERT INTO gap_template_items (template_id, item_number, clause_reference, requirement_text, guidance_text, evidence_requirements, applicable_phases, priority, category, sort_order) VALUES
((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '1', 'GSPR.1', 'Devices shall achieve the performance intended by their manufacturer and shall be designed and manufactured in such a way that they are suitable for one or more of the specific purposes set out in the definition of a medical device.', 'Document intended purpose and demonstrate device achieves its intended performance', '["Technical documentation", "Performance testing", "Design specifications"]'::jsonb, '[]'::jsonb, 'high', 'documentation', 1),

((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '2', 'GSPR.2', 'The solutions adopted by the manufacturer for the design and manufacture of the devices shall conform to safety principles, taking account of the generally acknowledged state of the art.', 'Apply recognized safety principles and state-of-the-art standards', '["Standards compliance documentation", "Design controls", "Safety analysis"]'::jsonb, '[]'::jsonb, 'high', 'compliance', 2),

((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '3', 'GSPR.3', 'The devices shall achieve the performances intended by the manufacturer and shall be designed, manufactured and packaged in such a way that they are suitable for one or more of the purposes referred to in point (1) of Article 2.', 'Demonstrate device performance meets intended use requirements', '["Performance testing", "Validation studies", "Clinical evaluation"]'::jsonb, '[]'::jsonb, 'high', 'verification', 3),

((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '4', 'GSPR.4', 'The devices shall be designed and manufactured in such a way that their use does not compromise the clinical condition or the safety of patients, or the safety and health of users or, where applicable, other persons.', 'Ensure device safety for patients, users, and others', '["Risk management file", "Safety testing", "Usability engineering"]'::jsonb, '[]'::jsonb, 'high', 'verification', 4),

((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '5', 'GSPR.5', 'Devices shall be designed and manufactured in such a way that they can be used safely with the devices, medicinal products and other medical devices with which they are intended to be used.', 'Document compatibility and safe use with other devices/drugs', '["Compatibility testing", "Interaction studies", "Technical documentation"]'::jsonb, '[]'::jsonb, 'medium', 'verification', 5),

((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '6', 'GSPR.6', 'Any known or foreseeable risks, and any undesirable side-effects, shall be minimised and be acceptable when weighed against the evaluated benefits to the patient and/or user arising from the achieved level of performance of the device during normal conditions of use.', 'Risk-benefit analysis demonstrating acceptable risk profile', '["Risk management file ISO 14971", "Clinical evaluation", "Post-market surveillance"]'::jsonb, '[]'::jsonb, 'high', 'documentation', 6),

((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '7a', 'GSPR.7(a)', 'Devices shall be designed and manufactured in such a way that they can be supplied and used safely and effectively throughout their intended lifetime.', 'Demonstrate safe and effective use throughout device lifetime', '["Shelf life studies", "Durability testing", "Instructions for use"]'::jsonb, '[]'::jsonb, 'medium', 'verification', 7),

((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '7b', 'GSPR.7(b)', 'Devices shall not have an adverse effect on the level of safety and performance required for their intended use when subjected to stresses which can occur during normal conditions of use and, if applicable, during transport and storage.', 'Testing under normal use conditions and transport/storage stresses', '["Environmental testing", "Transport validation", "Storage condition studies"]'::jsonb, '[]'::jsonb, 'medium', 'verification', 8),

((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '8', 'GSPR.8', 'Devices shall be designed and manufactured in such a way as to remove or reduce as far as possible risks connected with their physical features, including the ergonomic features.', 'Address physical and ergonomic design risks', '["Usability engineering", "Ergonomic evaluation", "Human factors testing"]'::jsonb, '[]'::jsonb, 'medium', 'verification', 9),

((SELECT id FROM gap_analysis_templates WHERE framework = 'MDR_ANNEX_I' LIMIT 1), '9', 'GSPR.9', 'Devices that incorporate software or that are software shall be designed and manufactured taking into account the principles of development life cycle, risk management, including information security, verification and validation.', 'Software development lifecycle and cybersecurity requirements', '["Software development standards", "Cybersecurity documentation", "V&V protocols"]'::jsonb, '[]'::jsonb, 'high', 'documentation', 10);