import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  version_name?: string;
  document_data: any;
  created_at: string;
  created_by?: string;
  change_summary?: string;
  is_current: boolean;
}

export interface CreateVersionParams {
  documentId: string;
  versionName?: string;
  changeSummary?: string;
  documentData: any;
  createdBy?: string;
}

export class DocumentVersionService {
  /**
   * Create a new version by saving the current document state as a version
   * and updating the main document with new data
   */
  static async createVersion(params: CreateVersionParams): Promise<{ success: boolean; error?: string; versionNumber?: number }> {
    try {
      console.log('[DocumentVersionService] Creating version for document:', params.documentId);

      // First, get the current document to preserve as a version
      const { data: currentDocument, error: docError } = await supabase
        .from('document_studio_templates')
        .select('*')
        .eq('id', params.documentId)
        .single();

      if (docError) {
        console.error('[DocumentVersionService] Error fetching current document:', docError);
        return { success: false, error: 'Failed to fetch current document' };
      }

      // Get the next version number
      const { data: existingVersions, error: versionError } = await supabase
        .from('document_versions')
        .select('version_number')
        .eq('document_id', params.documentId)
        .order('version_number', { ascending: false })
        .limit(1);

      if (versionError) {
        console.error('[DocumentVersionService] Error fetching version numbers:', versionError);
        return { success: false, error: 'Failed to get version number' };
      }

      const nextVersionNumber = (existingVersions?.[0]?.version_number || 0) + 1;

      // Mark all existing versions as not current
      const { error: updateError } = await supabase
        .from('document_versions')
        .update({ is_current: false })
        .eq('document_id', params.documentId);

      if (updateError) {
        console.error('[DocumentVersionService] Error updating existing versions:', updateError);
        // Continue anyway, this is not critical
      }

      // Use provided version name or generate default based on version number
      const versionName = params.versionName || `Version ${nextVersionNumber}`;

      // Create the version entry with the previous document state
      const { error: insertError } = await supabase
        .from('document_versions')
        .insert({
          document_id: params.documentId,
          version_number: nextVersionNumber,
          version_name: versionName,
          document_data: currentDocument, // Store the current document state as the previous version
          created_by: params.createdBy,
          change_summary: params.changeSummary || `Document saved as ${versionName}`,
          is_current: false // The previous version is not current
        });

      if (insertError) {
        console.error('[DocumentVersionService] Error creating version:', insertError);
        return { success: false, error: 'Failed to create document version' };
      }

      console.log('[DocumentVersionService] Version created successfully:', nextVersionNumber);
      return { success: true, versionNumber: nextVersionNumber };
    } catch (error) {
      console.error('[DocumentVersionService] Unexpected error:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get all versions for a document
   */
  static async getDocumentVersions(documentId: string): Promise<{ success: boolean; data?: DocumentVersion[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select(`
          id,
          document_id,
          version_number,
          version_name,
          document_data,
          created_at,
          created_by,
          change_summary,
          is_current
        `)
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) {
        console.error('[DocumentVersionService] Error fetching versions:', error);
        return { success: false, error: 'Failed to fetch document versions' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('[DocumentVersionService] Unexpected error:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get a specific version of a document
   */
  static async getVersion(versionId: string): Promise<{ success: boolean; data?: DocumentVersion; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (error) {
        console.error('[DocumentVersionService] Error fetching version:', error);
        return { success: false, error: 'Failed to fetch document version' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('[DocumentVersionService] Unexpected error:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Restore a document to a specific version
   */
  static async restoreVersion(documentId: string, versionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the version data
      const versionResult = await this.getVersion(versionId);
      if (!versionResult.success || !versionResult.data) {
        return { success: false, error: 'Version not found' };
      }

      const versionData = versionResult.data.document_data;

      // Create a new version with the current state before restoring
      const createResult = await this.createVersion({
        documentId,
        versionName: `Backup before restoring to v${versionResult.data.version_number}`,
        changeSummary: `Automatic backup created before restoring to version ${versionResult.data.version_number}`,
        documentData: versionData
      });

      if (!createResult.success) {
        return { success: false, error: 'Failed to create backup version' };
      }

      // Update the main document with the version data
      const { error: updateError } = await supabase
        .from('document_studio_templates')
        .update(versionData)
        .eq('id', documentId);

      if (updateError) {
        console.error('[DocumentVersionService] Error restoring version:', updateError);
        return { success: false, error: 'Failed to restore document version' };
      }

      return { success: true };
    } catch (error) {
      console.error('[DocumentVersionService] Unexpected error:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get current document content for comparison
   */
  static async getCurrentDocumentContent(documentId: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const { data: document, error } = await supabase
        .from('document_studio_templates')
        .select('sections, name, type')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('[DocumentVersionService] Error fetching current document:', error);
        return { success: false, error: 'Failed to fetch current document' };
      }

      // Convert document data to readable text format
      const content = this.formatDocumentContent(document);
      return { success: true, data: content };
    } catch (error) {
      console.error('[DocumentVersionService] Error fetching current document:', error);
      return { success: false, error: 'Failed to fetch current document' };
    }
  }

  /**
   * Get specific version content for comparison
   */
  static async getVersionContent(documentId: string, versionId: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const { data: version, error } = await supabase
        .from('document_versions')
        .select('document_data')
        .eq('id', versionId)
        .eq('document_id', documentId)
        .single();

      if (error) {
        console.error('[DocumentVersionService] Error fetching version:', error);
        return { success: false, error: 'Failed to fetch version' };
      }

      // Convert version data to readable text format
      const content = this.formatDocumentContent(version.document_data);
      return { success: true, data: content };
    } catch (error) {
      console.error('[DocumentVersionService] Error fetching version:', error);
      return { success: false, error: 'Failed to fetch version' };
    }
  }

  /**
   * Update an existing version
   */
  static async updateVersion(
    versionId: string,
    updates: {
      version_name?: string;
      change_summary?: string;
      document_data?: any;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('document_versions')
        .update(updates)
        .eq('id', versionId);

      if (error) {
        console.error('[DocumentVersionService] Error updating version:', error);
        return { success: false, error: 'Failed to update version' };
      }

      return { success: true };
    } catch (error) {
      console.error('[DocumentVersionService] Unexpected error:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Format document data to readable text for AI comparison
   */
  private static formatDocumentContent(documentData: any): string {
    if (!documentData) return '';

    let content = '';
    
    if (documentData.name) {
      content += `Document: ${documentData.name}\n\n`;
    }
    
    if (documentData.type) {
      content += `Type: ${documentData.type}\n\n`;
    }
    
    if (documentData.sections && Array.isArray(documentData.sections)) {
      content += 'Sections:\n';
      documentData.sections.forEach((section: any, index: number) => {
        content += `\n${index + 1}. ${section.title || 'Untitled Section'}\n`;
        if (section.content && Array.isArray(section.content)) {
          section.content.forEach((item: any) => {
            if (item.content) {
              content += `   ${item.content}\n`;
            }
          });
        }
      });
    }

    return content.trim();
  }
}