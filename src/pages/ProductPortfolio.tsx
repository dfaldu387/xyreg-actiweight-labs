import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, LayoutGrid, Columns, Clock, Plus, List, Settings, PieChart, BarChart3, Package2, ChevronDown, Network, GitBranch, Layers, Lock, Crosshair } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HierarchicalBulkManagement, type HierarchicalBulkManagementRef } from "@/components/settings/bulk/HierarchicalBulkManagement";
import { PortfolioSunburst } from "@/components/charts/PortfolioSunburst";
import { DividedPhasesBar } from "@/components/charts/DividedPhasesBar";
import { VariantFilters } from "@/components/charts/VariantFilters";
import type { VariantFilters as VariantFiltersType, MarketFilters as MarketFiltersType } from "@/components/charts/VariantFilters";
import { ProductGrid } from "@/components/dashboard/ProductGrid";
import { PhasesView } from "@/components/dashboard/PhasesView";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { ProductDataTable } from "@/components/dashboard/ProductDataTable";
import { AddProductDialog } from "@/components/product/AddProductDialog";
import { CreatePlatformDialog } from "@/components/product/CreatePlatformDialog";
import { RecentlyViewedProductsDropdown } from "@/components/product/RecentlyViewedProductsDropdown";
import { CategorizedPortfolioView } from "@/components/portfolio/CategorizedPortfolioView";
import { PortfolioViewWidget } from "@/components/portfolio/PortfolioViewWidget";
import { HierarchyGraphView } from "@/components/portfolio/HierarchyGraphView";
import { BundleGrid } from "@/components/portfolio/BundleGrid";
import { CreateBundleDialog } from "@/components/product/bundle/CreateBundleDialog";
import { PortfolioGenesisView } from "@/components/portfolio-genesis/PortfolioGenesisView";


