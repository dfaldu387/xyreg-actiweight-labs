-- Create product_bundles table
CREATE TABLE IF NOT EXISTS public.product_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bundle_name TEXT NOT NULL,
  description TEXT,
  created_by_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_bundle_members table
CREATE TABLE IF NOT EXISTS public.product_bundle_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.product_bundles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  sibling_group_id UUID REFERENCES public.product_sibling_groups(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('component', 'accessory', 'consumable', 'required', 'optional', 'replacement_part')),
  multiplier NUMERIC DEFAULT 1,
  quantity NUMERIC,
  is_primary BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT member_type_check CHECK (
    (product_id IS NOT NULL AND sibling_group_id IS NULL) OR 
    (product_id IS NULL AND sibling_group_id IS NOT NULL)
  ),
  CONSTRAINT unique_product_in_bundle UNIQUE NULLS NOT DISTINCT (bundle_id, product_id),
  CONSTRAINT unique_sibling_group_in_bundle UNIQUE NULLS NOT DISTINCT (bundle_id, sibling_group_id)
);

-- Create indexes for performance
CREATE INDEX idx_product_bundles_company_id ON public.product_bundles(company_id);
CREATE INDEX idx_product_bundles_created_by ON public.product_bundles(created_by_product_id);
CREATE INDEX idx_product_bundle_members_bundle_id ON public.product_bundle_members(bundle_id);
CREATE INDEX idx_product_bundle_members_product_id ON public.product_bundle_members(product_id);
CREATE INDEX idx_product_bundle_members_sibling_group_id ON public.product_bundle_members(sibling_group_id);

-- Enable Row Level Security
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_bundle_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_bundles
CREATE POLICY "Users can view bundles for their company"
  ON public.product_bundles
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bundles for their company"
  ON public.product_bundles
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_company_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update bundles for their company"
  ON public.product_bundles
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete bundles for their company"
  ON public.product_bundles
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for product_bundle_members
CREATE POLICY "Users can view bundle members for their company"
  ON public.product_bundle_members
  FOR SELECT
  USING (
    bundle_id IN (
      SELECT id FROM public.product_bundles
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_access
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create bundle members for their company"
  ON public.product_bundle_members
  FOR INSERT
  WITH CHECK (
    bundle_id IN (
      SELECT id FROM public.product_bundles
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_access
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update bundle members for their company"
  ON public.product_bundle_members
  FOR UPDATE
  USING (
    bundle_id IN (
      SELECT id FROM public.product_bundles
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_access
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete bundle members for their company"
  ON public.product_bundle_members
  FOR DELETE
  USING (
    bundle_id IN (
      SELECT id FROM public.product_bundles
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_access
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_product_bundles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_bundles_updated_at
  BEFORE UPDATE ON public.product_bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_product_bundles_updated_at();