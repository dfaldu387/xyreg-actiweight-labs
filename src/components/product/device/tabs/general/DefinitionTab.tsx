import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RichTextField } from '@/components/shared/RichTextField';
import { useSearchParams, useParams } from 'react-router-dom';
import { PendingFieldSuggestion } from '@/components/product/device/PendingFieldSuggestion';
import { ProductFieldSuggestion } from '@/hooks/useProductFieldSuggestions';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HelpCircle, Package, Lock, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { InheritanceExclusionPopover } from '@/components/shared/InheritanceExclusionPopover';
import { resolveFieldValue, normalizeScopeValue } from '@/hooks/useAutoSyncScope';
import { markdownToHtml } from '@/utils/markdownToHtml';
import { GovernanceBookmark } from '@/components/ui/GovernanceBookmark';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AISuggestionReviewDialog } from '@/components/product/ai-assistant/AISuggestionReviewDialog';
import { AIExplainerDialog } from '@/components/product/ai-assistant/AIExplainerDialog';
import { InvestorVisibleBadge } from '@/components/ui/investor-visible-badge';
import { useInvestorFlow } from '@/hooks/useInvestorFlow';
import { useTranslation } from '@/hooks/useTranslation';
import { productDefinitionAIService, DeviceContext, hasMinimumContext } from '@/services/productDefinitionAIService';
import { toast } from 'sonner';
import { ProductPlatformSelector } from '../../../ProductPlatformSelector';
import { DeviceCategorySelector } from '../../../DeviceCategorySelector';
import { ProductModelSelector } from '../../../ProductModelSelector';

interface ProductHazard {
  id: string;
  hazard_id: string;
  description: string;
  category?: string;
}

interface DeviceComponent {
  name: string;
  description: string;
}

type SuggestionFieldKey = 'product_name' | 'trade_name' | 'description';

const AI_FIELD_CONFIGS: Record<SuggestionFieldKey, { name: string; description: string; fieldLabel: string; fieldDescription: string; requirements: string }> = {
  product_name: {
    name: 'Device Name',
    description: 'AI will suggest a regulatory-compliant device name based on your device context.',
    fieldLabel: 'Device Name',
    fieldDescription: 'Suggest a proper regulatory-compliant device name based on the device category and description.',
    requirements: 'Provide a concise, regulatory-compliant medical device name. Do NOT include trade names or marketing language. 1 line maximum.',
  },
  trade_name: {
    name: 'Trade Name',
    description: 'AI will suggest a commercial trade name for marketing purposes.',
    fieldLabel: 'Trade Name',
    fieldDescription: 'Suggest a commercial or marketing trade name for this medical device.',
    requirements: 'Provide a catchy, memorable commercial trade name suitable for marketing. 1 line maximum.',
  },
  description: {
    name: 'Device Description',
    description: 'AI will generate a regulatory-friendly device description based on available context.',
    fieldLabel: 'Device Description',
    fieldDescription: 'Generate a concise regulatory-friendly description of the medical device based on its category and naming information.',
    requirements: 'Provide a concise product description suitable for medical device documentation. Focus on what the device is, its core technology or modality, and its high-level clinical role. Avoid marketing language.',
  },
};


