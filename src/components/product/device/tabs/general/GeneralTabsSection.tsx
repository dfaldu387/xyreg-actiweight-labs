import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress } from '@/components/common/CircularProgress';
import { Loader2 } from 'lucide-react';
import { ClassificationTab } from './ClassificationTab';
import { TechnicalSpecsTab } from './TechnicalSpecsTab';
import { DefinitionTab } from './DefinitionTab';
import { FeaturesTab } from './FeaturesTab';
import { MediaTab } from './MediaTab';
import { detectProductType } from '@/utils/productTypeDetection';
import { InvestorVisibleIcon } from '@/components/ui/investor-visible-badge';
import { useTranslation } from '@/hooks/useTranslation';
import { useFieldScopeState } from '@/hooks/useFieldScopeState';
import { useFieldGovernance } from '@/hooks/useFieldGovernance';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProductDefinition } from '@/hooks/useProductDefinition';
import { normalizeKeyFeatures } from '@/utils/keyFeaturesNormalizer';
import { useInheritanceExclusion } from '@/hooks/useInheritanceExclusion';
import { useAutoSyncScope } from '@/hooks/useAutoSyncScope';

interface GeneralTabsSectionProps {
  progress?: number;
  isLoading?: boolean;
  productId?: string;
  model_id?: string | null;
  disabled?: boolean;
  variantInheritance?: any;
  [key: string]: any;
}

