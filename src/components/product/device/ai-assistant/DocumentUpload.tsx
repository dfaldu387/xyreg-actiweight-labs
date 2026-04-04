import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentUploadProps {
  onFileUpload: (file: File) => void;
  acceptedTypes?: Record<string, string[]>;
  maxSize?: number; // in bytes
  description?: string;
  className?: string;
}

export function DocumentUpload({
  onFileUpload,
  acceptedTypes = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt']
  },
  maxSize = 20 * 1024 * 1024, // 20MB default
  description = "Upload documents to extract content for AI analysis",
  className
}: DocumentUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejectedFile = rejectedFiles[0];
      if (rejectedFile.errors?.some((error: any) => error.code === 'file-too-large')) {
        console.error('File too large:', rejectedFile.file.name);
        return;
      }
      if (rejectedFile.errors?.some((error: any) => error.code === 'file-invalid-type')) {
        console.error('Invalid file type:', rejectedFile.file.name);
        return;
      }
    }

    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize,
    multiple: false
  });

  const getAcceptedTypesText = () => {
    const extensions = Object.values(acceptedTypes).flat();
    return extensions.join(', ').toUpperCase();
  };

  const getMaxSizeText = () => {
    const sizeInMB = maxSize / (1024 * 1024);
    return `${sizeInMB}MB`;
  };

  return (
    <div className={className}>
      <Card
        {...getRootProps()}
        className={`
          border-2 border-dashed cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            {isDragActive ? (
              <Upload className="w-8 h-8 text-white animate-bounce" />
            ) : (
              <FileText className="w-8 h-8 text-white" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isDragActive ? 'Drop your document here' : 'Upload Document'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {description}
            </p>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="pointer-events-none"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
            <p className="text-xs text-muted-foreground">
              Supported: {getAcceptedTypesText()} • Max size: {getMaxSizeText()}
            </p>
          </div>
        </div>
      </Card>

      {fileRejections.length > 0 && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {fileRejections[0]?.errors[0]?.code === 'file-too-large' && 
              `File is too large. Maximum size is ${getMaxSizeText()}.`
            }
            {fileRejections[0]?.errors[0]?.code === 'file-invalid-type' && 
              `File type not supported. Please upload: ${getAcceptedTypesText()}`
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}