-- Enable RLS on phase-related tables that have policies but no RLS enabled
ALTER TABLE public.company_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_chosen_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifecycle_phases ENABLE ROW LEVEL SECURITY;

-- Also enable RLS on any other critical tables that might be missing it
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;