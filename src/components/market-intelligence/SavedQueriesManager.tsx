import React, { useState } from 'react';
import { Star, Search, Trash2, Plus, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

interface SavedQueriesManagerProps {
  companyId: string;
  userId: string;
  onQuerySelect: (query: string) => void;
  disabled?: boolean;
}

interface SavedQuery {
  id: string;
  query_name: string;
  query_text: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export function SavedQueriesManager({ companyId, userId, onQuerySelect, disabled = false }: SavedQueriesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuery, setEditingQuery] = useState<SavedQuery | null>(null);
  const [queryName, setQueryName] = useState('');
  const [queryText, setQueryText] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const { lang } = useTranslation();

  // Fetch saved queries
  const { data: savedQueries, isLoading } = useQuery({
    queryKey: ['saved-queries', companyId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_queries')
        .select('*')
        .eq('company_id', companyId)
        .or(`user_id.eq.${userId},is_public.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedQuery[];
    },
    enabled: !!companyId && !!userId,
  });

  // Save query mutation
  const saveMutation = useMutation({
    mutationFn: async (queryData: { name: string; text: string; isPublic: boolean; id?: string }) => {
      if (queryData.id) {
        // Update existing query
        const { error } = await supabase
          .from('saved_queries')
          .update({
            query_name: queryData.name,
            query_text: queryData.text,
            is_public: queryData.isPublic,
          })
          .eq('id', queryData.id);
        if (error) throw error;
      } else {
        // Create new query
        const { error } = await supabase
          .from('saved_queries')
          .insert({
            company_id: companyId,
            user_id: userId,
            query_name: queryData.name,
            query_text: queryData.text,
            is_public: queryData.isPublic,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-queries', companyId, userId] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: editingQuery ? lang('marketAnalysis.savedQueries.queryUpdated') : lang('marketAnalysis.savedQueries.querySaved'),
        description: lang('marketAnalysis.savedQueries.querySavedDesc'),
      });
    },
    onError: (error) => {
      toast({
        title: lang('marketAnalysis.savedQueries.saveFailed'),
        description: lang('marketAnalysis.savedQueries.saveFailedDesc'),
        variant: "destructive",
      });
    },
  });

  // Delete query mutation
  const deleteMutation = useMutation({
    mutationFn: async (queryId: string) => {
      const { error } = await supabase
        .from('saved_queries')
        .delete()
        .eq('id', queryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-queries', companyId, userId] });
      toast({
        title: lang('marketAnalysis.savedQueries.queryDeleted'),
        description: lang('marketAnalysis.savedQueries.queryDeletedDesc'),
      });
    },
    onError: (error) => {
      toast({
        title: lang('marketAnalysis.savedQueries.deleteFailed'),
        description: lang('marketAnalysis.savedQueries.deleteFailedDesc'),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setQueryName('');
    setQueryText('');
    setIsPublic(false);
    setEditingQuery(null);
  };

  const handleSave = () => {
    if (disabled) return;
    if (!queryName.trim() || !queryText.trim()) {
      toast({
        title: lang('marketAnalysis.savedQueries.validationError'),
        description: lang('marketAnalysis.savedQueries.validationErrorDesc'),
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      name: queryName.trim(),
      text: queryText.trim(),
      isPublic,
      id: editingQuery?.id,
    });
  };

  const handleEdit = (query: SavedQuery) => {
    if (disabled) return;
    setEditingQuery(query);
    setQueryName(query.query_name);
    setQueryText(query.query_text);
    setIsPublic(query.is_public);
    setDialogOpen(true);
  };

  const handleDelete = (queryId: string) => {
    if (disabled) return;
    if (window.confirm(lang('marketAnalysis.savedQueries.deleteConfirm'))) {
      deleteMutation.mutate(queryId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            {lang('marketAnalysis.savedQueries.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">{lang('marketAnalysis.savedQueries.loading')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            {lang('marketAnalysis.savedQueries.title')} ({savedQueries?.length || 0})
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => !disabled && setDialogOpen(open)}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm} disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                {lang('marketAnalysis.savedQueries.saveQuery')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingQuery ? lang('marketAnalysis.savedQueries.editSavedQuery') : lang('marketAnalysis.savedQueries.saveNewQuery')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="queryName">{lang('marketAnalysis.savedQueries.queryName')}</Label>
                  <Input
                    id="queryName"
                    value={queryName}
                    onChange={(e) => setQueryName(e.target.value)}
                    placeholder={lang('marketAnalysis.savedQueries.queryNamePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="queryText">{lang('marketAnalysis.savedQueries.queryText')}</Label>
                  <textarea
                    id="queryText"
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder={lang('marketAnalysis.savedQueries.queryTextPlaceholder')}
                    className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded border-input"
                  />
                  <Label htmlFor="isPublic" className="text-sm">
                    {lang('marketAnalysis.savedQueries.shareWithTeam')}
                  </Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    {lang('marketAnalysis.savedQueries.cancel')}
                  </Button>
                  <Button onClick={handleSave} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? lang('marketAnalysis.savedQueries.saving') : editingQuery ? lang('marketAnalysis.savedQueries.update') : lang('marketAnalysis.savedQueries.save')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!savedQueries || savedQueries.length === 0 ? (
          <div className="text-center py-8">
            <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{lang('marketAnalysis.savedQueries.noSavedQueries')}</h3>
            <p className="text-muted-foreground mb-4">
              {lang('marketAnalysis.savedQueries.noSavedQueriesDescription')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedQueries.map((query) => (
              <div key={query.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{query.query_name}</h4>
                      {query.is_public && (
                        <Badge variant="secondary" className="text-xs">{lang('marketAnalysis.savedQueries.public')}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {query.query_text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lang('marketAnalysis.savedQueries.saved')} {new Date(query.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => !disabled && onQuerySelect(query.query_text)}
                      className="h-8 w-8 p-0"
                      disabled={disabled}
                    >
                      <Search className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(query)}
                      className="h-8 w-8 p-0"
                      disabled={disabled}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(query.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      disabled={disabled}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}