import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, List, MessageCircle, PenTool, X, Sparkles, RefreshCw } from 'lucide-react';
import { useDocumentAI, DocumentContext } from '@/hooks/useDocumentAI';
import { DocumentSummaryTab } from './ai-sidebar/DocumentSummaryTab';
import { KeyPointsTab } from './ai-sidebar/KeyPointsTab';
import { DocumentChatTab } from './ai-sidebar/DocumentChatTab';
import { HelpMeWriteTab } from './ai-sidebar/HelpMeWriteTab';
import { supabase } from '@/integrations/supabase/client';

export interface DocumentForAI {
  id: string;
  name: string;
  file_path?: string;
  file_name?: string;
  document_type?: string;
  phase_name?: string;
  description?: string;
}

interface DocumentAISidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentForAI | null;
  companyId: string;
}

export function DocumentAISidebar({
  open,
  onOpenChange,
  document,
  companyId
}: DocumentAISidebarProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [documentText, setDocumentText] = useState<string>('');
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [textExtractionError, setTextExtractionError] = useState<string | null>(null);

  const documentAI = useDocumentAI(companyId);

  const documentContext: DocumentContext | undefined = document ? {
    documentName: document.name,
    documentType: document.document_type || 'Document',
    phaseName: document.phase_name || 'Unknown'
  } : undefined;

  // Extract text from document when sidebar opens
  useEffect(() => {
    if (open && document?.file_path && !documentText) {
      extractDocumentText();
    }
  }, [open, document?.file_path]);

  // Clear state when document changes
  useEffect(() => {
    if (document?.id) {
      setDocumentText('');
      setTextExtractionError(null);
      documentAI.clearChat();
    }
  }, [document?.id]);

  const extractDocumentText = async () => {
    if (!document?.file_path) {
      setTextExtractionError('No file attached to this document');
      return;
    }

    setIsExtractingText(true);
    setTextExtractionError(null);

    try {
      // Download the file from storage - use document-templates bucket
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('document-templates')
        .download(document.file_path);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      // Create a File object for the edge function
      const fileName = document.file_name || document.file_path.split('/').pop() || 'document';
      const file = new File([fileData], fileName, { type: fileData.type });

      // Call the document analyzer to extract text
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'extract_text');

      const { data, error } = await supabase.functions.invoke('ai-document-analyzer', {
        body: formData
      });

      if (error) {
        throw new Error(`Text extraction failed: ${error.message}`);
      }

      if (data.success && data.extracted_text) {
        setDocumentText(data.extracted_text);
      } else {
        throw new Error(data.error || 'Failed to extract text from document');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extract document text';
      console.error('Text extraction error:', err);
      setTextExtractionError(message);
    } finally {
      setIsExtractingText(false);
    }
  };

  const hasFile = !!document?.file_path;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[450px] sm:w-[500px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <SheetTitle className="text-lg">AI Assistant</SheetTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {document && (
            <div className="mt-2 rounded-md border bg-muted/30 p-2">
              <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <FileText className="h-3 w-3" /> AI Input Source
              </p>
              <p className="text-sm font-medium truncate">{document.name}</p>
              <div className="flex items-center gap-2 mt-1">
                {document.document_type && (
                  <Badge variant="outline" className="text-xs">
                    {document.document_type}
                  </Badge>
                )}
                {document.phase_name && (
                  <Badge variant="outline" className="text-xs bg-primary/10">
                    {document.phase_name}
                  </Badge>
                )}
                {!hasFile && (
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                    No file attached
                  </Badge>
                )}
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {!hasFile ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-medium mb-2">No File Attached</h3>
                <p className="text-sm text-muted-foreground max-w-[250px]">
                  Upload a file to this document to use AI features like summary, key points extraction, and Q&A.
                </p>
              </div>
            </div>
          ) : isExtractingText ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Extracting document content...</p>
              </div>
            </div>
          ) : textExtractionError ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-red-300" />
                <h3 className="font-medium mb-2 text-red-600">Extraction Failed</h3>
                <p className="text-sm text-muted-foreground max-w-[250px] mb-4">
                  {textExtractionError}
                </p>
                <Button variant="outline" size="sm" onClick={extractDocumentText}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid grid-cols-4 mx-4 mt-4 flex-shrink-0">
                <TabsTrigger value="summary" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="keypoints" className="text-xs">
                  <List className="h-3 w-3 mr-1" />
                  Key Points
                </TabsTrigger>
                <TabsTrigger value="chat" className="text-xs">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="write" className="text-xs">
                  <PenTool className="h-3 w-3 mr-1" />
                  Write
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0">
                <TabsContent value="summary" className="h-full m-0">
                  <DocumentSummaryTab
                    documentId={document?.id || ''}
                    documentText={documentText}
                    context={documentContext}
                    documentAI={documentAI}
                  />
                </TabsContent>

                <TabsContent value="keypoints" className="h-full m-0">
                  <KeyPointsTab
                    documentId={document?.id || ''}
                    documentText={documentText}
                    context={documentContext}
                    documentAI={documentAI}
                  />
                </TabsContent>

                <TabsContent value="chat" className="h-full m-0">
                  <DocumentChatTab
                    documentId={document?.id || ''}
                    documentText={documentText}
                    context={documentContext}
                    documentAI={documentAI}
                  />
                </TabsContent>

                <TabsContent value="write" className="h-full m-0">
                  <HelpMeWriteTab
                    documentId={document?.id || ''}
                    documentText={documentText}
                    context={documentContext}
                    documentAI={documentAI}
                  />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex-shrink-0 bg-muted/30">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Powered by AI</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
