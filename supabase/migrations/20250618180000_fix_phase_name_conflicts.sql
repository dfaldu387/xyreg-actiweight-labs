
-- Fix Phase Name Conflicts - Temporary migration to resolve duplicate names
-- This will handle the constraint violation by cleaning up duplicate phase names

BEGIN;

-- Step 1: Backup current state
INSERT INTO archived_pms_data (table_name, migration_phase, archived_data, archived_at)
SELECT 
  'phase_name_conflict_backup',
  'phase_name_conflict_fix',
  COALESCE(jsonb_agg(to_jsonb(cp.*)), '[]'::jsonb),
  now()
FROM company_phases cp
WHERE NOT EXISTS (
  SELECT 1 FROM archived_pms_data 
  WHERE table_name = 'phase_name_conflict_backup' 
  AND migration_phase = 'phase_name_conflict_fix'
);

-- Step 2: Temporarily drop the name uniqueness constraint
ALTER TABLE company_phases DROP CONSTRAINT IF EXISTS company_phases_exact_name_per_company;

-- Step 3: Remove test/invalid phases first
DELETE FROM company_phases 
WHERE (name ILIKE '%test%' OR name ILIKE '%newphae%' OR position > 15) 
AND is_active = true;

-- Step 4: Handle duplicate names by adding sequence numbers
WITH duplicate_names AS (
  SELECT 
    company_id,
    name,
    array_agg(id ORDER BY created_at) as phase_ids,
    COUNT(*) as count
  FROM company_phases
  WHERE is_active = true
  GROUP BY company_id, name
  HAVING COUNT(*) > 1
),
phases_to_rename AS (
  SELECT 
    unnest(dn.phase_ids[2:]) as phase_id,
    dn.name as original_name,
    generate_subscripts(dn.phase_ids[2:], 1) + 1 as sequence_num
  FROM duplicate_names dn
)
UPDATE company_phases 
SET name = ptr.original_name || ' (' || ptr.sequence_num || ')'
FROM phases_to_rename ptr
WHERE company_phases.id = ptr.phase_id;

-- Step 5: Apply standard numbering to phases
WITH phase_ranking AS (
  SELECT 
    id,
    company_id,
    position,
    ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY position, created_at) as new_position
  FROM company_phases
  WHERE is_active = true
),
standard_names AS (
  SELECT 
    pr.id,
    CASE pr.new_position
      WHEN 1 THEN '(01) Concept & Feasibility'
      WHEN 2 THEN '(02) Design Planning'
      WHEN 3 THEN '(03) Design Input'
      WHEN 4 THEN '(04) Design Output'
      WHEN 5 THEN '(05) Verification'
      WHEN 6 THEN '(06) Validation (Design, Clinical, Usability)'
      WHEN 7 THEN '(07) Design Transfer'
      WHEN 8 THEN '(08) Design Change Control'
      WHEN 9 THEN '(09) Risk Management'
      WHEN 10 THEN '(10) Configuration Management'
      WHEN 11 THEN '(11) Technical Documentation'
      WHEN 12 THEN '(12) Clinical Evaluation'
      WHEN 13 THEN '(13) Post-Market Surveillance'
      WHEN 14 THEN '(14) Design Review'
      WHEN 15 THEN '(15) Design History File'
      ELSE '(' || LPAD(pr.new_position::text, 2, '0') || ') Custom Phase ' || pr.new_position
    END as standard_name,
    pr.new_position
  FROM phase_ranking pr
)
UPDATE company_phases 
SET 
  name = sn.standard_name,
  position = sn.new_position,
  updated_at = now()
FROM standard_names sn
WHERE company_phases.id = sn.id;

