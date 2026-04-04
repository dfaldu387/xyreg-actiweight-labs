-- Create enum for study types
CREATE TYPE clinical_study_type AS ENUM ('feasibility', 'pivotal', 'pmcf', 'registry', 'other');

-- Create enum for endpoint types
CREATE TYPE clinical_endpoint_type AS ENUM ('primary', 'secondary');

-- Create enum for notification trigger events
CREATE TYPE clinical_notification_trigger AS ENUM (
  'ethics_approval', 
  'enrollment_milestone', 
  'behind_schedule', 
  'safety_report_due',
  'regulatory_deadline'
);

-- 1. Study Type Configurations Table
CREATE TABLE clinical_study_type_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  study_type clinical_study_type NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  default_min_enrollment INTEGER,
  default_max_enrollment INTEGER,
  typical_timeline_months INTEGER,
  required_documents JSONB DEFAULT '[]'::jsonb,
  phase_progression_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, study_type)
);

-- 2. Standard Endpoints Library Table
CREATE TABLE clinical_standard_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  endpoint_type clinical_endpoint_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  measurement_criteria TEXT,
  category TEXT,
  regulatory_references JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CRO Partner Library Table
CREATE TABLE clinical_cro_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  specialty_areas TEXT[],
  standard_agreement_path TEXT,
  performance_notes TEXT,
  is_preferred BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Clinical Site Registry Table
CREATE TABLE clinical_site_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  location TEXT NOT NULL,
  pi_name TEXT,
  pi_email TEXT,
  pi_phone TEXT,
  specialty TEXT,
  capabilities TEXT[],
  qualification_status TEXT CHECK (qualification_status IN ('qualified', 'pending', 'inactive')),
  previous_trials_count INTEGER DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Protocol Templates Table
CREATE TABLE clinical_protocol_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  study_type clinical_study_type,
  file_path TEXT NOT NULL,
  required_sections JSONB DEFAULT '[]'::jsonb,
  approval_workflow JSONB DEFAULT '{}'::jsonb,
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Documentation Templates Table
CREATE TABLE clinical_documentation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL CHECK (template_type IN ('CEP', 'CER', 'consent_form', 'study_report', 'ethics_submission')),
  template_name TEXT NOT NULL,
  study_type clinical_study_type,
  region TEXT,
  file_path TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Notification Rules Table
CREATE TABLE clinical_notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  trigger_event clinical_notification_trigger NOT NULL,
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  notification_recipients JSONB DEFAULT '[]'::jsonb,
  notification_message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Update clinical_trials table to reference company settings
ALTER TABLE clinical_trials
  ADD COLUMN study_type_config_id UUID REFERENCES clinical_study_type_configs(id),
  ADD COLUMN primary_endpoint_id UUID REFERENCES clinical_standard_endpoints(id),
  ADD COLUMN cro_partner_id UUID REFERENCES clinical_cro_partners(id),
  ADD COLUMN site_ids JSONB DEFAULT '[]'::jsonb;

-- Create indexes for better query performance
CREATE INDEX idx_study_type_configs_company ON clinical_study_type_configs(company_id);
CREATE INDEX idx_standard_endpoints_company ON clinical_standard_endpoints(company_id);
CREATE INDEX idx_standard_endpoints_type ON clinical_standard_endpoints(endpoint_type);
CREATE INDEX idx_cro_partners_company ON clinical_cro_partners(company_id);
CREATE INDEX idx_site_registry_company ON clinical_site_registry(company_id);
CREATE INDEX idx_protocol_templates_company ON clinical_protocol_templates(company_id);
CREATE INDEX idx_documentation_templates_company ON clinical_documentation_templates(company_id);
CREATE INDEX idx_notification_rules_company ON clinical_notification_rules(company_id);

-- Add updated_at triggers for all new tables
CREATE TRIGGER update_study_type_configs_updated_at
  BEFORE UPDATE ON clinical_study_type_configs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_standard_endpoints_updated_at
  BEFORE UPDATE ON clinical_standard_endpoints
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_cro_partners_updated_at
  BEFORE UPDATE ON clinical_cro_partners
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_site_registry_updated_at
  BEFORE UPDATE ON clinical_site_registry
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_protocol_templates_updated_at
  BEFORE UPDATE ON clinical_protocol_templates
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_documentation_templates_updated_at
  BEFORE UPDATE ON clinical_documentation_templates
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_notification_rules_updated_at
  BEFORE UPDATE ON clinical_notification_rules
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS on all new tables
ALTER TABLE clinical_study_type_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_standard_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_cro_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_site_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_protocol_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_documentation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notification_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clinical_study_type_configs
CREATE POLICY "Users can view study type configs for their companies"
  ON clinical_study_type_configs FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins and editors can manage study type configs"
  ON clinical_study_type_configs FOR ALL
  USING (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ))
  WITH CHECK (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));

-- RLS Policies for clinical_standard_endpoints
CREATE POLICY "Users can view standard endpoints for their companies"
  ON clinical_standard_endpoints FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins and editors can manage standard endpoints"
  ON clinical_standard_endpoints FOR ALL
  USING (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ))
  WITH CHECK (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));

-- RLS Policies for clinical_cro_partners
CREATE POLICY "Users can view CRO partners for their companies"
  ON clinical_cro_partners FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins and editors can manage CRO partners"
  ON clinical_cro_partners FOR ALL
  USING (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ))
  WITH CHECK (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));

-- RLS Policies for clinical_site_registry
CREATE POLICY "Users can view clinical sites for their companies"
  ON clinical_site_registry FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins and editors can manage clinical sites"
  ON clinical_site_registry FOR ALL
  USING (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ))
  WITH CHECK (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));

-- RLS Policies for clinical_protocol_templates
CREATE POLICY "Users can view protocol templates for their companies"
  ON clinical_protocol_templates FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins and editors can manage protocol templates"
  ON clinical_protocol_templates FOR ALL
  USING (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ))
  WITH CHECK (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));

-- RLS Policies for clinical_documentation_templates
CREATE POLICY "Users can view documentation templates for their companies"
  ON clinical_documentation_templates FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins and editors can manage documentation templates"
  ON clinical_documentation_templates FOR ALL
  USING (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ))
  WITH CHECK (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));

-- RLS Policies for clinical_notification_rules
CREATE POLICY "Users can view notification rules for their companies"
  ON clinical_notification_rules FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins and editors can manage notification rules"
  ON clinical_notification_rules FOR ALL
  USING (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ))
  WITH CHECK (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));