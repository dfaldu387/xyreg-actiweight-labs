import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductPageHeader } from '@/components/product/layout/ProductPageHeader';
import { ProductNavigationTracker } from '@/components/product/ProductNavigationTracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvestorShareFlowWrapper } from "@/components/funnel/InvestorShareFlowWrapper";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Share2, Lock, Eye } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { useDeviceModuleAccess } from "@/hooks/useDeviceModuleAccess";
import { DEVICES_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { PlanUpgradeRequired } from "@/components/subscription/PlanUpgradeRequired";
import { RestrictedFeatureProvider } from "@/contexts/RestrictedFeatureContext";
import { RestrictedPreviewBanner } from "@/components/subscription/RestrictedPreviewBanner";
import { useProductDetails } from "@/hooks/useProductDetails";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SimpleTargetMarketsTab } from "@/components/product/business-case/SimpleTargetMarketsTab";
import { VentureBlueprint } from "@/components/product/business-case/VentureBlueprint";
import { XyRegGenesis } from "@/components/product/business-case/XyRegGenesis";
import { BusinessCanvas } from "@/components/product/business-case/BusinessCanvas";
// ViabilityScorecard removed - now integrated into VentureBlueprint
import { TeamProfileTab } from "@/components/product/business-case/TeamProfileTab";
import { MarketSizingForm } from "@/components/product/business-case/MarketSizingForm";
import { ReimbursementStrategyForm } from "@/components/product/business-case/ReimbursementStrategyForm";
import { HealthEconomicsForm } from "@/components/product/business-case/HealthEconomicsForm";
import { StrategicHorizonForm } from "@/components/product/business-case/StrategicHorizonForm";
import { IPStrategyForm } from "@/components/product/business-case/IPStrategyForm";

import { GTMStrategyForm } from "@/components/product/business-case/GTMStrategyForm";
import { UseOfProceedsForm } from "@/components/product/business-case/UseOfProceedsForm";

// import { ManufacturingForm } from "@/components/product/business-case/ManufacturingForm";
import { RNPVAnalysis } from "@/components/product/business/RNPVAnalysis";

// PitchBuilder moved to Genesis Home - no longer imported here
import { MarketLandscapeView } from "@/components/competitive/MarketLandscapeView";
import { ProductCompetitorDocumentsTab } from "@/components/competitive/ProductCompetitorDocumentsTab";
import { PricingStrategy } from "@/components/pricing/PricingStrategy";
import { ReimbursementHelpSidebar, ReimbursementHelpTrigger } from "@/components/product/reimbursement/ReimbursementHelpSidebar";
import { ReimbursementCodeTracker } from "@/components/product/reimbursement/ReimbursementCodeTracker";
import { Toaster } from "sonner";
import { ProductUpdateService } from "@/services/productUpdateService";
import { queryClient } from "@/lib/query-client";
import { EnhancedProductMarket } from "@/utils/enhancedMarketRiskClassMapping";
import { useProductMarketStatus } from "@/hooks/useProductMarketStatus";
import { HierarchicalMarketService } from "@/services/hierarchicalMarketService";
import { toast } from "sonner";
import { EmdnNavigationButton } from "@/components/competitive/EmdnNavigationButton";
import { useEmdnCodeDetails } from "@/hooks/useEmdnCodeDetails";
import { useEnhancedCompetitiveAnalysis } from "@/hooks/useFDACompetitiveAnalysis";
import { extractFDASearchParameters } from "@/utils/fdaSearchDisplay";
import { FDAProductCodeService } from "@/services/fdaProductCodeService";
import { useViabilityFunnelProgress } from "@/hooks/useViabilityFunnelProgress";
import { GenesisLaunchStepsSidebar } from '@/components/investor-share/GenesisLaunchStepsSidebar';

