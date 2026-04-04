import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useInheritanceExclusion } from '@/hooks/useInheritanceExclusion';
import { useScopeMirroring } from '@/hooks/useAutoSyncScope';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Lock } from 'lucide-react';
import { ClassificationSuggestionsCard } from './ClassificationSuggestionsCard';
import { RegulatoryDNASection } from './RegulatoryDNASection';
import { FDADocumentSearch } from '@/components/competitive/FDADocumentSearch';
import { EmdnSelector } from './EmdnSelector';
import { UnifiedMarketCard } from './UnifiedMarketCard';
import { EnhancedProductMarket } from '@/types/client';
import { ClassificationSuggestion } from '@/services/DeviceClassificationService';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { DEVICES_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getLaunchStatusSummary } from "@/utils/launchStatusUtils";
import { marketData } from "@/utils/marketRiskClassMapping";
import { getSuggestedConformityRoute } from '@/utils/conformityRouteUtils';
import { InvestorVisibleBadge } from '@/components/ui/investor-visible-badge';

interface UnifiedMarketsRegulatorySectionProps {
  // Market data props
  markets: EnhancedProductMarket[];
  onMarketsChange: (markets: EnhancedProductMarket[]) => void;
  isLoading?: boolean;
  
  // Classification props
  primaryRegulatoryType?: string;
  keyTechnologyCharacteristics?: any;
  onKeyTechnologyCharacteristicsChange?: (value: any) => void;
  onMarketComponentClassificationChange?: (marketCode: string, classification: any) => void;
  deviceComponents?: Array<{ name: string; description: string; }>;
  productId?: string;
  projectedLaunchDate?: string | null;
  productData?: any;
  coreDeviceNature?: string;
  intendedPurposeData?: {
    intended_users?: string;
    duration_of_use?: string;
  };

  // AI Classification suggestions
  classificationSuggestions: ClassificationSuggestion[];
  onClassificationSelected?: (marketCode: string, deviceClass: string) => void;

  // EMDN and FDA props
  emdnCode?: string;
  emdnCategoryId?: string;
  emdnDescription?: string;
  onEmdnChange?: (categoryId: string, code: string, name: string) => void;
  companyId?: string;
  currentFdaCode?: string;
  onFdaCodeSelected?: () => void;
  
  // Additional props
  hasEudamedData?: boolean;
  disabled?: boolean;
  belongsToFamily?: boolean;
  parentProductId?: string | null;
  familyProductIds?: string[];
}

