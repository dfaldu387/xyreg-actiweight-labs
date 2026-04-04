-- Create product sibling groups table
CREATE TABLE IF NOT EXISTS public.product_sibling_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  basic_udi_di TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  distribution_pattern TEXT DEFAULT 'even' CHECK (distribution_pattern IN ('even', 'gaussian_curve', 'empirical_data')),
  total_percentage NUMERIC(5,2) DEFAULT 100.00,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_product_sibling_groups_company_basic_udi 
ON public.product_sibling_groups(company_id, basic_udi_di);

-- Add sibling_group_id to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sibling_group_id UUID REFERENCES public.product_sibling_groups(id) ON DELETE SET NULL;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_products_sibling_group_id 
ON public.products(sibling_group_id);

-- Enable RLS
ALTER TABLE public.product_sibling_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_sibling_groups
CREATE POLICY "Users can view sibling groups for their companies"
  ON public.product_sibling_groups FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sibling groups for their companies"
  ON public.product_sibling_groups FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update sibling groups for their companies"
  ON public.product_sibling_groups FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can delete sibling groups for their companies"
  ON public.product_sibling_groups FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER set_product_sibling_groups_updated_at
  BEFORE UPDATE ON public.product_sibling_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();