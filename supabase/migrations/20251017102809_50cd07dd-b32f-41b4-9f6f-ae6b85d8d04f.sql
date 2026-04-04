-- Create PMS activity templates table
CREATE TABLE IF NOT EXISTS pms_activity_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  market_code TEXT NOT NULL,
  device_class TEXT,
  activity_name TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('event-based', 'periodic', 'continuous')),
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'bi-annually', 'annually', 'on-demand')),
  days_before_report INTEGER,
  description TEXT,
  regulatory_reference TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  checklist_items JSONB DEFAULT '[]'::jsonb,
  document_templates JSONB DEFAULT '[]'::jsonb,
  is_system_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create PMS activity tracking table
CREATE TABLE IF NOT EXISTS pms_activity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  market_code TEXT NOT NULL,
  activity_template_id UUID REFERENCES pms_activity_templates(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  due_date DATE,
  completion_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'complete', 'overdue', 'not_applicable')),
  completed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  related_documents JSONB DEFAULT '[]'::jsonb,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add new fields to pms_reports
ALTER TABLE pms_reports 
ADD COLUMN IF NOT EXISTS checklist_completion_percentage INTEGER DEFAULT 0 CHECK (checklist_completion_percentage >= 0 AND checklist_completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS preparation_start_date DATE,
ADD COLUMN IF NOT EXISTS review_date DATE,
ADD COLUMN IF NOT EXISTS approval_date DATE,
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pms_activity_templates_market ON pms_activity_templates(market_code);
CREATE INDEX IF NOT EXISTS idx_pms_activity_templates_company ON pms_activity_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_pms_activity_tracking_product ON pms_activity_tracking(product_id);
CREATE INDEX IF NOT EXISTS idx_pms_activity_tracking_status ON pms_activity_tracking(status);
CREATE INDEX IF NOT EXISTS idx_pms_activity_tracking_due_date ON pms_activity_tracking(due_date);

-- Add updated_at triggers
CREATE TRIGGER set_pms_activity_templates_updated_at
  BEFORE UPDATE ON pms_activity_templates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_pms_activity_tracking_updated_at
  BEFORE UPDATE ON pms_activity_tracking
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Enable RLS
ALTER TABLE pms_activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_activity_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pms_activity_templates
CREATE POLICY "Users can view templates for their companies or system templates"
  ON pms_activity_templates FOR SELECT
  USING (
    is_system_template = true 
    OR company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and editors can create templates"
  ON pms_activity_templates FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins and editors can update their templates"
  ON pms_activity_templates FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins and editors can delete their templates"
  ON pms_activity_templates FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  );

-- RLS Policies for pms_activity_tracking
CREATE POLICY "Users can view activity tracking for their companies"
  ON pms_activity_tracking FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can create activity tracking"
  ON pms_activity_tracking FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Editors can update activity tracking"
  ON pms_activity_tracking FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor', 'viewer')
    )
  );

CREATE POLICY "Admins and editors can delete activity tracking"
  ON pms_activity_tracking FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  );

