-- Add description and regulatory_reference fields to pms_activity_tracking table
ALTER TABLE pms_activity_tracking 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS regulatory_reference TEXT;