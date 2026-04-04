
-- ============================================
-- Meeting Engine tables for Management Review
-- ============================================

-- 1. management_review_meetings
CREATE TABLE public.management_review_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  meeting_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  location text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.management_review_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meetings for their companies"
  ON public.management_review_meetings FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create meetings for their companies"
  ON public.management_review_meetings FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update meetings for their companies"
  ON public.management_review_meetings FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete meetings for their companies"
  ON public.management_review_meetings FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
  ));

-- 2. management_review_attendees
CREATE TABLE public.management_review_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.management_review_meetings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  role text,
  attended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.management_review_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage attendees for their meetings"
  ON public.management_review_attendees FOR ALL
  USING (meeting_id IN (
    SELECT m.id FROM public.management_review_meetings m
    JOIN public.user_company_access uca ON uca.company_id = m.company_id
    WHERE uca.user_id = auth.uid()
  ));

-- 3. management_review_agenda_items
CREATE TABLE public.management_review_agenda_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.management_review_meetings(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  notes text,
  presenter text,
  duration_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.management_review_agenda_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage agenda items for their meetings"
  ON public.management_review_agenda_items FOR ALL
  USING (meeting_id IN (
    SELECT m.id FROM public.management_review_meetings m
    JOIN public.user_company_access uca ON uca.company_id = m.company_id
    WHERE uca.user_id = auth.uid()
  ));

-- 4. management_review_minutes
CREATE TABLE public.management_review_minutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.management_review_meetings(id) ON DELETE CASCADE,
  agenda_item_id uuid REFERENCES public.management_review_agenda_items(id) ON DELETE SET NULL,
  content text NOT NULL DEFAULT '',
  decision text,
  action_item text,
  action_owner text,
  action_due_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.management_review_minutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage minutes for their meetings"
  ON public.management_review_minutes FOR ALL
  USING (meeting_id IN (
    SELECT m.id FROM public.management_review_meetings m
    JOIN public.user_company_access uca ON uca.company_id = m.company_id
    WHERE uca.user_id = auth.uid()
  ));

-- Updated_at trigger for meetings
CREATE TRIGGER update_management_review_meetings_updated_at
  BEFORE UPDATE ON public.management_review_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
