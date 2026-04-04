-- Update subscription_plans table with new plan structure
-- Clear existing plans and create new ones based on the feature matrix

-- First, deactivate all existing plans
UPDATE subscription_plans SET is_active = false;

-- Insert MVP (Core Build) plan
INSERT INTO subscription_plans (
  name,
  description,
  stripe_product_id,
  stripe_price_id,
  price,
  currency,
  interval,
  is_active,
  is_featured,
  sort_order,
  features
) VALUES (
  'MVP (Core Build)',
  'Essential features to get started with medical device compliance',
  'prod_mvp_core_build',
  'price_mvp_core_build',
  0.00,
  'USD',
  'month',
  true,
  false,
  1,
  '[
    "1 Company Workspace",
    "Up to 3 Users",
    "1 New Product",
    "User Roles (Admin, Editor, Viewer)",
    "Custom Lifecycle Phases",
    "Product Dashboard & KPI Overview",
    "Unlimited Document Management",
    "1 Gap Analysis Framework (MDR Annex I)",
    "Up to 3 Audit Templates",
    "Up to 5 Activity Templates",
    "Notified Body Selector",
    "Unlimited Markets",
    "Basic Project Timelines",
    "Basic Company Settings",
    "User Management"
  ]'::jsonb
) ON CONFLICT (stripe_product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- Insert Basic Plan
INSERT INTO subscription_plans (
  name,
  description,
  stripe_product_id,
  stripe_price_id,
  price,
  currency,
  interval,
  is_active,
  is_featured,
  sort_order,
  features
) VALUES (
  'Basic Plan',
  'Perfect for small teams getting started with compliance management',
  'prod_basic_plan',
  'price_basic_plan',
  49.00,
  'USD',
  'month',
  true,
  false,
  2,
  '[
    "1 Company Workspace",
    "Up to 10 Users",
    "1 New Product",
    "User Roles (Admin, Editor, Viewer)",
    "Commenting on CIs",
    "Reviewer Groups",
    "Product Upgrades & Line Extensions",
    "Custom Lifecycle Phases",
    "Product Dashboard & KPI Overview",
    "Unlimited Document Management",
    "1 Gap Analysis Framework (MDR Annex I)",
    "Up to 5 Audit Templates",
    "Up to 10 Activity Templates",
    "Company-level CI Templates",
    "Notified Body Selector",
    "1 Market",
    "Basic Project Timelines",
    "Basic Company Settings",
    "User Management",
    "Comprehensive Audit Log",
    "CSV Import/Export"
  ]'::jsonb
) ON CONFLICT (stripe_product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- Insert Pro Plan
INSERT INTO subscription_plans (
  name,
  description,
  stripe_product_id,
  stripe_price_id,
  price,
  currency,
  interval,
  is_active,
  is_featured,
  sort_order,
  features
) VALUES (
  'Pro Plan',
  'Advanced features for growing medical device companies',
  'prod_pro_plan',
  'price_pro_plan',
  149.00,
  'USD',
  'month',
  true,
  true,
  3,
  '[
    "1 Company Workspace",
    "Up to 25 Users",
    "Up to 5 New Products",
    "User Roles (Admin, Editor, Viewer)",
    "Commenting on CIs",
    "Reviewer Groups",
    "Multi-Company Client Compass",
    "Product Upgrades & Line Extensions",
    "Custom Lifecycle Phases",
    "Product Dashboard & KPI Overview",
    "Unlimited Document Management",
    "Up to 5 Gap Analysis Frameworks",
    "Up to 20 Audit Templates",
    "Up to 50 Activity Templates",
    "Company-level CI Templates",
    "Notified Body Selector",
    "Intelligent Classification Engine",
    "Up to 3 Markets",
    "Basic Project Timelines",
    "Risk-Adjusted NPV (rNPV) Module",
    "Basic Company Settings",
    "User Management",
    "Comprehensive Audit Log",
    "CSV Import/Export"
  ]'::jsonb
) ON CONFLICT (stripe_product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- Insert Enterprise Plan
INSERT INTO subscription_plans (
  name,
  description,
  stripe_product_id,
  stripe_price_id,
  price,
  currency,
  interval,
  is_active,
  is_featured,
  sort_order,
  features
) VALUES (
  'Enterprise Plan',
  'Complete solution for large organizations with custom needs',
  'prod_enterprise_plan',
  'price_enterprise_plan',
  499.00,
  'USD',
  'month',
  true,
  false,
  4,
  '[
    "Unlimited Company Workspaces",
    "Unlimited Users",
    "Unlimited New Products",
    "User Roles (Admin, Editor, Viewer)",
    "Commenting on CIs",
    "Reviewer Groups",
    "Multi-Company Client Compass",
    "Product Upgrades & Line Extensions",
    "Custom Lifecycle Phases",
    "Product Dashboard & KPI Overview",
    "Unlimited Document Management",
    "Unlimited Gap Analysis Frameworks",
    "Unlimited Audit Templates",
    "Unlimited Activity Templates",
    "Company-level CI Templates",
    "Notified Body Selector",
    "Intelligent Classification Engine",
    "Unlimited Markets",
    "Basic Project Timelines",
    "Risk-Adjusted NPV (rNPV) Module",
    "Basic Company Settings",
    "User Management",
    "Comprehensive Audit Log",
    "CSV Import/Export",
    "API Access & Custom Integrations",
    "White-Labeling for Consultants"
  ]'::jsonb
) ON CONFLICT (stripe_product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;