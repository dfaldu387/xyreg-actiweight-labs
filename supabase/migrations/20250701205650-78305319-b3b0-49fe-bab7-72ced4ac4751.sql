
-- Step 1: Create a function to identify and remove duplicate gap analysis items
CREATE OR REPLACE FUNCTION cleanup_duplicate_gap_analysis_items()
RETURNS TABLE(
  product_id uuid,
  duplicates_removed integer,
  items_kept integer
) 
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
  duplicate_count integer;
  kept_count integer;
BEGIN
  -- For each product, find and remove duplicates based on (product_id, clause_id, framework)
  FOR rec IN 
    SELECT DISTINCT gai.product_id
    FROM gap_analysis_items gai
  LOOP
    -- Count duplicates before cleanup
    SELECT COUNT(*) INTO duplicate_count
    FROM gap_analysis_items 
    WHERE gap_analysis_items.product_id = rec.product_id;
    
    -- Remove duplicates, keeping only the first occurrence of each (product_id, clause_id, framework) combination
    WITH duplicates_to_remove AS (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY product_id, clause_id, framework 
               ORDER BY inserted_at ASC
             ) as rn
      FROM gap_analysis_items
      WHERE gap_analysis_items.product_id = rec.product_id
    )
    DELETE FROM gap_analysis_items 
    WHERE id IN (
      SELECT id FROM duplicates_to_remove WHERE rn > 1
    );
    
    -- Count remaining items after cleanup
    SELECT COUNT(*) INTO kept_count
    FROM gap_analysis_items 
    WHERE gap_analysis_items.product_id = rec.product_id;
    
    RETURN QUERY SELECT 
      rec.product_id,
      (duplicate_count - kept_count)::integer,
      kept_count::integer;
  END LOOP;
END;
$$;

-- Step 2: Run the cleanup function
SELECT * FROM cleanup_duplicate_gap_analysis_items();

-- Step 3: Add unique constraint to prevent future duplicates
ALTER TABLE gap_analysis_items 
ADD CONSTRAINT unique_gap_analysis_item 
UNIQUE (product_id, clause_id, framework);

-- Step 4: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_gap_analysis_items_product_clause_framework 
ON gap_analysis_items (product_id, clause_id, framework);
