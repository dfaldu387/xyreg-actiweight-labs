-- Make document_id nullable and add template_document_id column
ALTER TABLE document_review_notes 
  ALTER COLUMN document_id DROP NOT NULL;

-- Add column for template documents
ALTER TABLE document_review_notes 
  ADD COLUMN template_document_id uuid REFERENCES phase_assigned_document_template(id) ON DELETE CASCADE;

-- Add a check constraint to ensure at least one document reference exists
ALTER TABLE document_review_notes 
  ADD CONSTRAINT check_document_reference 
  CHECK (
    (document_id IS NOT NULL AND template_document_id IS NULL) OR 
    (document_id IS NULL AND template_document_id IS NOT NULL)
  );

-- Add index for template_document_id
CREATE INDEX idx_document_review_notes_template_doc_id 
  ON document_review_notes(template_document_id) 
  WHERE template_document_id IS NOT NULL;