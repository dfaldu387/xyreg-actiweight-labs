-- Create supplier management tables for ISO 13485 compliance

-- Main suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Probationary' CHECK (status IN ('Approved', 'Probationary', 'Disqualified')),
  criticality TEXT NOT NULL DEFAULT 'Non-Critical' CHECK (criticality IN ('Critical', 'Non-Critical')),
  scope_of_supply TEXT,
  contact_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Supplier evaluations for compliance tracking
CREATE TABLE IF NOT EXISTS public.supplier_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  evaluation_date DATE DEFAULT now(),
  checklist_results JSONB DEFAULT '{}',
  evaluator_id UUID,
  status TEXT NOT NULL DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Completed', 'Approved')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Product-supplier relationships 
CREATE TABLE IF NOT EXISTS public.product_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  component_name TEXT NOT NULL,
  inspection_requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, supplier_id, component_name)
);

-- Supplier certifications with expiry tracking
CREATE TABLE IF NOT EXISTS public.supplier_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  cert_type TEXT NOT NULL,
  cert_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Performance logs
CREATE TABLE IF NOT EXISTS public.supplier_performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  log_date DATE DEFAULT now(),
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  logged_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_performance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers table
CREATE POLICY "Users can view suppliers for their companies" 
ON public.suppliers FOR SELECT 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
));

CREATE POLICY "Users can create suppliers for their companies" 
ON public.suppliers FOR INSERT 
WITH CHECK (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update suppliers for their companies" 
ON public.suppliers FOR UPDATE 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can delete suppliers for their companies" 
ON public.suppliers FOR DELETE 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

-- RLS Policies for supplier_evaluations table
CREATE POLICY "Users can view evaluations for accessible suppliers" 
ON public.supplier_evaluations FOR SELECT 
USING (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid()
));

CREATE POLICY "Users can create evaluations for accessible suppliers" 
ON public.supplier_evaluations FOR INSERT 
WITH CHECK (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid() 
  AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update evaluations for accessible suppliers" 
ON public.supplier_evaluations FOR UPDATE 
USING (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid() 
  AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can delete evaluations for accessible suppliers" 
ON public.supplier_evaluations FOR DELETE 
USING (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid() 
  AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

-- RLS Policies for product_suppliers table  
CREATE POLICY "Users can view product suppliers for accessible products" 
ON public.product_suppliers FOR SELECT 
USING (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid()
));

CREATE POLICY "Users can create product suppliers for accessible products" 
ON public.product_suppliers FOR INSERT 
WITH CHECK (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid() 
  AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update product suppliers for accessible products" 
ON public.product_suppliers FOR UPDATE 
USING (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid() 
  AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can delete product suppliers for accessible products" 
ON public.product_suppliers FOR DELETE 
USING (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid() 
  AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

-- RLS Policies for supplier_certifications table
CREATE POLICY "Users can view certifications for accessible suppliers" 
ON public.supplier_certifications FOR SELECT 
USING (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid()
));

CREATE POLICY "Users can create certifications for accessible suppliers" 
ON public.supplier_certifications FOR INSERT 
WITH CHECK (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid() 
  AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update certifications for accessible suppliers" 
ON public.supplier_certifications FOR UPDATE 
USING (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid() 
  AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can delete certifications for accessible suppliers" 
ON public.supplier_certifications FOR DELETE 
USING (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid() 
  AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

-- RLS Policies for supplier_performance_logs table
CREATE POLICY "Users can view performance logs for accessible suppliers" 
ON public.supplier_performance_logs FOR SELECT 
USING (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid()
));

CREATE POLICY "Users can create performance logs for accessible suppliers" 
ON public.supplier_performance_logs FOR INSERT 
WITH CHECK (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid() 
  AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update performance logs for accessible suppliers" 
ON public.supplier_performance_logs FOR UPDATE 
USING (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid() 
  AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can delete performance logs for accessible suppliers" 
ON public.supplier_performance_logs FOR DELETE 
USING (supplier_id IN (
  SELECT s.id FROM public.suppliers s
  JOIN user_company_access uca ON uca.company_id = s.company_id
  WHERE uca.user_id = auth.uid() 
  AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_company_id ON public.suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_supplier_evaluations_supplier_id ON public.supplier_evaluations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_product_id ON public.product_suppliers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_supplier_id ON public.product_suppliers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_certifications_supplier_id ON public.supplier_certifications(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_certifications_expiry_date ON public.supplier_certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_supplier_performance_logs_supplier_id ON public.supplier_performance_logs(supplier_id);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at 
BEFORE UPDATE ON public.suppliers 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_evaluations_updated_at 
BEFORE UPDATE ON public.supplier_evaluations 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_suppliers_updated_at 
BEFORE UPDATE ON public.product_suppliers 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_certifications_updated_at 
BEFORE UPDATE ON public.supplier_certifications 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();