-- Add unit economics fields to feasibility_revenue_projections table
ALTER TABLE public.feasibility_revenue_projections
ADD COLUMN IF NOT EXISTS unit_price_worst DECIMAL,
ADD COLUMN IF NOT EXISTS unit_price_likely DECIMAL,
ADD COLUMN IF NOT EXISTS unit_price_best DECIMAL,
ADD COLUMN IF NOT EXISTS cogs_worst DECIMAL,
ADD COLUMN IF NOT EXISTS cogs_likely DECIMAL,
ADD COLUMN IF NOT EXISTS cogs_best DECIMAL,
ADD COLUMN IF NOT EXISTS units_worst DECIMAL,
ADD COLUMN IF NOT EXISTS units_likely DECIMAL,
ADD COLUMN IF NOT EXISTS units_best DECIMAL;

COMMENT ON COLUMN public.feasibility_revenue_projections.unit_price_worst IS 'Worst case unit price';
COMMENT ON COLUMN public.feasibility_revenue_projections.unit_price_likely IS 'Likely case unit price';
COMMENT ON COLUMN public.feasibility_revenue_projections.unit_price_best IS 'Best case unit price';
COMMENT ON COLUMN public.feasibility_revenue_projections.cogs_worst IS 'Worst case cost of goods sold per unit';
COMMENT ON COLUMN public.feasibility_revenue_projections.cogs_likely IS 'Likely case cost of goods sold per unit';
COMMENT ON COLUMN public.feasibility_revenue_projections.cogs_best IS 'Best case cost of goods sold per unit';
COMMENT ON COLUMN public.feasibility_revenue_projections.units_worst IS 'Worst case units sold';
COMMENT ON COLUMN public.feasibility_revenue_projections.units_likely IS 'Likely case units sold';
COMMENT ON COLUMN public.feasibility_revenue_projections.units_best IS 'Best case units sold';