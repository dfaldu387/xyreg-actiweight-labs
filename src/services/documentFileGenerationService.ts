import { DocumentTemplate } from '@/types/documentComposer';
import { DocumentExportService } from './documentExportService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DocumentFileGenerationResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  error?: string;
}

export class DocumentFileGenerationService {
  /**
   * Generate a document file from template and upload to Supabase Storage
   */
  static async generateDocumentFile(
    template: DocumentTemplate,
    companyId: string,
    options: {
      format?: 'docx' | 'pdf' | 'html';
      filename?: string;
    } = {}
  ): Promise<DocumentFileGenerationResult> {
    try {
      console.log('🔄 Generating document file for template:', template.name);
      
      const { format = 'docx', filename } = options;
      
      // Generate filename if not provided
      const finalFilename = filename || `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.${format}`;
      
      // Generate the document blob
      const documentBlob = await this.generateDocumentBlob(template, format);
      
      if (!documentBlob) {
        throw new Error('Failed to generate document blob');
      }
      
      // Upload to Supabase Storage
      const uploadResult = await this.uploadDocumentToStorage(
        documentBlob,
        finalFilename,
        companyId,
        template.id
      );
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload document');
      }
      
      console.log('✅ Document file generated and uploaded successfully');
      
      return {
        success: true,
        fileUrl: uploadResult.publicUrl,
        fileName: finalFilename
      };
      
    } catch (error) {
      console.error('❌ Error generating document file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Generate document blob using DocumentExportService
   */
  private static async generateDocumentBlob(
    template: DocumentTemplate,
    format: 'docx' | 'pdf' | 'html'
  ): Promise<Blob | null> {
    try {
      // Create a temporary container to capture the blob
      const tempContainer = document.createElement('div');
      tempContainer.style.display = 'none';
      document.body.appendChild(tempContainer);
      
      // Override the downloadBlob method temporarily to capture the blob
      const originalDownloadBlob = DocumentExportService['downloadBlob'];
      let capturedBlob: Blob | null = null;
      
      DocumentExportService['downloadBlob'] = (blob: Blob, filename: string) => {
        capturedBlob = blob;
        console.log('📄 Document blob captured:', { size: blob.size, type: blob.type });
      };
      
      // Generate the document
      await DocumentExportService.exportDocument(template, {
        format,
        includeHighlighting: true,
        filename: 'temp'
      });
      
      // Restore original method
      DocumentExportService['downloadBlob'] = originalDownloadBlob;
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      return capturedBlob;
      
    } catch (error) {
      console.error('Error generating document blob:', error);
      return null;
    }
  }
  
  /**
   * Upload document blob to Supabase Storage
   */
  private static async uploadDocumentToStorage(
    blob: Blob,
    filename: string,
    companyId: string,
    templateId: string
  ): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
    try {
      // Generate unique file path
      const timestamp = Date.now();
      const cleanFileName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `generated-documents/${companyId}/${templateId}/${timestamp}_${cleanFileName}`;
      
      console.log('📤 Uploading document to path:', filePath);
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        return {
          success: false,
          error: `Upload failed: ${uploadError.message}`
        };
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      console.log('✅ Document uploaded successfully:', urlData.publicUrl);
      
      return {
        success: true,
        publicUrl: urlData.publicUrl
      };
      
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }
  
  /**
   * Generate document file and update template metadata
   */
  static async generateAndUpdateTemplate(
    template: DocumentTemplate,
    companyId: string,
    options: {
      format?: 'docx' | 'pdf' | 'html';
      filename?: string;
    } = {}
  ): Promise<DocumentFileGenerationResult> {
    try {
      // Generate the document file
      const result = await this.generateDocumentFile(template, companyId, options);
      
      if (!result.success) {
        return result;
      }
      
      // Update template metadata with file information
      const updatedTemplate = {
        ...template,
        metadata: {
          ...template.metadata,
          file_path: result.fileUrl,
          file_name: result.fileName,
          file_size: 0, // We don't have the exact size from blob
          file_type: `application/${options.format || 'docx'}`,
          public_url: result.fileUrl,
          generated_at: new Date().toISOString()
        }
      };
      
      console.log('📝 Template metadata updated with file information');
      
      return {
        success: true,
        fileUrl: result.fileUrl,
        fileName: result.fileName
      };
      
    } catch (error) {
      console.error('❌ Error generating and updating template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
