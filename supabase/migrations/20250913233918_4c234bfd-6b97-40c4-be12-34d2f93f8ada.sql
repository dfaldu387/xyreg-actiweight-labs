-- Create regulatory cost templates table
CREATE TABLE public.regulatory_cost_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_code TEXT NOT NULL,
  market_name TEXT NOT NULL,
  device_class TEXT NOT NULL,
  cost_category TEXT NOT NULL, -- 'regulatory', 'manufacturing', 'clinical', 'marketing', 'distribution', 'maintenance'
  cost_subcategory TEXT,
  typical_cost NUMERIC(12,2) NOT NULL,
  min_cost NUMERIC(12,2),
  max_cost NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  cost_description TEXT,
  justification TEXT,
  timeline_months INTEGER,
  frequency TEXT DEFAULT 'one_time', -- 'one_time', 'annual', 'monthly', 'quarterly'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regulatory_cost_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for reading cost templates (public data)
CREATE POLICY "Anyone can view regulatory cost templates" 
ON public.regulatory_cost_templates 
FOR SELECT 
USING (is_active = true);

-- Create indexes
CREATE INDEX idx_regulatory_cost_templates_market_class ON public.regulatory_cost_templates(market_code, device_class);
CREATE INDEX idx_regulatory_cost_templates_category ON public.regulatory_cost_templates(cost_category);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_regulatory_cost_templates_updated_at
BEFORE UPDATE ON public.regulatory_cost_templates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample regulatory cost data
INSERT INTO public.regulatory_cost_templates (market_code, market_name, device_class, cost_category, cost_subcategory, typical_cost, min_cost, max_cost, currency, cost_description, justification, timeline_months, frequency) VALUES
-- USA FDA Costs
('US', 'United States', 'Class I', 'regulatory', 'FDA 510k Premarket Notification', 12745, 8000, 15000, 'USD', 'FDA 510k submission fee', 'Based on FDA fee schedule 2024', 6, 'one_time'),
('US', 'United States', 'Class II', 'regulatory', 'FDA 510k Premarket Notification', 23290, 20000, 30000, 'USD', 'FDA 510k submission fee', 'Based on FDA fee schedule 2024', 8, 'one_time'),
('US', 'United States', 'Class III', 'regulatory', 'FDA PMA Premarket Approval', 365657, 300000, 450000, 'USD', 'FDA PMA submission fee', 'Based on FDA fee schedule 2024', 18, 'one_time'),
('US', 'United States', 'Class II', 'clinical', 'Clinical Trial Costs', 150000, 75000, 300000, 'USD', 'Clinical validation study', 'Typical costs for Class II device validation', 12, 'one_time'),
('US', 'United States', 'Class III', 'clinical', 'Clinical Trial Costs', 800000, 500000, 1500000, 'USD', 'Pivotal clinical trial', 'Multi-site randomized controlled trial', 24, 'one_time'),
('US', 'United States', 'All Classes', 'manufacturing', 'FDA Registration', 6875, 5000, 8000, 'USD', 'FDA establishment registration', 'Annual FDA registration fee', 1, 'annual'),
('US', 'United States', 'All Classes', 'manufacturing', 'Manufacturing Setup', 75000, 40000, 150000, 'USD', 'Initial manufacturing setup and validation', 'Clean room, equipment, quality systems', 6, 'one_time'),

-- EU CE Mark Costs
('EU', 'European Union', 'Class I', 'regulatory', 'CE Mark Self-Declaration', 5000, 3000, 8000, 'EUR', 'Technical documentation and declaration', 'Self-certification for Class I devices', 3, 'one_time'),
('EU', 'European Union', 'Class IIa', 'regulatory', 'Notified Body Assessment', 35000, 25000, 50000, 'EUR', 'Notified body conformity assessment', 'Third-party assessment for Class IIa', 8, 'one_time'),
('EU', 'European Union', 'Class IIb', 'regulatory', 'Notified Body Assessment', 55000, 40000, 75000, 'EUR', 'Notified body conformity assessment', 'Third-party assessment for Class IIb', 10, 'one_time'),
('EU', 'European Union', 'Class III', 'regulatory', 'Notified Body Assessment', 85000, 65000, 120000, 'EUR', 'Notified body conformity assessment', 'Full quality system assessment', 12, 'one_time'),
('EU', 'European Union', 'Class IIa', 'regulatory', 'Annual Surveillance', 8000, 5000, 12000, 'EUR', 'Annual notified body surveillance', 'Ongoing compliance monitoring', 1, 'annual'),
('EU', 'European Union', 'Class IIb', 'regulatory', 'Annual Surveillance', 12000, 8000, 18000, 'EUR', 'Annual notified body surveillance', 'Ongoing compliance monitoring', 1, 'annual'),
('EU', 'European Union', 'Class III', 'regulatory', 'Annual Surveillance', 18000, 12000, 25000, 'EUR', 'Annual notified body surveillance', 'Ongoing compliance monitoring', 1, 'annual'),
('EU', 'European Union', 'All Classes', 'manufacturing', 'Manufacturing Setup', 50000, 30000, 100000, 'EUR', 'EU manufacturing compliance setup', 'ISO 13485, quality systems', 4, 'one_time'),

