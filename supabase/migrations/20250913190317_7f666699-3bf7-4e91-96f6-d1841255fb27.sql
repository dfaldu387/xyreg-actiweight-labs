-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Check if the RLS policies are properly configured for products table
-- This will ensure users can see products from companies they have access to