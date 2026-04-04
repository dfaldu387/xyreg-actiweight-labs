import React from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';

interface TrendAnalysisPanelProps {
  companyId: string;
  disabled?: boolean;
}

interface TrendData {
  totalReports: number;
  trends: Array<{
    type: string;
    title: string;
    description: string;
    confidence: number;
    dataPoints?: number;
    topCompetitors?: string[];
  }>;
  insights: Array<{
    type: string;
    title: string;
    content: string;
    reportCount?: number;
    topRecommendations?: string[];
  }>;
  riskPatterns: Array<{
    type: string;
    title: string;
    frequency: number;
    examples: string[];
  }>;
  opportunities: Array<{
    type: string;
    title: string;
    count: number;
    examples: string[];
  }>;
}

export function TrendAnalysisPanel({ companyId }: TrendAnalysisPanelProps) {
  const { lang } = useTranslation();
  const { data: trendData, isLoading } = useQuery({
    queryKey: ['market-trends', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('market-trends-analyzer', {
        body: { companyId }
      });

      if (error) throw error;
      return data.data as TrendData;
    },
    enabled: !!companyId,
    staleTime: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {lang('marketAnalysis.trends.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{lang('marketAnalysis.trends.loading')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trendData || trendData.totalReports === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {lang('marketAnalysis.trends.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{lang('marketAnalysis.trends.noData')}</h3>
            <p className="text-muted-foreground">
              {lang('marketAnalysis.trends.noDataDescription')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (type: string) => {
    switch (type) {
      case 'market_growth': return <TrendingUp className="h-4 w-4" />;
      case 'competitive_landscape': return <Target className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge variant="default">{lang('marketAnalysis.trends.highConfidence')}</Badge>;
    if (confidence >= 0.6) return <Badge variant="secondary">{lang('marketAnalysis.trends.mediumConfidence')}</Badge>;
    return <Badge variant="outline">{lang('marketAnalysis.trends.lowConfidence')}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{trendData.totalReports}</div>
              <p className="text-sm text-muted-foreground">{lang('marketAnalysis.trends.reportsAnalyzed')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{trendData.trends.length}</div>
              <p className="text-sm text-muted-foreground">{lang('marketAnalysis.trends.trendsIdentified')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{trendData.riskPatterns.length}</div>
              <p className="text-sm text-muted-foreground">{lang('marketAnalysis.trends.riskPatterns')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{trendData.opportunities.length}</div>
              <p className="text-sm text-muted-foreground">{lang('marketAnalysis.trends.opportunities')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Trends */}
      {trendData.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {lang('marketAnalysis.trends.marketTrends')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trendData.trends.map((trend, index) => (
              <div key={index} className="border-l-4 border-primary/20 pl-4 py-2">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(trend.type)}
                    <h4 className="font-semibold">{trend.title}</h4>
                  </div>
                  {getConfidenceBadge(trend.confidence)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{trend.description}</p>
                {trend.dataPoints && (
                  <p className="text-xs text-muted-foreground">{lang('marketAnalysis.trends.basedOnDataPoints').replace('{{count}}', String(trend.dataPoints))}</p>
                )}
                {trend.topCompetitors && (
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1">{lang('marketAnalysis.trends.topCompetitors')}:</p>
                    <div className="flex flex-wrap gap-1">
                      {trend.topCompetitors.slice(0, 3).map((competitor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{competitor}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      {trendData.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              {lang('marketAnalysis.trends.keyInsights')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trendData.insights.map((insight, index) => (
              <div key={index} className="space-y-2">
                <h4 className="font-semibold">{insight.title}</h4>
                <p className="text-sm text-muted-foreground">{insight.content}</p>
                {insight.topRecommendations && (
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1">{lang('marketAnalysis.trends.topRecommendations')}:</p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      {insight.topRecommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Risk Patterns & Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Patterns */}
        {trendData.riskPatterns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                {lang('marketAnalysis.trends.riskPatterns')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {trendData.riskPatterns.map((risk, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{risk.title}</h4>
                    <Badge variant="outline">{risk.frequency} {lang('marketAnalysis.trends.mentions')}</Badge>
                  </div>
                  <div className="space-y-1">
                    {risk.examples.map((example, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground border-l-2 border-orange-200 pl-2">
                        {example}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Opportunities */}
        {trendData.opportunities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                {lang('marketAnalysis.trends.opportunities')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {trendData.opportunities.map((opportunity, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{opportunity.title}</h4>
                    <Badge variant="outline">{opportunity.count} {lang('marketAnalysis.trends.identified')}</Badge>
                  </div>
                  <div className="space-y-1">
                    {opportunity.examples.map((example, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground border-l-2 border-green-200 pl-2">
                        {example}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}