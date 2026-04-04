
-- Position-Safe Phase Migration Fix
-- This migration safely handles position conflicts by using temporary positions
-- and then reassigning sequential positions 1-15 without conflicts

BEGIN;

-- Step 1: Backup current state
INSERT INTO archived_pms_data (table_name, migration_phase, archived_data, archived_at)
SELECT 
  'position_safe_migration_backup',
  'position_safe_migration',
  jsonb_build_object(
    'company_phases_before', (SELECT jsonb_agg(to_jsonb(cp.*)) FROM company_phases cp WHERE cp.is_active = true),
    'company_chosen_phases_before', (SELECT jsonb_agg(to_jsonb(ccp.*)) FROM company_chosen_phases ccp),
    'backup_timestamp', now()
  ),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM archived_pms_data 
  WHERE table_name = 'position_safe_migration_backup' 
  AND migration_phase = 'position_safe_migration'
);

-- Step 2: Temporarily move all positions to safe range (1000+) to avoid conflicts
-- This prevents any conflicts during reassignment
UPDATE company_phases 
SET position = position + 1000, updated_at = now()
WHERE is_active = true;

-- Step 3: Process each company individually to assign sequential positions
DO $$
DECLARE
  company_rec RECORD;
  phase_rec RECORD;
  category_id uuid;
  new_position INTEGER;
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
  phase_count INTEGER;
BEGIN
  -- Process each company
  FOR company_rec IN SELECT id, name FROM companies WHERE is_archived = false
  LOOP
    RAISE NOTICE 'Processing company: %', company_rec.name;
    
    -- Get or create Design Control category
    SELECT id INTO category_id 
    FROM phase_categories 
    WHERE company_id = company_rec.id AND name = 'Design Control'
    LIMIT 1;
    
    IF category_id IS NULL THEN
      INSERT INTO phase_categories (company_id, name, position) 
      VALUES (company_rec.id, 'Design Control', 1)
      RETURNING id INTO category_id;
    END IF;
    
    -- Count existing active phases for this company
    SELECT COUNT(*) INTO phase_count
    FROM company_phases 
    WHERE company_id = company_rec.id AND is_active = true;
    
    -- Step 3a: Reassign positions to existing phases (first 15 only)
    new_position := 1;
    FOR phase_rec IN 
      SELECT id, name, description
      FROM company_phases 
      WHERE company_id = company_rec.id AND is_active = true 
      ORDER BY position 
      LIMIT 15
    LOOP
      -- Get corresponding standard phase definition
      SELECT phase_definitions->((new_position - 1)::text) INTO phase_def;
      
      -- Update existing phase with new position and standardized name
      UPDATE company_phases 
      SET 
        position = new_position,
        name = phase_def->>'name',
        description = phase_def->>'description',
        category_id = category_id,
        updated_at = now()
      WHERE id = phase_rec.id;
      
      -- Ensure it's in company_chosen_phases
      INSERT INTO company_chosen_phases (company_id, phase_id, position)
      VALUES (company_rec.id, phase_rec.id, new_position)
      ON CONFLICT (company_id, phase_id) DO UPDATE SET
        position = EXCLUDED.position;
      
      new_position := new_position + 1;
    END LOOP;
    
    -- Step 3b: Deactivate excess phases (beyond 15)
    UPDATE company_phases 
    SET is_active = false, updated_at = now()
    WHERE company_id = company_rec.id 
    AND is_active = true 
    AND position > 1015; -- Still in temp range, means they weren't in first 15
    
    -- Step 3c: Create missing phases if company has fewer than 15
    WHILE new_position <= 15 LOOP
      SELECT phase_definitions->((new_position - 1)::text) INTO phase_def;
      
      INSERT INTO company_phases (
        company_id, 
        name, 
        description, 
        position, 
        category_id, 
        is_active
      ) VALUES (
        company_rec.id,
        phase_def->>'name',
        phase_def->>'description',
        new_position,
        category_id,
        true
      );
      
      -- Add to chosen phases
      INSERT INTO company_chosen_phases (company_id, phase_id, position)
      VALUES (company_rec.id, lastval(), new_position);
      
      new_position := new_position + 1;
    END LOOP;
    
    RAISE NOTICE 'Completed company: % - now has 15 standardized phases', company_rec.name;
  END LOOP;
END $$;

-- Step 4: Clean up orphaned chosen phases
DELETE FROM company_chosen_phases 
WHERE phase_id NOT IN (
  SELECT id FROM company_phases WHERE is_active = true
);

-- Step 5: Remove any remaining inactive phases
DELETE FROM company_phases WHERE is_active = false;

-- Step 6: Final verification and logging
INSERT INTO archived_pms_data (table_name, migration_phase, archived_data, archived_at)
SELECT 
  'position_safe_migration_completed',
  'position_safe_migration',
  jsonb_build_object(
    'companies_processed', COUNT(DISTINCT c.id),
    'total_active_phases', COUNT(cp.id),
    'average_phases_per_company', ROUND(AVG(phase_count.count), 2),
    'companies_with_15_phases', COUNT(DISTINCT CASE WHEN phase_count.count = 15 THEN c.id END),
    'completion_timestamp', now(),
    'success', true
  ),
  now()
FROM companies c
LEFT JOIN company_phases cp ON cp.company_id = c.id AND cp.is_active = true
LEFT JOIN (
  SELECT company_id, COUNT(*) as count 
  FROM company_phases 
  WHERE is_active = true 
  GROUP BY company_id
) phase_count ON phase_count.company_id = c.id
WHERE c.is_archived = false;

COMMIT;
