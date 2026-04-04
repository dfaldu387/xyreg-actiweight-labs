-- Create the audit log table and then perform advanced product name corrections
-- First, create the audit log table for tracking product name corrections
CREATE TABLE IF NOT EXISTS product_name_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    company_id UUID NOT NULL,
    old_name TEXT NOT NULL,
    new_name TEXT NOT NULL,
    udi_di TEXT,
    correction_reason TEXT DEFAULT 'EUDAMED device name alignment',
    corrected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    corrected_by TEXT DEFAULT 'System - Automated correction'
);

-- Create indexes for efficient lookups on the audit table
CREATE INDEX IF NOT EXISTS idx_product_name_corrections_product_id 
ON product_name_corrections(product_id);

CREATE INDEX IF NOT EXISTS idx_product_name_corrections_company_id 
ON product_name_corrections(company_id);

-- Add RLS policy for the audit table
ALTER TABLE product_name_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view corrections for their companies" 
ON product_name_corrections FOR SELECT 
USING (company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
));

-- Create a function to generate unique names if needed
CREATE OR REPLACE FUNCTION generate_unique_product_name(
    target_company_id UUID,
    base_name TEXT,
    exclude_product_id UUID DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    candidate_name TEXT;
    counter INTEGER := 2;
BEGIN
    -- First check if the base name is available
    IF NOT EXISTS (
        SELECT 1 FROM products 
        WHERE company_id = target_company_id 
        AND name = base_name 
        AND is_archived = false
        AND (exclude_product_id IS NULL OR id != exclude_product_id)
    ) THEN
        RETURN base_name;
    END IF;
    
    -- If base name exists, try with incremental numbers
    LOOP
        candidate_name := base_name || ' (' || counter || ')';
        
        IF NOT EXISTS (
            SELECT 1 FROM products 
            WHERE company_id = target_company_id 
            AND name = candidate_name 
            AND is_archived = false
            AND (exclude_product_id IS NULL OR id != exclude_product_id)
        ) THEN
            RETURN candidate_name;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 100 THEN
            RETURN base_name || ' (' || extract(epoch from now()) || ')';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Now perform the advanced corrections for Nox Medical products
DO $$
DECLARE
    correction_record RECORD;
    corrections_made INTEGER := 0;
    duplicates_handled INTEGER := 0;
    unique_name TEXT;
    target_exists BOOLEAN;
BEGIN
    -- Log and update products where current name differs from EUDAMED device_name
    FOR correction_record IN
        SELECT 
            p.id as product_id,
            p.company_id,
            p.name as current_name,
            emd.device_name as correct_name,
            p.udi_di,
            c.name as company_name
        FROM products p
        JOIN companies c ON c.id = p.company_id
        JOIN eudamed.medical_devices emd ON emd.udi_di = p.udi_di
        WHERE c.name = 'Nox Medical'
          AND p.udi_di IS NOT NULL
          AND emd.device_name IS NOT NULL
          AND emd.device_name != ''
          AND p.is_archived = false
          -- Only update where names are significantly different (not just whitespace/formatting)
          AND TRIM(LOWER(p.name)) != TRIM(LOWER(emd.device_name))
          -- Exclude cases where current name contains the device name (partial matches)
          AND NOT (TRIM(LOWER(p.name)) LIKE '%' || TRIM(LOWER(emd.device_name)) || '%')
    LOOP
        -- Check if the target device name already exists as another product
        SELECT EXISTS (
            SELECT 1 FROM products 
            WHERE company_id = correction_record.company_id 
            AND name = correction_record.correct_name 
            AND is_archived = false
            AND id != correction_record.product_id
        ) INTO target_exists;
        
        IF target_exists THEN
            -- Target name exists, generate a unique name
            unique_name := generate_unique_product_name(
                correction_record.company_id, 
                correction_record.correct_name, 
                correction_record.product_id
            );
            
            -- Log the correction with duplicate handling
            INSERT INTO product_name_corrections (
                product_id,
                company_id,
                old_name,
                new_name,
                udi_di,
                correction_reason
            ) VALUES (
                correction_record.product_id,
                correction_record.company_id,
                correction_record.current_name,
                unique_name,
                correction_record.udi_di,
                'EUDAMED device name alignment - Duplicate handled with unique identifier'
            );
            
            -- Update the product name with unique identifier
            UPDATE products 
            SET 
                name = unique_name,
                updated_at = now()
            WHERE id = correction_record.product_id;
            
            duplicates_handled := duplicates_handled + 1;
            
            RAISE NOTICE 'Corrected with duplicate handling: % -> % (original target: %)', 
                correction_record.current_name, 
                unique_name,
                correction_record.correct_name;
        ELSE
            -- Target name doesn't exist, safe to rename directly
            INSERT INTO product_name_corrections (
                product_id,
                company_id,
                old_name,
                new_name,
                udi_di,
                correction_reason
            ) VALUES (
                correction_record.product_id,
                correction_record.company_id,
                correction_record.current_name,
                correction_record.correct_name,
                correction_record.udi_di,
                'EUDAMED device name alignment - Direct correction'
            );
            
            -- Update the product name directly
            UPDATE products 
            SET 
                name = correction_record.correct_name,
                updated_at = now()
            WHERE id = correction_record.product_id;
            
            RAISE NOTICE 'Corrected directly: % -> %', 
                correction_record.current_name, 
                correction_record.correct_name;
        END IF;
        
        corrections_made := corrections_made + 1;
    END LOOP;
    
    RAISE NOTICE 'Total corrections made: %, Duplicates handled: %', corrections_made, duplicates_handled;
END $$;