-- Step 6: Clean up any remaining duplicate names by appending company-specific identifiers
WITH remaining_duplicates AS (
  SELECT 
    company_id,
    name,
    array_agg(id ORDER BY created_at) as phase_ids
  FROM company_phases
  WHERE is_active = true
  GROUP BY company_id, name
  HAVING COUNT(*) > 1
),
phases_to_fix AS (
  SELECT 
    unnest(rd.phase_ids[2:]) as phase_id,
    rd.name as base_name,
    rd.company_id,
    generate_subscripts(rd.phase_ids[2:], 1) + 1 as suffix_num
  FROM remaining_duplicates rd
)
UPDATE company_phases 
SET name = ptf.base_name || ' - ' || ptf.suffix_num
FROM phases_to_fix ptf
WHERE company_phases.id = ptf.phase_id;

-- Step 7: Re-add the name uniqueness constraint
ALTER TABLE company_phases ADD CONSTRAINT company_phases_exact_name_per_company UNIQUE (company_id, name);

-- Step 8: Ensure all companies have 15 standardized phases
DO $$
DECLARE
  company_rec RECORD;
  phase_count INTEGER;
  category_id uuid;
  missing_position INTEGER;
BEGIN
  FOR company_rec IN SELECT id, name FROM companies WHERE is_archived = false
  LOOP
    -- Count existing active phases
    SELECT COUNT(*) INTO phase_count
    FROM company_phases 
    WHERE company_id = company_rec.id AND is_active = true;
    
    -- Only add missing phases if company has fewer than 15
    IF phase_count < 15 THEN
      -- Get or create category
      SELECT id INTO category_id 
      FROM phase_categories 
      WHERE company_id = company_rec.id AND name = 'Design Control'
      LIMIT 1;
      
      IF category_id IS NULL THEN
        INSERT INTO phase_categories (company_id, name, position) 
        VALUES (company_rec.id, 'Design Control', 1)
        RETURNING id INTO category_id;
      END IF;
      
      -- Find missing positions and create phases
      FOR missing_position IN 1..15 LOOP
        IF NOT EXISTS (
          SELECT 1 FROM company_phases 
          WHERE company_id = company_rec.id 
          AND position = missing_position 
          AND is_active = true
        ) THEN
          INSERT INTO company_phases (company_id, name, position, category_id, is_active)
          VALUES (
            company_rec.id,
            CASE missing_position
              WHEN 1 THEN '(01) Concept & Feasibility'
              WHEN 2 THEN '(02) Design Planning'
              WHEN 3 THEN '(03) Design Input'
              WHEN 4 THEN '(04) Design Output'
              WHEN 5 THEN '(05) Verification'
              WHEN 6 THEN '(06) Validation (Design, Clinical, Usability)'
              WHEN 7 THEN '(07) Design Transfer'
              WHEN 8 THEN '(08) Design Change Control'
              WHEN 9 THEN '(09) Risk Management'
              WHEN 10 THEN '(10) Configuration Management'
              WHEN 11 THEN '(11) Technical Documentation'
              WHEN 12 THEN '(12) Clinical Evaluation'
              WHEN 13 THEN '(13) Post-Market Surveillance'
              WHEN 14 THEN '(14) Design Review'
              WHEN 15 THEN '(15) Design History File'
            END,
            missing_position,
            category_id,
            true
          )
          ON CONFLICT (company_id, name) DO NOTHING;
        END IF;
      END LOOP;
      
      -- Add new phases to company_chosen_phases
      INSERT INTO company_chosen_phases (company_id, phase_id, position)
      SELECT 
        company_rec.id,
        cp.id,
        cp.position
      FROM company_phases cp
      WHERE cp.company_id = company_rec.id 
      AND cp.is_active = true
      AND cp.id NOT IN (
        SELECT phase_id FROM company_chosen_phases WHERE company_id = company_rec.id
      )
      ON CONFLICT (company_id, phase_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Step 9: Log completion
INSERT INTO archived_pms_data (table_name, migration_phase, archived_data, archived_at)
VALUES (
  'phase_name_conflict_resolution_complete',
  'phase_name_conflict_fix',
  jsonb_build_object(
    'phase', 'phase_name_conflict_fix',
    'action', 'completed_successfully',
    'fixed_name_conflicts', true,
    'standardized_naming', true,
    'ensured_15_phases', true,
    'timestamp', now()::text
  ),
  now()
);

COMMIT;
