
-- Add due_date column to gap_analysis_items for individual compliance instance due dates
ALTER TABLE public.gap_analysis_items 
ADD COLUMN IF NOT EXISTS due_date date;

-- Add index for better performance when querying by due dates
CREATE INDEX IF NOT EXISTS idx_gap_analysis_items_due_date 
ON public.gap_analysis_items(due_date);

-- Add index for product_id and due_date combination for efficient queries
CREATE INDEX IF NOT EXISTS idx_gap_analysis_items_product_due_date 
ON public.gap_analysis_items(product_id, due_date);
