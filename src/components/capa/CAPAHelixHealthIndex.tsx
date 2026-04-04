import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { CAPARecord } from '@/types/capa';
import { useTranslation } from '@/hooks/useTranslation';

interface CAPAHelixHealthIndexProps {
  capas: CAPARecord[];
}

export function CAPAHelixHealthIndex({ capas }: CAPAHelixHealthIndexProps) {
  const { lang } = useTranslation();

  // Calculate health metrics
  const totalCAPAs = capas.length;
  const closedCAPAs = capas.filter(c => c.status === 'closed').length;
  const openCAPAs = capas.filter(c => !['closed', 'rejected'].includes(c.status)).length;
  const overdueCAPAs = capas.filter(c => {
    if (['closed', 'rejected'].includes(c.status)) return false;
    const targetDate = c.target_closure_date;
    return targetDate && new Date(targetDate) < new Date();
  }).length;

  // Calculate closure rate (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentClosures = capas.filter(c =>
    c.closure_date && new Date(c.closure_date) >= thirtyDaysAgo
  ).length;

  const recentCreations = capas.filter(c =>
    c.created_at && new Date(c.created_at) >= thirtyDaysAgo
  ).length;

  // Calculate average resolution time (for closed CAPAs)
  const closedWithDates = capas.filter(c =>
    c.status === 'closed' && c.created_at && c.closure_date
  );

  const avgResolutionDays = closedWithDates.length > 0
    ? closedWithDates.reduce((sum, c) => {
        const created = new Date(c.created_at!);
        const closed = new Date(c.closure_date!);
        return sum + Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      }, 0) / closedWithDates.length
    : 0;

  // Calculate Helix Health Index (0-100)
  // Factors: closure rate, overdue rate, avg resolution time, risk distribution
  const closureRateScore = totalCAPAs > 0 ? (closedCAPAs / totalCAPAs) * 30 : 30;
  const overdueScore = openCAPAs > 0 ? Math.max(0, 30 - (overdueCAPAs / openCAPAs) * 30) : 30;
  const resolutionScore = Math.max(0, 20 - (avgResolutionDays > 90 ? 20 : (avgResolutionDays / 90) * 20));
  const recentTrendScore = recentClosures >= recentCreations ? 20 : Math.max(0, 20 - (recentCreations - recentClosures) * 2);

  const healthIndex = Math.round(closureRateScore + overdueScore + resolutionScore + recentTrendScore);

  // Determine trend
  const trend = recentClosures > recentCreations ? 'improving' :
                recentClosures < recentCreations ? 'declining' : 'stable';

  // Determine health status
  const healthStatus = healthIndex >= 80 ? 'excellent' :
                       healthIndex >= 60 ? 'good' :
                       healthIndex >= 40 ? 'fair' : 'needs_attention';

  const statusColors = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    fair: 'text-amber-600',
    needs_attention: 'text-red-600',
  };

  const statusLabels = {
    excellent: lang('capa.excellent'),
    good: lang('capa.good'),
    fair: lang('capa.fair'),
    needs_attention: lang('capa.needsAttention'),
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {lang('capa.healthIndex')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Score */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${statusColors[healthStatus]}`}>
            {healthIndex}
          </div>
          <div className={`text-sm font-medium ${statusColors[healthStatus]}`}>
            {statusLabels[healthStatus]}
          </div>
          <Progress
            value={healthIndex}
            className="mt-2 h-2"
          />
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center justify-center gap-2 text-sm">
          {trend === 'improving' ? (
            <>
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600">{lang('capa.improving')}</span>
            </>
          ) : trend === 'declining' ? (
            <>
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-red-600">{lang('capa.declining')}</span>
            </>
          ) : (
            <>
              <Minus className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{lang('capa.stable')}</span>
            </>
          )}
          <span className="text-muted-foreground">{lang('capa.thirtyDayTrend')}</span>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-lg font-semibold">{closedCAPAs}</span>
            </div>
            <div className="text-xs text-muted-foreground">{lang('capa.closed')}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-lg font-semibold">{overdueCAPAs}</span>
            </div>
            <div className="text-xs text-muted-foreground">{lang('capa.overdueDashboard')}</div>
          </div>
        </div>

        {/* Resolution Time */}
        <div className="text-center pt-2 border-t">
          <div className="text-sm text-muted-foreground">{lang('capa.avgResolutionTime')}</div>
          <div className="text-lg font-semibold">
            {avgResolutionDays > 0 ? `${Math.round(avgResolutionDays)} ${lang('capa.days')}` : lang('capa.na')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
