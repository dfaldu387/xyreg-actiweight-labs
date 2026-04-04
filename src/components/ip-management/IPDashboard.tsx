import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, FileText, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { useIPAssets } from '@/hooks/useIPAssets';
import { useUpcomingDeadlines } from '@/hooks/useIPDeadlines';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface IPDashboardProps {
  companyId: string;
}

export function IPDashboard({ companyId }: IPDashboardProps) {
  const { data: assets, isLoading: assetsLoading } = useIPAssets(companyId);
  const { data: upcomingDeadlines, isLoading: deadlinesLoading } = useUpcomingDeadlines(companyId, 90);
  const { lang } = useTranslation();

  if (assetsLoading || deadlinesLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalAssets = assets?.length || 0;
  const patentCount = assets?.filter(a => a.ip_type === 'patent').length || 0;
  const trademarkCount = assets?.filter(a => a.ip_type === 'trademark').length || 0;
  const pendingCount = assets?.filter(a => a.status === 'pending').length || 0;
  const grantedCount = assets?.filter(a => a.status === 'granted').length || 0;
  
  const urgentDeadlines = upcomingDeadlines?.filter(d => {
    const daysUntil = differenceInDays(new Date(d.due_date), new Date());
    return daysUntil <= 30;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted': return 'default';
      case 'pending': return 'secondary';
      case 'abandoned': case 'expired': return 'destructive';
      default: return 'outline';
    }
  };

  const getDeadlineUrgency = (date: string) => {
    const daysUntil = differenceInDays(new Date(date), new Date());
    if (daysUntil <= 7) return 'destructive';
    if (daysUntil <= 30) return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{lang('ipPortfolio.dashboard.totalAssets')}</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {lang('ipPortfolio.dashboard.assetsSummary').replace('{{patents}}', String(patentCount)).replace('{{trademarks}}', String(trademarkCount))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{lang('ipPortfolio.dashboard.pendingApplications')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {lang('ipPortfolio.dashboard.awaitingExamination')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{lang('ipPortfolio.dashboard.grantedRights')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{grantedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {lang('ipPortfolio.dashboard.activeProtection')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{lang('ipPortfolio.dashboard.urgentDeadlines')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentDeadlines.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {lang('ipPortfolio.dashboard.dueWithin30Days')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {lang('ipPortfolio.dashboard.upcomingDeadlines')}
          </CardTitle>
          <CardDescription>{lang('ipPortfolio.dashboard.deadlinesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!upcomingDeadlines || upcomingDeadlines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{lang('ipPortfolio.dashboard.noUpcomingDeadlines')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.slice(0, 5).map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">{deadline.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                      <span>{deadline.ip_asset?.title || lang('ipPortfolio.dashboard.unknownAsset')}</span>
                      <span>•</span>
                      <span>{deadline.deadline_type}</span>
                      <span>•</span>
                      <span>{format(new Date(deadline.due_date), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <Badge variant={getDeadlineUrgency(deadline.due_date)}>
                    {lang('ipPortfolio.dashboard.days').replace('{{count}}', String(differenceInDays(new Date(deadline.due_date), new Date())))}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent IP Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            {lang('ipPortfolio.dashboard.recentAssets')}
          </CardTitle>
          <CardDescription>{lang('ipPortfolio.dashboard.recentAssetsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!assets || assets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{lang('ipPortfolio.dashboard.noAssetsRecorded')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assets.slice(0, 5).map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {asset.title}
                      <Badge variant="outline" className="text-xs capitalize">
                        {asset.ip_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                      {asset.internal_reference && <span>{lang('ipPortfolio.dashboard.ref').replace('{{reference}}', asset.internal_reference)}</span>}
                      {asset.priority_date && (
                        <>
                          <span>•</span>
                          <span>{lang('ipPortfolio.dashboard.priority').replace('{{date}}', format(new Date(asset.priority_date), 'MMM dd, yyyy'))}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant={getStatusColor(asset.status)} className="capitalize">
                    {asset.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
