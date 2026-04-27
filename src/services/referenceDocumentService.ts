import { supabase } from '@/integrations/supabase/client';

export interface ReferenceDocument {
  id: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  tags: string[];
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export class ReferenceDocumentService {
  static async listDocuments(companyId: string): Promise<ReferenceDocument[]> {
    const { data, error } = await supabase
      .from('reference_documents')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as ReferenceDocument[];
  }

  static async uploadFile(
    file: File,
    companyId: string,
    tags: string[] = []
  ): Promise<ReferenceDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Sanitize filename for storage key: keep only ASCII alphanumerics, hyphens, underscores, dots
    const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : '';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const sanitized = baseName
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[^a-zA-Z0-9_-]/g, '_') // replace special chars
      .replace(/_+/g, '_') // collapse multiple underscores
      .substring(0, 100); // limit length
    const filePath = `${companyId}/${Date.now()}_${sanitized}${ext}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('reference-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Insert metadata
    const { data, error } = await supabase
      .from('reference_documents')
      .insert({
        company_id: companyId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type || file.name.split('.').pop() || 'unknown',
        tags,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as ReferenceDocument;
  }

  static async bulkUpload(
    files: File[],
    companyId: string,
    tags: string[] = []
  ): Promise<ReferenceDocument[]> {
    const results: ReferenceDocument[] = [];
    for (const file of files) {
      const doc = await this.uploadFile(file, companyId, tags);
      results.push(doc);
    }
    return results;
  }

  static async deleteDocument(id: string, filePath: string): Promise<void> {
    // Delete from storage
    await supabase.storage.from('reference-documents').remove([filePath]);

    // Delete metadata
    const { error } = await supabase
      .from('reference_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async updateTags(id: string, tags: string[]): Promise<void> {
    const { error } = await supabase
      .from('reference_documents')
      .update({ tags })
      .eq('id', id);

    if (error) throw error;
  }

  static async updateDocument(id: string, updates: { file_name?: string; tags?: string[]; file_type?: string }): Promise<void> {
    const { error } = await supabase
      .from('reference_documents')
      .update(updates as any)
      .eq('id', id);

    if (error) throw error;
  }

  static async getDownloadUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('reference-documents')
      .createSignedUrl(filePath, 3600);

    if (error) throw error;
    return data.signedUrl;
  }

  /**
   * Download a reference document and return it as a Blob for client-side parsing.
   */
  static async downloadAsBlob(filePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('reference-documents')
      .download(filePath);
    if (error) throw error;
    return data;
  }
}
