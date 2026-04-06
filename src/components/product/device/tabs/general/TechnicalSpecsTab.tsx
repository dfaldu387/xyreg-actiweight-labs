import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, GraduationCap, Lock, AlertTriangle } from "lucide-react";
import { SoftwareClassificationSection } from '../../sections/SoftwareClassificationSection';
import { InheritanceExclusionPopover } from '@/components/shared/InheritanceExclusionPopover';
import { GovernanceBookmark } from '@/components/ui/GovernanceBookmark';
import { resolveFieldValue, normalizeScopeValue } from '@/hooks/useAutoSyncScope';

import { HelpTooltip } from '../../sections/HelpTooltip';
import { DeviceCharacteristics } from '@/types/client.d';
import { ConditionalDeviceCharacteristics } from '../../sections/ConditionalDeviceCharacteristics';
import { useTranslation } from '@/hooks/useTranslation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

// MedTech TRL Levels (3-8) with milestone descriptions
const TRL_OPTIONS = [
  { value: 3, label: 'TRL 3: Proof of Concept', description: 'Bench-top validation complete' },
  { value: 4, label: 'TRL 4: Lab Validation', description: 'Design Freeze 1 achieved' },
  { value: 5, label: 'TRL 5: Technology Validation', description: 'Design Freeze 2, V&V plan' },
  { value: 6, label: 'TRL 6: Clinical Pilot', description: 'First-in-human testing' },
  { value: 7, label: 'TRL 7: Clinical Pivotal', description: 'Pivotal trial complete' },
  { value: 8, label: 'TRL 8: Market Ready', description: 'Regulatory clearance obtained' },
];

interface TechnicalSpecsTabProps {
  keyTechnologyCharacteristics?: DeviceCharacteristics;
  trlLevel?: number | null;
  onKeyTechnologyCharacteristicsChange?: (value: DeviceCharacteristics) => void;
  onTrlLevelChange?: (value: number | null) => void;
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
  // IVD-specific (conditional)
  primaryRegulatoryType?: string;
  specimenType?: string;
  testingEnvironment?: string;
  analyticalPerformance?: string[];
  clinicalPerformance?: string[];
  onSpecimenTypeChange?: (value: string) => void;
  onTestingEnvironmentChange?: (value: string) => void;
  onAnalyticalPerformanceChange?: (value: string[]) => void;
  onClinicalPerformanceChange?: (value: string[]) => void;
  intendedUse?: string;
}

const tooltipDefinitions = {
  'hasMeasuringFunction': 'Device performs quantitative measurements',
  'isReusable': 'Device intended for multiple uses on different patients',
  'incorporatesMedicinalSubstance': 'Contains medicinal substance as integral part',
  'containsHumanAnimalMaterial': 'Manufactured using tissues of human or animal origin',
  'isSingleUse': 'Intended for one-time use only',
  'isCustomMade': 'Specially made according to written prescription',
  'isAccessoryToMedicalDevice': 'Intended to support, complement or augment a medical device'
};

// Map individual checkbox fields to their section-level scope key
const FIELD_TO_SECTION: Record<string, string> = {
  hasMeasuringFunction: 'technical_keyTechCharacteristics',
  isReusable: 'technical_keyTechCharacteristics',
  incorporatesMedicinalSubstance: 'technical_keyTechCharacteristics',
  containsHumanAnimalMaterial: 'technical_keyTechCharacteristics',
  isSingleUse: 'technical_keyTechCharacteristics',
  isCustomMade: 'technical_keyTechCharacteristics',
  isAccessoryToMedicalDevice: 'technical_keyTechCharacteristics',
  isBatteryPowered: 'technical_powerSource',
  isMainsPowered: 'technical_powerSource',
  isManualOperation: 'technical_powerSource',
  isWirelessCharging: 'technical_powerSource',
  energyTransferDirection: 'technical_energyTransfer',
  energyTransferType: 'technical_energyTransfer',
  hasBluetooth: 'technical_connectivity',
  hasWifi: 'technical_connectivity',
  hasCellular: 'technical_connectivity',
  hasNFC: 'technical_connectivity',
  hasUSB: 'technical_connectivity',
};

function getSectionKeyForField(field: string): string | null {
  return FIELD_TO_SECTION[field] || null;
}

