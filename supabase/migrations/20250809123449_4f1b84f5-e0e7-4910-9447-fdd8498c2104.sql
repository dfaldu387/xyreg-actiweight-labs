-- Product Portfolio Structure and Product Variations (retry without IF NOT EXISTS on policies)

-- 1) Variation dimensions per company
CREATE TABLE IF NOT EXISTS public.product_variation_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_dimension_company_name UNIQUE (company_id, name)
);

-- 2) Options per dimension
CREATE TABLE IF NOT EXISTS public.product_variation_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  dimension_id uuid NOT NULL REFERENCES public.product_variation_dimensions(id) ON DELETE CASCADE,
  name text NOT NULL,
  value_key text,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_option_dimension_name UNIQUE (dimension_id, name)
);

-- 3) Product variants (a concrete combination for a product)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_product_variant_name UNIQUE (product_id, name)
);

-- 4) Values chosen for each variant across dimensions
CREATE TABLE IF NOT EXISTS public.product_variant_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  dimension_id uuid NOT NULL REFERENCES public.product_variation_dimensions(id) ON DELETE CASCADE,
  option_id uuid REFERENCES public.product_variation_options(id) ON DELETE SET NULL,
  value_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_variant_dimension UNIQUE (product_variant_id, dimension_id)
);

-- Triggers to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_variation_dimensions_updated_at'
  ) THEN
    CREATE TRIGGER update_product_variation_dimensions_updated_at
      BEFORE UPDATE ON public.product_variation_dimensions
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_variation_options_updated_at'
  ) THEN
    CREATE TRIGGER update_product_variation_options_updated_at
      BEFORE UPDATE ON public.product_variation_options
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_variants_updated_at'
  ) THEN
    CREATE TRIGGER update_product_variants_updated_at
      BEFORE UPDATE ON public.product_variants
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_variant_values_updated_at'
  ) THEN
    CREATE TRIGGER update_product_variant_values_updated_at
      BEFORE UPDATE ON public.product_variant_values
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_variation_dimensions_company ON public.product_variation_dimensions(company_id);
CREATE INDEX IF NOT EXISTS idx_variation_options_dimension ON public.product_variation_options(dimension_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_values_variant ON public.product_variant_values(product_variant_id);

-- Enable RLS
ALTER TABLE public.product_variation_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variation_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_values ENABLE ROW LEVEL SECURITY;

-- RLS policies for company-scoped tables
-- Dimensions
CREATE POLICY product_variation_dimensions_select ON public.product_variation_dimensions
  FOR SELECT USING (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  );

CREATE POLICY product_variation_dimensions_insert ON public.product_variation_dimensions
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca 
      WHERE uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  );

CREATE POLICY product_variation_dimensions_update ON public.product_variation_dimensions
  FOR UPDATE USING (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca 
      WHERE uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  );

CREATE POLICY product_variation_dimensions_delete ON public.product_variation_dimensions
  FOR DELETE USING (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca 
      WHERE uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  );

-- Options (also company scoped)
CREATE POLICY product_variation_options_select ON public.product_variation_options
  FOR SELECT USING (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  );

CREATE POLICY product_variation_options_insert ON public.product_variation_options
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca 
      WHERE uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  );

CREATE POLICY product_variation_options_update ON public.product_variation_options
  FOR UPDATE USING (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca 
      WHERE uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  );

CREATE POLICY product_variation_options_delete ON public.product_variation_options
  FOR DELETE USING (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca 
      WHERE uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  );

-- Product variants (scoped via product's company)
CREATE POLICY product_variants_select ON public.product_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p 
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE p.id = product_id AND uca.user_id = auth.uid()
    )
  );

CREATE POLICY product_variants_insert ON public.product_variants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p 
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE p.id = product_id AND uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  );

CREATE POLICY product_variants_update ON public.product_variants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products p 
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE p.id = product_id AND uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  );

CREATE POLICY product_variants_delete ON public.product_variants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products p 
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE p.id = product_id AND uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  );

-- Product variant values (scoped via variant)
CREATE POLICY product_variant_values_select ON public.product_variant_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.product_variants v
      JOIN public.products p ON p.id = v.product_id
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE v.id = product_variant_id AND uca.user_id = auth.uid()
    )
  );

CREATE POLICY product_variant_values_insert ON public.product_variant_values
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product_variants v
      JOIN public.products p ON p.id = v.product_id
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE v.id = product_variant_id AND uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  );

CREATE POLICY product_variant_values_update ON public.product_variant_values
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.product_variants v
      JOIN public.products p ON p.id = v.product_id
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE v.id = product_variant_id AND uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  );

CREATE POLICY product_variant_values_delete ON public.product_variant_values
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.product_variants v
      JOIN public.products p ON p.id = v.product_id
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE v.id = product_variant_id AND uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  );
