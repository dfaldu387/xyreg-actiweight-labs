
-- Add phase_id to activities table to support phase-specific activities
ALTER TABLE activities 
ADD COLUMN phase_id UUID REFERENCES lifecycle_phases(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_activities_phase_id ON activities(phase_id);