interface DefinitionTabProps {
  productName?: string;
  registrationNumber?: string;
  tradeName?: string;
  modelReference?: string;
  deviceCategory?: string;
  productType?: string;
  product_platform?: string;
  parent_product_id?: string;
  base_product_name?: string;
  company_id?: string;
  productId?: string;
  variant_tags?: Record<string, string> | null;
  referenceNumber?: string;
  onReferenceNumberChange?: (value: string) => void;
  onProductNameChange?: (value: string) => void;
  onRegistrationNumberChange?: (value: string) => void;
  onTradeNameChange?: (value: string) => void;
  onModelReferenceChange?: (value: string) => void;
  onDeviceCategoryChange?: (value: string) => void;
  onUdiDiChange?: (value: string) => void;
  onBasicUdiDiChange?: (value: string) => void;
  onEmdnChange?: (categoryId: string, code: string, description: string) => void;
  onProductPlatformChange?: (platform: string) => void;
  onBaseProductSelect?: (productId: string) => void;
  onPlatformAndBaseSelect?: (platform: string, baseProductId: string) => void;
  eudamedLockedFields?: Record<string, boolean | { locked: true; eudamedValue: boolean | string }>;
  description?: string;
  onDescriptionChange?: (value: string) => void;
  isLoading?: boolean;
  belongsToFamily?: boolean;
  isMaster?: boolean;
  isVariant?: boolean;
  getFieldScope?: (key: string) => 'individual' | 'product_family';
  onFieldScopeChange?: (key: string, scope: 'individual' | 'product_family') => void;
  getGovernanceSection?: (key: string) => any;
  masterDeviceId?: string;
  masterDeviceName?: string;
  classificationExclusion?: {
    getExclusionScope: (itemId: string) => import('@/hooks/useInheritanceExclusion').ItemExclusionScope;
    setExclusionScope: (itemId: string, scope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope) => void;
    getExclusionSummary: (itemId: string, totalProducts: number) => string;
  };
  autoSyncScope?: (fieldKey: string, newValue: any) => void;
  familyProductIds?: string[];
  familyProducts?: any[];
  onScopeChangeWithPropagation?: (fieldKey: string, oldScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope, newScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope) => Promise<void>;
  onAcceptAISuggestion?: (fieldType: string, suggestion: string) => void;
  fieldSuggestions?: ProductFieldSuggestion[];
  onAcceptFieldSuggestion?: (suggestion: ProductFieldSuggestion, newValue: string) => void;
  onRejectFieldSuggestion?: (suggestionId: string) => void;
}

