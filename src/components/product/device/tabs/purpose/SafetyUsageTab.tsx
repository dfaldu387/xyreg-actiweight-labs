import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextField } from "@/components/shared/RichTextField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, HelpCircle, Check, Clock, Sparkles, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FieldSuggestion, productDefinitionAIService, DeviceContext, hasMinimumContext } from '@/services/productDefinitionAIService';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { ContextWarningToast, getMissingFieldsWithNavigation, getContextSources } from '../../ai-assistant/ContextWarningToast';
import { InheritanceExclusionPopover } from '@/components/shared/InheritanceExclusionPopover';
import { resolveFieldValue, normalizeScopeValue } from '@/hooks/useAutoSyncScope';
import type { ItemExclusionScope } from '@/hooks/useInheritanceExclusion';

import { Json } from '@/integrations/supabase/types';
import { StorageSterilityHandlingSection } from '../../sections/StorageSterilityHandlingSection';
import { StorageSterilityHandlingData } from '@/types/storageHandling';
import { DeviceCharacteristics } from '@/types/client.d';
import { useFieldGovernance } from '@/hooks/useFieldGovernance';
import { useMultiFieldGovernanceGuard } from '@/hooks/useMultiFieldGovernanceGuard';
import { GovernanceBookmark } from '@/components/ui/GovernanceBookmark';
import { GovernanceEditConfirmDialog } from '@/components/ui/GovernanceEditConfirmDialog';

const normalizeArrayField = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    if (value.trim() === '') return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value];
    }
  }
  return [];
};

interface IntendedPurposeData {
  warnings?: string[];
  side_effects?: string[];
  residual_risks?: string[];
  disposal_instructions?: string;
  interactions?: string[];
}

interface SafetyUsageTabProps {
  intendedPurposeData?: IntendedPurposeData;
  contraindications?: string[];
  onIntendedPurposeDataChange?: (value: IntendedPurposeData) => void;
  onContraindicationsChange?: (value: string[]) => void;
  isLoading?: boolean;
  aiSuggestions?: FieldSuggestion[];
  onAcceptAISuggestion?: (fieldType: string, suggestion: string) => void;
  companyId?: string;
  productName?: string;
  setAiLoading?: (fieldType: string, isLoading: boolean) => void;
  isAiLoading?: (fieldType: string) => boolean;
  isAiButtonDisabled?: (fieldType: string) => boolean;
  disabled?: boolean;
  deviceContext?: DeviceContext;
  belongsToFamily?: boolean;
  getFieldScope?: (fieldKey: string) => 'individual' | 'product_family';
  onFieldScopeChange?: (fieldKey: string, scope: 'individual' | 'product_family') => void;
  getFamilyValue?: (fieldKey: string) => Json | undefined;
  hasFamilyValue?: (fieldKey: string) => boolean;
  isFieldPFMode?: (fieldKey: string) => boolean;
  onEditFamily?: () => void;
  productId?: string;
  saveFamilyValue?: (fieldKey: string, fieldValue: Json) => void;
  familyVariantCount?: number;
  isVariant?: boolean;
  masterDeviceName?: string;
  masterDeviceId?: string;
  fieldExclusion?: {
    getExclusionScope: (itemId: string) => import('@/hooks/useInheritanceExclusion').ItemExclusionScope;
    setExclusionScope: (itemId: string, scope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope) => void;
    getExclusionSummary: (itemId: string, totalProducts: number) => string;
  };
  // Storage & Handling
  storageSterilityHandling?: StorageSterilityHandlingData;
  deviceCharacteristics?: DeviceCharacteristics;
  onStorageSterilityHandlingChange?: (data: StorageSterilityHandlingData) => void;
  autoSyncScope?: (fieldKey: string, newValue: any) => void;
  familyProductIds?: string[];
  familyProducts?: any[];
  onScopeChangeWithPropagation?: (fieldKey: string, oldScope: ItemExclusionScope, newScope: ItemExclusionScope) => Promise<void>;
}

