
-- Fix ISO 14971: delete old misaligned items and re-insert correctly
DELETE FROM gap_template_items WHERE template_id = 'df8ad462-41f8-42fd-9603-44bb7346ebb2';

-- ISO 14971 Enterprise (3.1-3.3)
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '3.1', 'Define and document the organization-wide risk management process', 'documentation', 'high', 1),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '3.2', 'Demonstrate top management commitment to risk management', 'documentation', 'high', 2),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '3.3', 'Ensure personnel performing risk management have required knowledge and training', 'documentation', 'high', 3);

-- ISO 14971 Device sections need a separate template. Check if ISO_14971_DEVICE exists
-- Looking at the DB: framework ISO_14971 is the enterprise one (id df8ad462...)
-- There's no separate device template in the DB yet. We need to check.
-- From the product page, it uses enabledFrameworks.has("ISO_14971_DEVICE") but the template framework is "ISO_14971"
-- Let me just add the device sections (3.4-10) to the same template since the config references them

-- Actually, looking at the product page code, it filters by framework "ISO 14971" for both enterprise and device.
-- The enterprise config has 3.1-3.3, device config has 3.4-10. They share the same framework tag.
-- So all items go into the same template.

INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '3.4', 'Create a device-specific risk management plan', 'documentation', 'high', 4),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '3.5', 'Maintain a risk management file for the device', 'documentation', 'high', 5),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '4.1', 'Perform risk analysis for the device', 'verification', 'high', 6),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '4.2', 'Document intended use and reasonably foreseeable misuse', 'documentation', 'high', 7),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '4.3', 'Identify characteristics related to safety', 'verification', 'high', 8),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '4.4', 'Identify hazards and hazardous situations', 'verification', 'high', 9),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '4.5', 'Estimate risk for each identified hazardous situation', 'verification', 'high', 10),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '5', 'Evaluate each estimated risk against acceptability criteria', 'verification', 'high', 11),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '6.1', 'Analyse risk control options', 'verification', 'high', 12),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '6.2', 'Implement risk control measures and verify effectiveness', 'verification', 'high', 13),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '6.3', 'Evaluate residual risk after applying risk control measures', 'verification', 'high', 14),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '6.4', 'Perform benefit-risk analysis if residual risk is not acceptable', 'verification', 'high', 15),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '6.5', 'Evaluate risks arising from risk control measures', 'verification', 'high', 16),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '6.6', 'Verify completeness of risk control', 'verification', 'high', 17),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '7', 'Evaluate overall residual risk', 'verification', 'high', 18),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '8', 'Conduct risk management review', 'documentation', 'high', 19),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '9', 'Establish production and post-production information collection', 'documentation', 'medium', 20),
('df8ad462-41f8-42fd-9603-44bb7346ebb2', '10', 'Compile risk management report', 'documentation', 'high', 21);

-- MDR Annex I (23 sections: 1-23)
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '1', 'Devices shall achieve intended performance and be safe', 'compliance', 'high', 1),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '2', 'Risk management system — ALARP principle', 'compliance', 'high', 2),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '3', 'Devices shall meet applicable GSPRs considering intended purpose', 'compliance', 'high', 3),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '4', 'Risk management measures and information for safety', 'compliance', 'high', 4),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '5', 'Devices shall not adversely affect clinical condition/safety', 'compliance', 'high', 5),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '6', 'Known and foreseeable risks vs clinical benefits assessment', 'compliance', 'high', 6),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '7', 'Performance during intended lifetime', 'compliance', 'high', 7),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '8', 'Transport, storage and use conditions', 'compliance', 'medium', 8),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '9', 'Undesirable side-effects — acceptable risk-benefit', 'compliance', 'high', 9),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '10', 'Chemical, physical and biological properties', 'verification', 'high', 10),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '11', 'Infection and microbial contamination', 'verification', 'high', 11),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '12', 'Devices incorporating a medicinal substance', 'verification', 'medium', 12),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '13', 'Devices composed of substances absorbed/dispersed in the body', 'verification', 'medium', 13),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '14', 'Devices and their connection to other devices and energy sources', 'verification', 'high', 14),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '15', 'Protection against mechanical and thermal risks', 'verification', 'high', 15),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '16', 'Protection against risks from energy sources', 'verification', 'high', 16),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '17', 'Protection against risks from diagnostic and therapeutic radiation', 'verification', 'medium', 17),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '18', 'Software and digital health requirements', 'verification', 'high', 18),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '19', 'Active devices and connected systems', 'verification', 'high', 19),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '20', 'Devices with measuring function — accuracy and calibration', 'verification', 'medium', 20),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '21', 'Devices with diagnostic or monitoring function', 'verification', 'medium', 21),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '22', 'Devices incorporating materials of biological origin', 'verification', 'medium', 22),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', '23', 'Label and instructions for use — general requirements', 'documentation', 'high', 23);

