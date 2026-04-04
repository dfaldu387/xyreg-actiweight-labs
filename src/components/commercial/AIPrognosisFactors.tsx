import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  Rocket,
  BarChart3,
  Brain
} from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';

interface PrognosisFactor {
  id: string;
  name: string;
  description: string;
  impact: number; // 0-100
  trend: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  source: string;
}

interface AIPrognosisFactorsProps {
  companyId: string;
  disabled?: boolean;
}

export function AIPrognosisFactors({ companyId, disabled = false }: AIPrognosisFactorsProps) {
  const { lang } = useTranslation();
  
  // Mock data - Replace with actual AI-analyzed factors
  const factors: PrognosisFactor[] = [
    {
      id: '1',
      name: lang('commercialPerformance.prognosis.factors.historicalPerformance'),
      description: lang('commercialPerformance.prognosis.factors.historicalPerformanceDesc'),
      impact: 85,
      trend: 'positive',
      icon: <BarChart3 className="h-4 w-4" />,
      source: lang('commercialPerformance.prognosis.factors.historicalSource')
    },
    {
      id: '2',
      name: lang('commercialPerformance.prognosis.factors.marketGrowth'),
      description: lang('commercialPerformance.prognosis.factors.marketGrowthDesc'),
      impact: 70,
      trend: 'positive',
      icon: <TrendingUp className="h-4 w-4" />,
      source: lang('commercialPerformance.prognosis.factors.marketSource')
    },
    {
      id: '3',
      name: lang('commercialPerformance.prognosis.factors.seasonality'),
      description: lang('commercialPerformance.prognosis.factors.seasonalityDesc'),
      impact: 60,
      trend: 'positive',
      icon: <Calendar className="h-4 w-4" />,
      source: lang('commercialPerformance.prognosis.factors.seasonalitySource')
    },
    {
      id: '4',
      name: lang('commercialPerformance.prognosis.factors.competitiveLandscape'),
      description: lang('commercialPerformance.prognosis.factors.competitiveLandscapeDesc'),
      impact: 45,
      trend: 'negative',
      icon: <Users className="h-4 w-4" />,
      source: lang('commercialPerformance.prognosis.factors.competitiveSource')
    },
    {
      id: '5',
      name: lang('commercialPerformance.prognosis.factors.internalInitiatives'),
      description: lang('commercialPerformance.prognosis.factors.internalInitiativesDesc'),
      impact: 80,
      trend: 'positive',
      icon: <Rocket className="h-4 w-4" />,
      source: lang('commercialPerformance.prognosis.factors.internalSource')
    }
  ];

  const getTrendColor = (trend: string, impact: number) => {
    if (trend === 'positive') return 'text-green-600';
    if (trend === 'negative') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendBadgeVariant = (trend: string) => {
    if (trend === 'positive') return 'default';
    if (trend === 'negative') return 'destructive';
    return 'secondary';
  };

  const averageImpact = factors.reduce((sum, factor) => sum + factor.impact, 0) / factors.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {lang('commercialPerformance.prognosis.title')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {lang('commercialPerformance.prognosis.subtitle')}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {lang('commercialPerformance.prognosis.confidence')} {averageImpact.toFixed(0)}%
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {factors.map((factor) => (
          <div key={factor.id} className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className={getTrendColor(factor.trend, factor.impact)}>
                  {factor.icon}
                </div>
                <div>
                  <h4 className="text-sm font-medium">{factor.name}</h4>
                  <p className="text-xs text-muted-foreground">{factor.description}</p>
                </div>
              </div>
              <Badge 
                variant={getTrendBadgeVariant(factor.trend)}
                className="text-xs"
              >
                {factor.impact}%
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{factor.source}</span>
                <span className={getTrendColor(factor.trend, factor.impact)}>
                  {factor.trend === 'positive' ? '↗' : factor.trend === 'negative' ? '↘' : '→'} 
                  {lang(`commercialPerformance.prognosis.trends.${factor.trend}`)}
                </span>
              </div>
              <Progress 
                value={factor.impact} 
                className="h-2"
              />
            </div>
          </div>
        ))}

        <div className="mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {lang('commercialPerformance.prognosis.aiModelAccuracy')} <span className="font-medium text-foreground">92%</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lang('commercialPerformance.prognosis.basedOnMonths').replace('{{count}}', '24')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}