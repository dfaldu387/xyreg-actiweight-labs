ALTER TABLE public.change_control_requests
  DROP CONSTRAINT IF EXISTS change_control_requests_owner_id_fkey;

ALTER TABLE public.change_control_requests
  ADD CONSTRAINT change_control_requests_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;