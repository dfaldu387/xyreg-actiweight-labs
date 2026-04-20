-- Schedule nightly check of regulatory standard versions
-- Runs daily at 02:30 UTC, offset from the regulatory news scraper at 02:00.
-- Calls the `check-standard-status` edge function which polls ISO/IEC catalogues
-- (and national adoption pages like EVS/CEN) and updates `standard_version_status`.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any prior schedule with the same name to keep this idempotent
DO $$
BEGIN
  PERFORM cron.unschedule('check-standard-status-nightly');
EXCEPTION WHEN OTHERS THEN
  -- ignore if it doesn't exist
  NULL;
END $$;

SELECT cron.schedule(
  'check-standard-status-nightly',
  '30 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://wzzkbmmgxxrfhhxggrcl.supabase.co/functions/v1/check-standard-status',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6emtibW1neHhyZmhoeGdncmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTY1OTksImV4cCI6MjA2MDk3MjU5OX0.IILyYxMvAEyt5DrRWvF7NR0omsg2DKbhh5b-C4N73ME"}'::jsonb,
    body := jsonb_build_object('triggered_at', now())
  ) AS request_id;
  $$
);