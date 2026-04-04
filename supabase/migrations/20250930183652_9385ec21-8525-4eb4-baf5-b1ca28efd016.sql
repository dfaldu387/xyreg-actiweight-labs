-- Create product_group_memberships junction table
CREATE TABLE IF NOT EXISTS public.product_group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  family_group_id UUID NOT NULL REFERENCES public.product_family_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(product_id, family_group_id)
);

-- Enable RLS
ALTER TABLE public.product_group_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view memberships for their companies"
  ON public.product_group_memberships
  FOR SELECT
  USING (
    family_group_id IN (
      SELECT id FROM public.product_family_groups
      WHERE company_id IN (
        SELECT company_id FROM user_company_access
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create memberships for their companies"
  ON public.product_group_memberships
  FOR INSERT
  WITH CHECK (
    family_group_id IN (
      SELECT id FROM public.product_family_groups
      WHERE company_id IN (
        SELECT company_id FROM user_company_access
        WHERE user_id = auth.uid()
        AND access_level IN ('admin', 'editor')
      )
    )
  );

CREATE POLICY "Users can delete memberships for their companies"
  ON public.product_group_memberships
  FOR DELETE
  USING (
    family_group_id IN (
      SELECT id FROM public.product_family_groups
      WHERE company_id IN (
        SELECT company_id FROM user_company_access
        WHERE user_id = auth.uid()
        AND access_level IN ('admin', 'editor')
      )
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_group_memberships_product_id 
  ON public.product_group_memberships(product_id);
CREATE INDEX IF NOT EXISTS idx_product_group_memberships_family_group_id 
  ON public.product_group_memberships(family_group_id);

-- Trigger for updated_at
CREATE TRIGGER set_product_group_memberships_updated_at
  BEFORE UPDATE ON public.product_group_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();