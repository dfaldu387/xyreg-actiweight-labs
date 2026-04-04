-- Update plan_features table with comprehensive feature limits based on the new plan structure
-- This replaces starter/professional/enterprise with mvp/basic/pro/enterprise

-- First, clear existing plan features
DELETE FROM public.plan_features;

-- Insert MVP (Core Build) plan features
INSERT INTO public.plan_features (plan_key, max_products, max_users, max_companies, features) VALUES
(
  'mvp',
  1, -- Number of New Products: 1
  3, -- Number of Users: 3
  1, -- Company Workspace: 1
  '{
    "user_accounts_auth": true,
    "user_roles": true,
    "commenting_on_cis": true,
    "custom_lifecycle_phases": true,
    "product_dashboard_kpi": true,
    "document_management": "unlimited",
    "gap_analysis_frameworks": 1,
    "gap_analysis_mdr_annex_i": true,
    "audit_templates": 3,
    "activity_templates": 5,
    "notified_body_selector": true,
    "markets": "unlimited",
    "basic_project_timelines": true,
    "basic_company_settings": true,
    "user_management": true,
    "reviewer_groups": false,
    "multi_company_client_compass": false,
    "product_upgrades_line_extensions": false,
    "company_level_ci_templates": false,
    "intelligent_classification_engine": false,
    "rnpv_module": false,
    "comprehensive_audit_log": false,
    "csv_import_export": false,
    "api_access_custom_integrations": false,
    "white_labeling_consultants": false
  }'::jsonb
);

-- Insert Basic Plan features
INSERT INTO public.plan_features (plan_key, max_products, max_users, max_companies, features) VALUES
(
  'basic',
  1, -- Number of New Products: 1
  10, -- Number of Users: Up to 10
  1, -- Company Workspace: 1
  '{
    "user_accounts_auth": true,
    "user_roles": true,
    "commenting_on_cis": true,
    "reviewer_groups": true,
    "custom_lifecycle_phases": true,
    "product_dashboard_kpi": true,
    "product_upgrades_line_extensions": true,
    "document_management": "unlimited",
    "gap_analysis_frameworks": 1,
    "gap_analysis_mdr_annex_i": true,
    "audit_templates": 5,
    "activity_templates": 10,
    "company_level_ci_templates": true,
    "notified_body_selector": true,
    "markets": 1,
    "basic_project_timelines": true,
    "basic_company_settings": true,
    "user_management": true,
    "comprehensive_audit_log": true,
    "csv_import_export": true,
    "multi_company_client_compass": false,
    "intelligent_classification_engine": false,
    "rnpv_module": false,
    "api_access_custom_integrations": false,
    "white_labeling_consultants": false
  }'::jsonb
);

-- Insert Pro Plan features
INSERT INTO public.plan_features (plan_key, max_products, max_users, max_companies, features) VALUES
(
  'pro',
  5, -- Number of New Products: Up to 5
  25, -- Number of Users: Up to 25
  1, -- Company Workspace: 1 (multi-company via Client Compass feature)
  '{
    "user_accounts_auth": true,
    "user_roles": true,
    "commenting_on_cis": true,
    "reviewer_groups": true,
    "multi_company_client_compass": true,
    "custom_lifecycle_phases": true,
    "product_dashboard_kpi": true,
    "product_upgrades_line_extensions": true,
    "document_management": "unlimited",
    "gap_analysis_frameworks": 5,
    "gap_analysis_mdr_annex_i": true,
    "audit_templates": 20,
    "activity_templates": 50,
    "company_level_ci_templates": true,
    "notified_body_selector": true,
    "intelligent_classification_engine": true,
    "markets": 3,
    "basic_project_timelines": true,
    "rnpv_module": true,
    "basic_company_settings": true,
    "user_management": true,
    "comprehensive_audit_log": true,
    "csv_import_export": true,
    "api_access_custom_integrations": false,
    "white_labeling_consultants": false
  }'::jsonb
);

-- Insert Enterprise Plan features
INSERT INTO public.plan_features (plan_key, max_products, max_users, max_companies, features) VALUES
(
  'enterprise',
  -1, -- Number of New Products: Unlimited
  -1, -- Number of Users: Unlimited
  -1, -- Company Workspace: Unlimited
  '{
    "user_accounts_auth": true,
    "user_roles": true,
    "commenting_on_cis": true,
    "reviewer_groups": true,
    "multi_company_client_compass": true,
    "custom_lifecycle_phases": true,
    "product_dashboard_kpi": true,
    "product_upgrades_line_extensions": true,
    "document_management": "unlimited",
    "gap_analysis_frameworks": "unlimited",
    "gap_analysis_mdr_annex_i": true,
    "audit_templates": "unlimited",
    "activity_templates": "unlimited",
    "company_level_ci_templates": true,
    "notified_body_selector": true,
    "intelligent_classification_engine": true,
    "markets": "unlimited",
    "basic_project_timelines": true,
    "rnpv_module": true,
    "basic_company_settings": true,
    "user_management": true,
    "comprehensive_audit_log": true,
    "csv_import_export": true,
    "api_access_custom_integrations": true,
    "white_labeling_consultants": true
  }'::jsonb
);