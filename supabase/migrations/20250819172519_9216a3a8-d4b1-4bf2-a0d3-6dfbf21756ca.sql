-- Add file storage columns to company_document_templates table
ALTER TABLE public.company_document_templates 
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS public_url TEXT,
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- Add file storage columns to phase_assigned_document_template table
ALTER TABLE public.phase_assigned_document_template 
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS public_url TEXT,
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- Create index for better file query performance
CREATE INDEX IF NOT EXISTS idx_company_document_templates_file_path ON public.company_document_templates(file_path) WHERE file_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_phase_assigned_document_template_file_path ON public.phase_assigned_document_template(file_path) WHERE file_path IS NOT NULL;