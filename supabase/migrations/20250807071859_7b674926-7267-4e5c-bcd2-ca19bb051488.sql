-- Add admin approval fields to gap_analysis_items table
ALTER TABLE public.gap_analysis_items 
ADD COLUMN admin_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN admin_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN admin_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN admin_comments TEXT;