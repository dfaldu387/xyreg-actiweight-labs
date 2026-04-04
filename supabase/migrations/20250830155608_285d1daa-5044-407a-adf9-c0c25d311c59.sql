-- Add category column to hazards table for AI-generated hazard categorization
ALTER TABLE public.hazards 
ADD COLUMN IF NOT EXISTS category TEXT;