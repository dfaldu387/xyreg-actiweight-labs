-- Create sibling_group_relationships table for modeling commercial relationships between sibling groups
CREATE TABLE IF NOT EXISTS public.sibling_group_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  main_sibling_group_id UUID NOT NULL REFERENCES public.product_sibling_groups(id) ON DELETE CASCADE,
  accessory_sibling_group_id UUID NOT NULL REFERENCES public.product_sibling_groups(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'accessory' CHECK (relationship_type IN ('accessory', 'bundle_item', 'cross_sell', 'upsell')),
  revenue_attribution_percentage NUMERIC(5,2) DEFAULT 0.00 CHECK (revenue_attribution_percentage >= 0 AND revenue_attribution_percentage <= 100),
  initial_multiplier NUMERIC(10,3) DEFAULT 1.000 CHECK (initial_multiplier >= 0),
  recurring_multiplier NUMERIC(10,3) DEFAULT 1.000 CHECK (recurring_multiplier >= 0),
  recurring_period TEXT DEFAULT 'monthly' CHECK (recurring_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  lifecycle_duration_months INTEGER DEFAULT 12 CHECK (lifecycle_duration_months > 0),
  seasonality_factors JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_group_relationship UNIQUE (company_id, main_sibling_group_id, accessory_sibling_group_id)
);

-- Add RLS policies
ALTER TABLE public.sibling_group_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sibling group relationships for their companies"
  ON public.sibling_group_relationships FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sibling group relationships for their companies"
  ON public.sibling_group_relationships FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update sibling group relationships for their companies"
  ON public.sibling_group_relationships FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can delete sibling group relationships for their companies"
  ON public.sibling_group_relationships FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

-- Add indexes for performance
CREATE INDEX idx_sibling_group_relationships_company ON public.sibling_group_relationships(company_id);
CREATE INDEX idx_sibling_group_relationships_main_group ON public.sibling_group_relationships(main_sibling_group_id);
CREATE INDEX idx_sibling_group_relationships_accessory_group ON public.sibling_group_relationships(accessory_sibling_group_id);

-- Add trigger for updated_at
CREATE TRIGGER update_sibling_group_relationships_updated_at
  BEFORE UPDATE ON public.sibling_group_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();