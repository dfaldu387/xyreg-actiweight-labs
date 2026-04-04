-- Add enhanced categorization fields to market_reports table
ALTER TABLE market_reports 
ADD COLUMN IF NOT EXISTS product_focus_areas text[],
ADD COLUMN IF NOT EXISTS market_segments text[],
ADD COLUMN IF NOT EXISTS competitive_landscape_type text,
ADD COLUMN IF NOT EXISTS report_category text;

-- Create saved queries table for enhanced search functionality
CREATE TABLE IF NOT EXISTS saved_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  query_name text NOT NULL,
  query_text text NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create report analytics table for usage tracking
CREATE TABLE IF NOT EXISTS report_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES market_reports(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action_type text NOT NULL, -- 'view', 'download', 'search', 'time_spent'
  action_details jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Create contextual suggestions table for AI-driven cross-module links
CREATE TABLE IF NOT EXISTS contextual_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES market_reports(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  suggestion_type text NOT NULL, -- 'product_requirement', 'risk_management', 'commercial_strategy', 'activity'
  title text NOT NULL,
  description text NOT NULL,
  target_module text NOT NULL,
  suggested_action jsonb NOT NULL,
  confidence_score decimal(3,2) DEFAULT 0.5,
  is_actioned boolean DEFAULT false,
  actioned_at timestamp with time zone,
  actioned_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies for saved_queries
ALTER TABLE saved_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their saved queries"
ON saved_queries
FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

-- Add RLS policies for report_analytics
ALTER TABLE report_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics for their companies"
ON report_analytics
FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

-- Add RLS policies for contextual_suggestions
ALTER TABLE contextual_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suggestions for their companies"
ON contextual_suggestions
FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_reports_category ON market_reports(report_category);
CREATE INDEX IF NOT EXISTS idx_market_reports_focus_areas ON market_reports USING GIN(product_focus_areas);
CREATE INDEX IF NOT EXISTS idx_saved_queries_company_user ON saved_queries(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_report_analytics_report_action ON report_analytics(report_id, action_type);
CREATE INDEX IF NOT EXISTS idx_contextual_suggestions_report ON contextual_suggestions(report_id, suggestion_type);

-- Add a function to update timestamps
CREATE OR REPLACE FUNCTION update_saved_queries_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for saved_queries timestamp updates
DROP TRIGGER IF EXISTS update_saved_queries_timestamp ON saved_queries;
CREATE TRIGGER update_saved_queries_timestamp
  BEFORE UPDATE ON saved_queries
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_queries_timestamp();