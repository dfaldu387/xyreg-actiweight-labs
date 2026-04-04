
-- Fix phases for "New company after Migrations" company
-- This creates the 15 standardized phases specifically for the company that's missing them

BEGIN;

-- First, get the company ID for "New company after Migrations"
DO $$
DECLARE
  target_company_id uuid;
  category_id uuid;
  phase_definitions jsonb := '[
    {"name": "(01) Concept & Feasibility", "description": "Initial concept development and feasibility assessment"},
    {"name": "(02) Design Planning", "description": "Planning and preparation for design activities"},
    {"name": "(03) Design Input", "description": "Definition of design requirements and inputs"},
    {"name": "(04) Design Output", "description": "Creation of design outputs and specifications"},
    {"name": "(05) Verification", "description": "Verification that design outputs meet design inputs"},
    {"name": "(06) Validation (Design, Clinical, Usability)", "description": "Validation of the design under actual use conditions"},
    {"name": "(07) Design Transfer", "description": "Transfer of design to manufacturing"},
    {"name": "(08) Design Change Control", "description": "Management of design changes throughout lifecycle"},
    {"name": "(09) Risk Management", "description": "Ongoing risk assessment and management"},
    {"name": "(10) Configuration Management", "description": "Management of design configuration and versions"},
    {"name": "(11) Technical Documentation", "description": "Creation and maintenance of technical documentation"},
    {"name": "(12) Clinical Evaluation", "description": "Clinical assessment and evaluation activities"},
    {"name": "(13) Post-Market Surveillance", "description": "Ongoing monitoring and surveillance activities"},
    {"name": "(14) Design Review", "description": "Systematic reviews of design at key stages"},
    {"name": "(15) Design History File", "description": "Compilation and maintenance of design history documentation"}
  ]'::jsonb;
  phase_def jsonb;
  new_position INTEGER;
  new_phase_id uuid;
BEGIN
  -- Get the company ID
  SELECT id INTO target_company_id 
  FROM companies 
  WHERE name = 'New company after Migrations' 
  AND is_archived = false;
  
  IF target_company_id IS NULL THEN
    RAISE EXCEPTION 'Company "New company after Migrations" not found';
  END IF;
  
  RAISE NOTICE 'Found company ID: %', target_company_id;
  
  -- Get or create Design Control category
  SELECT id INTO category_id 
  FROM phase_categories 
  WHERE company_id = target_company_id AND name = 'Design Control'
  LIMIT 1;
  
  IF category_id IS NULL THEN
    INSERT INTO phase_categories (company_id, name, position) 
    VALUES (target_company_id, 'Design Control', 1)
    RETURNING id INTO category_id;
    RAISE NOTICE 'Created Design Control category: %', category_id;
  ELSE
    RAISE NOTICE 'Using existing Design Control category: %', category_id;
  END IF;
  
  -- Create all 15 standardized phases
  new_position := 1;
  FOR phase_def IN SELECT * FROM jsonb_array_elements(phase_definitions)
  LOOP
    -- Create the phase in company_phases
    INSERT INTO company_phases (
      company_id,
      name,
      description,
      position,
      category_id,
      is_active
    ) VALUES (
      target_company_id,
      phase_def->>'name',
      phase_def->>'description',
      new_position,
      category_id,
      true
    ) RETURNING id INTO new_phase_id;
    
    -- Add to company_chosen_phases
    INSERT INTO company_chosen_phases (company_id, phase_id, position)
    VALUES (target_company_id, new_phase_id, new_position);
    
    RAISE NOTICE 'Created phase %: % (ID: %)', new_position, phase_def->>'name', new_phase_id;
    
    new_position := new_position + 1;
  END LOOP;
  
  RAISE NOTICE 'Successfully created all 15 phases for company: %', target_company_id;
END $$;

COMMIT;
