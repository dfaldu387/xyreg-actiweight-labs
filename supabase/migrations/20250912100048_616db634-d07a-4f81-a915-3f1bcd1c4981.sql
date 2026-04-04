-- Phase 1: Database Schema Extension for Commercial Success Factors

-- Create commercial factor categories table
CREATE TABLE public.commercial_factor_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  suggested_loa_range TEXT, -- e.g., "60-80%"
  typical_timeline TEXT, -- e.g., "6-12 months post-approval"
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default commercial factor categories
INSERT INTO public.commercial_factor_categories (name, description, suggested_loa_range, typical_timeline) VALUES
('Reimbursement Code Approval', 'Obtaining CPT/DRG codes and coverage decisions from payers', '70-85%', '6-18 months post-approval'),
('Key Distribution Partner', 'Securing primary distribution channels and partnerships', '75-90%', '3-12 months post-approval'),
('Pilot Launch Success', 'Successful pilot program in target hospital network', '60-80%', '6-12 months post-launch'),
('Market Access Approval', 'Hospital formulary inclusion and purchasing approvals', '70-85%', '6-18 months post-approval'),
('Clinical Evidence Generation', 'Post-market clinical studies supporting value proposition', '65-80%', '12-24 months post-launch'),
('Health Economic Validation', 'Real-world evidence demonstrating economic benefits', '60-75%', '12-36 months post-launch');

-- Create commercial success factors table
CREATE TABLE public.commercial_success_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  company_id UUID NOT NULL,
  category_id UUID REFERENCES public.commercial_factor_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  likelihood_of_approval INTEGER NOT NULL DEFAULT 75 CHECK (likelihood_of_approval >= 0 AND likelihood_of_approval <= 100),
  market_codes JSONB DEFAULT '[]'::jsonb, -- Which markets this applies to
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  estimated_timeline_months INTEGER, -- Expected months post-regulatory approval
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(product_id, name, company_id)
);

-- Enable RLS on commercial success factors
ALTER TABLE public.commercial_success_factors ENABLE ROW LEVEL SECURITY;

-- RLS policies for commercial success factors
CREATE POLICY "Users can view commercial factors for their companies" 
ON public.commercial_success_factors 
FOR SELECT 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
));

CREATE POLICY "Users can create commercial factors for their companies" 
ON public.commercial_success_factors 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update commercial factors for their companies" 
ON public.commercial_success_factors 
FOR UPDATE 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can delete commercial factors for their companies" 
ON public.commercial_success_factors 
FOR DELETE 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

-- RLS policies for commercial factor categories (read-only for all authenticated users)
ALTER TABLE public.commercial_factor_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view commercial factor categories" 
ON public.commercial_factor_categories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Add commercial factors enabled flag to products table
ALTER TABLE public.products 
ADD COLUMN commercial_factors_enabled BOOLEAN DEFAULT false,
ADD COLUMN commercial_launch_date DATE;

-- Create indexes for performance
CREATE INDEX idx_commercial_factors_product_id ON public.commercial_success_factors(product_id);
CREATE INDEX idx_commercial_factors_company_id ON public.commercial_success_factors(company_id);
CREATE INDEX idx_commercial_factors_category_id ON public.commercial_success_factors(category_id);

-- Create trigger for updated_at
CREATE TRIGGER update_commercial_factors_updated_at
  BEFORE UPDATE ON public.commercial_success_factors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_commercial_factor_categories_updated_at
  BEFORE UPDATE ON public.commercial_factor_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();