import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatementOfUseTab } from './StatementOfUseTab';
import { ContextOfUseTab } from './ContextOfUseTab';
import { SafetyUsageTab } from './SafetyUsageTab';
import { AdditionalInformationTab } from './AdditionalInformationTab';
import { CircularProgress } from '@/components/common/CircularProgress';
import { Loader2 } from 'lucide-react';
import { FieldSuggestion, productDefinitionAIService, DeviceContext } from '@/services/productDefinitionAIService';
import { StorageSterilityHandlingData } from '@/types/storageHandling';
import { DeviceCharacteristics } from '@/types/client.d';
import { useProductDefinition } from '@/hooks/useProductDefinition';
import { InheritanceIndicator } from '@/components/product/definition/InheritanceIndicator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Users } from 'lucide-react';
import { InvestorVisibleIcon } from '@/components/ui/investor-visible-badge';
import { useTranslation } from '@/hooks/useTranslation';
import { useFieldScopeState } from '@/hooks/useFieldScopeState';
import { useFamilyFieldValues } from '@/hooks/useFamilyFieldValues';
import { useInheritanceExclusion } from '@/hooks/useInheritanceExclusion';
import { useAutoSyncScope } from '@/hooks/useAutoSyncScope';
import { FamilyFieldEditorDialog } from '../../../shared/FamilyFieldEditorDialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Json } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { InheritableField } from '@/hooks/useVariantInheritance';
import { ProductFieldSuggestion } from '@/hooks/useProductFieldSuggestions';

interface IntendedPurposeData {
  clinicalPurpose?: string;
  indications?: string;
  targetPopulation?: string[];
  userProfile?: string;
  useEnvironment?: string[];
  durationOfUse?: string;
  modeOfAction?: string;
  warnings?: string[];
  intended_use_category?: string;
}

interface UserInstructions {
  how_to_use?: string;
  charging?: string;
  maintenance?: string;
}

interface PurposeTabsSectionProps {
  productId?: string;
  intendedUse?: string;
  intendedPurposeData?: IntendedPurposeData;
  contraindications?: string[];
  intendedUsers?: string[];
  clinicalBenefits?: string[];
  userInstructions?: UserInstructions;
  onIntendedUseChange?: (value: string) => void;
  onIntendedPurposeDataChange?: (value: IntendedPurposeData) => void;
  onContraindicationsChange?: (value: string[]) => void;
  onIntendedUsersChange?: (value: string[]) => void;
  onClinicalBenefitsChange?: (value: string[]) => void;
  onUserInstructionsChange?: (value: UserInstructions) => void;
  isLoading?: boolean;
  progress?: number;
  aiSuggestions?: FieldSuggestion[];
  onAcceptAISuggestion?: (fieldType: string, suggestion: string) => void;
  companyId?: string;
  productName?: string;
  disabled?: boolean;
  deviceContext?: DeviceContext;
  variantInheritance?: {
    isVariant: boolean;
    belongsToFamily?: boolean;
    masterDevice: { id: string; name: string } | null;
    getEffectiveValue: (fieldKey: InheritableField, localValue: any) => any;
    isFieldInherited: (fieldKey: InheritableField) => boolean;
  };
  // Storage & Handling
  storageSterilityHandling?: StorageSterilityHandlingData;
  deviceCharacteristics?: DeviceCharacteristics;
  onStorageSterilityHandlingChange?: (data: StorageSterilityHandlingData) => void;
  fieldSuggestions?: ProductFieldSuggestion[];
  onAcceptFieldSuggestion?: (suggestion: ProductFieldSuggestion, newValue: string) => void;
  onRejectFieldSuggestion?: (suggestionId: string) => void;
}

