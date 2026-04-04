import { supabase } from '@/integrations/supabase/client';

export class SupplierDocumentService {
  static async uploadDocument(file: File, supplierId: string, companyId: string, checklistItem: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${checklistItem}.${fileExt}`;
    const filePath = `${companyId}/${supplierId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('supplier-documents')
      .upload(filePath, file);

    if (error) throw error;

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('supplier-documents')
      .getPublicUrl(filePath);

    return {
      path: data.path,
      url: urlData.publicUrl,
      fileName: file.name
    };
  }

  static async deleteDocument(filePath: string) {
    const { error } = await supabase.storage
      .from('supplier-documents')
      .remove([filePath]);

    if (error) throw error;
  }

  static getDocumentUrl(filePath: string) {
    const { data } = supabase.storage
      .from('supplier-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  static async downloadDocument(filePath: string) {
    const { data, error } = await supabase.storage
      .from('supplier-documents')
      .download(filePath);

    if (error) throw error;
    return data;
  }
}