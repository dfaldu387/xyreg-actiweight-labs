import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { DocumentContext, DocumentSummary } from '@/hooks/useDocumentAI';

interface DocumentSummaryTabProps {
  documentId: string;
  documentText: string;
  context?: DocumentContext;
  documentAI: {
    isLoading: boolean;
    error: string | null;
    summary: DocumentSummary | null;
    generateSummary: (documentId: string, text: string, context?: DocumentContext) => Promise<DocumentSummary | null>;
    loadCachedSummary: (documentId: string) => Promise<DocumentSummary | null>;
  };
}

export function DocumentSummaryTab({
  documentId,
  documentText,
  context,
  documentAI
}: DocumentSummaryTabProps) {
  const [hasCheckedCache, setHasCheckedCache] = useState(false);

  // Check for cached summary on mount
  useEffect(() => {
    if (documentId && !hasCheckedCache) {
      documentAI.loadCachedSummary(documentId);
      setHasCheckedCache(true);
    }
  }, [documentId, hasCheckedCache]);

  // Reset cache check when document changes
  useEffect(() => {
    setHasCheckedCache(false);
  }, [documentId]);

  const handleGenerateSummary = async () => {
    if (!documentText) return;
    await documentAI.generateSummary(documentId, documentText, context);
  };

  const { isLoading, error, summary } = documentAI;

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
            <p className="text-sm text-red-600 text-center mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={handleGenerateSummary}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : summary ? (
          <div className="space-y-4">
            {/* Quick Summary */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-medium text-primary mb-1">Quick Summary</h4>
                    <p className="text-sm">{summary.quickSummary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                {summary.documentType}
              </Badge>
              <Badge variant="outline" className="text-xs">
                ~{summary.wordCount.toLocaleString()} words
              </Badge>
              <Badge variant="outline" className={`text-xs ${getComplexityColor(summary.complexity)}`}>
                {summary.complexity} complexity
              </Badge>
            </div>

            {/* Full Summary */}
            <div>
              <h4 className="text-sm font-medium mb-2">Full Summary</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {summary.summary}
              </p>
            </div>

            {/* Sections */}
            {summary.sections && summary.sections.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Document Sections</h4>
                <div className="space-y-2">
                  {summary.sections.map((section, index) => (
                    <Card key={index} className="bg-muted/30">
                      <CardContent className="p-3">
                        <h5 className="text-xs font-medium mb-1">{section.title}</h5>
                        <p className="text-xs text-muted-foreground">{section.summary}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Regenerate Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSummary}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Summary
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium mb-2">Generate Document Summary</h3>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-[250px]">
              Get an AI-powered summary of this document including key sections and content overview.
            </p>
            <Button onClick={handleGenerateSummary} disabled={!documentText}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Summary
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
