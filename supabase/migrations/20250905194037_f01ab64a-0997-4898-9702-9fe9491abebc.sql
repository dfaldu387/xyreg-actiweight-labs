-- Enable RLS on remaining tables that are missing it based on the linter errors
-- These are the critical tables that need RLS enabled

-- Tables that handle audit and activity data
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Tables handling user profiles and company access
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_company_access ENABLE ROW LEVEL SECURITY;

-- Document-related tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Other product-related tables
ALTER TABLE public.product_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_instances ENABLE ROW LEVEL SECURITY;

-- Archived data table
ALTER TABLE public.archived_pms_data ENABLE ROW LEVEL SECURITY;