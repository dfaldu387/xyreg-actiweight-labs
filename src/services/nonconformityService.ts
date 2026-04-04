import { supabase } from '@/integrations/supabase/client';
import { NCRecord, NCStateTransition, NCEvidence, NCStatus, NC_STATE_GATES } from '@/types/nonconformity';

export const ncService = {
  // ============ NC RECORDS ============

  async getNCsByCompany(companyId: string): Promise<NCRecord[]> {
    const { data, error } = await supabase
      .from('nonconformity_records' as any)
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as NCRecord[];
  },

  async getNCsByProduct(productId: string): Promise<NCRecord[]> {
    const { data, error } = await supabase
      .from('nonconformity_records' as any)
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as NCRecord[];
  },

  async getNCById(ncId: string): Promise<NCRecord | null> {
    const { data, error } = await supabase
      .from('nonconformity_records' as any)
      .select('*')
      .eq('id', ncId)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as NCRecord | null;
  },

  async createNC(record: {
    company_id: string;
    product_id?: string | null;
    source_type: string;
    source_id?: string | null;
    title: string;
    description_is: string;
    description_should_be: string;
    severity?: string | null;
    batch_lot_number?: string | null;
    serial_number?: string | null;
    owner_id?: string | null;
    created_by: string;
  }): Promise<NCRecord> {
    const insertData = { ...record, nc_id: '' }; // trigger auto-generates
    const { data, error } = await supabase
      .from('nonconformity_records' as any)
      .insert([insertData])
      .select()
      .single();
    if (error) throw error;
    return data as unknown as NCRecord;
  },

  async updateNC(id: string, updates: Record<string, any>): Promise<NCRecord> {
    const { data, error } = await supabase
      .from('nonconformity_records' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as NCRecord;
  },

  async deleteNC(id: string): Promise<void> {
    const { error } = await supabase
      .from('nonconformity_records' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ============ STATE TRANSITIONS ============

  async transitionNCState(
    ncId: string,
    fromStatus: NCStatus | null,
    toStatus: NCStatus,
    userId: string,
    reason?: string
  ): Promise<void> {
    const allowed = NC_STATE_GATES[fromStatus || 'open'];
    if (!allowed?.includes(toStatus)) {
      throw new Error(`Invalid state transition from ${fromStatus} to ${toStatus}`);
    }

    const { error: transErr } = await supabase
      .from('nc_state_transitions' as any)
      .insert({
        nc_id: ncId,
        from_status: fromStatus,
        to_status: toStatus,
        transitioned_by: userId,
        transition_reason: reason,
      });
    if (transErr) throw transErr;

    const updateData: Record<string, any> = { status: toStatus };
    if (toStatus === 'closed') {
      updateData.closure_date = new Date().toISOString();
      updateData.closed_by = userId;
    }

    const { error: upErr } = await supabase
      .from('nonconformity_records' as any)
      .update(updateData)
      .eq('id', ncId);
    if (upErr) throw upErr;
  },

  async getNCTransitions(ncId: string): Promise<NCStateTransition[]> {
    const { data, error } = await supabase
      .from('nc_state_transitions' as any)
      .select('*')
      .eq('nc_id', ncId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as NCStateTransition[];
  },

  // ============ EVIDENCE ============

  async getNCEvidence(ncId: string): Promise<NCEvidence[]> {
    const { data, error } = await supabase
      .from('nc_evidence' as any)
      .select('*')
      .eq('nc_id', ncId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as NCEvidence[];
  },

  async uploadNCEvidence(
    ncId: string,
    file: File,
    evidenceType: string,
    description: string | undefined,
    userId: string
  ): Promise<NCEvidence> {
    const filePath = `nc/${ncId}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage
      .from('nc-evidence')
      .upload(filePath, file);
    if (uploadErr) throw uploadErr;

    const { data, error } = await supabase
      .from('nc_evidence' as any)
      .insert({
        nc_id: ncId,
        evidence_type: evidenceType,
        file_name: file.name,
        storage_path: filePath,
        description,
        uploaded_by: userId,
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as NCEvidence;
  },

  async deleteNCEvidence(id: string, storagePath: string): Promise<void> {
    await supabase.storage.from('nc-evidence').remove([storagePath]);
    const { error } = await supabase
      .from('nc_evidence' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ============ ANALYTICS ============

  async getNCAnalytics(companyId: string) {
    const { data, error } = await supabase
      .from('nonconformity_records' as any)
      .select('*')
      .eq('company_id', companyId);
    if (error) throw error;

    const records = (data || []) as unknown as NCRecord[];
    const now = new Date();
    const openStatuses: NCStatus[] = ['open', 'investigation', 'disposition', 'verification'];

    const byStatus = records.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: records.length,
      open: records.filter(r => openStatuses.includes(r.status)).length,
      overdue: records.filter(r => {
        if (!openStatuses.includes(r.status)) return false;
        return r.target_closure_date && new Date(r.target_closure_date) < now;
      }).length,
      byStatus,
    };
  },
};