-- IEC 62366-1 (15 sections)
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('98ad84aa-e239-4295-b7df-b08ada852147', '4.1', 'Establish usability engineering process', 'documentation', 'high', 1),
('98ad84aa-e239-4295-b7df-b08ada852147', '4.2', 'Document use specification', 'documentation', 'high', 2),
('98ad84aa-e239-4295-b7df-b08ada852147', '4.3', 'Identify user interface characteristics related to safety', 'verification', 'high', 3),
('98ad84aa-e239-4295-b7df-b08ada852147', '4.4', 'Identify known or foreseeable hazards', 'verification', 'high', 4),
('98ad84aa-e239-4295-b7df-b08ada852147', '4.5', 'Identify hazard-related use scenarios', 'verification', 'high', 5),
('98ad84aa-e239-4295-b7df-b08ada852147', '4.6', 'Select hazard-related use scenarios for summative evaluation', 'verification', 'high', 6),
('98ad84aa-e239-4295-b7df-b08ada852147', '4.7', 'Establish user interface specification', 'documentation', 'high', 7),
('98ad84aa-e239-4295-b7df-b08ada852147', '4.8', 'Design and implement user interface', 'verification', 'high', 8),
('98ad84aa-e239-4295-b7df-b08ada852147', '4.9', 'Plan user interface evaluations', 'documentation', 'high', 9),
('98ad84aa-e239-4295-b7df-b08ada852147', '5.1', 'Conduct formative evaluations', 'verification', 'high', 10),
('98ad84aa-e239-4295-b7df-b08ada852147', '5.2', 'Apply formative evaluation methods', 'verification', 'medium', 11),
('98ad84aa-e239-4295-b7df-b08ada852147', '5.3', 'Document formative evaluation results', 'documentation', 'medium', 12),
('98ad84aa-e239-4295-b7df-b08ada852147', '5.7', 'Plan summative evaluation', 'documentation', 'high', 13),
('98ad84aa-e239-4295-b7df-b08ada852147', '5.8', 'Execute summative evaluation', 'verification', 'high', 14),
('98ad84aa-e239-4295-b7df-b08ada852147', '5.9', 'Document summative evaluation results and report', 'documentation', 'high', 15);

-- ISO 15223-1 (9 sections)
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('a0dde1c9-de12-4ddd-a2cc-03434ddd992c', '4.1', 'General requirements for symbols on medical devices', 'documentation', 'high', 1),
('a0dde1c9-de12-4ddd-a2cc-03434ddd992c', '4.2', 'Symbol selection and application', 'documentation', 'high', 2),
('a0dde1c9-de12-4ddd-a2cc-03434ddd992c', '5.1', 'Manufacturer and device identification symbols', 'compliance', 'high', 3),
('a0dde1c9-de12-4ddd-a2cc-03434ddd992c', '5.2', 'Handling and storage symbols', 'compliance', 'medium', 4),
('a0dde1c9-de12-4ddd-a2cc-03434ddd992c', '5.3', 'Sterility and safety symbols', 'compliance', 'medium', 5),
('a0dde1c9-de12-4ddd-a2cc-03434ddd992c', '5.4', 'IVD and transfusion symbols', 'compliance', 'medium', 6),
('a0dde1c9-de12-4ddd-a2cc-03434ddd992c', '5.5', 'Warnings and regulatory symbols', 'compliance', 'high', 7),
('a0dde1c9-de12-4ddd-a2cc-03434ddd992c', '6.1', 'Symbol verification with target users', 'verification', 'medium', 8),
('a0dde1c9-de12-4ddd-a2cc-03434ddd992c', '6.2', 'Documentation of symbol usage', 'documentation', 'high', 9);