-- Insert system templates for EU MDR Class III
INSERT INTO pms_activity_templates (market_code, device_class, activity_name, activity_type, frequency, days_before_report, description, regulatory_reference, is_mandatory, is_system_template, checklist_items)
VALUES 
  ('EU', 'III', 'Sales Data Collection', 'periodic', 'quarterly', 90, 'Collect and analyze quarterly sales and distribution data', 'MDR 2017/745 Article 83', true, true, 
   '[{"item": "Collect Q1 sales data", "completed": false}, {"item": "Collect Q2 sales data", "completed": false}, {"item": "Collect Q3 sales data", "completed": false}, {"item": "Collect Q4 sales data", "completed": false}]'::jsonb),
  
  ('EU', 'III', 'Complaint Analysis', 'periodic', 'monthly', 30, 'Review and analyze all complaints received', 'MDR 2017/745 Article 83', true, true,
   '[{"item": "Review complaints received", "completed": false}, {"item": "Categorize by type and severity", "completed": false}, {"item": "Trend analysis", "completed": false}, {"item": "Document findings", "completed": false}]'::jsonb),
  
  ('EU', 'III', 'Literature Review', 'periodic', 'bi-annually', 180, 'Systematic literature search and review', 'MDR 2017/745 Article 83', true, true,
   '[{"item": "PubMed search conducted", "completed": false}, {"item": "Embase search conducted", "completed": false}, {"item": "Relevant articles analyzed", "completed": false}, {"item": "Literature review report created", "completed": false}]'::jsonb),
  
  ('EU', 'III', 'Adverse Event Review', 'periodic', 'monthly', 30, 'Review and document all adverse events', 'MDR 2017/745 Article 87', true, true,
   '[{"item": "Review all reported adverse events", "completed": false}, {"item": "Categorize by severity", "completed": false}, {"item": "Verify reporting to authorities", "completed": false}, {"item": "Update risk assessment", "completed": false}]'::jsonb),
  
  ('EU', 'III', 'PSUR Preparation', 'periodic', 'annually', 90, 'Prepare and submit Periodic Safety Update Report', 'MDR 2017/745 Article 86', true, true,
   '[{"item": "Executive summary drafted", "completed": false}, {"item": "Sales/distribution section complete", "completed": false}, {"item": "Complaints section complete", "completed": false}, {"item": "Adverse events section complete", "completed": false}, {"item": "Risk-benefit analysis updated", "completed": false}, {"item": "Conclusions drafted", "completed": false}, {"item": "Quality review complete", "completed": false}, {"item": "Management approval obtained", "completed": false}, {"item": "Submission to Notified Body", "completed": false}]'::jsonb),
  
  ('EU', 'III', 'Serious Incident Reporting', 'event-based', 'on-demand', null, 'Report serious incidents to authorities within required timeframes', 'MDR 2017/745 Article 87', true, true,
   '[{"item": "Incident documented within 24h", "completed": false}, {"item": "Initial notification sent (15 days)", "completed": false}, {"item": "Investigation conducted", "completed": false}, {"item": "Final report submitted", "completed": false}]'::jsonb);

-- Insert system templates for FDA Class III
INSERT INTO pms_activity_templates (market_code, device_class, activity_name, activity_type, frequency, days_before_report, description, regulatory_reference, is_mandatory, is_system_template, checklist_items)
VALUES 
  ('US', 'III', 'MDR Report Monitoring', 'periodic', 'monthly', 30, 'Monitor and submit Medical Device Reports', '21 CFR Part 803', true, true,
   '[{"item": "Review all reportable events", "completed": false}, {"item": "Submit 5-day reports (deaths)", "completed": false}, {"item": "Submit 30-day reports (serious injuries)", "completed": false}, {"item": "Maintain MDR log", "completed": false}]'::jsonb),
  
  ('US', 'III', 'Annual Report Preparation', 'periodic', 'annually', 120, 'Prepare PMA Annual Report', '21 CFR Part 814', true, true,
   '[{"item": "Patient exposure data compiled", "completed": false}, {"item": "MDR summary prepared", "completed": false}, {"item": "Distribution data collected", "completed": false}, {"item": "Clinical study updates included", "completed": false}, {"item": "Manufacturing changes documented", "completed": false}, {"item": "Bibliography prepared", "completed": false}, {"item": "Quality review complete", "completed": false}, {"item": "Submit to FDA", "completed": false}]'::jsonb),
  
  ('US', 'III', '522 Study Monitoring', 'periodic', 'quarterly', 90, 'Monitor 522 postmarket surveillance study if applicable', '21 CFR Part 522', false, true,
   '[{"item": "Enrollment progress reviewed", "completed": false}, {"item": "Data collection on track", "completed": false}, {"item": "Interim analysis if required", "completed": false}, {"item": "Progress report submitted", "completed": false}]'::jsonb);

-- Insert system templates for Canada Class IV
INSERT INTO pms_activity_templates (market_code, device_class, activity_name, activity_type, frequency, days_before_report, description, regulatory_reference, is_mandatory, is_system_template, checklist_items)
VALUES 
  ('CA', 'IV', 'Mandatory Incident Reports', 'event-based', 'on-demand', null, 'Report mandatory incidents to Health Canada', 'MDR Regulations SOR/2019-201', true, true,
   '[{"item": "Incident documented", "completed": false}, {"item": "Initial report (10 days for deaths)", "completed": false}, {"item": "Follow-up report (30 days)", "completed": false}, {"item": "Final report with CAPA", "completed": false}]'::jsonb),
  
  ('CA', 'IV', 'Periodic Safety Update', 'periodic', 'annually', 90, 'Prepare annual safety update', 'CMDCAS ISO 13485:2016', true, true,
   '[{"item": "Incident summary prepared", "completed": false}, {"item": "Device problem reports analyzed", "completed": false}, {"item": "Risk assessment updated", "completed": false}, {"item": "Submit to Health Canada", "completed": false}]'::jsonb);