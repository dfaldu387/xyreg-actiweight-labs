-- Add udi_pi_config column to products table for storing production identifier configuration
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS udi_pi_config JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.products.udi_pi_config IS 'Configuration for UDI Production Identifiers (lot/batch, serial, manufacturing date, expiration date, software version)';