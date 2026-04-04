import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, File, X } from 'lucide-react';
import { DocumentTemplateFileService } from '@/services/documentTemplateFileService';
import { toast } from 'sonner';
import { testSupabaseConnection } from '@/utils/supabaseConnectionTest';

interface DocumentFileUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: any;
  companyId: string;
  onFileUploaded: () => void;
}

export function DocumentFileUpload({
  open,
  onOpenChange,
  document,
  companyId,
  onFileUploaded
}: DocumentFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Run connection test on component mount
  useEffect(() => {
    if (open) {
      testSupabaseConnection().then(results => {
        console.log('🔍 Supabase Connection Test Results:', results);
      });
    }
  }, [open]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('🔍 File selected:', { 
        name: file.name, 
        size: file.size, 
        type: file.type 
      });

      // Use the centralized validation
      const { validateFileUpload } = await import('@/utils/storageUtils');
      const validationError = await validateFileUpload(file);
      
      if (validationError) {
        console.error('❌ File validation failed:', validationError);
        toast.error(validationError);
        return;
      }

      console.log('✅ File validation passed');
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const filePath = await DocumentTemplateFileService.uploadFile(
        document.id,
        selectedFile,
        companyId
      );

      if (filePath) {
        onFileUploaded();
        onOpenChange(false);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Template File</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Upload a file for template: <strong>{document.name}</strong>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <File className="h-8 w-8 text-blue-500" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{selectedFile.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Or drag and drop a file here
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOCX, and DOC <span className="text-amber-600 font-bold">(Not Recommended)</span>, Excel, PowerPoint files (max 50MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}