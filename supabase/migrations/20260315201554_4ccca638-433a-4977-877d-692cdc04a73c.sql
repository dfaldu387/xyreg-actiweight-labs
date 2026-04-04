
ALTER TABLE public.lifecycle_phases
  ADD COLUMN IF NOT EXISTS baseline_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS baseline_end_date timestamptz;

COMMENT ON COLUMN public.lifecycle_phases.baseline_start_date IS 'Original planned start date, set once when dates are first assigned';
COMMENT ON COLUMN public.lifecycle_phases.baseline_end_date IS 'Original planned end date, set once when dates are first assigned';
