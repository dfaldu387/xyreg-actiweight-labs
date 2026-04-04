import { supabase } from '@/integrations/supabase/client';
import type { BomItemDocument, BomDocumentType } from '@/types/bom';

export class BomDocumentService {
  static async listDocuments(bomItemId: string): Promise<BomItemDocument[]> {
    const { data, error } = await supabase
      .from('bom_item_documents')
      .select('*')
      .eq('bom_item_id', bomItemId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as BomItemDocument[];
  }

  static async uploadDocument(
    file: File,
    bomItemId: string,
    companyId: string,
    documentType: BomDocumentType
  ): Promise<BomItemDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${companyId}/${bomItemId}/${timestamp}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('bom-documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('bom_item_documents')
      .insert({
        bom_item_id: bomItemId,
        company_id: companyId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type || null,
        document_type: documentType,
        uploaded_by: user.id,
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as BomItemDocument;
  }

  static async deleteDocument(doc: BomItemDocument): Promise<void> {
    await supabase.storage.from('bom-documents').remove([doc.file_path]);
    const { error } = await supabase
      .from('bom_item_documents')
      .delete()
      .eq('id', doc.id);
    if (error) throw error;
  }

  static getPublicUrl(filePath: string): string {
    const { data } = supabase.storage.from('bom-documents').getPublicUrl(filePath);
    return data.publicUrl;
  }
}