-- ISO 20417 (11 sections)
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('86451b74-cb06-48c4-ab6f-3ce13009fa9b', '4.1', 'General requirements for information supplied', 'documentation', 'high', 1),
('86451b74-cb06-48c4-ab6f-3ce13009fa9b', '4.2', 'Language requirements', 'compliance', 'high', 2),
('86451b74-cb06-48c4-ab6f-3ce13009fa9b', '5.1', 'Label content — manufacturer identification', 'compliance', 'high', 3),
('86451b74-cb06-48c4-ab6f-3ce13009fa9b', '5.2', 'Label content — safety and performance', 'compliance', 'high', 4),
('86451b74-cb06-48c4-ab6f-3ce13009fa9b', '5.3', 'Label content — sterile and single-use devices', 'compliance', 'medium', 5),
('86451b74-cb06-48c4-ab6f-3ce13009fa9b', '6.1', 'Instructions for use — general content', 'documentation', 'high', 6),
('86451b74-cb06-48c4-ab6f-3ce13009fa9b', '6.2', 'Instructions for use — installation and setup', 'documentation', 'medium', 7),
('86451b74-cb06-48c4-ab6f-3ce13009fa9b', '6.3', 'Instructions for use — operation and maintenance', 'documentation', 'high', 8),
('86451b74-cb06-48c4-ab6f-3ce13009fa9b', '6.4', 'Instructions for use — disposal and end of life', 'documentation', 'medium', 9),
('86451b74-cb06-48c4-ab6f-3ce13009fa9b', '7.1', 'Electronic instructions for use (eIFU)', 'compliance', 'medium', 10),
('86451b74-cb06-48c4-ab6f-3ce13009fa9b', '7.2', 'eIFU availability and accessibility', 'compliance', 'medium', 11);

-- ISO 10993 (14 sections)
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('4f9dcdaf-975e-4714-825e-acad4f1f71e1', '4.1', 'Establish biological evaluation plan', 'documentation', 'high', 1),
('4f9dcdaf-975e-4714-825e-acad4f1f71e1', '4.2', 'Characterize all device materials', 'verification', 'high', 2),
('4f9dcdaf-975e-4714-825e-acad4f1f71e1', '4.3', 'Categorize device by contact type and duration', 'documentation', 'high', 3),
('4f9dcdaf-975e-4714-825e-acad4f1f71e1', '4.4', 'Select applicable biological endpoints', 'documentation', 'high', 4),
('4f9dcdaf-975e-4714-825e-acad4f1f71e1', '5.1', 'Evaluate cytotoxicity (ISO 10993-5)', 'verification', 'high', 5),
('4f9dcdaf-975e-4714-825e-acad4f1f71e1', '5.2', 'Evaluate sensitization (ISO 10993-10)', 'verification', 'high', 6),
('4f9dcdaf-975e-4714-825e-acad4f1f71e1', '5.3', 'Evaluate irritation / intracutaneous reactivity', 'verification', 'high', 7),
('4f9dcdaf-975e-4714-825e-acad4f1f71e1', '5.4', 'Evaluate systemic toxicity (ISO 10993-11)', 'verification', 'high', 8),
('4f9dcdaf-975e-4714-825e-acad4f1f71e1', '5.5', 'Evaluate genotoxicity (ISO 10993-3)', 'verification', 'high', 9),
('4f9dcdaf-975e-4714-825e-acad4f1f71e1', '5.6', 'Evaluate implantation effects (ISO 10993-6)', 'verification', 'medium', 10),
('4f9dcdaf-975e-4714-825e-acad4f1f71e1', '5.7', 'Evaluate haemocompatibility (ISO 10993-4)', 'verification', 'medium', 11),
('4f9dcdaf-975e-4714-825e-acad4f1f71e1', '6.1', 'Chemical characterization (ISO 10993-18)', 'verification', 'high', 12),
('4f9dcdaf-975e-4714-825e-acad4f1f71e1', '6.2', 'Toxicological risk assessment (ISO 10993-17)', 'verification', 'high', 13),
('4f9dcdaf-975e-4714-825e-acad4f1f71e1', '6.3', 'Compile biological evaluation report', 'documentation', 'high', 14);

