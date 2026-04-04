-- Fix the market_extensions foreign key constraint to reference products table instead of platform_projects

-- Drop the existing constraint
ALTER TABLE market_extensions 
DROP CONSTRAINT market_extensions_platform_project_id_fkey;

-- Add the correct foreign key constraint to reference products table
ALTER TABLE market_extensions 
ADD CONSTRAINT market_extensions_platform_project_id_fkey 
FOREIGN KEY (platform_project_id) REFERENCES products(id) ON DELETE CASCADE;