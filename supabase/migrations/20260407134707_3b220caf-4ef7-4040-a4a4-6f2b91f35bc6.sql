
CREATE TABLE public.mc_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mc_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see tasks assigned to them or created by them"
  ON public.mc_tasks FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create tasks"
  ON public.mc_tasks FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Assignees and creators can update tasks"
  ON public.mc_tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Creators can delete tasks"
  ON public.mc_tasks FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
