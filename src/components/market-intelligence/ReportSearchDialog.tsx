import React, { useState } from 'react';
import { Search, Clock, FileText, ExternalLink, Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

interface SearchResult {
  answer: string;
  sources: DocumentChunk[];
  query: string;
  responseTime: number;
  confidence: number;
  searchQueryId: string;
}

interface DocumentChunk {
  id: string;
  chunk_text: string;
  chunk_index: number;
  page_number?: number;
  section_title?: string;
  similarity?: number;
  report_id: string;
  report_title?: string;
  report_source?: string;
  report_date?: string;
}

interface ReportSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  userId: string;
}

const EXAMPLE_QUERY_KEYS = [
  'reportSearch.examples.marketSize',
  'reportSearch.examples.competitors',
  'reportSearch.examples.growthTrends',
  'reportSearch.examples.regulatoryChallenges',
  'reportSearch.examples.pricingStrategies',
];

export function ReportSearchDialog({ open, onOpenChange, companyId, userId }: ReportSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { lang } = useTranslation();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: lang('reportSearch.pleaseEnterQuestion'),
        description: lang('reportSearch.enterQuestionDescription'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ask-reports', {
        body: {
          query: query.trim(),
          companyId,
          userId,
          maxResults: 8
        }
      });

      if (error) {
        throw new Error(error.message || 'Search failed');
      }

      setResult(data);

      toast({
        title: lang('reportSearch.searchCompleted'),
        description: lang('reportSearch.foundSources', { count: data.sources.length, time: data.responseTime }),
      });

    } catch (error) {
      toast({
        title: lang('reportSearch.searchFailed'),
        description: error instanceof Error ? error.message : lang('reportSearch.tryAgainLater'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  const formatCitation = (source: DocumentChunk, index: number) => {
    const pageRef = source.page_number ? `, ${lang('reportSearch.page')} ${source.page_number}` : '';
    const dateRef = source.report_date ? ` (${new Date(source.report_date).getFullYear()})` : '';
    return `[${lang('reportSearch.source')} ${index + 1}: ${source.report_title} ${lang('common.by')} ${source.report_source}${pageRef}${dateRef}]`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return lang('reportSearch.confidenceHigh');
    if (confidence >= 0.6) return lang('reportSearch.confidenceMedium');
    return lang('reportSearch.confidenceLow');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {lang('reportSearch.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Input */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={lang('reportSearch.placeholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
                  className="pl-10 text-base h-12"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isLoading || !query.trim()}
                size="lg"
                className="h-12 px-6"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isLoading ? lang('reportSearch.searching') : lang('reportSearch.search')}
              </Button>
            </div>

            {/* Example Queries */}
            {!result && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{lang('reportSearch.exampleQuestions')}</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_QUERY_KEYS.map((key, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleExampleQuery(lang(key))}
                      disabled={isLoading}
                      className="text-xs"
                    >
                      {lang(key)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Results */}
          {result && (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6">
                {/* AI Response */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        {lang('reportSearch.aiAnalysis')}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {result.responseTime}ms
                        </div>
                        <Badge variant="outline" className={getConfidenceColor(result.confidence)}>
                          {getConfidenceText(result.confidence)} {lang('reportSearch.confidence')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="leading-relaxed whitespace-pre-wrap">{result.answer}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Sources */}
                {result.sources.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {lang('reportSearch.sources')} ({result.sources.length})
                      </h3>
                      <div className="grid gap-4">
                        {result.sources.map((source, index) => (
                          <Card key={source.id} className="transition-colors hover:bg-muted/50">
                            <CardContent className="pt-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-1">
                                    <h4 className="font-medium text-sm">
                                      {formatCitation(source, index)}
                                    </h4>
                                    {source.section_title && (
                                      <p className="text-xs text-muted-foreground">
                                        {lang('reportSearch.section')}: {source.section_title}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {source.similarity && (
                                      <Badge variant="secondary" className="text-xs">
                                        {Math.round(source.similarity * 100)}% {lang('reportSearch.match')}
                                      </Badge>
                                    )}
                                    <Button variant="ghost" size="sm">
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-sm leading-relaxed text-muted-foreground bg-background/50 p-3 rounded border-l-2 border-primary/20">
                                  {source.chunk_text.length > 300 
                                    ? `${source.chunk_text.substring(0, 300)}...`
                                    : source.chunk_text
                                  }
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Search Again */}
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResult(null);
                      setQuery('');
                    }}
                  >
                    {lang('reportSearch.searchAgain')}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}