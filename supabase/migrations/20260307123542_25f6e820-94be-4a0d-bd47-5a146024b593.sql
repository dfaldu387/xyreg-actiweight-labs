
-- Create device_components table
CREATE TABLE public.device_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.device_components(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  component_type TEXT NOT NULL DEFAULT 'hardware' CHECK (component_type IN ('hardware', 'software', 'sub_assembly')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create device_component_features junction table
CREATE TABLE public.device_component_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  component_id UUID NOT NULL REFERENCES public.device_components(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(component_id, feature_name)
);

-- Indexes
CREATE INDEX idx_device_components_product_id ON public.device_components(product_id);
CREATE INDEX idx_device_components_company_id ON public.device_components(company_id);
CREATE INDEX idx_device_components_parent_id ON public.device_components(parent_id);
CREATE INDEX idx_device_component_features_component_id ON public.device_component_features(component_id);

-- Updated_at trigger
CREATE TRIGGER set_device_components_updated_at
  BEFORE UPDATE ON public.device_components
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.device_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_component_features ENABLE ROW LEVEL SECURITY;

-- RLS policies for device_components
CREATE POLICY "Users can view device_components in their company"
  ON public.device_components FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert device_components in their company"
  ON public.device_components FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can update device_components in their company"
  ON public.device_components FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete device_components in their company"
  ON public.device_components FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

-- RLS for device_component_features
CREATE POLICY "Users can view device_component_features"
  ON public.device_component_features FOR SELECT TO authenticated
  USING (component_id IN (
    SELECT id FROM public.device_components
    WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can insert device_component_features"
  ON public.device_component_features FOR INSERT TO authenticated
  WITH CHECK (component_id IN (
    SELECT id FROM public.device_components
    WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can delete device_component_features"
  ON public.device_component_features FOR DELETE TO authenticated
  USING (component_id IN (
    SELECT id FROM public.device_components
    WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())
  ));

-- Alter bom_items.component_id from text to UUID with FK
UPDATE public.bom_items SET component_id = NULL WHERE component_id IS NOT NULL;
ALTER TABLE public.bom_items ALTER COLUMN component_id TYPE UUID USING component_id::UUID;
ALTER TABLE public.bom_items ADD CONSTRAINT bom_items_component_id_fkey 
  FOREIGN KEY (component_id) REFERENCES public.device_components(id) ON DELETE SET NULL;

-- Data migration: convert JSONB to rows using DO block
DO $$
DECLARE
  prod RECORD;
  comp_element JSONB;
  comp_name TEXT;
  comp_desc TEXT;
  linked_features JSONB;
  new_comp_id UUID;
  feat_name TEXT;
BEGIN
  FOR prod IN 
    SELECT p.id, p.company_id, p.device_components 
    FROM public.products p
    WHERE p.device_components IS NOT NULL 
      AND p.device_components::text != '[]'
      AND p.device_components::text != 'null'
  LOOP
    FOR comp_element IN SELECT jsonb_array_elements(prod.device_components)
    LOOP
      comp_name := comp_element ->> 'name';
      comp_desc := COALESCE(comp_element ->> 'description', '');
      linked_features := comp_element -> 'linkedFeatureNames';
      
      IF comp_name IS NULL OR comp_name = '' THEN
        CONTINUE;
      END IF;
      
      INSERT INTO public.device_components (product_id, company_id, name, description, component_type)
      VALUES (prod.id, prod.company_id, comp_name, comp_desc, 'hardware')
      ON CONFLICT DO NOTHING
      RETURNING id INTO new_comp_id;
      
      IF new_comp_id IS NOT NULL AND linked_features IS NOT NULL AND jsonb_typeof(linked_features) = 'array' THEN
        FOR feat_name IN SELECT jsonb_array_elements_text(linked_features)
        LOOP
          INSERT INTO public.device_component_features (component_id, feature_name)
          VALUES (new_comp_id, feat_name)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