function extractSectionValue(sectionKey: string, ktc: any): any {
  switch (sectionKey) {
    case 'technical_systemArchitecture':
      return { isSoftwareAsaMedicalDevice: ktc.isSoftwareAsaMedicalDevice ?? false, isSoftwareMobileApp: ktc.isSoftwareMobileApp ?? false, noSoftware: ktc.noSoftware ?? false };
    case 'technical_keyTechCharacteristics':
      return { hasMeasuringFunction: ktc.hasMeasuringFunction ?? false, isReusable: ktc.isReusable ?? false, incorporatesMedicinalSubstance: ktc.incorporatesMedicinalSubstance ?? false, containsHumanAnimalMaterial: ktc.containsHumanAnimalMaterial ?? false, isSingleUse: ktc.isSingleUse ?? false, isCustomMade: ktc.isCustomMade ?? false, isAccessoryToMedicalDevice: ktc.isAccessoryToMedicalDevice ?? false };
    case 'technical_sterility':
      return { isNonSterile: ktc.isNonSterile ?? false, isDeliveredSterile: ktc.isDeliveredSterile ?? false, canBeSterilized: ktc.canBeSterilized ?? false };
    case 'technical_powerSource':
      return { isBatteryPowered: ktc.isBatteryPowered ?? false, isMainsPowered: ktc.isMainsPowered ?? false, isManualOperation: ktc.isManualOperation ?? false, isWirelessCharging: ktc.isWirelessCharging ?? false };
    case 'technical_energyTransfer':
      return { energyTransferDirection: ktc.energyTransferDirection ?? null, energyTransferType: ktc.energyTransferType ?? null };
    case 'technical_connectivity':
      return { hasBluetooth: ktc.hasBluetooth ?? false, hasWifi: ktc.hasWifi ?? false, hasCellular: ktc.hasCellular ?? false, hasNFC: ktc.hasNFC ?? false, hasUSB: ktc.hasUSB ?? false };
    case 'technical_aiMl':
      return { hasImageAnalysis: ktc.hasImageAnalysis ?? false, hasPredictiveAnalytics: ktc.hasPredictiveAnalytics ?? false, hasNaturalLanguageProcessing: ktc.hasNaturalLanguageProcessing ?? false };
    case 'technical_environmentalConditions':
      return { transportTempRange: ktc.transportTempRange ?? null, transportHumidity: ktc.transportHumidity ?? null, transportPressure: ktc.transportPressure ?? null, operatingTempRange: ktc.operatingTempRange ?? null, operatingHumidity: ktc.operatingHumidity ?? null, operatingPressure: ktc.operatingPressure ?? null };
    case 'technical_electricalCharacteristics':
      return { ratedVoltage: ktc.ratedVoltage ?? null, ratedFrequency: ktc.ratedFrequency ?? null, ratedCurrentPower: ktc.ratedCurrentPower ?? null, protectionClass: ktc.protectionClass ?? null };
    case 'technical_physicalClassification':
      return { appliedPartType: ktc.appliedPartType ?? null, ipWaterRating: ktc.ipWaterRating ?? null, portability: ktc.portability ?? null, modeOfOperation: ktc.modeOfOperation ?? null };
    default:
      return null;
  }
}

