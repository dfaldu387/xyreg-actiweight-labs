
import { supabase } from '@/integrations/supabase/client';

export async function validateFileUpload(file: File): Promise<string | null> {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'File type not supported. Please upload PDF, Word, Excel, PowerPoint, text, or image files.';
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return `File size too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB.`;
  }
  
  return null;
}

export async function uploadFileToStorage(file: File, filePath: string): Promise<string> {
  try {
    console.log('🔄 Starting file upload to storage:', filePath);
    
    // Validate file first
    const validationError = await validateFileUpload(file);
    if (validationError) {
      throw new Error(validationError);
    }

    // Check authentication status before attempting upload
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      throw new Error('You must be logged in to upload files. Please refresh the page and try again.');
    }

    console.log('✅ User authenticated, proceeding with upload');

    // Upload to Supabase Storage with improved error handling
    const { error: uploadError } = await supabase.storage
      .from('document-templates')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload error details:', {
        message: uploadError.message,
        error: uploadError
      });
      
      // Provide more specific error messages based on the error
      if (uploadError.message?.includes('already exists')) {
        throw new Error('A file with this name already exists. Please rename your file or try again.');
      } else if (uploadError.message?.includes('size') || uploadError.message?.includes('too large')) {
        throw new Error('File size exceeds the maximum allowed limit of 50MB.');
      } else if (uploadError.message?.includes('type') || uploadError.message?.includes('not allowed')) {
        throw new Error('File type is not allowed. Please upload PDF, Word, Excel, PowerPoint, text, or image files.');
      } else if (uploadError.message?.includes('not found') || uploadError.message?.includes('bucket')) {
        throw new Error('Storage service is temporarily unavailable. Please try again in a moment.');
      } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('unauthorized') || uploadError.message?.includes('403')) {
        throw new Error('Permission denied. Please ensure you are logged in and have the necessary permissions to upload files.');
      } else if (uploadError.message?.includes('network') || uploadError.message?.includes('timeout')) {
        throw new Error('Network error occurred. Please check your connection and try again.');
      } else {
        throw new Error(`Upload failed: ${uploadError.message || 'Unknown error occurred'}`);
      }
    }

    console.log('✅ File uploaded successfully to:', filePath);
    return filePath;
    
  } catch (error) {
    console.error('❌ Error in uploadFileToStorage:', error);
    throw error;
  }
}
