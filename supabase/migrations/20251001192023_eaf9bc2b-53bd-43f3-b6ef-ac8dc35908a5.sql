-- Create sibling_group_product_relationships table (reverse of product_sibling_group_relationships)
CREATE TABLE IF NOT EXISTS public.sibling_group_product_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  main_sibling_group_id UUID NOT NULL,
  accessory_product_id UUID NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'accessory',
  revenue_attribution_percentage NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  is_required BOOLEAN NOT NULL DEFAULT true,
  typical_quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  initial_multiplier NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  recurring_multiplier NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  recurring_period TEXT NOT NULL DEFAULT 'monthly',
  lifecycle_duration_months INTEGER NOT NULL DEFAULT 12,
  seasonality_factors JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sibling_group_product_unique UNIQUE (company_id, main_sibling_group_id, accessory_product_id)
);

-- Enable RLS
ALTER TABLE public.sibling_group_product_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view sibling group product relationships for their companies"
  ON public.sibling_group_product_relationships
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sibling group product relationships for their companies"
  ON public.sibling_group_product_relationships
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update sibling group product relationships for their companies"
  ON public.sibling_group_product_relationships
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can delete sibling group product relationships for their companies"
  ON public.sibling_group_product_relationships
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.sibling_group_product_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();