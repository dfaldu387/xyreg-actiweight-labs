-- Add storage, sterility, and handling fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS storage_sterility_handling JSONB DEFAULT '{}';

-- Update the existing trigger to handle the new column
-- (The existing trigger update_updated_at() will automatically handle this column)