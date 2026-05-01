-- 1. Convert existing Archived threads to Closed
UPDATE public.communication_threads
SET status = 'Closed'
WHERE status = 'Archived';

-- 2. Drop the existing check constraint (if any) and recreate with the simplified set
ALTER TABLE public.communication_threads
  DROP CONSTRAINT IF EXISTS communication_threads_status_check;

ALTER TABLE public.communication_threads
  ADD CONSTRAINT communication_threads_status_check
  CHECK (status IN ('Active', 'Awaiting Response', 'Closed'));