import { supabase } from '@/integrations/supabase/client';
import { MaterialSupplier, CreateMaterialSupplierData, UpdateMaterialSupplierData } from '@/types/materialSupplier';

export class MaterialSupplierService {
  static async getMaterialSuppliers(materialId: string): Promise<MaterialSupplier[]> {
    const { data, error } = await supabase
      .from('material_suppliers')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .eq('material_id', materialId)
      .order('is_primary', { ascending: false })
      .order('created_at');
    
    if (error) throw error;
    return (data || []) as MaterialSupplier[];
  }

  static async getSupplierMaterials(supplierId: string): Promise<MaterialSupplier[]> {
    const { data, error } = await supabase
      .from('material_suppliers')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('is_primary', { ascending: false })
      .order('created_at');
    
    if (error) throw error;
    return (data || []) as MaterialSupplier[];
  }

  static async createMaterialSupplier(materialSupplierData: CreateMaterialSupplierData): Promise<MaterialSupplier> {
    const { data, error } = await supabase
      .from('material_suppliers')
      .insert(materialSupplierData)
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .single();
    
    if (error) throw error;
    return data as MaterialSupplier;
  }

  static async updateMaterialSupplier(id: string, updates: UpdateMaterialSupplierData): Promise<MaterialSupplier> {
    const { data, error } = await supabase
      .from('material_suppliers')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .single();
    
    if (error) throw error;
    return data as MaterialSupplier;
  }

  static async deleteMaterialSupplier(id: string): Promise<void> {
    const { error } = await supabase
      .from('material_suppliers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async setPrimarySupplier(materialId: string, supplierId: string): Promise<void> {
    // First, unset all primary flags for this material
    await supabase
      .from('material_suppliers')
      .update({ is_primary: false })
      .eq('material_id', materialId);

    // Then set the selected supplier as primary
    const { error } = await supabase
      .from('material_suppliers')
      .update({ is_primary: true })
      .eq('material_id', materialId)
      .eq('supplier_id', supplierId);

    if (error) throw error;
  }

  static async getCompanyMaterialSuppliers(companyId: string): Promise<MaterialSupplier[]> {
    const { data, error } = await supabase
      .from('material_suppliers')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as MaterialSupplier[];
  }

  static async getMaterialCountsBySupplier(companyId: string): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('material_suppliers')
      .select('supplier_id')
      .eq('company_id', companyId);
    
    if (error) throw error;
    
    const counts: Record<string, number> = {};
    (data || []).forEach(row => {
      counts[row.supplier_id] = (counts[row.supplier_id] || 0) + 1;
    });
    return counts;
  }
}