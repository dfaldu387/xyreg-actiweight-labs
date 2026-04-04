-- Create basic_udi_aliases table to store user-defined aliases for Basic UDI-DI values
CREATE TABLE IF NOT EXISTS public.basic_udi_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  basic_udi_di TEXT NOT NULL,
  alias TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Each company can only have one alias per basic_udi_di
  UNIQUE(company_id, basic_udi_di)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_basic_udi_aliases_company_id ON public.basic_udi_aliases(company_id);
CREATE INDEX IF NOT EXISTS idx_basic_udi_aliases_basic_udi_di ON public.basic_udi_aliases(basic_udi_di);

-- Enable RLS on basic_udi_aliases
ALTER TABLE public.basic_udi_aliases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for basic_udi_aliases
CREATE POLICY "Users can view basic UDI aliases for their companies"
ON public.basic_udi_aliases FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.company_id = basic_udi_aliases.company_id
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert basic UDI aliases for their companies"
ON public.basic_udi_aliases FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.company_id = basic_udi_aliases.company_id
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can update basic UDI aliases for their companies"
ON public.basic_udi_aliases FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.company_id = basic_udi_aliases.company_id
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can delete basic UDI aliases for their companies"
ON public.basic_udi_aliases FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.company_id = basic_udi_aliases.company_id
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_basic_udi_aliases_updated_at
  BEFORE UPDATE ON public.basic_udi_aliases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
