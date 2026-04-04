-- Add unique constraint to prevent duplicate annotations
-- This ensures that the same annotation_id cannot be inserted multiple times for the same document

-- First, clean up any existing duplicates
DELETE FROM document_annotations 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM document_annotations 
  GROUP BY annotation_id, document_id
);

-- Add unique constraint
ALTER TABLE document_annotations 
ADD CONSTRAINT unique_annotation_per_document 
UNIQUE (annotation_id, document_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_document_annotations_annotation_id 
ON document_annotations(annotation_id, document_id); 