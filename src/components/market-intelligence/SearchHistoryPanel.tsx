import React from 'react';
import { Clock, MessageSquare, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface SearchQuery {
  id: string;
  query_text: string;
  ai_response: string;
  source_chunks: any[];
  response_time_ms: number;
  created_at: string;
}

interface SearchHistoryPanelProps {
  companyId: string;
  userId: string;
  onQuerySelect: (query: string) => void;
  disabled?: boolean;
}

export function SearchHistoryPanel({ companyId, userId, onQuerySelect, disabled = false }: SearchHistoryPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lang } = useTranslation();

  // Fetch search history
  const { data: searchHistory, isLoading } = useQuery({
    queryKey: ['search-history', companyId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('search_queries')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as SearchQuery[];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (queryId: string) => {
      const { error } = await supabase
        .from('search_queries')
        .delete()
        .eq('id', queryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-history', companyId, userId] });
      toast({
        title: lang('marketAnalysis.searchHistory.queryDeleted'),
        description: lang('marketAnalysis.searchHistory.queryDeletedDesc'),
      });
    },
    onError: (error) => {
      toast({
        title: lang('marketAnalysis.searchHistory.deleteFailed'),
        description: lang('marketAnalysis.searchHistory.deleteFailedDesc'),
        variant: "destructive",
      });
    },
  });

  const handleDelete = (queryId: string) => {
    if (disabled) return;
    if (window.confirm(lang('marketAnalysis.searchHistory.deleteConfirm'))) {
      deleteMutation.mutate(queryId);
    }
  };

  const handleRerun = (query: string) => {
    if (disabled) return;
    onQuerySelect(query);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {lang('marketAnalysis.searchHistory.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">{lang('marketAnalysis.searchHistory.loading')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!searchHistory || searchHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {lang('marketAnalysis.searchHistory.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{lang('marketAnalysis.searchHistory.noSearches')}</h3>
            <p className="text-muted-foreground mb-4">
              {lang('marketAnalysis.searchHistory.noSearchesDescription')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {lang('marketAnalysis.searchHistory.title')} ({searchHistory.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 p-6">
            {searchHistory.map((query) => (
              <Card key={query.id} className="transition-colors hover:bg-muted/50">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm leading-relaxed">
                            {truncateText(query.query_text, 100)}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {query.source_chunks?.length || 0} {lang('marketAnalysis.searchHistory.sources')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(query.created_at), 'MMM d, yyyy • h:mm a')} • 
                          {query.response_time_ms}ms
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRerun(query.query_text)}
                          className="h-8 w-8 p-0"
                          disabled={disabled}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(query.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          disabled={disabled}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {query.ai_response && (
                      <div className="text-xs leading-relaxed text-muted-foreground bg-background/50 p-2 rounded border-l-2 border-primary/20">
                        {truncateText(query.ai_response, 150)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}