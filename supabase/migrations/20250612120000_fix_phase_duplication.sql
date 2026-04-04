
-- Fix phase duplication issue in company creation
-- This migration addresses the root cause of duplicate phase creation

-- First, let's create a safer version of the phase creation function
CREATE OR REPLACE FUNCTION public.ensure_standard_phases_for_company_safe(target_company_id uuid, target_category_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  phase_definitions jsonb := '[
    {"name": "Concept & Feasibility", "description": "Initial concept development and feasibility assessment", "position": 1},
    {"name": "Design Planning", "description": "Planning and preparation for design activities", "position": 2},
    {"name": "Design Input", "description": "Definition of design requirements and inputs", "position": 3},
    {"name": "Design Output", "description": "Creation of design outputs and specifications", "position": 4},
    {"name": "Verification", "description": "Verification that design outputs meet design inputs", "position": 5},
    {"name": "Validation (Design, Clinical, Usability)", "description": "Validation of the design under actual use conditions", "position": 6},
    {"name": "Design Transfer", "description": "Transfer of design to manufacturing", "position": 7},
    {"name": "Design Change Control", "description": "Management of design changes throughout lifecycle", "position": 8},
    {"name": "Risk Management", "description": "Ongoing risk assessment and management", "position": 9},
    {"name": "Configuration Management", "description": "Management of design configuration and versions", "position": 10},
    {"name": "Technical Documentation", "description": "Creation and maintenance of technical documentation", "position": 11},
    {"name": "Clinical Evaluation", "description": "Clinical assessment and evaluation activities", "position": 12},
    {"name": "Post-Market Surveillance", "description": "Ongoing monitoring and surveillance activities", "position": 13},
    {"name": "Design Review", "description": "Systematic review of design at key milestones", "position": 14},
    {"name": "Design History File", "description": "Maintenance of design history documentation", "position": 15}
  ]'::jsonb;
  
  phase_def jsonb;
  phase_id uuid;
  existing_count integer;
BEGIN
  -- Check if company already has phases to avoid duplication
  SELECT COUNT(*) INTO existing_count
  FROM company_chosen_phases ccp
  JOIN phases p ON p.id = ccp.phase_id
  WHERE ccp.company_id = target_company_id
  AND p.is_predefined_core_phase = true;
  
  -- If company already has standard phases, skip creation
  IF existing_count >= 10 THEN
    RAISE NOTICE 'Company % already has % standard phases, skipping creation', target_company_id, existing_count;
    RETURN;
  END IF;
  
  -- Create each phase with conflict handling
  FOR phase_def IN SELECT * FROM jsonb_array_elements(phase_definitions)
  LOOP
    -- First try to find existing phase with same name for this company
    SELECT id INTO phase_id
    FROM phases 
    WHERE company_id = target_company_id 
    AND name = phase_def->>'name'
    LIMIT 1;
    
    -- If phase doesn't exist, create it
    IF phase_id IS NULL THEN
      INSERT INTO phases (
        company_id,
        category_id,
        name,
        description,
        position,
        is_predefined_core_phase,
        is_saas_default,
        is_deletable
      ) VALUES (
        target_company_id,
        target_category_id,
        phase_def->>'name',
        phase_def->>'description',
        (phase_def->>'position')::integer,
        true,
        true,
        false
      )
      RETURNING id INTO phase_id;
      
      RAISE NOTICE 'Created phase: % for company %', phase_def->>'name', target_company_id;
    ELSE
      RAISE NOTICE 'Phase % already exists for company %, skipping', phase_def->>'name', target_company_id;
    END IF;
    
    -- Add to company chosen phases if not already there
    INSERT INTO company_chosen_phases (
      company_id,
      phase_id,
      position
    ) VALUES (
      target_company_id,
      phase_id,
      (phase_def->>'position')::integer
    )
    ON CONFLICT (company_id, phase_id) DO NOTHING;
    
  END LOOP;
  
  RAISE NOTICE 'Completed phase setup for company %', target_company_id;
END;
$$;

-- Update the handle_new_company function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  category_id uuid;
  existing_trigger_count integer;
