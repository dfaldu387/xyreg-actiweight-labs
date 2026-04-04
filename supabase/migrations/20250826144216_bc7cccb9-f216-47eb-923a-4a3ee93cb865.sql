-- Update documents to populate reviewer_group_ids from existing reviewers data
UPDATE public.documents 
SET reviewer_group_ids = (
  SELECT ARRAY(
    SELECT DISTINCT (reviewer_group->>'id')::uuid
    FROM jsonb_array_elements(COALESCE(reviewers, '[]'::jsonb)) AS reviewer_group
    WHERE reviewer_group->>'id' IS NOT NULL
  )
)
WHERE reviewers IS NOT NULL 
  AND reviewers != '[]'::jsonb 
  AND (reviewer_group_ids IS NULL OR reviewer_group_ids = '{}');

-- Show the results to confirm the migration worked
SELECT id, name, reviewer_group_ids, 
       jsonb_array_length(COALESCE(reviewers, '[]'::jsonb)) as reviewers_count
FROM public.documents 
WHERE company_id = '81091582-1c66-40ad-b090-f9c09e922327'
ORDER BY created_at DESC;