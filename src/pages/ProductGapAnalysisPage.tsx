
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useProductDetails } from "@/hooks/useProductDetails";
import { useCompanyProducts } from "@/hooks/useCompanyProducts";
import { ProductPageHeader } from "@/components/product/layout/ProductPageHeader";
import { useProductMarketStatus } from "@/hooks/useProductMarketStatus";
import { queryClient } from "@/lib/query-client";
import { toast } from "sonner";
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { DEVICES_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { RestrictedFeatureProvider } from "@/contexts/RestrictedFeatureContext";
import { RestrictedPreviewBanner } from "@/components/subscription/RestrictedPreviewBanner";
import { useTranslation } from "@/hooks/useTranslation";
import { useEnabledGapFrameworks } from "@/hooks/useEnabledGapFrameworks";
import { useStandardVersionStatus } from "@/hooks/useStandardVersionStatus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericGapLaunchView } from "@/components/company/gap-analysis/GenericGapLaunchView";
import { GenericGapSidebar } from "@/components/company/gap-analysis/GenericGapSidebar";
import { GapAnnexIILaunchView } from "@/components/product/gap-analysis/GapAnnexIILaunchView";
import { GapAnnexIISidebar } from "@/components/product/gap-analysis/GapAnnexIISidebar";

// MDR configs
import { ANNEX_I_SECTIONS, ANNEX_I_GROUPS } from "@/config/gapAnnexISections";
import { ANNEX_II_SECTIONS, ANNEX_II_GROUPS } from "@/config/gapAnnexIISections";
import { ANNEX_III_SECTIONS, ANNEX_III_GROUPS } from "@/config/gapAnnexIIISections";

// IEC configs
import { IEC_62304_SECTIONS, IEC_62304_GROUPS } from "@/config/gapIEC62304Sections";
import { IEC_60601_SECTIONS, IEC_60601_GROUPS } from "@/config/gapIEC60601Sections";
import { IEC_60601_1_2_SECTIONS, IEC_60601_1_2_GROUPS } from "@/config/gapIEC60601_1_2Sections";
import { IEC_60601_1_6_SECTIONS, IEC_60601_1_6_GROUPS } from "@/config/gapIEC60601_1_6Sections";
import { IEC_20957_SECTIONS, IEC_20957_GROUPS } from "@/config/gapIEC20957Sections";
import { ISO_14971_DEVICE_SECTIONS, ISO_14971_DEVICE_GROUPS } from "@/config/gapISO14971DeviceSections";

// Additional product-scope standards
import { IEC_62366_SECTIONS, IEC_62366_GROUPS } from "@/config/gapIEC62366Sections";
import { ISO_15223_SECTIONS, ISO_15223_GROUPS } from "@/config/gapISO15223Sections";
import { ISO_20417_SECTIONS, ISO_20417_GROUPS } from "@/config/gapISO20417Sections";
import { ISO_10993_SECTIONS, ISO_10993_GROUPS } from "@/config/gapISO10993Sections";

import { Cpu, Zap, Radio, Monitor, Dumbbell, Shield, ClipboardList, Upload, Users, Tag, FileText, FlaskConical } from "lucide-react";
import { ImportChecklistDialog } from "@/components/product/gap-analysis/ImportChecklistDialog";
import { Button } from "@/components/ui/button";
import { queryClient as qc } from "@/lib/query-client";
import { useGapFamilySharing } from "@/hooks/useGapFamilySharing";
import { GapFrameworkSharingToggle } from "@/components/company/gap-analysis/GapFrameworkSharingToggle";

// Maps framework strings from DB templates to our tab/sub-tab structure
const MDR_FRAMEWORKS = ["MDR_ANNEX_I", "MDR_ANNEX_II", "MDR_ANNEX_III"] as const;
const IEC_60601_FRAMEWORKS = ["IEC_60601_1", "IEC_60601_1_2", "IEC_60601_1_6"] as const;

export default function ProductGapAnalysisPage() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [mdrSubTab, setMdrSubTab] = useState("annex-ii");
  const [iec60601SubTab, setIec60601SubTab] = useState("60601-1");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const { lang } = useTranslation();

  const { data: product, isLoading, refetch } = useProductDetails(productId, {
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const { companyId } = useCompanyProducts(product?.company_id || "");
  const { isMenuAccessKeyEnabled, isLoading: isLoadingPlanAccess, planName } = usePlanMenuAccess();
  const { data: enabledFrameworks, isLoading: isLoadingFrameworks } = useEnabledGapFrameworks(product?.company_id);
  const { data: standardStatuses } = useStandardVersionStatus();
  const getStatus = (key: string) => standardStatuses?.find(s => s.framework_key === key);

  const isFeatureEnabled = isMenuAccessKeyEnabled(DEVICES_MENU_ACCESS.COMPLIANCE_GAP_ANALYSIS);
  const isRestricted = !isFeatureEnabled;

  const belongsToFamily = !!product?.parent_product_id || !!product?.basic_udi_di;

  const {
    isFrameworkShared,
    clauseExclusions,
    setClauseExcludedProducts,
    toggleFrameworkSharing,
    isLoading: isSharingLoading,
  } = useGapFamilySharing(productId);

  // Map internal framework keys to standardTag values used in GenericGapLaunchView
  const FRAMEWORK_KEY_TO_TAG: Record<string, string> = {
    MDR_ANNEX_I: 'GSPR',
    MDR_ANNEX_III: 'PMS',
    IEC_62304: 'IEC 62304',
    IEC_60601_1: 'IEC 60601-1',
    IEC_60601_1_2: 'IEC 60601-1-2',
    IEC_60601_1_6: 'IEC 60601-1-6',
    IEC_20957: 'IEC 20957',
    ISO_14971_DEVICE: 'ISO 14971',
    IEC_62366_1: 'IEC 62366-1',
    ISO_15223_1: 'ISO 15223-1',
    ISO_20417: 'ISO 20417',
    ISO_10993: 'ISO 10993-1:2025',
  };

  // Helper to build sharing toggle for a framework
  const buildSharingToggle = (frameworkKey: string) => {
    if (!belongsToFamily) return undefined;
    return (
      <GapFrameworkSharingToggle
        frameworkKey={frameworkKey}
        isShared={isFrameworkShared(frameworkKey)}
        onToggle={toggleFrameworkSharing}
        isLoading={isSharingLoading}
      />
    );
  };

  // Helper to build scope props for GenericGapLaunchView
  const buildScopeProps = (frameworkKey: string) => ({
    companyId: product?.company_id || undefined,
    isFrameworkShared: isFrameworkShared(frameworkKey),
    clauseExclusions,
    onClauseExclusionChange: setClauseExcludedProducts,
    standardStatus: getStatus(frameworkKey),
  });
  const marketStatus = useProductMarketStatus(product?.markets);

  // Derive which main tabs and sub-tabs are visible
  const hasMDR = useMemo(() => {
    if (!enabledFrameworks) return false;
    return MDR_FRAMEWORKS.some(fw => enabledFrameworks.has(fw));
  }, [enabledFrameworks]);

  const hasIEC60601 = useMemo(() => {
    if (!enabledFrameworks) return false;
    return IEC_60601_FRAMEWORKS.some(fw => enabledFrameworks.has(fw));
  }, [enabledFrameworks]);

  const hasIEC62304 = enabledFrameworks?.has("IEC_62304") ?? false;
  const hasIEC20957 = enabledFrameworks?.has("IEC_20957") ?? false;
  const hasISO14971Device = enabledFrameworks?.has("ISO_14971_DEVICE") ?? false;
  const hasIEC62366 = enabledFrameworks?.has("IEC_62366_1") ?? false;
  const hasISO15223 = enabledFrameworks?.has("ISO_15223_1") ?? false;
  const hasISO20417 = enabledFrameworks?.has("ISO_20417") ?? false;
  const hasISO10993 = enabledFrameworks?.has("ISO_10993") ?? false;

  // MDR sub-tab visibility
  const hasAnnexI = enabledFrameworks?.has("MDR_ANNEX_I") ?? false;
  const hasAnnexII = enabledFrameworks?.has("MDR_ANNEX_II") ?? false;
  const hasAnnexIII = enabledFrameworks?.has("MDR_ANNEX_III") ?? false;

  // IEC 60601 sub-tab visibility
  const has60601_1 = enabledFrameworks?.has("IEC_60601_1") ?? false;
  const has60601_1_2 = enabledFrameworks?.has("IEC_60601_1_2") ?? false;
  const has60601_1_6 = enabledFrameworks?.has("IEC_60601_1_6") ?? false;

  // Read tab/subtab from URL search params (for returning from detail pages)
  const urlTab = searchParams.get('tab');
  const urlSubTab = searchParams.get('subtab');

  // localStorage key for persisting last active tab/subtab per product
  const storageKey = `gap-analysis-tab-${productId}`;

  // Persist active tab/subtab to localStorage whenever they change
  useEffect(() => {
    if (!activeTab || !productId) return;
    const state = { tab: activeTab, mdrSubTab, iec60601SubTab };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [activeTab, mdrSubTab, iec60601SubTab, storageKey, productId]);

  // Set default active tab when frameworks load
  useEffect(() => {
    if (!enabledFrameworks || activeTab) return;

    // 1. URL params take priority (returning from detail page)
    if (urlTab) {
      setActiveTab(urlTab);
      if (urlSubTab) {
        if (urlTab === 'mdr') setMdrSubTab(urlSubTab);
        if (urlTab === 'iec-60601') setIec60601SubTab(urlSubTab);
      }
      return;
    }

    // 2. Restore from localStorage (returning from another module)
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.tab) {
          setActiveTab(state.tab);
          if (state.mdrSubTab) setMdrSubTab(state.mdrSubTab);
          if (state.iec60601SubTab) setIec60601SubTab(state.iec60601SubTab);
          return;
        }
      }
    } catch { /* ignore parse errors */ }

    // 3. Fall back to first available framework
    if (hasMDR) setActiveTab("mdr");
    else if (hasISO14971Device) setActiveTab("iso-14971");
    else if (hasIEC62304) setActiveTab("iec-62304");
    else if (hasIEC62366) setActiveTab("iec-62366");
    else if (hasIEC60601) setActiveTab("iec-60601");
    else if (hasIEC20957) setActiveTab("iec-20957");
    else if (hasISO15223) setActiveTab("iso-15223");
    else if (hasISO20417) setActiveTab("iso-20417");
    else if (hasISO10993) setActiveTab("iso-10993");
  }, [enabledFrameworks, hasMDR, hasISO14971Device, hasIEC62304, hasIEC60601, hasIEC20957, hasIEC62366, hasISO15223, hasISO20417, hasISO10993]);

  // Set default MDR sub-tab
  useEffect(() => {
    if (!enabledFrameworks) return;
    if (hasAnnexII) setMdrSubTab("annex-ii");
    else if (hasAnnexI) setMdrSubTab("annex-i");
    else if (hasAnnexIII) setMdrSubTab("annex-iii");
  }, [enabledFrameworks, hasAnnexI, hasAnnexII, hasAnnexIII]);

  // Set default IEC 60601 sub-tab
  useEffect(() => {
    if (!enabledFrameworks) return;
    if (has60601_1) setIec60601SubTab("60601-1");
    else if (has60601_1_2) setIec60601SubTab("60601-1-2");
    else if (has60601_1_6) setIec60601SubTab("60601-1-6");
  }, [enabledFrameworks, has60601_1, has60601_1_2, has60601_1_6]);

  useEffect(() => {
    const initializePage = async () => {
      const fromOtherPage = searchParams.get('from');
      if (fromOtherPage && productId) {
        await queryClient.invalidateQueries({ queryKey: ['productDetails', productId] });
        if (refetch) {
          await refetch();
        }
        toast.success(lang('gapAnalysis.page.dataRefreshed'));
      }
    };
    initializePage();
  }, [productId, searchParams, refetch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['productDetails'] });
      await queryClient.invalidateQueries({ queryKey: ['gap-analysis'] });
      await queryClient.removeQueries({ queryKey: ['productDetails', productId] });
      if (refetch) {
        await refetch();
      }
      toast.success(lang('gapAnalysis.page.gapRefreshed'));
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error(lang('gapAnalysis.page.refreshFailed'));
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading || isLoadingPlanAccess || isLoadingFrameworks) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">{lang('gapAnalysis.page.loading')}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">{lang('gapAnalysis.page.productNotFound')}</h2>
          <p className="text-muted-foreground">{lang('gapAnalysis.page.productNotFoundDescription')}</p>
        </div>
      </div>
    );
  }

  const gapItems = product?.gapAnalysis || [];
  
  // Filter items by framework to prevent cross-framework section collisions
  const filterByFramework = (items: typeof gapItems, ...frameworks: string[]) =>
    items.filter(i => frameworks.includes((i as any).framework || ''));

  const annexIItems = filterByFramework(gapItems, 'GSPR', 'MDR_ANNEX_I');
  const annexIIItems = filterByFramework(gapItems, 'MDR', 'MDR_ANNEX_II', 'MDR Annex II');
  const annexIIIItems = filterByFramework(gapItems, 'PMS', 'MDR_ANNEX_III');
  const iec60601_1Items = filterByFramework(gapItems, 'IEC 60601-1');
  const iec60601_1_2Items = filterByFramework(gapItems, 'IEC 60601-1-2');
  const iec60601_1_6Items = filterByFramework(gapItems, 'IEC 60601-1-6');
  const iec62304Items = filterByFramework(gapItems, 'IEC 62304');
  const iec20957Items = filterByFramework(gapItems, 'IEC 20957');
  const iso14971Items = filterByFramework(gapItems, 'ISO 14971', 'ISO_14971_DEVICE');
  const iec62366Items = filterByFramework(gapItems, 'IEC 62366-1', 'IEC_62366_1');
  const iso15223Items = filterByFramework(gapItems, 'ISO 15223-1', 'ISO_15223_1');
  const iso20417Items = filterByFramework(gapItems, 'ISO 20417', 'ISO_20417');
  const iso10993Items = filterByFramework(gapItems, 'ISO 10993-1:2025', 'ISO_10993');

  const noFrameworksEnabled = !hasMDR && !hasISO14971Device && !hasIEC62304 && !hasIEC60601 && !hasIEC20957 && !hasIEC62366 && !hasISO15223 && !hasISO20417 && !hasISO10993;

  if (noFrameworksEnabled) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ProductPageHeader
          product={product}
          subsection={lang('gapAnalysis.title')}
          marketStatus={marketStatus}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3 max-w-md">
            <h3 className="text-lg font-semibold text-foreground">No Gap Analysis Standards Enabled</h3>
            <p className="text-sm text-muted-foreground">
              Enable gap analysis standards in your company Settings → Gap Analysis to see them here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mr-[280px] lg:mr-[300px] xl:mr-[320px]">
        <ProductPageHeader
          product={product}
          subsection={lang('gapAnalysis.title')}
          marketStatus={marketStatus}
        />
      </div>

      <RestrictedFeatureProvider
        isRestricted={isRestricted}
        planName={planName}
        featureName={lang('gapAnalysis.featureName')}
      >
        {isRestricted && <RestrictedPreviewBanner className="mt-2 !mb-0" />}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full py-2 sm:py-3 lg:py-4" data-tour="gap-analysis">
            {/* Family sharing is now per-standard in each banner */}
            {/* Main tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 flex-wrap h-auto gap-1">
                {hasMDR && <TabsTrigger value="mdr">EU MDR</TabsTrigger>}
                {hasISO14971Device && <TabsTrigger value="iso-14971">ISO 14971</TabsTrigger>}
                {hasIEC62304 && <TabsTrigger value="iec-62304">IEC 62304</TabsTrigger>}
                {hasIEC62366 && <TabsTrigger value="iec-62366">IEC 62366-1</TabsTrigger>}
                {hasIEC60601 && <TabsTrigger value="iec-60601">IEC 60601</TabsTrigger>}
                {hasIEC20957 && <TabsTrigger value="iec-20957">IEC 20957</TabsTrigger>}
                {hasISO15223 && <TabsTrigger value="iso-15223">ISO 15223-1</TabsTrigger>}
                {hasISO20417 && <TabsTrigger value="iso-20417">ISO 20417</TabsTrigger>}
                {hasISO10993 && <TabsTrigger value="iso-10993">ISO 10993-1:2025</TabsTrigger>}
              </TabsList>

              {/* EU MDR — with sub-tabs */}
              {hasMDR && (
                <TabsContent value="mdr">
                  <Tabs value={mdrSubTab} onValueChange={setMdrSubTab}>
                    <TabsList className="mb-4 h-auto gap-1">
                      {hasAnnexI && <TabsTrigger value="annex-i">Annex I</TabsTrigger>}
                      {hasAnnexII && <TabsTrigger value="annex-ii">Annex II</TabsTrigger>}
                      {hasAnnexIII && <TabsTrigger value="annex-iii">Annex III</TabsTrigger>}
                    </TabsList>

                    {hasAnnexI && (
                      <TabsContent value="annex-i">
                        <div className="relative">
                          <GenericGapLaunchView
                            sections={ANNEX_I_SECTIONS}
                            groups={ANNEX_I_GROUPS}
                            items={annexIItems}
                            standardName="EU MDR Annex I — General Safety & Performance Requirements"
                            standardTag="GSPR"
                            standardIcon={Shield}
                            bannerDescription="General safety and performance requirements (GSPRs) as defined in EU MDR Annex I. Covers general requirements, design & manufacture, and information supplied with the device."
                            disabled={isRestricted}
                            headerActions={buildSharingToggle('MDR_ANNEX_I')}
                            {...buildScopeProps('MDR_ANNEX_I')}
                          />
                          <GenericGapSidebar
                            sections={ANNEX_I_SECTIONS}
                            groups={ANNEX_I_GROUPS}
                            items={annexIItems}
                            standardLabel="EU MDR Annex I GSPRs"
                            standardIcon={Shield}
                            disabled={isRestricted}
                            framework="GSPR"
                            productId={productId}
                          />
                        </div>
                      </TabsContent>
                    )}

                    {hasAnnexII && (
                      <TabsContent value="annex-ii">
                        <div className="relative">
                          <GapAnnexIILaunchView
                            items={annexIIItems}
                            disabled={isRestricted}
                            headerActions={buildSharingToggle('MDR_ANNEX_II')}
                            {...buildScopeProps('MDR_ANNEX_II')}
                          />
                          <GapAnnexIISidebar items={annexIIItems} disabled={isRestricted} />
                        </div>
                      </TabsContent>
                    )}

                    {hasAnnexIII && (
                      <TabsContent value="annex-iii">
                        <div className="relative">
                          <GenericGapLaunchView
                            sections={ANNEX_III_SECTIONS}
                            groups={ANNEX_III_GROUPS}
                            items={annexIIIItems}
                            standardName="EU MDR Annex III — Post-Market Surveillance Documentation"
                            standardTag="PMS"
                            standardIcon={ClipboardList}
                            bannerDescription="Technical documentation on post-market surveillance as defined in EU MDR Annex III. Covers PMS plan, PSUR, post-market clinical follow-up (PMCF), and vigilance requirements."
                            disabled={isRestricted}
                            headerActions={buildSharingToggle('MDR_ANNEX_III')}
                            {...buildScopeProps('MDR_ANNEX_III')}
                          />
                          <GenericGapSidebar
                            sections={ANNEX_III_SECTIONS}
                            groups={ANNEX_III_GROUPS}
                            items={annexIIIItems}
                            standardLabel="EU MDR Annex III PMS"
                            standardIcon={ClipboardList}
                            disabled={isRestricted}
                            framework="PMS"
                            productId={productId}
                          />
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                </TabsContent>
              )}

              {/* ISO 14971 Device — standalone */}
              {hasISO14971Device && (
                <TabsContent value="iso-14971">
                  <div className="relative">
                    <GenericGapLaunchView
                      sections={ISO_14971_DEVICE_SECTIONS}
                      groups={ISO_14971_DEVICE_GROUPS}
                      items={iso14971Items}
                      standardName="ISO 14971:2019 — Risk Management"
                      standardTag="ISO 14971"
                      standardIcon={Shield}
                      bannerDescription="Device-specific risk management: risk management plan, hazard identification, risk analysis, evaluation, control measures, residual risk assessment, review, and post-production monitoring."
                      disabled={isRestricted}
                      headerActions={buildSharingToggle('ISO_14971_DEVICE')}
                      {...buildScopeProps('ISO_14971_DEVICE')}
                    />
                    <GenericGapSidebar
                      sections={ISO_14971_DEVICE_SECTIONS}
                      groups={ISO_14971_DEVICE_GROUPS}
                      items={iso14971Items}
                      standardLabel="ISO 14971 Risk Management"
                      standardIcon={Shield}
                      disabled={isRestricted}
                      framework="ISO 14971"
                      productId={productId}
                    />
                  </div>
                </TabsContent>
              )}

              {/* IEC 62304 — standalone */}
              {hasIEC62304 && (
                <TabsContent value="iec-62304">
                  <div className="relative">
                    <GenericGapLaunchView
                      sections={IEC_62304_SECTIONS}
                      groups={IEC_62304_GROUPS}
                      items={iec62304Items}
                      standardName="IEC 62304:2006+AMD1 — Software Lifecycle"
                      standardTag="IEC 62304"
                      standardIcon={Cpu}
                      bannerDescription="Software lifecycle processes for medical device software. Covers planning, requirements, architecture, design, implementation, testing, release, maintenance, risk management, configuration management, and problem resolution."
                      disabled={isRestricted}
                      headerActions={buildSharingToggle('IEC_62304')}
                      {...buildScopeProps('IEC_62304')}
                    />
                    <GenericGapSidebar
                      sections={IEC_62304_SECTIONS}
                      groups={IEC_62304_GROUPS}
                      items={iec62304Items}
                      standardLabel="IEC 62304 Software Lifecycle"
                      standardIcon={Cpu}
                      disabled={isRestricted}
                      framework="IEC 62304"
                      productId={productId}
                    />
                  </div>
                </TabsContent>
              )}

              {/* IEC 60601 — with sub-tabs */}
              {hasIEC60601 && (
                <TabsContent value="iec-60601">
                  <Tabs value={iec60601SubTab} onValueChange={setIec60601SubTab}>
                    <TabsList className="mb-4 h-auto gap-1">
                      {has60601_1 && <TabsTrigger value="60601-1">60601-1</TabsTrigger>}
                      {has60601_1_2 && <TabsTrigger value="60601-1-2">60601-1-2</TabsTrigger>}
                      {has60601_1_6 && <TabsTrigger value="60601-1-6">60601-1-6</TabsTrigger>}
                    </TabsList>

                    {has60601_1 && (
                      <TabsContent value="60601-1">
                        <div className="relative">
                          <GenericGapLaunchView
                            sections={IEC_60601_SECTIONS}
                            groups={IEC_60601_GROUPS}
                            items={iec60601_1Items}
                            standardName="IEC 60601-1:2012 — General Safety"
                            standardTag="IEC 60601-1"
                            standardIcon={Zap}
                            bannerDescription="General requirements for basic safety and essential performance of medical electrical equipment. Covers electrical, mechanical, radiation, temperature hazards, PEMS, construction, and ME system requirements."
                            disabled={isRestricted}
                            {...buildScopeProps('IEC_60601_1')}
                            headerActions={
                              <>
                                {buildSharingToggle('IEC_60601_1')}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5"
                                  onClick={() => setImportDialogOpen(true)}
                                >
                                  <Upload className="h-3.5 w-3.5" />
                                  Import from Document
                                </Button>
                                {productId && (
                                  <ImportChecklistDialog
                                    open={importDialogOpen}
                                    onOpenChange={setImportDialogOpen}
                                    productId={productId}
                                    items={iec60601_1Items}
                                    onImportComplete={() => {
                                      qc.invalidateQueries({ queryKey: ['productDetails', productId] });
                                    }}
                                  />
                                )}
                              </>
                            }
                          />
                          <GenericGapSidebar
                            sections={IEC_60601_SECTIONS}
                            groups={IEC_60601_GROUPS}
                            items={iec60601_1Items}
                            standardLabel="IEC 60601-1 General Safety"
                            standardIcon={Zap}
                            disabled={isRestricted}
                            framework="IEC 60601-1"
                            productId={productId}
                          />
                        </div>
                      </TabsContent>
                    )}

                    {has60601_1_2 && (
                      <TabsContent value="60601-1-2">
                        <div className="relative">
                          <GenericGapLaunchView
                            sections={IEC_60601_1_2_SECTIONS}
                            groups={IEC_60601_1_2_GROUPS}
                            items={iec60601_1_2Items}
                            standardName="IEC 60601-1-2:2014 — EMC"
                            standardTag="IEC 60601-1-2"
                            standardIcon={Radio}
                            bannerDescription="Electromagnetic compatibility requirements and tests for medical electrical equipment. Covers EMC risk management, emission limits, immunity levels, and accompanying documentation for professional and home healthcare environments."
                            disabled={isRestricted}
                            headerActions={buildSharingToggle('IEC_60601_1_2')}
                            {...buildScopeProps('IEC_60601_1_2')}
                          />
                          <GenericGapSidebar
                            sections={IEC_60601_1_2_SECTIONS}
                            groups={IEC_60601_1_2_GROUPS}
                            items={iec60601_1_2Items}
                            standardLabel="IEC 60601-1-2 EMC"
                            standardIcon={Radio}
                            disabled={isRestricted}
                            framework="IEC 60601-1-2"
                            productId={productId}
                          />
                        </div>
                      </TabsContent>
                    )}

                    {has60601_1_6 && (
                      <TabsContent value="60601-1-6">
                        <div className="relative">
                          <GenericGapLaunchView
                            sections={IEC_60601_1_6_SECTIONS}
                            groups={IEC_60601_1_6_GROUPS}
                            items={iec60601_1_6Items}
                            standardName="IEC 60601-1-6 — Usability"
                            standardTag="IEC 60601-1-6"
                            standardIcon={Monitor}
                            bannerDescription="Usability engineering process for medical electrical equipment. Covers USE specification, hazard-related use scenarios, user interface design, formative and summative evaluation, and self-use ME equipment considerations."
                            disabled={isRestricted}
                            headerActions={buildSharingToggle('IEC_60601_1_6')}
                            {...buildScopeProps('IEC_60601_1_6')}
                          />
                          <GenericGapSidebar
                            sections={IEC_60601_1_6_SECTIONS}
                            groups={IEC_60601_1_6_GROUPS}
                            items={iec60601_1_6Items}
                            standardLabel="IEC 60601-1-6 Usability"
                            standardIcon={Monitor}
                            disabled={isRestricted}
                            framework="IEC 60601-1-6"
                            productId={productId}
                          />
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                </TabsContent>
              )}

              {/* IEC 20957 — standalone */}
              {hasIEC20957 && (
                <TabsContent value="iec-20957">
                  <div className="relative">
                    <GenericGapLaunchView
                      sections={IEC_20957_SECTIONS}
                      groups={IEC_20957_GROUPS}
                      items={iec20957Items}
                      standardName="IEC 20957 — Stationary Training Equipment"
                      standardTag="IEC 20957"
                      standardIcon={Dumbbell}
                      bannerDescription="Safety requirements for stationary training equipment. Covers general safety, stability, strength/durability, labelling, instructions, and accuracy of displays."
                      disabled={isRestricted}
                      headerActions={buildSharingToggle('IEC_20957')}
                      {...buildScopeProps('IEC_20957')}
                    />
                    <GenericGapSidebar
                      sections={IEC_20957_SECTIONS}
                      groups={IEC_20957_GROUPS}
                      items={iec20957Items}
                      standardLabel="IEC 20957 Training Equipment"
                      standardIcon={Dumbbell}
                      disabled={isRestricted}
                      framework="IEC 20957"
                      productId={productId}
                    />
                  </div>
                </TabsContent>
              )}

              {/* IEC 62366-1 — Usability Engineering */}
              {hasIEC62366 && (
                <TabsContent value="iec-62366">
                  <div className="relative">
                    <GenericGapLaunchView
                      sections={IEC_62366_SECTIONS}
                      groups={IEC_62366_GROUPS}
                      items={iec62366Items}
                      standardName="IEC 62366-1 — Usability Engineering"
                      standardTag="IEC 62366-1"
                      standardIcon={Users}
                      bannerDescription="Usability engineering process for medical devices. Covers use specification, hazard-related use scenarios, user interface design, formative and summative evaluation."
                      disabled={isRestricted}
                      headerActions={buildSharingToggle('IEC_62366_1')}
                      {...buildScopeProps('IEC_62366_1')}
                    />
                    <GenericGapSidebar
                      sections={IEC_62366_SECTIONS}
                      groups={IEC_62366_GROUPS}
                      items={iec62366Items}
                      standardLabel="IEC 62366-1 Usability"
                      standardIcon={Users}
                      disabled={isRestricted}
                      framework="IEC 62366-1"
                      productId={productId}
                    />
                  </div>
                </TabsContent>
              )}

              {/* ISO 15223-1 — Symbols */}
              {hasISO15223 && (
                <TabsContent value="iso-15223">
                  <div className="relative">
                    <GenericGapLaunchView
                      sections={ISO_15223_SECTIONS}
                      groups={ISO_15223_GROUPS}
                      items={iso15223Items}
                      standardName="ISO 15223-1 — Symbols for Medical Devices"
                      standardTag="ISO 15223-1"
                      standardIcon={Tag}
                      bannerDescription="Symbols for use in medical device labelling, marking, and documentation. Covers manufacturer identification, handling, storage, sterility, warnings, and regulatory symbols."
                      disabled={isRestricted}
                      headerActions={buildSharingToggle('ISO_15223_1')}
                      {...buildScopeProps('ISO_15223_1')}
                    />
                    <GenericGapSidebar
                      sections={ISO_15223_SECTIONS}
                      groups={ISO_15223_GROUPS}
                      items={iso15223Items}
                      standardLabel="ISO 15223-1 Symbols"
                      standardIcon={Tag}
                      disabled={isRestricted}
                      framework="ISO 15223-1"
                      productId={productId}
                    />
                  </div>
                </TabsContent>
              )}

              {/* ISO 20417 — Information Supplied */}
              {hasISO20417 && (
                <TabsContent value="iso-20417">
                  <div className="relative">
                    <GenericGapLaunchView
                      sections={ISO_20417_SECTIONS}
                      groups={ISO_20417_GROUPS}
                      items={iso20417Items}
                      standardName="ISO 20417 — Information Supplied by Manufacturer"
                      standardTag="ISO 20417"
                      standardIcon={FileText}
                      bannerDescription="Requirements for information supplied by the manufacturer with medical devices including labelling, instructions for use, and electronic IFU."
                      disabled={isRestricted}
                      headerActions={buildSharingToggle('ISO_20417')}
                      {...buildScopeProps('ISO_20417')}
                    />
                    <GenericGapSidebar
                      sections={ISO_20417_SECTIONS}
                      groups={ISO_20417_GROUPS}
                      items={iso20417Items}
                      standardLabel="ISO 20417 Info Supplied"
                      standardIcon={FileText}
                      disabled={isRestricted}
                      framework="ISO 20417"
                      productId={productId}
                    />
                  </div>
                </TabsContent>
              )}

              {/* ISO 10993 — Biocompatibility */}
              {hasISO10993 && (
                <TabsContent value="iso-10993">
                  <div className="relative">
                    <GenericGapLaunchView
                      sections={ISO_10993_SECTIONS}
                      groups={ISO_10993_GROUPS}
                      items={iso10993Items}
                      standardName="ISO 10993-1:2025 — Biological Evaluation of Medical Devices"
                      standardTag="ISO 10993-1:2025"
                      standardIcon={FlaskConical}
                      bannerDescription="Biological evaluation within the ISO 14971 risk management framework. Covers material characterization, device categorization, biological effects (cytotoxicity, sensitization, irritation, systemic toxicity, local effects, genotoxicity, carcinogenicity, haemocompatibility), gap analysis, equivalence, testing, risk evaluation, risk control, and post-production monitoring."
                      disabled={isRestricted}
                      headerActions={buildSharingToggle('ISO_10993')}
                      {...buildScopeProps('ISO_10993')}
                    />
                    <GenericGapSidebar
                      sections={ISO_10993_SECTIONS}
                      groups={ISO_10993_GROUPS}
                      items={iso10993Items}
                      standardLabel="ISO 10993-1:2025 Biocompatibility"
                      standardIcon={FlaskConical}
                      disabled={isRestricted}
                      framework="ISO 10993-1:2025"
                      productId={productId}
                    />
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </RestrictedFeatureProvider>
    </div>
  );
}
