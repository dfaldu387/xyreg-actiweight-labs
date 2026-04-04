-- Add Strategic Horizon columns to product_exit_strategy
ALTER TABLE public.product_exit_strategy 
ADD COLUMN IF NOT EXISTS selected_endgame TEXT,
ADD COLUMN IF NOT EXISTS endgame_checklist JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS endgame_metrics_focus TEXT,
ADD COLUMN IF NOT EXISTS licensing_terms JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ipo_readiness JSONB DEFAULT '{}'::jsonb;