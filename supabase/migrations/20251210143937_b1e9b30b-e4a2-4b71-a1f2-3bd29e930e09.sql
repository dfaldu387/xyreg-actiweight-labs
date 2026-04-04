-- Create document_authors table for custom author names
CREATE TABLE public.document_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE public.document_authors ENABLE ROW LEVEL SECURITY;

-- Policy for company access (SELECT)
CREATE POLICY "Users can view authors in their company"
  ON public.document_authors FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid()));

-- Policy for company access (INSERT)
CREATE POLICY "Users can create authors in their company"
  ON public.document_authors FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid()));