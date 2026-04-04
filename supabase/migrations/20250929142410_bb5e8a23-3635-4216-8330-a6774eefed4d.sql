-- CRITICAL: Enable RLS on tables that have policies but RLS is disabled
-- This fixes the security breach showing data from other companies

ALTER TABLE public.company_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_product_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_revenues ENABLE ROW LEVEL SECURITY;