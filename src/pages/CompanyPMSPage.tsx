import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCompanyPMSReports, useCompanyPMSEvents } from '@/hooks/usePMSData';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { useTranslation } from '@/hooks/useTranslation';

export default function CompanyPMSPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : '';
  const { lang } = useTranslation();

  const { data: reports, isLoading: reportsLoading } = useCompanyPMSReports(companyName);
  const { data: events, isLoading: eventsLoading } = useCompanyPMSEvents(companyName);

  // Restriction check - double security pattern (hooks must be called before any conditional returns)
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.PMS);
  const isRestricted = !isFeatureEnabled;

  if (reportsLoading || eventsLoading) {
    return (
      <div className="p-2 pt-4 space-y-6">
        <Skeleton className="h-12 w-96" />
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalReports = reports?.length || 0;
  const upcomingReports = reports?.filter(r => {
    if (!r.next_due_date) return false;
    const daysUntil = Math.floor((new Date(r.next_due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 60;
  }).length || 0;
  
  const overdueReports = reports?.filter(r => {
    if (!r.next_due_date) return false;
    return new Date(r.next_due_date) < new Date();
  }).length || 0;

  const totalEvents = events?.length || 0;
  const openInvestigations = events?.filter(e => 
    e.investigation_status === 'open' || e.investigation_status === 'investigating'
  ).length || 0;
  
  const reportableEvents = events?.filter(e => e.is_reportable && !e.reported_to_authority).length || 0;

  // Recent reports by product
  const recentReportsByProduct = reports?.slice(0, 10).map(r => ({
    ...r,
    product_name: (r as any).products?.name || lang('pms.company.unknownProduct')
  })) || [];

  const getSubmissionStatusLabel = (status: string) => {
    const normalized = String(status || '').toLowerCase();
    switch (normalized) {
      case 'accepted':
        return lang('pms.company.submissionStatus.accepted');
      case 'rejected':
        return lang('pms.company.submissionStatus.rejected');
      case 'submitted':
        return lang('pms.company.submissionStatus.submitted');
      case 'pending':
        return lang('pms.company.submissionStatus.pending');
      default:
        return String(status || '').replace(/_/g, ' ');
    }
  };

  const getInvestigationStatusLabel = (status: string) => {
    const normalized = String(status || '').toLowerCase();
    switch (normalized) {
      case 'open':
        return lang('pms.company.investigationStatus.open');
      case 'investigating':
        return lang('pms.company.investigationStatus.investigating');
      case 'closed':
        return lang('pms.company.investigationStatus.closed');
      case 'escalated':
        return lang('pms.company.investigationStatus.escalated');
      default:
        return String(status || '').replace(/_/g, ' ');
    }
  };

  const handleNavigateToClients = () => {
    navigate('/app/clients');
  };

  const handleNavigateToCompany = () => {
    navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}`);
  };

  const handleNavigateToComplianceInstances = () => {
    navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}/compliance-instances`);
  };

  const breadcrumbs = [
    { label: lang('clients.clientCompass'), onClick: handleNavigateToClients },
    { label: decodedCompanyName, onClick: handleNavigateToCompany },
    { label: lang('sidebar.menuItems.complianceInstances'), onClick: handleNavigateToComplianceInstances },
    { label: lang('sidebar.menuItems.postMarketSurveillance') },
  ];

  return (
    <RestrictedFeatureProvider
      isRestricted={isRestricted}
      planName={planName}
      featureName={lang('sidebar.menuItems.postMarketSurveillance')}
    >
      <div className="flex h-full min-h-0 flex-col">
        <ConsistentPageHeader
          breadcrumbs={breadcrumbs}
          title={lang('pms.company.title')}
          subtitle={lang('pms.company.subtitle')}
        />

        {isRestricted && <RestrictedPreviewBanner className="mt-6 !mb-0" />}

        <div className="flex-1 overflow-y-auto">
          <div className="w-full pt-6 p-2 space-y-6">

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{lang('pms.company.stats.totalReports')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {lang('pms.company.stats.acrossAllProducts')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{lang('pms.company.stats.upcomingReports')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{upcomingReports}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {lang('pms.company.stats.dueWithinDays').replace('{{days}}', '60')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{lang('pms.company.stats.overdueReports')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueReports}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {lang('pms.company.stats.requireImmediateAttention')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{lang('pms.company.stats.activeEvents')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openInvestigations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {reportableEvents > 0 && (
                <span className="text-red-600">
                  {(reportableEvents === 1
                    ? lang('pms.company.stats.pendingAuthorityReport')
                    : lang('pms.company.stats.pendingAuthorityReportPlural')
                  ).replace('{{count}}', String(reportableEvents))}
                </span>
              )}
              {reportableEvents === 0 && lang('pms.company.stats.underInvestigation')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>{lang('pms.company.recentSubmissions.title')}</CardTitle>
          <CardDescription>{lang('pms.company.recentSubmissions.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {recentReportsByProduct.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{lang('pms.company.recentSubmissions.empty')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReportsByProduct.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">{report.product_name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                      <span>{report.report_type}</span>
                      <span>•</span>
                      <span>{format(new Date(report.submission_date), 'MMM dd, yyyy')}</span>
                      {report.regulatory_body && (
                        <>
                          <span>•</span>
                          <span>{report.regulatory_body}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant={
                    report.submission_status === 'accepted' ? 'default' :
                    report.submission_status === 'rejected' ? 'destructive' : 'secondary'
                  }>
                    {getSubmissionStatusLabel(report.submission_status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>{lang('pms.company.recentEvents.title')}</CardTitle>
          <CardDescription>{lang('pms.company.recentEvents.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!events || events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{lang('pms.company.recentEvents.empty')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 10).map((event: any) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {event.products?.name || lang('pms.company.unknownProduct')}
                      {event.is_reportable && <Badge variant="destructive" className="text-xs">{lang('pms.company.reportable')}</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                      <span>{event.event_type.replace('_', ' ')}</span>
                      {event.severity && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{event.severity}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{format(new Date(event.event_date), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <Badge variant={
                    event.investigation_status === 'closed' ? 'default' :
                    event.investigation_status === 'escalated' ? 'destructive' : 'secondary'
                  }>
                    {getInvestigationStatusLabel(event.investigation_status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
          </div>
        </div>
      </div>
    </RestrictedFeatureProvider>
  );
}
