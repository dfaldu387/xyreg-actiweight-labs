-- Add support for span dependencies with end phase
ALTER TABLE phase_dependencies ADD COLUMN IF NOT EXISTS end_phase_id UUID REFERENCES company_phases(id);