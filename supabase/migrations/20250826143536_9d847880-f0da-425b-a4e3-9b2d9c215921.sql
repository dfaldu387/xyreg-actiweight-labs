-- First, drop the dependent view temporarily
DROP VIEW IF EXISTS company_template_documents_by_phase;

-- Now change reviewer_group_id to support multiple group IDs
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

-- Recreate the view with updated column name
CREATE OR REPLACE VIEW company_template_documents_by_phase AS
SELECT 
  d.id,
  d.name,
  d.document_type,
  d.tech_applicability,
  d.description,
  d.phase_id,
  d.company_id,
  d.reviewer_group_ids,
  d.created_at,
  d.updated_at,
  p.name as phase_name,
  p.position as phase_position
FROM documents d
LEFT JOIN phases p ON d.phase_id = p.id
WHERE d.document_scope = 'company_template';

-- Grant appropriate permissions on the view
GRANT SELECT ON company_template_documents_by_phase TO authenticated;