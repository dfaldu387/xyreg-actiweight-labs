ALTER TABLE public.change_control_requests
  ADD COLUMN IF NOT EXISTS technical_reviewer_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quality_reviewer_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS regulatory_reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ccr_technical_reviewer  ON public.change_control_requests(technical_reviewer_id);
CREATE INDEX IF NOT EXISTS idx_ccr_quality_reviewer    ON public.change_control_requests(quality_reviewer_id);
CREATE INDEX IF NOT EXISTS idx_ccr_regulatory_reviewer ON public.change_control_requests(regulatory_reviewer_id);