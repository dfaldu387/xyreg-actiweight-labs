import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileKey, Lock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

import { CommercialPerformancePage } from '@/components/commercial/CommercialPerformancePage';
import { CompanyPricingStrategy } from '@/components/commercial/CompanyPricingStrategy';
import { VarianceAnalysisDashboard } from '@/components/commercial/VarianceAnalysisDashboard';
import { MarketAnalysisPage } from '@/components/commercial/MarketAnalysisPage';
import { FeasibilityStudiesPage } from '@/components/commercial/FeasibilityStudiesPage';
import { CompanyVentureBlueprint } from '@/components/commercial/CompanyVentureBlueprint';
import { CompanyBusinessCanvas } from '@/components/commercial/CompanyBusinessCanvas';
import { InvestorsPage } from '@/components/investors/InvestorsPage';
import { FundingGrantsTab } from '@/components/commercial/funding/FundingGrantsTab';
import { useCompanyId } from '@/hooks/useCompanyId';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { buildCompanyBreadcrumbs } from '@/utils/breadcrumbUtils';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { PlanUpgradeRequired } from '@/components/subscription/PlanUpgradeRequired';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';
import { useCustomerFeatureFlag } from '@/hooks/useCustomerFeatureFlag';


// Tab configuration with menu access keys - labels and descriptions are translated dynamically
const TAB_CONFIG_BASE = [
  {
    value: 'strategic-blueprint',
    labelKey: 'commercial.tabs.strategicBlueprint',
    menuAccessKey: PORTFOLIO_MENU_ACCESS.COMMERCIAL_STRATEGIC_BLUEPRINT,
    descriptionKey: 'commercial.tabs.strategicBlueprintDesc'
  },
  {
    value: 'business-canvas',
    labelKey: 'commercial.tabs.businessCanvas',
    menuAccessKey: PORTFOLIO_MENU_ACCESS.COMMERCIAL_BUSINESS_CANVAS,
    descriptionKey: 'commercial.tabs.businessCanvasDesc'
  },
  {
    value: 'feasibility-studies',
    labelKey: 'commercial.tabs.feasibilityStudies',
    menuAccessKey: PORTFOLIO_MENU_ACCESS.COMMERCIAL_FEASIBILITY_STUDIES,
    descriptionKey: 'commercial.tabs.feasibilityStudiesDesc'
  },
  {
    value: 'market-analysis',
    labelKey: 'commercial.tabs.marketAnalysis',
    menuAccessKey: PORTFOLIO_MENU_ACCESS.COMMERCIAL_MARKET_ANALYSIS,
    descriptionKey: 'commercial.tabs.marketAnalysisDesc'
  },
  {
    value: 'commercial-performance',
    labelKey: 'commercial.tabs.commercialPerformance',
    menuAccessKey: PORTFOLIO_MENU_ACCESS.COMMERCIAL_COMMERCIAL_PERFORMANCE,
    descriptionKey: 'commercial.tabs.commercialPerformanceDesc'
  },
  {
    value: 'variance-analysis',
    labelKey: 'commercial.tabs.varianceAnalysis',
    menuAccessKey: PORTFOLIO_MENU_ACCESS.COMMERCIAL_VARIANCE_ANALYSIS,
    descriptionKey: 'commercial.tabs.varianceAnalysisDesc'
  },
  {
    value: 'pricing-strategy',
    labelKey: 'commercial.tabs.pricingStrategy',
    menuAccessKey: PORTFOLIO_MENU_ACCESS.COMMERCIAL_PRICING_STRATEGY,
    descriptionKey: 'commercial.tabs.pricingStrategyDesc'
  },
  {
    value: 'investors',
    labelKey: 'commercial.tabs.investors',
    menuAccessKey: PORTFOLIO_MENU_ACCESS.COMMERCIAL_INVESTORS,
    icon: FileKey,
    descriptionKey: 'commercial.tabs.investorsDesc'
  },
  {
    value: 'funding-grants',
    labelKey: 'commercial.tabs.fundingGrants',
    menuAccessKey: PORTFOLIO_MENU_ACCESS.COMMERCIAL_FUNDING_GRANTS,
    descriptionKey: 'commercial.tabs.fundingGrantsDesc'
  },
];

