-- Add scenario columns to phase_budget_items for feasibility support
ALTER TABLE phase_budget_items
ADD COLUMN worst_case_amount DECIMAL(15, 2),
ADD COLUMN likely_case_amount DECIMAL(15, 2),
ADD COLUMN best_case_amount DECIMAL(15, 2),
ADD COLUMN is_feasibility BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN feasibility_portfolio_id UUID REFERENCES feasibility_portfolios(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_phase_budget_items_is_feasibility ON phase_budget_items(is_feasibility);
CREATE INDEX idx_phase_budget_items_feasibility_portfolio ON phase_budget_items(feasibility_portfolio_id);

-- Add comment for documentation
COMMENT ON COLUMN phase_budget_items.worst_case_amount IS 'Worst case scenario budget amount (for feasibility planning)';
COMMENT ON COLUMN phase_budget_items.likely_case_amount IS 'Likely case scenario budget amount (for feasibility planning)';
COMMENT ON COLUMN phase_budget_items.best_case_amount IS 'Best case scenario budget amount (for feasibility planning)';
COMMENT ON COLUMN phase_budget_items.is_feasibility IS 'Flag to distinguish feasibility budgets from active project budgets';
COMMENT ON COLUMN phase_budget_items.feasibility_portfolio_id IS 'Link to feasibility portfolio if this is a feasibility budget';