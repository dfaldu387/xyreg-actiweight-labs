-- Create product_udi_di_variants table for tracking different packaging levels
CREATE TABLE public.product_udi_di_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  basic_udi_di_group_id UUID NOT NULL REFERENCES basic_udi_di_groups(id) ON DELETE CASCADE,
  packaging_level TEXT NOT NULL,
  item_reference TEXT NOT NULL,
  package_level_indicator INTEGER NOT NULL DEFAULT 0,
  generated_udi_di TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, packaging_level, item_reference)
);

-- Enable Row Level Security
ALTER TABLE public.product_udi_di_variants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_udi_di_variants
CREATE POLICY "Users can view UDI-DI variants for their company products"
ON public.product_udi_di_variants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = product_udi_di_variants.product_id
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create UDI-DI variants for their company products"
ON public.product_udi_di_variants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = product_udi_di_variants.product_id
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can update UDI-DI variants for their company products"
ON public.product_udi_di_variants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = product_udi_di_variants.product_id
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can delete UDI-DI variants for their company products"
ON public.product_udi_di_variants
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = product_udi_di_variants.product_id
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  )
);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_product_udi_di_variants_updated_at
  BEFORE UPDATE ON public.product_udi_di_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_product_udi_di_variants_product_id ON public.product_udi_di_variants(product_id);
CREATE INDEX idx_product_udi_di_variants_basic_udi_di_group_id ON public.product_udi_di_variants(basic_udi_di_group_id);