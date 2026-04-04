-- Create reviewer groups table
CREATE TABLE IF NOT EXISTS reviewer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  group_type TEXT NOT NULL CHECK (group_type IN ('internal', 'external', 'regulatory')),
  color TEXT NOT NULL DEFAULT '#3b82f6',
  is_default BOOLEAN NOT NULL DEFAULT false,
  permissions JSONB NOT NULL DEFAULT '{
    "canDownload": true,
    "canComment": true,
    "canUpload": false,
    "canApprove": false,
    "canViewInternal": false
  }'::jsonb,
  settings JSONB NOT NULL DEFAULT '{
    "requireAllApprovals": false,
    "allowSelfAssignment": true,
    "enableNotifications": true,
    "defaultDeadlineDays": 7
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(company_id, name)
);

-- Create reviewer group members table
CREATE TABLE IF NOT EXISTS reviewer_group_members_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES reviewer_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'reviewer',
  is_lead BOOLEAN NOT NULL DEFAULT false,
  can_approve BOOLEAN NOT NULL DEFAULT true,
  can_request_changes BOOLEAN NOT NULL DEFAULT true,
  can_reject BOOLEAN NOT NULL DEFAULT false,
  notification_preferences JSONB NOT NULL DEFAULT '{
    "email": true,
    "in_app": true
  }'::jsonb,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(group_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE reviewer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_group_members_new ENABLE ROW LEVEL SECURITY;

-- RLS policies for reviewer_groups
CREATE POLICY "Users can view reviewer groups for their companies"
ON reviewer_groups FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create reviewer groups for their companies"
ON reviewer_groups FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can update reviewer groups for their companies"
ON reviewer_groups FOR UPDATE
USING (
  company_id IN (
    SELECT company_id 
    FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can delete reviewer groups for their companies"
ON reviewer_groups FOR DELETE
USING (
  company_id IN (
    SELECT company_id 
    FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  )
);

-- RLS policies for reviewer_group_members_new
CREATE POLICY "Users can view members of groups in their companies"
ON reviewer_group_members_new FOR SELECT
USING (
  group_id IN (
    SELECT id FROM reviewer_groups 
    WHERE company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can add members to groups in their companies"
ON reviewer_group_members_new FOR INSERT
WITH CHECK (
  group_id IN (
    SELECT id FROM reviewer_groups 
    WHERE company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  )
);

CREATE POLICY "Users can update members of groups in their companies"
ON reviewer_group_members_new FOR UPDATE
USING (
  group_id IN (
    SELECT id FROM reviewer_groups 
    WHERE company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  )
);

CREATE POLICY "Users can remove members from groups in their companies"
ON reviewer_group_members_new FOR DELETE
USING (
  group_id IN (
    SELECT id FROM reviewer_groups 
    WHERE company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  )
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviewer_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviewer_groups_updated_at
  BEFORE UPDATE ON reviewer_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_reviewer_groups_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_reviewer_groups_company_id ON reviewer_groups(company_id);
CREATE INDEX idx_reviewer_group_members_group_id ON reviewer_group_members_new(group_id);
CREATE INDEX idx_reviewer_group_members_user_id ON reviewer_group_members_new(user_id);