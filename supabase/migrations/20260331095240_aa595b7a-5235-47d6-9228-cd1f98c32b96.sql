ALTER TABLE public.feedback_submissions
ADD COLUMN IF NOT EXISTS screenshot_urls text[] DEFAULT '{}';