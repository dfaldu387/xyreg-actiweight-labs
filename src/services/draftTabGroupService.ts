import { supabase } from '@/integrations/supabase/client';

export interface DraftTabGroup {
  id: string;
  company_id: string;
  owner_user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_shared: boolean;
  member_ci_ids: string[];
  last_opened_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDraftTabGroupInput {
  company_id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  is_shared?: boolean;
  member_ci_ids: string[];
}

export interface UpdateDraftTabGroupInput {
  name?: string;
  description?: string | null;
  color?: string | null;
  is_shared?: boolean;
  member_ci_ids?: string[];
  last_opened_at?: string;
}

const TABLE = 'document_draft_tab_groups' as any;

export const DraftTabGroupService = {
  async list(companyId: string): Promise<DraftTabGroup[]> {
    const { data, error } = await (supabase.from(TABLE) as any)
      .select('*')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []) as DraftTabGroup[];
  },

  async create(input: CreateDraftTabGroupInput): Promise<DraftTabGroup> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error('Not authenticated');
    const payload = {
      company_id: input.company_id,
      owner_user_id: userId,
      name: input.name.trim(),
      description: input.description ?? null,
      color: input.color ?? null,
      is_shared: input.is_shared ?? false,
      member_ci_ids: input.member_ci_ids,
    };
    const { data, error } = await (supabase.from(TABLE) as any)
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return data as DraftTabGroup;
  },

  async update(id: string, patch: UpdateDraftTabGroupInput): Promise<DraftTabGroup> {
    const { data, error } = await (supabase.from(TABLE) as any)
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as DraftTabGroup;
  },

  async remove(id: string): Promise<void> {
    const { error } = await (supabase.from(TABLE) as any).delete().eq('id', id);
    if (error) throw error;
  },

  async touchLastOpened(id: string): Promise<void> {
    await (supabase.from(TABLE) as any)
      .update({ last_opened_at: new Date().toISOString() })
      .eq('id', id);
  },
};
