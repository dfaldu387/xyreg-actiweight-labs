-- Fix Gap Analysis Architecture: Consolidate Company-Level Templates

-- Step 1: Add function to consolidate company-level gap analysis items
CREATE OR REPLACE FUNCTION consolidate_company_gap_analysis()
RETURNS TABLE(
  action_taken text,
  company_name text,
  template_name text,
  items_consolidated integer,
  items_removed integer
) 
LANGUAGE plpgsql
AS $$
DECLARE
  company_rec RECORD;
  template_rec RECORD;
  consolidated_item_id uuid;
  items_to_remove uuid[];
  consolidated_count integer := 0;
  removed_count integer := 0;
BEGIN
  -- Process each company
  FOR company_rec IN 
    SELECT c.id, c.name 
    FROM companies c 
    WHERE c.is_archived = false
  LOOP
    -- For each company, find templates that should be company-level
    FOR template_rec IN
      SELECT DISTINCT t.id, t.name, t.scope
      FROM gap_analysis_templates t
      JOIN company_gap_templates cgt ON cgt.template_id = t.id
      WHERE cgt.company_id = company_rec.id 
        AND cgt.is_enabled = true
        AND t.scope IN ('company', 'regulatory')
    LOOP
      -- Get all gap analysis items for this template across all products
      SELECT array_agg(gai.id) INTO items_to_remove
      FROM gap_analysis_items gai
      JOIN products p ON p.id = gai.product_id
      WHERE p.company_id = company_rec.id
        AND gai.framework = template_rec.name;
      
      IF array_length(items_to_remove, 1) > 1 THEN
        -- Keep the first item but make it company-wide
        consolidated_item_id := items_to_remove[1];
        
        -- Update the first item to be company-wide (remove product_id)
        UPDATE gap_analysis_items 
        SET product_id = NULL
        WHERE id = consolidated_item_id;
        
        -- Remove duplicate items (keep only the first one)
        DELETE FROM gap_analysis_items 
        WHERE id = ANY(items_to_remove[2:]);
        
        consolidated_count := consolidated_count + 1;
        removed_count := removed_count + (array_length(items_to_remove, 1) - 1);
        
        RETURN QUERY SELECT 
          'consolidated'::text,
          company_rec.name,
          template_rec.name,
          1,
          (array_length(items_to_remove, 1) - 1);
      END IF;
    END LOOP;
  END LOOP;
  
  -- Summary result
  RETURN QUERY SELECT 
    'summary'::text,
    'All Companies'::text,
    'All Templates'::text,
    consolidated_count,
    removed_count;
END;
$$;

-- Step 2: Add function to fetch company-wide gap analysis items
CREATE OR REPLACE FUNCTION get_company_gap_analysis_items(target_company_id uuid)
RETURNS TABLE(
  id uuid,
  requirement text,
  framework text,
  section text,
  clause_id text,
  clause_summary text,
  category text,
  status text,
  action_needed text,
  priority text,
  evidence_links jsonb,
  milestone_due_date date,
  assigned_to text,
  last_updated_by uuid,
  inserted_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gai.id,
    gai.requirement,
    gai.framework,
    gai.section,
    gai.clause_id,
    gai.clause_summary,
    gai.category,
    gai.status,
    gai.action_needed,
    gai.priority,
    gai.evidence_links,
    gai.milestone_due_date,
    gai.assigned_to,
    gai.last_updated_by,
    gai.inserted_at,
    gai.updated_at
  FROM gap_analysis_items gai
  WHERE gai.product_id IS NULL  -- Company-wide items have no product_id
    AND EXISTS (
      -- Only return items for templates enabled by this company
      SELECT 1 
      FROM gap_analysis_templates t
      JOIN company_gap_templates cgt ON cgt.template_id = t.id
      WHERE cgt.company_id = target_company_id
        AND cgt.is_enabled = true
        AND t.framework = gai.framework
    )
  ORDER BY gai.framework, gai.clause_id;
END;
$$;

-- Step 3: Run the consolidation
SELECT * FROM consolidate_company_gap_analysis();