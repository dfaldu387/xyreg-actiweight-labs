-- Create CI Templates table for company-level CI definitions
CREATE TABLE public.ci_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('audit', 'gap', 'document', 'activity')),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  template_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create CI Instances table for product-level CI instances (inherited from templates)
CREATE TABLE public.ci_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.ci_templates(id),
  company_id UUID NOT NULL,
  product_id UUID,
  type TEXT NOT NULL CHECK (type IN ('audit', 'gap', 'document', 'activity')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID,
  due_date DATE,
  instance_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create CI Dependencies table
CREATE TABLE public.ci_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_ci_id UUID NOT NULL REFERENCES public.ci_instances(id),
  target_ci_id UUID NOT NULL REFERENCES public.ci_instances(id),
  dependency_type TEXT NOT NULL CHECK (dependency_type IN ('prerequisite', 'blocking', 'related')),
  description TEXT,
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ci_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ci_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ci_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for CI Templates
CREATE POLICY "Users can view CI templates for accessible companies"
ON public.ci_templates FOR SELECT
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create CI templates for their companies"
ON public.ci_templates FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update CI templates for their companies"
ON public.ci_templates FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete CI templates for their companies"
ON public.ci_templates FOR DELETE
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

-- RLS Policies for CI Instances
CREATE POLICY "Users can view CI instances for accessible companies"
ON public.ci_instances FOR SELECT
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create CI instances for their companies"
ON public.ci_instances FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor', 'viewer')
));

CREATE POLICY "Users can update CI instances for their companies"
ON public.ci_instances FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor', 'viewer')
));

CREATE POLICY "Users can delete CI instances for their companies"
ON public.ci_instances FOR DELETE
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

-- RLS Policies for CI Dependencies
CREATE POLICY "Users can view CI dependencies for accessible companies"
ON public.ci_dependencies FOR SELECT
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create CI dependencies for their companies"
ON public.ci_dependencies FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update CI dependencies for their companies"
ON public.ci_dependencies FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete CI dependencies for their companies"
ON public.ci_dependencies FOR DELETE
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

-- Create indexes for performance
CREATE INDEX idx_ci_templates_company_id ON public.ci_templates(company_id);
CREATE INDEX idx_ci_templates_type ON public.ci_templates(type);
CREATE INDEX idx_ci_instances_template_id ON public.ci_instances(template_id);
CREATE INDEX idx_ci_instances_company_id ON public.ci_instances(company_id);
CREATE INDEX idx_ci_instances_product_id ON public.ci_instances(product_id);
CREATE INDEX idx_ci_dependencies_source_ci_id ON public.ci_dependencies(source_ci_id);
CREATE INDEX idx_ci_dependencies_target_ci_id ON public.ci_dependencies(target_ci_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ci_templates_updated_at
    BEFORE UPDATE ON public.ci_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ci_instances_updated_at
    BEFORE UPDATE ON public.ci_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();