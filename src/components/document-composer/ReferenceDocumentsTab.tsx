import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, Trash2, X, FileText, Loader2, Eye, FileEdit, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import type { ReferenceDocument } from '@/services/referenceDocumentService';

interface ReferenceDocumentsTabProps {
  companyId: string | undefined;
  disabled?: boolean;
}

const ACCEPTED_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReferenceDocumentsTab({ companyId, disabled }: ReferenceDocumentsTabProps) {
  const {
    documents, isLoading, upload, isUploading, deleteDocument, updateDocument, downloadDocument
  } = useReferenceDocuments(companyId);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Edit state
  const [editingDoc, setEditingDoc] = useState<ReferenceDocument | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState('');

  // Dropzone
  const onDrop = useCallback((accepted: File[]) => {
    setPendingFiles(prev => [...prev, ...accepted]);
    if (!showUploadDialog) setShowUploadDialog(true);
  }, [showUploadDialog]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
    disabled,
  });

  // Tag helpers (upload)
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !pendingTags.includes(tag)) {
      setPendingTags(prev => [...prev, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setPendingTags(prev => prev.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // Upload
  const handleUpload = () => {
    if (pendingFiles.length === 0) return;
    // Auto-add any uncommitted tag text before uploading
    const finalTags = [...pendingTags];
    const leftover = tagInput.trim();
    if (leftover && !finalTags.includes(leftover)) {
      finalTags.push(leftover);
    }
    upload({ files: pendingFiles, tags: finalTags });
    setPendingFiles([]);
    setPendingTags([]);
    setTagInput('');
    setShowUploadDialog(false);
  };

  const cancelUpload = () => {
    setPendingFiles([]);
    setPendingTags([]);
    setTagInput('');
    setShowUploadDialog(false);
  };

  // Edit handlers
  const openEdit = (doc: ReferenceDocument) => {
    setEditingDoc(doc);
    setEditName(doc.file_name);
    setEditType(doc.file_type || '');
    setEditTags([...(doc.tags || [])]);
    setEditTagInput('');
  };

  const addEditTag = () => {
    const tag = editTagInput.trim();
    if (tag && !editTags.includes(tag)) {
      setEditTags(prev => [...prev, tag]);
      setEditTagInput('');
    }
  };

  const handleEditTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEditTag();
    }
  };

  const handleSaveEdit = () => {
    if (!editingDoc) return;
    updateDocument({
      id: editingDoc.id,
      updates: {
        file_name: editName,
        file_type: editType,
        tags: editTags,
      },
    });
    setEditingDoc(null);
  };

  // View handler
  const handleView = async (filePath: string) => {
    try {
      const { ReferenceDocumentService } = await import('@/services/referenceDocumentService');
      const url = await ReferenceDocumentService.getDownloadUrl(filePath);
      window.open(url, '_blank');
    } catch (error: any) {
      const { toast } = await import('sonner');
      toast.error(`View failed: ${error.message}`);
    }
  };

  // Filter
  const filteredDocs = filterTag
    ? documents.filter(d => d.tags?.some(t => t.toLowerCase().includes(filterTag.toLowerCase())))
    : documents;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedDocs = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, safeCurrentPage, pageSize]);

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Reference Documents</h2>
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <Button size="sm" disabled={disabled || isUploading}>
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading…' : 'Upload Files'}
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="px-4 py-2 border-b">
        <Input
          placeholder="Filter by tag…"
          value={filterTag}
          onChange={e => { setFilterTag(e.target.value); setCurrentPage(1); }}
          className="max-w-xs"
        />
      </div>

      {/* Drop zone overlay hint */}
      {isDragActive && (
        <div className="p-8 text-center border-2 border-dashed border-primary/50 bg-primary/5 m-4 rounded-lg">
          <Upload className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Drop files here to upload</p>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : paginatedDocs.length === 0 && filteredDocs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3 p-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              {filterTag ? 'No documents match this tag.' : 'No reference documents yet. Upload files to get started.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDocs.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium max-w-[400px]">
                    <span className="block truncate" title={doc.file_name}>{doc.file_name}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(doc.tags || []).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {doc.file_type || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatFileSize(doc.file_size)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => handleView(doc.file_path)}
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => openEdit(doc)}
                        disabled={disabled}
                        title="Edit"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => downloadDocument(doc.file_path)}
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => deleteDocument({ id: doc.id, filePath: doc.file_path })}
                        disabled={disabled}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {filteredDocs.length > 0 && (
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((safeCurrentPage - 1) * pageSize) + 1}–{Math.min(safeCurrentPage * pageSize, filteredDocs.length)} of {filteredDocs.length} documents
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {safeCurrentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload Reference Documents</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{pendingFiles.length} file(s) selected</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
              {pendingFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-1.5">
                  <span className="truncate min-w-0 max-w-96 flex-1" title={f.name}>{f.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Tags (optional)</p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. clinical trial A"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
                <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
              </div>
              {pendingTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {pendingTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelUpload}>Cancel</Button>
            <Button onClick={handleUpload} disabled={pendingFiles.length === 0 || isUploading}>
              {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</> : `Upload ${pendingFiles.length} file(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDoc} onOpenChange={(open) => { if (!open) setEditingDoc(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reference Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>File Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Input value={editType} onChange={e => setEditType(e.target.value)} placeholder="e.g. application/pdf" />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag…"
                  value={editTagInput}
                  onChange={e => setEditTagInput(e.target.value)}
                  onKeyDown={handleEditTagKeyDown}
                />
                <Button variant="outline" size="sm" onClick={addEditTag}>Add</Button>
              </div>
              {editTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {editTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs gap-1">
                      {tag}
                      <button onClick={() => setEditTags(prev => prev.filter(t => t !== tag))} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDoc(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
