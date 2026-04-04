-- Add patient volume fields and ASP to product_market_sizing
ALTER TABLE public.product_market_sizing
ADD COLUMN IF NOT EXISTS tam_patient_volume integer,
ADD COLUMN IF NOT EXISTS sam_patient_volume integer,
ADD COLUMN IF NOT EXISTS som_patient_volume integer,
ADD COLUMN IF NOT EXISTS average_selling_price numeric;

-- Add comments for clarity
COMMENT ON COLUMN public.product_market_sizing.tam_patient_volume IS 'Total patient/procedure volume for TAM';
COMMENT ON COLUMN public.product_market_sizing.sam_patient_volume IS 'Patient/procedure volume for SAM';
COMMENT ON COLUMN public.product_market_sizing.som_patient_volume IS 'Target patient/procedure volume for SOM';
COMMENT ON COLUMN public.product_market_sizing.average_selling_price IS 'Average selling price per unit/procedure';