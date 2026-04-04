-- Clean up orphaned lifecycle_phases for product when company has no active phases
-- Product ID: 11d98c61-f080-47c1-a189-81ac6ed6f647

-- Check if the company has any active phases
DO $$
DECLARE
    product_company_id uuid;
    active_phases_count integer;
BEGIN
    -- Get the company_id for this product
    SELECT company_id INTO product_company_id 
    FROM products 
    WHERE id = '11d98c61-f080-47c1-a189-81ac6ed6f647';
    
    -- Count active phases for this company
    SELECT COUNT(*) INTO active_phases_count
    FROM company_chosen_phases 
    WHERE company_id = product_company_id;
    
    -- If no active phases, delete all lifecycle_phases for this product
    IF active_phases_count = 0 THEN
        DELETE FROM lifecycle_phases 
        WHERE product_id = '11d98c61-f080-47c1-a189-81ac6ed6f647';
        
        RAISE NOTICE 'Deleted all lifecycle_phases for product % because company has no active phases', '11d98c61-f080-47c1-a189-81ac6ed6f647';
    ELSE
        RAISE NOTICE 'Company has % active phases, keeping lifecycle_phases', active_phases_count;
    END IF;
END $$;