
-- Add reviewer_group_id column to documents table
ALTER TABLE documents 
ADD COLUMN reviewer_group_id uuid REFERENCES reviewer_groups(id);

-- Add index for better performance on reviewer group queries
CREATE INDEX idx_documents_reviewer_group_id ON documents(reviewer_group_id);

-- Add comment to document the column purpose
COMMENT ON COLUMN documents.reviewer_group_id IS 'Links document to a specific reviewer group for review workflow';
