-- Create document_control_assignments table
CREATE TABLE IF NOT EXISTS public.document_control_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  control_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(document_id, company_id)
);

-- Enable RLS
ALTER TABLE public.document_control_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_control_assignments
CREATE POLICY "Users can view document control for their companies"
  ON public.document_control_assignments
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create document control for their companies"
  ON public.document_control_assignments
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update document control for their companies"
  ON public.document_control_assignments
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can delete document control for their companies"
  ON public.document_control_assignments
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_document_control_assignments_document_company 
  ON public.document_control_assignments(document_id, company_id);

CREATE INDEX idx_document_control_assignments_company 
  ON public.document_control_assignments(company_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_document_control_assignments_updated_at
  BEFORE UPDATE ON public.document_control_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();