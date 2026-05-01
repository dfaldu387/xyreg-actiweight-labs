-- Customer feature flags: per-company on/off toggles for cross-cutting product
-- capabilities (Professor Xyreg, AI Auto-Fill, etc.). Configured by super admin.

CREATE TABLE IF NOT EXISTS public.customer_feature_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customer_feature_flags_company_feature_unique
        UNIQUE (company_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_customer_feature_flags_company
    ON public.customer_feature_flags(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_feature_flags_feature
    ON public.customer_feature_flags(feature_key);

-- Reuse the shared updated_at trigger function (created by earlier migrations).
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customer_feature_flags_updated_at
    ON public.customer_feature_flags;
CREATE TRIGGER update_customer_feature_flags_updated_at
    BEFORE UPDATE ON public.customer_feature_flags
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.customer_feature_flags ENABLE ROW LEVEL SECURITY;

-- Super admins can read/write any flag.
DROP POLICY IF EXISTS "super_admin_manage_customer_feature_flags"
    ON public.customer_feature_flags;
CREATE POLICY "super_admin_manage_customer_feature_flags"
    ON public.customer_feature_flags
    FOR ALL
    USING (public.is_admin_user())
    WITH CHECK (public.is_admin_user());

-- Authenticated users can read flags (the app filters by their own company at
-- runtime; broaden/tighten this once a profiles->company_id helper is wired up).
DROP POLICY IF EXISTS "users_read_own_company_feature_flags"
    ON public.customer_feature_flags;
DROP POLICY IF EXISTS "authenticated_read_customer_feature_flags"
    ON public.customer_feature_flags;
CREATE POLICY "authenticated_read_customer_feature_flags"
    ON public.customer_feature_flags
    FOR SELECT
    TO authenticated
    USING (true);

COMMENT ON TABLE public.customer_feature_flags
    IS 'Per-company on/off overrides for cross-cutting product features (e.g. Professor Xyreg, AI Auto-Fill). Managed in Super Admin > Feature Flags.';
COMMENT ON COLUMN public.customer_feature_flags.feature_key
    IS 'Stable feature identifier. Known keys: professor-xyreg, ai-auto-fill, ai-inline-suggestions, realtime-collaboration, communications-threads, multi-language-translation.';
COMMENT ON COLUMN public.customer_feature_flags.is_enabled
    IS 'When false, the feature is hidden for users of this company regardless of their plan.';
