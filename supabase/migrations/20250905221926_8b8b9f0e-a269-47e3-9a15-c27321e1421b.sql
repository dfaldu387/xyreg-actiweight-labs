-- Add missing position column to lifecycle_phases table
ALTER TABLE lifecycle_phases 
ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;