-- Create feedback_submissions table
CREATE TABLE public.feedback_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES public.companies(id),
  type TEXT NOT NULL CHECK (type IN ('bug_report', 'improvement_suggestion')),
  title TEXT NOT NULL,
  description TEXT,
  screenshot_url TEXT,
  page_url TEXT,
  user_agent TEXT,
  screen_resolution TEXT,
  viewport_size TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create feedback for their companies" 
ON public.feedback_submissions 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  company_id IN (
    SELECT company_id 
    FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view feedback for their companies" 
ON public.feedback_submissions 
FOR SELECT 
USING (
  company_id IN (
    SELECT company_id 
    FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update feedback for their companies" 
ON public.feedback_submissions 
FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id 
    FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level = 'admin'
  )
);

-- Create storage bucket for feedback screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('feedback-screenshots', 'feedback-screenshots', true);

-- Create storage policies
CREATE POLICY "Users can upload feedback screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'feedback-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view feedback screenshots" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'feedback-screenshots');

-- Create trigger for updated_at
CREATE TRIGGER update_feedback_submissions_updated_at
  BEFORE UPDATE ON public.feedback_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();