export function TechnicalSpecsTab({
  keyTechnologyCharacteristics = {},
  trlLevel,
  onKeyTechnologyCharacteristicsChange,
  onTrlLevelChange,
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
  primaryRegulatoryType,
  specimenType,
  testingEnvironment,
  analyticalPerformance,
  clinicalPerformance,
  onSpecimenTypeChange,
  onTestingEnvironmentChange,
  onAnalyticalPerformanceChange,
  onClinicalPerformanceChange,
  intendedUse,
  autoSyncScope,
  familyProductIds,
  familyProducts,
  onScopeChangeWithPropagation,
}: TechnicalSpecsTabProps) {
  const { lang } = useTranslation();
  const [savingField, setSavingField] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [pendingChange, setPendingChange] = useState<{ field: string; value: any; isSterility?: boolean } | null>(null);

  // Check if we should show Genesis styling
  const returnTo = searchParams.get('returnTo');
  const section = searchParams.get('section');
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share' || returnTo === 'gap-analysis';
  const showTrlBorder = isInGenesisFlow || section === 'trl';

  const isFieldLocked = (field: string) => {
    const entry = eudamedLockedFields[field];
    return entry === true || (typeof entry === 'object' && entry?.locked);
  };

  const isFieldOverridden = (field: string, currentValue: boolean | undefined) => {
    const entry = eudamedLockedFields[field];
    if (typeof entry === 'object' && entry?.locked) {
      return (currentValue || false) !== entry.eudamedValue;
    }
    return false;
  };

  const handleCharacteristicChange = async (field: string, value: any) => {
    if (isFieldLocked(field)) {
      // If toggling back to match EUDAMED value, skip the warning
      const entry = eudamedLockedFields[field];
      const eudamedValue = typeof entry === 'object' && entry?.locked ? entry.eudamedValue : undefined;
      if (eudamedValue !== undefined && (value === eudamedValue)) {
        applyCharacteristicChange(field, value);
        return;
      }
      setPendingChange({ field, value });
      return;
    }
    applyCharacteristicChange(field, value);
  };

  const applyCharacteristicChange = (field: string, value: any) => {
    setSavingField(field);
    const updated = { ...keyTechnologyCharacteristics, [field]: value };
    if (onKeyTechnologyCharacteristicsChange) {
      onKeyTechnologyCharacteristicsChange(updated);
    }
    // Determine which section-level scope key this field belongs to
    const sectionKey = getSectionKeyForField(field);
    if (sectionKey) {
      // Value propagation now handled via popover Apply
    }
    setTimeout(() => setSavingField(null), 500);
  };

  // Batch update handler for multiple characteristic changes at once
  const handleBatchCharacteristicChange = (updates: Partial<DeviceCharacteristics>) => {
    const updatedCharacteristics = {
      ...keyTechnologyCharacteristics,
      ...updates
    };

    if (onKeyTechnologyCharacteristicsChange) {
      onKeyTechnologyCharacteristicsChange(updatedCharacteristics);
    }
    // Value propagation now handled via popover Apply
  };

  const handleSterilityChange = (field: string, value: boolean) => {
    if (isFieldLocked(field)) {
      const entry = eudamedLockedFields[field];
      const eudamedValue = typeof entry === 'object' && entry?.locked ? entry.eudamedValue : undefined;
      if (eudamedValue !== undefined && (value === eudamedValue)) {
        applySterilityChange(field, value);
        return;
      }
      setPendingChange({ field, value, isSterility: true });
      return;
    }
    applySterilityChange(field, value);
  };

  const applySterilityChange = (field: string, value: boolean) => {
    let updates: any = { [field]: value };

    if (field === 'isNonSterile' && value) {
      updates = {
        ...updates,
        isDeliveredSterile: false,
        canBeSterilized: false
      };
    }

    const updatedCharacteristics = {
      ...keyTechnologyCharacteristics,
      ...updates
    };

    if (onKeyTechnologyCharacteristicsChange) {
      onKeyTechnologyCharacteristicsChange(updatedCharacteristics);
    }
    // Value propagation now handled via popover Apply
  };

  const handleOverrideConfirm = () => {
    if (!pendingChange) return;
    if (pendingChange.isSterility) {
      applySterilityChange(pendingChange.field, pendingChange.value);
    } else {
      applyCharacteristicChange(pendingChange.field, pendingChange.value);
    }
    setPendingChange(null);
  };

  const handleTrlChange = (value: string) => {
    const numValue = value === 'none' ? null : parseInt(value, 10);
    onTrlLevelChange?.(numValue);
  };

  // TRL is complete when a level (3-8) is selected
  const isTrlComplete = Boolean(trlLevel !== null && trlLevel !== undefined && trlLevel >= 3);

  // Helper to render EUDAMED lock indicator + optional Overridden badge
  const renderLockBadge = (field: string, currentValue?: boolean) => {
    if (!isFieldLocked(field)) return null;
    return (
      <>
        <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800 gap-0.5">
          <Lock className="h-2.5 w-2.5" />
          EUDAMED
        </Badge>
        {isFieldOverridden(field, currentValue) && (
          <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-700 gap-0.5">
            <AlertTriangle className="h-2.5 w-2.5" />
            Overridden
          </Badge>
        )}
      </>
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
      {companyId && productId && classificationExclusion ? (
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

  const wrapWithOverlay = (_fieldKey: string, children: React.ReactNode) => children;

  return (
    <div className="space-y-6">
      {/* EUDAMED Override Warning Dialog */}
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

      {/* Technology Readiness Level (TRL) */}
      <div className={`p-4 rounded-lg transition-colors ${
        showTrlBorder
          ? isTrlComplete
            ? 'border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
            : 'border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
          : 'border border-border'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className={`h-5 w-5 ${showTrlBorder ? (isTrlComplete ? 'text-emerald-600' : 'text-amber-600') : 'text-muted-foreground'}`} />
          <Label className="text-sm font-medium">{lang('deviceBasics.technical.trlLabel')}</Label>
          <HelpTooltip content={lang('deviceBasics.technical.trlTooltip')} />
          {renderScopeAndGov('technical_trlLevel', trlLevel)}
        </div>
        {wrapWithOverlay('technical_trlLevel', (
          <>
            <Select 
              value={trlLevel?.toString() || 'none'} 
              onValueChange={handleTrlChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder={lang('deviceBasics.technical.trlPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{lang('deviceBasics.technical.trlNotSet')}</SelectItem>
                {TRL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {trlLevel && (
              <p className="text-xs text-muted-foreground mt-2">
                {TRL_OPTIONS.find(o => o.value === trlLevel)?.description}
              </p>
            )}
          </>
        ))}
      </div>

      {/* System Architecture / Software Classification */}
      <div>
        <div className="flex items-center gap-1 mb-3">
          <Label className="text-sm font-medium">System Architecture</Label>
          {renderScopeAndGov('technical_systemArchitecture', extractSectionValue('technical_systemArchitecture', keyTechnologyCharacteristics))}
        </div>
        {wrapWithOverlay('technical_systemArchitecture', (
          <SoftwareClassificationSection
            localKeyTechnologyCharacteristics={keyTechnologyCharacteristics}
            handleCharacteristicChange={handleCharacteristicChange}
            handleBatchCharacteristicChange={handleBatchCharacteristicChange}
            isLoading={isLoading}
            primaryRegulatoryType={undefined}
            tooltipDefinitions={tooltipDefinitions}
          />
        ))}
      </div>

      {/* Key Technology Characteristics */}
      <div>
        <div className="flex items-center gap-1 mb-3">
          <Label className="text-sm font-medium">{lang('deviceBasics.technical.keyTechCharLabel')}</Label>
          {renderScopeAndGov('technical_keyTechCharacteristics', extractSectionValue('technical_keyTechCharacteristics', keyTechnologyCharacteristics))}
        </div>
        {wrapWithOverlay('technical_keyTechCharacteristics', (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`flex items-center space-x-2 ${isFieldLocked('hasMeasuringFunction') ? 'bg-blue-50/50 dark:bg-blue-950/10 rounded px-2 py-1' : ''}`}>
              <Checkbox
                id="hasMeasuringFunction"
                checked={keyTechnologyCharacteristics.hasMeasuringFunction || false}
                onCheckedChange={checked => handleCharacteristicChange('hasMeasuringFunction', checked as boolean)}
                disabled={savingField === 'hasMeasuringFunction'}
              />
              <Label htmlFor="hasMeasuringFunction" className="flex items-center gap-2">
                {lang('deviceBasics.technical.hasMeasuringFunction')}
                {renderLockBadge('hasMeasuringFunction', keyTechnologyCharacteristics.hasMeasuringFunction)}
                <HelpTooltip content={lang('deviceBasics.technical.hasMeasuringFunctionTooltip')} />
                {savingField === 'hasMeasuringFunction' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>

            <div className={`flex items-center space-x-2 ${isFieldLocked('isReusable') ? 'bg-blue-50/50 dark:bg-blue-950/10 rounded px-2 py-1' : ''}`}>
              <Checkbox
                id="isReusable"
                checked={keyTechnologyCharacteristics.isReusable || false}
                onCheckedChange={checked => handleCharacteristicChange('isReusable', checked as boolean)}
                disabled={savingField === 'isReusable'}
              />
              <Label htmlFor="isReusable" className="flex items-center gap-2">
                {lang('deviceBasics.technical.isReusable')}
                {renderLockBadge('isReusable', keyTechnologyCharacteristics.isReusable)}
                <HelpTooltip content={lang('deviceBasics.technical.isReusableTooltip')} />
                {savingField === 'isReusable' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>

            <div className={`flex items-center space-x-2 ${isFieldLocked('incorporatesMedicinalSubstance') ? 'bg-blue-50/50 dark:bg-blue-950/10 rounded px-2 py-1' : ''}`}>
              <Checkbox
                id="incorporatesMedicinalSubstance"
                checked={keyTechnologyCharacteristics.incorporatesMedicinalSubstance || false}
                onCheckedChange={checked => handleCharacteristicChange('incorporatesMedicinalSubstance', checked as boolean)}
                disabled={savingField === 'incorporatesMedicinalSubstance'}
              />
              <Label htmlFor="incorporatesMedicinalSubstance" className="flex items-center gap-2">
                {lang('deviceBasics.technical.incorporatesMedicinalSubstance')}
                {renderLockBadge('incorporatesMedicinalSubstance', keyTechnologyCharacteristics.incorporatesMedicinalSubstance)}
                <HelpTooltip content={lang('deviceBasics.technical.incorporatesMedicinalSubstanceTooltip')} />
                {savingField === 'incorporatesMedicinalSubstance' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>

            <div className={`flex items-center space-x-2 ${isFieldLocked('containsHumanAnimalMaterial') ? 'bg-blue-50/50 dark:bg-blue-950/10 rounded px-2 py-1' : ''}`}>
              <Checkbox
                id="containsHumanAnimalMaterial"
                checked={keyTechnologyCharacteristics.containsHumanAnimalMaterial || false}
                onCheckedChange={checked => handleCharacteristicChange('containsHumanAnimalMaterial', checked as boolean)}
                disabled={savingField === 'containsHumanAnimalMaterial'}
              />
              <Label htmlFor="containsHumanAnimalMaterial" className="flex items-center gap-2">
                {lang('deviceBasics.technical.containsHumanAnimalMaterial')}
                {renderLockBadge('containsHumanAnimalMaterial', keyTechnologyCharacteristics.containsHumanAnimalMaterial)}
                <HelpTooltip content={lang('deviceBasics.technical.containsHumanAnimalMaterialTooltip')} />
                {savingField === 'containsHumanAnimalMaterial' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>

            <div className={`flex items-center space-x-2 ${isFieldLocked('isSingleUse') ? 'bg-blue-50/50 dark:bg-blue-950/10 rounded px-2 py-1' : ''}`}>
              <Checkbox
                id="isSingleUse"
                checked={keyTechnologyCharacteristics.isSingleUse || false}
                onCheckedChange={checked => handleCharacteristicChange('isSingleUse', checked as boolean)}
                disabled={savingField === 'isSingleUse'}
              />
              <Label htmlFor="isSingleUse" className="flex items-center gap-2">
                {lang('deviceBasics.technical.isSingleUse')}
                {renderLockBadge('isSingleUse', keyTechnologyCharacteristics.isSingleUse)}
                <HelpTooltip content={lang('deviceBasics.technical.isSingleUseTooltip')} />
                {savingField === 'isSingleUse' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCustomMade"
                checked={keyTechnologyCharacteristics.isCustomMade || false}
                onCheckedChange={checked => handleCharacteristicChange('isCustomMade', checked as boolean)}
                disabled={savingField === 'isCustomMade'}
              />
              <Label htmlFor="isCustomMade" className="flex items-center gap-2">
                {lang('deviceBasics.technical.isCustomMade')}
                <HelpTooltip content={lang('deviceBasics.technical.isCustomMadeTooltip')} />
                {savingField === 'isCustomMade' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAccessoryToMedicalDevice"
                checked={keyTechnologyCharacteristics.isAccessoryToMedicalDevice || false}
                onCheckedChange={checked => handleCharacteristicChange('isAccessoryToMedicalDevice', checked as boolean)}
                disabled={savingField === 'isAccessoryToMedicalDevice'}
              />
              <Label htmlFor="isAccessoryToMedicalDevice" className="flex items-center gap-2">
                {lang('deviceBasics.technical.isAccessoryToMedicalDevice')}
                <HelpTooltip content={lang('deviceBasics.technical.isAccessoryToMedicalDeviceTooltip')} />
                {savingField === 'isAccessoryToMedicalDevice' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
          </div>
        ))}
      </div>

      {/* Sterility Requirements */}
      <div>
        <div className="flex items-center gap-1 mb-3">
          <Label className="text-sm font-medium">{lang('deviceBasics.technical.sterilityLabel')}</Label>
          {renderScopeAndGov('technical_sterility', extractSectionValue('technical_sterility', keyTechnologyCharacteristics))}
        </div>
        {wrapWithOverlay('technical_sterility', (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`flex items-center space-x-2 ${isFieldLocked('isNonSterile') ? 'bg-blue-50/50 dark:bg-blue-950/10 rounded px-2 py-1' : ''}`}>
              <Checkbox
                id="isNonSterile"
                checked={keyTechnologyCharacteristics.isNonSterile || false}
                onCheckedChange={checked => handleSterilityChange('isNonSterile', checked as boolean)}
                disabled={savingField === 'isNonSterile'}
              />
              <Label htmlFor="isNonSterile" className="flex items-center gap-2">
                {lang('deviceBasics.technical.nonSterileDevice')}
                {renderLockBadge('isNonSterile', keyTechnologyCharacteristics.isNonSterile)}
                <HelpTooltip content={lang('deviceBasics.technical.nonSterileDeviceTooltip')} />
                {savingField === 'isNonSterile' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
            <div className={`flex items-center space-x-2 ${isFieldLocked('isDeliveredSterile') ? 'bg-blue-50/50 dark:bg-blue-950/10 rounded px-2 py-1' : ''}`}>
              <Checkbox
                id="isDeliveredSterile"
                checked={keyTechnologyCharacteristics.isDeliveredSterile || false}
                onCheckedChange={checked => handleSterilityChange('isDeliveredSterile', checked as boolean)}
                disabled={savingField === 'isDeliveredSterile' || keyTechnologyCharacteristics.isNonSterile}
              />
              <Label htmlFor="isDeliveredSterile" className={`flex items-center gap-2 ${keyTechnologyCharacteristics.isNonSterile ? 'opacity-50' : ''}`}>
                {lang('deviceBasics.technical.deliveredSterile')}
                {renderLockBadge('isDeliveredSterile', keyTechnologyCharacteristics.isDeliveredSterile)}
                <HelpTooltip content={lang('deviceBasics.technical.deliveredSterileTooltip')} />
                {savingField === 'isDeliveredSterile' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
            <div className={`flex items-center space-x-2 ${isFieldLocked('canBeSterilized') ? 'bg-blue-50/50 dark:bg-blue-950/10 rounded px-2 py-1' : ''}`}>
              <Checkbox
                id="canBeSterilized"
                checked={keyTechnologyCharacteristics.canBeSterilized || false}
                onCheckedChange={checked => handleSterilityChange('canBeSterilized', checked as boolean)}
                disabled={savingField === 'canBeSterilized' || keyTechnologyCharacteristics.isNonSterile}
              />
              <Label htmlFor="canBeSterilized" className={`flex items-center gap-2 ${keyTechnologyCharacteristics.isNonSterile ? 'opacity-50' : ''}`}>
                {lang('deviceBasics.technical.canBeSterilized')}
                {renderLockBadge('canBeSterilized', keyTechnologyCharacteristics.canBeSterilized)}
                <HelpTooltip content={lang('deviceBasics.technical.canBeSterilizedTooltip')} />
                {savingField === 'canBeSterilized' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
          </div>
        ))}
      </div>

      {/* Power Source */}
      <div>
        <div className="flex items-center gap-1 mb-3">
          <Label className="text-sm font-medium">{lang('deviceBasics.technical.powerSourceLabel')}</Label>
          {renderScopeAndGov('technical_powerSource', extractSectionValue('technical_powerSource', keyTechnologyCharacteristics))}
        </div>
        {wrapWithOverlay('technical_powerSource', (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isBatteryPowered"
                checked={keyTechnologyCharacteristics.isBatteryPowered || false}
                onCheckedChange={checked => handleCharacteristicChange('isBatteryPowered', checked as boolean)}
                disabled={savingField === 'isBatteryPowered'}
              />
              <Label htmlFor="isBatteryPowered" className="flex items-center gap-2">
                {lang('deviceBasics.technical.batteryPowered')}
                <HelpTooltip content={lang('deviceBasics.technical.batteryPoweredTooltip')} />
                {savingField === 'isBatteryPowered' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMainsPowered"
                checked={keyTechnologyCharacteristics.isMainsPowered || false}
                onCheckedChange={checked => handleCharacteristicChange('isMainsPowered', checked as boolean)}
                disabled={savingField === 'isMainsPowered'}
              />
              <Label htmlFor="isMainsPowered" className="flex items-center gap-2">
                {lang('deviceBasics.technical.mainsPowered')}
                <HelpTooltip content={lang('deviceBasics.technical.mainsPoweredTooltip')} />
                {savingField === 'isMainsPowered' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isManualOperation"
                checked={keyTechnologyCharacteristics.isManualOperation || false}
                onCheckedChange={checked => handleCharacteristicChange('isManualOperation', checked as boolean)}
                disabled={savingField === 'isManualOperation'}
              />
              <Label htmlFor="isManualOperation" className="flex items-center gap-2">
                {lang('deviceBasics.technical.manualOperation')}
                <HelpTooltip content={lang('deviceBasics.technical.manualOperationTooltip')} />
                {savingField === 'isManualOperation' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isWirelessCharging"
                checked={keyTechnologyCharacteristics.isWirelessCharging || false}
                onCheckedChange={checked => handleCharacteristicChange('isWirelessCharging', checked as boolean)}
                disabled={savingField === 'isWirelessCharging'}
              />
              <Label htmlFor="isWirelessCharging" className="flex items-center gap-2">
                {lang('deviceBasics.technical.wirelessCharging')}
                <HelpTooltip content={lang('deviceBasics.technical.wirelessChargingTooltip')} />
                {savingField === 'isWirelessCharging' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
          </div>
        ))}
      </div>

      {/* Energy Transfer */}
      <div>
        <div className="flex items-center gap-1 mb-3">
          <Label className="text-sm font-medium">Energy Transfer</Label>
          <HelpTooltip content="Whether the device transfers energy to or from the patient, as defined per IEC 60601-1." />
          {renderScopeAndGov('technical_energyTransfer', extractSectionValue('technical_energyTransfer', keyTechnologyCharacteristics))}
        </div>
        {wrapWithOverlay('technical_energyTransfer', (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Does the device transfer energy to or from the patient?</Label>
              <Select
                value={keyTechnologyCharacteristics.energyTransferDirection || 'none'}
                onValueChange={(val) => handleCharacteristicChange('energyTransferDirection', val === 'none' ? undefined : val)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full md:w-[400px]">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  <SelectItem value="to_patient">Yes — To patient</SelectItem>
                  <SelectItem value="from_patient">Yes — From patient</SelectItem>
                  <SelectItem value="bidirectional">Yes — Bidirectional</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {keyTechnologyCharacteristics.energyTransferDirection && keyTechnologyCharacteristics.energyTransferDirection !== 'no' && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Type of energy transferred</Label>
                <Select
                  value={keyTechnologyCharacteristics.energyTransferType || 'none'}
                  onValueChange={(val) => handleCharacteristicChange('energyTransferType', val === 'none' ? undefined : val)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full md:w-[400px]">
                    <SelectValue placeholder="Select energy type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    <SelectItem value="Mechanical">Mechanical</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Thermal">Thermal</SelectItem>
                    <SelectItem value="Electromagnetic">Electromagnetic</SelectItem>
                    <SelectItem value="Acoustic">Acoustic</SelectItem>
                    <SelectItem value="Hydraulic">Hydraulic</SelectItem>
                    <SelectItem value="Pneumatic">Pneumatic</SelectItem>
                    <SelectItem value="Multiple">Multiple types</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Connectivity Features */}
      <div>
        <div className="flex items-center gap-1 mb-3">
          <Label className="text-sm font-medium">{lang('deviceBasics.technical.connectivityLabel')}</Label>
          {renderScopeAndGov('technical_connectivity', extractSectionValue('technical_connectivity', keyTechnologyCharacteristics))}
        </div>
        {wrapWithOverlay('technical_connectivity', (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasBluetooth"
                checked={keyTechnologyCharacteristics.hasBluetooth || false}
                onCheckedChange={checked => handleCharacteristicChange('hasBluetooth', checked as boolean)}
                disabled={savingField === 'hasBluetooth'}
              />
              <Label htmlFor="hasBluetooth" className="flex items-center gap-2">
                {lang('deviceBasics.technical.bluetooth')}
                <HelpTooltip content={lang('deviceBasics.technical.bluetoothTooltip')} />
                {savingField === 'hasBluetooth' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasWifi"
                checked={keyTechnologyCharacteristics.hasWifi || false}
                onCheckedChange={checked => handleCharacteristicChange('hasWifi', checked as boolean)}
                disabled={savingField === 'hasWifi'}
              />
              <Label htmlFor="hasWifi" className="flex items-center gap-2">
                {lang('deviceBasics.technical.wifi')}
                <HelpTooltip content={lang('deviceBasics.technical.wifiTooltip')} />
                {savingField === 'hasWifi' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasCellular"
                checked={keyTechnologyCharacteristics.hasCellular || false}
                onCheckedChange={checked => handleCharacteristicChange('hasCellular', checked as boolean)}
                disabled={savingField === 'hasCellular'}
              />
              <Label htmlFor="hasCellular" className="flex items-center gap-2">
                {lang('deviceBasics.technical.cellular')}
                <HelpTooltip content={lang('deviceBasics.technical.cellularTooltip')} />
                {savingField === 'hasCellular' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasUsb"
                checked={keyTechnologyCharacteristics.hasUsb || false}
                onCheckedChange={checked => handleCharacteristicChange('hasUsb', checked as boolean)}
                disabled={savingField === 'hasUsb'}
              />
              <Label htmlFor="hasUsb" className="flex items-center gap-2">
                {lang('deviceBasics.technical.usb')}
                <HelpTooltip content={lang('deviceBasics.technical.usbTooltip')} />
                {savingField === 'hasUsb' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasNoConnectivity"
                checked={keyTechnologyCharacteristics.hasNoConnectivity || false}
                onCheckedChange={checked => handleCharacteristicChange('hasNoConnectivity', checked as boolean)}
                disabled={savingField === 'hasNoConnectivity'}
              />
              <Label htmlFor="hasNoConnectivity" className="flex items-center gap-2">
                {lang('deviceBasics.technical.noConnectivity')}
                <HelpTooltip content={lang('deviceBasics.technical.noConnectivityTooltip')} />
                {savingField === 'hasNoConnectivity' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
          </div>
        ))}
      </div>

      {/* AI/ML Features */}
      <div>
        <div className="flex items-center gap-1 mb-3">
          <Label className="text-sm font-medium">{lang('deviceBasics.technical.aiMlLabel')}</Label>
          {renderScopeAndGov('technical_aiMl', extractSectionValue('technical_aiMl', keyTechnologyCharacteristics))}
        </div>
        {wrapWithOverlay('technical_aiMl', (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasImageAnalysis"
                checked={keyTechnologyCharacteristics.hasImageAnalysis || false}
                onCheckedChange={checked => handleCharacteristicChange('hasImageAnalysis', checked as boolean)}
                disabled={savingField === 'hasImageAnalysis'}
              />
              <Label htmlFor="hasImageAnalysis" className="flex items-center gap-2">
                {lang('deviceBasics.technical.imageAnalysis')}
                <HelpTooltip content={lang('deviceBasics.technical.imageAnalysisTooltip')} />
                {savingField === 'hasImageAnalysis' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasPredictiveAnalytics"
                checked={keyTechnologyCharacteristics.hasPredictiveAnalytics || false}
                onCheckedChange={checked => handleCharacteristicChange('hasPredictiveAnalytics', checked as boolean)}
                disabled={savingField === 'hasPredictiveAnalytics'}
              />
              <Label htmlFor="hasPredictiveAnalytics" className="flex items-center gap-2">
                {lang('deviceBasics.technical.predictiveAnalytics')}
                <HelpTooltip content={lang('deviceBasics.technical.predictiveAnalyticsTooltip')} />
                {savingField === 'hasPredictiveAnalytics' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasNaturalLanguageProcessing"
                checked={keyTechnologyCharacteristics.hasNaturalLanguageProcessing || false}
                onCheckedChange={checked => handleCharacteristicChange('hasNaturalLanguageProcessing', checked as boolean)}
                disabled={savingField === 'hasNaturalLanguageProcessing'}
              />
              <Label htmlFor="hasNaturalLanguageProcessing" className="flex items-center gap-2">
                {lang('deviceBasics.technical.nlp')}
                <HelpTooltip content={lang('deviceBasics.technical.nlpTooltip')} />
                {savingField === 'hasNaturalLanguageProcessing' && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
          </div>
        ))}
      </div>

      {/* Environmental Conditions (IEC 60601-1 §4.10 SSOT) */}
      <div>
        <div className="flex items-center gap-1 mb-3">
          <Label className="text-sm font-medium">Environmental Conditions</Label>
          <HelpTooltip content="Transport/storage and operating environmental conditions per IEC 60601-1 §4.10. These values are the Single Source of Truth for the IEC 60601-1 checklist." />
          {renderScopeAndGov('technical_environmentalConditions', extractSectionValue('technical_environmentalConditions', keyTechnologyCharacteristics))}
        </div>
        {wrapWithOverlay('technical_environmentalConditions', (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block font-semibold">Transport & Storage</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Temperature range</Label>
                  <Input
                    value={keyTechnologyCharacteristics.transportTempRange || ''}
                    onChange={(e) => handleCharacteristicChange('transportTempRange', e.target.value)}
                    placeholder="e.g. -40°C to +70°C"
                    className="text-sm"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Humidity range</Label>
                  <Input
                    value={keyTechnologyCharacteristics.transportHumidity || ''}
                    onChange={(e) => handleCharacteristicChange('transportHumidity', e.target.value)}
                    placeholder="e.g. 10% to 100% RH"
                    className="text-sm"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Atmospheric pressure</Label>
                  <Input
                    value={keyTechnologyCharacteristics.transportPressure || ''}
                    onChange={(e) => handleCharacteristicChange('transportPressure', e.target.value)}
                    placeholder="e.g. 500 hPa to 1060 hPa"
                    className="text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block font-semibold">Operating</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Temperature range</Label>
                  <Input
                    value={keyTechnologyCharacteristics.operatingTempRange || ''}
                    onChange={(e) => handleCharacteristicChange('operatingTempRange', e.target.value)}
                    placeholder="e.g. +5°C to +40°C"
                    className="text-sm"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Humidity range</Label>
                  <Input
                    value={keyTechnologyCharacteristics.operatingHumidity || ''}
                    onChange={(e) => handleCharacteristicChange('operatingHumidity', e.target.value)}
                    placeholder="e.g. 15% to 85% RH"
                    className="text-sm"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Atmospheric pressure</Label>
                  <Input
                    value={keyTechnologyCharacteristics.operatingPressure || ''}
                    onChange={(e) => handleCharacteristicChange('operatingPressure', e.target.value)}
                    placeholder="e.g. 700 hPa to 1060 hPa"
                    className="text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Electrical Characteristics (IEC 60601-1 §4.11 / §6.1 SSOT) */}
      <div>
        <div className="flex items-center gap-1 mb-3">
          <Label className="text-sm font-medium">Electrical Characteristics</Label>
          <HelpTooltip content="Rated supply voltage, frequency, power and protection class per IEC 60601-1 §4.11 and §6.1." />
          {renderScopeAndGov('technical_electricalCharacteristics', extractSectionValue('technical_electricalCharacteristics', keyTechnologyCharacteristics))}
        </div>
        {wrapWithOverlay('technical_electricalCharacteristics', (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Rated supply voltage</Label>
              <Input
                value={keyTechnologyCharacteristics.ratedVoltage || ''}
                onChange={(e) => handleCharacteristicChange('ratedVoltage', e.target.value)}
                placeholder="e.g. 100-240V AC"
                className="text-sm"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Rated frequency</Label>
              <Input
                value={keyTechnologyCharacteristics.ratedFrequency || ''}
                onChange={(e) => handleCharacteristicChange('ratedFrequency', e.target.value)}
                placeholder="e.g. 50/60 Hz"
                className="text-sm"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Rated current / power</Label>
              <Input
                value={keyTechnologyCharacteristics.ratedCurrentPower || ''}
                onChange={(e) => handleCharacteristicChange('ratedCurrentPower', e.target.value)}
                placeholder="e.g. 2A / 500W"
                className="text-sm"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Protection class (§6.1)</Label>
              <Select
                value={keyTechnologyCharacteristics.protectionClass || 'none'}
                onValueChange={(val) => handleCharacteristicChange('protectionClass', val === 'none' ? undefined : val)}
                disabled={isLoading}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  <SelectItem value="Class I">Class I</SelectItem>
                  <SelectItem value="Class II">Class II</SelectItem>
                  <SelectItem value="Internally powered">Internally powered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>

      {/* Physical Classification (IEC 60601-1 §6.2-6.6 SSOT) */}
      <div>
        <div className="flex items-center gap-1 mb-3">
          <Label className="text-sm font-medium">Physical Classification</Label>
          <HelpTooltip content="Applied part type, IP water rating, portability and mode of operation per IEC 60601-1 §6.2–6.6." />
          {renderScopeAndGov('technical_physicalClassification', extractSectionValue('technical_physicalClassification', keyTechnologyCharacteristics))}
        </div>
        {wrapWithOverlay('technical_physicalClassification', (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Applied part type (§6.2)</Label>
              <Select
                value={keyTechnologyCharacteristics.appliedPartType || 'none'}
                onValueChange={(val) => handleCharacteristicChange('appliedPartType', val === 'none' ? undefined : val)}
                disabled={isLoading}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  <SelectItem value="Type B">Type B</SelectItem>
                  <SelectItem value="Type BF">Type BF</SelectItem>
                  <SelectItem value="Type CF">Type CF</SelectItem>
                  <SelectItem value="No applied parts">No applied parts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">IP water rating (§6.3)</Label>
              <Select
                value={keyTechnologyCharacteristics.ipWaterRating || 'none'}
                onValueChange={(val) => handleCharacteristicChange('ipWaterRating', val === 'none' ? undefined : val)}
                disabled={isLoading}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  {['IPX0','IPX1','IPX2','IPX3','IPX4','IPX5','IPX6','IPX7','IPX8'].map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Portability (§6.6)</Label>
              <Select
                value={keyTechnologyCharacteristics.portabilityClass || 'none'}
                onValueChange={(val) => handleCharacteristicChange('portabilityClass', val === 'none' ? undefined : val)}
                disabled={isLoading}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  {['Portable','Transportable','Mobile','Stationary','Fixed','Hand-held'].map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Mode of operation (§6.5)</Label>
              <Select
                value={keyTechnologyCharacteristics.operationMode || 'none'}
                onValueChange={(val) => handleCharacteristicChange('operationMode', val === 'none' ? undefined : val)}
                disabled={isLoading}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  <SelectItem value="Continuous">Continuous</SelectItem>
                  <SelectItem value="Short-time">Short-time</SelectItem>
                  <SelectItem value="Intermittent">Intermittent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(keyTechnologyCharacteristics.operationMode === 'Short-time' || keyTechnologyCharacteristics.operationMode === 'Intermittent') && (
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground mb-1 block">Duty cycle / duration</Label>
                <Input
                  value={keyTechnologyCharacteristics.dutyCycle || ''}
                  onChange={(e) => handleCharacteristicChange('dutyCycle', e.target.value)}
                  placeholder="e.g. 10 min on / 20 min off"
                  className="text-sm"
                  disabled={isLoading}
                />
              </div>
            )}
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground mb-1 block">Expected service life (§4.4)</Label>
              <Input
                value={keyTechnologyCharacteristics.expectedServiceLife || ''}
                onChange={(e) => handleCharacteristicChange('expectedServiceLife', e.target.value)}
                placeholder="e.g. 10 years"
                className="text-sm"
                disabled={isLoading}
              />
            </div>
          </div>
        ))}
      </div>

      {/* IVD-specific: Testing & Performance */}
      {primaryRegulatoryType === 'In Vitro Diagnostic (IVD)' && (
        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="text-lg font-semibold mb-6">Testing & Performance (IVD)</h3>
          <ConditionalDeviceCharacteristics
            regulatoryType={primaryRegulatoryType}
            specimenType={specimenType}
            testingEnvironment={testingEnvironment}
            analyticalPerformance={analyticalPerformance}
            clinicalPerformance={clinicalPerformance}
            onSpecimenTypeChange={onSpecimenTypeChange}
            onTestingEnvironmentChange={onTestingEnvironmentChange}
            onAnalyticalPerformanceChange={onAnalyticalPerformanceChange}
            onClinicalPerformanceChange={onClinicalPerformanceChange}
            intendedUse={intendedUse}
            isLoading={isLoading}
          />
        </div>
      )}

    </div>
  );
}
