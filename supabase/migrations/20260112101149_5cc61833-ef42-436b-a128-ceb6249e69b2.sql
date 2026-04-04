-- Create usability_engineering_files table for IEC 62366-1 UEF documentation
CREATE TABLE public.usability_engineering_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Use Specification (Clause 5.1)
  intended_use TEXT,
  intended_users JSONB DEFAULT '[]'::jsonb, -- [{profile, characteristics, training_level}]
  use_environments JSONB DEFAULT '[]'::jsonb, -- [{environment, conditions}]
  operating_principle TEXT,
  
  -- UI Characteristics (Clause 5.2)
  ui_characteristics JSONB DEFAULT '[]'::jsonb, -- [{feature, safety_relevance, description}]
  
  -- Evaluation Plan (Clause 5.5)
  formative_plan TEXT,
  summative_plan TEXT,
  
  -- UI Specification (Clause 5.6)
  ui_specification TEXT,
  accompanying_documents TEXT,
  
  -- Metadata
  status VARCHAR(50) DEFAULT 'draft',
  version VARCHAR(20) DEFAULT '1.0',
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure one UEF per product
  UNIQUE(product_id)
);

-- Enable RLS
ALTER TABLE public.usability_engineering_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view UEF for their company products"
  ON public.usability_engineering_files FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create UEF for their company products"
  ON public.usability_engineering_files FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update UEF for their company products"
  ON public.usability_engineering_files FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete UEF for their company products"
  ON public.usability_engineering_files FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
  ));

-- Create updated_at trigger
CREATE TRIGGER update_usability_engineering_files_updated_at
  BEFORE UPDATE ON public.usability_engineering_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_uef_product_id ON public.usability_engineering_files(product_id);
CREATE INDEX idx_uef_company_id ON public.usability_engineering_files(company_id);