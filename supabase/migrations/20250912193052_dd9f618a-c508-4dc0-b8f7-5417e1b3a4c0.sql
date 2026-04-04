-- Create material_suppliers table to link materials to suppliers
CREATE TABLE public.material_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  material_specification TEXT,
  inspection_requirements TEXT,
  supplier_part_number TEXT,
  lead_time_days INTEGER,
  minimum_order_quantity INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(material_id, supplier_id)
);

-- Enable RLS
ALTER TABLE public.material_suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view material suppliers for their companies"
ON public.material_suppliers
FOR SELECT
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
));

CREATE POLICY "Users can create material suppliers for their companies"
ON public.material_suppliers
FOR INSERT
WITH CHECK (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
  AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update material suppliers for their companies"
ON public.material_suppliers
FOR UPDATE
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
  AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can delete material suppliers for their companies"
ON public.material_suppliers
FOR DELETE
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
  AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

-- Create updated_at trigger
CREATE TRIGGER update_material_suppliers_updated_at
  BEFORE UPDATE ON public.material_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();