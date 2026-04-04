-- 1. Create security definer function to check thread membership (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_thread_participant(_user_id uuid, _thread_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM thread_participants
    WHERE user_id = _user_id AND thread_id = _thread_id
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_thread_participant FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_thread_participant TO authenticated;

-- 2. Fix thread_participants policies
DROP POLICY IF EXISTS "participants_select" ON public.thread_participants;
DROP POLICY IF EXISTS "participants_insert" ON public.thread_participants;
DROP POLICY IF EXISTS "participants_update" ON public.thread_participants;

CREATE POLICY "participants_select" ON public.thread_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "participants_insert" ON public.thread_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "participants_update" ON public.thread_participants
  FOR UPDATE USING (user_id = auth.uid());

-- 3. Fix communication_threads policies
DROP POLICY IF EXISTS "threads_select" ON public.communication_threads;
DROP POLICY IF EXISTS "threads_update" ON public.communication_threads;
DROP POLICY IF EXISTS "threads_insert" ON public.communication_threads;

CREATE POLICY "threads_select" ON public.communication_threads
  FOR SELECT USING (public.is_thread_participant(auth.uid(), id));

CREATE POLICY "threads_insert" ON public.communication_threads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "threads_update" ON public.communication_threads
  FOR UPDATE USING (public.is_thread_participant(auth.uid(), id));

-- 4. Fix communication_messages policies
DROP POLICY IF EXISTS "messages_select" ON public.communication_messages;
DROP POLICY IF EXISTS "messages_insert" ON public.communication_messages;

CREATE POLICY "messages_select" ON public.communication_messages
  FOR SELECT USING (public.is_thread_participant(auth.uid(), thread_id));

CREATE POLICY "messages_insert" ON public.communication_messages
  FOR INSERT WITH CHECK (public.is_thread_participant(auth.uid(), thread_id));