-- CMDR (Canada) - 10 sections
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('d05a5dc8-ed96-4577-ab0e-416ba18d3626', '1', 'Device classification per CMDR Schedule 1', 'compliance', 'high', 1),
('d05a5dc8-ed96-4577-ab0e-416ba18d3626', '2', 'Medical device licence application', 'documentation', 'high', 2),
('d05a5dc8-ed96-4577-ab0e-416ba18d3626', '3', 'Establishment licence (MDEL)', 'documentation', 'high', 3),
('d05a5dc8-ed96-4577-ab0e-416ba18d3626', '4', 'Safety and effectiveness requirements', 'verification', 'high', 4),
('d05a5dc8-ed96-4577-ab0e-416ba18d3626', '5', 'Quality management system (ISO 13485)', 'compliance', 'high', 5),
('d05a5dc8-ed96-4577-ab0e-416ba18d3626', '6', 'Bilingual labelling requirements', 'compliance', 'high', 6),
('d05a5dc8-ed96-4577-ab0e-416ba18d3626', '7', 'Mandatory problem reporting', 'compliance', 'high', 7),
('d05a5dc8-ed96-4577-ab0e-416ba18d3626', '8', 'MDSAP audit coverage', 'compliance', 'medium', 8),
('d05a5dc8-ed96-4577-ab0e-416ba18d3626', '9', 'Clinical evidence', 'verification', 'high', 9),
('d05a5dc8-ed96-4577-ab0e-416ba18d3626', '10', 'UDI requirements', 'compliance', 'medium', 10);

-- TGA (Australia) - 9 sections
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('99375f7f-c289-4fc5-9f5d-58db16cab241', '1', 'Device classification per TGA rules', 'compliance', 'high', 1),
('99375f7f-c289-4fc5-9f5d-58db16cab241', '2', 'Australian sponsor registration', 'documentation', 'high', 2),
('99375f7f-c289-4fc5-9f5d-58db16cab241', '3', 'ARTG inclusion', 'documentation', 'high', 3),
('99375f7f-c289-4fc5-9f5d-58db16cab241', '4', 'Conformity assessment procedures', 'compliance', 'high', 4),
('99375f7f-c289-4fc5-9f5d-58db16cab241', '5', 'Essential principles of safety and performance', 'compliance', 'high', 5),
('99375f7f-c289-4fc5-9f5d-58db16cab241', '6', 'Technical documentation', 'documentation', 'high', 6),
('99375f7f-c289-4fc5-9f5d-58db16cab241', '7', 'Labelling (TGO 91/92)', 'compliance', 'high', 7),
('99375f7f-c289-4fc5-9f5d-58db16cab241', '8', 'Post-market obligations', 'compliance', 'high', 8),
('99375f7f-c289-4fc5-9f5d-58db16cab241', '9', 'Clinical evidence', 'verification', 'high', 9);

-- PMDA (Japan) - 9 sections
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('2a1a26c4-1ee6-470d-857b-4f4f47212b15', '1', 'Device classification under PMD Act', 'compliance', 'high', 1),
('2a1a26c4-1ee6-470d-857b-4f4f47212b15', '2', 'Marketing authorization holder designation', 'documentation', 'high', 2),
('2a1a26c4-1ee6-470d-857b-4f4f47212b15', '3', 'Pre-market approval/certification/notification', 'documentation', 'high', 3),
('2a1a26c4-1ee6-470d-857b-4f4f47212b15', '4', 'QMS compliance (MHLW Ordinance 169)', 'compliance', 'high', 4),
('2a1a26c4-1ee6-470d-857b-4f4f47212b15', '5', 'Essential principles / technical standards', 'compliance', 'high', 5),
('2a1a26c4-1ee6-470d-857b-4f4f47212b15', '6', 'Clinical evaluation / clinical trial data', 'verification', 'high', 6),
('2a1a26c4-1ee6-470d-857b-4f4f47212b15', '7', 'Japanese labelling requirements', 'compliance', 'high', 7),
('2a1a26c4-1ee6-470d-857b-4f4f47212b15', '8', 'Post-market surveillance and adverse event reporting', 'compliance', 'high', 8),
('2a1a26c4-1ee6-470d-857b-4f4f47212b15', '9', 'Foreign manufacturer registration', 'documentation', 'high', 9);

