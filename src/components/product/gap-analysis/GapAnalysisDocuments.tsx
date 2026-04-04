
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface GapAnalysisDocument {
  id: string;
  name: string;
  file_name: string;
  file_path: string;
  file_type: string;
  status: string;
  uploaded_at: string;
  reviewer_group_id?: string;
  file_size?: number;
}

interface GapAnalysisDocumentsProps {
  gapItemId: string;
  onDocumentChange?: () => void;
}

export function GapAnalysisDocuments({ gapItemId, onDocumentChange }: GapAnalysisDocumentsProps) {
  const [documents, setDocuments] = useState<GapAnalysisDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('gap_document_links')
        .select(`
          document_id,
          documents!inner(
            id,
            name,
            file_name,
            file_path,
            file_type,
            status,
            uploaded_at,
            reviewer_group_id,
            file_size
          )
        `)
        .eq('gap_item_id', gapItemId);

      if (error) {
        throw error;
      }

      const docs = data?.flatMap(item => item.documents || []).filter(Boolean) || [];
      setDocuments(docs as GapAnalysisDocument[]);
    } catch (error) {
      console.error('Error fetching gap analysis documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [gapItemId]);

  const handleDownload = async (document: GapAnalysisDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const confirmAction = useConfirm();

  const handleDelete = async (documentId: string) => {
    if (!await confirmAction({ title: 'Delete document', description: 'Are you sure you want to delete this document?', confirmLabel: 'Delete', variant: 'destructive' })) {
      return;
    }

    try {
      // Delete the link first
      const { error: linkError } = await supabase
        .from('gap_document_links')
        .delete()
        .eq('gap_item_id', gapItemId)
        .eq('document_id', documentId);

      if (linkError) {
        throw linkError;
      }

      // Delete the document record
      const { error: docError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (docError) {
        throw docError;
      }

      toast.success('Document deleted successfully');
      fetchDocuments();
      onDocumentChange?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'under review':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading documents...</div>;
  }

  if (documents.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No documents have been uploaded for this gap analysis item yet.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Uploaded Documents</h4>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md bg-card">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{doc.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{doc.file_name}</span>
                  {doc.file_size && <span>• {formatFileSize(doc.file_size)}</span>}
                  <span>• {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                </div>
              </div>
              <Badge variant="outline" className={getStatusColor(doc.status)}>
                {doc.status}
              </Badge>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(doc)}
                className="h-auto p-1"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(doc.id)}
                className="h-auto p-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
