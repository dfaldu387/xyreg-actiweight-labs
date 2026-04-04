-- Add value_proposition column to product_reimbursement_strategy table
ALTER TABLE public.product_reimbursement_strategy 
ADD COLUMN IF NOT EXISTS value_proposition TEXT;