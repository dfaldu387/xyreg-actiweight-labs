-- Add video attachment support to feedback submissions.
-- Single text[] column so the UI can attach multiple uploaded files OR
-- in-browser screen recordings without a parallel "primary" column.

ALTER TABLE public.feedback_submissions
  ADD COLUMN IF NOT EXISTS videos_url TEXT[] DEFAULT '{}';

-- Dedicated bucket so we can apply video-specific size + MIME limits without
-- relaxing the screenshot bucket. Public read so links in the admin Feedback
-- Tracker resolve without signed URLs (mirrors feedback-screenshots).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-videos',
  'feedback-videos',
  true,
  104857600,                                    -- 100 MB per file
  ARRAY['video/webm', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE
SET file_size_limit  = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    public            = EXCLUDED.public;

-- RLS: same shape as the screenshot bucket — users can only write into a
-- folder named after their own auth.uid; reads are public.
CREATE POLICY "Users can upload feedback videos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'feedback-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view feedback videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'feedback-videos');

CREATE POLICY "Users can delete own feedback videos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'feedback-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
