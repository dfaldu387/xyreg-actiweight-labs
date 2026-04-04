
-- Create reference_documents table
CREATE TABLE public.reference_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  tags TEXT[] DEFAULT '{}',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reference_documents ENABLE ROW LEVEL SECURITY;

-- Create security definer function for company access check
CREATE OR REPLACE FUNCTION public.user_has_company_access_ref(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_company_access
    WHERE user_id = auth.uid()
      AND company_id = p_company_id
  );
$$;

-- RLS policies
CREATE POLICY "Users can view reference documents for their company"
ON public.reference_documents FOR SELECT
USING (public.user_has_company_access_ref(company_id));

CREATE POLICY "Users can insert reference documents for their company"
ON public.reference_documents FOR INSERT
WITH CHECK (public.user_has_company_access_ref(company_id));

CREATE POLICY "Users can update reference documents for their company"
ON public.reference_documents FOR UPDATE
USING (public.user_has_company_access_ref(company_id));

CREATE POLICY "Users can delete reference documents for their company"
ON public.reference_documents FOR DELETE
USING (public.user_has_company_access_ref(company_id));

-- Timestamp trigger
CREATE TRIGGER update_reference_documents_updated_at
BEFORE UPDATE ON public.reference_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('reference-documents', 'reference-documents', false);

-- Storage policies
CREATE POLICY "Users can upload reference documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reference-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view reference documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'reference-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete reference documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'reference-documents' AND auth.role() = 'authenticated');