export function DefinitionTab({
  productName = '',
  tradeName,
  modelReference,
  deviceCategory,
  productType,
  product_platform,
  company_id,
  productId,
  referenceNumber,
  registrationNumber,
  onReferenceNumberChange,
  onRegistrationNumberChange,
  onProductNameChange,
  onTradeNameChange,
  onModelReferenceChange,
  onDeviceCategoryChange,
  onProductPlatformChange,
  onBaseProductSelect,
  onPlatformAndBaseSelect,
  eudamedLockedFields,
  description,
  onDescriptionChange,
  isLoading,
  belongsToFamily = false,
  isMaster = false,
  isVariant = false,
  getFieldScope,
  onFieldScopeChange,
  getGovernanceSection,
  masterDeviceId,
  masterDeviceName,
  classificationExclusion,
  autoSyncScope,
  familyProductIds,
  familyProducts,
  onScopeChangeWithPropagation,
  onAcceptAISuggestion,
  fieldSuggestions = [],
  onAcceptFieldSuggestion,
  onRejectFieldSuggestion,
}: DefinitionTabProps) {
  const { lang } = useTranslation();
  const { isInInvestorFlow } = useInvestorFlow();
  const [searchParams] = useSearchParams();
  const { productId: urlProductId } = useParams<{ productId: string }>();
  const returnTo = searchParams.get('returnTo');
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share' || returnTo === 'gap-analysis';

  const descriptionRef = useRef<HTMLDivElement>(null);
  const [overrideWarningOpen, setOverrideWarningOpen] = useState(false);
  const [pendingOverride, setPendingOverride] = useState<{ field: string; value: string } | null>(null);
  const [confirmedOverrides, setConfirmedOverrides] = useState<Set<string>>(new Set());
  const [aiLoadingStates, setAiLoadingStates] = useState<Set<string>>(new Set());
  const [pendingSuggestion, setPendingSuggestion] = useState<{
    fieldKey: SuggestionFieldKey;
    fieldLabel: string;
    original: string;
    suggested: string;
  } | null>(null);
  const [explainerDialogField, setExplainerDialogField] = useState<SuggestionFieldKey | null>(null);

  const aiDeviceContext: DeviceContext = {
    productName: productName || '',
    deviceCategory: deviceCategory || '',
    deviceDescription: description || '',
  };

  const section = searchParams.get('section');
  useEffect(() => {
    if (section === 'description' && descriptionRef.current) {
      setTimeout(() => {
        descriptionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [section]);

  const getEudamedValue = useCallback((field: string): string | undefined => {
    if (!eudamedLockedFields) return undefined;
    const entry = eudamedLockedFields[field];
    if (entry && typeof entry === 'object' && 'eudamedValue' in entry) {
      return String(entry.eudamedValue);
    }
    return undefined;
  }, [eudamedLockedFields]);

  const isFieldLocked = useCallback((field: string): boolean => {
    if (!eudamedLockedFields) return false;
    const entry = eudamedLockedFields[field];
    return !!(entry && typeof entry === 'object' && 'locked' in entry && entry.locked);
  }, [eudamedLockedFields]);

  const isFieldOverridden = useCallback((field: string, currentValue: string | undefined): boolean => {
    const eudamedVal = getEudamedValue(field);
    if (eudamedVal === undefined) return false;
    return (currentValue || '') !== eudamedVal;
  }, [getEudamedValue]);

  const handleLockedFieldChange = useCallback((field: string, newValue: string, applyFn: (v: string) => void) => {
    if (!isFieldLocked(field)) {
      applyFn(newValue);
      return;
    }

    if (confirmedOverrides.has(field)) {
      applyFn(newValue);
      return;
    }

    const eudamedVal = getEudamedValue(field);
    if (newValue === eudamedVal) {
      applyFn(newValue);
      return;
    }

    setPendingOverride({ field, value: newValue });
    setOverrideWarningOpen(true);
  }, [isFieldLocked, getEudamedValue, confirmedOverrides]);

  const confirmOverride = useCallback(() => {
    if (!pendingOverride) return;
    const { field, value } = pendingOverride;
    setConfirmedOverrides(prev => new Set(prev).add(field));
    if (field === 'deviceName') onProductNameChange?.(value);
    else if (field === 'tradeName') onTradeNameChange?.(value);
    else if (field === 'deviceModel') onModelReferenceChange?.(value);
    setPendingOverride(null);
    setOverrideWarningOpen(false);
  }, [pendingOverride, onProductNameChange, onTradeNameChange, onModelReferenceChange]);

  const setAiLoading = useCallback((fieldKey: SuggestionFieldKey, loading: boolean) => {
    setAiLoadingStates(prev => {
      const next = new Set(prev);
      if (loading) next.add(fieldKey);
      else next.delete(fieldKey);
      return next;
    });
  }, []);

  const isAiLoading = useCallback((fieldKey: SuggestionFieldKey) => aiLoadingStates.has(fieldKey), [aiLoadingStates]);

  const openAiExplainerDialog = useCallback((fieldKey: SuggestionFieldKey) => {
    const validation = hasMinimumContext(aiDeviceContext);
    if (!validation.valid) {
      toast.error('Please fill in at least a Device Name or Device Category before using AI suggestions.', { duration: 6000 });
      return;
    }
    setExplainerDialogField(fieldKey);
  }, [aiDeviceContext]);

  const handleAiGenerationConfirm = useCallback(async (additionalInstructions: string = '', outputLanguage: string = 'en') => {
    if (!explainerDialogField || !company_id) return;

    const fieldKey = explainerDialogField;
    const config = AI_FIELD_CONFIGS[fieldKey];

    const langSuffix = outputLanguage !== 'en'
      ? `\nGenerate the response in ${outputLanguage === 'de' ? 'German' : outputLanguage === 'fr' ? 'French' : outputLanguage === 'fi' ? 'Finnish' : 'English'}.`
      : '';
    const userRequirements = additionalInstructions ? `${config.requirements}\n${additionalInstructions}${langSuffix}` : `${config.requirements}${langSuffix}`;

    setExplainerDialogField(null);
    setAiLoading(fieldKey, true);

    const currentValue = fieldKey === 'product_name' ? (productName || '') : fieldKey === 'trade_name' ? (tradeName || '') : (description || '');

    try {
      const response = await productDefinitionAIService.generateConciseFieldSuggestion(
        productName || 'Current Medical Device',
        config.fieldLabel,
        config.fieldDescription,
        currentValue,
        fieldKey,
        company_id,
        userRequirements,
        aiDeviceContext,
      );

      if (response.success && response.suggestions?.[0]) {
        setPendingSuggestion({
          fieldKey,
          fieldLabel: config.fieldLabel,
          original: currentValue,
          suggested: markdownToHtml(response.suggestions[0].suggestion),
        });
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
    } finally {
      setAiLoading(fieldKey, false);
    }
  }, [explainerDialogField, company_id, productName, tradeName, description, aiDeviceContext, setAiLoading]);

  const renderAISparkleButton = useCallback((fieldKey: SuggestionFieldKey) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-transparent"
            disabled={!company_id || !!isLoading || isAiLoading(fieldKey)}
            onClick={() => openAiExplainerDialog(fieldKey)}
          >
            {isAiLoading(fieldKey) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-amber-500" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{lang('devicePurpose.aiSuggestion')}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ), [company_id, openAiExplainerDialog, isAiLoading, isLoading, lang]);

  const renderFieldBadges = (field: string, currentValue: string | undefined) => {
    if (!isFieldLocked(field)) return null;
    const overridden = isFieldOverridden(field, currentValue);
    return (
      <span className="inline-flex items-center gap-1 ml-2">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-blue-50 text-blue-700 border-blue-200">
          <Lock className="h-3 w-3 mr-0.5" />
          EUDAMED
        </Badge>
        {overridden && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-amber-50 text-amber-700 border-amber-200">
            <AlertTriangle className="h-3 w-3 mr-0.5" />
            Overridden
          </Badge>
        )}
      </span>
    );
  };

  const getGovIcon = (sectionKey: string) => {
    const gov = getGovernanceSection?.(sectionKey);
    if (gov && gov.status !== 'draft') {
      return (
        <GovernanceBookmark
          status={gov.status}
          designReviewId={gov.design_review_id}
          verdictComment={gov.verdict_comment}
          approvedAt={gov.approved_at}
          productId={productId}
          sectionLabel={sectionKey}
        />
      );
    }
    return <GovernanceBookmark status={null} />;
  };

  const getMatchingProductIds = useCallback((fieldKey: string, currentValue: any): string[] | undefined => {
    if (!familyProducts?.length || !productId) return undefined;
    const currentNormalized = JSON.stringify(normalizeScopeValue(fieldKey, currentValue));
    return familyProducts
      .filter(p => {
        if (p.id === productId) return true;
        return JSON.stringify(normalizeScopeValue(fieldKey, resolveFieldValue(p, fieldKey))) === currentNormalized;
      })
      .map(p => p.id);
  }, [familyProducts, productId]);

  const getMatchSummary = useCallback((fieldKey: string, currentValue: any) => {
    const matchIds = getMatchingProductIds(fieldKey, currentValue);
    if (!matchIds || !familyProducts?.length) return undefined;
    return `${matchIds.length}/${familyProducts.length}`;
  }, [getMatchingProductIds, familyProducts]);

  const createValueMatchScopeChange = useCallback((fieldKey: string, currentValue: any) => {
    return (id: string, newScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope) => {
      if (onScopeChangeWithPropagation && familyProducts?.length) {
        const matchIds = getMatchingProductIds(fieldKey, currentValue);
        const nonMatchingIds = matchIds
          ? (familyProductIds || []).filter(pid => !matchIds.includes(pid))
          : [];
        const oldScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope = {
          excludedProductIds: nonMatchingIds,
          excludedCategories: [],
          isManualGroup: true,
        };
        return onScopeChangeWithPropagation(id, oldScope, newScope);
      } else if (classificationExclusion) {
        return classificationExclusion.setExclusionScope(id, newScope);
      }
    };
  }, [onScopeChangeWithPropagation, familyProducts, getMatchingProductIds, familyProductIds, classificationExclusion]);

  const renderScopeAndGov = (fieldKey: string, hideScope = false, currentValue?: any) => (
    <div className="flex items-center gap-0.5 ml-auto">
      {!hideScope && company_id && productId && classificationExclusion ? (
        <InheritanceExclusionPopover
          companyId={company_id}
          currentProductId={productId}
          itemId={fieldKey}
          exclusionScope={classificationExclusion.getExclusionScope(fieldKey)}
          onScopeChange={createValueMatchScopeChange(fieldKey, currentValue)}
          defaultCurrentDeviceOnly
          familyProductIds={familyProductIds}
          summaryText={getMatchSummary(fieldKey, currentValue)}
          valueMatchingProductIds={getMatchingProductIds(fieldKey, currentValue)}
        />
      ) : null}
      {getGovIcon(fieldKey)}
    </div>
  );

  const wrapWithOverlay = (_fieldKey: string, children: React.ReactNode) => children;

  const renderFieldSuggestion = (fieldKey: string) => {
    const s = fieldSuggestions.find(fs => fs.field_key === fieldKey);
    if (!s) return null;
    return (
      <PendingFieldSuggestion
        fieldLabel={s.field_label}
        suggestedValue={s.suggested_value}
        onAccept={() => onAcceptFieldSuggestion?.(s, s.suggested_value)}
        onReject={() => onRejectFieldSuggestion?.(s.id)}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center">
            <Label htmlFor="registration-number">Registration Number</Label>
            {renderScopeAndGov('definition_registrationNumber', true)}
          </div>
          <Input
            id="registration-number"
            value={registrationNumber || ''}
            onChange={(e) => onRegistrationNumberChange?.(e.target.value)}
            placeholder="Enter registration number"
            disabled={isLoading}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Manufacturer-assigned registration number — mirrored to EUDAMED &amp; Compliance
          </p>
        </div>

        <div className={isInGenesisFlow ? `p-3 rounded-lg transition-colors ${productName?.trim() ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}>
          <div className="flex items-center">
            <Label htmlFor="product-name">
              {lang('deviceBasics.identification.deviceNameLabel')}
              {renderFieldBadges('deviceName', productName)}
            </Label>
            {renderAISparkleButton('product_name')}
            {renderScopeAndGov('definition_deviceName', true)}
          </div>
          <Input
            id="product-name"
            value={productName}
            onChange={(e) => handleLockedFieldChange('deviceName', e.target.value, (v) => onProductNameChange?.(v))}
            placeholder={lang('deviceBasics.identification.deviceNamePlaceholder')}
            disabled={isLoading}
            maxLength={255}
          />
          <p className="text-xs text-muted-foreground mt-1">{lang('deviceBasics.identification.deviceNameHelper')}</p>
          {renderFieldSuggestion('name')}
        </div>

        <div>
          <div className="flex items-center">
            <Label className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-purple-600" />
              {lang('deviceBasics.identification.productFamilyLabel')}
            </Label>
            {renderScopeAndGov('definition_platform', false, product_platform)}
          </div>
          {wrapWithOverlay('definition_platform', (
            <ProductPlatformSelector
              companyId={company_id!}
              selectedPlatform={product_platform}
              onPlatformSelect={(platform) => onProductPlatformChange?.(platform)}
              onBaseProductSelect={(platform, baseProductId) => {
                onProductPlatformChange?.(platform);
                onBaseProductSelect?.(baseProductId);
              }}
              onPlatformAndBaseSelect={onPlatformAndBaseSelect}
              currentProductId={productId}
            />
          ))}
        </div>

        <div>
          <div className="flex items-center">
            <Label htmlFor="trade-name">
              {lang('deviceBasics.identification.tradeNameLabel')}
              {renderFieldBadges('tradeName', tradeName)}
            </Label>
            {renderAISparkleButton('trade_name')}
            {renderScopeAndGov('definition_tradeName', false, tradeName)}
          </div>
          {wrapWithOverlay('definition_tradeName', (
            <>
              <Input
                id="trade-name"
                value={tradeName || ''}
                onChange={(e) => handleLockedFieldChange('tradeName', e.target.value, (v) => { onTradeNameChange?.(v); })}
                placeholder={lang('deviceBasics.identification.tradeNamePlaceholder')}
                disabled={isLoading}
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground mt-1">{lang('deviceBasics.identification.tradeNameHelper')}</p>
            </>
          ))}
          {renderFieldSuggestion('trade_name')}
        </div>

        <div>
          <div className="flex items-center">
            <Label htmlFor="device-category">{lang('deviceBasics.identification.deviceCategoryLabel')}</Label>
            {renderScopeAndGov('definition_deviceCategory', false, deviceCategory)}
          </div>
          {wrapWithOverlay('definition_deviceCategory', (
            <DeviceCategorySelector
              companyId={company_id || ''}
              value={deviceCategory || ''}
              onValueChange={(val) => { onDeviceCategoryChange?.(val); }}
              placeholder={lang('deviceBasics.identification.deviceCategoryPlaceholder')}
            />
          ))}
        </div>

        <div className="flex flex-col mt-1">
          <div className="flex items-center">
            <Label htmlFor="model-reference">
              {lang('deviceBasics.identification.modelReferenceLabel')}
              {renderFieldBadges('deviceModel', modelReference)}
            </Label>
            {renderScopeAndGov('definition_modelReference', false, modelReference)}
          </div>
          {wrapWithOverlay('definition_modelReference', (
            <ProductModelSelector
              companyId={company_id || ''}
              value={modelReference || ''}
              onValueChange={(val) => handleLockedFieldChange('deviceModel', val, (v) => { onModelReferenceChange?.(v); })}
              placeholder={lang('deviceBasics.identification.modelReferencePlaceholder')}
              disabled={isLoading}
              className="justify-start mt-1"
            />
          ))}
        </div>
      </div>

      <div ref={descriptionRef} className={isInGenesisFlow ? `p-3 rounded-lg transition-colors ${description?.trim() ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}>
        <div className="flex items-center gap-2 mb-1">
          <Label htmlFor="description">{lang('deviceBasics.definition.descriptionLabel')}</Label>
          {renderAISparkleButton('description')}
          {renderScopeAndGov('definition_description', false, description)}
          {isInInvestorFlow && <InvestorVisibleBadge />}
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                <HelpCircle className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm" align="start">
              <div className="space-y-2">
                <p className="font-medium">{lang('deviceBasics.definition.descriptionVsUseTitle')}</p>
                <div className="space-y-1.5 text-muted-foreground">
                  <p><strong className="text-foreground">{lang('deviceBasics.definition.descriptionExplain')}</strong> {lang('deviceBasics.definition.descriptionExplainText')}</p>
                  <p><strong className="text-foreground">{lang('deviceBasics.definition.intendedUseExplain')}</strong> {lang('deviceBasics.definition.intendedUseExplainText')}</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {wrapWithOverlay('definition_description', (
          <RichTextField
            value={description || ''}
            onChange={(html) => { onDescriptionChange?.(html); }}
            placeholder={lang('deviceBasics.definition.descriptionPlaceholder')}
            minHeight="100px"
            disabled={isLoading}
          />
        ))}
        {renderFieldSuggestion('description')}
        {renderFieldSuggestion('device_summary')}
      </div>

      <AIExplainerDialog
        open={explainerDialogField !== null}
        onOpenChange={(open) => !open && setExplainerDialogField(null)}
        onConfirm={handleAiGenerationConfirm}
        isLoading={explainerDialogField ? isAiLoading(explainerDialogField) : false}
        fieldName={explainerDialogField ? AI_FIELD_CONFIGS[explainerDialogField].name : ''}
        fieldDescription={explainerDialogField ? AI_FIELD_CONFIGS[explainerDialogField].description : undefined}
        productId={productId || ''}
        companyId={company_id}
      />

      <AISuggestionReviewDialog
        open={pendingSuggestion !== null}
        onOpenChange={(open) => !open && setPendingSuggestion(null)}
        fieldLabel={pendingSuggestion?.fieldLabel || ''}
        originalContent={pendingSuggestion?.original || ''}
        suggestedContent={pendingSuggestion?.suggested || ''}
        onAccept={(content) => {
          if (pendingSuggestion) {
            if (pendingSuggestion.fieldKey === 'product_name') {
              handleLockedFieldChange('deviceName', content, (value) => onProductNameChange?.(value));
            } else if (pendingSuggestion.fieldKey === 'trade_name') {
              handleLockedFieldChange('tradeName', content, (value) => onTradeNameChange?.(value));
            } else {
              onDescriptionChange?.(content);
            }
            onAcceptAISuggestion?.(pendingSuggestion.fieldKey, content);
          }
          setPendingSuggestion(null);
        }}
        onReject={() => setPendingSuggestion(null)}
      />

      <AlertDialog open={overrideWarningOpen} onOpenChange={setOverrideWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Override EUDAMED Value?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This field is sourced from the EUDAMED registry. Changing it will override the official registry value.
              The field will be marked as "Overridden" to indicate it differs from EUDAMED data.
              You can revert to the EUDAMED value at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingOverride(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOverride} className="bg-amber-600 hover:bg-amber-700">
              Override Value
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
