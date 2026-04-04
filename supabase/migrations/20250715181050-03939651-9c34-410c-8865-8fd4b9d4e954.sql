-- Medical Device Development Lifecycle: Restructure to Linear Phases + Continuous Processes

-- First, let's clean up the existing mess and create the proper structure
-- Step 1: Get the "Detailed Design Control Steps" category ID for reference
DO $$
DECLARE
    detailed_design_category_id uuid;
    continuous_processes_category_id uuid;
    company_record RECORD;
    phase_id uuid;
BEGIN
    -- Get the existing "Detailed Design Control Steps" category
    SELECT id INTO detailed_design_category_id 
    FROM phase_categories 
    WHERE name = 'Detailed Design Control Steps' 
    LIMIT 1;
    
    -- If it doesn't exist, we'll create it for each company
    IF detailed_design_category_id IS NULL THEN
        RAISE NOTICE 'Detailed Design Control Steps category not found, will create per company';
    END IF;
    
    -- Process each company
    FOR company_record IN SELECT id, name FROM companies WHERE is_archived = false
    LOOP
        -- Ensure the company has the "Detailed Design Control Steps" category
        SELECT id INTO detailed_design_category_id 
        FROM phase_categories 
        WHERE name = 'Detailed Design Control Steps' AND company_id = company_record.id;
        
        IF detailed_design_category_id IS NULL THEN
            INSERT INTO phase_categories (company_id, name, position, is_system_category)
            VALUES (company_record.id, 'Detailed Design Control Steps', 1, true)
            RETURNING id INTO detailed_design_category_id;
        END IF;
        
        -- Create "Continuous Processes" category
        SELECT id INTO continuous_processes_category_id 
        FROM phase_categories 
        WHERE name = 'Continuous Processes' AND company_id = company_record.id;
        
        IF continuous_processes_category_id IS NULL THEN
            INSERT INTO phase_categories (company_id, name, position, is_system_category)
            VALUES (company_record.id, 'Continuous Processes', 2, true)
            RETURNING id INTO continuous_processes_category_id;
        END IF;
        
        -- Remove all existing phases from both categories for this company
        DELETE FROM company_chosen_phases 
        WHERE company_id = company_record.id 
        AND phase_id IN (
            SELECT id FROM company_phases 
            WHERE company_id = company_record.id 
            AND category_id IN (detailed_design_category_id, continuous_processes_category_id)
        );
        
        DELETE FROM company_phases 
        WHERE company_id = company_record.id 
        AND category_id IN (detailed_design_category_id, continuous_processes_category_id);
        
        -- Create the 8 Linear Development Phases
        INSERT INTO company_phases (company_id, name, description, position, category_id, is_predefined_core_phase, is_deletable, is_custom, is_active)
        VALUES 
            (company_record.id, '(01) Concept & Feasibility', 'Initial idea, market analysis, preliminary regulatory assessment, feasibility studies', 1, detailed_design_category_id, true, false, false, true),
            (company_record.id, '(02) Project Initiation & Planning', 'Formal project charter, budget allocation, Design and Development Planning', 2, detailed_design_category_id, true, false, false, true),
            (company_record.id, '(03) Requirements & Design Inputs', 'User Needs definition and translation into technical Design Input specifications', 3, detailed_design_category_id, true, false, false, true),
            (company_record.id, '(04) Design & Development (Output)', 'Creation of Design Output: drawings, specifications, source code, manufacturing instructions', 4, detailed_design_category_id, true, false, false, true),
            (company_record.id, '(05) Verification & Validation (V&V)', 'Design Verification and Validation, including Clinical Validation and usability testing', 5, detailed_design_category_id, true, false, false, true),
            (company_record.id, '(06) Finalization & Transfer', 'Final Design Review, Design Transfer to manufacturing, Technical Documentation compilation', 6, detailed_design_category_id, true, false, false, true),
            (company_record.id, '(07) Regulatory Submission & Approval', 'Submitting documentation to regulatory bodies, responding to questions, awaiting clearance', 7, detailed_design_category_id, true, false, false, true),
            (company_record.id, '(08) Launch & Post-Launch', 'Limited or full market launch and execution of post-market activities', 8, detailed_design_category_id, true, false, false, true);
            
        -- Create the 4 Continuous Processes
        INSERT INTO company_phases (company_id, name, description, position, category_id, is_predefined_core_phase, is_deletable, is_custom, is_active)
        VALUES 
            (company_record.id, '(C1) Risk Management', 'Continuous risk assessment and management throughout device lifecycle', 1, continuous_processes_category_id, true, false, false, true),
            (company_record.id, '(C2) Technical Documentation', 'Ongoing generation and compilation of technical documentation', 2, continuous_processes_category_id, true, false, false, true),
            (company_record.id, '(C3) Supplier Management', 'Supplier qualification and ongoing management activities', 3, continuous_processes_category_id, true, false, false, true),
            (company_record.id, '(C4) Post-Market Surveillance (PMS)', 'PMS planning during development and execution post-launch', 4, continuous_processes_category_id, true, false, false, true);
        
        -- Add Linear Development Phases to company_chosen_phases in order
        INSERT INTO company_chosen_phases (company_id, phase_id, position)
        SELECT 
            company_record.id,
            cp.id,
            cp.position
        FROM company_phases cp
        WHERE cp.company_id = company_record.id 
        AND cp.category_id = detailed_design_category_id
        ORDER BY cp.position;
        
        -- Add Continuous Processes to company_chosen_phases (they appear after linear phases)
        INSERT INTO company_chosen_phases (company_id, phase_id, position)
        SELECT 
            company_record.id,
            cp.id,
            cp.position + 8  -- Start after the 8 linear phases
        FROM company_phases cp
        WHERE cp.company_id = company_record.id 
        AND cp.category_id = continuous_processes_category_id
        ORDER BY cp.position;
        
        RAISE NOTICE 'Restructured phases for company: %', company_record.name;
    END LOOP;