export default function CompanyCommercialPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { lang } = useTranslation();

  // Get plan-based menu access
  const { isMenuAccessKeyEnabled, planName, isLoading: isLoadingPlanAccess } = usePlanMenuAccess();
  const businessCanvasEnabled = useCustomerFeatureFlag('business-canvas');
  const strategicBlueprintEnabled = useCustomerFeatureFlag('strategic-blueprint');

  // Create translated TAB_CONFIG, filtering out disabled feature-flagged tabs
  const TAB_CONFIG = TAB_CONFIG_BASE
    .filter(tab => {
      if (tab.value === 'business-canvas' && !businessCanvasEnabled) return false;
      if (tab.value === 'strategic-blueprint' && !strategicBlueprintEnabled) return false;
      return true;
    })
    .map(tab => ({
      ...tab,
      label: lang(tab.labelKey),
      description: lang(tab.descriptionKey)
    }));

  // Handle legacy redirects
  const tabParam = searchParams.get('tab') || 'strategic-blueprint';
  let activeTab = tabParam;
  if (tabParam === 'rnpv') activeTab = 'commercial-performance';
  if (tabParam === 'investor-data-room') activeTab = 'investors';

  // Check if a tab is enabled based on plan's menu_access
  const isTabEnabled = (menuAccessKey: string): boolean => {
    return isMenuAccessKeyEnabled(menuAccessKey);
  };

  // Helper to get tab config by value
  const getTabConfig = (tabValue: string) => TAB_CONFIG.find(t => t.value === tabValue);

  const handleTabChange = (value: string) => {
    navigate(`/app/company/${encodeURIComponent(companyName || '')}/commercial?tab=${value}`);
  };

  // Tabs that support preview mode (show content but disable interactions)
  // All tabs now support preview mode - users can see but not interact
  const PREVIEW_MODE_TABS = [
    'strategic-blueprint',
    'business-canvas',
    'feasibility-studies',
    'market-analysis',
    'commercial-performance',
    'variance-analysis',
    'pricing-strategy',
    'investors',
    'funding-grants'
  ];

  // Render tab content - shows preview mode or upgrade component based on tab config
  const renderTabContent = (tabValue: string, content: React.ReactNode) => {
    const tabConfig = getTabConfig(tabValue);
    if (!tabConfig) return content;

    // Show loading state while checking plan access
    if (isLoadingPlanAccess) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">{lang('commercial.loading')}</p>
          </div>
        </div>
      );
    }

    const enabled = isTabEnabled(tabConfig.menuAccessKey);
    const supportsPreview = PREVIEW_MODE_TABS.includes(tabValue);

    // If tab is disabled and supports preview mode, show content in restricted mode
    if (!enabled && supportsPreview) {
      return (
        <RestrictedFeatureProvider
          isRestricted={true}
          planName={planName}
          featureName={tabConfig.label}
        >
          <RestrictedPreviewBanner />
          {content}
        </RestrictedFeatureProvider>
      );
    }

    // If tab is disabled and doesn't support preview, show upgrade prompt
    if (!enabled) {
      return (
        <PlanUpgradeRequired
          featureName={tabConfig.label}
          planName={planName}
          featureDescription={tabConfig.description}
        />
      );
    }

    // Tab is enabled - wrap with non-restricted context for consistency
    return (
      <RestrictedFeatureProvider
        isRestricted={false}
        planName={planName}
        featureName={tabConfig.label}
      >
        {content}
      </RestrictedFeatureProvider>
    );
  };

  const handleNavigateToClients = () => navigate('/app/clients');
  const handleNavigateToCompany = () => navigate(`/app/company/${encodeURIComponent(companyName || '')}`);

  const breadcrumbs = buildCompanyBreadcrumbs(
    companyName || '',
    lang('commercial.commercialIntelligence'),
    handleNavigateToClients,
    handleNavigateToCompany,
    { clientCompassLabel: lang('commercial.clientCompass') }
  );
  
  // Show loading while resolving company ID
  if (companyId === undefined) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{lang('commercial.loading')}</h1>
          <p className="text-muted-foreground">
            {lang('commercial.resolvingCompanyInfo')}
          </p>
        </div>
      </div>
    );
  }

  // Show error if company ID could not be resolved
  if (!companyId) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{lang('commercial.companyNotFound')}</h1>
          <p className="text-muted-foreground">
            {lang('commercial.unableToFindCompany').replace('{{companyName}}', decodeURIComponent(companyName || ''))}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={lang('commercial.pageTitle').replace('{{companyName}}', companyName || '')}
        subtitle={lang('commercial.pageSubtitle')}
      />
      <div className="py-4">
        <div className="space-y-6">
        <TooltipProvider>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="overflow-x-auto w-full">
          <TabsList className="inline-flex w-max gap-2 p-1 xl:w-full xl:grid xl:grid-cols-9">
            {TAB_CONFIG.map((tab) => {
              const IconComponent = tab.icon;
              const supportsPreview = PREVIEW_MODE_TABS.includes(tab.value);

              // While loading plan access, show tabs in a neutral/loading state
              if (isLoadingPlanAccess) {
                return (
                  <div
                    key={tab.value}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground/50"
                  >
                    {IconComponent && <IconComponent className="h-4 w-4 mr-2 opacity-50" />}
                    <span className="truncate opacity-50">{tab.label}</span>
                  </div>
                );
              }

              const enabled = isTabEnabled(tab.menuAccessKey);

              // If tab supports preview mode, show minimal lock icon
              if (!enabled && supportsPreview) {
                return (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
                    {tab.label}
                    <Lock className="min-h-3 min-w-3 max-h-3 max-w-3 ml-1.5 text-foreground/60" />
                  </TabsTrigger>
                );
              }

              // Tab is disabled and doesn't support preview - show locked state
              if (!enabled) {
                return (
                  <Tooltip key={tab.value}>
                    <TooltipTrigger asChild>
                      <div
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium cursor-not-allowed"
                      >
                        <Lock className="min-h-3 min-w-3 max-h-3 max-w-3 mr-1.5 text-foreground/60" />
                        <span className="text-foreground/60 truncate">{tab.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-foreground/60 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">
                          {planName
                            ? (<span>{lang('commercial.featureNotAvailable').replace('{{planName}}', planName)} <button className="underline hover:text-primary" onClick={() => navigate(`/app/company/${encodeURIComponent(companyName || '')}/pricing`)}>{lang('commercial.upgradeToAccess')}</button></span>)
                            : (<span><button className="underline hover:text-primary" onClick={() => navigate(`/app/company/${encodeURIComponent(companyName || '')}/pricing`)}>{lang('commercial.upgradePlan')}</button>{lang('commercial.toAccessFeature')}</span>)}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          </div>

          {strategicBlueprintEnabled && (
            <TabsContent value="strategic-blueprint" className="space-y-6">
              {renderTabContent('strategic-blueprint', <CompanyVentureBlueprint companyId={companyId} />)}
            </TabsContent>
          )}

          {businessCanvasEnabled && (
            <TabsContent value="business-canvas" className="space-y-6">
              {renderTabContent('business-canvas', <CompanyBusinessCanvas companyId={companyId} />)}
            </TabsContent>
          )}

          <TabsContent value="feasibility-studies" className="space-y-6">
            {renderTabContent('feasibility-studies', <FeasibilityStudiesPage companyId={companyId} />)}
          </TabsContent>

          <TabsContent value="market-analysis" className="space-y-6">
            {renderTabContent('market-analysis', <MarketAnalysisPage companyId={companyId} />)}
          </TabsContent>

          <TabsContent value="commercial-performance" className="space-y-6">
            {renderTabContent('commercial-performance', <CommercialPerformancePage companyId={companyId} />)}
          </TabsContent>

          <TabsContent value="variance-analysis" className="space-y-6">
            {renderTabContent('variance-analysis', <VarianceAnalysisDashboard companyId={companyId} />)}
          </TabsContent>

          <TabsContent value="pricing-strategy" className="space-y-6">
            {renderTabContent('pricing-strategy', <CompanyPricingStrategy companyId={companyId} />)}
          </TabsContent>

          <TabsContent value="investors" className="space-y-6">
            {renderTabContent('investors', <InvestorsPage companyId={companyId} companyName={decodeURIComponent(companyName || '')} />)}
          </TabsContent>

          <TabsContent value="funding-grants" className="space-y-6">
            {renderTabContent('funding-grants', <FundingGrantsTab companyId={companyId} />)}
          </TabsContent>
        </Tabs>
        </TooltipProvider>
        </div>
      </div>
    </>
  );
}