// Map tab values to readiness checklist keys for completion status
const TAB_COMPLETION_MAP: Record<string, string> = {
  'viability-scorecard': 'Viability scorecard',
  'venture-blueprint': 'Venture blueprint',
  'business-canvas': 'Business canvas',
  'team-profile': 'Team profile',
  'market-analysis': 'Market Sizing',
  'reimbursement': 'Reimbursement Strategy',
  'gtm-strategy': 'GTM Strategy',
  'use-of-proceeds': 'Use of Proceeds',
  // 'manufacturing': 'Manufacturing',
};
// investorRelevant marks tabs that appear in the investor share checklist
const TAB_CONFIG = [
  {
    value: 'venture-blueprint',
    label: 'Venture Blueprint',
    menuAccessKey: DEVICES_MENU_ACCESS.BUSINESS_CASE_VENTURE,
    description: 'Track your product\'s strategic planning progress with comprehensive phase-based activities and completion metrics.',
    investorRelevant: true,
  },
{
    value: 'business-canvas',
    label: 'Business Canvas',
    menuAccessKey: DEVICES_MENU_ACCESS.BUSINESS_CASE_CANVAS,
    description: 'Visualize and plan your product\'s business model with the Business Canvas framework.',
    investorRelevant: true,
  },
   {
    value: 'team-profile',
    label: 'Team',
    menuAccessKey: DEVICES_MENU_ACCESS.BUSINESS_CASE_TEAM,
    description: 'Manage and showcase your team members and their roles.',
    investorRelevant: true,
  },
  {
    value: 'market-analysis',
    label: 'Market Analysis',
    menuAccessKey: DEVICES_MENU_ACCESS.BUSINESS_CASE_COMPETITION,
    description: 'Analyze market sizing (TAM/SAM/SOM) and track competitors via manual entry, EUDAMED database, FDA clearances, and global registrations.',
    investorRelevant: true,
  },
  {
    value: 'gtm-strategy',
    label: 'GTM',
    menuAccessKey: DEVICES_MENU_ACCESS.BUSINESS_CASE_CANVAS,
    description: 'Go-to-market channels, territory priority, and sales cycle planning.',
    investorRelevant: true,
  },
  {
    value: 'use-of-proceeds',
    label: 'Use of Proceeds',
    menuAccessKey: DEVICES_MENU_ACCESS.BUSINESS_CASE_CANVAS,
    description: 'Allocation of raise across R&D, regulatory, team, commercial, and operations.',
    investorRelevant: true,
  },
  // {
  //   value: 'manufacturing',
  //   label: 'Manufacturing',
  //   menuAccessKey: DEVICES_MENU_ACCESS.BUSINESS_CASE_CANVAS,
  //   description: 'Manufacturing stage, strategy, and capacity planning.',
  //   investorRelevant: true,
  // },
  {
    value: 'rnpv',
    label: 'rNPV',
    menuAccessKey: DEVICES_MENU_ACCESS.BUSINESS_CASE_RNPV,
    description: 'Calculate risk-adjusted net present value to evaluate product investment potential.',
    investorRelevant: false,
  },
  {
    value: 'reimbursement',
    label: 'Reimbursement',
    menuAccessKey: DEVICES_MENU_ACCESS.BUSINESS_CASE_REIMBURSEMENT,
    description: 'Track reimbursement codes, coverage policies, and payer landscape for your target markets.',
    investorRelevant: true,
  },
  {
    value: 'pricing-strategy',
    label: 'Pricing',
    menuAccessKey: DEVICES_MENU_ACCESS.BUSINESS_CASE_PRICING,
    description: 'Define and manage pricing strategies across your target markets.',
    investorRelevant: false,
  },
  // Pitch Builder moved to Genesis Home
  {
    value: 'exit-strategy',
    label: 'Strategic Horizon',
    menuAccessKey: DEVICES_MENU_ACCESS.BUSINESS_CASE_CANVAS,
    description: 'Define your strategic path: M&A, Independent Growth, IPO, Licensing, or PE.',
    investorRelevant: true,
  },
  {
    value: 'ip-strategy',
    label: 'IP Strategy',
    menuAccessKey: DEVICES_MENU_ACCESS.BUSINESS_CASE_CANVAS,
    description: 'Map your IP protection strategy, ownership status, and FTO risk.',
    investorRelevant: true,
  },
];

