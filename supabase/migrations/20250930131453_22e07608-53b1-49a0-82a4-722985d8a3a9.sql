-- Add missing columns to traceability_links
ALTER TABLE public.traceability_links 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.traceability_links 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing rows to set product_id if NULL (will need manual update based on company context)
-- For now, we'll just ensure the column exists

-- Create system_requirements table
CREATE TABLE IF NOT EXISTS public.system_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  product_id UUID NOT NULL,
  requirement_id TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'Draft',
  verification_method TEXT,
  priority TEXT DEFAULT 'Medium',
  acceptance_criteria TEXT,
  rationale TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_system_req_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_system_req_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT fk_system_req_creator FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT unique_system_req UNIQUE (product_id, requirement_id)
);

-- Create software_requirements table
CREATE TABLE IF NOT EXISTS public.software_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  product_id UUID NOT NULL,
  requirement_id TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'Draft',
  safety_classification TEXT,
  verification_method TEXT,
  priority TEXT DEFAULT 'Medium',
  acceptance_criteria TEXT,
  rationale TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_software_req_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_software_req_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT fk_software_req_creator FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT unique_software_req UNIQUE (product_id, requirement_id)
);

-- Create hardware_requirements table
CREATE TABLE IF NOT EXISTS public.hardware_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  product_id UUID NOT NULL,
  requirement_id TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'Draft',
  verification_method TEXT,
  priority TEXT DEFAULT 'Medium',
  acceptance_criteria TEXT,
  rationale TEXT,
  material_specifications TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_hardware_req_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_hardware_req_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT fk_hardware_req_creator FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT unique_hardware_req UNIQUE (product_id, requirement_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_system_req_product ON public.system_requirements(product_id);
CREATE INDEX IF NOT EXISTS idx_system_req_company ON public.system_requirements(company_id);
CREATE INDEX IF NOT EXISTS idx_software_req_product ON public.software_requirements(product_id);
CREATE INDEX IF NOT EXISTS idx_software_req_company ON public.software_requirements(company_id);
CREATE INDEX IF NOT EXISTS idx_hardware_req_product ON public.hardware_requirements(product_id);
CREATE INDEX IF NOT EXISTS idx_hardware_req_company ON public.hardware_requirements(company_id);
CREATE INDEX IF NOT EXISTS idx_trace_link_product ON public.traceability_links(product_id);
CREATE INDEX IF NOT EXISTS idx_trace_link_source ON public.traceability_links(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_trace_link_target ON public.traceability_links(target_type, target_id);

-- Add updated_at triggers
DROP TRIGGER IF EXISTS set_system_requirements_updated_at ON public.system_requirements;
CREATE TRIGGER set_system_requirements_updated_at
  BEFORE UPDATE ON public.system_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_software_requirements_updated_at ON public.software_requirements;
CREATE TRIGGER set_software_requirements_updated_at
  BEFORE UPDATE ON public.software_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_hardware_requirements_updated_at ON public.hardware_requirements;
CREATE TRIGGER set_hardware_requirements_updated_at
  BEFORE UPDATE ON public.hardware_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_traceability_links_updated_at ON public.traceability_links;
CREATE TRIGGER set_traceability_links_updated_at
  BEFORE UPDATE ON public.traceability_links
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.system_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware_requirements ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view system requirements for their companies" ON public.system_requirements;
CREATE POLICY "Users can view system requirements for their companies"
  ON public.system_requirements FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create system requirements for their companies" ON public.system_requirements;
CREATE POLICY "Users can create system requirements for their companies"
  ON public.system_requirements FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')));

DROP POLICY IF EXISTS "Users can update system requirements for their companies" ON public.system_requirements;
CREATE POLICY "Users can update system requirements for their companies"
  ON public.system_requirements FOR UPDATE
  USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')));

DROP POLICY IF EXISTS "Users can delete system requirements for their companies" ON public.system_requirements;
CREATE POLICY "Users can delete system requirements for their companies"
  ON public.system_requirements FOR DELETE
  USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')));

-- Policies for software_requirements
DROP POLICY IF EXISTS "Users can view software requirements for their companies" ON public.software_requirements;
CREATE POLICY "Users can view software requirements for their companies"
  ON public.software_requirements FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create software requirements for their companies" ON public.software_requirements;
CREATE POLICY "Users can create software requirements for their companies"
  ON public.software_requirements FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')));

DROP POLICY IF EXISTS "Users can update software requirements for their companies" ON public.software_requirements;
CREATE POLICY "Users can update software requirements for their companies"
  ON public.software_requirements FOR UPDATE
  USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')));

DROP POLICY IF EXISTS "Users can delete software requirements for their companies" ON public.software_requirements;
CREATE POLICY "Users can delete software requirements for their companies"
  ON public.software_requirements FOR DELETE
  USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')));

-- Policies for hardware_requirements
DROP POLICY IF EXISTS "Users can view hardware requirements for their companies" ON public.hardware_requirements;
CREATE POLICY "Users can view hardware requirements for their companies"
  ON public.hardware_requirements FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create hardware requirements for their companies" ON public.hardware_requirements;
CREATE POLICY "Users can create hardware requirements for their companies"
  ON public.hardware_requirements FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')));

DROP POLICY IF EXISTS "Users can update hardware requirements for their companies" ON public.hardware_requirements;
CREATE POLICY "Users can update hardware requirements for their companies"
  ON public.hardware_requirements FOR UPDATE
  USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')));

DROP POLICY IF EXISTS "Users can delete hardware requirements for their companies" ON public.hardware_requirements;
CREATE POLICY "Users can delete hardware requirements for their companies"
  ON public.hardware_requirements FOR DELETE
  USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')));

-- Update traceability_links policies
DROP POLICY IF EXISTS "Users can view traceability links for their companies" ON public.traceability_links;
CREATE POLICY "Users can view traceability links for their companies"
  ON public.traceability_links FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create traceability links for their companies" ON public.traceability_links;
CREATE POLICY "Users can create traceability links for their companies"
  ON public.traceability_links FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')));

DROP POLICY IF EXISTS "Users can update traceability links for their companies" ON public.traceability_links;
CREATE POLICY "Users can update traceability links for their companies"
  ON public.traceability_links FOR UPDATE
  USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')));

DROP POLICY IF EXISTS "Users can delete traceability links for their companies" ON public.traceability_links;
CREATE POLICY "Users can delete traceability links for their companies"
  ON public.traceability_links FOR DELETE
  USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')));