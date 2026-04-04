-- Change reviewer_group_id to support multiple group IDs
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_reviewer_group_id_fkey;

-- Change the column to an array of UUIDs
ALTER TABLE public.documents 
ALTER COLUMN reviewer_group_id TYPE uuid[] USING CASE 
  WHEN reviewer_group_id IS NULL THEN NULL 
  ELSE ARRAY[reviewer_group_id] 
END;

-- Rename for clarity
ALTER TABLE public.documents 
RENAME COLUMN reviewer_group_id TO reviewer_group_ids;

-- Update the index
DROP INDEX IF EXISTS idx_documents_reviewer_group_id;
CREATE INDEX idx_documents_reviewer_group_ids ON public.documents USING GIN(reviewer_group_ids);

-- Add a check constraint to ensure the array is not empty when not null
ALTER TABLE public.documents 
ADD CONSTRAINT chk_reviewer_group_ids_not_empty 
CHECK (reviewer_group_ids IS NULL OR array_length(reviewer_group_ids, 1) > 0);