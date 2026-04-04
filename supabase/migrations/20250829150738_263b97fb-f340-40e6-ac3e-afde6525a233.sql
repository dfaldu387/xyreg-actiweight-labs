-- Create requirement_specifications table
CREATE TABLE public.requirement_specifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id text NOT NULL,
  product_id uuid NOT NULL,
  company_id uuid NOT NULL,
  description text NOT NULL,
  traces_to text DEFAULT '',
  linked_risks text DEFAULT '',
  verification_status text NOT NULL DEFAULT 'Not Started'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT requirement_specifications_verification_status_check 
    CHECK (verification_status IN ('Not Started', 'In Progress', 'Passed', 'Failed'))
);

-- Enable Row Level Security
ALTER TABLE public.requirement_specifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view requirement specifications for accessible companies"
ON public.requirement_specifications
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create requirement specifications for accessible companies"
ON public.requirement_specifications
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
);

CREATE POLICY "Users can update requirement specifications for accessible companies"
ON public.requirement_specifications
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id 
    FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
);

CREATE POLICY "Users can delete requirement specifications for accessible companies"
ON public.requirement_specifications
FOR DELETE
USING (
  company_id IN (
    SELECT company_id 
    FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
);

-- Create indexes for performance
CREATE INDEX idx_requirement_specifications_product_id ON public.requirement_specifications(product_id);
CREATE INDEX idx_requirement_specifications_company_id ON public.requirement_specifications(company_id);
CREATE UNIQUE INDEX idx_requirement_specifications_unique_id_per_product ON public.requirement_specifications(product_id, requirement_id);

-- Create trigger for updated_at
CREATE TRIGGER update_requirement_specifications_updated_at
  BEFORE UPDATE ON public.requirement_specifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();