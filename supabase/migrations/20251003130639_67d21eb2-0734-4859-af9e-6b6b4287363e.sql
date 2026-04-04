-- Create user_department_assignments table for multi-department support with FTE
CREATE TABLE IF NOT EXISTS public.user_department_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_name TEXT NOT NULL,
  fte_allocation DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (fte_allocation > 0 AND fte_allocation <= 1.0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, company_id, department_name)
);

-- Enable RLS
ALTER TABLE public.user_department_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view department assignments for their companies"
  ON public.user_department_assignments
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and editors can manage department assignments"
  ON public.user_department_assignments
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_user_department_assignments_updated_at
  BEFORE UPDATE ON public.user_department_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_user_department_assignments_company ON public.user_department_assignments(company_id);
CREATE INDEX idx_user_department_assignments_user ON public.user_department_assignments(user_id);

-- Migrate existing functional_area data from user_company_access (cast enum to text)
INSERT INTO public.user_department_assignments (user_id, company_id, department_name, fte_allocation)
SELECT 
  uca.user_id,
  uca.company_id,
  uca.functional_area::TEXT as department_name,
  1.0 as fte_allocation
FROM public.user_company_access uca
WHERE uca.functional_area IS NOT NULL
ON CONFLICT (user_id, company_id, department_name) DO NOTHING;