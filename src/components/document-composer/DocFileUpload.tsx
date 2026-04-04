import React, { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface DocFileUploadProps {
  onFileChange: (file: File | null, filePath?: string) => void;
  disabled?: boolean;
}

export function DocFileUpload({ 
  onFileChange, 
  disabled = false
}: DocFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateDocFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const allowedExtensions = ['.doc', '.docx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return 'Please select a .doc or .docx file only.';
    }
    
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return 'File size must be less than 50MB.';
    }
    
    return null;
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('You must be logged in to upload files.');
      }

      // Generate unique file path
      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `uploaded-documents/${user.id}/${timestamp}_${cleanFileName}`;
       
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      return filePath;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileSelect = async (file: File) => {
    
    // Validate file
    const validationError = validateDocFile(file);
    if (validationError) {
      console.error('Validation failed:', validationError);
      toast.error(validationError);
      setUploadStatus('error');
      return;
    }
    
    setSelectedFile(file);
    setUploadStatus('uploading');
    
    // Notify parent that upload is starting
    onFileChange(file, undefined);

    try {
      // Upload to Supabase Storage
      const uploadedPath = await uploadToSupabase(file);
           
      setUploadStatus('success');
      toast.success(`File "${file.name}" uploaded successfully`);
      
      // Notify parent with both file and path
      onFileChange(file, uploadedPath);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMessage);
      
      // Notify parent that upload failed
      onFileChange(null, undefined);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    onFileChange(null, undefined);
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Upload className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return selectedFile ? `Uploading ${selectedFile.name}...` : 'Uploading...';
      case 'success':
        if (selectedFile) {
          return `✓ ${selectedFile.name} (${formatFileSize(selectedFile.size)})`;
        }
        return 'Upload successful';
      case 'error':
        return 'Upload failed. Please try again.';
      default:
        return 'Drop .doc/.docx files here or click to upload';
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
          isDragging && !disabled
            ? "border-blue-400 bg-blue-50"
            : uploadStatus === 'success'
            ? "border-green-300 bg-green-50"
            : uploadStatus === 'error'
            ? "border-red-300 bg-red-50"
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center space-y-3">
          {getStatusIcon()}
          
          <div className="space-y-1">
            <p className={cn("text-sm font-medium", getStatusColor())}>
              {getStatusText()}
            </p>
            
            {uploadStatus === 'idle' && (
              <p className="text-xs text-gray-500">
                Word documents only (.doc, .docx) - max 50MB
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {uploadStatus !== 'uploading' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <FileText className="h-4 w-4 mr-2" />
                {selectedFile ? 'Change File' : 'Select File'}
              </Button>
            )}
            
            {selectedFile && uploadStatus !== 'uploading' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveFile}
                disabled={disabled}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={disabled}
        />
      </div>
      
      {uploadStatus === 'uploading' && (
        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
          Please wait while your document is being uploaded...
        </div>
      )}
    </div>
  );
}
