-- Function to increment unread_count for other participants in a thread
-- Uses SECURITY DEFINER to bypass RLS (a user can't update other users' participant rows)
CREATE OR REPLACE FUNCTION public.increment_thread_unread(
  _thread_id uuid,
  _sender_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE thread_participants
  SET unread_count = COALESCE(unread_count, 0) + 1
  WHERE thread_id = _thread_id
    AND user_id != _sender_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_thread_unread FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_thread_unread TO authenticated;
