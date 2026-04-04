-- Create table for product-to-sibling-group relationships
-- This allows linking a main product to an accessory sibling group
CREATE TABLE IF NOT EXISTS public.product_sibling_group_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  main_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  accessory_sibling_group_id UUID NOT NULL REFERENCES public.product_sibling_groups(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'accessory',
  revenue_attribution_percentage NUMERIC(5,2) DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  typical_quantity INTEGER DEFAULT 1,
  initial_multiplier NUMERIC(10,3) DEFAULT 1.0,
  recurring_multiplier NUMERIC(10,3) DEFAULT 1.0,
  recurring_period TEXT DEFAULT 'monthly',
  lifecycle_duration_months INTEGER DEFAULT 12,
  seasonality_factors JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(main_product_id, accessory_sibling_group_id)
);

-- Add RLS policies
ALTER TABLE public.product_sibling_group_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view product sibling group relationships for their companies"
  ON public.product_sibling_group_relationships
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create product sibling group relationships for their companies"
  ON public.product_sibling_group_relationships
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update product sibling group relationships for their companies"
  ON public.product_sibling_group_relationships
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can delete product sibling group relationships for their companies"
  ON public.product_sibling_group_relationships
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER set_product_sibling_group_relationships_updated_at
  BEFORE UPDATE ON public.product_sibling_group_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();