export function SafetyUsageTab({
  intendedPurposeData = {},
  contraindications = [],
  onIntendedPurposeDataChange,
  onContraindicationsChange,
  isLoading = false,
  aiSuggestions = [],
  onAcceptAISuggestion,
  companyId,
  productName,
  setAiLoading,
  isAiLoading,
  isAiButtonDisabled,
  disabled = false,
  deviceContext,
  belongsToFamily = false,
  getFieldScope,
  onFieldScopeChange,
  getFamilyValue,
  hasFamilyValue,
  isFieldPFMode,
  onEditFamily,
  productId,
  saveFamilyValue,
  familyVariantCount,
  isVariant = false,
  masterDeviceName,
  masterDeviceId,
  fieldExclusion,
  storageSterilityHandling,
  deviceCharacteristics,
  onStorageSterilityHandlingChange,
  autoSyncScope,
  familyProductIds,
  familyProducts,
  onScopeChangeWithPropagation,
}: SafetyUsageTabProps) {
  const { lang } = useTranslation();
  const [localData, setLocalData] = useState<IntendedPurposeData>(() => ({
    ...intendedPurposeData,
    warnings: normalizeArrayField(intendedPurposeData.warnings),
    side_effects: normalizeArrayField(intendedPurposeData.side_effects),
    residual_risks: normalizeArrayField(intendedPurposeData.residual_risks),
    interactions: normalizeArrayField(intendedPurposeData.interactions),
  }));
  const [newContraindication, setNewContraindication] = useState('');
  const [newWarning, setNewWarning] = useState('');
  const [newSideEffect, setNewSideEffect] = useState('');
  const [newResidualRisk, setNewResidualRisk] = useState('');
  const [newInteraction, setNewInteraction] = useState('');
  const [savingStates, setSavingStates] = useState<Set<string>>(new Set());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isInternalUpdateRef = useRef(false);

  // Governance data
  const FIELD_LABELS: Record<string, string> = {
    contraindications: 'Contraindications',
    warnings: 'Warnings & Precautions',
    sideEffects: 'Side Effects',
    residualRisks: 'Residual Risks',
    disposalInstructions: 'Disposal / End-of-Life',
    interactions: 'Interactions & Incompatibilities',
  };
  const { getSection } = useFieldGovernance(productId);
  const governanceFields = {
    contraindications: getSection('contraindications')?.status ?? null,
    warnings: getSection('warnings')?.status ?? null,
    sideEffects: getSection('sideEffects')?.status ?? null,
    residualRisks: getSection('residualRisks')?.status ?? null,
    disposalInstructions: getSection('disposalInstructions')?.status ?? null,
    interactions: getSection('interactions')?.status ?? null,
  };
  const { showDialog: govDialog, activeFieldLabel: govFieldLabel, guardEdit: govGuardEdit, confirmEdit: govConfirm, setShowDialog: setGovDialog } = useMultiFieldGovernanceGuard(productId, governanceFields);

  // Value-matching helpers for scope popovers
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

  const createValueMatchScopeChange = useCallback((fieldKey: string, currentValue: any) => {
    return (id: string, newScope: ItemExclusionScope) => {
      if (onScopeChangeWithPropagation && familyProducts?.length) {
        const matchIds = getMatchingProductIds(fieldKey, currentValue);
        const nonMatchingIds = matchIds
          ? (familyProductIds || []).filter(pid => !matchIds.includes(pid))
          : [];
        const oldScope: ItemExclusionScope = { excludedProductIds: nonMatchingIds, excludedCategories: [], isManualGroup: true };
        return onScopeChangeWithPropagation(id, oldScope, newScope);
      } else if (fieldExclusion) {
        return fieldExclusion.setExclusionScope(id, newScope);
      }
    };
  }, [onScopeChangeWithPropagation, familyProducts, getMatchingProductIds, familyProductIds, fieldExclusion]);

  useEffect(() => {
    if (!isInternalUpdateRef.current) {
      setLocalData({
        ...intendedPurposeData,
        warnings: normalizeArrayField(intendedPurposeData.warnings),
        side_effects: normalizeArrayField(intendedPurposeData.side_effects),
        residual_risks: normalizeArrayField(intendedPurposeData.residual_risks),
        interactions: normalizeArrayField(intendedPurposeData.interactions),
      });
    }
    isInternalUpdateRef.current = false;
  }, [intendedPurposeData]);

  // Map data field keys to scope keys for autoSyncScope
  const fieldToScopeKey: Record<string, string> = {
    warnings: 'warningsPrecautions',
    side_effects: 'sideEffects',
    residual_risks: 'residualRisks',
    interactions: 'interactions',
    disposal_instructions: 'disposalInstructions',
  };

  const handleImmediateFieldChange = useCallback(async (field: keyof IntendedPurposeData, value: any) => {
    if (!onIntendedPurposeDataChange) return;

    const existingTimeout = timeoutRefs.current.get(field);
    if (existingTimeout) clearTimeout(existingTimeout);

    setSavingStates(prev => new Set(prev).add(field));
    isInternalUpdateRef.current = true;

    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    onIntendedPurposeDataChange(updatedData);

    const timeoutId = setTimeout(() => {
      setSavingStates(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
      timeoutRefs.current.delete(field);
    }, 1000);

    timeoutRefs.current.set(field, timeoutId);
  }, [localData, onIntendedPurposeDataChange]);

  const getSaveStatusIcon = (field: string) => {
    const isSaving = savingStates.has(field);
    if (isSaving) {
      return <Clock className="h-4 w-4 text-orange-500 animate-pulse" />;
    }
    const govRecord = getSection(field);
    if (govRecord && govRecord.status !== 'draft') {
      return (
        <GovernanceBookmark
          status={govRecord.status}
          designReviewId={govRecord.design_review_id}
          verdictComment={govRecord.verdict_comment}
          approvedAt={govRecord.approved_at}
          productId={productId}
          sectionLabel={FIELD_LABELS[field] || field}
        />
      );
    }
    return <GovernanceBookmark status={null} />;
  };

  // Contraindications handlers
  const handleAddContraindication = () => {
    const trimmedValue = newContraindication.trim();
    if (!trimmedValue || !onContraindicationsChange) return;
    if (contraindications.includes(trimmedValue)) {
      setNewContraindication('');
      return;
    }
    const updated = [...contraindications, trimmedValue];
    onContraindicationsChange(updated);
    setNewContraindication('');
  };

  const handleRemoveContraindication = (index: number) => {
    if (!onContraindicationsChange) return;
    const updated = [...contraindications];
    updated.splice(index, 1);
    onContraindicationsChange(updated);
  };

  // Warnings handlers
  const handleAddWarning = () => {
    const trimmedValue = newWarning.trim();
    if (!trimmedValue) return;
    const warnings = localData.warnings || [];
    if (warnings.includes(trimmedValue)) {
      setNewWarning('');
      return;
    }
    handleImmediateFieldChange('warnings', [...warnings, trimmedValue]);
    setNewWarning('');
  };

  const handleRemoveWarning = (index: number) => {
    const warnings = localData.warnings || [];
    const updated = [...warnings];
    updated.splice(index, 1);
    handleImmediateFieldChange('warnings', updated);
  };

  // Generic tag add/remove for new fields
  const handleAddTag = (field: 'side_effects' | 'residual_risks' | 'interactions', value: string, setter: (v: string) => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const current = localData[field] || [];
    if ((current as string[]).includes(trimmed)) {
      setter('');
      return;
    }
    handleImmediateFieldChange(field, [...(current as string[]), trimmed]);
    setter('');
  };

  const handleRemoveTag = (field: 'side_effects' | 'residual_risks' | 'interactions', index: number) => {
    const current = localData[field] || [];
    const updated = [...(current as string[])];
    updated.splice(index, 1);
    handleImmediateFieldChange(field, updated);
  };

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    };
  }, []);

  // Reusable tag-based card section renderer
  const renderTagCard = ({
    title,
    fieldKey,
    scopeKey,
    items,
    newValue,
    setNewValue,
    onAdd,
    onRemove,
    badgeVariant,
    badgeClassName,
    removeBtnClassName,
    placeholder,
    tooltipText,
    aiFieldType,
    aiPromptLabel,
    aiPromptDesc,
    aiPromptInstr,
  }: {
    title: string;
    fieldKey: string;
    scopeKey: string;
    items: string[];
    newValue: string;
    setNewValue: (v: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
    badgeClassName?: string;
    removeBtnClassName?: string;
    placeholder: string;
    tooltipText?: string;
    aiFieldType?: string;
    aiPromptLabel?: string;
    aiPromptDesc?: string;
    aiPromptInstr?: string;
  }) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {title}
            {tooltipText && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-80">{tooltipText}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {aiFieldType && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-transparent"
                      disabled={isAiLoading?.(aiFieldType) || isAiButtonDisabled?.(aiFieldType) || !setAiLoading || !companyId}
                      onClick={async () => {
                        if (!onAcceptAISuggestion || !companyId || isAiLoading?.(aiFieldType)) return;
                        const validation = hasMinimumContext(deviceContext);
                        if (!validation.valid) {
                          const missingFieldsWithNav = getMissingFieldsWithNavigation(validation.missingFields);
                          toast.error(<ContextWarningToast missingFields={missingFieldsWithNav} />, { duration: 8000 });
                          return;
                        }
                        setAiLoading?.(aiFieldType, true);
                        try {
                          const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                            productName || 'Current Medical Device',
                            aiPromptLabel || title,
                            aiPromptDesc || `List relevant ${title.toLowerCase()} for this device.`,
                            '',
                            aiFieldType,
                            companyId,
                            aiPromptInstr || `Provide 1 specific item. Use clear, medical terminology. Maximum 5-8 words. (don't use *, "", :, etc.)`,
                            deviceContext
                          );
                          if (response.success && response.suggestions?.[0]) {
                            const suggestion = response.suggestions[0].suggestion
                              .replace(/^[\d\s•*\-\.:]+\s*/, '')
                              .replace(/["']/g, '')
                              .replace(/[^\w\s\-]/g, '')
                              .trim();
                            if (suggestion) setNewValue(suggestion);
                          }
                        } catch (error) {
                          console.error('AI suggestion error:', error);
                        } finally {
                          setAiLoading?.(aiFieldType, false);
                        }
                      }}
                    >
                      {isAiLoading?.(aiFieldType) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>AI Suggestion</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {belongsToFamily && companyId && productId && fieldExclusion ? (
              <InheritanceExclusionPopover
                companyId={companyId}
                currentProductId={productId}
                itemId={scopeKey}
                exclusionScope={fieldExclusion.getExclusionScope(scopeKey)}
                onScopeChange={createValueMatchScopeChange(scopeKey, items)}
                defaultCurrentDeviceOnly
                familyProductIds={familyProductIds}
                valueMatchingProductIds={getMatchingProductIds(scopeKey, items)}
              />
            ) : null}
            {getSaveStatusIcon(fieldKey)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(isFieldPFMode?.(scopeKey)
                ? normalizeArrayField(getFamilyValue?.(scopeKey))
                : items
              ).map((item, index, arr) => (
                <Badge key={index} variant={badgeVariant || 'secondary'} className={`flex items-center gap-2 min-h-[2rem] ${badgeClassName || ''}`}>
                  {item}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-4 w-4 ${removeBtnClassName || ''}`}
                    onClick={() => {
                      if (isFieldPFMode?.(scopeKey)) {
                        saveFamilyValue?.(scopeKey, JSON.stringify(arr.filter((_, i) => i !== index)));
                      } else {
                        onRemove(index);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={placeholder}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (isFieldPFMode?.(scopeKey)) {
                      const currentPF = normalizeArrayField(getFamilyValue?.(scopeKey));
                      saveFamilyValue?.(scopeKey, JSON.stringify([...currentPF, newValue.trim()]));
                      setNewValue('');
                    } else {
                      onAdd();
                    }
                  }
                }}
                disabled={isLoading}
              />
              <Button
                onClick={() => {
                if (isFieldPFMode?.(scopeKey)) {
                    const currentPF = normalizeArrayField(getFamilyValue?.(scopeKey));
                    saveFamilyValue?.(scopeKey, JSON.stringify([...currentPF, newValue.trim()]));
                    setNewValue('');
                  } else {
                    onAdd();
                  }
                }}
                disabled={!newValue.trim() || isLoading}
                variant="secondary"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-4 ${disabled ? 'pointer-events-none' : ''}`}>
      {/* Contraindications */}
      {renderTagCard({
        title: lang('devicePurpose.safety.contraindicationsLabel'),
        fieldKey: 'contraindications',
        scopeKey: 'contraindications',
        items: contraindications,
        newValue: newContraindication,
        setNewValue: setNewContraindication,
        onAdd: handleAddContraindication,
        onRemove: handleRemoveContraindication,
        badgeVariant: 'destructive',
        removeBtnClassName: 'hover:bg-destructive-foreground hover:text-destructive',
        placeholder: lang('devicePurpose.safety.addContraindication'),
        tooltipText: lang('devicePurpose.safety.contraindicationsTooltip'),
        aiFieldType: 'contraindications',
        aiPromptLabel: 'Contraindications',
        aiPromptDesc: 'List conditions, situations, or patient characteristics where the device should NOT be used due to safety concerns.',
        aiPromptInstr: 'Provide 1 specific contraindication. Use clear, medical terminology. Focus on safety-critical conditions With maximum 5-8 words. (don\'t use *, "", :, etc.)',
      })}

      {/* Warnings & Precautions */}
      {renderTagCard({
        title: lang('devicePurpose.safety.warningsLabel'),
        fieldKey: 'warnings',
        scopeKey: 'warningsPrecautions',
        items: localData.warnings || [],
        newValue: newWarning,
        setNewValue: setNewWarning,
        onAdd: handleAddWarning,
        onRemove: handleRemoveWarning,
        badgeVariant: 'secondary',
        badgeClassName: 'bg-yellow-100 border-yellow-300 text-yellow-900',
        removeBtnClassName: 'hover:bg-yellow-200',
        placeholder: lang('devicePurpose.safety.addWarning'),
        tooltipText: lang('devicePurpose.safety.warningsTooltip'),
        aiFieldType: 'warnings',
        aiPromptLabel: 'Warnings & Precautions',
        aiPromptDesc: 'List important safety warnings and precautions that users should be aware of when using the device.',
        aiPromptInstr: 'Provide 1 specific warning or precaution. Use clear, medical terminology. Focus on safety-critical warnings With maximum 5-8 words. (don\'t use *, "", :, etc.)',
      })}

      {/* Side Effects / Undesirable Effects — MDR 23.4(h) */}
      {renderTagCard({
        title: 'Side Effects / Undesirable Effects',
        fieldKey: 'sideEffects',
        scopeKey: 'sideEffects',
        items: localData.side_effects || [],
        newValue: newSideEffect,
        setNewValue: setNewSideEffect,
        onAdd: () => handleAddTag('side_effects', newSideEffect, setNewSideEffect),
        onRemove: (i) => handleRemoveTag('side_effects', i),
        badgeVariant: 'secondary',
        badgeClassName: 'bg-orange-100 border-orange-300 text-orange-900',
        removeBtnClassName: 'hover:bg-orange-200',
        placeholder: 'Add a side effect or undesirable effect...',
        tooltipText: 'Known risks and undesirable effects that must be communicated to users (MDR Annex I, 23.4(h)).',
        aiFieldType: 'sideEffects',
        aiPromptLabel: 'Side Effects / Undesirable Effects',
        aiPromptDesc: 'List known side effects or undesirable effects associated with using this medical device.',
        aiPromptInstr: 'Provide 1 specific side effect. Use clear, medical terminology. Maximum 5-8 words. (don\'t use *, "", :, etc.)',
      })}

      {/* Residual Risks — MDR 23.4(p) */}
      {renderTagCard({
        title: 'Residual Risks',
        fieldKey: 'residualRisks',
        scopeKey: 'residualRisks',
        items: localData.residual_risks || [],
        newValue: newResidualRisk,
        setNewValue: setNewResidualRisk,
        onAdd: () => handleAddTag('residual_risks', newResidualRisk, setNewResidualRisk),
        onRemove: (i) => handleRemoveTag('residual_risks', i),
        badgeVariant: 'secondary',
        badgeClassName: 'bg-purple-100 border-purple-300 text-purple-900',
        removeBtnClassName: 'hover:bg-purple-200',
        placeholder: 'Add a residual risk...',
        tooltipText: 'Risks remaining after risk mitigation measures have been applied (MDR Annex I, 23.4(p)).',
        aiFieldType: 'residualRisks',
        aiPromptLabel: 'Residual Risks',
        aiPromptDesc: 'List residual risks that remain after applying risk control measures for this medical device.',
        aiPromptInstr: 'Provide 1 specific residual risk. Use clear, medical terminology. Maximum 5-8 words. (don\'t use *, "", :, etc.)',
      })}

      {/* Interactions & Incompatibilities — MDR 23.4(i) */}
      {renderTagCard({
        title: 'Interactions & Incompatibilities',
        fieldKey: 'interactions',
        scopeKey: 'interactions',
        items: localData.interactions || [],
        newValue: newInteraction,
        setNewValue: setNewInteraction,
        onAdd: () => handleAddTag('interactions', newInteraction, setNewInteraction),
        onRemove: (i) => handleRemoveTag('interactions', i),
        badgeVariant: 'secondary',
        badgeClassName: 'bg-blue-100 border-blue-300 text-blue-900',
        removeBtnClassName: 'hover:bg-blue-200',
        placeholder: 'Add an interaction or incompatibility...',
        tooltipText: 'Known interactions with other devices, substances, medicines, or materials (MDR Annex I, 23.4(i)).',
        aiFieldType: 'interactions',
        aiPromptLabel: 'Interactions & Incompatibilities',
        aiPromptDesc: 'List known interactions or incompatibilities with other devices, substances, or medicines.',
        aiPromptInstr: 'Provide 1 specific interaction or incompatibility. Use clear, medical terminology. Maximum 5-8 words. (don\'t use *, "", :, etc.)',
      })}

      {/* Disposal / End-of-Life — MDR 23.4(u) */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Disposal / End-of-Life
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-80">Safe disposal, recycling, or decommissioning instructions for the device (MDR Annex I, 23.4(u)).</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <div className="flex items-center gap-2">
              {belongsToFamily && companyId && productId && fieldExclusion ? (
                <InheritanceExclusionPopover
                  companyId={companyId}
                  currentProductId={productId}
                  itemId="disposalInstructions"
                  exclusionScope={fieldExclusion.getExclusionScope('disposalInstructions')}
                  onScopeChange={createValueMatchScopeChange('disposalInstructions', localData.disposal_instructions || '')}
                  defaultCurrentDeviceOnly
                  familyProductIds={familyProductIds}
                  valueMatchingProductIds={getMatchingProductIds('disposalInstructions', localData.disposal_instructions || '')}
                />
              ) : null}
              {getSaveStatusIcon('disposalInstructions')}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          
            <RichTextField
              placeholder="Describe safe disposal, recycling, or decommissioning procedures..."
              value={
                isFieldPFMode?.('disposalInstructions')
                  ? (getFamilyValue?.('disposalInstructions') as string || '')
                  : (localData.disposal_instructions || '')
              }
              onChange={(html) => {
                if (isFieldPFMode?.('disposalInstructions')) {
                  saveFamilyValue?.('disposalInstructions', html);
                } else {
                  handleImmediateFieldChange('disposal_instructions', html);
                }
              }}
              disabled={isLoading}
              minHeight="100px"
            />
          
        </CardContent>
      </Card>

      {/* Storage, Sterility & Handling */}
      <StorageSterilityHandlingSection
        data={storageSterilityHandling}
        onChange={onStorageSterilityHandlingChange}
        deviceCharacteristics={deviceCharacteristics}
        isLoading={isLoading}
        productId={productId}
        belongsToFamily={belongsToFamily}
        getFieldScope={getFieldScope}
        onFieldScopeChange={onFieldScopeChange}
        isVariant={isVariant}
        masterDeviceName={masterDeviceName}
        masterDeviceId={masterDeviceId}
        isFieldPFMode={isFieldPFMode}
      />

      {/* Governance Edit Warning Dialog */}
      <GovernanceEditConfirmDialog
        open={govDialog}
        onOpenChange={setGovDialog}
        onConfirm={govConfirm}
        sectionLabel={govFieldLabel}
      />

    </div>
  );
}