export function GeneralTabsSection(props: GeneralTabsSectionProps) {
  const { lang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSubTab, setActiveSubTab] = useState('definition');

  const productType = useMemo(() => 
    detectProductType({
      project_types: props.project_types,
      is_line_extension: props.is_line_extension,
      parent_product_id: props.parent_product_id
    }), 
    [props.project_types, props.is_line_extension, props.parent_product_id]
  );

  // Family/governance setup (mirrors PurposeTabsSection)
  const { data: definition } = useProductDefinition(props.productId);
  const { data: productBasicUdi } = useQuery({
    queryKey: ['product-basic-udi-general', props.productId],
    queryFn: async () => {
      if (!props.productId) return null;
      const { data } = await supabase
        .from('products')
        .select('basic_udi_di')
        .eq('id', props.productId)
        .single();
      return (data as any)?.basic_udi_di as string | null;
    },
    enabled: !!props.productId,
  });

  const isVariant = !!props.variantInheritance?.isVariant;
  const masterDeviceId = props.variantInheritance?.masterDevice?.id;
  const masterDeviceName = props.variantInheritance?.masterDevice?.name;
  const belongsToFamily = !!definition?.modelId || !!productBasicUdi || isVariant;
  const isMaster = belongsToFamily && !isVariant;
  const showFieldScopeToggles = belongsToFamily;
  const { getFieldScope, setFieldScope } = useFieldScopeState(props.productId, belongsToFamily);
  const { getSection: getGovernanceSection } = useFieldGovernance(props.productId);

  // Classification exclusion scopes — any family member can manage
  const classificationExclusion = useInheritanceExclusion(
    props.productId,
    false,
    'classification_exclusion_scopes'
  );

  // Auto-sync scope — uses family products as population
  const parentProductId = props.variantInheritance?.parentDevice?.id ?? null;
  const { syncScope, familyProducts, handleScopeChangeWithPropagation, getComputedScope } = useAutoSyncScope(
    props.productId, (props as any).company_id, classificationExclusion, belongsToFamily, parentProductId
  );

  const familyProductIds = useMemo(
    () => (familyProducts || []).map((p) => p.id),
    [familyProducts]
  );

  const familyProductIdSet = useMemo(
    () => new Set(familyProductIds),
    [familyProductIds]
  );

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

  // Use master product data from variantInheritance (already fetched by useVariantInheritance)

  // Use master product data from variantInheritance (already fetched by useVariantInheritance)
  const masterProductData = props.variantInheritance?.masterProductData;

  // Parse master coreDeviceNature from device_type JSON (same logic as DeviceInformationContainer)
  const masterCoreDeviceNature = useMemo(() => {
    if (!masterProductData?.device_type) return '';
    try {
      let dt = masterProductData.device_type;
      if (typeof dt === 'string') dt = JSON.parse(dt);
      if (typeof dt === 'object' && dt) return dt.invasivenessLevel || '';
    } catch { /* ignore */ }
    return '';
  }, [masterProductData]);

  // Parse master isActiveDevice from key_technology_characteristics.isActive
  const masterIsActiveDevice = useMemo(() => {
    if (!masterProductData?.key_technology_characteristics) return undefined;
    const ktc = masterProductData.key_technology_characteristics;
    return ktc?.isActive;
  }, [masterProductData]);

  // Parse master keyTechnologyCharacteristics
  const masterKeyTechChars = useMemo(() => {
    if (!masterProductData?.key_technology_characteristics) return {};
    return masterProductData.key_technology_characteristics;
  }, [masterProductData]);

  // Federated model: each product always displays its own value; scope only governs propagation
  const getEffectiveValue = (_fieldKey: string, localValue: any) => localValue;

  const autoSyncScope = useCallback((fieldKey: string, newValue: any) => {
    if (!belongsToFamily) return;
    syncScope(fieldKey, newValue);
  }, [belongsToFamily, syncScope]);

  // For variants: derive effective scope from per-field exclusion map first
  const getFamilyFieldScope = useMemo(() => {
    if (!isVariant || !props.productId) return getFieldScope;

    return (fieldKey: string) => {
      if (!classificationExclusion.loaded) return getFieldScope(fieldKey);

      const scope = classificationExclusion.scopes[fieldKey];
      const excludedIds = scope?.excludedProductIds || [];
      const currentProductExcluded = excludedIds.includes(props.productId!);

      if (currentProductExcluded) return 'individual' as const;

      // If only current device remains in scope (e.g. 1/N), treat as individual.
      if (scope && familyProducts && familyProducts.length > 0) {
        const validExcludedCount = excludedIds.filter((id) => familyProductIdSet.has(id)).length;
        const includedCount = familyProducts.length - validExcludedCount;
        if (includedCount <= 1) return 'individual' as const;
      }

      if (belongsToFamily && scope) return 'product_family' as const;
      return getFieldScope(fieldKey);
    };
  }, [
    isVariant,
    props.productId,
    classificationExclusion,
    getFieldScope,
    belongsToFamily,
    familyProducts,
    familyProductIdSet,
  ]);

  // Wrap classificationExclusion to propagate values on scope change
  const classificationExclusionWithPropagation = useMemo(() => {
    if (!belongsToFamily) return undefined;
    return {
      ...classificationExclusion,
      // Override getExclusionScope to return live computed scope
      getExclusionScope: (itemId: string) => getComputedScope(itemId),
      setExclusionScope: (itemId: string, newScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope) => {
        const oldScope = getComputedScope(itemId);
        return handleScopeChangeWithPropagation(itemId, oldScope, newScope);
      },
    };
  }, [belongsToFamily, classificationExclusion, handleScopeChangeWithPropagation, getComputedScope]);

  const governanceProps = {
    belongsToFamily: showFieldScopeToggles || isMaster,
    isMaster,
    isVariant,
    getFieldScope: isVariant ? getFamilyFieldScope : getFieldScope,
    onFieldScopeChange: setFieldScope,
    getGovernanceSection,
    productId: props.productId,
    masterDeviceId,
    masterDeviceName,
    companyId: (props as any).company_id,
    classificationExclusion: classificationExclusionWithPropagation,
    autoSyncScope,
    familyProductIds,
    parentProductId,
    familyProducts,
    onScopeChangeWithPropagation: handleScopeChangeWithPropagation,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2" style={{ marginLeft: '5px' }}>
              <h2 className="text-md font-semibold">{lang('deviceBasics.title')}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CircularProgress percentage={props.progress || 0} size={40} />
              </div>
            </div>
            {props.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className={`space-y-4 ${props.disabled ? 'opacity-60 pointer-events-none' : ''}`} style={{ marginTop: '-15px' }}>
        <Tabs value={activeSubTab} onValueChange={handleSubTabChange} className="w-full">
          <div className="overflow-x-auto w-full bg-muted rounded-md">
          <TabsList className="inline-flex w-full justify-between gap-2 p-1 bg-transparent xl:grid xl:grid-cols-5">
            <TabsTrigger value="definition">{lang('deviceBasics.tabs.definition')}</TabsTrigger>
            <TabsTrigger value="classification">{lang('deviceBasics.tabs.type')}</TabsTrigger>
            <TabsTrigger value="features">{lang('deviceBasics.tabs.features')}</TabsTrigger>
            <TabsTrigger value="technical">{lang('deviceBasics.tabs.technicalSpecs')}</TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-1">{lang('deviceBasics.tabs.media')} {(searchParams.get('returnTo') === 'investor-share' || searchParams.get('returnTo') === 'venture-blueprint') && <InvestorVisibleIcon />}</TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="definition" className="space-y-6 mt-6">
            <DefinitionTab
              {...props as any}
              productType={productType}
              referenceNumber={props.referenceNumber}
              onReferenceNumberChange={props.onReferenceNumberChange}
              tradeName={getEffectiveValue('definition_tradeName', props.tradeName)}
              deviceCategory={getEffectiveValue('definition_deviceCategory', props.deviceCategory)}
              description={getEffectiveValue('definition_description', props.description)}
              modelReference={getEffectiveValue('definition_modelReference', props.modelReference)}
              {...governanceProps}
            />
          </TabsContent>

          <TabsContent value="classification" className="space-y-6 mt-6">
            <ClassificationTab
              {...props as any}
              primaryRegulatoryType={getEffectiveValue('classification_primaryRegulatoryType', props.primaryRegulatoryType)}
              coreDeviceNature={getEffectiveValue('classification_coreDeviceNature', props.coreDeviceNature)}
              isActiveDevice={getEffectiveValue('classification_isActiveDevice', props.isActiveDevice)}
              keyTechnologyCharacteristics={props.keyTechnologyCharacteristics}
              masterKeyTechnologyCharacteristics={masterKeyTechChars}
              {...governanceProps}
            />
          </TabsContent>

          <TabsContent value="features" className="space-y-6 mt-6">
            <FeaturesTab
              {...props as any}
              deviceComponents={props.deviceComponents}
              masterKeyFeatures={masterProductData ? normalizeKeyFeatures(masterProductData.key_features) : undefined}
              masterDeviceComponents={masterProductData?.device_components}
              {...governanceProps}
            />
          </TabsContent>

          <TabsContent value="technical" className="space-y-6 mt-6">
            <TechnicalSpecsTab
              {...props as any}
              keyTechnologyCharacteristics={getEffectiveValue('technical_keyTechnologyCharacteristics', props.keyTechnologyCharacteristics)}
              {...governanceProps}
            />
          </TabsContent>

          <TabsContent value="media" className="space-y-6 mt-6">
            <MediaTab {...props as any} {...governanceProps} />
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}
