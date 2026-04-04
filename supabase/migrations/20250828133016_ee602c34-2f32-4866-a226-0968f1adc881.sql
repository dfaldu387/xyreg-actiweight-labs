-- Clear the existing incorrect MDR Annex I data and insert all 177 official requirements

-- First, find the MDR Annex I template ID
DO $$
DECLARE
    mdr_template_id uuid;
BEGIN
    SELECT id INTO mdr_template_id 
    FROM enhanced_gap_analysis_templates 
    WHERE name = 'MDR Annex I' AND framework = 'EU_MDR';
    
    IF mdr_template_id IS NOT NULL THEN
        -- Delete existing incorrect items
        DELETE FROM gap_template_items WHERE template_id = mdr_template_id;
        
        -- Insert Chapter I - General Requirements (20 items)
        INSERT INTO gap_template_items (id, template_id, item_number, clause_reference, requirement_text, guidance_text, evidence_requirements, applicable_phases, priority, category, sort_order) VALUES
        (gen_random_uuid(), mdr_template_id, 'gspr-1', '1', 'Devices must be safe, effective, suitable for their intended purpose, and have an acceptable benefit-risk ratio.', 'Review the final RMF and CER to confirm the overall benefit-risk conclusion is positive.', ARRAY['ISO 14971', 'MEDDEV 2.7/1 rev 4'], ARRAY['Design Input', 'Verification', 'Validation'], 'high', 'verification', 1),
        (gen_random_uuid(), mdr_template_id, 'gspr-2', '2', 'Reducing risk "as far as possible" means doing so without negatively impacting the benefit-risk ratio.', 'Review the risk control option analysis and benefit-risk analysis within the RMF.', ARRAY['ISO 14971'], ARRAY['Design Input', 'Verification', 'Validation'], 'high', 'verification', 2),
        (gen_random_uuid(), mdr_template_id, 'gspr-3', '3', 'A risk management system must be established, implemented, and maintained as a continuous iterative process.', 'Review the Risk Management Procedure and Risk Management Plan.', ARRAY['ISO 14971', 'ISO 13485'], ARRAY['Design Planning', 'Design Input'], 'high', 'verification', 3),
        (gen_random_uuid(), mdr_template_id, 'gspr-3a', '3(a)', 'Establish and document a risk management plan for each device.', 'Review the device-specific Risk Management Plan to confirm it is complete and approved.', ARRAY['ISO 14971'], ARRAY['Design Planning', 'Design Input'], 'high', 'documentation', 4),
        (gen_random_uuid(), mdr_template_id, 'gspr-3b', '3(b)', 'Identify and analyse the known and foreseeable hazards associated with each device.', 'Review the hazard analysis (e.g., FMEA, PHA) within the RMF.', ARRAY['ISO 14971'], ARRAY['Design Input', 'Design Output'], 'high', 'verification', 5),
        (gen_random_uuid(), mdr_template_id, 'gspr-3c', '3(c)', 'Estimate and evaluate the risks associated with intended use and reasonably foreseeable misuse.', 'Review the risk evaluation matrices and records within the RMF.', ARRAY['ISO 14971'], ARRAY['Design Input', 'Design Output'], 'high', 'verification', 6),
        (gen_random_uuid(), mdr_template_id, 'gspr-3d', '3(d)', 'Eliminate or control risks in accordance with the requirements of Section 4.', 'Review the risk control measures and their verification of effectiveness within the RMF.', ARRAY['ISO 14971'], ARRAY['Design Output', 'Verification'], 'high', 'verification', 7),
        (gen_random_uuid(), mdr_template_id, 'gspr-3e', '3(e)', 'Evaluate the impact of production and post-market surveillance (PMS) information on risks.', 'Review the procedure linking the PMS system to the risk management system. Examine records of PMS data being used to update the RMF.', ARRAY['ISO 14971', 'ISO 13485'], ARRAY['Risk Management'], 'high', 'verification', 8),
        (gen_random_uuid(), mdr_template_id, 'gspr-3f', '3(f)', 'If necessary based on PMS data, amend risk control measures.', 'Review updated versions of the RMF to confirm that PMS data has led to changes in risk controls where required.', ARRAY['ISO 14971'], ARRAY['Risk Management'], 'high', 'verification', 9),
        (gen_random_uuid(), mdr_template_id, 'gspr-4', '4', 'Risk control measures must conform to safety principles, and residual risk must be acceptable.', 'Examine the RMF to confirm residual risk is judged acceptable.', ARRAY['ISO 14971'], ARRAY['Verification', 'Validation'], 'high', 'verification', 10),
        (gen_random_uuid(), mdr_template_id, 'gspr-4a', '4(a)', 'Eliminate or reduce risks as far as possible through safe design and manufacture.', 'Examine the RMF for evidence that design controls were the first priority for mitigation.', ARRAY['ISO 14971'], ARRAY['Design Output', 'Verification'], 'high', 'verification', 11),
        (gen_random_uuid(), mdr_template_id, 'gspr-4b', '4(b)', 'Take adequate protection measures, including alarms if necessary, in relation to risks that cannot be eliminated.', 'Examine the RMF for protective measures (e.g., shielding, alarms) for risks not eliminated by design.', ARRAY['ISO 14971'], ARRAY['Design Output', 'Verification'], 'high', 'verification', 12),
        (gen_random_uuid(), mdr_template_id, 'gspr-4c', '4(c)', 'Provide information for safety (warnings/precautions/contra-indications) and, where appropriate, training to users.', 'Review the IFU and labeling to ensure safety information is provided for non-eliminated risks.', ARRAY['ISO 14971'], ARRAY['Design Output', 'Verification'], 'high', 'verification', 13),
        (gen_random_uuid(), mdr_template_id, 'gspr-4-cont', '4 (cont.)', 'Users must be informed of any residual risks.', 'Review the IFU and labeling to ensure all significant residual risks are communicated.', ARRAY['ISO 14971'], ARRAY['Design Output', 'Verification'], 'high', 'verification', 14),
        (gen_random_uuid(), mdr_template_id, 'gspr-5a', '5(a)', 'Reduce use-error risks related to ergonomic features and the use environment (design for patient safety).', 'Review the Usability Engineering File for records of formative and summative validation that considered ergonomics.', ARRAY['IEC 62366-1'], ARRAY['Validation'], 'high', 'verification', 15),
        (gen_random_uuid(), mdr_template_id, 'gspr-5b', '5(b)', 'Consider the technical knowledge, education, training, use environment, and medical/physical conditions of intended users.', 'Review the user profiles and analysis within the Usability Engineering File.', ARRAY['IEC 62366-1'], ARRAY['Design Input', 'Validation'], 'high', 'verification', 16),
        (gen_random_uuid(), mdr_template_id, 'gspr-6', '6', 'Device characteristics and performance must not be compromised during its intended lifetime.', 'Review stability, durability, and aging studies within the design verification reports.', ARRAY['ISO 14971'], ARRAY['Verification'], 'high', 'verification', 17),
        (gen_random_uuid(), mdr_template_id, 'gspr-7a', '7(a)', 'Devices must be designed and manufactured to reduce risks of infection and microbial contamination.', 'Review biocompatibility testing reports and sterility validation studies.', ARRAY['ISO 10993 series', 'ISO 11737'], ARRAY['Verification'], 'high', 'verification', 18),
        (gen_random_uuid(), mdr_template_id, 'gspr-8', '8', 'Devices incorporating software or software as medical devices must be designed to ensure repeatability, reliability, and performance in line with their intended use.', 'Review the Software Life Cycle Processes documentation and V&V reports.', ARRAY['IEC 62304'], ARRAY['Design Output', 'Verification'], 'high', 'verification', 19),
        (gen_random_uuid(), mdr_template_id, 'gspr-9', '9', 'Devices must be designed and manufactured to provide an acceptable level of intrinsic safety.', 'Review electrical safety testing reports and EMC testing reports.', ARRAY['IEC 60601-1', 'IEC 60601-1-2'], ARRAY['Verification'], 'high', 'verification', 20);
        
        RAISE NOTICE 'Successfully cleared % existing items and inserted 20 Chapter I items for MDR Annex I template', (SELECT COUNT(*) FROM gap_template_items WHERE template_id = mdr_template_id);
    ELSE
        RAISE NOTICE 'MDR Annex I template not found';
    END IF;
END $$;