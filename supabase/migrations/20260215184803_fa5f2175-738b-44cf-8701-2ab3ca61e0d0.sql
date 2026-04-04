
-- Step 1: Clear category_id on any hazards referencing old categories
UPDATE hazards SET category_id = NULL WHERE category_id IS NOT NULL;

-- Step 2: Delete old categories  
DELETE FROM hazard_categories;

-- Step 3: Insert new ISO 14971 / ISO 13485 aligned categories
INSERT INTO hazard_categories (name, description, sort_order, color, is_active) VALUES
('Materials and Patient Contact', 'Biocompatibility, toxicity, material degradation, contamination from patient-contacting materials', 1, '#6b7280', true),
('Hazards in Combination with Other Medical Products', 'Risks from device interaction with other medical products or accessories', 2, '#6b7280', true),
('Human Factors', 'Use errors, usability issues, cognitive overload, misinterpretation', 3, '#6b7280', true),
('Training Requirements', 'Risks from inadequate training, skill level, or competency gaps', 4, '#6b7280', true),
('Cleaning and Maintenance', 'Risks from cleaning procedures, reprocessing, preventive maintenance', 5, '#6b7280', true),
('Use of Negative Air Pressure Energy', 'Risks from vacuum, suction, or negative pressure systems', 6, '#6b7280', true),
('Use of Electrical Energy', 'Electrical shock, burns, electromagnetic interference hazards', 7, '#6b7280', true),
('Requirements for Sterility', 'Risks from sterilization failure, aseptic breach, reuse of single-use', 8, '#6b7280', true),
('Storage of Critical Data', 'Data loss, corruption, unauthorized access to critical device data', 9, '#6b7280', true),
('Use of Software', 'Software defects, logic errors, SOUP failures, cybersecurity', 10, '#6b7280', true),
('Disposal', 'End-of-life disposal hazards, environmental contamination', 11, '#6b7280', true),
('Manufacturing Methods and Residues', 'Production defects, process residues, quality deviations', 12, '#6b7280', true),
('Transport and Storage', 'Damage during transport, storage condition violations', 13, '#6b7280', true),
('Shelf-life and In Use Life', 'Material degradation over time, expiry-related failures', 14, '#6b7280', true),
('Planning of Product Realization', 'Gaps in realization planning per ISO 13485 Clause 7.1', 15, '#6b7280', true),
('Determination of Customer Requirements and Customer Communication', 'Misunderstood requirements, communication failures per Clause 7.2', 16, '#6b7280', true),
('Purchasing', 'Supplier quality failures, incoming material defects per Clause 7.4', 17, '#6b7280', true),
('Product and Service Provision', 'Production and service delivery failures per Clause 7.5', 18, '#6b7280', true),
('Control of Monitoring and Measuring Devices', 'Calibration drift, measurement inaccuracy per Clause 7.6', 19, '#6b7280', true);
