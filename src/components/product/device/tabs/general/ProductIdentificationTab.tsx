import React, { useState, useCallback } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Package, Lock, AlertTriangle } from "lucide-react";
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
import { ProductPlatformSelector } from '../../../ProductPlatformSelector';
import { DeviceCategorySelector } from '../../../DeviceCategorySelector';
import { ProductModelSelector } from '../../../ProductModelSelector';
import { useTranslation } from '@/hooks/useTranslation';
import { useProductUDI } from '@/hooks/useProductUDI';

interface ProductIdentificationTabProps {
  productName: string;
  registrationNumber?: string;
  tradeName?: string;
  modelReference?: string;
  deviceCategory?: string;
  udiDi?: string;
  basicUdiDi?: string;
  emdnCategoryId?: string;
  emdnCode?: string;
  emdnDescription?: string;
  productType?: string;
  product_platform?: string;
  parent_product_id?: string;
  base_product_name?: string;
  company_id?: string;
  productId?: string;
  variant_tags?: Record<string, string> | null;
  referenceNumber?: string;
  onReferenceNumberChange?: (value: string) => void;
  onProductNameChange: (value: string) => void;
  onTradeNameChange?: (value: string) => void;
  onModelReferenceChange?: (value: string) => void;
  onDeviceCategoryChange?: (value: string) => void;
  onUdiDiChange?: (value: string) => void;
  onBasicUdiDiChange?: (value: string) => void;
  onEmdnChange?: (categoryId: string, code: string, description: string) => void;
  onProductPlatformChange?: (platform: string) => void;
  onBaseProductSelect?: (productId: string) => void;
  onPlatformAndBaseSelect?: (platform: string, baseProductId: string) => void;
  isLoading?: boolean;
  eudamedLockedFields?: Record<string, boolean | { locked: true; eudamedValue: boolean | string }>;
}

