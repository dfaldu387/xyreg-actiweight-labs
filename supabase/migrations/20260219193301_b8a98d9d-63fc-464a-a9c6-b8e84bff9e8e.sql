-- Add field_scope_overrides JSONB column to products table
-- Format: { "intended_use": "individual", "mode_of_action": "individual" }
-- Fields not listed default to "product_family"
ALTER TABLE public.products 
ADD COLUMN field_scope_overrides JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.products.field_scope_overrides IS 'Per-field IP/PF scope overrides. Keys are field names, values are "individual" or "product_family". Missing fields default to product_family.';