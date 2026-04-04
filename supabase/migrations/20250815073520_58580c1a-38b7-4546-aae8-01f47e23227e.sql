-- Mission Control Database Schema
-- Creates company-specific tables for Mission Control dashboard sections

-- Create enum types for status fields
CREATE TYPE mission_status AS ENUM ('on_track', 'needs_attention', 'at_risk');
CREATE TYPE action_item_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');
CREATE TYPE activity_type AS ENUM ('document_updated', 'milestone_completed', 'approval_requested', 'task_assigned', 'review_completed', 'system_alert');
CREATE TYPE message_type AS ENUM ('executive', 'team', 'system', 'announcement');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Portfolio Health table
CREATE TABLE mission_portfolio_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status mission_status NOT NULL DEFAULT 'on_track',
  description TEXT,
  product_count INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Portfolio Items that require attention
CREATE TABLE mission_requires_attention (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'product', 'document', 'milestone', 'compliance'
  item_id UUID, -- Reference to the actual item (product_id, document_id, etc.)
  title TEXT NOT NULL,
  description TEXT,
  priority priority_level DEFAULT 'medium',
  status mission_status NOT NULL DEFAULT 'needs_attention',
  due_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Action Items table
CREATE TABLE mission_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status action_item_status DEFAULT 'pending',
  priority priority_level DEFAULT 'medium',
  due_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_by UUID REFERENCES auth.users(id),
  requires_approval BOOLEAN DEFAULT false,
  approval_requested_from UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  item_type TEXT, -- 'document_review', 'milestone', 'compliance', 'general'
  item_reference_id UUID, -- Reference to related item
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activity Stream table
CREATE TABLE mission_activity_stream (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT, -- Denormalized for performance
  related_item_type TEXT, -- 'product', 'document', 'project', etc.
  related_item_id UUID,
  related_item_name TEXT,
  metadata JSONB DEFAULT '{}', -- Additional activity-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Executive Communications table
CREATE TABLE mission_executive_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'executive',
  priority priority_level DEFAULT 'medium',
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT, -- Denormalized
  recipients JSONB DEFAULT '[]', -- Array of user IDs or roles
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Recent Messages table
CREATE TABLE mission_recent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  thread_id UUID, -- For grouping related messages
  sender_id UUID REFERENCES auth.users(id),
  sender_name TEXT, -- Denormalized
  recipient_ids JSONB DEFAULT '[]', -- Array of user IDs
  subject TEXT,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'team',
  is_read_by JSONB DEFAULT '{}', -- Object with user_id as keys, read timestamp as values
  reply_to_id UUID REFERENCES mission_recent_messages(id),
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_mission_portfolio_health_company_id ON mission_portfolio_health(company_id);
CREATE INDEX idx_mission_requires_attention_company_id ON mission_requires_attention(company_id);
CREATE INDEX idx_mission_requires_attention_status ON mission_requires_attention(status);
CREATE INDEX idx_mission_action_items_company_id ON mission_action_items(company_id);
CREATE INDEX idx_mission_action_items_assigned_to ON mission_action_items(assigned_to);
CREATE INDEX idx_mission_action_items_status ON mission_action_items(status);
CREATE INDEX idx_mission_action_items_due_date ON mission_action_items(due_date);
CREATE INDEX idx_mission_activity_stream_company_id ON mission_activity_stream(company_id);
CREATE INDEX idx_mission_activity_stream_created_at ON mission_activity_stream(created_at DESC);
CREATE INDEX idx_mission_executive_communications_company_id ON mission_executive_communications(company_id);
CREATE INDEX idx_mission_executive_communications_published ON mission_executive_communications(is_published, published_at DESC);
CREATE INDEX idx_mission_recent_messages_company_id ON mission_recent_messages(company_id);
CREATE INDEX idx_mission_recent_messages_thread_id ON mission_recent_messages(thread_id);
CREATE INDEX idx_mission_recent_messages_created_at ON mission_recent_messages(created_at DESC);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_mission_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mission_portfolio_health_updated_at
  BEFORE UPDATE ON mission_portfolio_health
  FOR EACH ROW EXECUTE FUNCTION update_mission_updated_at_column();

CREATE TRIGGER update_mission_requires_attention_updated_at
  BEFORE UPDATE ON mission_requires_attention
  FOR EACH ROW EXECUTE FUNCTION update_mission_updated_at_column();

CREATE TRIGGER update_mission_action_items_updated_at
  BEFORE UPDATE ON mission_action_items
  FOR EACH ROW EXECUTE FUNCTION update_mission_updated_at_column();

CREATE TRIGGER update_mission_executive_communications_updated_at
  BEFORE UPDATE ON mission_executive_communications
  FOR EACH ROW EXECUTE FUNCTION update_mission_updated_at_column();

CREATE TRIGGER update_mission_recent_messages_updated_at
  BEFORE UPDATE ON mission_recent_messages
  FOR EACH ROW EXECUTE FUNCTION update_mission_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE mission_portfolio_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_requires_attention ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_activity_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_executive_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_recent_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company-based access
CREATE POLICY "Users can view mission data for their companies" ON mission_portfolio_health
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage mission data for their companies" ON mission_portfolio_health
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can view attention items for their companies" ON mission_requires_attention
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage attention items for their companies" ON mission_requires_attention
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can view action items for their companies" ON mission_action_items
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage action items for their companies" ON mission_action_items
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can view activity stream for their companies" ON mission_activity_stream
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activity entries for their companies" ON mission_activity_stream
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view communications for their companies" ON mission_executive_communications
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage communications for their companies" ON mission_executive_communications
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can view messages for their companies" ON mission_recent_messages
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage messages for their companies" ON mission_recent_messages
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );