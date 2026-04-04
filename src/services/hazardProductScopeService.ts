import { supabase } from "@/integrations/supabase/client";

export interface HazardProductScopeRow {
  id: string;
  hazard_id: string;
  scope_type: "device" | "category";
  product_id: string | null;
  category_name: string | null;
  company_id: string;
  created_at: string;
}

export const hazardProductScopeService = {
  async getScopeByHazardId(hazardId: string): Promise<HazardProductScopeRow[]> {
    const { data, error } = await supabase
      .from("hazard_product_scope")
      .select("*")
      .eq("hazard_id", hazardId);

    if (error) throw new Error(`Failed to fetch hazard scope: ${error.message}`);
    return (data || []) as HazardProductScopeRow[];
  },

  async upsertScope(
    hazardId: string,
    companyId: string,
    productIds: string[],
    categoryNames: string[]
  ): Promise<void> {
    // Delete existing scope rows
    const { error: deleteError } = await supabase
      .from("hazard_product_scope")
      .delete()
      .eq("hazard_id", hazardId);

    if (deleteError) throw new Error(`Failed to clear hazard scope: ${deleteError.message}`);

    // Build new rows
    const rows: any[] = [];

    for (const pid of productIds) {
      rows.push({
        hazard_id: hazardId,
        scope_type: "device",
        product_id: pid,
        company_id: companyId,
      });
    }

    for (const catName of categoryNames) {
      rows.push({
        hazard_id: hazardId,
        scope_type: "category",
        category_name: catName,
        company_id: companyId,
      });
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("hazard_product_scope")
        .insert(rows);

      if (insertError) throw new Error(`Failed to save hazard scope: ${insertError.message}`);
    }
  },
};
