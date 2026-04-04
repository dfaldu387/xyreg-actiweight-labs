import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, AlertCircle, CheckCircle2, Clock, FileText, Activity, Plus, Bell, CheckSquare, Loader2, RefreshCcw } from 'lucide-react';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useProductCompanyGuard } from '@/hooks/useProductCompanyGuard';
import { usePMSReports, usePMSEvents } from '@/hooks/usePMSData';
import { usePMSActivityTracking, useUpdatePMSActivity } from '@/hooks/usePMSActivities';
import { useGeneratePMSActivities, useRegeneratePMSActivities } from '@/hooks/usePMSActivityGeneration';
import { getPMSSchedule, calculateNextPMSDate } from '@/utils/pmsSchedulingUtils';
import { getLaunchedMarkets, getLaunchStatusSummary } from '@/utils/launchStatusUtils';
import { computeNextPMSDueDate, getPMSIntervalLabel } from '@/utils/computeNextPMSDueDate';
import { formatDeviceClassCode } from '@/utils/deviceClassUtils';
import { resolveHighestRiskClass } from '@/utils/pmsDeviceClassResolver';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { PMSSubmissionForm } from '@/components/pms/PMSSubmissionForm';
import { PMSEventForm } from '@/components/pms/PMSEventForm';
import { PMSSubmissionList } from '@/components/pms/PMSSubmissionList';
import { PMSEventList } from '@/components/pms/PMSEventList';
import { PMSChecklistCard } from '@/components/pms/PMSChecklistCard';
import { MarketLaunchStatusCard } from '@/components/pms/MarketLaunchStatusCard';
import { toast } from 'sonner';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { DEVICES_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProductPMSPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const { data: product, isLoading } = useProductDetails(productId || '');

  // Check if PMS feature is enabled
  const { isMenuAccessKeyEnabled, isLoading: isLoadingPlanAccess, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(DEVICES_MENU_ACCESS.PMS);
  const isRestricted = !isFeatureEnabled;

  // Validate user has access to product's company (auto-switches context if needed)
  const { isValidating } = useProductCompanyGuard(product, isLoading);
  const { data: reports, isLoading: reportsLoading } = usePMSReports(productId);
  const { data: events, isLoading: eventsLoading } = usePMSEvents(productId);
  const { data: pmsActivities, isLoading: activitiesLoading } = usePMSActivityTracking(productId);
  const updateActivity = useUpdatePMSActivity();
  const generateActivities = useGeneratePMSActivities();
  const regenerateActivities = useRegeneratePMSActivities();
  
  const [submissionFormOpen, setSubmissionFormOpen] = useState(false);
  const [eventFormOpen, setEventFormOpen] = useState(false);

  const handleGenerateActivities = async () => {
    if (!product || !product.company_id || !product.markets) return;
    
    // Only generate for launched markets
    const launchedMarkets = getLaunchedMarkets(product.markets as any[]);
    
    await generateActivities.mutateAsync({
      productId: productId!,
      companyId: product.company_id,
      markets: launchedMarkets
    });
  };

  const handleRegenerateActivities = async () => {
    if (!product || !product.company_id || !product.markets) return;
    
    // Only regenerate for launched markets
    const launchedMarkets = getLaunchedMarkets(product.markets as any[]);
    
    await regenerateActivities.mutateAsync({
      productId: productId!,
      companyId: product.company_id,
      markets: launchedMarkets
    });
  };

  if (isLoading || isLoadingPlanAccess) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-96" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{lang('devicePMS.page.deviceNotFound')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get PMS schedule based on device class and markets
  const markets = product.markets || [];
  
  // Use market-level launch detection instead of product-level
  const launchedMarkets = getLaunchedMarkets(markets);
  const launchStatusSummary = getLaunchStatusSummary(markets);
  const isAnyMarketLaunched = launchedMarkets.length > 0;
  
  // Get device class from regulatory information (markets data)
  const deviceClass = resolveHighestRiskClass(markets as any) || (product as any).device_class || product.class;

  // Get multi-market PMS schedule - use only launched markets
  const pmsSchedule = getPMSSchedule(deviceClass, launchedMarkets, isAnyMarketLaunched);
  
  // Compute next PMS date from launch date + device class (auto-computed)
  // Use latest report date as anchor if available, otherwise use launch date
  const latestReportDate = reports && reports.length > 0
    ? reports.reduce((latest: string | null, r: any) => {
        const d = r.submission_date || r.created_at;
        return d && (!latest || d > latest) ? d : latest;
      }, null as string | null)
    : null;

  const launchDateStr = product?.actual_launch_date || product?.projected_launch_date;
  const anchorDate = latestReportDate || launchDateStr;
  const pmsResult = computeNextPMSDueDate(deviceClass, anchorDate);
  
  // Fallback: if no computed date, try static field
  const nextPMSDate = pmsResult.nextDueDate 
    ? pmsResult.nextDueDate 
    : (product as any).post_market_surveillance_date 
      ? calculateNextPMSDate(new Date((product as any).post_market_surveillance_date), pmsSchedule)
      : null;
  
  const normalizedDeviceClass = formatDeviceClassCode(deviceClass);
  const pmsIntervalLabel = getPMSIntervalLabel(deviceClass);

  // Urgency helpers
  const getUrgencyColor = (date: Date | null) => {
    if (!date) return 'secondary';
    const daysUntilDue = Math.floor((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue < 0) return 'destructive';
    if (daysUntilDue < 30) return 'destructive';
    if (daysUntilDue < 60) return 'default';
    return 'secondary';
  };

  const getDaysUntilDue = (date: Date | null) => {
    if (!date) return null;
    const days = Math.floor((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return lang('devicePMS.page.daysOverdue').replace('{{days}}', String(Math.abs(days)));
    return lang('devicePMS.page.daysRemaining').replace('{{days}}', String(days));
  };

  // Calculate stats
  const openEvents = events?.filter(e => e.investigation_status === 'open' || e.investigation_status === 'investigating').length || 0;
  const reportableEvents = events?.filter(e => e.is_reportable && !e.reported_to_authority).length || 0;

  return (
    <RestrictedFeatureProvider
      isRestricted={isRestricted}
      planName={planName}
      featureName={lang('devicePMS.page.featureName')}
    >
    <div className="p-2 pt-4 space-y-6">
      {isRestricted && <RestrictedPreviewBanner className="mb-4" />}

      {/* Class-based PMS schedule banner */}
      {normalizedDeviceClass && pmsResult.requiresPeriodicPMS && (
        <Alert className="border-primary/30 bg-primary/5">
          <Activity className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>Class {normalizedDeviceClass}</strong> — {pmsIntervalLabel}
              {anchorDate && nextPMSDate && (
                <span className="ml-2 text-muted-foreground">
                  (Next due: {format(nextPMSDate, 'MMM dd, yyyy')})
                </span>
              )}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/app/product/${productId}/milestones`)}
              className="text-xs"
            >
              View Timeline →
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {normalizedDeviceClass && !pmsResult.requiresPeriodicPMS && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <strong>Class {normalizedDeviceClass}</strong> — No periodic PMS review required. Reports submitted on demand only.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{lang('devicePMS.page.title')}</h1>
          <p className="text-muted-foreground">
            {lang('devicePMS.page.subtitle').replace('{{productName}}', product.name)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setEventFormOpen(true)} variant="outline" disabled={isRestricted}>
            <Bell className="mr-2 h-4 w-4" />
            {lang('devicePMS.page.logEvent')}
          </Button>
          <Button onClick={() => setSubmissionFormOpen(true)} disabled={isRestricted}>
            <Plus className="mr-2 h-4 w-4" />
            {lang('devicePMS.page.logSubmission')}
          </Button>
        </div>
      </div>

      {/* PMS Status Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{lang('devicePMS.cards.deviceClassification')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {/* Class {deviceClass || 'Not Set'} */}
              Class {`${deviceClass === "class-i" || deviceClass === "class_i" ? "Class I" : deviceClass === "class-ii" || deviceClass === "class_ii" ? "Class II" : deviceClass === "class-iia" || deviceClass === "class-2a" || deviceClass === "class_iia" ? "Class IIa" : deviceClass === "class-iib" || deviceClass === "class-2b" || deviceClass === "class_iib" ? "Class IIb" : deviceClass === "class-iii" || deviceClass === "class_iii" ? "Class III" : deviceClass || lang('devicePMS.cards.notSet')}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pmsSchedule.primaryMarket?.description || lang('devicePMS.cards.noPMSConfigured')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{lang('devicePMS.cards.reportType')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pmsSchedule.primaryMarket?.reportType || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pmsSchedule.primaryMarket
                ? lang('devicePMS.cards.reportingInterval').replace('{{interval}}', pmsSchedule.primaryMarket.interval === 60 ? lang('devicePMS.cards.onDemand') : lang('devicePMS.cards.everyMonths').replace('{{months}}', String(pmsSchedule.primaryMarket.interval)))
                : lang('devicePMS.cards.noReportingRequirements')
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{lang('devicePMS.cards.nextReportDue')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {nextPMSDate ? (
              <>
                <div className="text-2xl font-bold">
                  {format(nextPMSDate, 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={getUrgencyColor(nextPMSDate)}>
                    {getDaysUntilDue(nextPMSDate)}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                {pmsSchedule.primaryMarket?.reportType === 'On-Demand'
                  ? lang('devicePMS.cards.noScheduledDate')
                  : lang('devicePMS.cards.setLastPMSDate')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{lang('devicePMS.cards.activeEvents')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {reportableEvents > 0 && (
                <span className="text-red-600 dark:text-red-400">
                  {lang('devicePMS.cards.pendingAuthorityReport').replace('{{count}}', String(reportableEvents))}
                </span>
              )}
              {reportableEvents === 0 && lang('devicePMS.cards.noPendingActions')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Market Launch Status Overview */}
      <MarketLaunchStatusCard markets={markets} productId={productId!} />

      {/* PMS Requirements - Multi-Market */}
      <Card>
        <CardHeader>
          <CardTitle>{lang('devicePMS.requirements.title')}</CardTitle>
          <CardDescription>
            {lang('devicePMS.requirements.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Launch Status - Market-Level */}
          <div className="flex items-start gap-3">
            {isAnyMarketLaunched ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium">{lang('devicePMS.requirements.launchStatus')}</p>
              {isAnyMarketLaunched ? (
                <div className="space-y-2 mt-1">
                  <p className="text-sm text-muted-foreground">
                    {lang('devicePMS.requirements.launchedInMarkets').replace('{{count}}', String(launchStatusSummary.launchedMarkets))}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {launchedMarkets.map((market: any) => (
                      <Badge key={market.code} variant="secondary" className="text-xs">
                        {market.code}
                        {market.regulatoryStatus && ` (${market.regulatoryStatus.replace(/_/g, ' ')})`}
                      </Badge>
                    ))}
                  </div>
                  {launchStatusSummary.plannedMarkets > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {lang('devicePMS.requirements.marketsInPlanning').replace('{{count}}', String(launchStatusSummary.plannedMarkets))}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1 mt-1">
                  <p className="text-sm text-muted-foreground">
                    {lang('devicePMS.requirements.notYetLaunched')}
                  </p>
                  {launchStatusSummary.totalMarkets > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {lang('devicePMS.requirements.marketsSelected').replace('{{count}}', String(launchStatusSummary.totalMarkets))}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {pmsSchedule.primaryMarket && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{pmsSchedule.primaryMarket.marketName}</p>
                    <Badge variant="default">{lang('devicePMS.requirements.mostStringent')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pmsSchedule.primaryMarket.description}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{lang('devicePMS.requirements.reportType')}</p>
                  <p className="font-medium">{pmsSchedule.primaryMarket.reportType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{lang('devicePMS.requirements.interval')}</p>
                  <p className="font-medium">
                    {pmsSchedule.primaryMarket.interval === 60
                      ? lang('devicePMS.cards.onDemand')
                      : lang('devicePMS.cards.everyMonths').replace('{{months}}', String(pmsSchedule.primaryMarket.interval))}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">{lang('devicePMS.requirements.regulatoryBody')}</p>
                  <p className="font-medium">{pmsSchedule.primaryMarket.regulatoryBody}</p>
                </div>
              </div>
            </div>
          )}

          {pmsSchedule.additionalMarkets.length > 0 && (
            <div className="space-y-3">
              <p className="font-medium text-sm">{lang('devicePMS.requirements.additionalMarketRequirements')}</p>
              {pmsSchedule.additionalMarkets.map((req) => (
                <div key={req.marketCode} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{req.marketName}</p>
                      <p className="text-xs text-muted-foreground">{req.reportType}</p>
                    </div>
                    <Badge variant={req.isRequired ? "destructive" : "secondary"} className="text-xs">
                      {req.isRequired ? lang('devicePMS.requirements.required') : lang('devicePMS.requirements.optional')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{req.description}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">{lang('devicePMS.requirements.interval')}</p>
                      <p className="font-medium">
                        {req.interval === 60 ? lang('devicePMS.cards.onDemand') : lang('devicePMS.requirements.months').replace('{{months}}', String(req.interval))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{lang('devicePMS.requirements.authority')}</p>
                      <p className="font-medium">{req.regulatoryBody}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!pmsSchedule.primaryMarket && pmsSchedule.additionalMarkets.length === 0 && (
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium">{lang('devicePMS.requirements.noMarketsSelected')}</p>
                <p className="text-sm text-muted-foreground">
                  {lang('devicePMS.requirements.configureRegulatoryInfo')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="checklists" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checklists">
            <CheckSquare className="mr-2 h-4 w-4" />
            {lang('devicePMS.tabs.checklists')} ({pmsActivities?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <FileText className="mr-2 h-4 w-4" />
            {lang('devicePMS.tabs.submissions')} ({reports?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="events">
            <Bell className="mr-2 h-4 w-4" />
            {lang('devicePMS.tabs.events')} ({events?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checklists" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{lang('devicePMS.checklists.title')}</CardTitle>
                  <CardDescription>
                    {lang('devicePMS.checklists.description')}
                  </CardDescription>
                </div>
                {pmsActivities && pmsActivities.length > 0 && (
                  <Button
                    onClick={handleRegenerateActivities}
                    disabled={isRestricted || regenerateActivities.isPending}
                    variant="outline"
                    size="sm"
                  >
                    {regenerateActivities.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {lang('devicePMS.checklists.regenerating')}
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        {lang('devicePMS.checklists.regenerateActivities')}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3 animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="space-y-2">
                        <div className="h-2 bg-muted rounded"></div>
                        <div className="h-2 bg-muted rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : pmsActivities && pmsActivities.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(
                    pmsActivities.reduce((acc, activity) => {
                      const market = activity.market_code;
                      if (!acc[market]) acc[market] = [];
                      acc[market].push(activity);
                      return acc;
                    }, {} as Record<string, typeof pmsActivities>)
                  ).map(([market, marketActivities]) => (
                    <div key={market} className="space-y-3">
                      <h3 className="text-lg font-semibold">{lang('devicePMS.checklists.marketActivities').replace('{{market}}', market)}</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {marketActivities.map((activity) => (
                          <PMSChecklistCard
                            key={activity.id}
                            activity={activity}
                            onUpdate={(updates) => updateActivity.mutate({ id: activity.id, ...updates })}
                            disabled={isRestricted}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center space-y-4 py-8">
                  <div className="text-muted-foreground">
                    {lang('devicePMS.checklists.noActivitiesGenerated')}
                  </div>
                  {launchedMarkets.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {lang('devicePMS.checklists.generateForLaunchedMarkets').replace('{{markets}}', launchedMarkets.map((m: any) => m.code).join(', '))}
                      </p>
                      <Button
                        onClick={handleGenerateActivities}
                        disabled={isRestricted || generateActivities.isPending}
                      >
                        {generateActivities.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {lang('devicePMS.checklists.generating')}
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            {lang('devicePMS.checklists.generateActivities')}
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {lang('devicePMS.checklists.noMarketsLaunched')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lang('devicePMS.checklists.markMarketsAsLaunched')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{lang('devicePMS.submissions.title')}</CardTitle>
              <CardDescription>
                {lang('devicePMS.submissions.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PMSSubmissionList reports={reports} isLoading={reportsLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{lang('devicePMS.events.title')}</CardTitle>
              <CardDescription>
                {lang('devicePMS.events.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PMSEventList events={events} isLoading={eventsLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      <PMSSubmissionForm 
        open={submissionFormOpen}
        onOpenChange={setSubmissionFormOpen}
        productId={productId || ''}
        companyId={product.company_id}
      />
      
      <PMSEventForm
        open={eventFormOpen}
        onOpenChange={setEventFormOpen}
        productId={productId || ''}
        companyId={product.company_id}
      />
    </div>
    </RestrictedFeatureProvider>
  );
}
