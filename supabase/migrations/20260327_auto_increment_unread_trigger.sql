-- Trigger function: automatically increment unread_count when a message is inserted
CREATE OR REPLACE FUNCTION public.auto_increment_unread_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE thread_participants
  SET unread_count = COALESCE(unread_count, 0) + 1
  WHERE thread_id = NEW.thread_id
    AND user_id != NEW.sender_user_id;

  -- Also update thread last_activity_at
  UPDATE communication_threads
  SET last_activity_at = NOW()
  WHERE id = NEW.thread_id;

  RETURN NEW;
END;
$$;

-- Create trigger on communication_messages
DROP TRIGGER IF EXISTS trg_auto_increment_unread ON public.communication_messages;

CREATE TRIGGER trg_auto_increment_unread
  AFTER INSERT ON public.communication_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_increment_unread_on_message();