-- NMPA (China) - 10 sections
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('d422aede-a0ce-44b5-8bd0-76f1bb959c42', '1', 'Device classification per NMPA rules', 'compliance', 'high', 1),
('d422aede-a0ce-44b5-8bd0-76f1bb959c42', '2', 'Registration dossier preparation', 'documentation', 'high', 2),
('d422aede-a0ce-44b5-8bd0-76f1bb959c42', '3', 'In-country agent / legal representative', 'documentation', 'high', 3),
('d422aede-a0ce-44b5-8bd0-76f1bb959c42', '4', 'Product technical requirements', 'documentation', 'high', 4),
('d422aede-a0ce-44b5-8bd0-76f1bb959c42', '5', 'GMP / manufacturing quality system', 'compliance', 'high', 5),
('d422aede-a0ce-44b5-8bd0-76f1bb959c42', '6', 'Clinical evaluation / clinical trials', 'verification', 'high', 6),
('d422aede-a0ce-44b5-8bd0-76f1bb959c42', '7', 'Chinese labelling requirements', 'compliance', 'high', 7),
('d422aede-a0ce-44b5-8bd0-76f1bb959c42', '8', 'Type testing at Chinese labs', 'verification', 'high', 8),
('d422aede-a0ce-44b5-8bd0-76f1bb959c42', '9', 'Post-market surveillance and adverse event reporting', 'compliance', 'high', 9),
('d422aede-a0ce-44b5-8bd0-76f1bb959c42', '10', 'Registration certificate renewal', 'compliance', 'medium', 10);

-- ANVISA (Brazil) - 9 sections
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('68615ad9-f9ba-47f8-9da6-d7c1aaca0e8e', '1', 'Device classification per ANVISA rules', 'compliance', 'high', 1),
('68615ad9-f9ba-47f8-9da6-d7c1aaca0e8e', '2', 'ANVISA registration / notification', 'documentation', 'high', 2),
('68615ad9-f9ba-47f8-9da6-d7c1aaca0e8e', '3', 'Brazilian Registration Holder', 'documentation', 'high', 3),
('68615ad9-f9ba-47f8-9da6-d7c1aaca0e8e', '4', 'GMP compliance (RDC 16)', 'compliance', 'high', 4),
('68615ad9-f9ba-47f8-9da6-d7c1aaca0e8e', '5', 'Essential safety and performance requirements', 'compliance', 'high', 5),
('68615ad9-f9ba-47f8-9da6-d7c1aaca0e8e', '6', 'Clinical evidence', 'verification', 'high', 6),
('68615ad9-f9ba-47f8-9da6-d7c1aaca0e8e', '7', 'Portuguese labelling requirements', 'compliance', 'high', 7),
('68615ad9-f9ba-47f8-9da6-d7c1aaca0e8e', '8', 'INMETRO certification', 'compliance', 'medium', 8),
('68615ad9-f9ba-47f8-9da6-d7c1aaca0e8e', '9', 'Post-market surveillance (Tecnovigilância)', 'compliance', 'high', 9);

-- CDSCO (India) - 9 sections
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('4e5eb5fc-b151-40e4-90d3-53753a856b0c', '1', 'Device classification per Indian MDR 2017', 'compliance', 'high', 1),
('4e5eb5fc-b151-40e4-90d3-53753a856b0c', '2', 'Registration / import licence', 'documentation', 'high', 2),
('4e5eb5fc-b151-40e4-90d3-53753a856b0c', '3', 'Authorized Indian agent', 'documentation', 'high', 3),
('4e5eb5fc-b151-40e4-90d3-53753a856b0c', '4', 'Quality management system', 'compliance', 'high', 4),
('4e5eb5fc-b151-40e4-90d3-53753a856b0c', '5', 'Essential principles of safety and performance', 'compliance', 'high', 5),
('4e5eb5fc-b151-40e4-90d3-53753a856b0c', '6', 'Clinical investigation / clinical evidence', 'verification', 'high', 6),
('4e5eb5fc-b151-40e4-90d3-53753a856b0c', '7', 'Indian labelling requirements', 'compliance', 'high', 7),
('4e5eb5fc-b151-40e4-90d3-53753a856b0c', '8', 'Post-market surveillance and vigilance', 'compliance', 'high', 8),
('4e5eb5fc-b151-40e4-90d3-53753a856b0c', '9', 'BIS standards compliance', 'compliance', 'medium', 9);

