import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Loader2, History, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DocumentEditor } from '@onlyoffice/document-editor-react';
import { useAuth } from '@/context/AuthContext';

const STORAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public`;

interface ReviewDraft {
  name: string;
  path: string;
  timestamp: number;
  size: number;
}

interface ReviewDraftsListProps {
  companyId: string;
  documentId: string;
}

export function ReviewDraftsList({ companyId, documentId }: ReviewDraftsListProps) {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<ReviewDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [viewingDraft, setViewingDraft] = useState<ReviewDraft | null>(null);

  useEffect(() => {
    if (!companyId || !documentId) return;
    fetchDrafts();
  }, [companyId, documentId]);

  const fetchDrafts = async () => {
    setIsLoading(true);
    try {
      const folderPath = `${companyId}/${documentId}`;
      const { data, error } = await supabase.storage
        .from('document-templates')
        .list(folderPath);

      if (error) {
        setDrafts([]);
        return;
      }

      const reviewDrafts = (data || [])
        .filter((f) => f.name.startsWith('review-draft-'))
        .map((f) => {
          const tsMatch = f.name.match(/review-draft-(\d+)/);
          const timestamp = tsMatch ? parseInt(tsMatch[1], 10) : 0;
          return {
            name: f.name,
            path: `${folderPath}/${f.name}`,
            timestamp,
            size: f.metadata?.size || 0,
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);

      setDrafts(reviewDrafts);
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentUrl = (path: string) =>
    `${STORAGE_URL}/document-templates/${path}`;

  const userName = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
    : user?.email || 'Anonymous';

  return (
    <>
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <Card className="border-0 rounded-none border-t">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 px-6 pt-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
                <History className="w-4 h-4" />
                Review Drafts
                {drafts.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {drafts.length}
                  </Badge>
                )}
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="px-6 pb-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : drafts.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No review drafts yet. Drafts are created when the document is sent for review.
                </p>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {drafts.map((draft, index) => (
                    <div
                      key={draft.name}
                      className="flex items-center justify-between gap-2 p-2 rounded-md border bg-background hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">
                            {index === 0 ? 'Latest' : `v${drafts.length - index}`}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {draft.timestamp
                              ? format(new Date(draft.timestamp), 'MMM dd, yyyy HH:mm')
                              : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        title="Open in viewer"
                        onClick={() => setViewingDraft(draft)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {viewingDraft && (
        <Dialog open={!!viewingDraft} onOpenChange={(open) => !open && setViewingDraft(null)}>
          <DialogContent
            className="max-w-[90vw] w-[90vw] h-[85vh] p-0 rounded-lg [&>button:last-child]:hidden"
            style={{ zIndex: 9999 }}
          >
            <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <DialogTitle className="text-sm font-semibold">
                  Review Draft —{' '}
                  {viewingDraft.timestamp
                    ? format(new Date(viewingDraft.timestamp), 'MMM dd, yyyy HH:mm')
                    : viewingDraft.name}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Review draft viewer
                </DialogDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingDraft(null)}>
                Close
              </Button>
            </DialogHeader>
            <div style={{ height: 'calc(85vh - 57px)' }}>
              <DocumentEditor
                id={`review-draft-viewer-${viewingDraft.timestamp}`}
                documentServerUrl={import.meta.env.VITE_ONLYOFFICE_SERVER_URL || '/api/onlyoffice/'}
                config={{
                  document: {
                    fileType: 'docx',
                    key: `draft-view-${documentId}-${viewingDraft.timestamp}-${Date.now()}`,
                    title: viewingDraft.name,
                    url: getDocumentUrl(viewingDraft.path),
                    permissions: {
                      edit: false,
                      comment: false,
                      download: true,
                      print: true,
                      review: false,
                    },
                  },
                  documentType: 'word',
                  editorConfig: {
                    mode: 'view',
                    callbackUrl: '',
                    user: {
                      id: user?.id || 'anonymous',
                      name: userName,
                    },
                    customization: {
                      autosave: false,
                      forcesave: false,
                      chat: false,
                      comments: false,
                    },
                  },
                  height: '100%',
                  width: '100%',
                }}
                onLoadComponentError={(errorCode: number, errorDescription: string) => {
                  console.error('ONLYOFFICE Draft Viewer Error:', errorCode, errorDescription);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
