-- Add supplier_type column to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN supplier_type TEXT DEFAULT 'Component Supplier';

-- Update existing suppliers to have the default supplier type
UPDATE public.suppliers 
SET supplier_type = 'Component Supplier' 
WHERE supplier_type IS NULL;