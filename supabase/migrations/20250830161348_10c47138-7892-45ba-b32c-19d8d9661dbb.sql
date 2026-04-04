-- Add AI approval tracking columns to hazards table
ALTER TABLE public.hazards 
ADD COLUMN IF NOT EXISTS ai_generated_fields JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_approval_states JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2);