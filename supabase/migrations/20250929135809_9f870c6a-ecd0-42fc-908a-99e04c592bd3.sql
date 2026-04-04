-- Add missing columns to product_revenues table for enhanced commercial data
ALTER TABLE product_revenues 
ADD COLUMN IF NOT EXISTS units_forecast INTEGER,
ADD COLUMN IF NOT EXISTS volume_seasonality_factor NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS market_penetration_percentage NUMERIC;