BEGIN
  -- Prevent duplicate execution by checking if phases already exist
  SELECT COUNT(*) INTO existing_trigger_count
  FROM phases 
  WHERE company_id = NEW.id 
  AND is_predefined_core_phase = true;
  
  IF existing_trigger_count > 0 THEN
    RAISE NOTICE 'Company % already has % phases, skipping trigger execution', NEW.id, existing_trigger_count;
    RETURN NEW;
  END IF;
  
  -- Ensure detailed design category exists
  SELECT public.ensure_detailed_design_category(NEW.id) INTO category_id;
  
  -- Use the safe phase creation function
  PERFORM public.ensure_standard_phases_for_company_safe(NEW.id, category_id);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the company creation
    RAISE WARNING 'Error in handle_new_company for company %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop duplicate triggers if they exist and recreate a single one
DROP TRIGGER IF EXISTS after_company_insert ON companies;
DROP TRIGGER IF EXISTS on_company_created ON companies;

-- Create a single, robust trigger
CREATE TRIGGER after_company_insert
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_company();

-- Create a function to clean up existing duplicate phases
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_phases_for_company(target_company_id uuid)
RETURNS TABLE(action_taken text, phase_name text, duplicates_removed integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  phase_record RECORD;
  duplicate_count integer;
  kept_phase_id uuid;
BEGIN
  -- Find and remove duplicate phases for a specific company
  FOR phase_record IN 
    SELECT name, COUNT(*) as count
    FROM phases 
    WHERE company_id = target_company_id
    AND is_predefined_core_phase = true
    GROUP BY name
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first phase and remove duplicates
    SELECT id INTO kept_phase_id
    FROM phases 
    WHERE company_id = target_company_id 
    AND name = phase_record.name
    AND is_predefined_core_phase = true
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Count duplicates before deletion
    SELECT COUNT(*) - 1 INTO duplicate_count
    FROM phases 
    WHERE company_id = target_company_id 
    AND name = phase_record.name
    AND is_predefined_core_phase = true;
    
    -- Delete duplicate phases (keep the first one)
    DELETE FROM phases 
    WHERE company_id = target_company_id 
    AND name = phase_record.name
    AND is_predefined_core_phase = true
    AND id != kept_phase_id;
    
    -- Clean up orphaned company_chosen_phases entries
    DELETE FROM company_chosen_phases
    WHERE company_id = target_company_id
    AND phase_id NOT IN (
      SELECT id FROM phases WHERE company_id = target_company_id
    );
    
    -- Ensure the kept phase is in company_chosen_phases
    INSERT INTO company_chosen_phases (company_id, phase_id, position)
    SELECT target_company_id, kept_phase_id, 
      CASE phase_record.name
        WHEN 'Concept & Feasibility' THEN 1
        WHEN 'Design Planning' THEN 2
        WHEN 'Design Input' THEN 3
        WHEN 'Design Output' THEN 4
        WHEN 'Verification' THEN 5
        WHEN 'Validation (Design, Clinical, Usability)' THEN 6
        WHEN 'Design Transfer' THEN 7
        WHEN 'Design Change Control' THEN 8
        WHEN 'Risk Management' THEN 9
        WHEN 'Configuration Management' THEN 10
        WHEN 'Technical Documentation' THEN 11
        WHEN 'Clinical Evaluation' THEN 12
        WHEN 'Post-Market Surveillance' THEN 13
        WHEN 'Design Review' THEN 14
        WHEN 'Design History File' THEN 15
        ELSE 99
      END
    ON CONFLICT (company_id, phase_id) DO NOTHING;
    
    RETURN QUERY SELECT 
      'cleaned_duplicates'::text,
      phase_record.name,
      duplicate_count;
  END LOOP;
  
  -- If no duplicates found
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      'no_duplicates_found'::text,
      'N/A'::text,
      0;
  END IF;
END;
$$;

-- Add a comment explaining the fix
COMMENT ON FUNCTION public.handle_new_company() IS 'Fixed version that prevents duplicate phase creation and handles errors gracefully';
COMMENT ON FUNCTION public.ensure_standard_phases_for_company_safe(uuid, uuid) IS 'Safe version of phase creation that checks for existing phases and uses conflict handling';
COMMENT ON FUNCTION public.cleanup_duplicate_phases_for_company(uuid) IS 'Utility function to clean up duplicate phases for a specific company';
