-- First, drop existing partial tables to recreate cleanly
DROP TABLE IF EXISTS public.investor_view_logs;
DROP TABLE IF EXISTS public.investor_profiles;

-- Create investor_profiles table for validated investor information
CREATE TABLE public.investor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT,
  linkedin_url TEXT NOT NULL,
  investment_focus TEXT[] DEFAULT '{}',
  typical_check_size TEXT,
  accredited_self_cert BOOLEAN DEFAULT false,
  verification_tier TEXT DEFAULT 'pending' CHECK (verification_tier IN ('pending', 'tier1', 'tier2', 'verified')),
  verified_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create investor_view_logs table to track which investors viewed which startups
CREATE TABLE public.investor_view_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_profile_id UUID REFERENCES public.investor_profiles NOT NULL,
  share_settings_id UUID REFERENCES public.company_investor_share_settings NOT NULL,
  company_id UUID REFERENCES public.companies NOT NULL,
  product_id UUID REFERENCES public.products,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  view_duration_seconds INTEGER
);

-- Add marketplace columns to company_investor_share_settings (may already exist, use IF NOT EXISTS)
ALTER TABLE public.company_investor_share_settings
ADD COLUMN IF NOT EXISTS list_on_marketplace BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marketplace_listed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS marketplace_categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_view_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for investor_profiles
CREATE POLICY "Users can view their own investor profile"
ON public.investor_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investor profile"
ON public.investor_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investor profile"
ON public.investor_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for investor_view_logs
CREATE POLICY "Investors can insert their own view logs"
ON public.investor_view_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.investor_profiles ip
    WHERE ip.id = investor_profile_id AND ip.user_id = auth.uid()
  )
);

CREATE POLICY "Companies can view logs for their listings"
ON public.investor_view_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_investor_share_settings ciss
    JOIN public.user_company_access uca ON uca.company_id = ciss.company_id
    WHERE ciss.id = share_settings_id AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Investors can view their own view history"
ON public.investor_view_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.investor_profiles ip
    WHERE ip.id = investor_profile_id AND ip.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_investor_profiles_user_id ON public.investor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_verification_tier ON public.investor_profiles(verification_tier);
CREATE INDEX IF NOT EXISTS idx_investor_view_logs_share_settings ON public.investor_view_logs(share_settings_id);
CREATE INDEX IF NOT EXISTS idx_investor_view_logs_investor ON public.investor_view_logs(investor_profile_id);
CREATE INDEX IF NOT EXISTS idx_share_settings_marketplace ON public.company_investor_share_settings(list_on_marketplace) WHERE list_on_marketplace = true;

-- Update timestamp trigger for investor_profiles
CREATE TRIGGER update_investor_profiles_updated_at
BEFORE UPDATE ON public.investor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();