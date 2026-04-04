
-- Add target object columns to change_control_requests
ALTER TABLE public.change_control_requests
  ADD COLUMN target_object_id uuid NULL,
  ADD COLUMN target_object_type text NULL;

-- Add index for lookup by target object
CREATE INDEX idx_ccr_target_object ON public.change_control_requests (target_object_id) WHERE target_object_id IS NOT NULL;