export function UnifiedMarketsRegulatorySection({
  markets = [],
  onMarketsChange,
  isLoading,
  primaryRegulatoryType,
  keyTechnologyCharacteristics,
  onKeyTechnologyCharacteristicsChange,
  onMarketComponentClassificationChange,
  deviceComponents,
  productId,
  projectedLaunchDate,
  productData,
  coreDeviceNature,
  intendedPurposeData,
  classificationSuggestions,
  onClassificationSelected,
  emdnCode,
  emdnCategoryId,
  emdnDescription,
  onEmdnChange,
  companyId,
  currentFdaCode,
  onFdaCodeSelected,
  hasEudamedData: externalHasEudamedData,
  disabled = false,
  belongsToFamily = false,
  parentProductId,
  familyProductIds,
}: UnifiedMarketsRegulatorySectionProps) {
  const { lang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const fieldExclusion = useInheritanceExclusion(productId, false, 'market_exclusion_scopes');
  const [activeSubTab, setActiveSubTab] = useState('markets');

  // Auto-expand markets when navigating from economic buyer step
  const sectionFromUrl = searchParams.get('section');
  const autoExpandMarkets = sectionFromUrl === 'economic-buyer';
  
  // Check if in Genesis flow
  const returnTo = searchParams.get('returnTo');
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share' || returnTo === 'gap-analysis';

  // Get feature limit for target markets from plan
  const { getFeatureLimit, planName, isLoading: isPlanLoading } = usePlanMenuAccess();
  const marketLimit = getFeatureLimit(DEVICES_MENU_ACCESS.DEVICE_DEFINITION_MARKETS);
  const hasValidLimit = !isPlanLoading && marketLimit !== null && marketLimit > 0;

  // Handle sub-tab changes from URL
  useEffect(() => {
    const subTabFromUrl = searchParams.get('subtab');
    if (subTabFromUrl && subTabFromUrl !== activeSubTab) {
      setActiveSubTab(subTabFromUrl);
    }
  }, [searchParams, activeSubTab]);

  const handleSubTabChange = (newSubTab: string) => {
    setActiveSubTab(newSubTab);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('subtab', newSubTab);
    newSearchParams.delete('section');
    setSearchParams(newSearchParams);
  };

  // Normalize EUDAMED risk class (e.g. "Class I" -> "I", "class-iia" -> "IIa") to match dropdown values
  const normalizeEudamedRiskClass = (raw: string | undefined | null): string | undefined => {
    if (!raw) return undefined;
    const map: Record<string, string> = {
      'class i': 'I', 'class_i': 'I', 'class-i': 'I',
      'class is': 'Is', 'class_is': 'Is', 'class-is': 'Is',
      'class im': 'Im', 'class_im': 'Im', 'class-im': 'Im',
      'class ir': 'Ir', 'class_ir': 'Ir', 'class-ir': 'Ir',
      'class iia': 'IIa', 'class_iia': 'IIa', 'class-iia': 'IIa', 'class-2a': 'IIa',
      'class iib': 'IIb', 'class_iib': 'IIb', 'class-iib': 'IIb', 'class-2b': 'IIb',
      'class ii': 'II', 'class_ii': 'II', 'class-ii': 'II',
      'class iii': 'III', 'class_iii': 'III', 'class-iii': 'III',
    };
    const key = raw.trim().toLowerCase();
    if (map[key]) return map[key];
    // If it's already a short value like "I", "IIa", return as-is
    const shortValues = ['I', 'Is', 'Im', 'Ir', 'IIa', 'IIb', 'III'];
    if (shortValues.includes(raw.trim())) return raw.trim();
    return undefined;
  };

  // Build complete markets list
  const currentMarkets: EnhancedProductMarket[] = useMemo(() => {
    const allMarkets = marketData.map(m => ({ ...m, selected: false, name: m.name } as EnhancedProductMarket));
    const hasEudamedData = externalHasEudamedData || !!(productData?.eudamed_risk_class || productData?.basic_udi_di);
    const eudamedRiskClass = normalizeEudamedRiskClass(productData?.eudamed_risk_class || productData?.class);

    if (!markets || markets.length === 0) {
      if (hasEudamedData) {
        // Pre-populate risk class, auto-select EU, and default launched (user can uncheck)
        return allMarkets.map(m => {
          if (m.code === 'EU') {
            return {
              ...m,
              selected: true,
              marketLaunchStatus: 'launched' as const,
              actualLaunchDate: m.actualLaunchDate || new Date().toISOString(),
              riskClass: eudamedRiskClass || m.riskClass,
              conformityAssessmentRoute: getSuggestedConformityRoute(eudamedRiskClass || m.riskClass) || m.conformityAssessmentRoute,
            };
          }
          return m;
        });
      }
      return allMarkets;
    }

    if (typeof markets[0] === 'string') {
      const selectedCodes = new Set(markets as unknown as string[]);
      return allMarkets.map(m => ({
        ...m,
        selected: selectedCodes.has(m.code) || (m.code === 'EU' && hasEudamedData),
      }));
    }

    const existingMarketsMap = new Map(markets.map(m => [m.code, m]));
    return allMarkets.map(m => {
      const existing = existingMarketsMap.get(m.code);
      if (m.code === 'EU' && hasEudamedData) {
        // EUDAMED: pre-populate risk class, respect user's saved selection/launch choices
        const existingRiskClass = existing?.riskClass && existing.riskClass !== 'TBD' && existing.riskClass.trim() !== '' ? existing.riskClass : undefined;
        const resolvedRiskClass = existingRiskClass || eudamedRiskClass || '';
        const existingRoute = existing?.conformityAssessmentRoute;
        return {
          ...m,
          ...(existing || {}),
          riskClass: resolvedRiskClass,
          conformityAssessmentRoute: existingRoute || getSuggestedConformityRoute(resolvedRiskClass) || '',
        };
      }
      if (existing) {
        return { ...m, ...existing };
      }
      return m;
    });
  }, [markets, externalHasEudamedData, productData]);

  const queryClient = useQueryClient();

  // Fetch family products for market sync (family only, not all company)
  const familyRootId = parentProductId || productId;
  const { data: familyProducts } = useQuery({
    queryKey: ['family-products-markets-sync', familyRootId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, markets')
        .eq('is_archived', false)
        .or(`id.eq.${familyRootId},and(parent_product_id.eq.${familyRootId},parent_relationship_type.eq.variant)`);
      return (data || []) as { id: string; markets: any }[];
    },
    enabled: !!familyRootId && belongsToFamily,
    staleTime: 5_000,
  });

  // Compute family product IDs from the family-only query
  const computedFamilyProductIds = useMemo(
    () => (familyProducts || []).map(p => p.id),
    [familyProducts]
  );
  // Use prop if provided, otherwise use computed from query
  const effectiveFamilyProductIds = familyProductIds && familyProductIds.length > 0
    ? familyProductIds
    : computedFamilyProductIds.length > 0 ? computedFamilyProductIds : undefined;

  // Wrap fieldExclusion with automatic scope mirroring to family products
  const mirroredFieldExclusion = useScopeMirroring(
    fieldExclusion, 'market_exclusion_scopes', productId, companyId, belongsToFamily, undefined, parentProductId
  );


  // Compute which family products have a given market selected (for value-matching badge)
  const getMarketMatchingProductIds = useCallback((marketCode: string): string[] | undefined => {
    if (!familyProducts?.length || !productId) return undefined;
    return familyProducts
      .filter(p => {
        const pMarkets = Array.isArray(p.markets) ? p.markets as any[] : [];
        return pMarkets.some((m: any) => m.code === marketCode && m.selected);
      })
      .map(p => p.id);
  }, [familyProducts, productId]);

  const handleMarketChange = useCallback((updatedMarket: EnhancedProductMarket) => {
    if (disabled) return;
    const updatedMarkets = currentMarkets.map(market =>
      market.code === updatedMarket.code ? updatedMarket : market
    );
    onMarketsChange(updatedMarkets);
    // Optimistically update the family products cache so the value-matching badge refreshes instantly
    if (productId && familyRootId) {
      queryClient.setQueryData(
        ['family-products-markets-sync', familyRootId],
        (old: { id: string; markets: any }[] | undefined) => {
          if (!old) return old;
          return old.map(p =>
            p.id === productId ? { ...p, markets: updatedMarkets } : p
          );
        }
      );
    }
  }, [disabled, currentMarkets, onMarketsChange, queryClient, familyRootId, productId]);

  const launchSummary = useMemo(() => getLaunchStatusSummary(currentMarkets), [currentMarkets]);
  const selectedCount = useMemo(() => currentMarkets.filter(m => m.selected).length, [currentMarkets]);
  const isLimitReached = hasValidLimit && selectedCount >= marketLimit!;
  const hasSelectedMarkets = selectedCount > 0;
  const firstSelectedMarket = useMemo(() => currentMarkets.find(m => m.selected), [currentMarkets]);
  
  // Check completion for Genesis flow
  const selectedMarkets = currentMarkets.filter(m => m.selected);
  const hasAllClassifications = selectedMarkets.length > 0 && selectedMarkets.every(m => m.riskClass && m.riskClass !== 'Not yet determined');
  
  const hasEudamedData = externalHasEudamedData || !!(productData?.eudamed_risk_class || productData?.basic_udi_di);

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <Tabs value={activeSubTab} onValueChange={handleSubTabChange} className="w-full">
        <div className="overflow-x-auto w-full bg-muted rounded-md">
          <TabsList className="inline-flex w-full justify-between gap-2 p-1 bg-transparent xl:grid xl:grid-cols-4">
            <TabsTrigger value="markets">{lang('regulatory.tabs.marketsAndRegulatory') || 'Markets & Regulatory'}</TabsTrigger>
            <TabsTrigger value="ai-suggestions">{lang('regulatory.tabs.aiClassification')}</TabsTrigger>
            <TabsTrigger value="emdn-classification">{lang('regulatory.tabs.emdnCode')}</TabsTrigger>
            <TabsTrigger value="fda-search">{lang('regulatory.tabs.fdaSearch')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="markets" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>{lang('risk.markets.title') || 'Target Markets'}</CardTitle>
                  <InvestorVisibleBadge />
                </div>
                <div className="flex items-center space-x-2">
                  {hasValidLimit && (
                    <Badge
                      variant={isLimitReached ? "destructive" : "outline"}
                      className={isLimitReached ? "bg-destructive" : ""}
                    >
                      <Lock className="h-3 w-3 mr-1" />
                      {selectedCount}/{marketLimit} {lang('risk.markets.selected')}
                    </Badge>
                  )}
                  {launchSummary.launchedMarkets > 0 && (
                    <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {launchSummary.launchedMarkets} {lang('risk.markets.launched')}
                    </Badge>
                  )}
                  {launchSummary.plannedMarkets > 0 && (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {launchSummary.plannedMarkets} {lang('risk.markets.planned')}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLimitReached && marketLimit && !disabled && (
                <Alert className="border-destructive/30 bg-destructive/10">
                  <Lock className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    {lang('risk.markets.limitReached')?.replace('{limit}', String(marketLimit)).replace('{plan}', planName || 'current') || 
                     `You have reached the limit of ${marketLimit} markets on your ${planName || 'current'} plan.`}
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-3">
                {currentMarkets.map((market) => {
                  const isFirstSelected = firstSelectedMarket?.code === market.code;
                  return (
                    <UnifiedMarketCard
                      key={market.code}
                      market={market}
                      onMarketChange={handleMarketChange}
                      isLoading={isLoading}
                      companyId={companyId}
                      hasEudamedData={hasEudamedData && market.code === 'EU'}
                      disabledByLimit={isLimitReached && !market.selected}
                      disabled={disabled}
                      autoExpand={autoExpandMarkets || (isInGenesisFlow && (sectionFromUrl === 'classification' || sectionFromUrl === 'economic-buyer' || sectionFromUrl === 'partners') && market.selected)}
                      isFirstSelectedMarket={isFirstSelected}
                      primaryRegulatoryType={primaryRegulatoryType}
                      keyTechnologyCharacteristics={keyTechnologyCharacteristics}
                      onKeyTechnologyCharacteristicsChange={onKeyTechnologyCharacteristicsChange}
                      productId={productId}
                      projectedLaunchDate={projectedLaunchDate}
                      showClassificationHighlight={isInGenesisFlow && sectionFromUrl === 'classification' && market.selected}
                      showEconomicBuyerHighlight={isInGenesisFlow && sectionFromUrl === 'economic-buyer' && market.selected}
                      showStrategicPartnersHighlight={isInGenesisFlow && sectionFromUrl === 'partners' && market.selected}
                      belongsToFamily={belongsToFamily}
                      fieldExclusion={mirroredFieldExclusion}
                      familyProductIds={effectiveFamilyProductIds}
                      valueMatchingProductIds={getMarketMatchingProductIds(market.code)}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-suggestions" className="space-y-6">
          {/* AI-powered classification suggestions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{lang('regulatory.aiClassification.title')}</h3>
            <ClassificationSuggestionsCard
              suggestions={classificationSuggestions}
              onClassificationSelected={onClassificationSelected}
              primaryRegulatoryType={primaryRegulatoryType}
              keyTechnologyCharacteristics={keyTechnologyCharacteristics}
              isLoading={isLoading}
            />
          </div>

          {/* Regulatory DNA / Field completeness below */}
          <RegulatoryDNASection
            productId={productId}
            emdnCode={emdnCode}
            currentFdaCode={currentFdaCode}
            isLoading={isLoading}
            keyTechnologyCharacteristics={keyTechnologyCharacteristics}
            coreDeviceNature={coreDeviceNature}
            primaryRegulatoryType={primaryRegulatoryType}
            intendedPurposeData={intendedPurposeData}
          />
        </TabsContent>

        <TabsContent value="emdn-classification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{lang('regulatory.emdn.title')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {lang('regulatory.emdn.description')}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <EmdnSelector
                value={emdnCategoryId || emdnCode}
                onValueChange={onEmdnChange}
                disabled={isLoading}
                productData={productData}
                placeholder={lang('regulatory.emdn.placeholder')}
              />
              {!emdnCategoryId && emdnCode && (
                <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded text-sm">
                  <strong>{lang('regulatory.emdn.currentCode')}:</strong> {emdnCode}
                  <div className="text-xs text-muted-foreground mt-1">
                    {lang('regulatory.emdn.updateHint')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fda-search" className="space-y-6">
          <FDADocumentSearch
            emdnCode={emdnCode}
            productId={productId}
            companyId={companyId}
            currentFdaCode={currentFdaCode}
            onFdaCodeSelected={onFdaCodeSelected}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
