-- Add comparison data columns to notified_bodies table
ALTER TABLE public.notified_bodies 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS typical_lead_time_months_min INTEGER,
ADD COLUMN IF NOT EXISTS typical_lead_time_months_max INTEGER,
ADD COLUMN IF NOT EXISTS audit_fee_per_day_min INTEGER,
ADD COLUMN IF NOT EXISTS audit_fee_per_day_max INTEGER,
ADD COLUMN IF NOT EXISTS scope_depth TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS waitlist_status TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS strengths TEXT[],
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.notified_bodies.category IS 'NB category: big_four, established, new_entrant, standard';
COMMENT ON COLUMN public.notified_bodies.typical_lead_time_months_min IS 'Minimum typical lead time in months for Class III';
COMMENT ON COLUMN public.notified_bodies.typical_lead_time_months_max IS 'Maximum typical lead time in months for Class III';
COMMENT ON COLUMN public.notified_bodies.audit_fee_per_day_min IS 'Minimum audit fee per day in EUR';
COMMENT ON COLUMN public.notified_bodies.audit_fee_per_day_max IS 'Maximum audit fee per day in EUR';
COMMENT ON COLUMN public.notified_bodies.scope_depth IS 'Scope depth: full, focused, standard';
COMMENT ON COLUMN public.notified_bodies.waitlist_status IS 'Waitlist status: open, closed, limited, unknown';
COMMENT ON COLUMN public.notified_bodies.strengths IS 'Array of key strengths/differentiators';
COMMENT ON COLUMN public.notified_bodies.notes IS 'Additional notes or context';