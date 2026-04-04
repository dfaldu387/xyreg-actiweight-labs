
-- Add design object linking and escalation tracking columns to pms_events
ALTER TABLE public.pms_events
  ADD COLUMN IF NOT EXISTS linked_requirement_ids JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS linked_hazard_ids JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS escalated_capa_id UUID REFERENCES public.capa_records(id),
  ADD COLUMN IF NOT EXISTS escalated_ccr_id UUID REFERENCES public.change_control_requests(id);

-- Add index for quick lookup of events by escalated records
CREATE INDEX IF NOT EXISTS idx_pms_events_escalated_capa ON public.pms_events(escalated_capa_id) WHERE escalated_capa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pms_events_escalated_ccr ON public.pms_events(escalated_ccr_id) WHERE escalated_ccr_id IS NOT NULL;
