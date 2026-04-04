-- Create invitation_department_assignments table for multi-department support in invitations
CREATE TABLE IF NOT EXISTS public.invitation_department_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.user_invitations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  department_name TEXT NOT NULL,
  fte_allocation DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (fte_allocation > 0 AND fte_allocation <= 1.0),
  role TEXT[] DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(invitation_id, department_name)
);

-- Enable RLS
ALTER TABLE public.invitation_department_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as user_department_assignments)
CREATE POLICY "Users can view invitation department assignments for their companies"
  ON public.invitation_department_assignments
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and editors can manage invitation department assignments"
  ON public.invitation_department_assignments
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

-- Create index for faster lookups
CREATE INDEX idx_invitation_dept_assignments_invitation_id
  ON public.invitation_department_assignments(invitation_id);

CREATE INDEX idx_invitation_dept_assignments_company_id
  ON public.invitation_department_assignments(company_id);
