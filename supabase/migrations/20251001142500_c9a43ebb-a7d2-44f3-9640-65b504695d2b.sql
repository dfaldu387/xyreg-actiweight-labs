-- Create table to store product architecture layouts
CREATE TABLE IF NOT EXISTS public.product_architecture_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Architecture',
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_architecture_layouts ENABLE ROW LEVEL SECURITY;

-- Policies for product_architecture_layouts
CREATE POLICY "Users can view architecture layouts for their companies"
  ON public.product_architecture_layouts
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create architecture layouts for their companies"
  ON public.product_architecture_layouts
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update architecture layouts for their companies"
  ON public.product_architecture_layouts
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can delete architecture layouts for their companies"
  ON public.product_architecture_layouts
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_product_architecture_layouts_company_id 
  ON public.product_architecture_layouts(company_id);

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at_product_architecture_layouts
  BEFORE UPDATE ON public.product_architecture_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();