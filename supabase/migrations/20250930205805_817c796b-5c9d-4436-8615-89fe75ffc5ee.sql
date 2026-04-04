-- Create product variant groups table
CREATE TABLE IF NOT EXISTS public.product_variant_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  distribution_pattern TEXT NOT NULL DEFAULT 'even' CHECK (distribution_pattern IN ('even', 'gaussian_curve', 'empirical_data')),
  total_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (total_percentage >= 0 AND total_percentage <= 100),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add group_id to product_variant_distribution_settings
ALTER TABLE public.product_variant_distribution_settings
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.product_variant_groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS group_position INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.product_variant_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_variant_groups
CREATE POLICY "Users can view variant groups for their companies"
ON public.product_variant_groups FOR SELECT
USING (company_id IN (
  SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create variant groups for their companies"
ON public.product_variant_groups FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update variant groups for their companies"
ON public.product_variant_groups FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete variant groups for their companies"
ON public.product_variant_groups FOR DELETE
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_variant_groups_product_id ON public.product_variant_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_groups_company_id ON public.product_variant_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_variant_distribution_settings_group_id ON public.product_variant_distribution_settings(group_id);