-- Canada Health Canada Costs
('CA', 'Canada', 'Class I', 'regulatory', 'Health Canada License', 4590, 3000, 6000, 'CAD', 'Medical device license application', 'Health Canada CMDCAS fee', 4, 'one_time'),
('CA', 'Canada', 'Class II', 'regulatory', 'Health Canada License', 9180, 7000, 12000, 'CAD', 'Medical device license application', 'Health Canada CMDCAS fee', 6, 'one_time'),
('CA', 'Canada', 'Class III', 'regulatory', 'Health Canada License', 22950, 18000, 28000, 'CAD', 'Medical device license application', 'Health Canada CMDCAS fee', 12, 'one_time'),
('CA', 'Canada', 'Class IV', 'regulatory', 'Health Canada License', 45900, 35000, 55000, 'CAD', 'Medical device license application', 'Health Canada CMDCAS fee', 18, 'one_time'),
('CA', 'Canada', 'All Classes', 'regulatory', 'Annual License Fee', 2295, 2000, 3000, 'CAD', 'Annual license maintenance', 'Health Canada annual fee', 1, 'annual'),
('CA', 'Canada', 'All Classes', 'manufacturing', 'Manufacturing Setup', 45000, 25000, 75000, 'CAD', 'Canadian manufacturing compliance', 'Quality systems and facility setup', 4, 'one_time'),

-- Australia TGA Costs
('AU', 'Australia', 'Class I', 'regulatory', 'TGA Registration', 3050, 2500, 4000, 'AUD', 'TGA device registration', 'Australian regulatory submission', 3, 'one_time'),
('AU', 'Australia', 'Class IIa', 'regulatory', 'TGA Conformity Assessment', 15250, 12000, 20000, 'AUD', 'TGA conformity assessment', 'Third-party assessment', 6, 'one_time'),
('AU', 'Australia', 'Class IIb', 'regulatory', 'TGA Conformity Assessment', 25420, 20000, 32000, 'AUD', 'TGA conformity assessment', 'Enhanced third-party assessment', 8, 'one_time'),
('AU', 'Australia', 'Class III', 'regulatory', 'TGA Conformity Assessment', 45750, 35000, 58000, 'AUD', 'TGA conformity assessment', 'Full conformity assessment', 12, 'one_time'),
('AU', 'Australia', 'All Classes', 'manufacturing', 'Manufacturing Setup', 35000, 20000, 60000, 'AUD', 'Australian manufacturing compliance', 'TGA quality systems', 3, 'one_time'),

-- Brazil ANVISA Costs
('BR', 'Brazil', 'Class I', 'regulatory', 'ANVISA Registration', 8000, 6000, 12000, 'BRL', 'ANVISA device registration', 'Brazilian regulatory submission', 6, 'one_time'),
('BR', 'Brazil', 'Class II', 'regulatory', 'ANVISA Registration', 15000, 12000, 20000, 'BRL', 'ANVISA device registration', 'Enhanced regulatory review', 9, 'one_time'),
('BR', 'Brazil', 'Class III', 'regulatory', 'ANVISA Registration', 35000, 25000, 50000, 'BRL', 'ANVISA device registration', 'Full regulatory assessment', 15, 'one_time'),
('BR', 'Brazil', 'All Classes', 'manufacturing', 'Manufacturing Setup', 40000, 25000, 70000, 'BRL', 'Brazilian manufacturing compliance', 'Local manufacturing requirements', 6, 'one_time'),

-- Japan PMDA Costs
('JP', 'Japan', 'Class II', 'regulatory', 'PMDA Consultation', 25000, 20000, 35000, 'USD', 'PMDA pre-submission consultation', 'Regulatory strategy consultation', 3, 'one_time'),
('JP', 'Japan', 'Class II', 'regulatory', 'PMDA Approval', 85000, 65000, 120000, 'USD', 'PMDA marketing approval', 'Full regulatory submission', 12, 'one_time'),
('JP', 'Japan', 'Class III', 'regulatory', 'PMDA Approval', 150000, 120000, 200000, 'USD', 'PMDA marketing approval', 'Enhanced regulatory review', 18, 'one_time'),
('JP', 'Japan', 'All Classes', 'manufacturing', 'Manufacturing Setup', 60000, 35000, 100000, 'USD', 'Japanese manufacturing compliance', 'JIS standards and quality systems', 8, 'one_time');

-- Create company cost template overrides table
CREATE TABLE public.company_cost_template_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.regulatory_cost_templates(id),
  override_cost NUMERIC(12,2) NOT NULL,
  override_justification TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_cost_template_overrides ENABLE ROW LEVEL SECURITY;

-- Create policy for company overrides
CREATE POLICY "Users can manage cost overrides for their companies" 
ON public.company_cost_template_overrides 
FOR ALL 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
    AND user_company_access.access_level IN ('admin', 'editor')
))
WITH CHECK (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
    AND user_company_access.access_level IN ('admin', 'editor')
));

-- Create indexes
CREATE INDEX idx_company_cost_overrides_company ON public.company_cost_template_overrides(company_id);
CREATE INDEX idx_company_cost_overrides_template ON public.company_cost_template_overrides(template_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_company_cost_template_overrides_updated_at
BEFORE UPDATE ON public.company_cost_template_overrides
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();