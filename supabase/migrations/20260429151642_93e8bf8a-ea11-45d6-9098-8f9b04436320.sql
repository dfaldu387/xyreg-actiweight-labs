ALTER TABLE public.qms_node_internal_processes
  ADD COLUMN IF NOT EXISTS inputs jsonb,
  ADD COLUMN IF NOT EXISTS outputs jsonb;