import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegulatoryCardsSection } from './RegulatoryCardsSection';
import { ClassificationSuggestionsCard } from './ClassificationSuggestionsCard';
import { RegulatoryDNASection } from './RegulatoryDNASection';
import { FDADocumentSearch } from '@/components/competitive/FDADocumentSearch';
import { EmdnSelector } from './EmdnSelector';
import { EnhancedProductMarket } from '@/types/client';
import { ClassificationSuggestion } from '@/services/DeviceClassificationService';
import { useTranslation } from '@/hooks/useTranslation';

interface RegulatoryTabsSectionProps {
  // Props for RegulatoryCardsSection
  markets: EnhancedProductMarket[];
  onMarketsChange: (markets: EnhancedProductMarket[]) => void;
  isLoading?: boolean;
  primaryRegulatoryType?: string;
  keyTechnologyCharacteristics?: any;
  onKeyTechnologyCharacteristicsChange?: (value: any) => void;
  onMarketComponentClassificationChange?: (marketCode: string, classification: any) => void;
  deviceComponents?: Array<{ name: string; description: string; }>;
  productId?: string;
  projectedLaunchDate?: string | null;
  productData?: any;

  // Props for ClassificationSuggestionsCard
  classificationSuggestions: ClassificationSuggestion[];
  onClassificationSelected?: (marketCode: string, deviceClass: string) => void;

  // Props for FDADocumentSearch and EMDN
  emdnCode?: string;
  emdnCategoryId?: string;
  emdnDescription?: string;
  onEmdnChange?: (categoryId: string, code: string, name: string) => void;
  companyId?: string;
  currentFdaCode?: string;
  onFdaCodeSelected?: () => void;
  disabled?: boolean;
}

export function RegulatoryTabsSection({
  markets,
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
  classificationSuggestions,
  onClassificationSelected,
  emdnCode,
  emdnCategoryId,
  emdnDescription,
  onEmdnChange,
  companyId,
  currentFdaCode,
  onFdaCodeSelected,
  disabled = false
}: RegulatoryTabsSectionProps) {
  const { lang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSubTab, setActiveSubTab] = useState('regulatory-info');

  // Check if in Genesis flow for visual indicators
  const returnTo = searchParams.get('returnTo');
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share' || returnTo === 'gap-analysis';

  // Check if all selected markets have risk classification (for Step 7 completion)
  const selectedMarkets = markets?.filter(m => m.selected) || [];
  const hasAllClassifications = selectedMarkets.length > 0 && selectedMarkets.every(m => m.riskClass && m.riskClass !== 'Not yet determined');



  // Handle sub-tab changes from URL search parameters
  useEffect(() => {
    const subTabFromUrl = searchParams.get('subtab');
    if (subTabFromUrl && subTabFromUrl !== activeSubTab) {
      setActiveSubTab(subTabFromUrl);
    }
  }, [searchParams, activeSubTab]);

  // Update URL when sub-tab changes
  const handleSubTabChange = (newSubTab: string) => {
    setActiveSubTab(newSubTab);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('subtab', newSubTab);
    // Clear section param for regulatory tab (not used for step disambiguation)
    newSearchParams.delete('section');
    setSearchParams(newSearchParams);
  };

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <Tabs value={activeSubTab} onValueChange={handleSubTabChange} className="w-full">
        <div className="overflow-x-auto w-full bg-muted rounded-md">
        <TabsList className="inline-flex w-full justify-between gap-2 p-1 bg-transparent xl:grid xl:grid-cols-5">
          <TabsTrigger value="regulatory-info">{lang('regulatory.tabs.regulatoryInfo')}</TabsTrigger>
          <TabsTrigger value="ai-suggestions">{lang('regulatory.tabs.aiClassification')}</TabsTrigger>
          <TabsTrigger value="regulatory-dna">{lang('regulatory.tabs.regulatoryDna')}</TabsTrigger>
          <TabsTrigger value="emdn-classification">{lang('regulatory.tabs.emdnCode')}</TabsTrigger>
          <TabsTrigger value="fda-search">{lang('regulatory.tabs.fdaSearch')}</TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="regulatory-info" className="space-y-6">
          <RegulatoryCardsSection
            markets={markets}
            onMarketsChange={onMarketsChange}
            onMarketComponentClassificationChange={onMarketComponentClassificationChange}
            primaryRegulatoryType={primaryRegulatoryType}
            keyTechnologyCharacteristics={keyTechnologyCharacteristics}
            onKeyTechnologyCharacteristicsChange={onKeyTechnologyCharacteristicsChange}
            deviceComponents={deviceComponents}
            productId={productId}
            projectedLaunchDate={projectedLaunchDate}
            productData={productData}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="ai-suggestions" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="regulatory-dna" className="space-y-6">
          <RegulatoryDNASection
            productId={productId}
            emdnCode={emdnCode}
            currentFdaCode={currentFdaCode}
            isLoading={isLoading}
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
              {/* Fallback display when selector is empty but emdnCode exists */}
              {!emdnCategoryId && emdnCode && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
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