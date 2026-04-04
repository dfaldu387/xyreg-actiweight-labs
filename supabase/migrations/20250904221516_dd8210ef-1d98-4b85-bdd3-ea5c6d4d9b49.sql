-- Add phase reference fields for concurrent phase definition
ALTER TABLE company_phases 
ADD COLUMN start_phase_id uuid REFERENCES company_phases(id),
ADD COLUMN end_phase_id uuid REFERENCES company_phases(id),
ADD COLUMN start_position text CHECK (start_position IN ('start', 'end')),
ADD COLUMN end_position text CHECK (end_position IN ('start', 'end'));