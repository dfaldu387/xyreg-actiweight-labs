-- Fix MDR Annex II: change scope from 'company' to 'product'
UPDATE gap_analysis_templates SET scope = 'product' WHERE id = '847a58f7-8ace-492e-8b17-c3bf9fadc39c';

-- Delete orphaned company-scoped items (product_id IS NULL)
DELETE FROM gap_analysis_items WHERE product_id IS NULL AND framework = 'MDR_ANNEX_II';