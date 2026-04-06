import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { HelpTooltip } from '../../sections/HelpTooltip';
import { DeviceCharacteristics } from '@/types/client.d';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { Lock, AlertTriangle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

import { GovernanceBookmark } from '@/components/ui/GovernanceBookmark';

import { InheritanceExclusionPopover } from '@/components/shared/InheritanceExclusionPopover';
import { resolveFieldValue, normalizeScopeValue } from '@/hooks/useAutoSyncScope';
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

interface ClassificationTabProps {
  primaryRegulatoryType?: string;
  coreDeviceNature?: string;
  isActiveDevice?: boolean;
  keyTechnologyCharacteristics?: DeviceCharacteristics;
  masterKeyTechnologyCharacteristics?: DeviceCharacteristics;
  onPrimaryRegulatoryTypeChange?: (value: string) => void;
  onCoreDeviceNatureChange?: (value: string) => void;
  onIsActiveDeviceChange?: (value: boolean) => void;
  onKeyTechnologyCharacteristicsChange?: (value: DeviceCharacteristics) => void;
  isLoading?: boolean;
  eudamedLockedFields?: Record<string, boolean | { locked: true; eudamedValue: boolean | string }>;
  // Governance & scope
  belongsToFamily?: boolean;
  isMaster?: boolean;
  isVariant?: boolean;
  getFieldScope?: (key: string) => 'individual' | 'product_family';
  onFieldScopeChange?: (key: string, scope: 'individual' | 'product_family') => void;
  getGovernanceSection?: (key: string) => any;
  productId?: string;
  masterDeviceId?: string;
  masterDeviceName?: string;
  companyId?: string;
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

const tooltipDefinitions = {
  'medical-device': 'Any instrument, apparatus, appliance, software, implant, reagent, material or other article intended by the manufacturer to be used for medical purposes.',
  'ivd': 'Device intended to perform in vitro examination of specimens derived from the human body, primarily for diagnosis, prevention, monitoring of disease, or determining compatibility for blood transfusion.',
  'system-procedure-pack': 'Combination of products packaged together and placed on the market with the purpose of being used for a specific medical purpose.',
  'non-invasive': 'Device that does not penetrate inside the body, either through a body orifice or through the surface of the body.',
  'invasive': 'Device that penetrates inside the body, either through a body orifice or through the surface of the body.',
  'surgically-invasive': 'Device that penetrates inside the body through the surface of the body, by way of surgery.',
  'implantable': 'Device intended to be totally or partially introduced into the human body or a natural orifice by surgical intervention and intended to remain after the procedure.'
};

export function ClassificationTab({
  primaryRegulatoryType,
  coreDeviceNature,
  isActiveDevice,
  keyTechnologyCharacteristics: rawKeyTechnologyCharacteristics = {},
  masterKeyTechnologyCharacteristics = {},
  onPrimaryRegulatoryTypeChange,
  onCoreDeviceNatureChange,
  onIsActiveDeviceChange,
  onKeyTechnologyCharacteristicsChange,
  isLoading,
  eudamedLockedFields = {},
  belongsToFamily = false,
  isMaster = false,
  isVariant = false,
  getFieldScope,
  onFieldScopeChange,
  getGovernanceSection,
  productId,
  masterDeviceId,
  masterDeviceName,
  companyId,
  classificationExclusion,
  autoSyncScope,
  familyProductIds,
  familyProducts,
  onScopeChangeWithPropagation,
}: ClassificationTabProps) {
  const { lang } = useTranslation();
  const [searchParams] = useSearchParams();
  const [pendingChange, setPendingChange] = useState<{ field: string; value: any } | null>(null);
  
  // Check if in genesis or gap-analysis flow for visual highlighting
  const returnTo = searchParams.get('returnTo');
  const isGenesisFlow = returnTo === 'genesis' || returnTo === 'gap-analysis';
  
  // Completion states for highlighting
  const hasPrimaryRegulatoryType = Boolean(primaryRegulatoryType?.trim());
  const hasCoreDeviceNature = Boolean(coreDeviceNature?.trim());
  const hasActiveDeviceSelection = isActiveDevice !== undefined && isActiveDevice !== null;

  // EUDAMED lock helpers
  const isFieldLocked = (field: string) => {
    const entry = eudamedLockedFields[field];
    return entry === true || (typeof entry === 'object' && entry?.locked);
  };

  const getEudamedValue = (field: string) => {
    const entry = eudamedLockedFields[field];
    if (typeof entry === 'object' && entry?.locked) return entry.eudamedValue;
    return undefined;
  };

  const isStringFieldOverridden = (field: string, currentValue: string | undefined) => {
    const eudamedVal = getEudamedValue(field);
    if (eudamedVal === undefined) return false;
    // Special sentinel: 'Not Implantable' means conflict only when user picks 'Implantable'
    if (field === 'coreDeviceNature' && eudamedVal === 'Not Implantable') {
      return currentValue === 'Implantable';
    }
    return (currentValue || '') !== eudamedVal;
  };

  const isBoolFieldOverridden = (field: string, currentValue: boolean | undefined) => {
    const eudamedVal = getEudamedValue(field);
    if (eudamedVal === undefined) return false;
    return (currentValue || false) !== eudamedVal;
  };

  const renderLockBadge = (field: string, currentValue?: string | boolean) => {
    if (!isFieldLocked(field)) return null;
    const isOverridden = typeof currentValue === 'string'
      ? isStringFieldOverridden(field, currentValue)
      : isBoolFieldOverridden(field, currentValue as boolean | undefined);
    return (
      <>
        <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-700 gap-0.5">
          <Lock className="h-2.5 w-2.5" />
          EUDAMED
        </Badge>
        {isOverridden && (
          <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-700 gap-0.5">
            <AlertTriangle className="h-2.5 w-2.5" />
            Overridden
          </Badge>
        )}
      </>
    );
  };

  const handleLockedFieldChange = (field: string, value: any, applyFn: (v: any) => void) => {
    if (isFieldLocked(field)) {
      const eudamedVal = getEudamedValue(field);
      // Reverting to EUDAMED value — apply silently
      if (eudamedVal !== undefined && value === eudamedVal) {
        applyFn(value);
        return;
      }
      // 'Not Implantable' sentinel: only warn when switching TO 'Implantable'
      if (field === 'coreDeviceNature' && eudamedVal === 'Not Implantable') {
        if (value !== 'Implantable') {
          applyFn(value);
          return;
        }
      }
      setPendingChange({ field, value });
      return;
    }
    applyFn(value);
  };

  const handleOverrideConfirm = () => {
    if (!pendingChange) return;
    const { field, value } = pendingChange;
    if (field === 'primaryRegulatoryType') {
      onPrimaryRegulatoryTypeChange?.(value);
    } else if (field === 'coreDeviceNature') {
      onCoreDeviceNatureChange?.(value);
    } else if (field === 'isActive') {
      onIsActiveDeviceChange?.(value);
    }
    setPendingChange(null);
  };

  const handleCharacteristicStringChange = (field: string, value: string) => {
    if (onKeyTechnologyCharacteristicsChange) {
      onKeyTechnologyCharacteristicsChange({
        ...rawKeyTechnologyCharacteristics,
        [field]: value
      });
    }
  };

  const handleCharacteristicNumberChange = (field: string, value: number | undefined) => {
    if (onKeyTechnologyCharacteristicsChange) {
      onKeyTechnologyCharacteristicsChange({
        ...rawKeyTechnologyCharacteristics,
        [field]: value
      });
    }
  };

  const getSurfaceAreaHelpText = (location: string) => {
    const helpTexts: { [key: string]: string } = {
      'skin_surface': 'Surface area in contact with intact skin (cm²)',
      'wounded_skin': 'Surface area in contact with breached or compromised skin surfaces (cm²)',
      'cardiovascular_system': 'Surface area in contact with cardiovascular system (cm²)',
      'central_nervous_system': 'Surface area in contact with central nervous system (cm²)'
    };
    return helpTexts[location] || 'Surface area of device-body contact (cm²)';
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

  // --- Value-matching helpers ---
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

  const renderScopeAndGov = (fieldKey: string, currentValue?: any) => (
    <div className="flex items-center gap-0.5 ml-auto">
      {companyId && classificationExclusion && productId ? (
        <InheritanceExclusionPopover
          companyId={companyId}
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

  // In federated family mode, classification values are edited directly on each device.
  const resolveSubField = (subField: string, _scopeKey: string) => {
    return (rawKeyTechnologyCharacteristics as any)?.[subField];
  };

  const keyTechnologyCharacteristics = {
    ...rawKeyTechnologyCharacteristics,
    anatomicalLocation: resolveSubField('anatomicalLocation', 'classification_anatomicalLocation') ?? rawKeyTechnologyCharacteristics?.anatomicalLocation,
    surfaceArea: resolveSubField('surfaceArea', 'classification_surfaceArea') ?? rawKeyTechnologyCharacteristics?.surfaceArea,
    isSystemOrProcedurePack: resolveSubField('isSystemOrProcedurePack', 'classification_systemProcedurePack') ?? rawKeyTechnologyCharacteristics?.isSystemOrProcedurePack,
    isActive: resolveSubField('isActive', 'classification_isActiveDevice') ?? rawKeyTechnologyCharacteristics?.isActive,
  };

  const wrapWithOverlay = (_fieldKey: string, children: React.ReactNode) => children;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-8">
        {/* Primary Regulatory Type - with genesis highlighting */}
        <div 
          id="primary-regulatory-type-section"
          className={cn(
            "flex-1 p-4 rounded-lg transition-colors",
            isGenesisFlow && !hasPrimaryRegulatoryType && "border-2 border-amber-400 dark:border-amber-500 bg-amber-50/50 dark:bg-amber-950/30",
            isGenesisFlow && hasPrimaryRegulatoryType && "border-2 border-emerald-400 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
          )}>
          <div className="flex items-center">
            <Label className="text-sm font-medium flex items-center">
              {lang('deviceBasics.classification.primaryRegulatoryTypeLabel')}
              {renderLockBadge('primaryRegulatoryType', primaryRegulatoryType)}
            </Label>
            {renderScopeAndGov('classification_primaryRegulatoryType', primaryRegulatoryType)}
          </div>
          {wrapWithOverlay('classification_primaryRegulatoryType', (
            <RadioGroup
              value={primaryRegulatoryType || undefined}
              onValueChange={(value) => handleLockedFieldChange('primaryRegulatoryType', value, (v) => { onPrimaryRegulatoryTypeChange?.(v); })}
              disabled={isLoading}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Medical Device (MDR)" id="medical-device" />
                <Label htmlFor="medical-device" className="flex items-center gap-2">
                  {lang('deviceBasics.classification.medicalDeviceMdr')}
                  <HelpTooltip content={lang('deviceBasics.classification.medicalDeviceTooltip')} />
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="In Vitro Diagnostic (IVD)" id="ivd" />
                <Label htmlFor="ivd" className="flex items-center gap-2">
                  {lang('deviceBasics.classification.ivdDevice')}
                  <HelpTooltip content={lang('deviceBasics.classification.ivdTooltip')} />
                </Label>
              </div>
            </RadioGroup>
          ))}
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <Label className="text-sm font-medium">{lang('deviceBasics.classification.systemProcedurePack')}</Label>
            {renderScopeAndGov('classification_systemProcedurePack', rawKeyTechnologyCharacteristics?.isSystemOrProcedurePack)}
          </div>
          {wrapWithOverlay('classification_systemProcedurePack', (
            <div className="flex items-center space-x-2 mt-2">
              <Switch
                checked={keyTechnologyCharacteristics?.isSystemOrProcedurePack || false}
                onCheckedChange={(checked) => {
                  if (onKeyTechnologyCharacteristicsChange) {
                    onKeyTechnologyCharacteristicsChange({
                      ...rawKeyTechnologyCharacteristics,
                      isSystemOrProcedurePack: checked
                    });
                  }
                }}
                disabled={isLoading}
              />
              <Label className="text-sm font-normal text-muted-foreground">
                {keyTechnologyCharacteristics?.isSystemOrProcedurePack ? 'Yes' : 'No'}
              </Label>
              <HelpTooltip content={lang('deviceBasics.classification.systemProcedurePackTooltip')} />
            </div>
          ))}
        </div>
      </div>

      {primaryRegulatoryType !== 'In Vitro Diagnostic (IVD)' && (
        <div 
          id="core-device-nature-section"
          className={cn(
            "p-4 rounded-lg transition-colors",
            isGenesisFlow && !hasCoreDeviceNature && "border-2 border-amber-400 dark:border-amber-500 bg-amber-50/50 dark:bg-amber-950/30",
            isGenesisFlow && hasCoreDeviceNature && "border-2 border-emerald-400 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
          )}>
          <div className="flex items-center">
            <Label className="text-sm font-medium flex items-center">
              {lang('deviceBasics.classification.coreDeviceNatureLabel')}
              {renderLockBadge('coreDeviceNature', coreDeviceNature)}
            </Label>
            {renderScopeAndGov('classification_coreDeviceNature', coreDeviceNature)}
          </div>
          {wrapWithOverlay('classification_coreDeviceNature', (
            <RadioGroup
              value={coreDeviceNature || undefined}
              onValueChange={(value) => handleLockedFieldChange('coreDeviceNature', value, (v) => { onCoreDeviceNatureChange?.(v); })}
              disabled={isLoading}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Non-invasive" id="non-invasive" />
                <Label htmlFor="non-invasive" className="flex items-center gap-2">
                  {lang('deviceBasics.classification.nonInvasive')}
                  <HelpTooltip content={lang('deviceBasics.classification.nonInvasiveTooltip')} />
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Invasive" id="invasive" />
                <Label htmlFor="invasive" className="flex items-center gap-2">
                  {lang('deviceBasics.classification.invasive')}
                  <HelpTooltip content={lang('deviceBasics.classification.invasiveTooltip')} />
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Surgically invasive" id="surgically-invasive" />
                <Label htmlFor="surgically-invasive" className="flex items-center gap-2">
                  {lang('deviceBasics.classification.surgicallyInvasive')}
                  <HelpTooltip content={lang('deviceBasics.classification.surgicallyInvasiveTooltip')} />
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Implantable" id="implantable" />
                <Label htmlFor="implantable" className="flex items-center gap-2">
                  {lang('deviceBasics.classification.implantable')}
                  <HelpTooltip content={lang('deviceBasics.classification.implantableTooltip')} />
                </Label>
              </div>
            </RadioGroup>
          ))}
        </div>
      )}

      {/* Anatomical Location - Critical for classification */}
      <div>
        <div className="flex items-center">
          <Label className="text-sm font-medium">{lang('deviceBasics.classification.anatomicalLocationLabel')}</Label>
          {renderScopeAndGov('classification_anatomicalLocation', rawKeyTechnologyCharacteristics?.anatomicalLocation)}
        </div>
        {wrapWithOverlay('classification_anatomicalLocation', (
          <>
            <Select
              value={keyTechnologyCharacteristics?.anatomicalLocation || ''}
              onValueChange={value => { handleCharacteristicStringChange('anatomicalLocation', value); }}
              disabled={isLoading}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={lang('deviceBasics.classification.anatomicalLocationPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_defined">{lang('deviceBasics.classification.anatomicalNotDefined')}</SelectItem>
                <SelectItem value="none">{lang('deviceBasics.classification.anatomicalNoContact')}</SelectItem>
                <SelectItem value="skin_surface">{lang('deviceBasics.classification.anatomicalSkinSurface')}</SelectItem>
                <SelectItem value="body_orifices">{lang('deviceBasics.classification.anatomicalBodyOrifices')}</SelectItem>
                <SelectItem value="wounded_skin">{lang('deviceBasics.classification.anatomicalWoundedSkin')}</SelectItem>
                <SelectItem value="cardiovascular_system">{lang('deviceBasics.classification.anatomicalCardiovascular')}</SelectItem>
                <SelectItem value="central_nervous_system">{lang('deviceBasics.classification.anatomicalCns')}</SelectItem>
                <SelectItem value="circulatory_system">{lang('deviceBasics.classification.anatomicalCirculatory')}</SelectItem>
                <SelectItem value="teeth">{lang('deviceBasics.classification.anatomicalTeeth')}</SelectItem>
                <SelectItem value="oral_cavity">{lang('deviceBasics.classification.anatomicalOralCavity')}</SelectItem>
                <SelectItem value="ear_canal">{lang('deviceBasics.classification.anatomicalEarCanal')}</SelectItem>
                <SelectItem value="nasal_cavity">{lang('deviceBasics.classification.anatomicalNasalCavity')}</SelectItem>
                <SelectItem value="pharynx">{lang('deviceBasics.classification.anatomicalPharynx')}</SelectItem>
                <SelectItem value="lacrimal_duct">{lang('deviceBasics.classification.anatomicalLacrimalDuct')}</SelectItem>
                <SelectItem value="vagina_cervix">{lang('deviceBasics.classification.anatomicalVaginaCervix')}</SelectItem>
                <SelectItem value="urethra">{lang('deviceBasics.classification.anatomicalUrethra')}</SelectItem>
                <SelectItem value="rectum">{lang('deviceBasics.classification.anatomicalRectum')}</SelectItem>
                <SelectItem value="other">{lang('deviceBasics.classification.anatomicalOther')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {lang('deviceBasics.classification.anatomicalLocationHelper')}
            </p>
          </>
        ))}
      </div>

      {/* Surface Area - ISO 10993-17 requirement, inherits scope from Anatomical Location */}
      {keyTechnologyCharacteristics?.anatomicalLocation &&
       keyTechnologyCharacteristics?.anatomicalLocation !== 'not_defined' &&
       keyTechnologyCharacteristics?.anatomicalLocation !== 'none' && (
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            {lang('deviceBasics.classification.surfaceAreaLabel')}
            <HelpTooltip content={getSurfaceAreaHelpText(keyTechnologyCharacteristics?.anatomicalLocation)} />
          </Label>
            <div className="flex items-center gap-3 mt-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder={lang('deviceBasics.classification.surfaceAreaPlaceholder')}
                value={rawKeyTechnologyCharacteristics?.surfaceArea ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  handleCharacteristicNumberChange('surfaceArea', value);
                }}
                disabled={isLoading}
                className="max-w-[180px]"
              />
              <span className="text-sm text-muted-foreground">cm²</span>
              {(() => {
                const area = rawKeyTechnologyCharacteristics?.surfaceArea;
                if (area == null) return null;
                const val = typeof area === 'number' ? area : parseFloat(String(area));
                if (isNaN(val)) return null;
                const { label, color } = val <= 0.5
                  ? { label: 'Limited (≤0.5 cm²)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' }
                  : val <= 10
                  ? { label: 'Moderate (0.5–10 cm²)', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' }
                  : val <= 100
                  ? { label: 'Significant (10–100 cm²)', color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800' }
                  : val <= 500
                  ? { label: 'Large (100–500 cm²)', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' }
                  : { label: 'Extensive (>500 cm²)', color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-400 dark:border-red-700' };
                return (
                  <Badge variant="outline" className={`text-xs shrink-0 ${color}`}>
                    {label}
                  </Badge>
                );
              })()}
            </div>
          <p className="text-xs text-muted-foreground mt-1">
            {lang('deviceBasics.classification.surfaceAreaHelper')}
          </p>
        </div>
      )}

      {/* Active Device Status */}
      <div 
        id="active-device-section"
        className={cn(
          "p-4 rounded-lg space-y-2 transition-colors",
          isGenesisFlow && !hasActiveDeviceSelection && "border-2 border-amber-400 dark:border-amber-500 bg-amber-50/50 dark:bg-amber-950/30",
          isGenesisFlow && hasActiveDeviceSelection && "border-2 border-emerald-400 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
        )}>
        <div className="flex items-center">
          <Label className="flex items-center gap-2">
            {lang('deviceBasics.classification.activeDeviceLabel')}
            <HelpTooltip content={lang('deviceBasics.classification.activeDeviceTooltip')} />
            {renderLockBadge('isActive', isActiveDevice)}
          </Label>
          {renderScopeAndGov('classification_isActiveDevice', isActiveDevice)}
        </div>
        {wrapWithOverlay('classification_isActiveDevice', (
          <RadioGroup
            value={isActiveDevice === true ? "active" : isActiveDevice === false ? "non-active" : undefined}
            onValueChange={value => {
              const boolVal = value === "active";
              handleLockedFieldChange('isActive', boolVal, (v) => { onIsActiveDeviceChange?.(v); });
            }}
            disabled={isLoading}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="non-active" id="non-active" />
              <Label htmlFor="non-active">{lang('deviceBasics.classification.nonActiveDevice')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="active" id="active" />
              <Label htmlFor="active">{lang('deviceBasics.classification.activeDevice')}</Label>
            </div>
          </RadioGroup>
        ))}
      </div>

      {/* Override warning dialog */}
      <AlertDialog open={!!pendingChange} onOpenChange={(open) => { if (!open) setPendingChange(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Override EUDAMED Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This value was imported from EUDAMED and is the regulatory source of truth. Changing it here will create a local override that differs from the EUDAMED registry. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleOverrideConfirm}>Override</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
