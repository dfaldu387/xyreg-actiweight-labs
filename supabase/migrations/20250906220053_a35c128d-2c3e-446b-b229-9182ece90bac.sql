-- Add phase_id to ci_instances table
ALTER TABLE public.ci_instances 
ADD COLUMN phase_id uuid REFERENCES public.phases(id);

-- Create index for better performance
CREATE INDEX idx_ci_instances_phase_id ON public.ci_instances(phase_id);

-- Update RLS policies to include phase-based access
DROP POLICY IF EXISTS "Users can view CI instances for accessible companies" ON public.ci_instances;
CREATE POLICY "Users can view CI instances for accessible companies" 
ON public.ci_instances 
FOR SELECT 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
  )
);