END $$;

-- Add helpful fields to track timing and process type (optional enhancement)
ALTER TABLE company_phases 
ADD COLUMN IF NOT EXISTS typical_start_day integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS typical_duration_days integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS is_continuous_process boolean DEFAULT false;

-- Update the phases with timing information
UPDATE company_phases 
SET typical_start_day = 0, typical_duration_days = 30, is_continuous_process = false
WHERE name = '(01) Concept & Feasibility';

UPDATE company_phases 
SET typical_start_day = 30, typical_duration_days = 30, is_continuous_process = false
WHERE name = '(02) Project Initiation & Planning';

UPDATE company_phases 
SET typical_start_day = 60, typical_duration_days = 60, is_continuous_process = false
WHERE name = '(03) Requirements & Design Inputs';

UPDATE company_phases 
SET typical_start_day = 120, typical_duration_days = 240, is_continuous_process = false
WHERE name = '(04) Design & Development (Output)';

UPDATE company_phases 
SET typical_start_day = 360, typical_duration_days = 210, is_continuous_process = false
WHERE name = '(05) Verification & Validation (V&V)';

UPDATE company_phases 
SET typical_start_day = 570, typical_duration_days = 45, is_continuous_process = false
WHERE name = '(06) Finalization & Transfer';

UPDATE company_phases 
SET typical_start_day = 615, typical_duration_days = 180, is_continuous_process = false
WHERE name = '(07) Regulatory Submission & Approval';

UPDATE company_phases 
SET typical_start_day = 795, typical_duration_days = -1, is_continuous_process = false
WHERE name = '(08) Launch & Post-Launch';

-- Update continuous processes
UPDATE company_phases 
SET typical_start_day = 0, typical_duration_days = -1, is_continuous_process = true
WHERE name = '(C1) Risk Management';

UPDATE company_phases 
SET typical_start_day = 60, typical_duration_days = -1, is_continuous_process = true
WHERE name = '(C2) Technical Documentation';

UPDATE company_phases 
SET typical_start_day = 120, typical_duration_days = -1, is_continuous_process = true
WHERE name = '(C3) Supplier Management';

UPDATE company_phases 
SET typical_start_day = 360, typical_duration_days = -1, is_continuous_process = true
WHERE name = '(C4) Post-Market Surveillance (PMS)';

-- Create a comment for documentation
COMMENT ON COLUMN company_phases.typical_start_day IS 'Typical start day for this phase (0 = project start, -1 = ongoing)';
COMMENT ON COLUMN company_phases.typical_duration_days IS 'Typical duration in days (-1 = ongoing/continuous)';
COMMENT ON COLUMN company_phases.is_continuous_process IS 'True if this is a continuous process rather than a linear phase';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully restructured medical device development lifecycle phases';
    RAISE NOTICE 'Linear phases: 8 phases from Concept to Launch';
    RAISE NOTICE 'Continuous processes: 4 ongoing processes';
    RAISE NOTICE 'All companies have been updated with the new structure';
END $$;