-- Create a comprehensive table for storing document studio data
CREATE TABLE IF NOT EXISTS public.document_studio_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  product_id UUID NULL,
  template_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  product_context JSONB NULL,
  document_control JSONB NULL,
  revision_history JSONB NULL DEFAULT '[]'::jsonb,
  associated_documents JSONB NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  smart_data JSONB NULL,
  role_mappings JSONB NULL DEFAULT '[]'::jsonb,
  notes JSONB NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NULL,
  last_edited_by UUID NULL
);

-- Enable RLS
ALTER TABLE public.document_studio_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Users can view document studio templates for their companies"
  ON public.document_studio_templates FOR SELECT
  USING (company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
  ));

CREATE POLICY "Users can create document studio templates for their companies"
  ON public.document_studio_templates FOR INSERT
  WITH CHECK (company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
    AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  ));

CREATE POLICY "Users can update document studio templates for their companies"
  ON public.document_studio_templates FOR UPDATE
  USING (company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
    AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  ));

CREATE POLICY "Users can delete document studio templates for their companies"
  ON public.document_studio_templates FOR DELETE
  USING (company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
    AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_document_studio_templates_updated_at
  BEFORE UPDATE ON public.document_studio_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_document_studio_templates_company_id ON public.document_studio_templates(company_id);
CREATE INDEX idx_document_studio_templates_product_id ON public.document_studio_templates(product_id);
CREATE INDEX idx_document_studio_templates_template_id ON public.document_studio_templates(template_id);
CREATE INDEX idx_document_studio_templates_company_template ON public.document_studio_templates(company_id, template_id);