export function ProductIdentificationTab({
  productName,
  tradeName,
  modelReference,
  deviceCategory,
  udiDi: _legacyUdiDi,
  basicUdiDi: _legacyBasicUdiDi,
  productType,
  product_platform,
  parent_product_id,
  base_product_name,
  company_id,
  productId,
  variant_tags,
  referenceNumber,
  registrationNumber,
  onReferenceNumberChange,
  onProductNameChange,
  onTradeNameChange,
  onModelReferenceChange,
  onDeviceCategoryChange,
  onUdiDiChange,
  onBasicUdiDiChange,
  onProductPlatformChange,
  onBaseProductSelect,
  onPlatformAndBaseSelect,
  isLoading,
  eudamedLockedFields
}: ProductIdentificationTabProps) {
  const { lang } = useTranslation();
  const [searchParams] = useSearchParams();
  const { productId: urlProductId } = useParams<{ productId: string }>();
  const returnTo = searchParams.get('returnTo');
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share' || returnTo === 'gap-analysis';

  const t = (key: string, fallback: string) => {
    const v = lang(key);
    return v === key ? fallback : v;
  };
  
  const { displayUdiDi, displayBasicUdiDi, variantCount } = useProductUDI(productId || urlProductId);

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
    if (field === 'deviceName') onProductNameChange(value);
    else if (field === 'tradeName') onTradeNameChange?.(value);
    else if (field === 'deviceModel') onModelReferenceChange?.(value);
    setPendingOverride(null);
    setOverrideWarningOpen(false);
  }, [pendingOverride, onProductNameChange, onTradeNameChange]);

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Registration Number */}
        <div className="col-span-2 p-3 bg-muted/50 rounded-lg border">
          <Label htmlFor="registration-number" className="text-sm font-medium">
            Registration Number
          </Label>
          <p className="text-sm font-mono text-foreground mt-1">
            {registrationNumber || referenceNumber || 'Not specified'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Manufacturer-assigned registration number — managed in Identification → EUDAMED &amp; Compliance
          </p>
        </div>

        <div className={isInGenesisFlow ? `p-3 rounded-lg transition-colors ${productName?.trim() ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}>
          <Label htmlFor="product-name">
            {lang('deviceBasics.identification.deviceNameLabel')}
            {renderFieldBadges('deviceName', productName)}
          </Label>
          <Input
            id="product-name"
            value={productName}
            onChange={(e) => handleLockedFieldChange('deviceName', e.target.value, onProductNameChange)}
            placeholder={lang('deviceBasics.identification.deviceNamePlaceholder')}
            disabled={isLoading}
            maxLength={255}
          />
          <p className="text-xs text-muted-foreground mt-1">{lang('deviceBasics.identification.deviceNameHelper')}</p>
        </div>
        <div>
          <Label htmlFor="trade-name">
            {lang('deviceBasics.identification.tradeNameLabel')}
            {renderFieldBadges('tradeName', tradeName)}
          </Label>
          <Input
            id="trade-name"
            value={tradeName || ''}
            onChange={(e) => handleLockedFieldChange('tradeName', e.target.value, (v) => onTradeNameChange?.(v))}
            placeholder={lang('deviceBasics.identification.tradeNamePlaceholder')}
            disabled={isLoading}
            maxLength={255}
          />
          <p className="text-xs text-muted-foreground mt-1">{lang('deviceBasics.identification.tradeNameHelper')}</p>
        </div>
        
        {/* UDI-DI and Basic UDI-DI - Read-only from UDI Management */}
        {(displayUdiDi || displayBasicUdiDi || variantCount > 0) && (
          <div className="col-span-2 p-3 bg-muted/50 rounded-lg border">
            <p className="text-xs text-muted-foreground mb-2">
              {lang('deviceBasics.identification.udiManagedInIdentificationTab')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {displayUdiDi && (
                <div>
                  <span className="text-xs font-medium">
                    {lang('deviceBasics.identification.udiDiLabel')}
                    {renderFieldBadges('udiDi', displayUdiDi)}
                  </span>
                  <p className="text-sm font-mono text-foreground">{displayUdiDi}</p>
                </div>
              )}
              {variantCount > 1 && !displayUdiDi && (
                <div>
                  <span className="text-xs font-medium">{lang('deviceBasics.identification.udiDiLabel')}</span>
                  <p className="text-sm text-muted-foreground italic">{variantCount} variants - see UDI Management</p>
                </div>
              )}
              {displayBasicUdiDi && (
                <div>
                  <span className="text-xs font-medium">
                    {lang('deviceBasics.identification.basicUdiDiLabel')}
                    {renderFieldBadges('basicUdiDi', displayBasicUdiDi)}
                  </span>
                  <p className="text-sm font-mono text-foreground">{displayBasicUdiDi}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="device-category">{lang('deviceBasics.identification.deviceCategoryLabel')}</Label>
          <DeviceCategorySelector
            companyId={company_id || ''}
            value={deviceCategory || ''}
            onValueChange={(val) => onDeviceCategoryChange?.(val)}
            placeholder={lang('deviceBasics.identification.deviceCategoryPlaceholder')}
          />
        </div>
        
        {(productType === 'line_extension' || productType === 'legacy_product') && (
          <div>
            <Label className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-purple-600" />
              {lang('deviceBasics.identification.productFamilyLabel')}
            </Label>
            <ProductPlatformSelector
              companyId={company_id!}
              selectedPlatform={product_platform}
              onPlatformSelect={(platform) => {
                onProductPlatformChange?.(platform);
              }}
              onBaseProductSelect={(platform, baseProductId) => {
                onProductPlatformChange?.(platform);
                onBaseProductSelect?.(baseProductId);
              }}
              onPlatformAndBaseSelect={onPlatformAndBaseSelect}
              currentProductId={productId}
            />
          </div>
        )}

        <div className="flex flex-col mt-1">
          <Label htmlFor="model-reference">
            {lang('deviceBasics.identification.modelReferenceLabel')}
            {renderFieldBadges('deviceModel', modelReference)}
          </Label>
            <ProductModelSelector
              companyId={company_id || ''}
              value={modelReference || ''}
              onValueChange={(val) => handleLockedFieldChange('deviceModel', val, (v) => onModelReferenceChange?.(v))}
              placeholder={lang('deviceBasics.identification.modelReferencePlaceholder')}
              disabled={isLoading}
              className="justify-start mt-1"
            />
        </div>
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
