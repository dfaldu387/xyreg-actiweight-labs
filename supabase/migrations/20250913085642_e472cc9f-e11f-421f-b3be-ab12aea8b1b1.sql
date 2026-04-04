-- Add platform profile fields to company_platforms table
ALTER TABLE public.company_platforms 
ADD COLUMN IF NOT EXISTS version text DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'In Development',
ADD COLUMN IF NOT EXISTS core_documents jsonb DEFAULT '[]'::jsonb;

-- Create platform_documents junction table for linking platforms to documents
CREATE TABLE IF NOT EXISTS public.platform_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_id uuid NOT NULL REFERENCES public.company_platforms(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  document_category text DEFAULT 'General',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(platform_id, document_id)
);

-- Enable RLS on platform_documents
ALTER TABLE public.platform_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for platform_documents
CREATE POLICY "Users can view platform documents for their companies" 
ON public.platform_documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.company_platforms cp 
    JOIN public.user_company_access uca ON uca.company_id = cp.company_id 
    WHERE cp.id = platform_documents.platform_id 
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create platform documents for their companies" 
ON public.platform_documents 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_platforms cp 
    JOIN public.user_company_access uca ON uca.company_id = cp.company_id 
    WHERE cp.id = platform_documents.platform_id 
    AND uca.user_id = auth.uid() 
    AND uca.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can update platform documents for their companies" 
ON public.platform_documents 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.company_platforms cp 
    JOIN public.user_company_access uca ON uca.company_id = cp.company_id 
    WHERE cp.id = platform_documents.platform_id 
    AND uca.user_id = auth.uid() 
    AND uca.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can delete platform documents for their companies" 
ON public.platform_documents 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.company_platforms cp 
    JOIN public.user_company_access uca ON uca.company_id = cp.company_id 
    WHERE cp.id = platform_documents.platform_id 
    AND uca.user_id = auth.uid() 
    AND uca.access_level IN ('admin', 'editor')
  )
);

-- Add platform_id to documents table for optional reference
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS platform_id uuid REFERENCES public.company_platforms(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_platform_documents_platform_id ON public.platform_documents(platform_id);
CREATE INDEX IF NOT EXISTS idx_platform_documents_document_id ON public.platform_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_documents_platform_id ON public.documents(platform_id);