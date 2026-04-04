import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileSearch, ClipboardCheck, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { CAPAStatus, CAPA_STATUS_LABELS, CAPASourceType, CAPA_SOURCE_LABELS } from '@/types/capa';
import { useTranslation } from '@/hooks/useTranslation';

interface CAPAAnalyticsData {
  total: number;
  open: number;
  overdue: number;
  closedThisMonth: number;
  byStatus: Record<CAPAStatus, number>;
  bySourceType: Record<string, number>;
}

interface CAPADashboardProps {
  analytics: CAPAAnalyticsData | null;
  isLoading?: boolean;
}

export function CAPADashboard({ analytics, isLoading }: CAPADashboardProps) {
  const { lang } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const stats = [
    {
      title: lang('capa.totalCapas'),
      value: analytics.total,
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      description: lang('capa.allCapaRecords')
    },
    {
      title: lang('capa.openCapas'),
      value: analytics.open,
      icon: FileSearch,
      iconColor: 'text-blue-500',
      description: lang('capa.activeInvestigations')
    },
    {
      title: lang('capa.overdueDashboard'),
      value: analytics.overdue,
      icon: Clock,
      iconColor: 'text-destructive',
      valueColor: analytics.overdue > 0 ? 'text-destructive' : undefined,
      description: lang('capa.pastTargetDate')
    },
    {
      title: lang('capa.closedThisMonth'),
      value: analytics.closedThisMonth,
      icon: ClipboardCheck,
      iconColor: 'text-green-500',
      valueColor: 'text-green-600 dark:text-green-400',
      description: lang('capa.successfullyResolved')
    },
  ];

  // Calculate status distribution for visualization
  const statusData = Object.entries(analytics.byStatus || {})
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      status: status as CAPAStatus,
      label: CAPA_STATUS_LABELS[status as CAPAStatus] || status,
      count,
      percentage: analytics.total > 0 ? Math.round((count / analytics.total) * 100) : 0
    }));

  // Calculate source distribution
  const sourceData = Object.entries(analytics.bySourceType || {})
    .filter(([_, count]) => count > 0)
    .map(([source, count]) => ({
      source,
      label: CAPA_SOURCE_LABELS[source as CAPASourceType] || source,
      count,
      percentage: analytics.total > 0 ? Math.round((count / analytics.total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.valueColor || ''}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.iconColor}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {lang('capa.statusDistribution')}
            </CardTitle>
            <CardDescription>{lang('capa.capasByWorkflowStage')}</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{lang('capa.noDataAvailable')}</p>
            ) : (
              <div className="space-y-3">
                {statusData.map(({ status, label, count, percentage }) => (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{label}</span>
                      <span className="text-muted-foreground">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {lang('capa.sourceAnalysis')}
            </CardTitle>
            <CardDescription>{lang('capa.capasByOrigin')}</CardDescription>
          </CardHeader>
          <CardContent>
            {sourceData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{lang('capa.noDataAvailable')}</p>
            ) : (
              <div className="space-y-3">
                {sourceData.map(({ source, label, count, percentage }) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/70 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
