import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class DocumentTemplateFileService {
  private static BUCKET_NAME = 'document-templates';

  /**
   * Upload a file for a document template
   */
  static async uploadFile(
    documentId: string, 
    file: File, 
    companyId: string
  ): Promise<string | null> {
    try {
      // Create file path: companyId/documentId/filename
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${companyId}/${documentId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('File upload error:', error);
        toast.error('Failed to upload file');
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      // Update the document template with file info
      await this.updateDocumentWithFileInfo(documentId, {
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        public_url: urlData.publicUrl
      });

      toast.success('File uploaded successfully');
      return filePath;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
      return null;
    }
  }

  /**
   * Download a file from storage
   */
  static async downloadFile(filePath: string, fileName: string): Promise<void> {
    try {
      // Direct download attempt
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(filePath);

      if (error) {
        console.error('❌ [DOWNLOAD] File download error:', error);
        console.error('❌ [DOWNLOAD] Error details:', JSON.stringify(error, null, 2));
        
        // Handle the specific case where the file doesn't exist
        if (error.message?.includes('not_found') || error.message?.includes('Object not found') || error.name === 'StorageApiError') {
          toast.error(`File "${fileName}" is not available for download. This template may not have an attached file.`);
        } else if (error.message?.includes('unauthorized') || error.message?.includes('permission') || error.message?.includes('Unauthorized')) {
          toast.error('Access denied. You may not have permission to download this file.');
        } else if (error.name === 'StorageUnknownError' || error.message === '{}') {
          // This specific error suggests the file path doesn't exist
          toast.error(`File "${fileName}" is not available for download. This template may not have an attached file.`);
          console.error('❌ [DOWNLOAD] StorageUnknownError likely indicates missing file at path:', filePath);
        } else {
          toast.error(`Download failed: ${error.message || 'Unknown storage error'}`);
        }
        return;
      }

      if (!data) {
        console.error('❌ [DOWNLOAD] No file data received');
        toast.error('No file data received. Please try again.');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${fileName} downloaded successfully`);
    } catch (error) {
      console.error('❌ [DOWNLOAD] Critical error during download:', error);
      console.error('❌ [DOWNLOAD] Full error object:', JSON.stringify(error, null, 2));
      toast.error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a blob URL for viewing a file (prevents Chrome blocking)
   */
  static async getViewUrl(filePath: string): Promise<string | null> {
    try {
      // Download the file as blob first
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(filePath);

      if (error) {
        console.error('❌ [VIEW URL] Error downloading file for blob:', error);
        return null;
      }

      // Create blob URL that won't be blocked by Chrome
      const blobUrl = URL.createObjectURL(data);
      return blobUrl;
    } catch (error) {
      console.error('❌ [VIEW URL] Error getting view URL:', error);
      return null;
    }
  }

  /**
   * Get public URL for a file (for Google Docs Viewer)
   */
  static getPublicUrl(filePath: string): string | null {
    try {
      const { data } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('❌ [PUBLIC URL] Error getting public URL:', error);
      return null;
    }
  }

  /**
   * Open file in new tab using blob URL
   */
  static async openFileInNewTab(filePath: string, fileName: string): Promise<void> {
    try {
      // Download the file as blob
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(filePath);

      if (error) {
        console.error('❌ [NEW TAB] Error downloading file:', error);
        toast.error('Failed to open file');
        return;
      }

      // Create blob URL
      const blobUrl = URL.createObjectURL(data);
      
      // Open in new tab
      const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      
      if (!newWindow) {
        // toast.error('Popup blocked. Please allow popups for this site.');
        URL.revokeObjectURL(blobUrl);
        return;
      }

      // Clean up blob URL after a delay to allow the browser to load it
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 5000);

      toast.success(`${fileName} opened in new tab`);
    } catch (error) {
      console.error('❌ [NEW TAB] Error opening file in new tab:', error);
      toast.error('Failed to open file in new tab');
    }
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('File deletion error:', error);
        toast.error('Failed to delete file');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
      return false;
    }
  }

  /**
   * Update document template with file information
   */
  private static async updateDocumentWithFileInfo(
    documentId: string, 
    fileInfo: {
      file_path: string;
      file_name: string;
      file_size: number;
      file_type: string;
      public_url: string;
    }
  ): Promise<void> {
    try {
      // Clean the document ID by removing template- prefix if present
      const cleanDocumentId = documentId.replace('template-', '');
      
      // First check which table contains this document
      const { data: companyCheck, error: companyCheckError } = await supabase
        .from('company_document_templates')
        .select('id, name, document_type')
        .eq('id', cleanDocumentId)
        .maybeSingle();

      if (companyCheck) {
        // Try updating company_document_templates first
        const { data: templateData, error: templateError } = await supabase
          .from('company_document_templates')
          .update({
            file_path: fileInfo.file_path,
            file_name: fileInfo.file_name,
            file_size: fileInfo.file_size,
            file_type: fileInfo.file_type,
            public_url: fileInfo.public_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', cleanDocumentId)
          .select();

        if (templateError) {
          console.error('❌ [DEBUG] Company template update error:', templateError);
          throw new Error(`Failed to update company template: ${templateError.message}`);
        }

        return;
      }
      
      // Check phase_assigned_document_template table
      const { data: phaseCheck, error: phaseCheckError } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, document_type')
        .eq('id', cleanDocumentId)
        .maybeSingle();

      if (phaseCheck) {
        const { data: phaseData, error: phaseError } = await supabase
          .from('phase_assigned_document_template')
          .update({
            file_path: fileInfo.file_path,
            file_name: fileInfo.file_name,
            file_size: fileInfo.file_size,
            file_type: fileInfo.file_type,
            public_url: fileInfo.public_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', cleanDocumentId)
          .select();

        if (phaseError) {
          console.error('❌ Phase document update failed:', phaseError);
          throw new Error(`Failed to update document in phase_assigned_document_template: ${phaseError.message}`);
        }
        
        return;
      }
      
      // Check documents table as final fallback
      const { data: documentCheck, error: documentCheckError } = await supabase
        .from('documents')
        .select('id, name, document_type')
        .eq('id', cleanDocumentId)
        .maybeSingle();

      if (documentCheck) {
        const { data: documentsData, error: documentsError } = await supabase
          .from('documents')
          .update({
            file_path: fileInfo.file_path,
            file_name: fileInfo.file_name,
            file_size: fileInfo.file_size,
            file_type: fileInfo.file_type,
            public_url: fileInfo.public_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', cleanDocumentId)
          .select();

        if (documentsError) {
          console.error('❌ Documents table update failed:', documentsError);
          throw new Error(`Failed to update document in documents table: ${documentsError.message}`);
        }
        
        return;
      }
      
      console.error('❌ Document not found in any table');
      throw new Error(`Document with ID ${documentId} not found in any of the expected tables (company_document_templates, phase_assigned_document_template, documents)`);
    } catch (error) {
      console.error('❌ Error updating document with file info:', error);
      throw error;
    }
  }

  /**
   * Check if document has an attached file
   */
  static hasAttachedFile(document: any): boolean {
    const hasFile = !!(document.file_path && document.file_name);
    return hasFile;
  }

  /**
   * Get file icon based on file type
   */
  static getFileIcon(document: any): string {
    if (!this.hasAttachedFile(document)) return '';
    
    const fileType = document.file_type?.toLowerCase() || document.file_name?.split('.').pop()?.toLowerCase();
    
    if (!fileType) return 'file';
    
    if (fileType.includes('pdf')) return 'file-text';
    if (fileType.includes('word') || fileType.includes('doc')) return 'file-text';
    if (fileType.includes('excel') || fileType.includes('sheet')) return 'file-spreadsheet';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'presentation';
    if (fileType.includes('image')) return 'image';
    
    return 'file';
  }
}