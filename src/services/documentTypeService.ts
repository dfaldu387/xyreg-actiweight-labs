import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DocumentType {
  id: string;
  company_id: string;
  user_id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}

export class DocumentTypeService {
  /**
   * Get all document types for a company
   */
  async getCompanyDocumentTypes(companyId: string): Promise<DocumentType[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('document_types')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching document types:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCompanyDocumentTypes:', error);
      return [];
    }
  }

  /**
   * Create a new document type
   */
  async createDocumentType(
    companyId: string,
    name: string,
    userId: string,
    createdBy?: string,
    showToast: boolean = true
  ): Promise<DocumentType | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('document_types')
        .insert({
          company_id: companyId,
          user_id: userId,
          name: name.trim(),
          created_by: createdBy || null
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          if (showToast) toast.error(`Document type "${name}" already exists`);
        } else {
          console.error('Error creating document type:', error);
          if (showToast) toast.error('Failed to create document type');
        }
        return null;
      }

      if (showToast) toast.success(`Document type "${name}" created`);
      return data;
    } catch (error) {
      console.error('Error in createDocumentType:', error);
      if (showToast) toast.error('Failed to create document type');
      return null;
    }
  }

  /**
   * Update an existing document type
   */
  async updateDocumentType(
    documentTypeId: string,
    updates: Partial<Pick<DocumentType, 'name'>>
  ): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('document_types')
        .update({
          name: updates.name?.trim()
        })
        .eq('id', documentTypeId);

      if (error) {
        if (error.code === '23505') {
          toast.error('A document type with this name already exists');
        } else {
          console.error('Error updating document type:', error);
          toast.error('Failed to update document type');
        }
        return false;
      }

      toast.success('Document type updated');
      return true;
    } catch (error) {
      console.error('Error in updateDocumentType:', error);
      toast.error('Failed to update document type');
      return false;
    }
  }

  /**
   * Delete a document type
   */
  async deleteDocumentType(documentTypeId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('document_types')
        .delete()
        .eq('id', documentTypeId);

      if (error) {
        console.error('Error deleting document type:', error);
        toast.error('Failed to delete document type');
        return false;
      }

      toast.success('Document type deleted');
      return true;
    } catch (error) {
      console.error('Error in deleteDocumentType:', error);
      toast.error('Failed to delete document type');
      return false;
    }
  }

  /**
   * Get or create a document type by name
   * Useful when user types a custom value
   */
  async getOrCreateDocumentType(
    companyId: string,
    name: string,
    userId: string,
    createdBy?: string
  ): Promise<DocumentType | null> {
    try {
      // First try to find existing document type
      const { data: existing } = await (supabase as any)
        .from('document_types')
        .select('*')
        .eq('company_id', companyId)
        .ilike('name', name.trim())
        .maybeSingle();

      if (existing) {
        return existing;
      }

      // If not found, create it (without showing toast for auto-creation)
      const { data, error } = await (supabase as any)
        .from('document_types')
        .insert({
          company_id: companyId,
          user_id: userId,
          name: name.trim(),
          created_by: createdBy || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error auto-creating document type:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrCreateDocumentType:', error);
      return null;
    }
  }
}

// Export singleton instance
export const documentTypeService = new DocumentTypeService();
