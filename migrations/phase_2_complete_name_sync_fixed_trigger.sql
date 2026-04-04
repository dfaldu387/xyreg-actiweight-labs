
-- Phase 2: Complete Phase Name Synchronization and Fix Enhanced Repair Function (Fixed Trigger Issue)
-- This migration will sync all phase-related data to use clean names consistently

-- Step 1: Temporarily disable conflicting triggers
DROP TRIGGER IF EXISTS maintain_lifecycle_phases_consistency ON products;
DROP TRIGGER IF EXISTS ensure_product_phase_consistency ON lifecycle_phases;
DROP TRIGGER IF EXISTS validate_company_phase_assignment ON lifecycle_phases;
DROP TRIGGER IF EXISTS sync_product_current_phase ON lifecycle_phases;

-- Step 2: Update products.current_lifecycle_phase to use clean phase names
UPDATE products 
SET current_lifecycle_phase = TRIM(REGEXP_REPLACE(current_lifecycle_phase, '^\(\d+\)\s*', '', 'g'))
WHERE current_lifecycle_phase IS NOT NULL
AND current_lifecycle_phase ~ '^\(\d+\)\s*';

-- Step 3: Update lifecycle_phases.name to match clean phase names from phases table
UPDATE lifecycle_phases lp
SET name = p.name
FROM phases p
WHERE lp.phase_id = p.id
AND lp.name != p.name;

