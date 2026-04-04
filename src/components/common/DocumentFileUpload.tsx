import React, { useState, useRef, useEffect, useCallback } from "react";
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadFileToStorage } from "@/utils/storageUtils";
import { cn } from "@/lib/utils";

interface DocumentFileUploadProps {
  onFileChange: (file: File | null, filePath?: string) => void;
  disabled?: boolean;
  currentFile?: {
    name: string;
    path: string;
    uploadedAt?: string;
  };
}

export function DocumentFileUpload({ 
  onFileChange, 
  disabled = false,
  currentFile 
}: DocumentFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileRemoved, setIsFileRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRemovingRef = useRef(false);

  useEffect(() => {
    setIsFileRemoved(false);
    isRemovingRef.current = false;
  }, [currentFile]);

  const validatePdfAndDoc = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf', // PDF
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];

    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    // Check by MIME type
    if (!allowedTypes.includes(file.type)) {
      // Also check by file extension as fallback (some browsers don't set MIME type correctly)
      if (!allowedExtensions.includes(fileExtension)) {
        return 'Only PDF, DOC, and DOCX files are allowed. Please upload a .pdf, .doc, or .docx file.';
      }
    }
    
    // Check file size (50MB max)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return `File size too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB.`;
    }
    
    return null;
  };

  const handleFileSelect = async (file: File) => {
    
    // Validate file type (PDF and DOC only)
    const validationError = validatePdfAndDoc(file);
    if (validationError) {
      console.error('❌ DocumentFileUpload: Validation failed:', validationError);
      toast.error(validationError);
      setUploadStatus('error');
      return;
    }
    
    setSelectedFile(file);
    setIsFileRemoved(false);
    isRemovingRef.current = false;
    setUploadStatus('uploading');

    // Notify parent that upload is starting
    onFileChange(file, undefined);

    try {
      // Generate unique file path
      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `documents/${timestamp}_${cleanFileName}`;   
      // Upload to Supabase Storage
      const uploadedPath = await uploadFileToStorage(file, filePath);

      setUploadStatus('success');
      
      // Notify parent with both file and path
      onFileChange(file, uploadedPath);
      
    } catch (error) {
      // console.error('❌ DocumentFileUpload: Upload failed:', error);
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

  const handleRemoveFile = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isRemovingRef.current) {
      return;
    }
    
    // Set removing flag immediately
    isRemovingRef.current = true;
    
    // Clear the selected file and reset upload status
    setSelectedFile(null);
    setUploadStatus('idle');
    setIsFileRemoved(true);

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Notify parent to clear the file completely
    onFileChange(null, null);

    // Reset removing flag after state updates
    setTimeout(() => {
      isRemovingRef.current = false;
    }, 100);

  }, [onFileChange, isFileRemoved, selectedFile, currentFile, uploadStatus, disabled]);

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
        if (isFileRemoved) {
          return 'Drop files here or click to upload';
        }
        return currentFile ? `Current: ${currentFile.name}` : 'Drop files here or click to upload';
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
      <label className="block text-sm font-medium text-gray-700">
        Document File (Optional)
      </label>
      
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
                PDF, DOCX, and DOC <span className="text-amber-600 font-bold">(Not Recommended)</span> files only (max 50MB)
              </p>
            )}
            
            {uploadStatus === 'success' && currentFile?.uploadedAt && (
              <p className="text-xs text-gray-500">
                Uploaded {new Date(currentFile.uploadedAt).toLocaleDateString()}
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
                {(selectedFile || currentFile) && !isFileRemoved ? 'Change File' : 'Select File'}
              </Button>
            )}
            
            {(selectedFile || currentFile) && uploadStatus !== 'uploading' && !isFileRemoved && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveFile}
                disabled={disabled || isRemovingRef.current}
              >
                <X className="h-4 w-4 mr-2" />
                {isRemovingRef.current ? 'Removing...' : 'Remove'}
              </Button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={disabled}
        />
      </div>
      
      {uploadStatus === 'uploading' && (
        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
          Please wait while your file is being uploaded...
        </div>
      )}
    </div>
  );
}
