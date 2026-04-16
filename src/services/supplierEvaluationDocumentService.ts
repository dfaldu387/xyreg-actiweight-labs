import { supabase } from '@/integrations/supabase/client';
import { SupplierEvaluationDocument } from '@/types/supplier';

export class SupplierEvaluationDocumentService {
  static async getDocuments(supplierId: string): Promise<SupplierEvaluationDocument[]> {
    const { data, error } = await supabase
      .from('supplier_evaluation_documents')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as SupplierEvaluationDocument[];
  }

  static async createDocument(document: Omit<SupplierEvaluationDocument, 'id' | 'created_at' | 'updated_at'>): Promise<SupplierEvaluationDocument> {
    const { data, error } = await supabase
      .from('supplier_evaluation_documents')
      .insert(document as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as SupplierEvaluationDocument;
  }

  static async updateDocument(id: string, updates: Partial<SupplierEvaluationDocument>): Promise<SupplierEvaluationDocument> {
    const { data, error } = await supabase
      .from('supplier_evaluation_documents')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as SupplierEvaluationDocument;
  }

  static async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('supplier_evaluation_documents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}