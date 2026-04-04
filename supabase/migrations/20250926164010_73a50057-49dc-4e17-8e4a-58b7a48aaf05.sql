-- Continue correcting Nox Medical product names from EUDAMED device_name
-- Fixed version with correct column names

-- Create a function to handle the remaining Nox Medical product name corrections
CREATE OR REPLACE FUNCTION correct_remaining_nox_medical_names()
RETURNS TABLE(
  product_id UUID,
  old_name TEXT,
  new_name TEXT,
  action_taken TEXT
) LANGUAGE plpgsql AS $$
DECLARE
  correction_record RECORD;
  correction_count INTEGER := 0;
  nox_company_id UUID;
BEGIN
  -- Get Nox Medical company ID
  SELECT id INTO nox_company_id 
  FROM companies 
  WHERE name = 'Nox Medical' 
  LIMIT 1;
  
  IF nox_company_id IS NULL THEN
    RAISE EXCEPTION 'Nox Medical company not found';
  END IF;

  -- Process all Nox Medical products that need name corrections
  FOR correction_record IN
    SELECT DISTINCT 
      p.id, 
      p.name as current_name, 
      p.udi_di,
      e.device_name as correct_name
    FROM products p
    JOIN companies c ON p.company_id = c.id
    LEFT JOIN eudamed_medical_devices e ON p.udi_di = e.udi_di
    WHERE c.name = 'Nox Medical'
      AND e.device_name IS NOT NULL
      AND p.name != e.device_name
    ORDER BY p.name
  LOOP
    -- Check if the target name already exists for this company
    IF EXISTS (
      SELECT 1 FROM products p2 
      WHERE p2.company_id = nox_company_id
        AND p2.name = correction_record.correct_name 
        AND p2.id != correction_record.id
    ) THEN
      -- Generate unique name if duplicate exists
      DECLARE
        unique_name TEXT;
        counter INTEGER := 1;
      BEGIN
        unique_name := correction_record.correct_name;
        
        WHILE EXISTS (
          SELECT 1 FROM products p3 
          WHERE p3.company_id = nox_company_id
            AND p3.name = unique_name
            AND p3.id != correction_record.id
        ) LOOP
          counter := counter + 1;
          unique_name := correction_record.correct_name || ' (' || counter || ')';
        END LOOP;
        
        -- Update with unique name
        UPDATE products 
        SET name = unique_name
        WHERE id = correction_record.id;
        
        -- Log the correction
        INSERT INTO product_name_corrections (
          product_id,
          company_id,
          old_name,
          new_name,
          udi_di,
          correction_reason,
          corrected_at,
          corrected_by
        ) VALUES (
          correction_record.id,
          nox_company_id,
          correction_record.current_name,
          unique_name,
          correction_record.udi_di,
          'EUDAMED device_name standardization with uniqueness',
          NOW(),
          'System Migration'
        );
        
        correction_count := correction_count + 1;
        
        RETURN QUERY SELECT 
          correction_record.id,
          correction_record.current_name,
          unique_name,
          'updated_with_unique_name'::TEXT;
      END;
    ELSE
      -- Update directly with correct name
      UPDATE products 
      SET name = correction_record.correct_name
      WHERE id = correction_record.id;
      
      -- Log the correction
      INSERT INTO product_name_corrections (
        product_id,
        company_id,
        old_name,
        new_name,
        udi_di,
        correction_reason,
        corrected_at,
        corrected_by
      ) VALUES (
        correction_record.id,
        nox_company_id,
        correction_record.current_name,
        correction_record.correct_name,
        correction_record.udi_di,
        'EUDAMED device_name standardization',
        NOW(),
        'System Migration'
      );
      
      correction_count := correction_count + 1;
      
      RETURN QUERY SELECT 
        correction_record.id,
        correction_record.current_name,
        correction_record.correct_name,
        'updated_directly'::TEXT;
    END IF;
  END LOOP;
  
  -- Log summary
  RAISE NOTICE 'Corrected % Nox Medical product names from EUDAMED device_name', correction_count;
  
  RETURN;
END;
$$;

-- Execute the function to correct all remaining Nox Medical product names
SELECT * FROM correct_remaining_nox_medical_names();