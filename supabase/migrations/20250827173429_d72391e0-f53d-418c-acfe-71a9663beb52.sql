-- Fix clause 4.1.1 to General
UPDATE gap_analysis_items 
SET requirement = 'Has the organization established, documented, implemented, and maintained a QMS, and does it maintain its effectiveness in accordance with ISO 13485?',
    section = '4.1.1 General'
WHERE clause_id = '4.1.1';

-- Fix clause 4.1.3 to Risk-Based Approach  
UPDATE gap_analysis_items 
SET requirement = 'Does the organization apply a risk-based approach to the control of the QMS processes? (Note: This is about the processes of the QMS, not product risk).',
    section = '4.1.3 Risk-Based Approach',
    evidence_method = 'Interview the QMS manager or process owners. Ask how they determine the level of control for different processes. For example, why is the control for a critical supplier more rigorous than for an office supply vendor? Look for this rationale in procedures for supplier management, change control, etc.'
WHERE clause_id = '4.1.3';

-- Insert 4.1.4 Outsourced Processes if it doesn't exist
INSERT INTO gap_analysis_items (clause_id, requirement, section, evidence_method, status, inserted_at, updated_at)
SELECT '4.1.4', 
       'Has the organization identified any QMS processes that are outsourced? Is the control over these processes defined and documented?',
       '4.1.4 Outsourced Processes',
       'Identify all outsourced processes (e.g., sterilization, certain testing, calibration, warehousing). Review the Quality Agreements or contracts with these suppliers. Check records of monitoring (e.g., performance data, supplier audits) to verify control is being maintained.',
       'Open',
       now(),
       now()
WHERE NOT EXISTS (SELECT 1 FROM gap_analysis_items WHERE clause_id = '4.1.4');

-- Insert 4.1.5 Computer Software Validation if it doesn't exist
INSERT INTO gap_analysis_items (clause_id, requirement, section, evidence_method, status, inserted_at, updated_at)
SELECT '4.1.5',
       'Has the organization documented procedures for the validation of computer software used in the QMS? Is the validation approach based on risk?',
       '4.1.5 Computer Software Validation', 
       'Review the software validation procedure. Ask for a list of all software used in the QMS (e.g., eQMS, ERP, complaint software). Select 1-2 software systems from the list and review their validation records/reports to confirm the procedure was followed.',
       'Open',
       now(),
       now()
WHERE NOT EXISTS (SELECT 1 FROM gap_analysis_items WHERE clause_id = '4.1.5');