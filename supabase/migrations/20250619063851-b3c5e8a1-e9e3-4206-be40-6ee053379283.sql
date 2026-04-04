
-- Add project_types column to products table
-- This column will store an array of project type strings as JSONB
-- Making it NOT NULL since it's mandatory for new products

ALTER TABLE products 
ADD COLUMN project_types JSONB NOT NULL DEFAULT '[]'::JSONB;

-- Add a comment to document the column purpose
COMMENT ON COLUMN products.project_types IS 'Array of project type strings (e.g., ["Line Extension", "Labeling or Packaging Change"])';

-- Verify the class column is nullable (it should already be)
-- If needed, uncomment the line below:
-- ALTER TABLE products ALTER COLUMN class DROP NOT NULL;
