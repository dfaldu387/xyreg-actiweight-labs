import React, { useState } from 'react';
import { Link, ArrowRight, CheckCircle, Clock, FileText, Shield, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

interface ContextualSuggestionsPanelProps {
  companyId: string;
  reportId?: string;
  disabled?: boolean;
}

interface Suggestion {
  id: string;
  suggestion_type: string;
  title: string;
  description: string;
  target_module: string;
  suggested_action: any;
  confidence_score: number;
  is_actioned: boolean;
  created_at: string;
  report_id: string;
}

export function ContextualSuggestionsPanel({ companyId, reportId, disabled = false }: ContextualSuggestionsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());
  const { lang } = useTranslation();

  // Fetch suggestions
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['contextual-suggestions', companyId, reportId],
    queryFn: async () => {
      let query = supabase
        .from('contextual_suggestions')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (reportId) {
        query = query.eq('report_id', reportId);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data as Suggestion[];
    },
    enabled: !!companyId,
  });

  // Mark suggestion as actioned
  const actionMutation = useMutation({
    mutationFn: async ({ suggestionId, actionData }: { suggestionId: string; actionData: any }) => {
      const { error } = await supabase
        .from('contextual_suggestions')
        .update({
          is_actioned: true,
          actioned_at: new Date().toISOString(),
          actioned_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', suggestionId);

      if (error) throw error;

      // Here you would typically integrate with the target module
      // For now, we'll just simulate the action
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contextual-suggestions', companyId] });
      toast({
        title: lang('marketAnalysis.suggestions.actionTaken'),
        description: lang('marketAnalysis.suggestions.actionTakenDesc'),
      });
    },
    onError: (error) => {
      toast({
        title: lang('marketAnalysis.suggestions.actionFailed'),
        description: lang('marketAnalysis.suggestions.actionFailedDesc'),
        variant: "destructive",
      });
    },
  });

  const handleAction = async (suggestion: Suggestion) => {
    if (disabled) return;
    setProcessingActions(prev => new Set(prev).add(suggestion.id));
    try {
      await actionMutation.mutateAsync({
        suggestionId: suggestion.id,
        actionData: suggestion.suggested_action
      });
    } finally {
      setProcessingActions(prev => {
        const next = new Set(prev);
        next.delete(suggestion.id);
        return next;
      });
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product_requirement': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'risk_management': return <Shield className="h-4 w-4 text-orange-600" />;
      case 'commercial_strategy': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'activity': return <Activity className="h-4 w-4 text-purple-600" />;
      default: return <Link className="h-4 w-4" />;
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return <Badge variant="default">{lang('marketAnalysis.trends.highConfidence')}</Badge>;
    if (score >= 0.6) return <Badge variant="secondary">{lang('marketAnalysis.trends.mediumConfidence')}</Badge>;
    return <Badge variant="outline">{lang('marketAnalysis.trends.lowConfidence')}</Badge>;
  };

  const getModuleColor = (module: string) => {
    switch (module.toLowerCase()) {
      case 'products': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'risk management': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'commercial strategy': return 'text-green-600 bg-green-50 border-green-200';
      case 'activities': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            {lang('marketAnalysis.suggestions.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{lang('marketAnalysis.suggestions.loading')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            {lang('marketAnalysis.suggestions.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Link className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{lang('marketAnalysis.suggestions.noSuggestions')}</h3>
            <p className="text-muted-foreground">
              {lang('marketAnalysis.suggestions.noSuggestionsDescription')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingSuggestions = suggestions.filter(s => !s.is_actioned);
  const completedSuggestions = suggestions.filter(s => s.is_actioned);

  return (
    <div className="space-y-6">
      {/* Pending Suggestions */}
      {pendingSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              {lang('marketAnalysis.suggestions.pendingActions')} ({pendingSuggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getSuggestionIcon(suggestion.suggestion_type)}
                    <div className="space-y-1">
                      <h4 className="font-semibold">{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getConfidenceBadge(suggestion.confidence_score)}
                    <Badge
                      variant="outline"
                      className={getModuleColor(suggestion.target_module)}
                    >
                      {suggestion.target_module}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    {lang('marketAnalysis.suggestions.suggested')} {new Date(suggestion.created_at).toLocaleDateString()}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleAction(suggestion)}
                    disabled={processingActions.has(suggestion.id) || disabled}
                    className="flex items-center gap-2"
                  >
                    {processingActions.has(suggestion.id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    {lang('marketAnalysis.suggestions.takeAction')}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Suggestions */}
      {completedSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {lang('marketAnalysis.suggestions.completedActions')} ({completedSuggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedSuggestions.slice(0, 5).map((suggestion) => (
              <div key={suggestion.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{suggestion.title}</p>
                  <p className="text-xs text-muted-foreground">{suggestion.target_module}</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {lang('marketAnalysis.suggestions.completed')}
                </Badge>
              </div>
            ))}
            {completedSuggestions.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                {lang('marketAnalysis.suggestions.moreCompleted').replace('{{count}}', String(completedSuggestions.length - 5))}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}