
-- Add scope_type and family_identifier columns to vv_plans
ALTER TABLE public.vv_plans
  ADD COLUMN scope_type text NOT NULL DEFAULT 'individual',
  ADD COLUMN family_identifier text;
