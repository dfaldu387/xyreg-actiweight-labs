-- Add actual_cost column to phase_budget_items table
ALTER TABLE phase_budget_items 
ADD COLUMN actual_cost numeric DEFAULT NULL;