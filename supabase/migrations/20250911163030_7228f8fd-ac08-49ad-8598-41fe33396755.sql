-- Add assigned_to and reviewer_group_id to company_phases table for phase assignments
ALTER TABLE company_phases 
ADD COLUMN assigned_to uuid REFERENCES user_profiles(id),
ADD COLUMN reviewer_group_id uuid REFERENCES reviewer_groups(id);