import { supabase } from '@/integrations/supabase/client';
import { InspectionRecord, InspectionItem, InspectionTransition, InspectionEvidence, InspectionStatus, INSPECTION_STATE_GATES } from '@/types/incomingInspection';

export const incomingInspectionService = {
  // ============ INSPECTION RECORDS ============

  async getByCompany(companyId: string): Promise<InspectionRecord[]> {
    const { data, error } = await supabase
      .from('incoming_inspection_records' as any)
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as InspectionRecord[];
  },

  async getByProduct(productId: string): Promise<InspectionRecord[]> {
    const { data, error } = await supabase
      .from('incoming_inspection_records' as any)
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as InspectionRecord[];
  },

  async getById(id: string): Promise<InspectionRecord | null> {
    const { data, error } = await supabase
      .from('incoming_inspection_records' as any)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as InspectionRecord | null;
  },

  async create(record: {
    company_id: string;
    product_id?: string | null;
    supplier_id?: string | null;
    purchase_order_number?: string | null;
    lot_batch_number?: string | null;
    material_description?: string | null;
    quantity_received?: number | null;
    sampling_plan_type?: string;
    aql_level?: string | null;
    coc_received?: boolean;
    coc_reference?: string | null;
    inspector_id?: string | null;
    created_by: string;
  }): Promise<InspectionRecord> {
    const insertData = { ...record, inspection_id: '' }; // trigger auto-generates
    const { data, error } = await supabase
      .from('incoming_inspection_records' as any)
      .insert([insertData])
      .select()
      .single();
    if (error) throw error;
    return data as unknown as InspectionRecord;
  },

  async update(id: string, updates: Record<string, any>): Promise<InspectionRecord> {
    const { data, error } = await supabase
      .from('incoming_inspection_records' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as InspectionRecord;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('incoming_inspection_records' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ============ STATE TRANSITIONS ============

  async transitionState(
    inspectionId: string,
    fromStatus: InspectionStatus | null,
    toStatus: InspectionStatus,
    userId: string,
    reason?: string
  ): Promise<void> {
    const allowed = INSPECTION_STATE_GATES[fromStatus || 'draft'];
    if (!allowed?.includes(toStatus)) {
      throw new Error(`Invalid transition from ${fromStatus} to ${toStatus}`);
    }

    const { error: transErr } = await supabase
      .from('incoming_inspection_transitions' as any)
      .insert({
        inspection_id: inspectionId,
        from_status: fromStatus,
        to_status: toStatus,
        transitioned_by: userId,
        transition_reason: reason,
      });
    if (transErr) throw transErr;

    const { error: upErr } = await supabase
      .from('incoming_inspection_records' as any)
      .update({ status: toStatus })
      .eq('id', inspectionId);
    if (upErr) throw upErr;
  },

  async getTransitions(inspectionId: string): Promise<InspectionTransition[]> {
    const { data, error } = await supabase
      .from('incoming_inspection_transitions' as any)
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as InspectionTransition[];
  },

  // ============ INSPECTION ITEMS ============

  async getItems(inspectionId: string): Promise<InspectionItem[]> {
    const { data, error } = await supabase
      .from('incoming_inspection_items' as any)
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as InspectionItem[];
  },

  async createItem(item: {
    inspection_id: string;
    check_name: string;
    specification?: string | null;
    unit?: string | null;
    sort_order?: number;
  }): Promise<InspectionItem> {
    const { data, error } = await supabase
      .from('incoming_inspection_items' as any)
      .insert([item])
      .select()
      .single();
    if (error) throw error;
    return data as unknown as InspectionItem;
  },

  async updateItem(id: string, updates: Record<string, any>): Promise<InspectionItem> {
    const { data, error } = await supabase
      .from('incoming_inspection_items' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as InspectionItem;
  },

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('incoming_inspection_items' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ============ EVIDENCE ============

  async getEvidence(inspectionId: string): Promise<InspectionEvidence[]> {
    const { data, error } = await supabase
      .from('incoming_inspection_evidence' as any)
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as InspectionEvidence[];
  },

  async uploadEvidence(
    inspectionId: string,
    file: File,
    evidenceType: string,
    description: string | undefined,
    userId: string
  ): Promise<InspectionEvidence> {
    const filePath = `inspection/${inspectionId}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage
      .from('inspection-evidence')
      .upload(filePath, file);
    if (uploadErr) throw uploadErr;

    const { data, error } = await supabase
      .from('incoming_inspection_evidence' as any)
      .insert({
        inspection_id: inspectionId,
        evidence_type: evidenceType,
        file_name: file.name,
        storage_path: filePath,
        description,
        uploaded_by: userId,
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as InspectionEvidence;
  },

  async deleteEvidence(id: string, storagePath: string): Promise<void> {
    await supabase.storage.from('inspection-evidence').remove([storagePath]);
    const { error } = await supabase
      .from('incoming_inspection_evidence' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ============ AUTO-CREATE NC ON REJECT ============

  async createNCFromRejection(inspection: InspectionRecord, userId: string): Promise<string | null> {
    if (inspection.disposition !== 'rejected') return null;

    const { data, error } = await supabase
      .from('nonconformity_records' as any)
      .insert([{
        nc_id: '', // trigger auto-generates
        company_id: inspection.company_id,
        product_id: inspection.product_id,
        source_type: 'incoming_inspection',
        source_id: inspection.id,
        title: `Incoming Inspection Rejection — ${inspection.inspection_id}`,
        description_is: `Material "${inspection.material_description || 'N/A'}" from PO ${inspection.purchase_order_number || 'N/A'}, Lot/Batch ${inspection.lot_batch_number || 'N/A'} was rejected during incoming inspection.`,
        description_should_be: 'Material should meet all acceptance criteria per the inspection specification.',
        severity: 'major',
        created_by: userId,
      }])
      .select()
      .single();

    if (error) throw error;
    const ncId = (data as any)?.id;

    // Link NC back to inspection record
    if (ncId) {
      await supabase
        .from('incoming_inspection_records' as any)
        .update({ linked_nc_id: ncId })
        .eq('id', inspection.id);
    }

    return ncId;
  },
};