-- Step 4: Create enhanced repair function that works with clean names
CREATE OR REPLACE FUNCTION validate_and_repair_company_phase_integrity(target_company_id uuid)
RETURNS TABLE(
  product_id uuid,
  product_name text, 
  action_taken text, 
  old_value text, 
  new_value text, 
  success boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_rec RECORD;
  first_phase_rec RECORD;
  lifecycle_count INTEGER;
  current_phase_count INTEGER;
BEGIN
  -- Get the first available phase for the company as fallback
  SELECT ph.id, ph.name INTO first_phase_rec
  FROM company_chosen_phases ccp
  JOIN phases ph ON ph.id = ccp.phase_id
  WHERE ccp.company_id = target_company_id
  ORDER BY ccp.position
  LIMIT 1;
  
  IF first_phase_rec.id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::uuid,
      'N/A'::text, 
      'error_no_phases'::text, 
      ''::text, 
      'No phases configured for company'::text, 
      false;
    RETURN;
  END IF;
  
  -- Process each product for this company
  FOR product_rec IN 
    SELECT p.id, p.name, p.current_lifecycle_phase
    FROM products p
    WHERE p.company_id = target_company_id 
    AND p.is_archived = false
  LOOP
    BEGIN
      -- Count existing lifecycle_phases for this product
      SELECT COUNT(*) INTO lifecycle_count
      FROM lifecycle_phases lp
      WHERE lp.product_id = product_rec.id;
      
      -- Count current phases
      SELECT COUNT(*) INTO current_phase_count
      FROM lifecycle_phases lp
      WHERE lp.product_id = product_rec.id 
      AND lp.is_current_phase = true;
      
      -- Case 1: No lifecycle phases exist
      IF lifecycle_count = 0 THEN
        INSERT INTO lifecycle_phases (
          product_id,
          phase_id,
          name,
          is_current_phase,
          status,
          progress
        ) VALUES (
          product_rec.id,
          first_phase_rec.id,
          first_phase_rec.name,
          true,
          'In Progress',
          0
        );
        
        UPDATE products 
        SET current_lifecycle_phase = first_phase_rec.name
        WHERE id = product_rec.id;
        
        RETURN QUERY SELECT 
          product_rec.id,
          product_rec.name,
          'created_lifecycle_phase'::text,
          'none'::text,
          first_phase_rec.name,
          true;
          
      -- Case 2: Multiple lifecycle phases (should be one-to-one)
      ELSIF lifecycle_count > 1 THEN
        -- Delete all but the most recent
        DELETE FROM lifecycle_phases 
        WHERE product_id = product_rec.id 
        AND id NOT IN (
          SELECT id FROM lifecycle_phases 
          WHERE product_id = product_rec.id 
          ORDER BY updated_at DESC, created_at DESC
          LIMIT 1
        );
        
        -- Ensure remaining one is marked as current
        UPDATE lifecycle_phases 
        SET is_current_phase = true, name = first_phase_rec.name, phase_id = first_phase_rec.id
        WHERE product_id = product_rec.id;
        
        UPDATE products 
        SET current_lifecycle_phase = first_phase_rec.name
        WHERE id = product_rec.id;
        
        RETURN QUERY SELECT 
          product_rec.id,
          product_rec.name,
          'fixed_multiple_phases'::text,
          lifecycle_count::text,
          '1'::text,
          true;
          
      -- Case 3: One phase exists but not marked as current
      ELSIF current_phase_count = 0 THEN
        UPDATE lifecycle_phases 
        SET is_current_phase = true
        WHERE product_id = product_rec.id;
        
        -- Sync product field with lifecycle phase
        UPDATE products 
        SET current_lifecycle_phase = (
          SELECT lp.name FROM lifecycle_phases lp
          WHERE lp.product_id = product_rec.id
        )
        WHERE id = product_rec.id;
        
        RETURN QUERY SELECT 
          product_rec.id,
          product_rec.name,
          'marked_phase_current'::text,
          'no_current_flag'::text,
          (SELECT lp.name FROM lifecycle_phases lp WHERE lp.product_id = product_rec.id),
          true;
          
      -- Case 4: Multiple phases marked as current
      ELSIF current_phase_count > 1 THEN
        -- Keep only the first one as current
        UPDATE lifecycle_phases 
        SET is_current_phase = false
        WHERE product_id = product_rec.id;
        
        UPDATE lifecycle_phases 
        SET is_current_phase = true
        WHERE id = (
          SELECT id FROM lifecycle_phases 
          WHERE product_id = product_rec.id 
          ORDER BY updated_at DESC, created_at DESC
          LIMIT 1
        );
        
        -- Sync product field
        UPDATE products 
        SET current_lifecycle_phase = (
          SELECT lp.name FROM lifecycle_phases lp
          WHERE lp.product_id = product_rec.id AND lp.is_current_phase = true
        )
        WHERE id = product_rec.id;
        
        RETURN QUERY SELECT 
          product_rec.id,
          product_rec.name,
          'fixed_multiple_current'::text,
          current_phase_count::text,
          '1'::text,
          true;
          
      ELSE
        -- Validate phase consistency
        IF NOT EXISTS (
          SELECT 1 FROM lifecycle_phases lp
          JOIN company_chosen_phases ccp ON ccp.phase_id = lp.phase_id
          WHERE lp.product_id = product_rec.id
          AND lp.is_current_phase = true
          AND ccp.company_id = target_company_id
        ) THEN
          -- Current phase is invalid for company - fix it
          UPDATE lifecycle_phases 
          SET phase_id = first_phase_rec.id, name = first_phase_rec.name
          WHERE product_id = product_rec.id 
          AND is_current_phase = true;
          
          UPDATE products 
          SET current_lifecycle_phase = first_phase_rec.name
          WHERE id = product_rec.id;
          
          RETURN QUERY SELECT 
            product_rec.id,
            product_rec.name,
            'fixed_invalid_phase'::text,
            'invalid_phase'::text,
            first_phase_rec.name,
            true;
        ELSE
          -- Check if product field matches lifecycle phase
          IF product_rec.current_lifecycle_phase != (
            SELECT lp.name FROM lifecycle_phases lp
            WHERE lp.product_id = product_rec.id AND lp.is_current_phase = true
          ) THEN
            UPDATE products 
            SET current_lifecycle_phase = (
              SELECT lp.name FROM lifecycle_phases lp
              WHERE lp.product_id = product_rec.id AND lp.is_current_phase = true
            )
            WHERE id = product_rec.id;
            
            RETURN QUERY SELECT 
              product_rec.id,
              product_rec.name,
              'synced_product_field'::text,
              product_rec.current_lifecycle_phase,
              (SELECT lp.name FROM lifecycle_phases lp WHERE lp.product_id = product_rec.id AND lp.is_current_phase = true),
              true;
          END IF;
        END IF;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 
        product_rec.id,
        product_rec.name,
        'error'::text,
        'exception'::text,
        SQLERRM,
        false;
    END;
  END LOOP;
  
  RETURN;
END;
$$;

-- Step 5: Create phase system health check function
CREATE OR REPLACE FUNCTION check_phase_system_health()
RETURNS TABLE(
  metric_name text,
  metric_value integer,
  status text,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  orphaned_count INTEGER;
  duplicate_count INTEGER;
  missing_count INTEGER;
  inconsistent_count INTEGER;
BEGIN
  -- Check for products without lifecycle phases
  SELECT COUNT(*) INTO missing_count
  FROM products p
  WHERE p.is_archived = false
  AND NOT EXISTS (
    SELECT 1 FROM lifecycle_phases lp 
    WHERE lp.product_id = p.id
  );
  
  RETURN QUERY SELECT 
    'products_without_lifecycle_phases'::text,
    missing_count,
    CASE WHEN missing_count = 0 THEN 'healthy' ELSE 'warning' END,
    format('%s products missing lifecycle phases', missing_count);
  
  -- Check for products with multiple lifecycle phases
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT product_id 
    FROM lifecycle_phases 
    GROUP BY product_id 
    HAVING COUNT(*) > 1
  ) subq;
  
  RETURN QUERY SELECT 
    'products_with_multiple_phases'::text,
    duplicate_count,
    CASE WHEN duplicate_count = 0 THEN 'healthy' ELSE 'error' END,
    format('%s products with multiple lifecycle phases', duplicate_count);
  
  -- Check for inconsistent phase names
  SELECT COUNT(*) INTO inconsistent_count
  FROM products p
  JOIN lifecycle_phases lp ON lp.product_id = p.id AND lp.is_current_phase = true
  WHERE p.current_lifecycle_phase != lp.name;
  
  RETURN QUERY SELECT 
    'inconsistent_phase_names'::text,
    inconsistent_count,
    CASE WHEN inconsistent_count = 0 THEN 'healthy' ELSE 'warning' END,
    format('%s products with inconsistent phase names', inconsistent_count);
  
  -- Check for orphaned lifecycle phases
  SELECT COUNT(*) INTO orphaned_count
  FROM lifecycle_phases lp
  WHERE NOT EXISTS (
    SELECT 1 FROM products p 
    WHERE p.id = lp.product_id 
    AND p.is_archived = false
  );
  
  RETURN QUERY SELECT 
    'orphaned_lifecycle_phases'::text,
    orphaned_count,
    CASE WHEN orphaned_count = 0 THEN 'healthy' ELSE 'warning' END,
    format('%s orphaned lifecycle phase records', orphaned_count);
  
  RETURN;
END;
$$;

-- Step 6: Re-create the essential triggers (simplified versions)
CREATE TRIGGER sync_product_current_phase
    AFTER INSERT OR UPDATE ON lifecycle_phases
    FOR EACH ROW
    EXECUTE FUNCTION sync_product_current_phase();

CREATE TRIGGER ensure_product_phase_consistency
    AFTER INSERT OR UPDATE ON lifecycle_phases
    FOR EACH ROW
    EXECUTE FUNCTION ensure_product_phase_consistency();

-- Step 7: Verification query to check the cleanup results
SELECT 
  'POST-MIGRATION: Phase name consistency check' as check_type,
  c.name as company_name,
  COUNT(DISTINCT p.id) as total_products,
  COUNT(CASE WHEN p.current_lifecycle_phase IS NOT NULL AND p.current_lifecycle_phase !~ '^\(\d+\)\s*' THEN 1 END) as clean_product_phases,
  COUNT(CASE WHEN lp.name IS NOT NULL AND lp.name !~ '^\(\d+\)\s*' THEN 1 END) as clean_lifecycle_phases
FROM companies c
LEFT JOIN products p ON p.company_id = c.id AND p.is_archived = false
LEFT JOIN lifecycle_phases lp ON lp.product_id = p.id AND lp.is_current_phase = true
WHERE c.is_archived = false
GROUP BY c.id, c.name
ORDER BY c.name;
