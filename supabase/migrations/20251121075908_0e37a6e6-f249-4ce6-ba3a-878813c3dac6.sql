-- Create product-specific venture blueprint data table
CREATE TABLE IF NOT EXISTS product_venture_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  activity_notes JSONB DEFAULT '{}'::jsonb,
  activity_files JSONB DEFAULT '{}'::jsonb,
  completed_activities INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id)
);

-- Create product blueprint comments table
CREATE TABLE IF NOT EXISTS product_blueprint_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  activity_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_venture_blueprints_product ON product_venture_blueprints(product_id);
CREATE INDEX IF NOT EXISTS idx_product_venture_blueprints_company ON product_venture_blueprints(company_id);
CREATE INDEX IF NOT EXISTS idx_product_blueprint_comments_product ON product_blueprint_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_blueprint_comments_activity ON product_blueprint_comments(activity_id);

-- Enable Row Level Security
ALTER TABLE product_venture_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_blueprint_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_venture_blueprints
CREATE POLICY "Users can view blueprints for their company products"
  ON product_venture_blueprints FOR SELECT
  USING (true);

CREATE POLICY "Users can insert blueprints for their company products"
  ON product_venture_blueprints FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update blueprints for their company products"
  ON product_venture_blueprints FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete blueprints for their company products"
  ON product_venture_blueprints FOR DELETE
  USING (true);

-- RLS Policies for product_blueprint_comments
CREATE POLICY "Users can view comments for their company products"
  ON product_blueprint_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert comments for their company products"
  ON product_blueprint_comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own comments"
  ON product_blueprint_comments FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own comments"
  ON product_blueprint_comments FOR DELETE
  USING (true);