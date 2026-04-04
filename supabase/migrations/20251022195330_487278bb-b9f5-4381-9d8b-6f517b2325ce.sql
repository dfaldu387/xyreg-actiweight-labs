-- Migrate data, skipping orphaned relationships
DO $$
DECLARE
  main_prod RECORD;
  par RECORD;
  psgr RECORD;
  bundle_id UUID;
  new_bundle_name TEXT;
  bundle_counter INTEGER;
  total_migrated INTEGER := 0;
  member_position INTEGER;
BEGIN
  -- Loop through each main product that has accessories
  FOR main_prod IN 
    SELECT DISTINCT main_product_id, company_id
    FROM product_accessory_relationships
    WHERE main_product_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM products p WHERE p.id = main_product_id) -- only if product still exists
  LOOP
    -- Generate bundle name
    bundle_counter := 1;
    new_bundle_name := 'Bundle ' || bundle_counter::TEXT;
    
    -- Check if this product already has bundles and increment counter
    WHILE EXISTS (
      SELECT 1 FROM product_bundles pb
      WHERE pb.created_by_product_id = main_prod.main_product_id 
      AND pb.bundle_name = new_bundle_name
    ) LOOP
      bundle_counter := bundle_counter + 1;
      new_bundle_name := 'Bundle ' || bundle_counter::TEXT;
    END LOOP;
    
    -- Create the bundle group
    INSERT INTO product_bundles (
      company_id,
      bundle_name,
      description,
      created_by_product_id
    ) VALUES (
      main_prod.company_id,
      new_bundle_name,
      'Migrated from legacy bundle relationships',
      main_prod.main_product_id
    ) RETURNING id INTO bundle_id;
    
    -- Add the main product as primary member (position 0)
    INSERT INTO product_bundle_members (
      bundle_id,
      product_id,
      sibling_group_id,
      relationship_type,
      multiplier,
      quantity,
      is_primary,
      position
    ) VALUES (
      bundle_id,
      main_prod.main_product_id,
      NULL,
      'component',
      1,
      NULL,
      true,
      0
    );
    
    -- Initialize position counter for members
    member_position := 1;
    
    -- Add each accessory product as a separate member (only if product still exists)
    FOR par IN 
      SELECT *
      FROM product_accessory_relationships
      WHERE main_product_id = main_prod.main_product_id
      AND accessory_product_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM products p WHERE p.id = accessory_product_id)
      ORDER BY created_at
    LOOP
      INSERT INTO product_bundle_members (
        bundle_id,
        product_id,
        sibling_group_id,
        relationship_type,
        multiplier,
        quantity,
        is_primary,
        position
      ) VALUES (
        bundle_id,
        par.accessory_product_id,
        NULL,
        par.relationship_type,
        COALESCE(par.initial_multiplier, 1),
        par.typical_quantity,
        false,
        member_position
      );
      member_position := member_position + 1;
    END LOOP;
    
    -- Add sibling groups (only if sibling group still exists)
    FOR psgr IN 
      SELECT *
      FROM product_sibling_group_relationships
      WHERE main_product_id = main_prod.main_product_id
      AND accessory_sibling_group_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM product_sibling_groups psg WHERE psg.id = accessory_sibling_group_id)
      ORDER BY created_at
    LOOP
      INSERT INTO product_bundle_members (
        bundle_id,
        product_id,
        sibling_group_id,
        relationship_type,
        multiplier,
        is_primary,
        position
      ) VALUES (
        bundle_id,
        NULL,
        psgr.accessory_sibling_group_id,
        psgr.relationship_type,
        COALESCE(psgr.initial_multiplier, 1),
        false,
        member_position
      );
      member_position := member_position + 1;
    END LOOP;
    
    total_migrated := total_migrated + 1;
  END LOOP;
  
  RAISE NOTICE 'Successfully migrated % bundles', total_migrated;
END $$;