-- Create product_audit_logs table
CREATE TABLE IF NOT EXISTS product_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Action details
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'DOWNLOAD', 'SHARE', 'EXPORT')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('DOCUMENT', 'IMAGE', 'PRODUCT', 'CONFIGURATION', 'REVIEW', 'COMMENT')),
  entity_name TEXT NOT NULL,
  description TEXT NOT NULL,
  changes JSONB DEFAULT '[]'::jsonb,
  
  -- Session information
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Indexes for performance
  CONSTRAINT product_audit_logs_product_company_idx UNIQUE (id, product_id, company_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_audit_logs_product_id ON product_audit_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_audit_logs_company_id ON product_audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_product_audit_logs_user_id ON product_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_product_audit_logs_action ON product_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_product_audit_logs_entity_type ON product_audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_product_audit_logs_created_at ON product_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_audit_logs_session_id ON product_audit_logs(session_id);

-- Enable Row Level Security
ALTER TABLE product_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view audit logs for their company products" ON product_audit_logs
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create audit logs for their company products" ON product_audit_logs
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Create function to get product audit statistics
CREATE OR REPLACE FUNCTION get_product_audit_stats(product_uuid UUID, company_uuid UUID)
RETURNS TABLE (
  total_entries BIGINT,
  total_users BIGINT,
  total_actions JSONB,
  total_entities JSONB,
  recent_activity BIGINT,
  average_session_duration NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as total_entries,
      COUNT(DISTINCT user_id) as total_users,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_activity,
      AVG(duration_seconds) as avg_duration
    FROM product_audit_logs
    WHERE product_id = product_uuid AND company_id = company_uuid
  ),
  action_counts AS (
    SELECT
      jsonb_object_agg(action, count) as action_stats
    FROM (
      SELECT action, COUNT(*) as count
      FROM product_audit_logs
      WHERE product_id = product_uuid AND company_id = company_uuid
      GROUP BY action
    ) action_data
  ),
  entity_counts AS (
    SELECT
      jsonb_object_agg(entity_type, count) as entity_stats
    FROM (
      SELECT entity_type, COUNT(*) as count
      FROM product_audit_logs
      WHERE product_id = product_uuid AND company_id = company_uuid
      GROUP BY entity_type
    ) entity_data
  )
  SELECT
    s.total_entries,
    s.total_users,
    COALESCE(ac.action_stats, '{}'::jsonb) as total_actions,
    COALESCE(ec.entity_stats, '{}'::jsonb) as total_entities,
    s.recent_activity,
    COALESCE(s.avg_duration, 0) as average_session_duration
  FROM stats s
  CROSS JOIN action_counts ac
  CROSS JOIN entity_counts ec;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT ON product_audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_audit_stats(UUID, UUID) TO authenticated;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'product_audit_logs' AND column_name = 'updated_at') THEN
    ALTER TABLE product_audit_logs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_product_audit_logs_updated_at ON product_audit_logs;
CREATE TRIGGER update_product_audit_logs_updated_at
  BEFORE UPDATE ON product_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 