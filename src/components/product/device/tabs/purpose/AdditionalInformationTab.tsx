import React, { useCallback, useRef, useState, useMemo } from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextField } from "@/components/shared/RichTextField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HelpCircle, Sparkles, Loader2, Plus, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FieldSuggestion, productDefinitionAIService } from '@/services/productDefinitionAIService';
import { useTranslation } from '@/hooks/useTranslation';
import { InheritanceExclusionPopover } from '@/components/shared/InheritanceExclusionPopover';
import { resolveFieldValue, normalizeScopeValue } from '@/hooks/useAutoSyncScope';
import type { ItemExclusionScope } from '@/hooks/useInheritanceExclusion';

import { GovernanceBookmark } from '@/components/ui/GovernanceBookmark';
import { useFieldGovernance } from '@/hooks/useFieldGovernance';

import { Json } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { AISuggestionReviewDialog } from '@/components/product/ai-assistant/AISuggestionReviewDialog';

interface CustomField {
  id: string;
  label: string;
  value: string;
}

interface UserInstructions {
  how_to_use?: string;
  charging?: string;
  maintenance?: string;
  custom_fields?: CustomField[];
}

interface AdditionalInformationTabProps {
  userInstructions?: UserInstructions;
  onUserInstructionsChange?: (value: UserInstructions) => void;
  isLoading?: boolean;
  aiSuggestions?: FieldSuggestion[];
  onAcceptAISuggestion?: (fieldType: string, suggestion: string) => void;
  companyId?: string;
  productName?: string;
  productId?: string;
  setAiLoading?: (fieldType: string, isLoading: boolean) => void;
  isAiLoading?: (fieldType: string) => boolean;
  isAiButtonDisabled?: (fieldType: string) => boolean;
  disabled?: boolean;
  belongsToFamily?: boolean;
  getFieldScope?: (fieldKey: string) => 'individual' | 'product_family';
  onFieldScopeChange?: (fieldKey: string, scope: 'individual' | 'product_family') => void;
  getFamilyValue?: (fieldKey: string) => Json | undefined;
  hasFamilyValue?: (fieldKey: string) => boolean;
  isFieldPFMode?: (fieldKey: string) => boolean;
  onEditFamily?: () => void;
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
  autoSyncScope?: (fieldKey: string, newValue: any) => void;
  familyProductIds?: string[];
  familyProducts?: any[];
  onScopeChangeWithPropagation?: (fieldKey: string, oldScope: ItemExclusionScope, newScope: ItemExclusionScope) => Promise<void>;
}

