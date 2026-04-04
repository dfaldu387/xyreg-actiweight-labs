-- Create system architecture diagrams table
CREATE TABLE public.system_architecture_diagrams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  product_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  diagram_data JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_architecture_diagrams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view diagrams for their companies"
ON public.system_architecture_diagrams
FOR SELECT
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
));

CREATE POLICY "Users can create diagrams for their companies"
ON public.system_architecture_diagrams
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
    AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update diagrams for their companies"
ON public.system_architecture_diagrams
FOR UPDATE
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
  AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can delete diagrams for their companies"
ON public.system_architecture_diagrams
FOR DELETE
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
  AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

-- Add updated_at trigger
CREATE TRIGGER update_system_architecture_diagrams_updated_at
  BEFORE UPDATE ON public.system_architecture_diagrams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_system_architecture_diagrams_company_id ON public.system_architecture_diagrams(company_id);
CREATE INDEX idx_system_architecture_diagrams_product_id ON public.system_architecture_diagrams(product_id);
CREATE INDEX idx_system_architecture_diagrams_created_by ON public.system_architecture_diagrams(created_by);