-- Create investor_deal_notes table for private investor notes and ratings
CREATE TABLE public.investor_deal_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_profile_id UUID NOT NULL REFERENCES public.investor_profiles(id) ON DELETE CASCADE,
  share_settings_id UUID NOT NULL REFERENCES public.company_investor_share_settings(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'watching', 'interested', 'passed', 'invested')),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(investor_profile_id, share_settings_id)
);

-- Enable Row Level Security
ALTER TABLE public.investor_deal_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - notes are 100% private to the investor who created them
CREATE POLICY "Investors can view their own deal notes"
ON public.investor_deal_notes
FOR SELECT
USING (
  investor_profile_id IN (
    SELECT id FROM public.investor_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Investors can create their own deal notes"
ON public.investor_deal_notes
FOR INSERT
WITH CHECK (
  investor_profile_id IN (
    SELECT id FROM public.investor_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Investors can update their own deal notes"
ON public.investor_deal_notes
FOR UPDATE
USING (
  investor_profile_id IN (
    SELECT id FROM public.investor_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Investors can delete their own deal notes"
ON public.investor_deal_notes
FOR DELETE
USING (
  investor_profile_id IN (
    SELECT id FROM public.investor_profiles WHERE user_id = auth.uid()
  )
);

-- Create index for efficient lookups
CREATE INDEX idx_investor_deal_notes_investor ON public.investor_deal_notes(investor_profile_id);
CREATE INDEX idx_investor_deal_notes_share_settings ON public.investor_deal_notes(share_settings_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_investor_deal_notes_updated_at
BEFORE UPDATE ON public.investor_deal_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();