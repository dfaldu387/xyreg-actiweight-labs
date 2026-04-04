-- Add probationary_reason field to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN probationary_reason TEXT;

-- Add supplier evaluation documents table
CREATE TABLE public.supplier_evaluation_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  evaluation_id UUID,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'CI_Issue',
  file_path TEXT,
  file_url TEXT,
  description TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_evaluation_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for supplier evaluation documents
CREATE POLICY "Users can view evaluation documents for their companies" 
ON public.supplier_evaluation_documents 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE s.id = supplier_evaluation_documents.supplier_id 
  AND uca.user_id = auth.uid()
));

CREATE POLICY "Users can create evaluation documents for their companies" 
ON public.supplier_evaluation_documents 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE s.id = supplier_evaluation_documents.supplier_id 
  AND uca.user_id = auth.uid()
  AND uca.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update evaluation documents for their companies" 
ON public.supplier_evaluation_documents 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE s.id = supplier_evaluation_documents.supplier_id 
  AND uca.user_id = auth.uid()
  AND uca.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can delete evaluation documents for their companies" 
ON public.supplier_evaluation_documents 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE s.id = supplier_evaluation_documents.supplier_id 
  AND uca.user_id = auth.uid()
  AND uca.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));