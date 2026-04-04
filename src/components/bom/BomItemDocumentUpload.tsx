import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useBomItemDocuments } from '@/hooks/useBomItemDocuments';
import { BOM_DOCUMENT_TYPE_LABELS } from '@/types/bom';
import type { BomDocumentType, BomItemDocument } from '@/types/bom';
import { formatBytes } from '@/utils/formatBytes';
import { useTranslation } from '@/hooks/useTranslation';

interface StagedFile {
  file: File;
  documentType: BomDocumentType;
}

interface Props {
  bomItemId?: string; // undefined for new items (staging mode)
  companyId: string;
  stagedFiles?: StagedFile[];
  onStagedFilesChange?: (files: StagedFile[]) => void;
}

const DOC_TYPE_OPTIONS = Object.entries(BOM_DOCUMENT_TYPE_LABELS) as [BomDocumentType, string][];

export function BomItemDocumentUpload({ bomItemId, companyId, stagedFiles, onStagedFilesChange }: Props) {
  const { lang } = useTranslation();
  const { documents, isUploading, upload, deleteDocument, getPublicUrl } = useBomItemDocuments(bomItemId);
  const [docType, setDocType] = useState<BomDocumentType>('material_data_sheet');
  const inputRef = useRef<HTMLInputElement>(null);
  const isStaging = !bomItemId;

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (isStaging && onStagedFilesChange && stagedFiles) {
        onStagedFilesChange([...stagedFiles, { file, documentType: docType }]);
      } else if (bomItemId) {
        upload({ file, companyId, documentType: docType });
      }
    });
  }, [bomItemId, companyId, docType, isStaging, onStagedFilesChange, stagedFiles, upload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeStagedFile = (index: number) => {
    if (onStagedFilesChange && stagedFiles) {
      onStagedFilesChange(stagedFiles.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Label>{lang('bom.documentType')}</Label>
          <Select value={docType} onValueChange={v => setDocType(v as BomDocumentType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOC_TYPE_OPTIONS.map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {isUploading ? lang('bom.uploading') : lang('bom.dropFilesHere')}
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.gif,.webp"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Staged files (new item mode) */}
      {isStaging && stagedFiles && stagedFiles.length > 0 && (
        <div className="space-y-1">
          {stagedFiles.map((sf, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded bg-muted/50 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate flex-1">{sf.file.name}</span>
              <Badge variant="outline" className="text-xs shrink-0">{BOM_DOCUMENT_TYPE_LABELS[sf.documentType]}</Badge>
              <span className="text-muted-foreground text-xs shrink-0">{formatBytes(sf.file.size)}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeStagedFile(i)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Existing documents (edit mode) */}
      {!isStaging && documents.length > 0 && (
        <div className="space-y-1">
          {documents.map((doc: BomItemDocument) => (
            <div key={doc.id} className="flex items-center gap-2 py-1.5 px-2 rounded bg-muted/50 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <a
                href={getPublicUrl(doc.file_path)}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate flex-1 hover:underline text-primary"
              >
                {doc.file_name}
              </a>
              <Badge variant="outline" className="text-xs shrink-0">{BOM_DOCUMENT_TYPE_LABELS[doc.document_type as BomDocumentType] || doc.document_type}</Badge>
              <span className="text-muted-foreground text-xs shrink-0">{formatBytes(doc.file_size)}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => deleteDocument(doc)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { StagedFile };
