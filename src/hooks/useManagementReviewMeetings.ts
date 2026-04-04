import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Meeting {
  id: string;
  company_id: string;
  title: string;
  meeting_date: string;
  status: string;
  location: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Attendee {
  id: string;
  meeting_id: string;
  user_id: string | null;
  name: string;
  role: string | null;
  attended: boolean;
}

export interface AgendaItem {
  id: string;
  meeting_id: string;
  sort_order: number;
  title: string;
  notes: string | null;
  presenter: string | null;
  duration_minutes: number | null;
}

export interface Minute {
  id: string;
  meeting_id: string;
  agenda_item_id: string | null;
  content: string;
  decision: string | null;
  action_item: string | null;
  action_owner: string | null;
  action_due_date: string | null;
  created_at: string;
}

export const ISO_13485_AGENDA_PRESETS = [
  'Feedback (Complaints, Customer Satisfaction)',
  'Audit Results',
  'Process Performance & Product Conformity',
  'Preventive & Corrective Actions Status',
  'Follow-up from Previous Reviews',
  'Changes Affecting the QMS',
  'Regulatory & Standards Changes',
  'Risk Management Review (ISO 14971)',
  'Supplier Performance',
  'Training Effectiveness & Resource Adequacy',
  'Recommendations for Improvement',
];

export function useManagementReviewMeetings(companyId: string | undefined) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMeetings = useCallback(async () => {
    if (!companyId) { setMeetings([]); setIsLoading(false); return; }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('management_review_meetings')
      .select('*')
      .eq('company_id', companyId)
      .order('meeting_date', { ascending: false });
    if (error) { toast.error('Failed to load meetings'); }
    else { setMeetings((data as any[]) || []); }
    setIsLoading(false);
  }, [companyId]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const createMeeting = async (title: string, meetingDate: string, location?: string) => {
    if (!companyId) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); return null; }

    const { data, error } = await supabase
      .from('management_review_meetings')
      .insert({ company_id: companyId, title, meeting_date: meetingDate, location: location || null, created_by: user.id } as any)
      .select()
      .single();
    if (error) { toast.error('Failed to create meeting'); return null; }

    // Auto-create ISO 13485 agenda presets
    const agendaItems = ISO_13485_AGENDA_PRESETS.map((t, i) => ({
      meeting_id: (data as any).id,
      sort_order: i + 1,
      title: t,
    }));
    await supabase.from('management_review_agenda_items').insert(agendaItems as any);

    toast.success('Meeting created');
    await fetchMeetings();
    return data as unknown as Meeting;
  };

  const updateMeeting = async (id: string, updates: Partial<Pick<Meeting, 'title' | 'meeting_date' | 'status' | 'location'>>) => {
    const { error } = await supabase.from('management_review_meetings').update(updates as any).eq('id', id);
    if (error) { toast.error('Failed to update meeting'); return false; }
    toast.success('Meeting updated');
    await fetchMeetings();
    return true;
  };

  const deleteMeeting = async (id: string) => {
    const { error } = await supabase.from('management_review_meetings').delete().eq('id', id);
    if (error) { toast.error('Failed to delete meeting'); return false; }
    toast.success('Meeting deleted');
    await fetchMeetings();
    return true;
  };

  return { meetings, isLoading, fetchMeetings, createMeeting, updateMeeting, deleteMeeting };
}

// --- Agenda Items ---
export function useAgendaItems(meetingId: string | undefined) {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!meetingId) { setItems([]); setIsLoading(false); return; }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('management_review_agenda_items')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('sort_order');
    if (error) toast.error('Failed to load agenda');
    else setItems((data as any[]) || []);
    setIsLoading(false);
  }, [meetingId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = async (title: string, sortOrder: number) => {
    if (!meetingId) return;
    await supabase.from('management_review_agenda_items').insert({ meeting_id: meetingId, title, sort_order: sortOrder } as any);
    await fetchItems();
  };

  const updateItem = async (id: string, updates: Partial<Pick<AgendaItem, 'title' | 'notes' | 'presenter' | 'duration_minutes' | 'sort_order'>>) => {
    await supabase.from('management_review_agenda_items').update(updates as any).eq('id', id);
    await fetchItems();
  };

  const deleteItem = async (id: string) => {
    await supabase.from('management_review_agenda_items').delete().eq('id', id);
    await fetchItems();
  };

  return { items, isLoading, fetchItems, addItem, updateItem, deleteItem };
}

// --- Attendees ---
export function useAttendees(meetingId: string | undefined) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttendees = useCallback(async () => {
    if (!meetingId) { setAttendees([]); setIsLoading(false); return; }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('management_review_attendees')
      .select('*')
      .eq('meeting_id', meetingId);
    if (error) toast.error('Failed to load attendees');
    else setAttendees((data as any[]) || []);
    setIsLoading(false);
  }, [meetingId]);

  useEffect(() => { fetchAttendees(); }, [fetchAttendees]);

  const addAttendee = async (name: string, role?: string, userId?: string) => {
    if (!meetingId) return;
    await supabase.from('management_review_attendees').insert({ meeting_id: meetingId, name, role: role || null, user_id: userId || null } as any);
    await fetchAttendees();
  };

  const toggleAttendance = async (id: string, attended: boolean) => {
    await supabase.from('management_review_attendees').update({ attended } as any).eq('id', id);
    await fetchAttendees();
  };

  const removeAttendee = async (id: string) => {
    await supabase.from('management_review_attendees').delete().eq('id', id);
    await fetchAttendees();
  };

  return { attendees, isLoading, fetchAttendees, addAttendee, toggleAttendance, removeAttendee };
}

// --- Minutes ---
export function useMinutes(meetingId: string | undefined) {
  const [minutes, setMinutes] = useState<Minute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMinutes = useCallback(async () => {
    if (!meetingId) { setMinutes([]); setIsLoading(false); return; }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('management_review_minutes')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at');
    if (error) toast.error('Failed to load minutes');
    else setMinutes((data as any[]) || []);
    setIsLoading(false);
  }, [meetingId]);

  useEffect(() => { fetchMinutes(); }, [fetchMinutes]);

  const addMinute = async (content: string, agendaItemId?: string, decision?: string, actionItem?: string, actionOwner?: string, actionDueDate?: string) => {
    if (!meetingId) return;
    await supabase.from('management_review_minutes').insert({
      meeting_id: meetingId,
      agenda_item_id: agendaItemId || null,
      content,
      decision: decision || null,
      action_item: actionItem || null,
      action_owner: actionOwner || null,
      action_due_date: actionDueDate || null,
    } as any);
    await fetchMinutes();
  };

  const updateMinute = async (id: string, updates: Partial<Pick<Minute, 'content' | 'decision' | 'action_item' | 'action_owner' | 'action_due_date'>>) => {
    await supabase.from('management_review_minutes').update(updates as any).eq('id', id);
    await fetchMinutes();
  };

  const deleteMinute = async (id: string) => {
    await supabase.from('management_review_minutes').delete().eq('id', id);
    await fetchMinutes();
  };

  return { minutes, isLoading, fetchMinutes, addMinute, updateMinute, deleteMinute };
}