export function AdditionalInformationTab({
  userInstructions = {},
  onUserInstructionsChange,
  isLoading = false,
  aiSuggestions = [],
  onAcceptAISuggestion,
  companyId,
  productName,
  productId,
  setAiLoading,
  isAiLoading,
  isAiButtonDisabled,
  disabled = false,
  belongsToFamily = false,
  getFieldScope,
  onFieldScopeChange,
  getFamilyValue,
  hasFamilyValue,
  isFieldPFMode,
  onEditFamily,
  saveFamilyValue,
  familyVariantCount,
  isVariant = false,
  masterDeviceName,
  masterDeviceId,
  fieldExclusion,
  autoSyncScope,
  familyProductIds,
  familyProducts,
  onScopeChangeWithPropagation,
}: AdditionalInformationTabProps) {
  const { lang } = useTranslation();
  const [activeUserInstructionTab, setActiveUserInstructionTab] = useState('how_to_use');
  const { getSection } = useFieldGovernance(productId);

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

  const getGovIcon = (sectionKey: string, label: string) => {
    const gov = getSection(sectionKey);
    if (gov && gov.status !== 'draft') {
      return (
        <GovernanceBookmark
          status={gov.status}
          designReviewId={gov.design_review_id}
          verdictComment={gov.verdict_comment}
          approvedAt={gov.approved_at}
          productId={productId}
          sectionLabel={label}
        />
      );
    }
    return <GovernanceBookmark status={null} />;
  };

  

  // Local state for instructions (used for both IP and PF mode)
  const [localInstructions, setLocalInstructions] = useState<UserInstructions>(userInstructions);
  const [pendingSuggestion, setPendingSuggestion] = useState<{
    fieldLabel: string;
    fieldKey: string;
    original: string;
    suggested: string;
  } | null>(null);

  // Track whether we have unsaved local changes to prevent sync from overwriting
  const isInternalRef = useRef(false);
  const internalTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const setInternalGuard = useCallback(() => {
    isInternalRef.current = true;
    clearTimeout(internalTimerRef.current);
    internalTimerRef.current = setTimeout(() => { isInternalRef.current = false; }, 1000);
  }, []);

  // Check if any sub-field has its own Device Applicability scope
  const hasAnySubFieldScope = React.useMemo(() => {
    if (!fieldExclusion) return false;
    return ['userInstructions_howToUse', 'userInstructions_charging', 'userInstructions_maintenance']
      .some(key => {
        const s = fieldExclusion.getExclusionScope(key);
        return s && (s.isManualGroup || s.excludedProductIds !== undefined);
      });
  }, [fieldExclusion]);

  // When sub-field scopes exist, treat as individual mode (not PF)
  const effectivePFMode = isFieldPFMode?.('userInstructions') && !hasAnySubFieldScope;

  // Sync from props (IP mode) — always preserve custom_fields from props
  const prevPropsRef = useRef(userInstructions);
  React.useEffect(() => {
    if (isInternalRef.current) return;
    if (effectivePFMode) {
      // Even in PF mode, sync custom_fields from props (they live on the variant record)
      const propsCustom = userInstructions.custom_fields || [];
      const localCustom = localInstructions.custom_fields || [];
      if (JSON.stringify(propsCustom) !== JSON.stringify(localCustom) && propsCustom.length > 0) {

        setLocalInstructions(prev => ({ ...prev, custom_fields: propsCustom }));
      }
      return;
    }
    // Only sync if props actually changed (not our own save echoing back)
    if (JSON.stringify(userInstructions) !== JSON.stringify(prevPropsRef.current)) {

      prevPropsRef.current = userInstructions;
      setLocalInstructions(userInstructions);
    }
  }, [userInstructions, effectivePFMode]);

  // Sync from family values (PF mode) — only on initial load
  // Always preserve variant's own custom_fields (they are never inherited from master)
  const familyLoadedRef = useRef(false);
  React.useEffect(() => {
    if (isInternalRef.current) return;
    if (!effectivePFMode) return;
    if (familyLoadedRef.current) return;
    const raw = getFamilyValue?.('userInstructions');
    if (!raw) return;
    let fv: UserInstructions = {};
    if (typeof raw === 'string') {
      try { fv = JSON.parse(raw); } catch { return; }
    } else {
      fv = raw as UserInstructions;
    }
    if (Object.keys(fv).length > 0) {

      // Preserve variant's own custom_fields — master doesn't own them
      setLocalInstructions(prev => ({
        ...fv,
        custom_fields: prev.custom_fields || userInstructions.custom_fields || [],
      }));
      familyLoadedRef.current = true;
    }
  }, [effectivePFMode, getFamilyValue]);

  const handleInstructionChange = useCallback((field: string, value: string) => {
    if (!onUserInstructionsChange) return;
    setInternalGuard();
    const updated = { ...userInstructions, [field]: value };
    onUserInstructionsChange(updated);
  }, [onUserInstructionsChange, userInstructions, setInternalGuard]);

  // Map user_instructions JSON sub-key to the fieldKey used by autoSyncScope
  const instructionFieldKeyMap: Record<string, string> = {
    'how_to_use': 'userInstructions_howToUse',
    'charging': 'userInstructions_charging',
    'maintenance': 'userInstructions_maintenance',
  };

  const guardedInstructionChange = useCallback((field: string, value: string) => {
    const syncKey = instructionFieldKeyMap[field];

    if (effectivePFMode) {
      setLocalInstructions(prev => ({ ...prev, [field]: value }));
    } else {
      setLocalInstructions(prev => ({ ...prev, [field]: value }));
      handleInstructionChange(field, value);
    }
  }, [effectivePFMode, handleInstructionChange]);

  const handlePfBlur = useCallback(() => {
    if (effectivePFMode) {
      saveFamilyValue?.('userInstructions', JSON.stringify(localInstructions));
    }
  }, [effectivePFMode, saveFamilyValue, localInstructions]);

  // Custom fields management
  const persistInstructions = useCallback((updated: UserInstructions) => {
    setLocalInstructions(updated);
    setInternalGuard();
    onUserInstructionsChange?.(updated);
  }, [onUserInstructionsChange, setInternalGuard]);

  const handleAddCustomField = useCallback(() => {
    const newField: CustomField = {
      id: crypto.randomUUID(),
      label: '',
      value: '',
    };
    // Auto-set new custom field scope to IP (individual) so it's variant-local
    const fieldKey = `userInstructions_custom_${newField.id}`;
    if (isVariant && onFieldScopeChange) {
      onFieldScopeChange(fieldKey, 'individual');
    }
    persistInstructions({
      ...localInstructions,
      custom_fields: [...(localInstructions.custom_fields || []), newField],
    });
  }, [localInstructions, persistInstructions, isVariant, onFieldScopeChange]);

  const handleCustomFieldChange = useCallback((fieldId: string, key: 'label' | 'value', val: string) => {
    const fields = (localInstructions.custom_fields || []).map(f =>
      f.id === fieldId ? { ...f, [key]: val } : f
    );
    persistInstructions({ ...localInstructions, custom_fields: fields });
  }, [localInstructions, persistInstructions]);

  const handleRemoveCustomField = useCallback((fieldId: string) => {
    const fields = (localInstructions.custom_fields || []).filter(f => f.id !== fieldId);
    persistInstructions({ ...localInstructions, custom_fields: fields });
  }, [localInstructions, persistInstructions]);

  // When a custom field's scope is toggled to PF on a variant, mirror it to the master
  const handleCustomScopeChange = useCallback(async (fieldKey: string, scope: 'individual' | 'product_family', fieldId: string) => {
    // Always apply the local scope change first
    onFieldScopeChange?.(fieldKey, scope);

    // If linking on a variant, propagate the field stub to master
    if (scope === 'product_family' && isVariant && masterDeviceId) {
      try {
        const localField = (localInstructions.custom_fields || []).find(f => f.id === fieldId);
        if (!localField) return;

        const { data: master } = await supabase
          .from('products')
          .select('user_instructions')
          .eq('id', masterDeviceId)
          .maybeSingle();

        const masterInstructions = ((master?.user_instructions as any) || {}) as UserInstructions;
        const masterCustom = masterInstructions.custom_fields || [];

        // Only add if not already present
        if (!masterCustom.find(f => f.id === fieldId)) {
          masterCustom.push({ id: fieldId, label: localField.label, value: '' });
          await supabase
            .from('products')
            .update({ user_instructions: { ...masterInstructions, custom_fields: masterCustom } as any })
            .eq('id', masterDeviceId);
        }
      } catch (err) {
        console.error('[AdditionalInformationTab] Failed to mirror custom field to master:', err);
      }
    }
  }, [onFieldScopeChange, isVariant, masterDeviceId, localInstructions.custom_fields]);

  return (
    <div className={`space-y-4 ${disabled ? 'pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <Label className="text-sm font-medium flex items-center gap-2">
          {lang('devicePurpose.additional.userInstructionsLabel')}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-80">{lang('devicePurpose.additional.userInstructionsTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  className='hover:bg-transparent'
                  disabled={isAiLoading?.(`user_instructions_${activeUserInstructionTab}`) || isAiButtonDisabled?.(`user_instructions_${activeUserInstructionTab}`) || !setAiLoading || !companyId}
                  onClick={async () => {
                    if (!onAcceptAISuggestion || !companyId || isAiLoading?.(`user_instructions_${activeUserInstructionTab}`)) return;

                    setAiLoading?.(`user_instructions_${activeUserInstructionTab}`, true);
                    try {
                      const fieldLabels: Record<string, string> = {
                        'how_to_use': 'How to Use',
                        'charging': 'Charging Instructions',
                        'maintenance': 'Maintenance Instructions'
                      };

                      const fieldDescriptions: Record<string, string> = {
                        'how_to_use': 'Describe how to use the device, including step-by-step instructions for proper operation.',
                        'charging': 'Describe charging instructions, including battery care, charging procedures, and power management.',
                        'maintenance': 'Describe maintenance instructions, including cleaning, storage, and routine care procedures.'
                      };

                      const requirements: Record<string, string> = {
                        'how_to_use': 'Provide clear, detailed step-by-step instructions for device operation. Use simple, user-friendly language. Focus on safety and proper usage. (don\'t use *, "", :, etc. but use 5-6 points (1,2,3 etc..))',
                        'charging': 'Provide specific charging instructions including battery care, charging procedures, and power management tips. (don\'t use *, "", :, etc. but use 2-3 sentences)',
                        'maintenance': 'Provide maintenance instructions including cleaning procedures, storage guidelines, and routine care steps. (don\'t use *, "", :, etc. but use 2-3 sentences)'
                      };

                      const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                        productName || 'Current Medical Device',
                        fieldLabels[activeUserInstructionTab] || activeUserInstructionTab,
                        fieldDescriptions[activeUserInstructionTab] || '',
                        (userInstructions as any)[activeUserInstructionTab] || '',
                        `user_instructions_${activeUserInstructionTab}`,
                        companyId,
                        requirements[activeUserInstructionTab] || ''
                      );

                      if (response.success && response.suggestions?.[0]) {
                        const suggestion = response.suggestions[0].suggestion;
                        const fieldLabels: Record<string, string> = {
                          'how_to_use': 'How to Use',
                          'charging': 'Charging',
                          'maintenance': 'Maintenance'
                        };
                        setPendingSuggestion({
                          fieldLabel: fieldLabels[activeUserInstructionTab] || activeUserInstructionTab,
                          fieldKey: `user_instructions_${activeUserInstructionTab}`,
                          original: (userInstructions as any)[activeUserInstructionTab] || '',
                          suggested: suggestion,
                        });
                      }
                    } catch (error) {
                      console.error('AI suggestion error:', error);
                    } finally {
                      setAiLoading?.(`user_instructions_${activeUserInstructionTab}`, false);
                    }
                  }}
                >
                  {isAiLoading?.(`user_instructions_${activeUserInstructionTab}`) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{lang('devicePurpose.aiSuggestion')} {activeUserInstructionTab === 'how_to_use' ? lang('devicePurpose.additional.howToUseTab') : activeUserInstructionTab === 'charging' ? lang('devicePurpose.additional.chargingTab') : lang('devicePurpose.additional.maintenanceTab')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
      </div>

      <div className="space-y-5">
        {/* How to Use */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="how_to_use" className="text-sm font-medium">
              {lang('devicePurpose.additional.howToUseTab')}
            </Label>
            <div className="flex items-center gap-1">
              {companyId && productId && fieldExclusion ? (
                <InheritanceExclusionPopover
                  companyId={companyId}
                  currentProductId={productId}
                  itemId="userInstructions_howToUse"
                  exclusionScope={fieldExclusion.getExclusionScope('userInstructions_howToUse')}
                  onScopeChange={createValueMatchScopeChange('userInstructions_howToUse', localInstructions.how_to_use || '')}
                  defaultCurrentDeviceOnly
                  familyProductIds={familyProductIds}
                  valueMatchingProductIds={getMatchingProductIds('userInstructions_howToUse', localInstructions.how_to_use || '')}
                />
              ) : null}
              {getGovIcon('user_instructions_how_to_use', 'How to Use')}
            </div>
          </div>
          
            <Textarea
              id="how_to_use"
              placeholder={lang('devicePurpose.additional.howToUsePlaceholder')}
              value={localInstructions.how_to_use || ''}
              onChange={(e) => guardedInstructionChange('how_to_use', e.target.value)}
              onBlur={handlePfBlur}
              className="min-h-[120px]"
              disabled={isLoading}
            />
          
        </div>

        {/* Charging */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="charging" className="text-sm font-medium">
              {lang('devicePurpose.additional.chargingTab')}
            </Label>
            <div className="flex items-center gap-1">
              {companyId && productId && fieldExclusion ? (
                <InheritanceExclusionPopover
                  companyId={companyId}
                  currentProductId={productId}
                  itemId="userInstructions_charging"
                  exclusionScope={fieldExclusion.getExclusionScope('userInstructions_charging')}
                  onScopeChange={createValueMatchScopeChange('userInstructions_charging', localInstructions.charging || '')}
                  defaultCurrentDeviceOnly
                  familyProductIds={familyProductIds}
                  valueMatchingProductIds={getMatchingProductIds('userInstructions_charging', localInstructions.charging || '')}
                />
              ) : null}
              {getGovIcon('user_instructions_charging', 'Charging Instructions')}
            </div>
          </div>
          
            <Textarea
              id="charging"
              placeholder={lang('devicePurpose.additional.chargingPlaceholder')}
              value={localInstructions.charging || ''}
              onChange={(e) => guardedInstructionChange('charging', e.target.value)}
              onBlur={handlePfBlur}
              className="min-h-[100px]"
              disabled={isLoading}
            />
          
        </div>

        {/* Maintenance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="maintenance" className="text-sm font-medium">
              {lang('devicePurpose.additional.maintenanceTab')}
            </Label>
            <div className="flex items-center gap-1">
              {companyId && productId && fieldExclusion ? (
                <InheritanceExclusionPopover
                  companyId={companyId}
                  currentProductId={productId}
                  itemId="userInstructions_maintenance"
                  exclusionScope={fieldExclusion.getExclusionScope('userInstructions_maintenance')}
                  onScopeChange={createValueMatchScopeChange('userInstructions_maintenance', localInstructions.maintenance || '')}
                  defaultCurrentDeviceOnly
                  familyProductIds={familyProductIds}
                  valueMatchingProductIds={getMatchingProductIds('userInstructions_maintenance', localInstructions.maintenance || '')}
                />
              ) : null}
              {getGovIcon('user_instructions_maintenance', 'Maintenance Instructions')}
            </div>
          </div>
          
            <Textarea
              id="maintenance"
              placeholder={lang('devicePurpose.additional.maintenancePlaceholder')}
              value={localInstructions.maintenance || ''}
              onChange={(e) => guardedInstructionChange('maintenance', e.target.value)}
              onBlur={handlePfBlur}
              className="min-h-[100px]"
              disabled={isLoading}
            />
          
        </div>

        {/* Custom fields */}
        {(localInstructions.custom_fields || []).map((field) => {
          const isCustomLinked = isVariant && !!isFieldPFMode?.(`userInstructions_custom_${field.id}`);
          return (
            <div key={field.id} className="space-y-2">
              <div className="flex items-center justify-between">
                
                  <div className="flex items-center gap-2">
                    <Input
                      value={field.label}
                      onChange={(e) => handleCustomFieldChange(field.id, 'label', e.target.value)}
                      placeholder="Field name (e.g. Storage, Disposal)..."
                      className="text-sm font-medium h-8 max-w-xs"
                      disabled={isLoading}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveCustomField(field.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                
                <div className="flex items-center gap-1">
                  {companyId && productId && fieldExclusion ? (
                    <InheritanceExclusionPopover
                      companyId={companyId}
                      currentProductId={productId}
                      itemId={`userInstructions_custom_${field.id}`}
                      exclusionScope={fieldExclusion.getExclusionScope(`userInstructions_custom_${field.id}`)}
                      onScopeChange={createValueMatchScopeChange(`userInstructions_custom_${field.id}`, field.value || '')}
                      defaultCurrentDeviceOnly
                      familyProductIds={familyProductIds}
                      valueMatchingProductIds={getMatchingProductIds(`userInstructions_custom_${field.id}`, field.value || '')}
                    />
                  ) : null}
                  {getGovIcon(`user_instructions_custom_${field.id}`, field.label || 'Custom Field')}
                </div>
              </div>
              
                <RichTextField
                  placeholder={`Enter ${field.label || 'custom'} instructions...`}
                  value={field.value}
                  onChange={(html) => handleCustomFieldChange(field.id, 'value', html)}
                  minHeight="100px"
                  disabled={isLoading}
                />
              
            </div>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddCustomField}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </div>
      {/* AI Suggestion Review Dialog */}
      <AISuggestionReviewDialog
        open={pendingSuggestion !== null}
        onOpenChange={(open) => !open && setPendingSuggestion(null)}
        fieldLabel={pendingSuggestion?.fieldLabel || ''}
        originalContent={pendingSuggestion?.original || ''}
        suggestedContent={pendingSuggestion?.suggested || ''}
        onAccept={(content) => {
          if (pendingSuggestion) {
            const tabKey = pendingSuggestion.fieldKey.replace('user_instructions_', '');
            handleInstructionChange(tabKey, content);
            onAcceptAISuggestion?.(pendingSuggestion.fieldKey, content);
          }
          setPendingSuggestion(null);
        }}
        onReject={() => setPendingSuggestion(null)}
      />

    </div>
  );
}
