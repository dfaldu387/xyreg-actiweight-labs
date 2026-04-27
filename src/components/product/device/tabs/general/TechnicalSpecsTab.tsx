import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import {
  MaterialsBodyContactEditor,
  normalizeMaterialEntries,
  type MaterialEntry,
} from '../../sections/MaterialsBodyContactEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

/**
 * Persistent tri-state status pill for Annex-I-driving fields.
 * - true  → green ("Answered: Yes")
 * - false → muted ("Answered: No")
 * - null/undefined → amber ("Not yet assessed")
 * Stays visible after the orange navigation highlight pulse fades, so users
 * can always tell whether a field is unanswered or deliberately answered.
 */
const TriStateBadge: React.FC<{ value: boolean | null | undefined; className?: string }> = ({ value, className }) => {
  if (value === true) {
    return (
      <Badge
        variant="outline"
        className={`text-xs border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400 ${className ?? ''}`}
      >
        Answered: Yes
      </Badge>
    );
  }
  if (value === false) {
    return (
      <Badge variant="outline" className={`text-xs text-muted-foreground ${className ?? ''}`}>
        Answered: No
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={`text-xs border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 ${className ?? ''}`}
    >
      Not yet assessed
    </Badge>
  );
};

/**
 * Tri-state Yes / No / Not yet assessed row used for GSPR-driving binary
 * fields on Technical Specs. Mirrors the pattern already used by the
 * absorbed/dispersed and CMR sections so the user can always tell whether a
 * field is unanswered or deliberately answered.
 */
const TriStateRow: React.FC<{
  id: string;
  label: React.ReactNode;
  tooltip?: string;
  value: boolean | null | undefined;
  onChange: (next: boolean | null) => void;
  disabled?: boolean;
  saving?: boolean;
  lockBadge?: React.ReactNode;
}> = ({ id, label, tooltip, value, onChange, disabled, saving, lockBadge }) => {
  const radioValue = value === true ? 'yes' : value === false ? 'no' : 'unset';
  return (
    <div id={id} className="col-span-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border rounded-md p-2">
      <Label className="flex items-center gap-2 text-sm font-normal">
        {label}
        {lockBadge}
        {tooltip && <HelpTooltip content={tooltip} />}
        <TriStateBadge value={value} />
        {saving && <Loader2 className="h-3 w-3 animate-spin" />}
      </Label>
      <RadioGroup
        value={radioValue}
        onValueChange={(val) => {
          const next = val === 'yes' ? true : val === 'no' ? false : null;
          onChange(next);
        }}
        className="flex gap-3"
        disabled={disabled}
      >
        <div className="flex items-center gap-1">
          <RadioGroupItem value="yes" id={`${id}-yes`} />
          <Label htmlFor={`${id}-yes`} className="text-xs cursor-pointer">Yes</Label>
        </div>
        <div className="flex items-center gap-1">
          <RadioGroupItem value="no" id={`${id}-no`} />
          <Label htmlFor={`${id}-no`} className="text-xs cursor-pointer">No</Label>
        </div>
        <div className="flex items-center gap-1">
          <RadioGroupItem value="unset" id={`${id}-unset`} />
          <Label htmlFor={`${id}-unset`} className="text-xs cursor-pointer text-muted-foreground">Not yet assessed</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

interface TechnicalSpecsTabProps {
  keyTechnologyCharacteristics?: DeviceCharacteristics;
  trlLevel?: number | null;
  onKeyTechnologyCharacteristicsChange?: (value: DeviceCharacteristics) => void;
  onTrlLevelChange?: (value: number | null) => void;
  isLoading?: boolean;
  isActiveDevice?: boolean;
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
  isActiveDevice,
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
  const navigate = useNavigate();
  const [pendingChange, setPendingChange] = useState<{ field: string; value: any; isSterility?: boolean } | null>(null);

  // Check if we should show Genesis styling.
  // NOTE: gap-analysis deep-links are NOT a guided flow — they should not paint
  // unrelated sections green/amber. Only the actual deep-link target gets the
  // temporary amber pulse from the highlight effect below.
  const returnTo = searchParams.get('returnTo');
  const section = searchParams.get('section');
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share';
  const showTrlBorder = isInGenesisFlow || section === 'trl';

  // Deep-link highlight: poll for the target section (it may render after async
  // product/device data lands), then scroll into view + strong amber pulse for 4s.
  const highlight = searchParams.get('highlight');
  useEffect(() => {
    if (!highlight) return;
    let cancelled = false;
    let removeTimer: number | undefined;
    const start = Date.now();
    const tryHighlight = () => {
      if (cancelled) return;
      const el = document.getElementById(highlight);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add(
          'ring-4', 'ring-amber-500', 'ring-offset-4',
          'bg-amber-50', 'dark:bg-amber-950/30',
          'rounded-lg', 'transition-all', 'duration-500'
        );
        removeTimer = window.setTimeout(() => {
          el.classList.remove(
            'ring-4', 'ring-amber-500', 'ring-offset-4',
            'bg-amber-50', 'dark:bg-amber-950/30'
          );
        }, 4000);
        return;
      }
      if (Date.now() - start < 2000) {
        window.setTimeout(tryHighlight, 100);
      }
    };
    const startTimer = window.setTimeout(tryHighlight, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      if (removeTimer) window.clearTimeout(removeTimer);
    };
  }, [highlight]);

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
      <div id="software-classification-section">
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

      {/* Key Technology Characteristics — also serves as anchor for GSPR 21 (diagnostic/monitoring). */}
      <div id="measuring-function-section">
        <div id="diagnostic-monitoring-section" className="sr-only" aria-hidden="true" />
        <div className="flex items-center gap-1 mb-3">
          <Label className="text-sm font-medium">{lang('deviceBasics.technical.keyTechCharLabel')}</Label>
          {renderScopeAndGov('technical_keyTechCharacteristics', extractSectionValue('technical_keyTechCharacteristics', keyTechnologyCharacteristics))}
        </div>
        {wrapWithOverlay('technical_keyTechCharacteristics', (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TriStateRow
              id="hasMeasuringFunction-row"
              label={lang('deviceBasics.technical.hasMeasuringFunction')}
              tooltip={lang('deviceBasics.technical.hasMeasuringFunctionTooltip')}
              value={(keyTechnologyCharacteristics as any).hasMeasuringFunction}
              onChange={(next) => handleCharacteristicChange('hasMeasuringFunction', next)}
              disabled={savingField === 'hasMeasuringFunction'}
              saving={savingField === 'hasMeasuringFunction'}
              lockBadge={renderLockBadge('hasMeasuringFunction', keyTechnologyCharacteristics.hasMeasuringFunction)}
            />

            <TriStateRow
              id="isReusable-row"
              label={lang('deviceBasics.technical.isReusable')}
              tooltip={lang('deviceBasics.technical.isReusableTooltip')}
              value={(keyTechnologyCharacteristics as any).isReusable}
              onChange={(next) => handleCharacteristicChange('isReusable', next)}
              disabled={savingField === 'isReusable'}
              saving={savingField === 'isReusable'}
              lockBadge={renderLockBadge('isReusable', keyTechnologyCharacteristics.isReusable)}
            />

            <TriStateRow
              id="medicinal-substance-section"
              label={lang('deviceBasics.technical.incorporatesMedicinalSubstance')}
              tooltip={lang('deviceBasics.technical.incorporatesMedicinalSubstanceTooltip')}
              value={(keyTechnologyCharacteristics as any).incorporatesMedicinalSubstance}
              onChange={(next) => handleCharacteristicChange('incorporatesMedicinalSubstance', next)}
              disabled={savingField === 'incorporatesMedicinalSubstance'}
              saving={savingField === 'incorporatesMedicinalSubstance'}
              lockBadge={renderLockBadge('incorporatesMedicinalSubstance', keyTechnologyCharacteristics.incorporatesMedicinalSubstance)}
            />

            {(() => {
              const ktc: any = keyTechnologyCharacteristics;
              const triRows: Array<{ field: 'containsAnimalTissue' | 'containsHumanTissue' | 'containsMicroOrgs'; label: string; tooltip: string; }> = [
                { field: 'containsAnimalTissue', label: 'Contains animal tissue / derivatives', tooltip: 'Tissues, cells or substances of animal origin (e.g. bovine collagen, porcine heparin) — MDR Annex I §22.' },
                { field: 'containsHumanTissue',  label: 'Contains human tissue / derivatives',  tooltip: 'Tissues, cells or derivatives of human origin (e.g. demineralised bone matrix, human serum) — MDR Annex I §22.' },
                { field: 'containsMicroOrgs',    label: 'Contains non-viable micro-organisms', tooltip: 'Non-viable bacteria, viruses or other micro-organisms / their derivatives used as part of the device.' },
              ];
              const valueOf = (f: string): 'yes' | 'no' | 'unset' => {
                const v = ktc[f];
                if (v === true) return 'yes';
                if (v === false) return 'no';
                return 'unset';
              };
              const summary = (() => {
                const vals = triRows.map(r => ktc[r.field]);
                if (vals.some(v => v === true)) return 'Yes';
                if (vals.every(v => v === false)) return 'No';
                return 'Unknown';
              })();
              return (
                <div id="biological-origin-section" className="col-span-full border rounded-md p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">Biological-origin materials</Label>
                    <HelpTooltip content="MDR Annex I §22 + ISO 10993 require disclosing biological-origin sources separately. 'Not yet assessed' keeps the GSPR open; 'No' marks it as Suggested N/A; 'Yes' triggers the full clause." />
                    <Badge variant="outline" className="ml-auto text-xs">Summary: {summary}</Badge>
                  </div>
                  <div className="space-y-2">
                    {triRows.map(row => (
                      <div key={row.field} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <Label className="flex items-center gap-2 text-sm font-normal">
                          {row.label}
                          <HelpTooltip content={row.tooltip} />
                          <TriStateBadge value={ktc[row.field]} />
                          {savingField === row.field && <Loader2 className="h-3 w-3 animate-spin" />}
                        </Label>
                        <RadioGroup
                          value={valueOf(row.field)}
                          onValueChange={(val) => {
                            const next = val === 'yes' ? true : val === 'no' ? false : null;
                            handleCharacteristicChange(row.field, next);
                          }}
                          className="flex gap-3"
                          disabled={savingField === row.field}
                        >
                          <div className="flex items-center gap-1">
                            <RadioGroupItem value="yes" id={`${row.field}-yes`} />
                            <Label htmlFor={`${row.field}-yes`} className="text-xs cursor-pointer">Yes</Label>
                          </div>
                          <div className="flex items-center gap-1">
                            <RadioGroupItem value="no" id={`${row.field}-no`} />
                            <Label htmlFor={`${row.field}-no`} className="text-xs cursor-pointer">No</Label>
                          </div>
                          <div className="flex items-center gap-1">
                            <RadioGroupItem value="unset" id={`${row.field}-unset`} />
                            <Label htmlFor={`${row.field}-unset`} className="text-xs cursor-pointer text-muted-foreground">Not yet assessed</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <TriStateRow
              id="isSingleUse-row"
              label={lang('deviceBasics.technical.isSingleUse')}
              tooltip={lang('deviceBasics.technical.isSingleUseTooltip')}
              value={(keyTechnologyCharacteristics as any).isSingleUse}
              onChange={(next) => handleCharacteristicChange('isSingleUse', next)}
              disabled={savingField === 'isSingleUse'}
              saving={savingField === 'isSingleUse'}
              lockBadge={renderLockBadge('isSingleUse', keyTechnologyCharacteristics.isSingleUse)}
            />

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
      <div id="sterility-section">
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
      <div id="power-source-section">
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

      {/* Energy Transfer — also serves as anchor for GSPR 15 (mechanical/thermal). */}
      <div id="mechanical-thermal-section">
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

      {/* Emits radiation — GSPR 17 (paired with Energy Transfer) */}
      <div id="emits-radiation-section">
        <div className="flex items-center gap-1 mb-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            Emits radiation (ionising or non-ionising)
            <HelpTooltip content="Device emits ionising radiation (X-ray, gamma) or non-ionising radiation (laser, RF, UV, magnetic fields) per MDR Annex I §17." />
          </Label>
          <TriStateBadge value={(keyTechnologyCharacteristics as any)?.emitsRadiation} className="ml-2" />
          {renderScopeAndGov('classification_emitsRadiation', (keyTechnologyCharacteristics as any)?.emitsRadiation)}
        </div>
        <RadioGroup
          value={
            (keyTechnologyCharacteristics as any)?.emitsRadiation === true
              ? "yes"
              : (keyTechnologyCharacteristics as any)?.emitsRadiation === false
                ? "no"
                : "unset"
          }
          onValueChange={(value) => {
            if (onKeyTechnologyCharacteristicsChange) {
              const next =
                value === "yes" ? true : value === "no" ? false : null;
              onKeyTechnologyCharacteristicsChange({
                ...keyTechnologyCharacteristics,
                emitsRadiation: next,
              } as DeviceCharacteristics);
            }
          }}
          disabled={isLoading}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="radiation-no" />
            <Label htmlFor="radiation-no">Does not emit radiation</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="radiation-yes" />
            <Label htmlFor="radiation-yes">Emits ionising or non-ionising radiation</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="unset" id="radiation-unset" />
            <Label htmlFor="radiation-unset" className="text-muted-foreground">Not yet assessed</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Materials in patient body contact — GSPR 10.
          Always rendered so deep-link highlights resolve. When the prerequisite
          (anatomical location / body contact) isn't established, the field is
          disabled and an inline notice points users to the gating selector. */}
      {(() => {
        const anat = (keyTechnologyCharacteristics as any)?.anatomicalLocation;
        const hasAnatomical =
          !!anat && anat !== 'none' && anat !== 'not_defined';
        const returnTo = searchParams.get('returnTo');
        const goToAnatomical = () => {
          if (!productId) return;
          const params = new URLSearchParams();
          params.set('tab', 'basics');
          params.set('subtab', 'classification');
          params.set('highlight', 'anatomical-location-section');
          if (returnTo) params.set('returnTo', returnTo);
          navigate(`/app/product/${productId}/device-information?${params.toString()}`);
        };
        return (
          <div id="materials-body-contact-section">
            {/* Inline mirror of Anatomical Location — same SSOT field as the
                Classification subtab. User can resolve the gating prerequisite
                in place without navigating away. */}
            <div className="mb-3 rounded-md border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-sm font-medium">
                  Body contact context
                </Label>
                <span className="text-xs text-muted-foreground">
                  (set here or on Classification — same value)
                </span>
              </div>
              <Label className="text-xs text-muted-foreground">Anatomical Location</Label>
              <Select
                value={anat || ''}
                onValueChange={(value) => {
                  if (!onKeyTechnologyCharacteristicsChange) return;
                  // When the user explicitly picks "No direct body contact",
                  // also clear the materials list so the two answers stay
                  // consistent (the GSPR rule layer treats this as
                  // explicitly-empty per Part C).
                  const next: any = {
                    ...keyTechnologyCharacteristics,
                    anatomicalLocation: value,
                  };
                  if (value === 'none') {
                    next.materialsInBodyContact = [];
                    next.materialsInBodyContactExplicitlyEmpty = true;
                  }
                  onKeyTechnologyCharacteristicsChange(next as DeviceCharacteristics);
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select anatomical location of device contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_defined">Not defined</SelectItem>
                  <SelectItem value="none">No direct body contact</SelectItem>
                  <SelectItem value="skin_surface">Skin surface only</SelectItem>
                  <SelectItem value="body_orifices">Body orifices (mouth, nose, ear, etc.)</SelectItem>
                  <SelectItem value="wounded_skin">Wounded or damaged skin</SelectItem>
                  <SelectItem value="cardiovascular_system">Cardiovascular system</SelectItem>
                  <SelectItem value="central_nervous_system">Central nervous system</SelectItem>
                  <SelectItem value="circulatory_system">Circulatory system</SelectItem>
                  <SelectItem value="teeth">Teeth</SelectItem>
                  <SelectItem value="oral_cavity">Oral cavity</SelectItem>
                  <SelectItem value="ear_canal">Ear canal</SelectItem>
                  <SelectItem value="nasal_cavity">Nasal cavity</SelectItem>
                  <SelectItem value="pharynx">Pharynx</SelectItem>
                  <SelectItem value="lacrimal_duct">Lacrimal duct</SelectItem>
                  <SelectItem value="vagina_cervix">Vagina/cervix</SelectItem>
                  <SelectItem value="urethra">Urethra</SelectItem>
                  <SelectItem value="rectum">Rectum</SelectItem>
                  <SelectItem value="other">Other body location</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Drives Materials in body contact, ISO 10993 biocompatibility,
                and MDR Annex VIII Rules 5–8.
              </p>
            </div>

            <div className="flex items-center gap-1 mb-2">
              <Label htmlFor="materialsInBodyContact" className="text-sm font-medium flex items-center gap-2">
                Materials in patient body contact
                <HelpTooltip content="List the materials (e.g. silicone, titanium, PEEK) that come into direct or indirect contact with the patient's body — required for biocompatibility evaluation under MDR Annex I §10 and ISO 10993-1." />
              </Label>
              {renderScopeAndGov('technical_materialsInBodyContact', (keyTechnologyCharacteristics as any)?.materialsInBodyContact)}
              {(() => {
                const ktc = keyTechnologyCharacteristics as any;
                const entries = normalizeMaterialEntries(ktc?.materialsInBodyContact);
                const explicitlyEmpty = ktc?.materialsInBodyContactExplicitlyEmpty === true;
                const triValue: boolean | null =
                  entries.length > 0 ? true : explicitlyEmpty ? false : null;
                return <TriStateBadge value={triValue} />;
              })()}
            </div>
            {!anat || anat === 'not_defined' ? (
              <div className="mb-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                Set the device's <strong>Anatomical Location</strong> first
                (Device Basics → Classification) — this field becomes editable
                once body contact is established.{' '}
                <button
                  type="button"
                  onClick={goToAnatomical}
                  className="underline font-medium hover:opacity-80"
                >
                  Set Anatomical Location →
                </button>
              </div>
            ) : anat === 'none' ? (
              <div className="mb-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                This device has <strong>no patient body contact</strong> (per
                Anatomical Location). Materials list does not apply. Change the
                Anatomical Location dropdown above if this is incorrect.
              </div>
            ) : (
              <MaterialsBodyContactEditor
                productId={productId}
                value={normalizeMaterialEntries(
                  (keyTechnologyCharacteristics as any)?.materialsInBodyContact,
                )}
                disabled={isLoading || !hasAnatomical}
                onChange={(next: MaterialEntry[]) => {
                  handleBatchCharacteristicChange(({
                    materialsInBodyContact: next,
                    // Adding a material clears the "explicitly empty" flag.
                    materialsInBodyContactExplicitlyEmpty:
                      next.length > 0 ? false : (keyTechnologyCharacteristics as any)
                        ?.materialsInBodyContactExplicitlyEmpty === true,
                  } as unknown) as Partial<DeviceCharacteristics>);
                }}
              />
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Need full material details (supplier, grade, lot)?{' '}
              <button
                type="button"
                onClick={() => productId && navigate(`/app/product/${productId}/bom`)}
                className="underline text-primary hover:text-primary/80"
              >
                Manage them in the Bill of Materials module
              </button>
              {' '}— this field is the biocompatibility-relevant subset.
            </p>
          </div>
        );
      })()}

      {/* Substances absorbed/dispersed in body — GSPR 13 */}
      <div id="absorbed-dispersed-section">
        <div className="flex items-center gap-1 mb-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            Substances absorbed by or dispersed in the body
            <HelpTooltip content="Device delivers or releases substances (e.g. drugs, contrast agents, ions, particles) that are absorbed by, dispersed within, or locally distributed throughout the body — MDR Annex I §13." />
          </Label>
          <TriStateBadge value={(keyTechnologyCharacteristics as any)?.absorbedDispersedInBody} className="ml-2" />
          {renderScopeAndGov('classification_absorbedDispersedInBody', (keyTechnologyCharacteristics as any)?.absorbedDispersedInBody)}
        </div>
        <RadioGroup
          value={
            (keyTechnologyCharacteristics as any)?.absorbedDispersedInBody === true
              ? "yes"
              : (keyTechnologyCharacteristics as any)?.absorbedDispersedInBody === false
                ? "no"
                : "unset"
          }
          onValueChange={(value) => {
            if (onKeyTechnologyCharacteristicsChange) {
              const next =
                value === "yes" ? true : value === "no" ? false : null;
              onKeyTechnologyCharacteristicsChange({
                ...keyTechnologyCharacteristics,
                absorbedDispersedInBody: next,
              } as DeviceCharacteristics);
            }
          }}
          disabled={isLoading}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="absorbed-no" />
            <Label htmlFor="absorbed-no">No substances absorbed/dispersed in the body</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="absorbed-yes" />
            <Label htmlFor="absorbed-yes">Substances are absorbed or dispersed in the body</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="unset" id="absorbed-unset" />
            <Label htmlFor="absorbed-unset" className="text-muted-foreground">Not yet assessed</Label>
          </div>
        </RadioGroup>
      </div>

      {/* CMR / endocrine-disruptor substances — GSPR 10.4.1 */}
      <div id="cmr-substances-section">
        <div className="flex items-center gap-1 mb-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            Contains CMR substances or endocrine disruptors
            <HelpTooltip content="Carcinogenic, mutagenic, or reproductive toxicants per Regulation (EC) 1272/2008, or endocrine-disrupting substances per MDR Annex I §10.4.1. Includes substances above 0.1% w/w in parts intended to come into body contact." />
          </Label>
          <TriStateBadge value={(keyTechnologyCharacteristics as any)?.cmrSubstances} className="ml-2" />
          {renderScopeAndGov('classification_cmrSubstances', (keyTechnologyCharacteristics as any)?.cmrSubstances)}
        </div>
        <RadioGroup
          value={
            (keyTechnologyCharacteristics as any)?.cmrSubstances === true
              ? "yes"
              : (keyTechnologyCharacteristics as any)?.cmrSubstances === false
                ? "no"
                : "unset"
          }
          onValueChange={(value) => {
            if (onKeyTechnologyCharacteristicsChange) {
              const next =
                value === "yes" ? true : value === "no" ? false : null;
              onKeyTechnologyCharacteristicsChange({
                ...keyTechnologyCharacteristics,
                cmrSubstances: next,
              } as DeviceCharacteristics);
            }
          }}
          disabled={isLoading}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="cmr-no" />
            <Label htmlFor="cmr-no">No CMR / endocrine-disrupting substances</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="cmr-yes" />
            <Label htmlFor="cmr-yes">Contains CMR or endocrine-disrupting substances</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="unset" id="cmr-unset" />
            <Label htmlFor="cmr-unset" className="text-muted-foreground">Not yet assessed</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Connectivity Features */}
      <div id="connectivity-emc-section">
        <div className="flex items-center gap-1 mb-3">
          <Label className="text-sm font-medium">{lang('deviceBasics.technical.connectivityLabel')}</Label>
          {(() => {
            const ktc: any = keyTechnologyCharacteristics;
            // Roll the connectivity answer up into a single tri-state value for the badge.
            // - hasNoConnectivity === true → user chose "No connectivity" → false
            // - any protocol flag true     → user chose "Has connectivity" → true
            // - hasNoConnectivity === null/undefined AND no protocols      → unanswered
            const anyProtocol = !!(ktc?.hasBluetooth || ktc?.hasWifi || ktc?.hasCellular || ktc?.hasUsb);
            const tri: boolean | null =
              ktc?.hasNoConnectivity === true ? false : anyProtocol ? true : null;
            return <TriStateBadge value={tri} className="ml-2" />;
          })()}
          {renderScopeAndGov('technical_connectivity', extractSectionValue('technical_connectivity', keyTechnologyCharacteristics))}
        </div>
        {wrapWithOverlay('technical_connectivity', (
          (() => {
            const ktc: any = keyTechnologyCharacteristics;
            const anyProtocol = !!(ktc?.hasBluetooth || ktc?.hasWifi || ktc?.hasCellular || ktc?.hasUsb);
            // Tri-state parent: 'has' = device has connectivity (show protocols),
            // 'none' = device has no connectivity, 'unset' = not yet assessed.
            const parentValue: 'has' | 'none' | 'unset' =
              ktc?.hasNoConnectivity === true
                ? 'none'
                : anyProtocol || ktc?.hasNoConnectivity === false
                  ? 'has'
                  : 'unset';

            const setParent = (val: 'has' | 'none' | 'unset') => {
              if (!onKeyTechnologyCharacteristicsChange) return;
              if (val === 'none') {
                // Explicit: no connectivity → clear all protocol flags so the
                // useProductDeviceContext rollup reports a clean false.
                onKeyTechnologyCharacteristicsChange({
                  ...keyTechnologyCharacteristics,
                  hasNoConnectivity: true,
                  hasBluetooth: false,
                  hasWifi: false,
                  hasCellular: false,
                  hasUsb: false,
                } as DeviceCharacteristics);
              } else if (val === 'has') {
                // Device has connectivity — clear the negative flag, leave protocols
                // for the user to tick.
                onKeyTechnologyCharacteristicsChange({
                  ...keyTechnologyCharacteristics,
                  hasNoConnectivity: false,
                } as DeviceCharacteristics);
              } else {
                // Not yet assessed — clear the negative flag (null = unanswered).
                onKeyTechnologyCharacteristicsChange({
                  ...keyTechnologyCharacteristics,
                  hasNoConnectivity: null,
                } as DeviceCharacteristics);
              }
            };

            return (
              <div className="space-y-3">
                <RadioGroup
                  value={parentValue}
                  onValueChange={(v) => setParent(v as 'has' | 'none' | 'unset')}
                  className="flex flex-col gap-2"
                  disabled={isLoading}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="has" id="connectivity-has" />
                    <Label htmlFor="connectivity-has">Device has connectivity</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="connectivity-none" />
                    <Label htmlFor="connectivity-none" className="flex items-center gap-2">
                      {lang('deviceBasics.technical.noConnectivity')}
                      <HelpTooltip content={lang('deviceBasics.technical.noConnectivityTooltip')} />
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unset" id="connectivity-unset" />
                    <Label htmlFor="connectivity-unset" className="text-muted-foreground">Not yet assessed</Label>
                  </div>
                </RadioGroup>

                {parentValue === 'has' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6 border-l-2 border-border">
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
                  </div>
                )}
              </div>
            );
          })()
        ))}
      </div>

      {/* EMC profile — GSPR 14 / 17.2 (only for active/powered devices) */}
      {isActiveDevice === true && (
        <div id="emc-profile-section">
          <div className="flex items-center gap-1 mb-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              EMC profile
              <HelpTooltip content="Electromagnetic compatibility standard applied to the device — MDR Annex I §14 / §17.2. Required for powered devices." />
            </Label>
            {renderScopeAndGov('classification_emcProfile', (keyTechnologyCharacteristics as any)?.emcProfile)}
          </div>
          <Select
            value={(keyTechnologyCharacteristics as any)?.emcProfile || undefined}
            onValueChange={(value) => {
              if (onKeyTechnologyCharacteristicsChange) {
                onKeyTechnologyCharacteristicsChange({
                  ...keyTechnologyCharacteristics,
                  emcProfile: value,
                } as DeviceCharacteristics);
              }
            }}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full md:w-80">
              <SelectValue placeholder="Select EMC profile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="N/A">N/A — no electrical/electronic components</SelectItem>
              <SelectItem value="IEC 60601-1-2">IEC 60601-1-2 (medical electrical equipment)</SelectItem>
              <SelectItem value="IEC 61326">IEC 61326 (laboratory/measurement equipment)</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

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
