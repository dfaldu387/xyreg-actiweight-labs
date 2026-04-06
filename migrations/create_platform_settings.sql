-- Create platform_settings table for storing admin configuration
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Allow super admins to read/write
CREATE POLICY "Super admins can manage platform settings"
ON platform_settings
FOR ALL
TO authenticated
USING (
  (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'super_admin'
);

-- Seed the initial row for adoption notification emails
INSERT INTO platform_settings (key, value)
VALUES ('adoption_notification_emails', '[]');
