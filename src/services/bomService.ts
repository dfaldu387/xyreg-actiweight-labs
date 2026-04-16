import { supabase } from '@/integrations/supabase/client';
import type { BomRevision, BomItem, BomRevisionTransition, CreateBomRevisionData, CreateBomItemData, UpdateBomItemData, BomRevisionStatus, BomItemChange } from '@/types/bom';

export class BomService {
  // ── Revisions ──

  static async getRevisions(productId: string): Promise<BomRevision[]> {
    const { data, error } = await supabase
      .from('bom_revisions')
      .select('*, ccr:change_control_requests(id, ccr_id, status, title)')
      .eq('product_id', productId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Get item counts
    const revisionIds = (data || []).map(r => r.id);
    if (revisionIds.length === 0) return [];

    const { data: counts } = await supabase
      .from('bom_items')
      .select('bom_revision_id')
      .in('bom_revision_id', revisionIds);

    const countMap: Record<string, number> = {};
    (counts || []).forEach(c => {
      countMap[c.bom_revision_id] = (countMap[c.bom_revision_id] || 0) + 1;
    });

    return (data || []).map(r => ({
      ...r,
      total_cost: Number(r.total_cost) || 0,
      item_count: countMap[r.id] || 0,
      ccr: r.ccr || null,
    })) as BomRevision[];
  }

  static async getRevision(revisionId: string): Promise<BomRevision> {
    const { data, error } = await supabase
      .from('bom_revisions')
      .select('*, ccr:change_control_requests(id, ccr_id, status, title)')
      .eq('id', revisionId)
      .single();
    if (error) throw error;
    return { ...data, total_cost: Number(data.total_cost) || 0, ccr: data.ccr || null } as BomRevision;
  }

  static async getActiveRevision(productId: string): Promise<BomRevision | null> {
    const { data, error } = await supabase
      .from('bom_revisions')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'active')
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, total_cost: Number(data.total_cost) || 0 } as BomRevision;
  }

  static async createRevision(input: CreateBomRevisionData): Promise<BomRevision> {
    const { data, error } = await supabase
      .from('bom_revisions')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return { ...data, total_cost: Number(data.total_cost) || 0 } as BomRevision;
  }

  static async updateRevision(id: string, updates: Partial<BomRevision>): Promise<BomRevision> {
    const { data, error } = await supabase
      .from('bom_revisions')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { ...data, total_cost: Number(data.total_cost) || 0 } as BomRevision;
  }

  static async archiveRevision(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('bom_revisions')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: userId,
      })
      .eq('id', id);
    if (error) throw error;
  }

  static async restoreRevision(id: string): Promise<void> {
    const { error } = await supabase
      .from('bom_revisions')
      .update({
        is_archived: false,
        archived_at: null,
        archived_by: null,
      })
      .eq('id', id);
    if (error) throw error;
  }

  static async getArchivedRevisions(): Promise<BomRevision[]> {
    const { data, error } = await supabase
      .from('bom_revisions')
      .select('*, ccr:change_control_requests(id, ccr_id, status, title)')
      .eq('is_archived', true)
      .order('archived_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      total_cost: Number(r.total_cost) || 0,
      ccr: r.ccr || null,
    })) as BomRevision[];
  }

  static async activateRevision(revisionId: string, productId: string, userId: string): Promise<void> {
    // Obsolete current active revision
    const { data: currentActive } = await supabase
      .from('bom_revisions')
      .select('id')
      .eq('product_id', productId)
      .eq('status', 'active')
      .maybeSingle();

    if (currentActive) {
      await supabase.from('bom_revisions').update({ status: 'obsolete' }).eq('id', currentActive.id);
      await supabase.from('bom_revision_transitions').insert({
        bom_revision_id: currentActive.id,
        from_status: 'active',
        to_status: 'obsolete',
        transitioned_by: userId,
        reason: 'Replaced by new active revision',
      });
    }

    // Activate new revision
    await supabase.from('bom_revisions').update({ status: 'active', approved_by: userId, approved_at: new Date().toISOString() }).eq('id', revisionId);
    await supabase.from('bom_revision_transitions').insert({
      bom_revision_id: revisionId,
      from_status: 'draft',
      to_status: 'active',
      transitioned_by: userId,
    });
  }

  static async cloneRevision(sourceId: string, newRevision: string, productId: string, companyId: string, userId: string): Promise<BomRevision> {
    // Create new revision
    const newRev = await this.createRevision({
      product_id: productId,
      company_id: companyId,
      revision: newRevision,
      description: `Cloned from revision`,
      created_by: userId,
    });

    // Copy items
    const items = await this.getItems(sourceId);
    if (items.length > 0) {
      const newItems = items.map(item => ({
        bom_revision_id: newRev.id,
        component_id: item.component_id,
        material_id: item.material_id,
        item_number: item.item_number,
        description: item.description,
        quantity: item.quantity,
        unit_of_measure: item.unit_of_measure,
        unit_cost: item.unit_cost,
        supplier_id: item.supplier_id,
        supplier_part_number: item.supplier_part_number,
        lead_time_days: item.lead_time_days,
        is_critical: item.is_critical,
        notes: item.notes,
        sort_order: item.sort_order,
        category: item.category,
        material_name: item.material_name,
        material_specification: item.material_specification,
        patient_contact: item.patient_contact,
        biocompatibility_notes: item.biocompatibility_notes,
        certificate_required: item.certificate_required,
        internal_part_number: item.internal_part_number,
        reference_designator: item.reference_designator,
        sterilization_compatible: item.sterilization_compatible,
        shelf_life_days: item.shelf_life_days,
        rohs_compliant: item.rohs_compliant,
        reach_compliant: item.reach_compliant,
        drawing_url: item.drawing_url,
      }));
      await supabase.from('bom_items').insert(newItems);
    }

    // Recalculate total cost
    await this.recalculateTotalCost(newRev.id);
    return this.getRevision(newRev.id);
  }

  // ── Auto-clone for ECO edit flow ──

  static async autoCloneForEdit(
    activeRevisionId: string,
    productId: string,
    companyId: string,
    userId: string
  ): Promise<{ newRevision: BomRevision; ccrId: string }> {
    // Get current active revision
    const activeRev = await this.getRevision(activeRevisionId);

    // Determine next revision letter
    const { data: allRevs } = await supabase
      .from('bom_revisions')
      .select('revision')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    const nextRevChar = String.fromCharCode(65 + (allRevs?.length || 0));

    // Clone to new draft
    const newRev = await this.cloneRevision(
      activeRevisionId,
      nextRevChar,
      productId,
      companyId,
      userId
    );

    // Create a linked CCR (ECO)
    const { data: ccr, error: ccrError } = await supabase
      .from('change_control_requests')
      .insert({
        company_id: companyId,
        product_id: productId,
        source_type: 'other' as any,
        source_reference: `BOM Rev ${activeRev.revision} → Rev ${nextRevChar}`,
        change_type: 'design' as any,
        title: `ECO: BOM Revision ${activeRev.revision} → ${nextRevChar}`,
        description: `Engineering Change Order for BOM revision change from Rev ${activeRev.revision} to Rev ${nextRevChar}.`,
        created_by: userId,
        owner_id: userId,
        ccr_id: '', // auto-generated by trigger
      } as any)
      .select('id')
      .single();

    if (ccrError) throw ccrError;

    // Link CCR to the new revision
    await supabase
      .from('bom_revisions')
      .update({ ccr_id: ccr.id })
      .eq('id', newRev.id);

    return { newRevision: { ...newRev, ccr_id: ccr.id }, ccrId: ccr.id };
  }

  // ── Items ──

  static async getItems(revisionId: string): Promise<BomItem[]> {
    const { data, error } = await supabase
      .from('bom_items')
      .select(`*, supplier:suppliers(id, name, status)`)
      .eq('bom_revision_id', revisionId)
      .order('sort_order')
      .order('item_number');
    if (error) throw error;
    return (data || []).map(i => ({
      ...i,
      quantity: Number(i.quantity) || 0,
      unit_cost: Number(i.unit_cost) || 0,
      extended_cost: Number(i.extended_cost) || 0,
    })) as BomItem[];
  }

  static async createItem(input: CreateBomItemData): Promise<BomItem> {
    const { data, error } = await supabase
      .from('bom_items')
      .insert(input)
      .select(`*, supplier:suppliers(id, name, status)`)
      .single();
    if (error) throw error;
    await this.recalculateTotalCost(input.bom_revision_id);
    return data as BomItem;
  }

  static async updateItem(id: string, updates: UpdateBomItemData, revisionId: string): Promise<BomItem> {
    const { data, error } = await supabase
      .from('bom_items')
      .update(updates)
      .eq('id', id)
      .select(`*, supplier:suppliers(id, name, status)`)
      .single();
    if (error) throw error;
    await this.recalculateTotalCost(revisionId);
    return data as BomItem;
  }

  static async deleteItem(id: string, revisionId: string): Promise<void> {
    const { error } = await supabase.from('bom_items').delete().eq('id', id);
    if (error) throw error;
    await this.recalculateTotalCost(revisionId);
  }

  // ── Cost Rollup ──

  static async recalculateTotalCost(revisionId: string): Promise<void> {
    const items = await this.getItems(revisionId);
    const total = items.reduce((sum, i) => sum + (Number(i.extended_cost) || 0), 0);
    await supabase.from('bom_revisions').update({ total_cost: total }).eq('id', revisionId);
  }

  // ── Transitions ──

  static async getTransitions(revisionId: string): Promise<BomRevisionTransition[]> {
    const { data, error } = await supabase
      .from('bom_revision_transitions')
      .select('*')
      .eq('bom_revision_id', revisionId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as BomRevisionTransition[];
  }

  // ── Item Changes (Audit Trail) ──

  static async getItemChanges(revisionId: string): Promise<BomItemChange[]> {
    const { data, error } = await supabase
      .from('bom_item_changes')
      .select('*')
      .eq('bom_revision_id', revisionId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as BomItemChange[];
  }

  static async batchUpdateComponentLinks(links: { id: string; component_id: string }[]): Promise<void> {
    for (const link of links) {
      const { error } = await supabase
        .from('bom_items')
        .update({ component_id: link.component_id })
        .eq('id', link.id);
      if (error) throw error;
    }
  }

  static async recordItemChange(change: {
    bom_revision_id: string;
    bom_item_id?: string;
    change_type: 'added' | 'modified' | 'removed';
    field_name?: string;
    old_value?: string;
    new_value?: string;
    changed_by: string;
  }): Promise<void> {
    const { error } = await supabase.from('bom_item_changes').insert(change);
    if (error) throw error;
  }
}