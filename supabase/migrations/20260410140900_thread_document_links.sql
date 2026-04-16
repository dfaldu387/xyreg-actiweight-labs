CREATE TABLE IF NOT EXISTS public.thread_document_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.communication_threads(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.phase_assigned_document_template(id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (thread_id, document_id)
);

ALTER TABLE public.thread_document_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "thread_doc_links_select" ON public.thread_document_links
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_participants tp
      WHERE tp.thread_id = thread_document_links.thread_id
        AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "thread_doc_links_insert" ON public.thread_document_links
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.thread_participants tp
      WHERE tp.thread_id = thread_document_links.thread_id
        AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "thread_doc_links_delete" ON public.thread_document_links
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_participants tp
      WHERE tp.thread_id = thread_document_links.thread_id
        AND tp.user_id = auth.uid()
    )
  );
