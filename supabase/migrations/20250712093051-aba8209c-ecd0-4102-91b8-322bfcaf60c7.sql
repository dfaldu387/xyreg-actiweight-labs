-- Create gap_activity_links table to complete the CI linking pattern
CREATE TABLE public.gap_activity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gap_item_id UUID NOT NULL REFERENCES public.gap_analysis_items(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(gap_item_id, activity_id)
);

-- Enable RLS on gap_activity_links
ALTER TABLE public.gap_activity_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for gap_activity_links
CREATE POLICY "Users can view gap activity links for accessible products" 
ON public.gap_activity_links FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM gap_analysis_items gai
    JOIN products p ON p.id = gai.product_id
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE gai.id = gap_activity_links.gap_item_id 
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert gap activity links for accessible products" 
ON public.gap_activity_links FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM gap_analysis_items gai
    JOIN products p ON p.id = gai.product_id
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE gai.id = gap_activity_links.gap_item_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can update gap activity links for accessible products" 
ON public.gap_activity_links FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM gap_analysis_items gai
    JOIN products p ON p.id = gai.product_id
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE gai.id = gap_activity_links.gap_item_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can delete gap activity links for accessible products" 
ON public.gap_activity_links FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM gap_analysis_items gai
    JOIN products p ON p.id = gai.product_id
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE gai.id = gap_activity_links.gap_item_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_gap_activity_links_updated_at
  BEFORE UPDATE ON public.gap_activity_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();