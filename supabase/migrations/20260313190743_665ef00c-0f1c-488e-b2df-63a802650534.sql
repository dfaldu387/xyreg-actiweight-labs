-- Fix: threads_insert policy must target authenticated role
DROP POLICY IF EXISTS "threads_insert" ON public.communication_threads;

CREATE POLICY "threads_insert" ON public.communication_threads
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Also fix threads_select and threads_update to target authenticated
DROP POLICY IF EXISTS "threads_select" ON public.communication_threads;
DROP POLICY IF EXISTS "threads_update" ON public.communication_threads;

CREATE POLICY "threads_select" ON public.communication_threads
  FOR SELECT TO authenticated
  USING (public.is_thread_participant(auth.uid(), id));

CREATE POLICY "threads_update" ON public.communication_threads
  FOR UPDATE TO authenticated
  USING (public.is_thread_participant(auth.uid(), id));