export default function BusinessCasePage() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const { hasAccess: hasDeviceModuleAccess } = useDeviceModuleAccess(productId || null);

  // Get translated tab label
  const getTabLabel = (tabValue: string): string => {
    const labelMap: Record<string, string> = {
      'venture-blueprint': lang('businessCasePage.tabs.ventureBlueprint'),
      'business-canvas': lang('businessCasePage.tabs.businessCanvas'),
      'team-profile': lang('businessCasePage.tabs.team'),
      'market-analysis': lang('businessCasePage.tabs.marketAnalysis'),
      'gtm-strategy': lang('businessCasePage.tabs.gtm'),
      'use-of-proceeds': lang('businessCasePage.tabs.useOfProceeds'),
      // 'manufacturing': lang('businessCasePage.tabs.manufacturing'),
      'rnpv': lang('businessCasePage.tabs.rnpv'),
      'reimbursement': lang('businessCasePage.tabs.reimbursement'),
      'pricing-strategy': lang('businessCasePage.tabs.pricing'),
      'exit-strategy': lang('businessCasePage.tabs.strategicHorizon'),
      'ip-strategy': lang('businessCasePage.tabs.ipStrategy'),
      'pitch-builder': lang('businessCasePage.tabs.pitchBuilder'),
    };
    return labelMap[tabValue] || tabValue;
  };

  const { data: product, isLoading } = useProductDetails(productId);

  // Fetch company name for investor navigation
  const { data: companyData } = useQuery({
    queryKey: ['company', product?.company_id],
    queryFn: async () => {
      if (!product?.company_id) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('name')
        .eq('id', product.company_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!product?.company_id,
  });

  // Get viability funnel progress for tab completion status
  const { readinessChecklist, isLoading: isProgressLoading } = useViabilityFunnelProgress(productId || '', product?.company_id || '');

  // Get returnTo param for investor flow detection
  const returnTo = searchParams.get('returnTo');

  // Helper to check if a tab is complete based on readiness checklist
  const isTabComplete = (tabValue: string): boolean => {
    const checklistKey = TAB_COMPLETION_MAP[tabValue];
    if (!checklistKey) return true; // Tabs not in map are considered complete
    // Case-insensitive search for the checklist key in labels
    const item = readinessChecklist.find(r => 
      r.label.toLowerCase().includes(checklistKey.toLowerCase())
    );
    // Default to false (incomplete) so blue highlighting shows until confirmed complete
    return item?.complete ?? false;
  };

  // Only apply investor flow styling when data is loaded - also hide tabs on Genesis landing
  const activeTab = searchParams.get('tab') || 'venture-blueprint';
  const isGenesisTab = activeTab === 'genesis';
  const isGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint';
  const isInvestorFlow = (returnTo === 'investor-share' && !isProgressLoading) || isGenesisTab;

  // Auto-scroll to first checklist item when navigating from Genesis sidebar
  const genesisScrollTargets: Record<string, string> = {
    'reimbursement': 'genesis-target-codes',
    'ip-strategy': 'genesis-ip-assets',
    'exit-strategy': 'genesis-potential-acquirers',
  };
  useEffect(() => {
    if (isGenesisFlow && !isLoading) {
      const targetId = genesisScrollTargets[activeTab];
      if (!targetId) return;

      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isGenesisFlow, activeTab, isLoading]);

  // Local state for markets to provide immediate UI feedback
  const [localMarkets, setLocalMarkets] = useState<EnhancedProductMarket[]>([]);
  const [effectiveMarkets, setEffectiveMarkets] = useState<EnhancedProductMarket[]>([]);
  const [inheritanceInfo, setInheritanceInfo] = useState<{ source: 'individual' | 'model' | 'platform' | 'category' | 'company'; path: string[] } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(false);
  const [selectedEmdnCode, setSelectedEmdnCode] = useState<string>((product as any)?.emdn_code || '');
  const [fdaProductCodeDescription, setFdaProductCodeDescription] = useState<string>('');
  const [isReimbursementHelpOpen, setIsReimbursementHelpOpen] = useState(false);

  const { data: emdnDetails } = useEmdnCodeDetails(selectedEmdnCode);
  const { data: fdaAnalysis } = useEnhancedCompetitiveAnalysis(selectedEmdnCode);

  // Handle EMDN code change to save to database and invalidate caches
  const handleEmdnCodeChange = useCallback(async (newCode: string) => {
    if (!productId) return;

    // console.log('🔄 [BusinessCasePage] EMDN code changing from', selectedEmdnCode, 'to', newCode);
    setSelectedEmdnCode(newCode);

    try {
      // Update the database
      await ProductUpdateService.updateProductField(productId, 'emdn_code', newCode);

      // Invalidate all EMDN-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['emdn-code-details'] });
      queryClient.invalidateQueries({ queryKey: ['emdn-codes'] });
      queryClient.invalidateQueries({ queryKey: ['competitive-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['category-competitive-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['combined-competitive-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-competitive-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['fda-device-search'] });
      queryClient.invalidateQueries({ queryKey: ['fda-comprehensive-search'] });

      // Force a complete query cache refresh for all competitive analysis data
      queryClient.removeQueries({ queryKey: ['emdn-code-details'] });
      queryClient.removeQueries({ queryKey: ['competitive-analysis'] });
      queryClient.removeQueries({ queryKey: ['category-competitive-analysis'] });

      // Show success toast
      toast.success(`EMDN code updated to ${newCode}`);

      // console.log('✅ [BusinessCasePage] EMDN code successfully updated and caches invalidated');
    } catch (error) {
      console.error('❌ [BusinessCasePage] Error updating EMDN code:', error);
      toast.error('Failed to update EMDN code');
      // Revert local state on error
      setSelectedEmdnCode((product as any)?.emdn_code || '');
    }
  }, [productId, selectedEmdnCode, product]);

  // Update selectedEmdnCode when product data changes
  useEffect(() => {
    if (product && (product as any)?.emdn_code && (product as any)?.emdn_code !== selectedEmdnCode) {
      // console.log('🔄 [BusinessCasePage] Product EMDN code changed, updating selectedEmdnCode:', (product as any)?.emdn_code);
      setSelectedEmdnCode((product as any)?.emdn_code);
    }
  }, [product]);

  // Fetch FDA product code description when product changes
  useEffect(() => {
    const fetchFdaDescription = async () => {
      const fdaCode = (product as any)?.fda_product_code;
      if (fdaCode) {
        try {
          const productCodeInfo = await FDAProductCodeService.getProductCodeInfo(fdaCode);
          if (productCodeInfo) {
            setFdaProductCodeDescription(`${productCodeInfo.code} - ${productCodeInfo.description}`);
          } else {
            setFdaProductCodeDescription(fdaCode);
          }
        } catch (error) {
          console.error('Error fetching FDA device code description:', error);
          setFdaProductCodeDescription(fdaCode);
        }
      } else {
        setFdaProductCodeDescription('No FDA device code selected');
      }
    };

    fetchFdaDescription();
  }, [product]);

  // Load effective markets using hierarchical inheritance
  useEffect(() => {
    const loadEffectiveMarkets = async () => {
      if (!productId) return;

      try {
        setIsLoadingMarkets(true);
        // console.log('[BusinessCasePage] Loading effective markets for product:', productId);

        const marketChain = await HierarchicalMarketService.resolveEffectiveMarkets(productId);
        // console.log('[BusinessCasePage] Market inheritance chain:', marketChain);

        setEffectiveMarkets(marketChain.effectiveMarkets);
        setLocalMarkets(marketChain.effectiveMarkets);
        setInheritanceInfo({
          source: marketChain.inheritanceSource,
          path: marketChain.inheritancePath
        });
      } catch (error) {
        console.error('[BusinessCasePage] Failed to load effective markets:', error);
        // Fallback to product markets if hierarchical resolution fails
        if (product?.markets) {
          setLocalMarkets(product.markets);
          setEffectiveMarkets(product.markets);
        }
      } finally {
        setIsLoadingMarkets(false);
      }
    };

    loadEffectiveMarkets();
  }, [productId, product?.markets]);

  // Update local state when effective markets change
  useEffect(() => {
    if (effectiveMarkets.length > 0) {
      setLocalMarkets(effectiveMarkets);
    } else if (product?.markets) {
      setLocalMarkets(product.markets);
    }
  }, [effectiveMarkets, product?.markets]);

  // Calculate market status for badges
  const marketStatus = useProductMarketStatus(localMarkets);

  // Plan-based menu access
  const { isMenuAccessKeyEnabled, planName, isLoading: isLoadingPlanAccess, menuAccess } = usePlanMenuAccess();

  // Check if a tab is enabled based on plan's menu_access
  const isTabEnabled = (menuAccessKey: string): boolean => {
    // For Market Analysis tab (competitors), check if either manual or auto-data is enabled
    if (menuAccessKey === DEVICES_MENU_ACCESS.BUSINESS_CASE_COMPETITION) {
      const manualKey = `${menuAccessKey}.manual`;
      const autoDataKey = `${menuAccessKey}.auto-data`;
      const manualEnabled = menuAccess?.[manualKey] === true;
      const autoDataEnabled = menuAccess?.[autoDataKey] === true;
      // Feature is enabled if either manual or auto-data is enabled
      if (manualEnabled || autoDataEnabled) {
        return true;
      }
      // If both are explicitly disabled, the feature is disabled
      // Check if keys exist in menuAccess (even if false)
      if (menuAccess && (manualKey in menuAccess || autoDataKey in menuAccess)) {
        // Keys exist, so if both are false/disabled, feature is disabled
        return false;
      }
      // Fallback to legacy check
      return isMenuAccessKeyEnabled(menuAccessKey);
    }
    return isMenuAccessKeyEnabled(menuAccessKey);
  };

  // Helper to get tab config by value
  const getTabConfig = (tabValue: string) => TAB_CONFIG.find(t => t.value === tabValue);

  // Render tab content - shows upgrade component if tab is disabled
  // For viability-scorecard, shows preview mode instead of upgrade component
  const renderTabContent = (tabValue: string, content: React.ReactNode) => {
    const tabConfig = getTabConfig(tabValue);
    if (!tabConfig) return content;

    // Show loading state while checking plan access
    if (isLoadingPlanAccess) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">{lang('businessCasePage.loading')}</p>
          </div>
        </div>
      );
    }

    const enabled = isTabEnabled(tabConfig.menuAccessKey);

    // For viability-scorecard, show preview mode instead of upgrade component
    if (!enabled && tabValue === 'viability-scorecard') {
      return content; // Will be wrapped with RestrictedFeatureProvider in TabsContent
    }

    if (!enabled) {
      return (
        <PlanUpgradeRequired
          featureName={tabConfig.label}
          planName={planName}
          featureDescription={tabConfig.description}
        />
      );
    }

    return content;
  };

  // Update selected EMDN code when product changes
  useEffect(() => {
    if ((product as any)?.emdn_code && !selectedEmdnCode) {
      // console.log('🔄 [BusinessCasePage] Setting selectedEmdnCode from product data:', (product as any).emdn_code);
      setSelectedEmdnCode((product as any).emdn_code);
    }
  }, [product, selectedEmdnCode]);

  // Map URL tab parameter to internal tab value
  const tabFromUrl = searchParams.get('tab') || 'venture-blueprint';
  // Handle legacy tab values for backwards compatibility
  const currentTab = tabFromUrl === 'market-sizing' || tabFromUrl === 'competition' || tabFromUrl === 'competitors' 
    ? 'market-analysis' 
    : tabFromUrl;

  // Sub-tab state for Market Analysis - sync with URL subTab/subtab parameter (support both casings)
  const subTabFromUrl = searchParams.get('subTab') || searchParams.get('subtab');
  const [marketAnalysisSubTab, setMarketAnalysisSubTab] = useState<'sizing' | 'competition'>(
    subTabFromUrl === 'competition' ? 'competition' : 'sizing'
  );

  // Sub-tab state for Reimbursement - sync with URL subtab parameter
  const [reimbursementSubTab, setReimbursementSubTab] = useState<'strategy' | 'heor'>(
    subTabFromUrl === 'heor' ? 'heor' : 'strategy'
  );

  // Sync sub-tab with URL when it changes
  useEffect(() => {
    if (subTabFromUrl === 'competition') {
      setMarketAnalysisSubTab('competition');
    } else if (subTabFromUrl === 'sizing') {
      setMarketAnalysisSubTab('sizing');
    } else if (currentTab === 'market-analysis' && !subTabFromUrl) {
      setMarketAnalysisSubTab('sizing');
    }
    // Handle reimbursement subtabs
    if (subTabFromUrl === 'heor') {
      setReimbursementSubTab('heor');
    } else if (currentTab === 'reimbursement') {
      setReimbursementSubTab('strategy');
    }
  }, [subTabFromUrl, currentTab]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleMarketAnalysisSubTabChange = (value: string) => {
    const subTabValue = value as 'sizing' | 'competition';
    setMarketAnalysisSubTab(subTabValue);
    // Update URL with subTab parameter for help sidebar context
    setSearchParams({ tab: 'market-analysis', subTab: subTabValue === 'competition' ? 'competition' : 'sizing' });
  };

  const handleReimbursementSubTabChange = (value: string) => {
    const subTabValue = value as 'strategy' | 'heor';
    setReimbursementSubTab(subTabValue);
    setSearchParams({ tab: 'reimbursement', subtab: subTabValue });
  };

  // Handle market changes with immediate UI feedback and debounced persistence
  const handleMarketsChange = useCallback(async (updatedMarkets: EnhancedProductMarket[]) => {
    if (!productId || !product?.company_id) return;

    // Update local state immediately for UI feedback
    setLocalMarkets(updatedMarkets);
    setIsSaving(true);

    try {
      // Debug logging
      // console.log('[BusinessCasePage] Saving markets for product:', productId);
      // console.log('[BusinessCasePage] Markets data being saved:', JSON.stringify(updatedMarkets, null, 2));

      // Persist to database
      await ProductUpdateService.updateProductField(
        productId,
        'markets',
        updatedMarkets,
        product.company_id
      );

      // console.log('[BusinessCasePage] Markets saved successfully');
      toast.success('Target markets updated successfully');
    } catch (error) {
      console.error('Failed to update markets:', error);
      toast.error('Failed to update target markets');

      // Revert local state on error
      if (product?.markets) {
        setLocalMarkets(product.markets);
      }
    } finally {
      setIsSaving(false);
    }
  }, [productId, product?.company_id, product?.markets]);

  // Auto-save EU market selection for EUDAMED products with empty markets
  useEffect(() => {
    const hasEudamedData =
      !!(product as any)?.eudamed_registration_number ||
      !!(product as any)?.eudamed_basic_udi_di_code ||
      !!(product as any)?.eudamed_device_name ||
      !!(product as any)?.eudamed_organization ||
      !!(product as any)?.eudamed_id_srn;

    // Auto-save EU market selection for EUDAMED products with empty markets
    if (hasEudamedData && localMarkets.length === 0 && !isSaving && !isLoadingMarkets && productId) {
      const marketDataList = [
        { code: 'EU', name: 'European Union', selected: true, marketLaunchStatus: 'launched' as const, regulatoryStatus: 'CE_MARKED', actualLaunchDate: new Date().toISOString() },
        { code: 'US', name: 'United States', selected: false },
        { code: 'CA', name: 'Canada', selected: false },
        { code: 'AU', name: 'Australia', selected: false },
        { code: 'JP', name: 'Japan', selected: false },
        { code: 'BR', name: 'Brazil', selected: false },
        { code: 'CN', name: 'China', selected: false },
        { code: 'IN', name: 'India', selected: false },
        { code: 'UK', name: 'United Kingdom', selected: false },
        { code: 'CH', name: 'Switzerland', selected: false },
        { code: 'KR', name: 'South Korea', selected: false }
      ] as EnhancedProductMarket[];

      handleMarketsChange(marketDataList);
    }
  }, [product, localMarkets, isSaving, isLoadingMarkets, productId, handleMarketsChange]);

  // Helper function to get translated subsection title
  const getSubsectionTitle = (): string => {
    const subsectionMap: Record<string, string> = {
      'venture-blueprint': lang('businessCasePage.subsections.ventureBlueprint'),
      'genesis': lang('businessCasePage.subsections.xyregGenesis'),
      'business-canvas': lang('businessCasePage.subsections.businessCanvas'),
      'team-profile': lang('businessCasePage.subsections.teamProfile'),
      'competitors': lang('businessCasePage.subsections.competitors'),
      'rnpv': lang('businessCasePage.subsections.rnpvAnalysis'),
      'reimbursement': lang('businessCasePage.subsections.reimbursement'),
      'pricing-strategy': lang('businessCasePage.subsections.pricingStrategy'),
      'gtm-strategy': lang('businessCasePage.subsections.gtmStrategy'),
      'use-of-proceeds': lang('businessCasePage.subsections.useOfProceeds'),
      // 'manufacturing': lang('businessCasePage.subsections.manufacturing'),
      'pitch-builder': lang('businessCasePage.subsections.pitchBuilder'),
      'exit-strategy': lang('businessCasePage.subsections.strategicHorizon'),
      'ip-strategy': lang('businessCasePage.subsections.ipStrategy'),
    };
    return subsectionMap[currentTab] || lang('businessCasePage.subsections.businessCase');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">{lang('businessCasePage.loadingBusinessCase')}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">{lang('businessCasePage.deviceNotFound')}</h2>
          <p className="text-muted-foreground">{lang('businessCasePage.deviceNotFoundDescription')}</p>
        </div>
      </div>
    );
  }

  // Using ProductPageHeader for consistent title and breadcrumbs

  return (
    <>
      <ProductNavigationTracker />
      <InvestorShareFlowWrapper productId={productId!}>
        <div className="flex h-full min-h-0 flex-col">
          <ProductPageHeader
            product={product}
            subsection={getSubsectionTitle()}
            marketStatus={marketStatus}
          />

          {/* Share with Investors Shortcut - Show on strategic planning tabs (hide when return banner is present) */}
          {['venture-blueprint', 'business-canvas', 'team-profile', 'reimbursement', 'gtm-strategy', 'use-of-proceeds', 'manufacturing'].includes(currentTab) &&
            searchParams.get('returnTo') !== 'investor-share' && !isGenesisFlow && (
              <div className="px-2 sm:px-4 lg:px-6 xl:px-8 py-2 border-b bg-muted/20">
                <div className="flex justify-end pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/app/product/${productId}/investor-share`)}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    {lang('businessCasePage.shareWithInvestors')}
                  </Button>
                </div>
              </div>
            )}

          {/* Genesis Sidebar - fixed position, rendered when genesis tab is active */}
          {currentTab === 'genesis' && productId && !isProgressLoading && readinessChecklist.length > 0 && (
            <GenesisLaunchStepsSidebar
              productId={productId}
              readinessChecklist={readinessChecklist}
              overallProgress={Math.round((readinessChecklist.filter(r => r.complete).length / readinessChecklist.length) * 100)}
            />
          )}
          <div className={`flex-1 overflow-y-auto ${currentTab === 'genesis' && productId && !isProgressLoading && readinessChecklist.length > 0 ? 'mr-[280px] lg:mr-[300px] xl:mr-[320px]' : ''}`}>
            <div className="w-full py-6 max-w-none">
              <div className="w-full space-y-6">
                <TooltipProvider>
                  <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                    {/* Hide tabs in investor flow - checklist provides navigation */}
                    {!isInvestorFlow && (
                      <div className="overflow-x-auto w-full bg-muted rounded-md">
                      <TabsList className="inline-flex w-full justify-between gap-2 p-1 bg-transparent">
                        {TAB_CONFIG.map((tab) => {
                          const tabComplete = isTabComplete(tab.value);
                          // Show indicator for incomplete investor-relevant tabs in investor flow
                          const showInvestorIndicator = isInvestorFlow && tab.investorRelevant && !tabComplete;

                          // Check device module access for this sub-tab
                          const deviceModuleTabMap: Record<string, string> = {
                            'venture-blueprint': 'business-case.venture-blueprint',
                            'business-canvas': 'business-case.business-canvas',
                            'team-profile': 'business-case.team-profile',
                            'market-analysis': 'business-case.market-analysis',
                            'gtm-strategy': 'business-case.gtm-strategy',
                            'use-of-proceeds': 'business-case.use-of-proceeds',
                            'rnpv': 'business-case.rnpv',
                            'reimbursement': 'business-case.reimbursement',
                            'pricing-strategy': 'business-case.pricing',
                            'exit-strategy': 'business-case.exit-strategy',
                            'ip-strategy': 'business-case.ip-strategy',
                          };
                          const devicePermId = deviceModuleTabMap[tab.value];
                          const hasDeviceAccess = !devicePermId || hasDeviceModuleAccess(devicePermId);

                          // While loading plan access, show tabs in a neutral/loading state
                          if (isLoadingPlanAccess) {
                            return (
                              <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                disabled
                              >
                                <span className="truncate opacity-50">{tab.label}</span>
                              </TabsTrigger>
                            );
                          }

                          const enabled = isTabEnabled(tab.menuAccessKey);

                          return (
                            <TabsTrigger
                              key={tab.value}
                              value={tab.value}
                              disabled={!hasDeviceAccess}
                              className={`${showInvestorIndicator ? "!text-indigo-600 data-[state=active]:!text-indigo-600 font-medium" : ""} ${!hasDeviceAccess ? "opacity-40 cursor-not-allowed" : ""}`}
                            >
                              {showInvestorIndicator && <Eye className="h-4 w-4 mr-1.5 flex-shrink-0 text-indigo-600" />}
                              {!hasDeviceAccess && <Lock className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-muted-foreground" />}
                              {!enabled && hasDeviceAccess && !showInvestorIndicator && <Lock className="h-4 w-4 mr-1.5 flex-shrink-0" />}
                              {getTabLabel(tab.value)}
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>
                      </div>
                    )}

                    {/* Viability Scorecard tab removed - now integrated into Venture Blueprint */}

                    <TabsContent value="venture-blueprint" className="space-y-6">
                      {(() => {
                        const tabConfig = getTabConfig('venture-blueprint');
                        if (!tabConfig) return <VentureBlueprint />;

                        // Show loading state while checking plan access
                        if (isLoadingPlanAccess) {
                          return (
                            <div className="flex items-center justify-center min-h-[400px]">
                              <div className="text-center space-y-4">
                                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
                                <p className="text-sm text-muted-foreground">{lang('businessCasePage.loading')}</p>
                              </div>
                            </div>
                          );
                        }

                        const isFeatureEnabled = isTabEnabled(tabConfig.menuAccessKey);
                        const isRestricted = !isFeatureEnabled;

                        return (
                          <RestrictedFeatureProvider
                            isRestricted={isRestricted}
                            planName={planName}
                            featureName="Venture Blueprint"
                          >
                            {isRestricted && <RestrictedPreviewBanner className="mt-4 !mb-0" />}
                            <VentureBlueprint disabled={isRestricted} />
                          </RestrictedFeatureProvider>
                        );
                      })()}
                    </TabsContent>

                     <TabsContent value="business-canvas" className="space-y-6">
                       {(() => {
                         const tabConfig = getTabConfig('business-canvas');
                         if (!tabConfig) return <BusinessCanvas productId={productId!} isInGenesisFlow={isGenesisFlow} />;

                         // Show loading state while checking plan access
                         if (isLoadingPlanAccess) {
                           return (
                             <div className="flex items-center justify-center min-h-[400px]">
                               <div className="text-center space-y-4">
                                 <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
                                 <p className="text-sm text-muted-foreground">{lang('businessCasePage.loading')}</p>
                               </div>
                             </div>
                           );
                         }

                         const isFeatureEnabled = isTabEnabled(tabConfig.menuAccessKey);
                         const isRestricted = !isFeatureEnabled;

                         return (
                           <RestrictedFeatureProvider
                             isRestricted={isRestricted}
                             planName={planName}
                             featureName="Business Canvas"
                           >
                             {isRestricted && <RestrictedPreviewBanner className="mt-4 !mb-0" />}
                             <BusinessCanvas productId={productId!} disabled={isRestricted} isInGenesisFlow={isGenesisFlow} />
                           </RestrictedFeatureProvider>
                         );
                       })()}
                     </TabsContent>

                    <TabsContent value="team-profile" className="space-y-6">
                      {(() => {
                        const tabConfig = getTabConfig('team-profile');
                        if (!tabConfig) return <TeamProfileTab />;

                        // Show loading state while checking plan access
                        if (isLoadingPlanAccess) {
                          return (
                            <div className="flex items-center justify-center min-h-[400px]">
                              <div className="text-center space-y-4">
                                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
                                <p className="text-sm text-muted-foreground">{lang('businessCasePage.loading')}</p>
                              </div>
                            </div>
                          );
                        }

                        const isFeatureEnabled = isTabEnabled(tabConfig.menuAccessKey);
                        const isRestricted = !isFeatureEnabled;

                        return (
                          <RestrictedFeatureProvider
                            isRestricted={isRestricted}
                            planName={planName}
                            featureName="Team Profile"
                          >
                            {isRestricted && <RestrictedPreviewBanner className="mt-4 !mb-0" />}
                            <TeamProfileTab disabled={isRestricted} />
                          </RestrictedFeatureProvider>
                        );
                      })()}
                    </TabsContent>

                    <TabsContent value="genesis" className="space-y-6">
                      <div className="flex gap-6">
                        <div className="flex-1 min-w-0">
                          <XyRegGenesis />
                        </div>
                        {productId && !isProgressLoading && readinessChecklist.length > 0 && (
                          <GenesisLaunchStepsSidebar
                            productId={productId}
                            readinessChecklist={readinessChecklist}
                            overallProgress={Math.round((readinessChecklist.filter(r => r.complete).length / readinessChecklist.length) * 100)}
                          />
                        )}
                      </div>
                    </TabsContent>

                    {/* Pitch Builder tab removed - now in Genesis Home */}


                     <TabsContent value="market-analysis" className="space-y-6">
                       {(() => {
                         const tabConfig = getTabConfig('market-analysis');
                         
                         // Show loading state while checking plan access
                         if (isLoadingPlanAccess) {
                           return (
                             <div className="flex items-center justify-center min-h-[400px]">
                               <div className="text-center space-y-4">
                                 <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
                                 <p className="text-sm text-muted-foreground">{lang('businessCasePage.loading')}</p>
                               </div>
                             </div>
                           );
                         }

                        // Check for separate manual and auto-data keys
                        const manualKey = `${tabConfig?.menuAccessKey}.manual`;
                        const autoDataKey = `${tabConfig?.menuAccessKey}.auto-data`;
                        const manualEnabled = menuAccess?.[manualKey] === true;
                        const autoDataEnabled = menuAccess?.[autoDataKey] === true;
                        
                        // Check if keys exist in menuAccess (even if false) - indicates new format
                        const hasNewFormat = menuAccess && (manualKey in menuAccess || autoDataKey in menuAccess);
                        
                        // Get access mode: 'manual', 'auto-data', 'full' (both enabled), or false
                        const accessMode: 'full' | 'manual' | 'auto-data' | false = (() => {
                          if (hasNewFormat) {
                            if (manualEnabled && autoDataEnabled) {
                              return 'full';
                            } else if (manualEnabled) {
                              return 'manual';
                            } else if (autoDataEnabled) {
                              return 'auto-data';
                            } else {
                              return false;
                            }
                          }
                          const menuAccessValue = menuAccess?.[tabConfig?.menuAccessKey || ''];
                          if (typeof menuAccessValue === 'string') {
                            if (menuAccessValue === 'manual' || menuAccessValue === 'auto-data') {
                              return menuAccessValue;
                            }
                            return 'full';
                          }
                          return menuAccessValue === true ? 'full' : false;
                        })();
                        
                        const isFeatureEnabled = hasNewFormat 
                          ? (manualEnabled || autoDataEnabled)
                          : isTabEnabled(tabConfig?.menuAccessKey || '');
                        
                        const isRestricted = !isFeatureEnabled;

                         return (
                           <RestrictedFeatureProvider
                             isRestricted={isRestricted}
                             planName={planName}
                             featureName="Market Analysis"
                           >
                             {isRestricted && <RestrictedPreviewBanner className="mt-4 !mb-0" />}
                             
                             {/* Sub-tabs for Market Analysis */}
                             <Tabs value={marketAnalysisSubTab} onValueChange={handleMarketAnalysisSubTabChange}>
                               <TabsList className="mb-4">
                                 <TabsTrigger value="sizing" className={`gap-1.5 ${isInvestorFlow ? '!text-indigo-600' : ''}`}>
                                   {isInvestorFlow && <Eye className="h-3.5 w-3.5" />}
                                   {lang('businessCasePage.subTabs.marketSizing')}
                                 </TabsTrigger>
                                 <TabsTrigger value="competition">{lang('businessCasePage.subTabs.competition')}</TabsTrigger>
                               </TabsList>
                               
                               <TabsContent value="sizing" className="mt-0">
                                 <MarketSizingForm productId={productId!} companyId={product.company_id} disabled={isRestricted} />
                               </TabsContent>
                               
                               <TabsContent value="competition" className="mt-0">
                                 <ProductCompetitorDocumentsTab
                                   productId={productId!}
                                   emdnCode={selectedEmdnCode}
                                   fdaProductCode={(product as any)?.fda_product_code}
                                   product={product}
                                   onEmdnCodeChange={handleEmdnCodeChange}
                                   disabled={isRestricted}
                                   accessMode={accessMode}
                                 />
                               </TabsContent>
                             </Tabs>
                           </RestrictedFeatureProvider>
                         );
                       })()}
                     </TabsContent>


                    <TabsContent value="gtm-strategy" className="space-y-6">
                      <GTMStrategyForm productId={productId!} companyId={product.company_id} />
                    </TabsContent>

                    <TabsContent value="use-of-proceeds" className="space-y-6">
                      <UseOfProceedsForm productId={productId!} companyId={product.company_id} />
                    </TabsContent>

                    {/* <TabsContent value="manufacturing" className="space-y-6">
                      <ManufacturingForm productId={productId!} companyId={product.company_id} />
                    </TabsContent> */}

                    <TabsContent value="rnpv" className="space-y-6">
                      {(() => {
                        const tabConfig = getTabConfig('rnpv');
                        if (!tabConfig) return <RNPVAnalysis markets={localMarkets} productId={productId} />;

                        // Show loading state while checking plan access
                        if (isLoadingPlanAccess) {
                          return (
                            <div className="flex items-center justify-center min-h-[400px]">
                              <div className="text-center space-y-4">
                                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
                                <p className="text-sm text-muted-foreground">{lang('businessCasePage.loading')}</p>
                              </div>
                            </div>
                          );
                        }

                        const isFeatureEnabled = isTabEnabled(tabConfig.menuAccessKey);
                        const isRestricted = !isFeatureEnabled;

                        return (
                          <RestrictedFeatureProvider
                            isRestricted={isRestricted}
                            planName={planName}
                            featureName="rNPV Analysis"
                          >
                            {isRestricted && <RestrictedPreviewBanner className="mt-4 !mb-0" />}
                            <RNPVAnalysis markets={localMarkets} productId={productId} disabled={isRestricted} />
                          </RestrictedFeatureProvider>
                        );
                      })()}
                    </TabsContent>

                    <TabsContent value="reimbursement" className="space-y-6">
                      {(() => {
                        const tabConfig = getTabConfig('reimbursement');
                        if (!tabConfig) return (
                            <div className="space-y-6">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h2 className="text-xl font-semibold">{lang('businessCasePage.reimbursementStrategy')}</h2>
                                  <ReimbursementHelpTrigger
                                    onClick={() => setIsReimbursementHelpOpen(true)}
                                  />
                                </div>
                                <p className="text-sm text-muted-foreground">{lang('businessCasePage.reimbursementDescription')}</p>
                              </div>
                            <ReimbursementCodeTracker
                              productId={productId!}
                              companyId={product.company_id}
                              targetMarkets={localMarkets.filter(m => m.selected).map(m => m.code)}
                            />
                          </div>
                        );

                        // Show loading state while checking plan access
                        if (isLoadingPlanAccess) {
                          return (
                            <div className="flex items-center justify-center min-h-[400px]">
                              <div className="text-center space-y-4">
                                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
                                <p className="text-sm text-muted-foreground">{lang('businessCasePage.loading')}</p>
                              </div>
                            </div>
                          );
                        }

                        const isFeatureEnabled = isTabEnabled(tabConfig.menuAccessKey);
                        const isRestricted = !isFeatureEnabled;

                        return (
                          <RestrictedFeatureProvider
                            isRestricted={isRestricted}
                            planName={planName}
                            featureName="Reimbursement"
                          >
                            {isRestricted && <RestrictedPreviewBanner className="mt-4 !mb-0" />}
                            
                            {/* Sub-tabs for Reimbursement */}
                            <Tabs value={reimbursementSubTab} onValueChange={handleReimbursementSubTabChange}>
                              <TabsList className="mb-4">
                                <TabsTrigger value="strategy" className={`gap-1.5 ${isInvestorFlow ? '!text-indigo-600' : ''}`}>
                                  {isInvestorFlow && <Eye className="h-3.5 w-3.5" />}
                                  Strategy & Codes
                                </TabsTrigger>
                                <TabsTrigger value="heor" className={`gap-1.5 ${isInvestorFlow && reimbursementSubTab === 'heor' ? '!text-indigo-600' : ''}`}>
                                  {isInvestorFlow && reimbursementSubTab === 'heor' && <Eye className="h-3.5 w-3.5" />}
                                  Health Economics (HEOR)
                                </TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="strategy" className="mt-0">
                                <div className="space-y-6">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h2 className="text-xl font-semibold">{lang('businessCasePage.reimbursementStrategy')}</h2>
                                      <ReimbursementHelpTrigger
                                        onClick={() => setIsReimbursementHelpOpen(true)}
                                        disabled={isRestricted}
                                      />
                                    </div>
                                    <p className="text-sm text-muted-foreground">{lang('businessCasePage.reimbursementDescription')}</p>
                                  </div>
                                  <ReimbursementStrategyForm productId={productId!} companyId={product.company_id} />
                                  <ReimbursementCodeTracker
                                    productId={productId!}
                                    companyId={product.company_id}
                                    targetMarkets={localMarkets.filter(m => m.selected).map(m => m.code)}
                                    disabled={isRestricted}
                                  />
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="heor" className="mt-0">
                                <HealthEconomicsForm productId={productId!} companyId={product.company_id} disabled={isRestricted} />
                              </TabsContent>
                            </Tabs>
                          </RestrictedFeatureProvider>
                        );
                      })()}
                    </TabsContent>

                    <TabsContent value="pricing-strategy" className="space-y-6">
                      {(() => {
                        const tabConfig = getTabConfig('pricing-strategy');
                        if (!tabConfig) return (
                          <PricingStrategy
                            productId={productId}
                            companyId={product.company_id}
                          />
                        );

                        // Show loading state while checking plan access
                        if (isLoadingPlanAccess) {
                          return (
                            <div className="flex items-center justify-center min-h-[400px]">
                              <div className="text-center space-y-4">
                                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
                                <p className="text-sm text-muted-foreground">{lang('businessCasePage.loading')}</p>
                              </div>
                            </div>
                          );
                        }

                        const isFeatureEnabled = isTabEnabled(tabConfig.menuAccessKey);
                        const isRestricted = !isFeatureEnabled;

                        return (
                          <RestrictedFeatureProvider
                            isRestricted={isRestricted}
                            planName={planName}
                            featureName="Pricing Strategy"
                          >
                            {isRestricted && <RestrictedPreviewBanner className="mt-4 !mb-0" />}
                            <PricingStrategy
                              productId={productId}
                              companyId={product.company_id}
                              disabled={isRestricted}
                            />
                          </RestrictedFeatureProvider>
                        );
                      })()}
                    </TabsContent>

                    <TabsContent value="exit-strategy" className="space-y-6">
                      <StrategicHorizonForm productId={productId!} />
                    </TabsContent>

                    <TabsContent value="ip-strategy" className="space-y-6">
                      <IPStrategyForm />
                    </TabsContent>
                  </Tabs>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      </InvestorShareFlowWrapper>
      <Toaster position="top-center" />
      <ReimbursementHelpSidebar
        open={isReimbursementHelpOpen}
        onOpenChange={setIsReimbursementHelpOpen}
        targetMarkets={localMarkets.filter(m => m.selected).map(m => m.code)}
      />
    </>
  );
}