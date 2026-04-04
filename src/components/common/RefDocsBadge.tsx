import React, { useState } from 'react';
import { BookOpen, Download } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  HoverCardPortal,
} from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RefDocInfo {
  id: string;
  file_name: string;
  file_path: string;
}

interface RefDocsBadgeProps {
  referenceDocumentIds: string[];
  companyId: string;
}

export function RefDocsBadge({ referenceDocumentIds, companyId }: RefDocsBadgeProps) {
  const [docs, setDocs] = useState<RefDocInfo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchDocs = async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reference_documents')
        .select('id, file_name, file_path')
        .in('id', referenceDocumentIds);
      if (error) throw error;
      setDocs((data || []) as RefDocInfo[]);
    } catch (e) {
      console.error('Failed to fetch ref docs', e);
    } finally {
      setLoaded(true);
      setLoading(false);
    }
  };

  const handleDownload = async (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data, error } = await supabase.storage
        .from('reference-documents')
        .createSignedUrl(filePath, 3600);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (err: any) {
      toast.error(`Download failed: ${err.message}`);
    }
  };

  if (!referenceDocumentIds || referenceDocumentIds.length === 0) return null;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          onMouseEnter={fetchDocs}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>{referenceDocumentIds.length} ref{referenceDocumentIds.length !== 1 ? 's' : ''}</span>
        </button>
      </HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent align="start" className="w-72 p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Linked Reference Documents</p>
          {loading && <p className="text-xs text-muted-foreground">Loading...</p>}
          {loaded && docs.length === 0 && (
            <p className="text-xs text-muted-foreground">No documents found</p>
          )}
          <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-2 text-xs rounded-md px-2 py-1.5 hover:bg-muted/50 group"
              >
                <span className="truncate flex-1">{doc.file_name}</span>
                <button
                  type="button"
                  onClick={(e) => handleDownload(doc.file_path, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  );
}
