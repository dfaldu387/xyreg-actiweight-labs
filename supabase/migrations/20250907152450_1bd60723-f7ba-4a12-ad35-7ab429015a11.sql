-- Create table for storing digital template responses
CREATE TABLE public.template_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL,
  company_id UUID NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'design_review',
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  completion_status TEXT NOT NULL DEFAULT 'in_progress',
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.template_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for template responses
CREATE POLICY "Users can view template responses for their companies" 
ON public.template_responses 
FOR SELECT 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
));

CREATE POLICY "Users can create template responses for their companies" 
ON public.template_responses 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update template responses for their companies" 
ON public.template_responses 
FOR UPDATE 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can delete template responses for their companies" 
ON public.template_responses 
FOR DELETE 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_template_responses_updated_at
BEFORE UPDATE ON public.template_responses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();