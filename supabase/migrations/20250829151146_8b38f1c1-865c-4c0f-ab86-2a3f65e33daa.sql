-- Create enum types for risk levels and mitigation types
CREATE TYPE risk_level AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE mitigation_type AS ENUM ('Design Control', 'Protective Measure', 'Information for Safety');

-- Create hazards table
CREATE TABLE public.hazards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hazard_id TEXT NOT NULL,
  product_id UUID NOT NULL,
  company_id UUID NOT NULL,
  description TEXT NOT NULL,
  linked_requirements TEXT DEFAULT '',
  initial_risk risk_level NOT NULL,
  mitigation_measure TEXT NOT NULL,
  mitigation_type mitigation_type NOT NULL,
  mitigation_link TEXT DEFAULT '',
  residual_risk risk_level NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.hazards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view hazards for their companies" 
ON public.hazards 
FOR SELECT 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
));

CREATE POLICY "Users can create hazards for their companies" 
ON public.hazards 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update hazards for their companies" 
ON public.hazards 
FOR UPDATE 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can delete hazards for their companies" 
ON public.hazards 
FOR DELETE 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

-- Create indexes for performance
CREATE INDEX idx_hazards_product_id ON public.hazards (product_id);
CREATE INDEX idx_hazards_company_id ON public.hazards (company_id);
CREATE UNIQUE INDEX idx_hazards_unique_id_per_product ON public.hazards (product_id, hazard_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_hazards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hazards_updated_at
  BEFORE UPDATE ON public.hazards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_hazards_updated_at();