-- Harden functions created in the last migration by setting an explicit search_path
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.price_compute_effective_for_product(uuid, uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.price_recompute_company(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.trg_pricing_rules_after_change() SET search_path = public, pg_temp;
ALTER FUNCTION public.trg_products_after_update() SET search_path = public, pg_temp;