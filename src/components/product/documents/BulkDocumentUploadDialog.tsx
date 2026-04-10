import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFileToStorage } from '@/utils/storageUtils';
import { extractTextFromChecklistFile } from '@/utils/gapChecklistTextExtractor';
import { DocumentCreationService } from '@/services/documentCreationService';
import { DocumentStudioPersistenceService } from '@/services/documentStudioPersistenceService';
import { cn } from '@/lib/utils';

interface BulkDocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
  onComplete?: () => void;
}

type FileStatus = 'pending' | 'uploading' | 'extracting' | 'saving' | 'done' | 'error';

interface FileEntry {
  file: File;
  status: FileStatus;
  error?: string;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

function getNameWithoutExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}

export function BulkDocumentUploadDialog({
  open,
  onOpenChange,
  productId,
  companyId,
  onComplete,
}: BulkDocumentUploadDialogProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setFiles([]);
    setIsProcessing(false);
    setProcessedCount(0);
  }, []);

  const handleClose = useCallback((open: boolean) => {
    if (!open && !isProcessing) {
      reset();
    }
    if (!isProcessing) {
      onOpenChange(open);
    }
  }, [isProcessing, onOpenChange, reset]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const validFiles: FileEntry[] = [];
    for (const file of Array.from(newFiles)) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext)) {
        validFiles.push({ file, status: 'pending' });
      }
    }
    if (validFiles.length === 0) {
      toast.error('Only PDF and DOCX files are supported.');
      return;
    }
    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const updateFileStatus = (index: number, status: FileStatus, error?: string) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, status, error } : f));
  };

  const processFiles = async () => {
    setIsProcessing(true);
    setProcessedCount(0);
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      const { file } = files[i];
      const docName = getNameWithoutExtension(file.name);

      try {
        // Step 1: Upload to storage
        updateFileStatus(i, 'uploading');
        const filePath = `${companyId}/${productId}/${crypto.randomUUID()}-${file.name}`;
        await uploadFileToStorage(file, filePath);

        // Step 2: Create CI record
        updateFileStatus(i, 'saving');
        const ciId = await DocumentCreationService.createDocument({
          name: docName,
          documentType: 'Standard',
          scope: 'product_document',
          companyId,
          productId,
          filePath,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          status: 'Not Started',
          silent: true,
        });

        if (!ciId) throw new Error('Failed to create document record');

        // Step 3: Extract text
        updateFileStatus(i, 'extracting');
        let extractedText = '';
        try {
          extractedText = await extractTextFromChecklistFile(file);
        } catch (extractErr) {
          console.warn('Text extraction failed for', file.name, extractErr);
          extractedText = '[Text extraction was not possible for this file]';
        }

        // Step 4: Save as Studio draft
        await DocumentStudioPersistenceService.saveTemplate({
          template_id: ciId,
          company_id: companyId,
          product_id: productId,
          name: docName,
          type: 'Standard',
          sections: [{
            title: 'Content',
            content: [{ type: 'paragraph', content: extractedText || '[No text extracted]' }],
          }],
          metadata: { source: 'bulk_upload', original_filename: file.name },
        });

        updateFileStatus(i, 'done');
        succeeded++;
      } catch (err: any) {
        console.error('Bulk upload error for', file.name, err);
        updateFileStatus(i, 'error', err?.message || 'Unknown error');
        failed++;
      }

      setProcessedCount(i + 1);
    }

    setIsProcessing(false);

    if (succeeded > 0) {
      toast.success(`Created ${succeeded} document${succeeded > 1 ? 's' : ''} successfully${failed > 0 ? ` (${failed} failed)` : ''}`);
      onComplete?.();
    } else if (failed > 0) {
      toast.error(`All ${failed} uploads failed. Check errors below.`);
    }
  };

  const progressPercent = files.length > 0 ? (processedCount / files.length) * 100 : 0;
  const isDone = !isProcessing && processedCount > 0 && processedCount === files.length;

  const statusIcon = (status: FileStatus) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending': return <FileText className="h-4 w-4 text-muted-foreground" />;
      default: return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    }
  };

  const statusLabel = (status: FileStatus) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'uploading': return 'Uploading…';
      case 'extracting': return 'Extracting text…';
      case 'saving': return 'Creating record…';
      case 'done': return 'Done';
      case 'error': return 'Failed';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Document Upload</DialogTitle>
          <DialogDescription>
            Upload multiple PDF or DOCX files. Each file creates a document CI with the extracted text ready in the editor.
          </DialogDescription>
        </DialogHeader>

        {/* Drop zone */}
        {!isProcessing && !isDone && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              "hover:border-primary hover:bg-primary/5",
              "border-muted-foreground/30"
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop PDF or DOCX files here, or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc"
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-1 max-h-[40vh]">
            {files.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md bg-muted/40">
                {statusIcon(entry.status)}
                <span className="flex-1 truncate">{entry.file.name}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {statusLabel(entry.status)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {isProcessing && (
          <div className="space-y-1">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Processing {processedCount} of {files.length}…
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          {isDone ? (
            <Button onClick={() => handleClose(false)}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                onClick={processFiles}
                disabled={files.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</>
                ) : (
                  `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
