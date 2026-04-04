-- Extend phase_budget_items table for timeline-based cost management
ALTER TABLE public.phase_budget_items 
ADD COLUMN timing_type text DEFAULT 'both' CHECK (timing_type IN ('pre_launch', 'post_launch', 'both', 'milestone')),
ADD COLUMN post_launch_cost numeric(12,2),
ADD COLUMN frequency text DEFAULT 'monthly' CHECK (frequency IN ('one_time', 'monthly', 'quarterly', 'yearly')),
ADD COLUMN active_start_date date,
ADD COLUMN active_end_date date;

-- Add comment for clarity
COMMENT ON COLUMN public.phase_budget_items.timing_type IS 'When this cost applies: pre_launch, post_launch, both, or milestone';
COMMENT ON COLUMN public.phase_budget_items.post_launch_cost IS 'Different cost rate for post-launch period (if timing_type is both)';
COMMENT ON COLUMN public.phase_budget_items.frequency IS 'How often this cost occurs: one_time, monthly, quarterly, yearly';
COMMENT ON COLUMN public.phase_budget_items.active_start_date IS 'When this cost becomes active (optional)';
COMMENT ON COLUMN public.phase_budget_items.active_end_date IS 'When this cost stops (optional)';

-- Update existing records to have default values
UPDATE public.phase_budget_items 
SET timing_type = 'both', frequency = 'monthly' 
WHERE timing_type IS NULL OR frequency IS NULL;