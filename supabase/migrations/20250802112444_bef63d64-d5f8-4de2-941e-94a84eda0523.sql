-- Create digital_templates table for adaptive templates
CREATE TABLE IF NOT EXISTS public.digital_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('activity', 'document')),
  base_template TEXT NOT NULL, -- e.g., 'design_review'
  phase_adaptations JSONB NOT NULL DEFAULT '{}',
  company_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_digital_templates_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.digital_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for digital_templates
CREATE POLICY "Users can view digital templates for their companies" 
ON public.digital_templates FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create digital templates for their companies" 
ON public.digital_templates FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update digital templates for their companies" 
ON public.digital_templates FOR UPDATE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete digital templates for their companies" 
ON public.digital_templates FOR DELETE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_digital_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_digital_templates_updated_at
  BEFORE UPDATE ON public.digital_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_digital_templates_updated_at();