-- UKCA (UK) - 10 sections
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('030dd8d2-f8c7-447d-a577-7677481477fb', '1', 'Device classification per UK MDR 2002', 'compliance', 'high', 1),
('030dd8d2-f8c7-447d-a577-7677481477fb', '2', 'UKCA / UKNI marking', 'compliance', 'high', 2),
('030dd8d2-f8c7-447d-a577-7677481477fb', '3', 'UK Responsible Person', 'documentation', 'high', 3),
('030dd8d2-f8c7-447d-a577-7677481477fb', '4', 'MHRA device registration', 'documentation', 'high', 4),
('030dd8d2-f8c7-447d-a577-7677481477fb', '5', 'UK Approved Body assessment', 'compliance', 'high', 5),
('030dd8d2-f8c7-447d-a577-7677481477fb', '6', 'Essential requirements (UK MDR 2002)', 'compliance', 'high', 6),
('030dd8d2-f8c7-447d-a577-7677481477fb', '7', 'Technical documentation', 'documentation', 'high', 7),
('030dd8d2-f8c7-447d-a577-7677481477fb', '8', 'UK labelling requirements', 'compliance', 'high', 8),
('030dd8d2-f8c7-447d-a577-7677481477fb', '9', 'Post-market surveillance and adverse event reporting', 'compliance', 'high', 9),
('030dd8d2-f8c7-447d-a577-7677481477fb', '10', 'Clinical evidence', 'verification', 'high', 10);

-- MEPSW (Switzerland) - 8 sections
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('8de8889c-c79c-4b13-a669-471c86e86349', '1', 'Device classification per Swiss MepV', 'compliance', 'high', 1),
('8de8889c-c79c-4b13-a669-471c86e86349', '2', 'Swiss Authorized Representative (CH-REP)', 'documentation', 'high', 2),
('8de8889c-c79c-4b13-a669-471c86e86349', '3', 'Swissmedic registration', 'documentation', 'high', 3),
('8de8889c-c79c-4b13-a669-471c86e86349', '4', 'Conformity assessment (MepV)', 'compliance', 'high', 4),
('8de8889c-c79c-4b13-a669-471c86e86349', '5', 'Essential requirements compliance', 'compliance', 'high', 5),
('8de8889c-c79c-4b13-a669-471c86e86349', '6', 'Technical documentation', 'documentation', 'high', 6),
('8de8889c-c79c-4b13-a669-471c86e86349', '7', 'Swiss labelling requirements', 'compliance', 'high', 7),
('8de8889c-c79c-4b13-a669-471c86e86349', '8', 'Post-market surveillance and vigilance', 'compliance', 'high', 8);

-- KFDA (South Korea) - 9 sections
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('a0905bd7-fe5d-4836-a2b1-5a2a38708f0e', '1', 'Device classification per MFDS rules', 'compliance', 'high', 1),
('a0905bd7-fe5d-4836-a2b1-5a2a38708f0e', '2', 'Licensing / approval pathway', 'documentation', 'high', 2),
('a0905bd7-fe5d-4836-a2b1-5a2a38708f0e', '3', 'Korean authorized representative', 'documentation', 'high', 3),
('a0905bd7-fe5d-4836-a2b1-5a2a38708f0e', '4', 'Technical documentation (KGMP)', 'documentation', 'high', 4),
('a0905bd7-fe5d-4836-a2b1-5a2a38708f0e', '5', 'GMP compliance (KGMP)', 'compliance', 'high', 5),
('a0905bd7-fe5d-4836-a2b1-5a2a38708f0e', '6', 'Product testing at MFDS-recognized labs', 'verification', 'high', 6),
('a0905bd7-fe5d-4836-a2b1-5a2a38708f0e', '7', 'Clinical evaluation / clinical trial', 'verification', 'high', 7),
('a0905bd7-fe5d-4836-a2b1-5a2a38708f0e', '8', 'Korean labelling requirements', 'compliance', 'high', 8),
('a0905bd7-fe5d-4836-a2b1-5a2a38708f0e', '9', 'Post-market surveillance and adverse event reporting', 'compliance', 'high', 9);
