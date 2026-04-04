
-- Add foreign key columns for closed-loop defect management
ALTER TABLE public.defects
  ADD COLUMN IF NOT EXISTS linked_hazard_id uuid REFERENCES public.hazards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_capa_id uuid REFERENCES public.capa_records(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_ccr_id uuid REFERENCES public.change_control_requests(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_defects_linked_hazard ON public.defects(linked_hazard_id);
CREATE INDEX IF NOT EXISTS idx_defects_linked_capa ON public.defects(linked_capa_id);
CREATE INDEX IF NOT EXISTS idx_defects_linked_ccr ON public.defects(linked_ccr_id);
