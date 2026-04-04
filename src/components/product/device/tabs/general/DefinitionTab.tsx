import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { RichTextField } from '@/components/shared/RichTextField';
import { useSearchParams, useParams } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HelpCircle, Check, Package, Lock, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { InheritanceExclusionPopover } from '@/components/shared/InheritanceExclusionPopover';
import { resolveFieldValue, normalizeScopeValue } from '@/hooks/useAutoSyncScope';
import { GovernanceBookmark } from '@/components/ui/GovernanceBookmark';

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
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
import { InvestorVisibleBadge } from '@/components/ui/investor-visible-badge';
import { useInvestorFlow } from '@/hooks/useInvestorFlow';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { ProductPlatformSelector } from '../../../ProductPlatformSelector';
import { DeviceCategorySelector } from '../../../DeviceCategorySelector';
import { ProductModelSelector } from '../../../ProductModelSelector';
import { useProductUDI } from '@/hooks/useProductUDI';

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

interface DefinitionTabProps {
  // Identification fields (merged)
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
  // Definition fields
  description?: string;
  onDescriptionChange?: (value: string) => void;
  isLoading?: boolean;
  // Governance & scope
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
}: DefinitionTabProps) {
  const { lang } = useTranslation();
  const { isInInvestorFlow } = useInvestorFlow();
  const [searchParams] = useSearchParams();
  const { productId: urlProductId } = useParams<{ productId: string }>();
  const returnTo = searchParams.get('returnTo');
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share' || returnTo === 'gap-analysis';

  const descriptionRef = useRef<HTMLDivElement>(null);
  const { displayUdiDi, displayBasicUdiDi, variantCount } = useProductUDI(productId || urlProductId);

  // Auto-scroll to description section when navigated from Genesis step 2
  const section = searchParams.get('section');
  useEffect(() => {
    if (section === 'description' && descriptionRef.current) {
      setTimeout(() => {
        descriptionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [section]);

  // EUDAMED lock/override helpers
  const [overrideWarningOpen, setOverrideWarningOpen] = useState(false);
  const [pendingOverride, setPendingOverride] = useState<{ field: string; value: string } | null>(null);
  const [confirmedOverrides, setConfirmedOverrides] = useState<Set<string>>(new Set());

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
    // If already confirmed override for this field, apply directly
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
    else if (field === 'tradeName') { onTradeNameChange?.(value); }
    else if (field === 'deviceModel') { onModelReferenceChange?.(value); }
    setPendingOverride(null);
    setOverrideWarningOpen(false);
  }, [pendingOverride, onProductNameChange, onTradeNameChange, onModelReferenceChange]);

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

  // --- Value-matching helpers for Device Applicability popovers ---
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
      {!hideScope && belongsToFamily && company_id && productId && classificationExclusion ? (
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


  return (
    <div className="space-y-6">
      {/* === Product Identification Section === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Registration Number */}
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
        </div>
        {/* Device Platform - always visible, moved higher */}
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

      {/* === Description === */}
      <div ref={descriptionRef} className={isInGenesisFlow ? `p-3 rounded-lg transition-colors ${description?.trim() ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}>
        <div className="flex items-center gap-2 mb-1">
          <Label htmlFor="description">{lang('deviceBasics.definition.descriptionLabel')}</Label>
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
      </div>


      {/* EUDAMED Override Warning Dialog */}
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
