-- Just enable RLS on the new table (separate migration to avoid deadlock)
ALTER TABLE public.product_variant_distributions ENABLE ROW LEVEL SECURITY;