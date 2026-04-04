import { supabase } from '@/integrations/supabase/client';

export const BomItemScopeService = {
  async getScopes(bomItemIds: string[]): Promise<Record<string, string[]>> {
    if (!bomItemIds.length) return {};
    const { data, error } = await supabase
      .from('bom_item_product_scope')
      .select('bom_item_id, product_id')
      .in('bom_item_id', bomItemIds);
    if (error) throw error;

    const map: Record<string, string[]> = {};
    for (const row of data || []) {
      if (!map[row.bom_item_id]) map[row.bom_item_id] = [];
      map[row.bom_item_id].push(row.product_id);
    }
    return map;
  },

  async upsertScope(bomItemId: string, companyId: string, productIds: string[]): Promise<void> {
    // Delete existing
    await supabase
      .from('bom_item_product_scope')
      .delete()
      .eq('bom_item_id', bomItemId);

    if (!productIds.length) return;

    const rows = productIds.map(pid => ({
      bom_item_id: bomItemId,
      product_id: pid,
      company_id: companyId,
    }));

    const { error } = await supabase
      .from('bom_item_product_scope')
      .insert(rows);
    if (error) throw error;
  },
};
