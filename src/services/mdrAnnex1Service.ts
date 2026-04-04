import { supabase } from '@/integrations/supabase/client';

export interface MdrAnnex1Entry {
  id?: string;
  mdr_annex_1_attribute: string;
  regulatory_dna_value?: string;
  chapter?: string;
  section?: string;
  sub_section?: string;
  gspr_clause?: string;
  detail?: string;
  verify?: string;
  responsible_party?: string;
  question?: string;
  responsibility?: string;
  product_id?: string;
  company_id?: string;
}

export class MdrAnnex1Service {
  static async getAll(searchTerm?: string): Promise<MdrAnnex1Entry[]> {
    let query = supabase
      .from('mdr_annex_1')
      .select('*')
      .order('mdr_annex_1_attribute');

    if (searchTerm) {
      query = query.or(`mdr_annex_1_attribute.ilike.%${searchTerm}%,chapter.ilike.%${searchTerm}%,gspr_clause.ilike.%${searchTerm}%,responsible_party.ilike.%${searchTerm}%,detail.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching MDR Annex 1 entries:', error);
      throw error;
    }

    return data || [];
  }

  static async create(entry: Omit<MdrAnnex1Entry, 'id'>): Promise<MdrAnnex1Entry> {
    const { data, error } = await supabase
      .from('mdr_annex_1')
      .insert(entry as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating MDR Annex 1 entry:', error);
      throw error;
    }

    return data;
  }

  static async update(id: string, entry: Partial<MdrAnnex1Entry>): Promise<MdrAnnex1Entry> {
    const { data, error } = await supabase
      .from('mdr_annex_1')
      .update(entry)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating MDR Annex 1 entry:', error);
      throw error;
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('mdr_annex_1')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting MDR Annex 1 entry:', error);
      throw error;
    }
  }

  static async getByCompany(companyId: string, searchTerm?: string): Promise<MdrAnnex1Entry[]> {
    let query = supabase
      .from('mdr_annex_1')
      .select('*')
      .eq('company_id', companyId)
      .order('mdr_annex_1_attribute');

    if (searchTerm) {
      query = query.or(`mdr_annex_1_attribute.ilike.%${searchTerm}%,chapter.ilike.%${searchTerm}%,gspr_clause.ilike.%${searchTerm}%,responsible_party.ilike.%${searchTerm}%,detail.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching MDR Annex 1 entries by company:', error);
      throw error;
    }

    return data || [];
  }

  static async getByProduct(productId: string, searchTerm?: string): Promise<MdrAnnex1Entry[]> {
    let query = supabase
      .from('mdr_annex_1')
      .select('*')
      .eq('product_id', productId)
      .order('mdr_annex_1_attribute');

    if (searchTerm) {
      query = query.or(`mdr_annex_1_attribute.ilike.%${searchTerm}%,chapter.ilike.%${searchTerm}%,gspr_clause.ilike.%${searchTerm}%,responsible_party.ilike.%${searchTerm}%,detail.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching MDR Annex 1 entries by product:', error);
      throw error;
    }

    return data || [];
  }
}