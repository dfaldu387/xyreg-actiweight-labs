
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Clock, Users, AlertTriangle, BarChart3 } from 'lucide-react';
import { Product } from '@/types/client';
import { useTranslation } from '@/hooks/useTranslation';

interface UsefulAnalyticsSectionProps {
  product: Product;
}

export function UsefulAnalyticsSection({ product }: UsefulAnalyticsSectionProps) {
  const { lang } = useTranslation();

  // Mock analytics data - in real implementation, this would come from hooks/services
  const analytics = {
    phaseMetrics: [
      { phase: 'Design Controls', avgDays: 45, currentDays: 32, efficiency: 140 },
      { phase: 'Risk Management', avgDays: 30, currentDays: 35, efficiency: 86 },
      { phase: 'Clinical Evaluation', avgDays: 60, currentDays: 58, efficiency: 103 },
      { phase: 'Verification & Validation', avgDays: 40, currentDays: 25, efficiency: 160 }
    ],
    bottlenecks: [
      {
        area: 'Document Reviews',
        avgDelayDays: 8,
        cause: 'Limited reviewer availability',
        impact: 'high'
      },
      {
        area: 'External Lab Results',
        avgDelayDays: 12,
        cause: 'Third-party dependencies',
        impact: 'medium'
      },
      {
        area: 'Regulatory Approvals',
        avgDelayDays: 15,
        cause: 'Submission complexity',
        impact: 'high'
      }
    ],
    teamMetrics: [
      { member: 'Dr. Sarah Johnson', workload: 85, overdue: 2, upcoming: 5 },
      { member: 'Mark Chen', workload: 70, overdue: 0, upcoming: 3 },
      { member: 'Lisa Wang', workload: 95, overdue: 1, upcoming: 7 },
      { member: 'Alex Rodriguez', workload: 60, overdue: 0, upcoming: 2 }
    ],
    trends: {
      deliveryImprovement: 15, // percentage improvement
      qualityScore: 92,
      customerSatisfaction: 88
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 120) return 'text-green-600';
    if (efficiency >= 100) return 'text-blue-600';
    if (efficiency >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWorkloadColor = (workload: number) => {
    if (workload >= 90) return 'bg-red-500';
    if (workload >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Phase Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {lang('analytics.phasePerformance')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.phaseMetrics.map((phase, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{phase.phase}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {phase.currentDays}/{phase.avgDays} {lang('analytics.days')}
                  </span>
                  <span className={`text-xs font-medium ${getEfficiencyColor(phase.efficiency)}`}>
                    {phase.efficiency}%
                  </span>
                </div>
              </div>
              <Progress
                value={Math.min((phase.currentDays / phase.avgDays) * 100, 100)}
                className="h-2"
              />
            </div>
          ))}
          <div className="pt-2 text-xs text-muted-foreground">
            <p>{lang('analytics.efficiencyFormula')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Bottleneck Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {lang('analytics.bottleneckAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analytics.bottlenecks.map((bottleneck, index) => (
            <div key={index} className="p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{bottleneck.area}</h4>
                <span className={`text-xs px-2 py-1 rounded ${getImpactColor(bottleneck.impact)}`}>
                  {bottleneck.impact} {lang('analytics.impact')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{bottleneck.cause}</p>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-600 font-medium">
                  {lang('analytics.avgDaysDelay').replace('{{count}}', String(bottleneck.avgDelayDays))}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Team Workload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            {lang('analytics.teamWorkload')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analytics.teamMetrics.map((member, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{member.member}</span>
                  <div className={`w-2 h-2 rounded-full ${getWorkloadColor(member.workload)}`} />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{lang('analytics.workload')} {member.workload}%</span>
                  {member.overdue > 0 && (
                    <span className="text-red-600">{member.overdue} {lang('analytics.overdue')}</span>
                  )}
                  <span>{member.upcoming} {lang('analytics.upcoming')}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {lang('analytics.performanceTrends')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{lang('analytics.deliverySpeed')}</span>
              </div>
              <span className="text-green-600 font-bold">+{analytics.trends.deliveryImprovement}%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{lang('analytics.qualityScore')}</span>
              </div>
              <span className="text-blue-600 font-bold">{analytics.trends.qualityScore}%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">{lang('analytics.teamSatisfaction')}</span>
              </div>
              <span className="text-purple-600 font-bold">{analytics.trends.customerSatisfaction}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
