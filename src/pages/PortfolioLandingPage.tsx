import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { HelpTooltip } from '@/components/product/device/sections/HelpTooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PieChart, BarChart3, LayoutGrid, Columns, Clock, List, Network, GitBranch, Package, Plus, Lock, Sparkles, DollarSign, Globe, FileKey, AlertTriangle } from 'lucide-react';
import { BudgetDashboardContent } from '@/pages/CompanyBudgetDashboard';
import { VarianceAnalysisDashboard } from '@/components/commercial/VarianceAnalysisDashboard';
import { InvestorsPage } from '@/components/investors/InvestorsPage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AddProductDialog } from '@/components/product/AddProductDialog';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { isValidUUID } from '@/utils/uuidValidation';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { useTranslation } from '@/hooks/useTranslation';


export default function PortfolioLandingPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'budget';
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : "";
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const { lang } = useTranslation();

  // Get plan-based menu access - MUST be called before any conditional returns
  const { isMenuAccessKeyEnabled, planName, isLoading: isLoadingPlanAccess } = usePlanMenuAccess();

  // Show loading while companyId is resolving
  if (companyName && !isValidUUID(companyId)) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }


  const handleNavigateToClients = () => {
    navigate('/app/clients');
  };

  const handleNavigateToCompany = () => {
    if (companyName) {
      navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}`);
    }
  };

  if (!companyName) {
    return (
      <div className="px-2 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">{lang('portfolioLanding.companyNotFound')}</h1>
          <p className="text-muted-foreground mt-2">
            {lang('portfolioLanding.companyNotFoundDesc')}
          </p>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    {
      label: lang('portfolioLanding.clientCompass'),
      onClick: handleNavigateToClients
    },
    {
      label: decodedCompanyName,
      onClick: handleNavigateToCompany
    },
    {
      label: lang('portfolioLanding.portfolioManagement')
    }
  ];

  const portfolioViews = [
    {
      id: "sunburst",
      label: lang('portfolioLanding.views.sunburst.label'),
      icon: PieChart,
      description: lang('portfolioLanding.views.sunburst.description'),
      color: "from-blue-500 to-purple-600",
      menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_SUNBURST
    },
    {
      id: "phases-chart",
      label: lang('portfolioLanding.views.phasesChart.label'),
      icon: BarChart3,
      description: lang('portfolioLanding.views.phasesChart.description'),
      color: "from-green-500 to-blue-600",
      menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_PHASES_CHART
    },
    {
      id: "cards",
      label: lang('portfolioLanding.views.cards.label'),
      icon: LayoutGrid,
      description: lang('portfolioLanding.views.cards.description'),
      color: "from-orange-500 to-red-600",
      menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_CARDS
    },
    {
      id: "phases",
      label: lang('portfolioLanding.views.phases.label'),
      icon: Columns,
      description: lang('portfolioLanding.views.phases.description'),
      color: "from-purple-500 to-pink-600",
      menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_PHASES
    },
    {
      id: "timeline",
      label: lang('portfolioLanding.views.timeline.label'),
      icon: Clock,
      description: lang('portfolioLanding.views.timeline.description'),
      color: "from-teal-500 to-cyan-600",
      menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_TIMELINE
    },
    {
      id: "list",
      label: lang('portfolioLanding.views.list.label'),
      icon: List,
      description: lang('portfolioLanding.views.list.description'),
      color: "from-gray-500 to-slate-600",
      menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_LIST
    },
    {
      id: "relationships",
      label: lang('portfolioLanding.views.relationships.label'),
      icon: Network,
      description: lang('portfolioLanding.views.relationships.description'),
      color: "from-emerald-500 to-teal-600",
      menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_RELATIONSHIPS
    },
    {
      id: "hierarchy-graph",
      label: lang('portfolioLanding.views.hierarchyGraph.label'),
      icon: GitBranch,
      description: lang('portfolioLanding.views.hierarchyGraph.description'),
      color: "from-rose-500 to-pink-600",
      menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_HIERARCHY
    },
    {
      id: "bundles",
      label: lang('portfolioLanding.views.bundles.label'),
      icon: Package,
      description: lang('portfolioLanding.views.bundles.description'),
      color: "from-violet-500 to-indigo-600",
      menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_BUNDLES
    },
    {
      id: "genesis",
      label: lang('portfolioLanding.views.genesis.label'),
      icon: Sparkles,
      description: lang('portfolioLanding.views.genesis.description'),
      color: "from-indigo-500 to-blue-600",
      menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_GENESIS
    }
  ];

  // Check if a view is enabled based on plan's menu_access
  const isViewEnabled = (menuAccessKey: string): boolean => {
    return isMenuAccessKeyEnabled(menuAccessKey);
  };

  const handleViewClick = (viewId: string) => {
    navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}/portfolio?view=${viewId}`);
  };

  const handleProductsClick = () => {
    navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}/portfolio?view=cards`);
  };

  const handlePlatformsClick = () => {
    navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}/portfolio?view=cards&mode=platforms`);
  };

  const handleAddProductClick = () => {
    setShowAddProduct(true);
  };

  const handleProductAdded = (productId: string) => {
    toast({
      title: lang('common.success'),
      description: lang('portfolioLanding.deviceCreatedSuccess'),
    });
    navigate(`/app/product/${productId}/device-information`);
  };

  const title = (
    <span>
      {decodedCompanyName} <span className="text-company-brand">{lang('portfolioLanding.portfolioManagement')}</span>
    </span>
  );

  const headerActions = (
    <>
      <Button variant="outline" size="sm" onClick={handleProductsClick}>
        <Package className="h-4 w-4 mr-2" />
        {lang('portfolioLanding.devices')}
      </Button>
      <Button variant="outline" size="sm" onClick={handlePlatformsClick}>
        <LayoutGrid className="h-4 w-4 mr-2" />
        {lang('portfolioLanding.platforms')}
      </Button>
      <Button size="sm" onClick={handleAddProductClick}>
        <Plus className="h-4 w-4 mr-2" />
        {lang('portfolioLanding.addDevice')}
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={title}
        subtitle={lang('portfolioLanding.subtitle')}
        actions={headerActions}
      />
      
      <div className="px-2 space-y-6">
        <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="portfolio" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>{lang('portfolioLanding.portfolioViews')}</span>
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>{lang('portfolioLanding.tabs.budget')}</span>
              </TabsTrigger>
              <TabsTrigger value="variance-analysis" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>{lang('portfolioLanding.tabs.varianceAnalysis')}</span>
              </TabsTrigger>
              <TabsTrigger value="investors" className="flex items-center gap-2">
                <FileKey className="h-4 w-4" />
                <span>{lang('portfolioLanding.tabs.investors')}</span>
              </TabsTrigger>
              <TabsTrigger value="risk-map" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{lang('portfolioLanding.tabs.riskMap')}</span>
              </TabsTrigger>
            </TabsList>
          
          <TabsContent value="portfolio" className="space-y-6">
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {portfolioViews.map((view) => {
                  if (isLoadingPlanAccess) {
                    return (
                      <div key={view.id} className="border rounded-lg p-6 opacity-50">
                        <div className="flex flex-col gap-4">
                          <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center animate-pulse" />
                          <div>
                            <div className="h-5 bg-slate-200 rounded w-3/4 mb-2 animate-pulse" />
                            <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const enabled = isViewEnabled(view.menuAccessKey);

                  if (!enabled) {
                    return (
                      <Tooltip key={view.id}>
                        <TooltipTrigger asChild>
                          <div className="border rounded-lg p-6 cursor-not-allowed bg-slate-50/50 relative">
                            <div className="flex flex-col gap-4">
                              <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
                                <view.icon className="h-6 w-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-slate-400">{view.label}</h3>
                                  <Lock className="h-4 w-4 text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed">{view.description}</p>
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <div className="flex items-start gap-2">
                            <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">
                              {planName
                                ? lang('portfolioLanding.viewNotAvailableOnPlan').replace('{{planName}}', planName)
                                : lang('portfolioLanding.upgradeToAccessView')}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <div
                      key={view.id}
                      className="border rounded-lg p-6 hover:bg-muted/50 cursor-pointer transition-all hover:shadow-md group"
                      onClick={() => handleViewClick(view.id)}
                    >
                      <div className="flex flex-col gap-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${view.color} flex items-center justify-center text-white shadow-sm`}>
                          <view.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{view.label}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{view.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <BudgetDashboardContent />
          </TabsContent>

          <TabsContent value="variance-analysis" className="space-y-6">
            {companyId && <VarianceAnalysisDashboard companyId={companyId} />}
          </TabsContent>

          <TabsContent value="investors" className="space-y-6">
            {companyId && <InvestorsPage companyId={companyId} companyName={decodedCompanyName} />}
          </TabsContent>

          <TabsContent value="risk-map" className="space-y-6">
            <Card className="border">
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center space-y-2">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold">{lang('portfolioLanding.riskMap.comingSoon')}</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {lang('portfolioLanding.riskMap.description')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {companyId && (
        <AddProductDialog
          companyId={companyId}
          open={showAddProduct}
          onOpenChange={setShowAddProduct}
          onProductAdded={handleProductAdded}
        />
      )}
    </div>
  );
}
