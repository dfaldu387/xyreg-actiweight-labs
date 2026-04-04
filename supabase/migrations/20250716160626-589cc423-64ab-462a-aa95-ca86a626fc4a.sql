-- Create table for Basic UDI-DI groups
CREATE TABLE public.basic_udi_di_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  basic_udi_di TEXT NOT NULL,
  internal_reference TEXT NOT NULL,
  check_character TEXT NOT NULL,
  issuing_agency TEXT NOT NULL,
  company_prefix TEXT NOT NULL,
  intended_purpose TEXT,
  risk_class TEXT,
  essential_characteristics TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for product assignments to Basic UDI-DI groups
CREATE TABLE public.product_basic_udi_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  basic_udi_di_group_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID,
  UNIQUE(product_id, basic_udi_di_group_id)
);

-- Add foreign key constraints
ALTER TABLE public.basic_udi_di_groups 
ADD CONSTRAINT fk_basic_udi_di_groups_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.product_basic_udi_assignments 
ADD CONSTRAINT fk_product_basic_udi_assignments_product_id 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.product_basic_udi_assignments 
ADD CONSTRAINT fk_product_basic_udi_assignments_basic_udi_di_group_id 
FOREIGN KEY (basic_udi_di_group_id) REFERENCES public.basic_udi_di_groups(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.basic_udi_di_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_basic_udi_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for basic_udi_di_groups
CREATE POLICY "Users can view basic udi di groups for their companies" ON public.basic_udi_di_groups
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create basic udi di groups for their companies" ON public.basic_udi_di_groups
FOR INSERT WITH CHECK (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can update basic udi di groups for their companies" ON public.basic_udi_di_groups
FOR UPDATE USING (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can delete basic udi di groups for their companies" ON public.basic_udi_di_groups
FOR DELETE USING (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  )
);

-- Create RLS policies for product_basic_udi_assignments
CREATE POLICY "Users can view product basic udi assignments for their companies" ON public.product_basic_udi_assignments
FOR SELECT USING (
  product_id IN (
    SELECT p.id FROM products p 
    JOIN user_company_access uca ON uca.company_id = p.company_id 
    WHERE uca.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create product basic udi assignments for their companies" ON public.product_basic_udi_assignments
FOR INSERT WITH CHECK (
  product_id IN (
    SELECT p.id FROM products p 
    JOIN user_company_access uca ON uca.company_id = p.company_id 
    WHERE uca.user_id = auth.uid() 
    AND uca.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can update product basic udi assignments for their companies" ON public.product_basic_udi_assignments
FOR UPDATE USING (
  product_id IN (
    SELECT p.id FROM products p 
    JOIN user_company_access uca ON uca.company_id = p.company_id 
    WHERE uca.user_id = auth.uid() 
    AND uca.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can delete product basic udi assignments for their companies" ON public.product_basic_udi_assignments
FOR DELETE USING (
  product_id IN (
    SELECT p.id FROM products p 
    JOIN user_company_access uca ON uca.company_id = p.company_id 
    WHERE uca.user_id = auth.uid() 
    AND uca.access_level IN ('admin', 'editor')
  )
);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_basic_udi_di_groups_updated_at
  BEFORE UPDATE ON public.basic_udi_di_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_basic_udi_di_groups_company_id ON public.basic_udi_di_groups(company_id);
CREATE INDEX idx_basic_udi_di_groups_basic_udi_di ON public.basic_udi_di_groups(basic_udi_di);
CREATE INDEX idx_product_basic_udi_assignments_product_id ON public.product_basic_udi_assignments(product_id);
CREATE INDEX idx_product_basic_udi_assignments_basic_udi_di_group_id ON public.product_basic_udi_assignments(basic_udi_di_group_id);