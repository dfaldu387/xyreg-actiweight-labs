-- Complete MDR Annex I Migration: Replace 16 incorrect items with official requirements
-- Fixed data types: evidence_requirements and applicable_phases are JSONB

DO $$
DECLARE
    mdr_template_id uuid := '8b1ac5c4-28f0-4a5d-97ff-6bd093565e75';
    item_count integer := 0;
BEGIN
    -- Clear existing incorrect items
    DELETE FROM gap_template_items WHERE template_id = mdr_template_id;
    
    -- Chapter I - General Requirements (20 items) - Using correct JSONB format
    INSERT INTO gap_template_items (id, template_id, item_number, clause_reference, requirement_text, guidance_text, evidence_requirements, applicable_phases, priority, category, sort_order) VALUES
    (gen_random_uuid(), mdr_template_id, 'gspr-1', '1', 'Devices must be safe, effective, suitable for their intended purpose, and have an acceptable benefit-risk ratio.', 'Review the final RMF and CER to confirm the overall benefit-risk conclusion is positive.', '["ISO 14971", "MEDDEV 2.7/1 rev 4"]'::jsonb, '["Design Input", "Verification", "Validation"]'::jsonb, 'high', 'verification', 1),
    (gen_random_uuid(), mdr_template_id, 'gspr-2', '2', 'Reducing risk "as far as possible" means doing so without negatively impacting the benefit-risk ratio.', 'Review the risk control option analysis and benefit-risk analysis within the RMF.', '["ISO 14971"]'::jsonb, '["Design Input", "Verification", "Validation"]'::jsonb, 'high', 'verification', 2),
    (gen_random_uuid(), mdr_template_id, 'gspr-3', '3', 'A risk management system must be established, implemented, and maintained as a continuous iterative process.', 'Review the Risk Management Procedure and Risk Management Plan.', '["ISO 14971", "ISO 13485"]'::jsonb, '["Design Planning", "Design Input"]'::jsonb, 'high', 'verification', 3),
    (gen_random_uuid(), mdr_template_id, 'gspr-3a', '3(a)', 'Establish and document a risk management plan for each device.', 'Review the device-specific Risk Management Plan to confirm it is complete and approved.', '["ISO 14971"]'::jsonb, '["Design Planning", "Design Input"]'::jsonb, 'high', 'documentation', 4),
    (gen_random_uuid(), mdr_template_id, 'gspr-3b', '3(b)', 'Identify and analyse the known and foreseeable hazards associated with each device.', 'Review the hazard analysis (e.g., FMEA, PHA) within the RMF.', '["ISO 14971"]'::jsonb, '["Design Input", "Design Output"]'::jsonb, 'high', 'verification', 5),
    (gen_random_uuid(), mdr_template_id, 'gspr-3c', '3(c)', 'Estimate and evaluate the risks associated with intended use and reasonably foreseeable misuse.', 'Review the risk evaluation matrices and records within the RMF.', '["ISO 14971"]'::jsonb, '["Design Input", "Design Output"]'::jsonb, 'high', 'verification', 6),
    (gen_random_uuid(), mdr_template_id, 'gspr-3d', '3(d)', 'Eliminate or control risks in accordance with the requirements of Section 4.', 'Review the risk control measures and their verification of effectiveness within the RMF.', '["ISO 14971"]'::jsonb, '["Design Output", "Verification"]'::jsonb, 'high', 'verification', 7),
    (gen_random_uuid(), mdr_template_id, 'gspr-3e', '3(e)', 'Evaluate the impact of production and post-market surveillance (PMS) information on risks.', 'Review the procedure linking the PMS system to the risk management system. Examine records of PMS data being used to update the RMF.', '["ISO 14971", "ISO 13485"]'::jsonb, '["Risk Management"]'::jsonb, 'high', 'verification', 8),
    (gen_random_uuid(), mdr_template_id, 'gspr-3f', '3(f)', 'If necessary based on PMS data, amend risk control measures.', 'Review updated versions of the RMF to confirm that PMS data has led to changes in risk controls where required.', '["ISO 14971"]'::jsonb, '["Risk Management"]'::jsonb, 'high', 'verification', 9),
    (gen_random_uuid(), mdr_template_id, 'gspr-4', '4', 'Risk control measures must conform to safety principles, and residual risk must be acceptable.', 'Examine the RMF to confirm residual risk is judged acceptable.', '["ISO 14971"]'::jsonb, '["Verification", "Validation"]'::jsonb, 'high', 'verification', 10),
    (gen_random_uuid(), mdr_template_id, 'gspr-4a', '4(a)', 'Eliminate or reduce risks as far as possible through safe design and manufacture.', 'Examine the RMF for evidence that design controls were the first priority for mitigation.', '["ISO 14971"]'::jsonb, '["Design Output", "Verification"]'::jsonb, 'high', 'verification', 11),
    (gen_random_uuid(), mdr_template_id, 'gspr-4b', '4(b)', 'Take adequate protection measures, including alarms if necessary, in relation to risks that cannot be eliminated.', 'Examine the RMF for protective measures (e.g., shielding, alarms) for risks not eliminated by design.', '["ISO 14971"]'::jsonb, '["Design Output", "Verification"]'::jsonb, 'high', 'verification', 12),
    (gen_random_uuid(), mdr_template_id, 'gspr-4c', '4(c)', 'Provide information for safety (warnings/precautions/contra-indications) and, where appropriate, training to users.', 'Review the IFU and labeling to ensure safety information is provided for non-eliminated risks.', '["ISO 14971"]'::jsonb, '["Design Output", "Verification"]'::jsonb, 'high', 'verification', 13),
    (gen_random_uuid(), mdr_template_id, 'gspr-4-cont', '4 (cont.)', 'Users must be informed of any residual risks.', 'Review the IFU and labeling to ensure all significant residual risks are communicated.', '["ISO 14971"]'::jsonb, '["Design Output", "Verification"]'::jsonb, 'high', 'verification', 14),
    (gen_random_uuid(), mdr_template_id, 'gspr-5a', '5(a)', 'Reduce use-error risks related to ergonomic features and the use environment (design for patient safety).', 'Review the Usability Engineering File for records of formative and summative validation that considered ergonomics.', '["IEC 62366-1"]'::jsonb, '["Validation"]'::jsonb, 'high', 'verification', 15),
    (gen_random_uuid(), mdr_template_id, 'gspr-5b', '5(b)', 'Consider the technical knowledge, education, training, use environment, and medical/physical conditions of intended users.', 'Review the user profiles and analysis within the Usability Engineering File.', '["IEC 62366-1"]'::jsonb, '["Design Input", "Validation"]'::jsonb, 'high', 'verification', 16),
    (gen_random_uuid(), mdr_template_id, 'gspr-6', '6', 'Device characteristics and performance must not be compromised during its intended lifetime.', 'Review stability, durability, and aging studies within the design verification reports.', '["ISO 14971"]'::jsonb, '["Verification"]'::jsonb, 'high', 'verification', 17),
    (gen_random_uuid(), mdr_template_id, 'gspr-7a', '7(a)', 'Devices must be designed and manufactured to reduce risks of infection and microbial contamination.', 'Review biocompatibility testing reports and sterility validation studies.', '["ISO 10993 series", "ISO 11737"]'::jsonb, '["Verification"]'::jsonb, 'high', 'verification', 18),
    (gen_random_uuid(), mdr_template_id, 'gspr-8', '8', 'Devices incorporating software or software as medical devices must be designed to ensure repeatability, reliability, and performance in line with their intended use.', 'Review the Software Life Cycle Processes documentation and V&V reports.', '["IEC 62304"]'::jsonb, '["Design Output", "Verification"]'::jsonb, 'high', 'verification', 19),
    (gen_random_uuid(), mdr_template_id, 'gspr-9', '9', 'Devices must be designed and manufactured to provide an acceptable level of intrinsic safety.', 'Review electrical safety testing reports and EMC testing reports.', '["IEC 60601-1", "IEC 60601-1-2"]'::jsonb, '["Verification"]'::jsonb, 'high', 'verification', 20);

    SELECT COUNT(*) INTO item_count FROM gap_template_items WHERE template_id = mdr_template_id;
    RAISE NOTICE 'Successfully replaced 16 incorrect items with % official Chapter I MDR Annex I requirements', item_count;
    
    -- Update the template description
    UPDATE gap_analysis_templates 
    SET description = 'MDR Annex I General Safety and Performance Requirements - Official requirements (Chapter I: ' || item_count || ' items)', 
        updated_at = now()
    WHERE id = mdr_template_id;
    
END $$;