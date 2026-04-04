import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  FileText,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentForSummary {
  id: string;
  name: string;
  file_path?: string;
  file_name?: string;
  document_type?: string;
  phase_name?: string;
  status?: string;
}

interface DocumentSummaryResult {
  documentId: string;
  documentName: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  summary?: {
    quickSummary: string;
    summary: string;
    sections?: Array<{ title: string; summary: string }>;
    documentType?: string;
    wordCount?: number;
    complexity?: string;
  };
  error?: string;
}

interface BulkDocumentSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: DocumentForSummary[];
  companyId: string;
}

export function BulkDocumentSummaryDialog({
  open,
  onOpenChange,
  documents,
  companyId,
}: BulkDocumentSummaryDialogProps) {
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<DocumentSummaryResult[]>([]);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'select' | 'results'>('select');

  // Filter documents that have files attached
  const documentsWithFiles = documents.filter(doc => doc.file_path);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedDocIds(new Set());
      setResults([]);
      setExpandedDocs(new Set());
      setActiveTab('select');
    }
  }, [open]);

  const handleSelectAll = () => {
    if (selectedDocIds.size === documentsWithFiles.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(documentsWithFiles.map(doc => doc.id)));
    }
  };

  const handleSelectDoc = (docId: string) => {
    const newSelected = new Set(selectedDocIds);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocIds(newSelected);
  };

  const toggleExpanded = (docId: string) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocs(newExpanded);
  };

  const extractTextFromDocument = async (doc: DocumentForSummary): Promise<string> => {
    if (!doc.file_path) {
      throw new Error('No file attached');
    }

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('document-templates')
      .download(doc.file_path);

    if (downloadError) {
      throw new Error(`Failed to download: ${downloadError.message}`);
    }

    // Create a File object for the edge function
    const fileName = doc.file_name || doc.file_path.split('/').pop() || 'document';
    const file = new File([fileData], fileName, { type: fileData.type });

    // Call the document analyzer to extract text
    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', 'extract_text');

    const { data, error } = await supabase.functions.invoke('ai-document-analyzer', {
      body: formData,
    });

    if (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }

    if (!data.success || !data.extracted_text) {
      throw new Error(data.error || 'Failed to extract text');
    }

    return data.extracted_text;
  };

  const generateSummaryForDocument = async (
    doc: DocumentForSummary,
    documentText: string
  ): Promise<DocumentSummaryResult['summary']> => {
    const { data, error } = await supabase.functions.invoke('ai-document-summary', {
      body: {
        action: 'generate_summary',
        documentId: doc.id,
        companyId,
        userId: (await supabase.auth.getUser()).data.user?.id,
        text: documentText,
        context: {
          documentName: doc.name,
          documentType: doc.document_type || 'Document',
          phaseName: doc.phase_name || 'Unknown',
        },
      },
    });

    if (error) {
      throw new Error(`Summary generation failed: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate summary');
    }

    return {
      quickSummary: data.quickSummary || '',
      summary: data.summary || '',
      sections: data.sections || [],
      documentType: data.documentType,
      wordCount: data.wordCount,
      complexity: data.complexity,
    };
  };

  const handleGenerateSummaries = async () => {
    if (selectedDocIds.size === 0) {
      toast.error('Please select at least one document');
      return;
    }

    setIsGenerating(true);
    setActiveTab('results');

    // Initialize results for selected documents
    const selectedDocs = documentsWithFiles.filter(doc => selectedDocIds.has(doc.id));
    const initialResults: DocumentSummaryResult[] = selectedDocs.map(doc => ({
      documentId: doc.id,
      documentName: doc.name,
      status: 'pending',
    }));
    setResults(initialResults);

    // Process each document sequentially
    for (let i = 0; i < selectedDocs.length; i++) {
      const doc = selectedDocs[i];

      // Update status to processing
      setResults(prev =>
        prev.map(r =>
          r.documentId === doc.id ? { ...r, status: 'processing' as const } : r
        )
      );

      try {
        // Extract text
        const documentText = await extractTextFromDocument(doc);

        // Generate summary
        const summary = await generateSummaryForDocument(doc, documentText);

        // Update with success
        setResults(prev =>
          prev.map(r =>
            r.documentId === doc.id
              ? { ...r, status: 'success' as const, summary }
              : r
          )
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setResults(prev =>
          prev.map(r =>
            r.documentId === doc.id
              ? { ...r, status: 'error' as const, error: errorMessage }
              : r
          )
        );
      }
    }

    setIsGenerating(false);
    toast.success('Summary generation completed');
  };

  const getStatusIcon = (status: DocumentSummaryResult['status']) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <DialogTitle>AI Document Summary</DialogTitle>
          </div>
          <DialogDescription>
            Select documents to generate AI-powered summaries
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'select' | 'results')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select" disabled={isGenerating}>
              <FileText className="h-4 w-4 mr-2" />
              Select Documents ({selectedDocIds.size})
            </TabsTrigger>
            <TabsTrigger value="results">
              <Sparkles className="h-4 w-4 mr-2" />
              Results {results.length > 0 && `(${successCount}/${results.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="flex-1 flex flex-col min-h-0 mt-4">
            {documentsWithFiles.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="font-medium mb-2">No Documents with Files</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload files to your documents to generate AI summaries.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedDocIds.size === documentsWithFiles.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {documentsWithFiles.length} documents with files
                  </span>
                </div>

                <ScrollArea className="flex-1 border rounded-lg">
                  <div className="p-2 space-y-1">
                    {documentsWithFiles.map(doc => (
                      <div
                        key={doc.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedDocIds.has(doc.id)
                            ? 'bg-purple-50 border-purple-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleSelectDoc(doc.id)}
                      >
                        <Checkbox
                          checked={selectedDocIds.has(doc.id)}
                          onCheckedChange={() => handleSelectDoc(doc.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {doc.phase_name && (
                              <Badge variant="outline" className="text-xs">
                                {doc.phase_name}
                              </Badge>
                            )}
                            {doc.document_type && (
                              <Badge variant="outline" className="text-xs">
                                {doc.document_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateSummaries}
                    disabled={selectedDocIds.size === 0 || isGenerating}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Summaries ({selectedDocIds.size})
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="results" className="flex-1 flex flex-col min-h-0 mt-4">
            {results.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="font-medium mb-2">No Results Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Select documents and generate summaries to see results here.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="flex items-center gap-4 mb-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {successCount} Completed
                  </Badge>
                  {errorCount > 0 && (
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      <XCircle className="h-3 w-3 mr-1" />
                      {errorCount} Failed
                    </Badge>
                  )}
                  {isGenerating && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Processing...
                    </Badge>
                  )}
                </div>

                <ScrollArea className="flex-1 border rounded-lg">
                  <div className="p-2 space-y-2">
                    {results.map(result => (
                      <Card key={result.documentId} className="overflow-hidden">
                        <div
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                          onClick={() => result.status === 'success' && toggleExpanded(result.documentId)}
                        >
                          {getStatusIcon(result.status)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {result.documentName}
                            </p>
                            {result.status === 'success' && result.summary?.quickSummary && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {result.summary.quickSummary}
                              </p>
                            )}
                            {result.status === 'error' && (
                              <p className="text-xs text-red-600 mt-1">
                                {result.error}
                              </p>
                            )}
                          </div>
                          {result.status === 'success' && (
                            <Button variant="ghost" size="sm">
                              {expandedDocs.has(result.documentId) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>

                        {result.status === 'success' &&
                          expandedDocs.has(result.documentId) &&
                          result.summary && (
                            <CardContent className="pt-0 pb-4 border-t bg-gray-50">
                              <div className="max-h-[400px] overflow-y-auto overflow-x-auto pr-2">
                                <div className="space-y-4 mt-3">
                                  {/* Quick Summary */}
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Quick Summary</h4>
                                    <p className="text-sm text-muted-foreground break-words">
                                      {result.summary.quickSummary}
                                    </p>
                                  </div>

                                  {/* Full Summary */}
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Full Summary</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                                      {result.summary.summary}
                                    </p>
                                  </div>

                                  {/* Sections */}
                                  {result.summary.sections && result.summary.sections.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-medium mb-2">Sections</h4>
                                      <div className="space-y-2">
                                        {result.summary.sections.map((section, idx) => (
                                          <div key={idx} className="pl-3 border-l-2 border-purple-200">
                                            <p className="text-sm font-medium">{section.title}</p>
                                            <p className="text-xs text-muted-foreground break-words">
                                              {section.summary}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Metadata */}
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    {result.summary.wordCount && (
                                      <span>~{result.summary.wordCount} words</span>
                                    )}
                                    {result.summary.complexity && (
                                      <Badge variant="outline" className="text-xs">
                                        {result.summary.complexity} complexity
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          )}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                  {!isGenerating && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('select')}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate More
                    </Button>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