export function PurposeTabsSection({
  productId,
  intendedUse,
  intendedPurposeData = {},
  contraindications = [],
  intendedUsers = [],
  clinicalBenefits = [],
  userInstructions = {},
  onIntendedUseChange,
  onIntendedPurposeDataChange,
  onContraindicationsChange,
  onIntendedUsersChange,
  onClinicalBenefitsChange,
  onUserInstructionsChange,
  isLoading = false,
  progress = 0,
  aiSuggestions = [],
  onAcceptAISuggestion,
  companyId,
  productName,
  disabled = false,
  deviceContext,
  variantInheritance,
  storageSterilityHandling,
  deviceCharacteristics,
  onStorageSterilityHandlingChange,
  fieldSuggestions = [],
  onAcceptFieldSuggestion,
  onRejectFieldSuggestion,
}: PurposeTabsSectionProps) {
  const { activeCompanyRole } = useCompanyRole();
  const { lang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSubTab, setActiveSubTab] = useState('statement');
  const [aiLoadingStates, setAiLoadingStates] = useState<Set<string>>(new Set());
  const [activeAiButton, setActiveAiButton] = useState<string | null>(null);
  const [familyEditorOpen, setFamilyEditorOpen] = useState(false);
  // Legacy purpose-only doc dialog removed — Create Document handled at page level

  // Fetch product definition to check for inheritance
  const { data: definition } = useProductDefinition(productId);

  // Fetch basic_udi_di to determine family membership
  const { data: productBasicUdi } = useQuery({
    queryKey: ['product-basic-udi-purpose', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data } = await supabase
        .from('products')
        .select('basic_udi_di')
        .eq('id', productId)
        .single();
      return (data as any)?.basic_udi_di as string | null;
    },
    enabled: !!productId,
  });

  // Count how many products share this basic_udi_di (to suppress family warning for single-variant)
  const { data: familyVariantCount } = useQuery({
    queryKey: ['family-variant-count', productBasicUdi],
    queryFn: async () => {
      if (!productBasicUdi) return 1;
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('basic_udi_di', productBasicUdi);
      return count ?? 1;
    },
    enabled: !!productBasicUdi,
  });

  const belongsToFamily = variantInheritance?.belongsToFamily || !!definition?.modelId || !!productBasicUdi;
  const isVariant = !!variantInheritance?.isVariant;
  const isMaster = belongsToFamily && !isVariant;
  const showFieldScopeToggles = belongsToFamily;
  const { getFieldScope, setFieldScope } = useFieldScopeState(productId, belongsToFamily);
  const { getFamilyValue: rawGetFamilyValue, hasFamilyValue: rawHasFamilyValue, saveFamilyValue, isSaving: familySaving, isLoading: familyValuesLoading } = useFamilyFieldValues(productBasicUdi, companyId);
  const fieldExclusion = useInheritanceExclusion(
    productId,
    false,
    'classification_exclusion_scopes'
  );

  // Auto-sync scope for purpose fields — uses family products as population
  const parentProductId = variantInheritance?.masterDevice?.id ?? null;
  const { syncScope: purposeSyncScope, familyProducts: purposeFamilyProducts, handleScopeChangeWithPropagation, getComputedScope } = useAutoSyncScope(
    productId, companyId, fieldExclusion, belongsToFamily, parentProductId
  );

  const familyProductIds = useMemo(
    () => (purposeFamilyProducts || []).map((p: any) => p.id),
    [purposeFamilyProducts]
  );

  // Wrap fieldExclusion to propagate values when scope changes
  const fieldExclusionWithPropagation = useMemo(() => {
    return {
      ...fieldExclusion,
      // Override getExclusionScope to return live computed scope
      getExclusionScope: (itemId: string) => getComputedScope(itemId),
      setExclusionScope: (itemId: string, newScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope) => {
        const oldScope = getComputedScope(itemId);
        return handleScopeChangeWithPropagation(itemId, oldScope, newScope);
      },
    };
  }, [belongsToFamily, fieldExclusion, handleScopeChangeWithPropagation, getComputedScope]);

  // For variants: fetch master's intended_purpose_data and clinical_benefits to mirror linked fields
  const masterDeviceId = variantInheritance?.masterDevice?.id;
  const { data: masterPurposeData } = useQuery({
    queryKey: ['master-purpose-data', masterDeviceId],
    queryFn: async () => {
      if (!masterDeviceId) return null;
      const { data, error } = await supabase
        .from('products')
        .select('intended_purpose_data, clinical_benefits, intended_users, contraindications, user_instructions, storage_sterility_handling')
        .eq('id', masterDeviceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!masterDeviceId && isVariant,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Master purpose field key mapping: PF key → master data field
  const MASTER_PURPOSE_MAP: Record<string, () => Json | undefined> = {
    intendedUse: () => (masterPurposeData?.intended_purpose_data as any)?.clinicalPurpose,
    intendedFunction: () => (masterPurposeData?.intended_purpose_data as any)?.indications,
    modeOfAction: () => (masterPurposeData?.intended_purpose_data as any)?.modeOfAction,
    valueProposition: () => (masterPurposeData?.intended_purpose_data as any)?.valueProposition,
    clinicalBenefits: () => masterPurposeData?.clinical_benefits as Json | undefined,
    targetPopulation: () => (masterPurposeData?.intended_purpose_data as any)?.targetPopulation,
    userProfile: () => (masterPurposeData?.intended_purpose_data as any)?.userProfile,
    useEnvironment: () => (masterPurposeData?.intended_purpose_data as any)?.useEnvironment,
    durationOfUse: () => (masterPurposeData?.intended_purpose_data as any)?.durationOfUse,
    useTrigger: () => (masterPurposeData?.intended_purpose_data as any)?.useTrigger,
    intendedUsers: () => masterPurposeData?.intended_users as Json | undefined,
    contraindications: () => masterPurposeData?.contraindications as Json | undefined,
    warnings: () => (masterPurposeData?.intended_purpose_data as any)?.warnings,
    warningsPrecautions: () => (masterPurposeData?.intended_purpose_data as any)?.warnings,
    userInstructions_howToUse: () => (masterPurposeData?.user_instructions as any)?.how_to_use,
    userInstructions_charging: () => (masterPurposeData?.user_instructions as any)?.charging,
    userInstructions_maintenance: () => (masterPurposeData?.user_instructions as any)?.maintenance,
    sterilizationDetails: () => (masterPurposeData as any)?.storage_sterility_handling as Json | undefined,
    storageConditions: () => (masterPurposeData as any)?.storage_sterility_handling as Json | undefined,
    shelfLife: () => (masterPurposeData as any)?.storage_sterility_handling as Json | undefined,
    sideEffects: () => (masterPurposeData?.intended_purpose_data as any)?.side_effects,
    residualRisks: () => (masterPurposeData?.intended_purpose_data as any)?.residual_risks,
    interactions: () => (masterPurposeData?.intended_purpose_data as any)?.interactions,
    disposalInstructions: () => (masterPurposeData?.intended_purpose_data as any)?.disposal_instructions,
  };

  // Wrapped getFamilyValue: for variants, fall back to master's actual data
  const getFamilyValue = useCallback((fieldKey: string): Json | undefined => {
    // For variants: always prioritize master's actual current data
    if (isVariant && masterPurposeData && MASTER_PURPOSE_MAP[fieldKey]) {
      const masterVal = MASTER_PURPOSE_MAP[fieldKey]();
      if (masterVal !== undefined) return masterVal;
    }
    // For non-variant family members, use family_field_values table
    const raw = rawGetFamilyValue(fieldKey);
    if (raw !== undefined) return raw;
    return undefined;
  }, [rawGetFamilyValue, isVariant, masterPurposeData]);

  const hasFamilyValue = useCallback((fieldKey: string): boolean => {
    return getFamilyValue(fieldKey) !== undefined;
  }, [getFamilyValue]);

  const effectiveFieldScope = useCallback((fieldKey: string): 'individual' | 'product_family' => {
    if (isVariant && productId && fieldExclusion.loaded) {
      // If the device is excluded from the group for this field, it has its own value
      if (fieldExclusion.isFullyExcluded(fieldKey, productId)) return 'individual';
    }
    // When Device Applicability has a scope for this field, use local state (individual mode).
    // The Device Applicability system manages value sharing via syncScope, not via PF family values.
    if (fieldExclusion.loaded && fieldExclusion.scopes[fieldKey]) {
      return 'individual';
    }
    return getFieldScope(fieldKey);
  }, [isVariant, productId, fieldExclusion, getFieldScope]);

  const autoSyncScope = useCallback((fieldKey: string, newValue: any) => {
    if (!belongsToFamily) return;
    purposeSyncScope(fieldKey, newValue);
  }, [belongsToFamily, purposeSyncScope]);

  // Helper: check if a field should be read-only (PF mode with family value)
  const isFieldPFMode = (fieldKey: string): boolean => {
    return belongsToFamily && effectiveFieldScope(fieldKey) === 'product_family';
  };

  // Helper functions for AI loading states
  const setAiLoading = useCallback((fieldType: string, isLoading: boolean) => {
    setAiLoadingStates(prev => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(fieldType);
        setActiveAiButton(fieldType);
      } else {
        newSet.delete(fieldType);
        setActiveAiButton(currentActive => {
          const shouldClear = currentActive === fieldType;
          return shouldClear ? null : currentActive;
        });
      }
      return newSet;
    });
  }, []);

  const isAiLoading = useCallback((fieldType: string) => {
    return aiLoadingStates.has(fieldType);
  }, [aiLoadingStates]);

  const isAiButtonDisabled = useCallback((fieldType: string) => {
    return activeAiButton !== null && activeAiButton !== fieldType;
  }, [activeAiButton]);

  // Handle sub-tab changes from URL search parameters
  useEffect(() => {
    const subTabFromUrl = searchParams.get('subtab');
    if (subTabFromUrl && subTabFromUrl !== activeSubTab) {
      setActiveSubTab(subTabFromUrl);
    }
  }, [searchParams, activeSubTab]);

  // Update URL when sub-tab changes, preserving section param for step disambiguation
  const handleSubTabChange = (newSubTab: string) => {
    setActiveSubTab(newSubTab);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('subtab', newSubTab);
    
    // Set appropriate section for step disambiguation
    if (newSubTab === 'statement') {
      // Preserve existing section if set, otherwise default to intended-use (Step 1)
      if (!newSearchParams.get('section')) {
        newSearchParams.set('section', 'intended-use');
      }
    } else if (newSubTab === 'context') {
      newSearchParams.set('section', 'user-profile');
    } else {
      // Remove section for other tabs
      newSearchParams.delete('section');
    }
    
    setSearchParams(newSearchParams);
  };

  return (
    <>
      {definition?.modelId && variantInheritance?.isVariant && (
        <Alert className="mb-4 border-primary/20 bg-primary/5">
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {lang('devicePurpose.variantPartOfFamily')} <strong>"{definition.modelName}"</strong> {lang('devicePurpose.productFamily')}.
              </span>
              <InheritanceIndicator
                isInherited={definition.isInherited}
                hasOverride={definition.hasOverride}
                modelName={definition.modelName}
                overrideReason={definition.overrideReason}
                size="sm"
              />
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2" style={{ marginLeft: '5px' }}>
                <h2 className="text-md font-semibold">{lang('devicePurpose.title')}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CircularProgress percentage={progress} size={40} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
            </div>
          </CardTitle>
        </CardHeader>

      <CardContent className="space-y-4" style={{ marginTop: '-15px' }}>
        <Tabs value={activeSubTab} onValueChange={handleSubTabChange} className="w-full">
          <div className="overflow-x-auto w-full bg-muted rounded-md">
          <TabsList className="inline-flex w-full justify-between gap-2 p-1 bg-transparent xl:grid xl:grid-cols-4">
            <TabsTrigger value="statement" className={`flex items-center gap-1 ${searchParams.get('returnTo') === 'investor-share' || searchParams.get('returnTo') === 'venture-blueprint' ? '!text-indigo-600 data-[state=active]:!text-indigo-600' : ''}`}>{lang('devicePurpose.tabs.statementOfUse')} {(searchParams.get('returnTo') === 'investor-share' || searchParams.get('returnTo') === 'venture-blueprint') && <InvestorVisibleIcon className="text-indigo-600" />}</TabsTrigger>
            <TabsTrigger value="context">{lang('devicePurpose.tabs.contextOfUse')}</TabsTrigger>
            <TabsTrigger value="safety">{lang('devicePurpose.tabs.safetyUsage')}</TabsTrigger>
            <TabsTrigger value="additional">{lang('devicePurpose.tabs.additionalInfo')}</TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="statement" className="space-y-6 mt-6">
              <StatementOfUseTab
                intendedPurposeData={intendedPurposeData}
                onIntendedPurposeDataChange={onIntendedPurposeDataChange}
                clinicalBenefits={clinicalBenefits}
                onClinicalBenefitsChange={onClinicalBenefitsChange}
                isLoading={isLoading}
                aiSuggestions={aiSuggestions}
                onAcceptAISuggestion={onAcceptAISuggestion}
                companyId={companyId}
                productName={productName}
                setAiLoading={setAiLoading}
                isAiLoading={isAiLoading}
                isAiButtonDisabled={isAiButtonDisabled}
                disabled={disabled}
                deviceContext={deviceContext}
                belongsToFamily={showFieldScopeToggles}
                getFieldScope={effectiveFieldScope}
                onFieldScopeChange={setFieldScope}
                fieldExclusion={fieldExclusionWithPropagation}
                getFamilyValue={getFamilyValue}
                hasFamilyValue={hasFamilyValue}
                isFieldPFMode={isFieldPFMode}
                onEditFamily={() => setFamilyEditorOpen(true)}
                productId={productId}
                saveFamilyValue={saveFamilyValue}
                familyVariantCount={familyVariantCount ?? undefined}
                isVariant={variantInheritance?.isVariant}
                masterDeviceName={variantInheritance?.masterDevice?.name}
                masterDeviceId={variantInheritance?.masterDevice?.id}
                autoSyncScope={autoSyncScope}
                familyProductIds={familyProductIds}
                familyProducts={purposeFamilyProducts}
                onScopeChangeWithPropagation={handleScopeChangeWithPropagation}
                fieldSuggestions={fieldSuggestions}
                onAcceptFieldSuggestion={onAcceptFieldSuggestion}
                onRejectFieldSuggestion={onRejectFieldSuggestion}
              />
          </TabsContent>

          <TabsContent value="context" className="space-y-6 mt-6">
              <ContextOfUseTab
                intendedPurposeData={intendedPurposeData}
                intendedUsers={intendedUsers}
                onIntendedPurposeDataChange={onIntendedPurposeDataChange}
                onIntendedUsersChange={onIntendedUsersChange}
                isLoading={isLoading}
                aiSuggestions={aiSuggestions}
                onAcceptAISuggestion={onAcceptAISuggestion}
                companyId={companyId}
                productId={productId}
                productName={productName}
                setAiLoading={setAiLoading}
                isAiLoading={isAiLoading}
                isAiButtonDisabled={isAiButtonDisabled}
                disabled={disabled}
                deviceContext={deviceContext}
                belongsToFamily={showFieldScopeToggles}
                getFieldScope={effectiveFieldScope}
                onFieldScopeChange={setFieldScope}
                fieldExclusion={fieldExclusionWithPropagation}
                getFamilyValue={getFamilyValue}
                hasFamilyValue={hasFamilyValue}
                isFieldPFMode={isFieldPFMode}
                onEditFamily={() => setFamilyEditorOpen(true)}
                saveFamilyValue={saveFamilyValue}
                isVariant={variantInheritance?.isVariant}
                masterDeviceName={variantInheritance?.masterDevice?.name}
                masterDeviceId={variantInheritance?.masterDevice?.id}
                familyProductIds={familyProductIds}
                familyProducts={purposeFamilyProducts}
                onScopeChangeWithPropagation={handleScopeChangeWithPropagation}
                fieldSuggestions={fieldSuggestions}
                onAcceptFieldSuggestion={onAcceptFieldSuggestion}
                onRejectFieldSuggestion={onRejectFieldSuggestion}
              />
          </TabsContent>

          <TabsContent value="safety" className="space-y-6 mt-6">
              <SafetyUsageTab
                intendedPurposeData={intendedPurposeData}
                contraindications={contraindications}
                onIntendedPurposeDataChange={onIntendedPurposeDataChange}
                onContraindicationsChange={onContraindicationsChange}
                isLoading={isLoading}
                aiSuggestions={aiSuggestions}
                onAcceptAISuggestion={onAcceptAISuggestion}
                companyId={companyId}
                productName={productName}
                setAiLoading={setAiLoading}
                isAiLoading={isAiLoading}
                isAiButtonDisabled={isAiButtonDisabled}
                disabled={disabled}
                deviceContext={deviceContext}
                belongsToFamily={showFieldScopeToggles}
                getFieldScope={effectiveFieldScope}
                onFieldScopeChange={setFieldScope}
                fieldExclusion={fieldExclusionWithPropagation}
                getFamilyValue={getFamilyValue}
                hasFamilyValue={hasFamilyValue}
                isFieldPFMode={isFieldPFMode}
                onEditFamily={() => setFamilyEditorOpen(true)}
                productId={productId}
                saveFamilyValue={saveFamilyValue}
                storageSterilityHandling={
                  isVariant && (isFieldPFMode('sterilizationDetails') || isFieldPFMode('storageConditions') || isFieldPFMode('shelfLife'))
                    ? ((masterPurposeData as any)?.storage_sterility_handling as StorageSterilityHandlingData ?? storageSterilityHandling)
                    : storageSterilityHandling
                }
                deviceCharacteristics={deviceCharacteristics}
                onStorageSterilityHandlingChange={onStorageSterilityHandlingChange}
                familyVariantCount={familyVariantCount ?? undefined}
                isVariant={variantInheritance?.isVariant}
                masterDeviceName={variantInheritance?.masterDevice?.name}
                masterDeviceId={variantInheritance?.masterDevice?.id}
                autoSyncScope={autoSyncScope}
                familyProductIds={familyProductIds}
                familyProducts={purposeFamilyProducts}
                onScopeChangeWithPropagation={handleScopeChangeWithPropagation}
              />
            <AdditionalInformationTab
              userInstructions={userInstructions}
              onUserInstructionsChange={onUserInstructionsChange}
              isLoading={isLoading}
              aiSuggestions={aiSuggestions}
              onAcceptAISuggestion={onAcceptAISuggestion}
              companyId={companyId}
              productName={productName}
              productId={productId}
              setAiLoading={setAiLoading}
              isAiLoading={isAiLoading}
              isAiButtonDisabled={isAiButtonDisabled}
              disabled={disabled}
               belongsToFamily={showFieldScopeToggles}
               getFieldScope={effectiveFieldScope}
               onFieldScopeChange={setFieldScope}
               fieldExclusion={fieldExclusionWithPropagation}
               getFamilyValue={getFamilyValue}
              hasFamilyValue={hasFamilyValue}
              isFieldPFMode={isFieldPFMode}
              onEditFamily={() => setFamilyEditorOpen(true)}
              saveFamilyValue={saveFamilyValue}
              familyVariantCount={familyVariantCount ?? undefined}
              isVariant={variantInheritance?.isVariant}
              masterDeviceName={variantInheritance?.masterDevice?.name}
              masterDeviceId={variantInheritance?.masterDevice?.id}
              autoSyncScope={autoSyncScope}
              familyProductIds={familyProductIds}
              familyProducts={purposeFamilyProducts}
              onScopeChangeWithPropagation={handleScopeChangeWithPropagation}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    {productBasicUdi && (
      <FamilyFieldEditorDialog
        open={familyEditorOpen}
        onOpenChange={setFamilyEditorOpen}
        basicUdiDi={productBasicUdi}
        getFamilyValue={getFamilyValue}
        saveFamilyValue={saveFamilyValue}
        isSaving={familySaving}
      />
    )}

    {/* Create Document is now handled at page level via ProductDeviceInformationPage */}
    </>
  );
}
