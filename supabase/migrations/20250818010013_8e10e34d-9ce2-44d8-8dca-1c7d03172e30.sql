-- Temporarily update documents RLS policies to allow access for debugging
-- Check existing policies first
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'documents';

-- Create a more permissive policy for documents to allow debugging
CREATE POLICY IF NOT EXISTS "Allow all access to documents for debugging" ON documents
FOR ALL 
USING (true)
WITH CHECK (true);

-- Also enable RLS on documents table if it's not already enabled
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;