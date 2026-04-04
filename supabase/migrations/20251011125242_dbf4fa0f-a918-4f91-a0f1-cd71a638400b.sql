-- Create document_versions table for version history
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  change_notes TEXT,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_is_current ON public.document_versions(is_current) WHERE is_current = true;

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_versions
CREATE POLICY "Users can view document versions for accessible companies"
  ON public.document_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.user_company_access uca ON uca.company_id = d.company_id
      WHERE d.id = document_versions.document_id
        AND uca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create document versions for accessible companies"
  ON public.document_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.user_company_access uca ON uca.company_id = d.company_id
      WHERE d.id = document_versions.document_id
        AND uca.user_id = auth.uid()
        AND uca.access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update document versions for accessible companies"
  ON public.document_versions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.user_company_access uca ON uca.company_id = d.company_id
      WHERE d.id = document_versions.document_id
        AND uca.user_id = auth.uid()
        AND uca.access_level IN ('admin', 'editor')
    )
  );

-- Add current_version_id to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS current_version_id UUID REFERENCES public.document_versions(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_documents_current_version_id ON public.documents(current_version_id);

-- Create similar structure for phase_assigned_document_template
CREATE TABLE IF NOT EXISTS public.phase_document_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_assignment_id UUID NOT NULL REFERENCES public.phase_assigned_document_template(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  change_notes TEXT,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(template_assignment_id, version_number)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_phase_doc_template_versions_template_id ON public.phase_document_template_versions(template_assignment_id);
CREATE INDEX IF NOT EXISTS idx_phase_doc_template_versions_is_current ON public.phase_document_template_versions(is_current) WHERE is_current = true;

-- Enable RLS
ALTER TABLE public.phase_document_template_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phase_document_template_versions - simpler policy for phase templates
CREATE POLICY "Authenticated users can view phase document template versions"
  ON public.phase_document_template_versions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create phase document template versions"
  ON public.phase_document_template_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update phase document template versions"
  ON public.phase_document_template_versions
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add current_version_id to phase_assigned_document_template table
ALTER TABLE public.phase_assigned_document_template 
ADD COLUMN IF NOT EXISTS current_version_id UUID REFERENCES public.phase_document_template_versions(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_phase_doc_template_current_version_id ON public.phase_assigned_document_template(current_version_id);