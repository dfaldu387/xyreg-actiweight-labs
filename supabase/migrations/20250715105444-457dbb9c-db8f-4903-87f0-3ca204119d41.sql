-- Add change_description field to products table for tracking product upgrade changes
ALTER TABLE public.products 
ADD COLUMN change_description TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.products.change_description IS 'Description of changes made in product upgrades/versions';