import { PlatformOverview } from "@/components/platform/PlatformOverview";
import { PlatformManagementTable } from "@/components/platform/PlatformManagementTable";
import { PortfolioRelationshipsManager } from "@/components/commercial/PortfolioRelationshipsManager";
import { PortfolioSiblingGroupsManager } from "@/components/portfolio/PortfolioSiblingGroupsManager";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { usePortfolioSunburst } from "@/hooks/usePortfolioSunburst";
import { usePortfolioPhases } from "@/hooks/usePortfolioPhases";
import { useAvailableMarkets } from "@/hooks/useAvailableMarkets";
import { useOptimizedCompanyProducts } from "@/hooks/useOptimizedCompanyProducts";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useCompanyBundles } from "@/hooks/useCompanyBundles";
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { PORTFOLIO_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { useTranslation } from "@/hooks/useTranslation";

import { computePortfolioTotal } from "@/services/portfolioSunburstService";
import { toast } from "sonner";
import { ConsistentPageHeader } from "@/components/layout/ConsistentPageHeader";
import { buildCompanyBreadcrumbs } from "@/utils/breadcrumbUtils";
import { ProductPortfolioErrorBoundary } from "@/components/error/ProductPortfolioErrorBoundary";
import { Link } from "react-router-dom";

type ViewType = "sunburst" | "phases-chart" | "cards" | "phases" | "timeline" | "list" | "relationships" | "hierarchy-graph" | "bundles" | "genesis";
type ChartType = "segments" | "phases";
type PortfolioMode = "Device" | "platforms";

export default function ProductPortfolio() {
  const {
    companyName
  } = useParams<{
    companyName: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Resolve company name from URL to UUID
  const companyId = useCompanyId();
  
  const {
    data: companyInfo
  } = useCompanyInfo(companyId);
  const { defaultPortfolioView, preferences } = useUserPreferences();
  const hierarchicalManagementRef = useRef<HierarchicalBulkManagementRef>(null);

  // Get plan-based menu access
  const { isMenuAccessKeyEnabled, planName, isLoading: isLoadingPlanAccess } = usePlanMenuAccess();
  const { lang } = useTranslation();

  // View configuration with menu access keys
  const portfolioViewConfig = [
    { id: "genesis", labelKey: "devicePortfolio.views.xyregGenesis", icon: Crosshair, menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_GENESIS },
    { id: "sunburst", labelKey: "devicePortfolio.views.sunburstChart", icon: PieChart, menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_SUNBURST },
    { id: "phases-chart", labelKey: "devicePortfolio.views.phasesChart", icon: BarChart3, menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_PHASES_CHART },
    { id: "cards", labelKey: "devicePortfolio.views.deviceCards", icon: LayoutGrid, menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_CARDS },
    { id: "phases", labelKey: "devicePortfolio.views.phasesBoard", icon: Columns, menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_PHASES },
    { id: "timeline", labelKey: "devicePortfolio.views.timelineView", icon: Clock, menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_TIMELINE },
    { id: "list", labelKey: "devicePortfolio.views.dataTable", icon: List, menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_LIST },
    { id: "relationships", labelKey: "devicePortfolio.views.relationships", icon: Network, menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_RELATIONSHIPS },
    { id: "hierarchy-graph", labelKey: "devicePortfolio.views.hierarchyGraph", icon: GitBranch, menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_HIERARCHY },
    { id: "bundles", labelKey: "devicePortfolio.views.deviceBundles", icon: Package2, menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_BUNDLES },
  ];

  // Check if a view is enabled based on plan's menu_access
  const isViewEnabled = (menuAccessKey: string): boolean => {
    return isMenuAccessKeyEnabled(menuAccessKey);
  };

  const [variantFilters, setVariantFilters] = useState<VariantFiltersType>({});
  const [marketFilters, setMarketFilters] = useState<MarketFiltersType>({});
  const [currentView, setCurrentView] = useState<ViewType>("sunburst");
  const [chartType, setChartType] = useState<ChartType>("segments");
  const [portfolioMode, setPortfolioMode] = useState<PortfolioMode>("Device");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [cardsPerRow, setCardsPerRow] = useState(3);
  const [showModels, setShowModels] = useState(true);
  const [showCreateBundle, setShowCreateBundle] = useState(false);
  
  const {
    data: portfolioData,
    isLoading: portfolioLoading,
    error: portfolioError
  } = usePortfolioSunburst(companyId, variantFilters, marketFilters);
  
  const {
    data: phasesData,
    isLoading: phasesLoading,
    error: phasesError
  } = usePortfolioPhases(companyId);
  
  const {
    data: availableMarkets = []
  } = useAvailableMarkets(companyId);
  
  // Products data for different views
  const {
    products = [],
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useOptimizedCompanyProducts(companyId || '');

  // Bundles data
  const { data: bundles, isLoading: bundlesLoading } = useCompanyBundles(companyId);
  const [bundleSearchQuery, setBundleSearchQuery] = useState('');
  const [showFeasibilityOnly, setShowFeasibilityOnly] = useState(false);

  // Get current view config (must be after currentView state is declared)
  const currentViewConfig = portfolioViewConfig.find(v => v.id === currentView);

  // Handle URL view parameter (takes priority over user preferences)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlView = urlParams.get('view');

    if (urlView && urlView !== currentView) {
      setCurrentView(urlView as ViewType);
    } else if (!urlView && preferences.default_portfolio_view && preferences.default_portfolio_view !== "categorisation") {
      // Only use saved preference if there's no URL parameter
      setCurrentView(preferences.default_portfolio_view as ViewType);
    }
  }, [location.search, preferences.default_portfolio_view]);

  // Calculate active filters status
  const hasActiveFilters = Object.keys(variantFilters).some(key => variantFilters[key]?.length > 0) || Object.values(marketFilters).some(Boolean);
  
  // Get current chart data and states based on current view
  const isChartView = currentView === "sunburst" || currentView === "phases-chart";
  const currentChartData = currentView === "phases-chart" ? phasesData : portfolioData;
  const currentLoading = currentView === "phases-chart" ? phasesLoading : portfolioLoading;
  const currentError = currentView === "phases-chart" ? phasesError : portfolioError;

  
  const handleBack = () => {
    navigate(`/app/company/${encodeURIComponent(companyName!)}`);
  };

  const handleNavigateToClients = () => {
    navigate('/app/clients');
  };

  const handleNavigateToCompany = () => {
    navigate(`/app/company/${encodeURIComponent(companyName!)}`);
  };
  
  const handleDeviceDoubleClick = (productId: string, devicePath: string[]) => {
    // Navigate directly to product page using product ID
    if (productId) {
      navigate(`/app/product/${productId}`);
    }
  };
  
  const handleHighlightInHierarchy = (selectedPaths: string[][]) => {
    // Open bulk operations dialog and highlight selected devices
    setShowBulkOperations(true);
    
    if (hierarchicalManagementRef.current) {
      setTimeout(() => {
        hierarchicalManagementRef.current.setActiveTab('hierarchy');
        hierarchicalManagementRef.current.highlightDevices(selectedPaths);
      }, 100);
      toast.success(lang('devicePortfolio.devicesHighlighted', { count: selectedPaths.length }));
    }
  };

  // Helper function to transform phases data for horizontal bar
  const transformPhasesDataForHorizontalBar = (sunburstData: any) => {
    if (!sunburstData?.children) return [];
    
    return sunburstData.children.map((phaseNode: any, index: number) => {
      // Clean existing numbering and add sequential numbering
      const cleanPhaseName = phaseNode.name.replace(/^\(\d+\)\s*|^\d+\.\s*/, '').trim();
      const numberedPhaseName = `${index + 1}. ${cleanPhaseName}`;
      
      return {
        phase: numberedPhaseName,
        total: phaseNode.children?.reduce((sum: number, statusNode: any) => 
          sum + (statusNode.children?.length || 0), 0) || 0,
        products: phaseNode.children?.flatMap((statusNode: any) => 
          statusNode.children?.map((productNode: any) => ({
            id: productNode.productId || productNode.name,
            name: productNode.name,
            status: statusNode.name,
            progress: 0 // Progress not available in this data structure
          })) || []
        ) || []
      };
    });
  };

  // Helper function for product card background (needed by ProductGrid)
  const getProductCardBg = (status: string): string => {
    switch (status) {
      case "On Track":
        return "border-green-200 bg-green-50";
      case "At Risk":
        return "border-red-200 bg-red-50";
      case "Needs Attention":
        return "border-yellow-200 bg-yellow-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };
  
  if (!companyName) {
    return <div>{lang('devicePortfolio.companyNotFound')}</div>;
  }

  const breadcrumbs = buildCompanyBreadcrumbs(
    companyName!,
    lang('devicePortfolio.breadcrumb'),
    handleNavigateToClients,
    handleNavigateToCompany
  );

  return (
    <ProductPortfolioErrorBoundary onAddProduct={() => setShowAddProduct(true)}>
      <div className="space-y-6" data-tour="products">
        <ConsistentPageHeader
          breadcrumbs={breadcrumbs}
          title={`${companyName} ${portfolioMode === "Device" ? lang('devicePortfolio.title') : lang('devicePortfolio.platformTitle')}`}
          subtitle={portfolioMode === "Device" ? lang('devicePortfolio.subtitle') : lang('devicePortfolio.platformSubtitle')}
          actions={
            <div className="flex items-center gap-3">
              {/* Portfolio Mode Toggle */}
              <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={portfolioMode === "Device" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPortfolioMode("Device")}
                  className="rounded-md"
                >
                  <Package2 className="h-4 w-4 mr-2" />
                  {lang('devicePortfolio.deviceBtn')}
                </Button>
                <Button
                  variant={portfolioMode === "platforms" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPortfolioMode("platforms")}
                  className="rounded-md"
                >
                  <Columns className="h-4 w-4 mr-2" />
                  {lang('devicePortfolio.platformsBtn')}
                </Button>
              </div>
              
              <Button
                className="gap-2"
                onClick={() => portfolioMode === "Device" ? setShowAddProduct(true) : setShowAddPlatform(true)}
                data-tour="add-product"
              >
                <Plus className="h-4 w-4" />
                {portfolioMode === "Device" ? lang('devicePortfolio.addDevice') : lang('devicePortfolio.addPlatform')}
              </Button>
            </div>
          }
        />

        {/* Portfolio Controls */}
        <div className="px-2">
          <div className="flex items-center gap-3">
            <RecentlyViewedProductsDropdown />
            
            {/* Portfolio View Dropdown */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {currentViewConfig && <currentViewConfig.icon className="h-4 w-4" />}
                    {lang('devicePortfolio.portfolioView')}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-background z-50" onCloseAutoFocus={(e) => e.preventDefault()}>
                  {portfolioViewConfig.map((view) => {
                    const ViewIcon = view.icon;

                    if (isLoadingPlanAccess) {
                      return (
                        <div
                          key={view.id}
                          className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground/50"
                        >
                          <ViewIcon className="h-4 w-4 opacity-50" />
                          <span className="opacity-50">{lang(view.labelKey)}</span>
                        </div>
                      );
                    }

                    const enabled = isViewEnabled(view.menuAccessKey);

                    if (!enabled) {
                      return (
                        <div
                          key={view.id}
                          className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-not-allowed opacity-50"
                          title={planName
                            ? lang('devicePortfolio.notAvailableOnPlan', { planName })
                            : lang('devicePortfolio.upgradeToAccess')}
                        >
                          <ViewIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground flex-1">{lang(view.labelKey)}</span>
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        </div>
                      );
                    }

                    return (
                      <DropdownMenuItem
                        key={view.id}
                        onClick={() => handleViewChange(view.id as ViewType)}
                        className="gap-2"
                      >
                        <ViewIcon className="h-4 w-4" />
                        {lang(view.labelKey)}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            
            {currentView === "cards" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    {lang('devicePortfolio.perRow', { count: cardsPerRow })}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <DropdownMenuItem
                      key={num}
                      onClick={() => setCardsPerRow(num)}
                      className={cardsPerRow === num ? "bg-accent" : ""}
                    >
                      {num === 1 ? lang('devicePortfolio.cardPerRow') : lang('devicePortfolio.cardsPerRow', { count: num })}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowBulkOperations(true)}
            >
              <Settings className="h-4 w-4" />
              {lang('devicePortfolio.bulkOperations')}
            </Button>

            <Link to={`/app/company/${encodeURIComponent(companyName!)}/basic-udi-overview`}>
              <Button variant="outline" className="gap-2">
                <GitBranch className="h-4 w-4" />
                {lang('devicePortfolio.basicUdiDiGroups')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        {companyId && (
          <div className="px-2 space-y-6">
            {portfolioMode === "platforms" ? (
              /* Platform Management Views */
              <div className="space-y-6">
                <PlatformOverview companyId={companyId} />
                <PlatformManagementTable companyId={companyId} />
              </div>
            ) : currentView === "genesis" ? (
              /* Genesis View */
              <PortfolioGenesisView />
            ) : (
              /* Existing Product Views */
              <>
            {/* Chart Views */}
            {isChartView ? (
              <>
                <div className={`grid grid-cols-1 gap-8 ${currentView === "sunburst" ? "lg:grid-cols-5" : "lg:grid-cols-1"}`}>
                  {/* Portfolio Chart - Full width for phases, left side for segments */}
                  <div className={currentView === "sunburst" ? "lg:col-span-3" : "lg:col-span-1"}>
                  {currentLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-80" />
                      <Skeleton className="h-[520px] w-full" />
                    </div>
                  ) : currentError ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-auto">
                        <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">{lang('devicePortfolio.noDeviceYet')}</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          {lang('devicePortfolio.noDeviceDescription')}
                        </p>
                        <Button
                          className="gap-2"
                          onClick={() => setShowAddProduct(true)}
                        >
                          <Plus className="h-4 w-4" />
                          {lang('devicePortfolio.addFirstDevice')}
                        </Button>
                      </div>
                     </div>
                   ) : currentChartData ? (
                     <div className="space-y-4">
                         {currentView === "sunburst" ? (
                           <PortfolioSunburst
                             data={currentChartData}
                             title={lang('devicePortfolio.chartBreakdown', { filtered: hasActiveFilters ? ` ${lang('devicePortfolio.filtered')}` : '', total: computePortfolioTotal(currentChartData) })}
                             height={560}
                             onDeviceDoubleClick={handleDeviceDoubleClick}
                           />
                         ) : (
                           <DividedPhasesBar
                             data={transformPhasesDataForHorizontalBar(currentChartData)}
                             title={lang('devicePortfolio.chartByPhases', { total: computePortfolioTotal(currentChartData) })}
                             onProductClick={(productId) => navigate(`/app/product/${productId}`)}
                           />
                         )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[520px] bg-muted/20 rounded-lg">
                      <p className="text-muted-foreground">{lang('devicePortfolio.noDataAvailable')}</p>
                    </div>
                  )}
                </div>

                 {/* Variant Filters - Right Side (2 columns) - Only for Sunburst View */}
                 {currentView === "sunburst" && (
                   <div className="lg:col-span-2 space-y-4">
                     <VariantFilters 
                       filters={variantFilters} 
                       onFiltersChange={setVariantFilters} 
                       marketFilters={marketFilters} 
                       onMarketFiltersChange={setMarketFilters} 
                       availableMarkets={availableMarkets} 
                       className="sticky top-6" 
                       onHighlightInHierarchy={handleHighlightInHierarchy} 
                       portfolioData={portfolioData} 
                     />
                   </div>
              )}
              </div>

            </>
          ) : (
            /* Alternative Views */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {currentView === "cards" && lang('devicePortfolio.viewTitles.deviceCards')}
                    {currentView === "phases" && lang('devicePortfolio.viewTitles.phasesBoard')}
                    {currentView === "timeline" && lang('devicePortfolio.viewTitles.timelineView')}
                    {currentView === "list" && lang('devicePortfolio.viewTitles.productDataTable')}
                    {currentView === "relationships" && lang('devicePortfolio.viewTitles.siblingDeviceGroups')}
                    {currentView === "hierarchy-graph" && lang('devicePortfolio.viewTitles.hierarchyGraph')}
                    {currentView === "bundles" && lang('devicePortfolio.viewTitles.bundleProjects')}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentView === "cards" && lang('devicePortfolio.viewDescriptions.deviceCards')}
                    {currentView === "phases" && lang('devicePortfolio.viewDescriptions.phasesBoard')}
                    {currentView === "timeline" && lang('devicePortfolio.viewDescriptions.timelineView')}
                    {currentView === "list" && lang('devicePortfolio.viewDescriptions.productDataTable')}
                    {currentView === "relationships" && lang('devicePortfolio.viewDescriptions.siblingDeviceGroups')}
                    {currentView === "hierarchy-graph" && lang('devicePortfolio.viewDescriptions.hierarchyGraph')}
                    {currentView === "bundles" && lang('devicePortfolio.viewDescriptions.bundleProjects')}
                  </p>
                </div>
                {currentView === "cards" && (
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{lang('devicePortfolio.devices')}</span>
                    <Switch
                      checked={showModels}
                      onCheckedChange={setShowModels}
                    />
                  </div>
                )}
              </div>

              {productsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-80" />
                  <Skeleton className="h-[400px] w-full" />
                </div>
              ) : productsError ? (
                <div className="text-center py-12 space-y-4">
                  <p className="text-destructive font-medium">{lang('devicePortfolio.failedToLoadData')}</p>
                  <p className="text-sm text-muted-foreground">
                    {typeof productsError === 'string' ? productsError : lang('devicePortfolio.unknownError')}
                  </p>
                </div>
              ) : (
                <>
                  {currentView === "cards" && (
                    <ProductGrid 
                      products={products} 
                      getProductCardBg={getProductCardBg} 
                      cardsPerRow={cardsPerRow} 
                      showModels={showModels}
                      companyId={companyId}
                      companyName={companyName}
                    />
                  )}
                  {currentView === "phases" && companyId && (
                    <PhasesView 
                      companyId={companyId}
                    />
                  )}
                  {currentView === "timeline" && companyId && (
                    <TimelineView products={products} />
                  )}
                  {currentView === "list" && companyId && (
                    <ProductDataTable
                      products={products}
                      getProductCardBg={getProductCardBg}
                      refetch={refetchProducts}
                    />
                  )}
                  {currentView === "relationships" && companyId && (
                    <PortfolioSiblingGroupsManager companyId={companyId} />
                  )}
                  {currentView === "hierarchy-graph" && (
                    <HierarchyGraphView 
                      products={products}
                      onProductClick={(productId) => navigate(`/app/product/${productId}`)}
                    />
                  )}
                  {currentView === "bundles" && companyId && (
                    <>
                      <div className="flex justify-end mb-4">
                        <Button onClick={() => setShowCreateBundle(true)} className="gap-2">
                          <Plus className="h-4 w-4" />
                          {lang('devicePortfolio.createBundle')}
                        </Button>
                      </div>
                      <BundleGrid 
                        bundles={bundles || []}
                        cardsPerRow={cardsPerRow}
                        companyName={companyName}
                        searchQuery={bundleSearchQuery}
                        onSearchChange={setBundleSearchQuery}
                        showFeasibilityOnly={showFeasibilityOnly}
                        onFeasibilityToggle={setShowFeasibilityOnly}
                      />
                    </>
                  )}
                </>
              )}

            </div>
          )}

                {/* Portfolio View Widget Selector - Show at bottom if a view is selected */}
                <PortfolioViewWidget
                  currentView={currentView}
                  chartType={chartType}
                  onViewChange={handleViewChange}
                  onChartTypeChange={setChartType}
                  productCount={currentChartData ? computePortfolioTotal(currentChartData) : 0}
                />
                </>
              )}
            </div>
          )}

      {/* Add Product Dialog */}
      {companyId && (
        <AddProductDialog 
          open={showAddProduct} 
          onOpenChange={setShowAddProduct} 
          companyId={companyId} 
          onProductAdded={(productId) => {
            setShowAddProduct(false);
            toast.success('Product added successfully');
            navigate(`/app/product/${productId}/device-information`);
          }} 
        />
      )}

      {/* Add Platform Dialog */}
      {companyId && (
        <CreatePlatformDialog
          open={showAddPlatform}
          onOpenChange={setShowAddPlatform}
          companyId={companyId}
          onPlatformCreated={(platformId) => {
            setShowAddPlatform(false);
            toast.success('Platform created successfully');
          }}
        />
      )}

      {/* Create Bundle Dialog */}
      {companyId && (
        <CreateBundleDialog
          open={showCreateBundle}
          onOpenChange={setShowCreateBundle}
          companyId={companyId}
          existingBundleNames={bundles?.map(b => b.bundle_name) || []}
          onBundleCreated={(bundleId) => {
            setShowCreateBundle(false);
            toast.success('Bundle created successfully');
          }}
        />
      )}

      {/* Bulk Operations Dialog */}
      {companyId && (
        <Dialog open={showBulkOperations} onOpenChange={setShowBulkOperations}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>{lang('devicePortfolio.bulkOperations')}</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <HierarchicalBulkManagement ref={hierarchicalManagementRef} companyId={companyId!} />
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </ProductPortfolioErrorBoundary>
  );
}