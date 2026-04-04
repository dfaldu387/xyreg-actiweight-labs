-- Add foreign key constraint between activities.phase_id and lifecycle_phases.id
ALTER TABLE activities 
ADD CONSTRAINT fk_activities_phase_id 
FOREIGN KEY (phase_id) REFERENCES lifecycle_phases(id) 
ON DELETE SET NULL;