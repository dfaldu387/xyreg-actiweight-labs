import { supabase } from '@/integrations/supabase/client';
import { ProductionOrder, ProductionCheckpoint, ProductionTransition, ProductionEvidence, ProductionOrderStatus, PRODUCTION_STATE_GATES } from '@/types/production';

export const productionService = {
  // ============ PRODUCTION ORDERS ============

  async getByCompany(companyId: string): Promise<ProductionOrder[]> {
    const { data, error } = await supabase
      .from('production_orders' as any)
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data || []) as unknown as ProductionOrder[]).map(o => ({
      ...o,
      component_lot_numbers: o.component_lot_numbers || [],
      equipment_ids: o.equipment_ids || [],
      operator_ids: o.operator_ids || [],
    }));
  },

  async getByProduct(productId: string): Promise<ProductionOrder[]> {
    const { data, error } = await supabase
      .from('production_orders' as any)
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data || []) as unknown as ProductionOrder[]).map(o => ({
      ...o,
      component_lot_numbers: o.component_lot_numbers || [],
      equipment_ids: o.equipment_ids || [],
      operator_ids: o.operator_ids || [],
    }));
  },

  async getById(id: string): Promise<ProductionOrder | null> {
    const { data, error } = await supabase
      .from('production_orders' as any)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const o = data as unknown as ProductionOrder;
    return { ...o, component_lot_numbers: o.component_lot_numbers || [], equipment_ids: o.equipment_ids || [], operator_ids: o.operator_ids || [] };
  },

  async create(record: {
    company_id: string;
    product_id?: string | null;
    batch_number?: string | null;
    lot_number?: string | null;
    quantity_planned?: number | null;
    planned_start_date?: string | null;
    planned_end_date?: string | null;
    notes?: string | null;
    created_by: string;
    bom_revision_id?: string | null;
  }): Promise<ProductionOrder> {
    const insertData = { ...record, order_id: '' };
    const { data, error } = await supabase
      .from('production_orders' as any)
      .insert([insertData])
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProductionOrder;
  },

  async update(id: string, updates: Record<string, any>): Promise<ProductionOrder> {
    const { data, error } = await supabase
      .from('production_orders' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProductionOrder;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('production_orders' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ============ STATE TRANSITIONS ============

  async transitionState(
    orderId: string,
    fromStatus: ProductionOrderStatus | null,
    toStatus: ProductionOrderStatus,
    userId: string,
    reason?: string
  ): Promise<void> {
    const allowed = PRODUCTION_STATE_GATES[fromStatus || 'draft'];
    if (!allowed?.includes(toStatus)) {
      throw new Error(`Invalid transition from ${fromStatus} to ${toStatus}`);
    }

    const { error: transErr } = await supabase
      .from('production_order_transitions' as any)
      .insert({ order_id: orderId, from_status: fromStatus, to_status: toStatus, transitioned_by: userId, transition_reason: reason });
    if (transErr) throw transErr;

    const updateData: Record<string, any> = { status: toStatus };
    if (toStatus === 'in_progress' && !fromStatus?.includes('in_progress')) {
      updateData.actual_start_date = new Date().toISOString();
    }

    const { error: upErr } = await supabase
      .from('production_orders' as any)
      .update(updateData)
      .eq('id', orderId);
    if (upErr) throw upErr;
  },

  async getTransitions(orderId: string): Promise<ProductionTransition[]> {
    const { data, error } = await supabase
      .from('production_order_transitions' as any)
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as ProductionTransition[];
  },

  // ============ CHECKPOINTS ============

  async getCheckpoints(orderId: string): Promise<ProductionCheckpoint[]> {
    const { data, error } = await supabase
      .from('production_checkpoints' as any)
      .select('*')
      .eq('order_id', orderId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as ProductionCheckpoint[];
  },

  async createCheckpoint(item: {
    order_id: string;
    checkpoint_name: string;
    description?: string | null;
    specification?: string | null;
    unit?: string | null;
    sort_order?: number;
  }): Promise<ProductionCheckpoint> {
    const { data, error } = await supabase
      .from('production_checkpoints' as any)
      .insert([item])
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProductionCheckpoint;
  },

  async updateCheckpoint(id: string, updates: Record<string, any>): Promise<ProductionCheckpoint> {
    const { data, error } = await supabase
      .from('production_checkpoints' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProductionCheckpoint;
  },

  async deleteCheckpoint(id: string): Promise<void> {
    const { error } = await supabase
      .from('production_checkpoints' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ============ BATCH DISPOSITION ============

  async setDisposition(orderId: string, disposition: string, notes: string, userId: string): Promise<void> {
    const updateData: Record<string, any> = {
      disposition,
      disposition_notes: notes,
      disposition_date: new Date().toISOString(),
      disposition_by: userId,
    };

    const { error } = await supabase
      .from('production_orders' as any)
      .update(updateData)
      .eq('id', orderId);
    if (error) throw error;
  },

  // ============ NC AUTO-CREATE ON REJECTION ============

  async createNCFromRejection(order: ProductionOrder, userId: string): Promise<string | null> {
    if (order.disposition !== 'rejected') return null;

    const { data, error } = await supabase
      .from('nonconformity_records' as any)
      .insert([{
        nc_id: '',
        company_id: order.company_id,
        product_id: order.product_id,
        source_type: 'production',
        source_id: order.id,
        title: `Production Batch Rejection — ${order.order_id}`,
        description_is: `Batch ${order.batch_number || 'N/A'}, Lot ${order.lot_number || 'N/A'} was rejected during production review. ${order.quantity_rejected} units rejected out of ${order.quantity_produced} produced.`,
        description_should_be: 'All produced units should meet acceptance criteria per the production specification.',
        severity: 'major',
        created_by: userId,
      }])
      .select()
      .single();
    if (error) throw error;

    const ncId = (data as any)?.id;
    if (ncId) {
      await supabase.from('production_orders' as any).update({ linked_nc_id: ncId }).eq('id', order.id);
    }
    return ncId;
  },

  // ============ DHR GENERATION ============

  async markDHRGenerated(orderId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('production_orders' as any)
      .update({
        dhr_generated: true,
        dhr_generated_at: new Date().toISOString(),
        dhr_generated_by: userId,
      })
      .eq('id', orderId);
    if (error) throw error;
  },

  // ============ EVIDENCE ============

  async getEvidence(orderId: string): Promise<ProductionEvidence[]> {
    const { data, error } = await supabase
      .from('production_evidence' as any)
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as ProductionEvidence[];
  },

  async uploadEvidence(orderId: string, file: File, evidenceType: string, description: string | undefined, userId: string): Promise<ProductionEvidence> {
    const filePath = `production/${orderId}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('production-evidence').upload(filePath, file);
    if (uploadErr) throw uploadErr;

    const { data, error } = await supabase
      .from('production_evidence' as any)
      .insert({ order_id: orderId, evidence_type: evidenceType, file_name: file.name, storage_path: filePath, description, uploaded_by: userId })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProductionEvidence;
  },

  async deleteEvidence(id: string, storagePath: string): Promise<void> {
    await supabase.storage.from('production-evidence').remove([storagePath]);
    const { error } = await supabase.from('production_evidence' as any).delete().eq('id', id);
    if (error) throw error;
  },
};
