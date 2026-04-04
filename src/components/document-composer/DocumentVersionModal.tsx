import React, { useState, useEffect } from 'react';
import { X, Clock, User, FileText, RotateCcw, GitCompare, Sparkles, FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DocumentVersionService, DocumentVersion } from '@/services/documentVersionService';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { MarkdownRenderer } from '@/components/help/MarkdownRenderer';

interface DocumentVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  currentDocumentName: string;
  onVersionRestore?: () => void;
}

/**
 * Format comparison result with highlighted additions, deletions, and modifications
 */
const formatComparisonWithHighlights = (content: string): string => {
  let formatted = content
    // Convert markdown to HTML
    .replace(/\n/g, '<br/>')
    .replace(/### (.*?)(<br\/>|$)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/## (.*?)(<br\/>|$)/g, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/# (.*?)(<br\/>|$)/g, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Highlight additions (green background)
    .replace(/\[ADD\](.*?)\[\/ADD\]/g, '<span class="bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 px-1 py-0.5 rounded font-medium">+ $1</span>')
    // Highlight deletions (red background)
    .replace(/\[DEL\](.*?)\[\/DEL\]/g, '<span class="bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 px-1 py-0.5 rounded font-medium line-through">- $1</span>')
    // Highlight modifications (yellow/orange background)
    .replace(/\[MOD\](.*?)\[\/MOD\]/g, '<span class="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 px-1 py-0.5 rounded font-medium">~ $1</span>');
  
  return formatted;
};

export function DocumentVersionModal({
  isOpen,
  onClose,
  documentId,
  currentDocumentName,
  onVersionRestore
}: DocumentVersionModalProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<string>('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string>('');

  useEffect(() => {
    if (isOpen && documentId) {
      loadVersions();
    }
  }, [isOpen, documentId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const result = await DocumentVersionService.getDocumentVersions(documentId);
      if (result.success && result.data) {
        setVersions(result.data);
      } else {
        toast.error(result.error || 'Failed to load document versions');
      }
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error('Failed to load document versions');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string, versionNumber: number) => {
    setRestoring(versionId);
    try {
      const result = await DocumentVersionService.restoreVersion(documentId, versionId);
      if (result.success) {
        toast.success(`Document restored to version ${versionNumber}`);
        onVersionRestore?.();
        onClose();
      } else {
        toast.error(result.error || 'Failed to restore document version');
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore document version');
    } finally {
      setRestoring(null);
    }
  };

  const handleCompareVersion = (version: DocumentVersion) => {
    setSelectedVersion(version);
    setShowCompareModal(true);
    setComparisonResult('');
  };

  const handleSummaryVersion = async (version: DocumentVersion) => {
    setSelectedVersion(version);
    setShowSummaryModal(true);
    setSummaryResult('');
    
    // Auto-generate summary when modal opens
    setSummaryLoading(true);
    try {
      const currentResult = await DocumentVersionService.getCurrentDocumentContent?.(documentId) || { success: false, error: 'Method not available' };
      const previousResult = await DocumentVersionService.getVersionContent?.(documentId, version.id) || { success: false, error: 'Method not available' };
      
      if (!currentResult.success || !previousResult.success) {
        toast.error('Failed to load document content for summary');
        return;
      }

      const summary = await callAIForSummary(
        currentResult.data!,
        previousResult.data!,
        version.version_name || `Version ${version.version_number}`
      );
      
      setSummaryResult(summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const callAIForSummary = async (currentContent: string, previousContent: string, versionName: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-document-summary-compare', {
        body: {
          currentContent,
          previousContent,
          versionName
        }
      });

      if (error) {
        console.error('Error calling AI summary:', error);
        
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast.error('Rate limits exceeded. Please try again later.');
        } else if (error.message?.includes('402') || error.message?.includes('Payment')) {
          toast.error('Payment required. Please add credits to your Lovable AI workspace.');
        }
        
        throw error;
      }

      if (!data?.success || !data?.content) {
        throw new Error('No content generated by AI');
      }

      return data.content;
    } catch (error) {
      console.error('Error calling AI summary:', error);
      throw error;
    }
  };

  const generateAIComparison = async () => {
    if (!selectedVersion) return;
    
    setComparing(true);
    try {
      // Get current document content
      const currentResult = await DocumentVersionService.getCurrentDocumentContent?.(documentId) || { success: false, error: 'Method not available' };
      const previousResult = await DocumentVersionService.getVersionContent?.(documentId, selectedVersion.id) || { success: false, error: 'Method not available' };
      
      if (!currentResult.success || !previousResult.success) {
        toast.error('Failed to load document content for comparison');
        return;
      }

      // Generate AI comparison using Lovable AI
      const aiComparison = await callAIForComparison(
        currentResult.data!,
        previousResult.data!,
        selectedVersion.version_name || `Version ${selectedVersion.version_number}`
      );
      
      setComparisonResult(aiComparison);
      toast.success('AI comparison generated successfully!');
      
    } catch (error) {
      console.error('Error generating AI comparison:', error);
      toast.error('Failed to generate AI comparison');
    } finally {
      setComparing(false);
    }
  };

  const callAIForComparison = async (currentContent: string, previousContent: string, versionName: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-document-version-compare', {
        body: {
          currentContent,
          previousContent,
          versionName
        }
      });

      if (error) {
        console.error('Error calling AI comparison:', error);
        
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast.error('Rate limits exceeded. Please try again later.');
        } else if (error.message?.includes('402') || error.message?.includes('Payment')) {
          toast.error('Payment required. Please add credits to your Lovable AI workspace.');
        }
        
        throw error;
      }

      if (!data?.success || !data?.content) {
        throw new Error('No content generated by AI');
      }

      return data.content;
    } catch (error) {
      console.error('Error calling AI comparison:', error);
      // Fallback to a detailed static response if API fails
      return `## Document Version Comparison Analysis

### Executive Summary
Unable to generate AI analysis. Please try again or contact support if the issue persists.

### Manual Review Required
Please manually review the document changes:

**Current Version Content:**
${currentContent.substring(0, 500)}...

**Previous Version Content:**
${previousContent.substring(0, 500)}...

### Recommended Manual Review Steps
1. Compare section by section
2. Identify key changes in procedures
3. Check for regulatory compliance updates
4. Review impact on existing processes
5. Validate new requirements

*Note: This is a fallback response due to AI service unavailability.*`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col overflow-scroll">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="text-lg font-semibold">Document Version History</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{currentDocumentName}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 p-0">
          {/* <ScrollArea className="h-full max-h-[60vh] p-6"> */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading version history...</p>
                </div>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Version History</h3>
                <p className="text-sm text-muted-foreground">
                  This document doesn't have any saved versions yet. Versions are created when you save changes to an existing document.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current Version */}
                <div className="border-2 border-primary rounded-lg p-4 bg-primary/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-primary text-primary-foreground">
                        Current Version
                      </Badge>
                      <span className="font-medium">Latest</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Active</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This is the current version of your document with all recent changes.
                  </p>
                </div>

                {/* Version History */}
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Version {version.version_number}
                        </Badge>
                        {version.version_name && (
                          <span className="font-medium text-sm">{version.version_name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSummaryVersion(version)}
                          className="h-8 w-8 p-0"
                          title="View Summary"
                        >
                          <FileSearch className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompareVersion(version)}
                          className="h-8"
                        >
                          <GitCompare className="h-3 w-3 mr-1" />
                          Compare
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(version.id, version.version_number)}
                          disabled={restoring === version.id}
                          className="h-8"
                        >
                          {restoring === version.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-current" />
                          ) : (
                            <>
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Restore
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}</span>
                      </div>
                      {version.created_by && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>User</span>
                        </div>
                      )}
                    </div>

                    {version.change_summary && (
                      <p className="text-sm text-muted-foreground">
                        {version.change_summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          {/* </ScrollArea> */}
        </CardContent>
      </Card>

      {/* AI Comparison Modal */}
      <Dialog open={showCompareModal} onOpenChange={setShowCompareModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]  flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              AI Document Version Comparison
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Comparing current version with {selectedVersion?.version_name || `Version ${selectedVersion?.version_number}`}
            </p>
          </DialogHeader>
          
          <div className="flex-1 overflow-scroll">
            {!comparisonResult ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <GitCompare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Ready to Compare Versions</h3>
                    <p className="text-muted-foreground">
                      Click "Generate AI Comparison" to analyze the differences between versions
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Changes will be highlighted: <span className="bg-green-100 dark:bg-green-900/30 px-1 rounded">+additions</span> <span className="bg-red-100 dark:bg-red-900/30 px-1 rounded line-through">-deletions</span> <span className="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">~modifications</span>
                    </p>
                  </div>
                  <Button
                    onClick={generateAIComparison}
                    disabled={comparing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {comparing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        AI Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate AI Comparison
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div 
                      className="whitespace-pre-wrap text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: formatComparisonWithHighlights(comparisonResult)
                      }}
                    />
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-primary" />
              Version Comparison Summary
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Quick summary comparing current version with {selectedVersion?.version_name || `Version ${selectedVersion?.version_number}`}
            </p>
          </DialogHeader>
          
          <div className="flex-1 overflow-scroll">
            {summaryLoading ? (
              <div className="flex items-center justify-center h-full py-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Generating comparison summary...</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-6">
                  <MarkdownRenderer content={summaryResult} />
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}