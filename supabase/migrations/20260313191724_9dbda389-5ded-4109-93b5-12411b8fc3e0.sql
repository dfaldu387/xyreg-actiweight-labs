-- Fix SELECT policy so thread creator can read the row immediately after INSERT (INSERT ... RETURNING)
DROP POLICY IF EXISTS "threads_select" ON public.communication_threads;

CREATE POLICY "threads_select" ON public.communication_threads
  FOR SELECT TO authenticated
  USING (
    public.is_thread_participant(auth.uid(), id)
    OR created_by = auth.uid()
  );