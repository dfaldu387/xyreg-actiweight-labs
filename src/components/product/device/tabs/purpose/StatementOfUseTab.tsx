import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { RichTextField } from '@/components/shared/RichTextField';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, HelpCircle, Check, Clock, Sparkles, Plus, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { debounce } from '@/utils/debounce';
import { markdownToHtml } from '@/utils/markdownToHtml';
import { AIFieldButton } from '../../ai-assistant/AIFieldButton';
import { AIExplainerDialog } from '../../../ai-assistant/AIExplainerDialog';
import { FieldSuggestion, productDefinitionAIService, ProductDefinitionAIService, DeviceContext, hasMinimumContext } from '@/services/productDefinitionAIService';
import { toast } from 'sonner';
import { InvestorVisibleBadge } from '@/components/ui/investor-visible-badge';
import { useInvestorFlow } from '@/hooks/useInvestorFlow';
import { cn } from '@/lib/utils';
import { AISuggestionReviewDialog } from '@/components/product/ai-assistant/AISuggestionReviewDialog';
import { PendingFieldSuggestion } from '@/components/product/device/PendingFieldSuggestion';
import { ProductFieldSuggestion } from '@/hooks/useProductFieldSuggestions';
import { useTranslation } from '@/hooks/useTranslation';
import { ContextWarningToast, getMissingFieldsWithNavigation, getContextSources } from '../../ai-assistant/ContextWarningToast';
import { InheritanceExclusionPopover } from '@/components/shared/InheritanceExclusionPopover';
import { resolveFieldValue, normalizeScopeValue } from '@/hooks/useAutoSyncScope';

import { Json } from '@/integrations/supabase/types';
import { useFieldGovernance } from '@/hooks/useFieldGovernance';
import { useMultiFieldGovernanceGuard } from '@/hooks/useMultiFieldGovernanceGuard';
import { GovernanceBookmark } from '@/components/ui/GovernanceBookmark';
import { GovernanceEditConfirmDialog } from '@/components/ui/GovernanceEditConfirmDialog';

// Field configurations for AI explainer dialog
const AI_FIELD_CONFIGS = {
  intended_use: {
    name: 'Intended Use (The Why)',
    description: 'State the general, high-level medical purpose of the device.'
  },
  intended_function: {
    name: 'Intended Function (The What)',
    description: 'Describe what the device does and what it diagnoses, treats, monitors, or screens for.'
  },
  modeOfAction: {
    name: 'Mode of Action (The How)',
    description: 'Explain the technical mechanism by which the device achieves its intended function.'
  },
  value_proposition: {
    name: 'Value Proposition',
    description: 'Describe the unique value your device provides to patients, clinicians, and payers.'
  },
  clinical_benefits: {
    name: 'Clinical Benefits',
    description: 'List the key clinical benefits or outcomes that the device provides.'
  },
};

interface IntendedPurposeData {
  clinicalPurpose?: string;
  indications?: string;
  modeOfAction?: string;
  valueProposition?: string;
  intended_use_category?: string;
  
}

interface StatementOfUseTabProps {
  intendedPurposeData?: IntendedPurposeData;
  onIntendedPurposeDataChange?: (value: IntendedPurposeData) => void;
  clinicalBenefits?: string[];
  onClinicalBenefitsChange?: (value: string[]) => void;
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
  autoSyncScope?: (fieldKey: string, newValue: any) => void;
  familyProductIds?: string[];
  familyProducts?: any[];
  onScopeChangeWithPropagation?: (fieldKey: string, oldScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope, newScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope) => Promise<void>;
  fieldSuggestions?: ProductFieldSuggestion[];
  onAcceptFieldSuggestion?: (suggestion: ProductFieldSuggestion, newValue: string) => void;
  onRejectFieldSuggestion?: (suggestionId: string) => void;
}

export function StatementOfUseTab({
  intendedPurposeData = {},
  onIntendedPurposeDataChange,
  clinicalBenefits = [],
  onClinicalBenefitsChange,
  isLoading = false,
  aiSuggestions = [],
  onAcceptAISuggestion,
  companyId,
  productName,
  setAiLoading: externalSetAiLoading,
  isAiLoading: externalIsAiLoading,
  isAiButtonDisabled: externalIsAiButtonDisabled,
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
  autoSyncScope,
  familyProductIds,
  familyProducts,
  onScopeChangeWithPropagation,
  fieldSuggestions = [],
  onAcceptFieldSuggestion,
  onRejectFieldSuggestion,
}: StatementOfUseTabProps) {
  const { lang } = useTranslation();
  const { isInInvestorFlow } = useInvestorFlow();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share';
  const isInGapAnalysisFlow = returnTo === 'gap-analysis';

  const [localData, setLocalData] = useState<IntendedPurposeData>(intendedPurposeData);
  const [newBenefit, setNewBenefit] = useState('');
  const [savingStates, setSavingStates] = useState<Set<string>>(new Set());
  const [aiLoadingStates, setAiLoadingStates] = useState<Set<string>>(new Set());
  const [activeAiButton, setActiveAiButton] = useState<string | null>(null);
  const [explainerDialogField, setExplainerDialogField] = useState<keyof typeof AI_FIELD_CONFIGS | null>(null);
  const [cbSuggestions, setCbSuggestions] = useState<string[]>([]);
  const [selectedCbSuggestions, setSelectedCbSuggestions] = useState<Set<number>>(new Set());
  const [cbSuggestDialogOpen, setCbSuggestDialogOpen] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<{
    fieldKey: string;
    localKey: keyof IntendedPurposeData;
    fieldLabel: string;
    original: string;
    suggested: string;
  } | null>(null);
  const debouncedUpdateRef = useRef<Map<string, ReturnType<typeof debounce>>>(new Map());
  const isInternalUpdateRef = useRef(false);
  
  // Typing guard: prevents prop→local syncs from overwriting text the user is actively typing
  const isActivelyTypingRef = useRef(false);
  const typingGuardTimerRef = useRef<NodeJS.Timeout>();

  // Governance data
  const { getSection } = useFieldGovernance(productId);
  const governanceFields = {
    intended_use: getSection('intended_use')?.status ?? null,
    intended_function: getSection('intended_function')?.status ?? null,
    mode_of_action: getSection('mode_of_action')?.status ?? null,
    value_proposition: getSection('value_proposition')?.status ?? null,
    clinical_benefits: getSection('clinical_benefits')?.status ?? null,
  };
  const { showDialog: govDialog, activeFieldLabel: govFieldLabel, guardEdit: govGuardEdit, confirmEdit: govConfirm, cancelEdit: govCancel, setShowDialog: setGovDialog } = useMultiFieldGovernanceGuard(productId, governanceFields);

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
      } else if (fieldExclusion) {
        return fieldExclusion.setExclusionScope(id, newScope);
      }
    };
  }, [onScopeChangeWithPropagation, familyProducts, getMatchingProductIds, familyProductIds, fieldExclusion]);

  // --- PF mode: sync family values into localData, save on blur ---
  // --- PF mode: sync family values into localData, save on blur ---

  useEffect(() => {
    if (!getFamilyValue || !isFieldPFMode) return;
    if (isActivelyTypingRef.current) return; // Don't overwrite while user is typing
    const updates: Partial<IntendedPurposeData> = {};
    const fieldMap: Array<{ pfKey: string; localKey: 'clinicalPurpose' | 'indications' | 'modeOfAction' | 'valueProposition' }> = [
      { pfKey: 'intendedUse', localKey: 'clinicalPurpose' },
      { pfKey: 'intendedFunction', localKey: 'indications' },
      { pfKey: 'modeOfAction', localKey: 'modeOfAction' },
      { pfKey: 'valueProposition', localKey: 'valueProposition' },
    ];
    for (const { pfKey, localKey } of fieldMap) {
      if (isFieldPFMode(pfKey)) {
        const fv = getFamilyValue(pfKey) as string;
        if (fv !== undefined) updates[localKey] = fv;
      } else {
        if (intendedPurposeData[localKey] !== undefined) {
          updates[localKey] = intendedPurposeData[localKey];
        }
      }
    }
    if (Object.keys(updates).length > 0) {
      setLocalData(prev => ({ ...prev, ...updates }));
    }
  }, [getFamilyValue, isFieldPFMode, intendedPurposeData]);

  const handlePfLocalChange = (localKey: keyof IntendedPurposeData, value: string) => {
    setLocalData(prev => ({ ...prev, [localKey]: value }));
  };

  const handlePfBlur = (pfKey: string, localKey: keyof IntendedPurposeData) => {
    if (isFieldPFMode?.(pfKey)) {
      saveFamilyValue?.(pfKey, localData[localKey] || '');
    }
  };

  // Ref to always access the latest localData in debounced callbacks (avoids stale closure)
  const localDataRef = useRef<IntendedPurposeData>(localData);
  localDataRef.current = localData;
  
  // Refs for scroll-to-section
  const intendedUseRef = useRef<HTMLDivElement>(null);
  const valuePropositionRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  // Get section from URL for scroll behavior
  const sectionFromUrl = searchParams.get('section');
  // Support aliases for intended-use targeting from gap-analysis
  const isIntendedUseTargeted = isInGapAnalysisFlow && (
    sectionFromUrl === 'intended-use' || sectionFromUrl === 'intended-purpose' || sectionFromUrl === 'device-description'
  );

  // Scroll to Value Proposition when navigating from Genesis Step 12
  useEffect(() => {
    if (sectionFromUrl === 'value-proposition' && valuePropositionRef.current && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      setTimeout(() => {
        valuePropositionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
    // Scroll to Intended Use when navigating from gap-analysis 1.1.c
    if (isIntendedUseTargeted && intendedUseRef.current && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      setTimeout(() => {
        intendedUseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
    if (sectionFromUrl !== 'value-proposition' && !isIntendedUseTargeted) {
      hasScrolledRef.current = false;
    }
  }, [sectionFromUrl, isIntendedUseTargeted]);

  // Track the last internal update timestamp to protect against race conditions
  const lastInternalUpdateRef = useRef<number>(0);

  useEffect(() => {
    // Skip prop updates while user is actively typing
    if (isActivelyTypingRef.current) return;
    // Skip prop updates for 3 seconds after an internal update to allow DB sync
    const timeSinceLastUpdate = Date.now() - lastInternalUpdateRef.current;
    if (timeSinceLastUpdate < 3000) {
      return;
    }
    if (!isInternalUpdateRef.current) {
      // For variants with PF-mode fields, only update fields that are in IP (individual) mode
      // to avoid overwriting master data that was set by the PF-sync effect
      if (isVariant && isFieldPFMode) {
        const fieldMap: Array<{ pfKey: string; localKey: 'clinicalPurpose' | 'indications' | 'modeOfAction' | 'valueProposition' }> = [
          { pfKey: 'intendedUse', localKey: 'clinicalPurpose' },
          { pfKey: 'intendedFunction', localKey: 'indications' },
          { pfKey: 'modeOfAction', localKey: 'modeOfAction' },
          { pfKey: 'valueProposition', localKey: 'valueProposition' },
        ];
        setLocalData(prev => {
          const updated = { ...prev };
          for (const { pfKey, localKey } of fieldMap) {
            if (!isFieldPFMode(pfKey)) {
              updated[localKey] = intendedPurposeData[localKey];
            }
          }
          return updated;
        });
      } else {
        setLocalData(intendedPurposeData);
      }
    }
    isInternalUpdateRef.current = false;
  }, [intendedPurposeData, isVariant, isFieldPFMode]);

  const hasFieldContent = (field: keyof IntendedPurposeData) => {
    const value = localData[field];
    return typeof value === 'string' && value.trim().length > 0;
  };

  // Ref for the callback to avoid stale closures in debounced functions
  const onChangeRef = useRef(onIntendedPurposeDataChange);
  onChangeRef.current = onIntendedPurposeDataChange;

  const createDebouncedUpdate = useCallback((field: keyof IntendedPurposeData) => {
    if (!debouncedUpdateRef.current.has(field)) {
      const debouncedFn = debounce(async (value: any) => {
        // Use refs to get the latest values (avoids stale closures)
        const currentOnChange = onChangeRef.current;
        if (currentOnChange) {
          setSavingStates(prev => new Set(prev).add(field));
          try {
            isInternalUpdateRef.current = true;
            lastInternalUpdateRef.current = Date.now(); // Track update time
            // Use localDataRef.current to get the latest state
            const updatedData = { ...localDataRef.current, [field]: value };
            currentOnChange(updatedData);
            setLocalData(updatedData);
          } finally {
            setTimeout(() => {
              setSavingStates(prev => {
                const newSet = new Set(prev);
                newSet.delete(field);
                return newSet;
              });
            }, 1000);
          }
        }
      }, 150); // Reduced from 600ms - parent container already debounces at 600ms
      debouncedUpdateRef.current.set(field, debouncedFn);
    }
    return debouncedUpdateRef.current.get(field)!;
  }, []);

  const handleTextFieldChange = (field: keyof IntendedPurposeData, value: string) => {
    // Mark as actively typing to prevent prop syncs from overwriting
    isActivelyTypingRef.current = true;
    if (typingGuardTimerRef.current) clearTimeout(typingGuardTimerRef.current);
    typingGuardTimerRef.current = setTimeout(() => {
      isActivelyTypingRef.current = false;
    }, 3000); // Keep guard up for 3s after last keystroke

    // Update localData immediately so the UI stays in sync
    setLocalData(prev => ({ ...prev, [field]: value }));

    const sectionKey = FIELD_TO_SECTION[field];
    const doUpdate = () => {
      const debouncedUpdate = createDebouncedUpdate(field);
      debouncedUpdate(value);
    };
    if (sectionKey) {
      govGuardEdit(sectionKey, AI_FIELD_CONFIGS[sectionKey as keyof typeof AI_FIELD_CONFIGS]?.name || field, doUpdate);
    } else {
      doUpdate();
    }
  };

  const setAiLoading = (fieldType: string, loading: boolean) => {
    setAiLoadingStates(prev => {
      const newSet = new Set(prev);
      if (loading) {
        newSet.add(fieldType);
        setActiveAiButton(fieldType);
      } else {
        newSet.delete(fieldType);
        setActiveAiButton(current => current === fieldType ? null : current);
      }
      return newSet;
    });
  };

  const isAiLoading = (fieldType: string) => externalIsAiLoading ? externalIsAiLoading(fieldType) : aiLoadingStates.has(fieldType);
  const isAiButtonDisabled = (fieldType: string) => externalIsAiButtonDisabled ? externalIsAiButtonDisabled(fieldType) : (activeAiButton !== null && activeAiButton !== fieldType);
  const effectiveSetAiLoading = externalSetAiLoading || setAiLoading;

  // Handler to open the AI explainer dialog
  const openAiExplainerDialog = (fieldKey: keyof typeof AI_FIELD_CONFIGS) => {
    // Check for minimum context first - BLOCK if insufficient
    const validation = hasMinimumContext(deviceContext);
    if (!validation.valid) {
      const missingFieldsWithNav = getMissingFieldsWithNavigation(validation.missingFields);
      toast.error(
        <ContextWarningToast missingFields={missingFieldsWithNav} />,
        { duration: 8000 }
      );
      return; // BLOCK - don't open dialog
    }
    setExplainerDialogField(fieldKey);
  };

  // Handler for AI generation after user confirms in the dialog
  const handleAiGenerationConfirm = async (additionalInstructions: string = '', outputLanguage: string = 'en') => {
    // Build language suffix if non-English
    const langSuffix = outputLanguage !== 'en'
      ? `\nGenerate the response in ${outputLanguage === 'de' ? 'German' : outputLanguage === 'fr' ? 'French' : outputLanguage === 'fi' ? 'Finnish' : 'English'}.`
      : '';
    const userRequirements = additionalInstructions ? `${additionalInstructions}${langSuffix}` : (langSuffix || undefined);
    if (!explainerDialogField || !onAcceptAISuggestion || !companyId) return;

    const fieldKey = explainerDialogField;
    const fieldConfig = AI_FIELD_CONFIGS[fieldKey];

    // Close dialog first
    setExplainerDialogField(null);

    // Show what context we're using
    const sources = getContextSources(deviceContext);
    if (sources.length > 0) {
      toast.info(`Getting context from: ${sources.join(', ')}...`, { duration: 2000 });
    }

    effectiveSetAiLoading(fieldKey, true);
    try {
      // Get the current value and field mapping
      const fieldValueMap: Record<string, { value: string; localKey: keyof IntendedPurposeData | 'clinical_benefits' }> = {
        intended_use: { value: localData.clinicalPurpose || '', localKey: 'clinicalPurpose' },
        intended_function: { value: localData.indications || '', localKey: 'indications' },
        modeOfAction: { value: localData.modeOfAction || '', localKey: 'modeOfAction' },
        value_proposition: { value: localData.valueProposition || '', localKey: 'valueProposition' },
        clinical_benefits: { value: '', localKey: 'clinical_benefits' },
        essential_performance: { value: '', localKey: 'essential_performance' as any }
      };

      const fieldInfo = fieldValueMap[fieldKey];

      // Special handling for clinical_benefits
      if (fieldKey === 'clinical_benefits') {
        const response = await productDefinitionAIService.generateConciseFieldSuggestion(
          productName || 'Current Medical Device',
          fieldConfig.name,
          fieldConfig.description,
          '',
          fieldKey,
          companyId,
          `Provide 3 to 5 specific clinical benefits for this medical device, one per line. Use clear, concise medical terminology, maximum 5-8 words each. Focus on patient outcomes and clinical value. Return ONLY the list, one benefit per line, no numbering, no bullets, no extra text.${userRequirements ? '\n' + userRequirements : ''}`,
          deviceContext
        );

        if (response.success && response.suggestions?.[0]) {
          const rawText = response.suggestions[0].suggestion;
          const items = rawText
            .split('\n')
            .map(line => line.replace(/^[\d\s•*\-\.:]+\s*/, '').replace(/["']/g, '').replace(/[^\w\s\-]/g, '').trim())
            .filter(line => line.length > 2);

          if (items.length > 0) {
            const existing = clinicalBenefits || [];
            const filtered = items.filter(item => !existing.some(cb => cb.toLowerCase() === item.toLowerCase()));
            if (filtered.length > 0) {
              setCbSuggestions(filtered);
              setSelectedCbSuggestions(new Set(filtered.map((_, i) => i)));
              setCbSuggestDialogOpen(true);
            } else {
              toast.info('All suggested benefits are already in your list.');
            }
          }
        }
      } else {
        const response = await productDefinitionAIService.generateConciseFieldSuggestion(
          productName || 'Current Medical Device',
          fieldConfig.name,
          fieldConfig.description,
          fieldInfo.value,
          fieldKey,
          companyId,
          userRequirements,
          deviceContext
        );

        if (response.success && response.suggestions?.[0]) {
          const suggestion = response.suggestions[0].suggestion;
          if (fieldInfo.localKey !== 'clinical_benefits') {
            // Show review dialog instead of auto-applying
            setPendingSuggestion({
              fieldKey,
              localKey: fieldInfo.localKey,
              fieldLabel: fieldConfig.name,
              original: fieldInfo.value,
              suggested: markdownToHtml(suggestion),
            });
          }
        }
      }
    } catch (error: any) {
      console.error('AI suggestion error:', error);
      if (error?.message !== 'NO_CREDITS') {
        toast.error('Failed to generate AI suggestion. Please try again.');
      }
    } finally {
      effectiveSetAiLoading(fieldKey, false);
    }
  };

  // Clinical Benefits handlers
  const handleAddBenefit = () => {
    const trimmedValue = newBenefit.trim();
    if (!trimmedValue || !onClinicalBenefitsChange) return;
    if (clinicalBenefits.includes(trimmedValue)) {
      setNewBenefit('');
      return;
    }
    const updated = [...clinicalBenefits, trimmedValue];
    onClinicalBenefitsChange(updated);
    setNewBenefit('');
  };

  const handleRemoveBenefit = (index: number) => {
    if (!onClinicalBenefitsChange) return;
    const updated = [...clinicalBenefits];
    updated.splice(index, 1);
    onClinicalBenefitsChange(updated);
  };

  // Map field keys to governance section keys
  const FIELD_TO_SECTION: Record<string, string> = {
    clinicalPurpose: 'intended_use',
    indications: 'intended_function',
    modeOfAction: 'mode_of_action',
    valueProposition: 'value_proposition',
    clinicalBenefits: 'clinical_benefits',
  };

  const getSaveStatusIcon = (field: keyof IntendedPurposeData) => {
    const isSaving = savingStates.has(field);
    if (isSaving) {
      return <Clock className="h-4 w-4 text-orange-500 animate-pulse" />;
    }
    // Check governance status for this field
    const sectionKey = FIELD_TO_SECTION[field];
    if (sectionKey) {
      const govRecord = getSection(sectionKey);
      if (govRecord && govRecord.status !== 'draft') {
        return (
          <GovernanceBookmark
            status={govRecord.status}
            designReviewId={govRecord.design_review_id}
            verdictComment={govRecord.verdict_comment}
            approvedAt={govRecord.approved_at}
            productId={productId}
            sectionLabel={AI_FIELD_CONFIGS[sectionKey as keyof typeof AI_FIELD_CONFIGS]?.name || sectionKey}
          />
        );
      }
    }
    // Always show blue "not yet reviewed" circle
    return <GovernanceBookmark status={null} />;
  };

  useEffect(() => {
    return () => {
      debouncedUpdateRef.current.forEach(debouncedFn => {
        if (debouncedFn.cancel) debouncedFn.cancel();
      });
      debouncedUpdateRef.current.clear();
      if (typingGuardTimerRef.current) clearTimeout(typingGuardTimerRef.current);
    };
  }, []);

  return (
    <div className={`space-y-6 ${disabled ? 'pointer-events-none' : ''}`}>
      {/* Clinical Purpose / Intended Use */}
      <div id="genesis-intended-use" ref={intendedUseRef} className={`space-y-2 ${isInGenesisFlow ? `p-3 rounded-lg transition-colors ${hasFieldContent('clinicalPurpose') ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''} ${isIntendedUseTargeted ? `p-3 rounded-lg transition-colors ${hasFieldContent('clinicalPurpose') ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}`}>
        <div className="flex items-center justify-between">
          <Label htmlFor="clinicalPurpose" className={`text-sm font-medium flex items-center gap-3 ${isInInvestorFlow ? 'text-indigo-600' : ''}`}>
            {lang('devicePurpose.statement.intendedUseLabel')}
            {isInInvestorFlow && <InvestorVisibleBadge />}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">{lang('devicePurpose.statement.intendedUseTooltip')}</p>
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
                    disabled={isAiLoading('intended_use') || isAiButtonDisabled('intended_use') || !companyId}
                    onClick={() => openAiExplainerDialog('intended_use')}
                  >
                    {isAiLoading('intended_use') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{lang('devicePurpose.aiSuggestion')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex items-center gap-2">
            {companyId && productId && fieldExclusion ? (
              <InheritanceExclusionPopover
                companyId={companyId}
                currentProductId={productId}
                itemId="intendedUse"
                exclusionScope={fieldExclusion.getExclusionScope('intendedUse')}
                onScopeChange={createValueMatchScopeChange('intendedUse', intendedPurposeData?.clinicalPurpose)}
                defaultCurrentDeviceOnly
                familyProductIds={familyProductIds}
                summaryText={getMatchSummary('intendedUse', intendedPurposeData?.clinicalPurpose)}
                valueMatchingProductIds={getMatchingProductIds('intendedUse', intendedPurposeData?.clinicalPurpose)}
              />
            ) : null}
            {getSaveStatusIcon('clinicalPurpose')}
          </div>
        </div>
        <>
          <RichTextField
            value={localData.clinicalPurpose || ''}
            onChange={(html) => {
              handleTextFieldChange('clinicalPurpose', html);
            }}
            placeholder={lang('devicePurpose.statement.intendedUsePlaceholder')}
            disabled={isLoading}
            minHeight="80px"
          />
          {!isFieldPFMode?.('intendedUse') && (
            <AIFieldButton
              fieldType="intended_use"
              currentValue={localData.clinicalPurpose || ''}
              suggestions={aiSuggestions}
              onAcceptSuggestion={(suggestion) => {
                handleTextFieldChange('clinicalPurpose', suggestion);
                onAcceptAISuggestion?.('intended_use', suggestion);
              }}
              className="mt-2"
            />
          )}
          {(() => {
            const s = fieldSuggestions.find(fs => fs.field_key === 'intended_purpose_data.clinicalPurpose' || fs.field_key === 'intended_use');
            return s ? (
              <PendingFieldSuggestion
                fieldLabel={s.field_label}
                suggestedValue={s.suggested_value}
                onAccept={() => {
                  handleTextFieldChange('clinicalPurpose', s.suggested_value);
                  onAcceptFieldSuggestion?.(s, s.suggested_value);
                }}
                onReject={() => onRejectFieldSuggestion?.(s.id)}
              />
            ) : null;
          })()}
        </>
      </div>

      {/* Intended Use Category */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            Intended Use Category
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">Classifies the primary regulatory purpose of the device per IEC 60601-1 §1.1</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex items-center gap-2">
            {companyId && productId && fieldExclusion ? (
              <InheritanceExclusionPopover
                companyId={companyId}
                currentProductId={productId}
                itemId="intendedUseCategory"
                exclusionScope={fieldExclusion.getExclusionScope('intendedUseCategory')}
                onScopeChange={createValueMatchScopeChange('intendedUseCategory', intendedPurposeData?.intended_use_category)}
                defaultCurrentDeviceOnly
                familyProductIds={familyProductIds}
                summaryText={getMatchSummary('intendedUseCategory', intendedPurposeData?.intended_use_category)}
                valueMatchingProductIds={getMatchingProductIds('intendedUseCategory', intendedPurposeData?.intended_use_category)}
              />
            ) : null}
            {getSaveStatusIcon('clinicalPurpose')}
          </div>
        </div>
        <Select
          value={localData.intended_use_category || ''}
          onValueChange={(val) => handleTextFieldChange('intended_use_category' as keyof IntendedPurposeData, val)}
        >
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select intended use category..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Diagnosis">Diagnosis</SelectItem>
            <SelectItem value="Treatment">Treatment</SelectItem>
            <SelectItem value="Monitoring">Monitoring</SelectItem>
            <SelectItem value="Rehabilitation">Rehabilitation</SelectItem>
            <SelectItem value="Multiple (specify in rationale)">Multiple (specify in rationale)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Indications / Intended Function */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="indications" className="text-sm font-medium flex items-center gap-2">
            {lang('devicePurpose.statement.intendedFunctionLabel')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">{lang('devicePurpose.statement.intendedFunctionTooltip')}</p>
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
                    disabled={isAiLoading('intended_function') || isAiButtonDisabled('intended_function') || !companyId}
                    onClick={() => openAiExplainerDialog('intended_function')}
                  >
                    {isAiLoading('intended_function') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{lang('devicePurpose.aiSuggestion')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex items-center gap-2">
            {companyId && productId && fieldExclusion ? (
              <InheritanceExclusionPopover
                companyId={companyId}
                currentProductId={productId}
                itemId="intendedFunction"
                exclusionScope={fieldExclusion.getExclusionScope('intendedFunction')}
                onScopeChange={createValueMatchScopeChange('intendedFunction', intendedPurposeData?.indications)}
                defaultCurrentDeviceOnly
                familyProductIds={familyProductIds}
                summaryText={getMatchSummary('intendedFunction', intendedPurposeData?.indications)}
                valueMatchingProductIds={getMatchingProductIds('intendedFunction', intendedPurposeData?.indications)}
              />
            ) : null}
            {getSaveStatusIcon('indications')}
          </div>
        </div>
        <>
          <RichTextField
            value={localData.indications || ''}
            onChange={(html) => {
              handleTextFieldChange('indications', html);
            }}
            placeholder={lang('devicePurpose.statement.intendedFunctionPlaceholder')}
            disabled={isLoading}
            minHeight="80px"
          />
          {!isFieldPFMode?.('intendedFunction') && (
            <AIFieldButton
              fieldType="intended_function"
              currentValue={localData.indications || ''}
              suggestions={aiSuggestions}
              onAcceptSuggestion={(suggestion) => {
                handleTextFieldChange('indications', suggestion);
                onAcceptAISuggestion?.('intended_function', suggestion);
              }}
              className="mt-2"
            />
          )}
          {(() => {
            const s = fieldSuggestions.find(fs => fs.field_key === 'intended_purpose_data.indications');
            return s ? (
              <PendingFieldSuggestion
                fieldLabel={s.field_label}
                suggestedValue={s.suggested_value}
                onAccept={() => {
                  handleTextFieldChange('indications', s.suggested_value);
                  onAcceptFieldSuggestion?.(s, s.suggested_value);
                }}
                onReject={() => onRejectFieldSuggestion?.(s.id)}
              />
            ) : null;
          })()}
        </>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="modeOfAction" className="text-sm font-medium flex items-center gap-2">
            {lang('devicePurpose.statement.modeOfActionLabel')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">{lang('devicePurpose.statement.modeOfActionTooltip')}</p>
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
                    disabled={isAiLoading('modeOfAction') || isAiButtonDisabled('modeOfAction') || !companyId}
                    onClick={() => openAiExplainerDialog('modeOfAction')}
                  >
                    {isAiLoading('modeOfAction') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{lang('devicePurpose.aiSuggestion')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex items-center gap-2">
            {companyId && productId && fieldExclusion ? (
              <InheritanceExclusionPopover
                companyId={companyId}
                currentProductId={productId}
                itemId="modeOfAction"
                exclusionScope={fieldExclusion.getExclusionScope('modeOfAction')}
                onScopeChange={createValueMatchScopeChange('modeOfAction', intendedPurposeData?.modeOfAction)}
                defaultCurrentDeviceOnly
                familyProductIds={familyProductIds}
                summaryText={getMatchSummary('modeOfAction', intendedPurposeData?.modeOfAction)}
                valueMatchingProductIds={getMatchingProductIds('modeOfAction', intendedPurposeData?.modeOfAction)}
              />
            ) : null}
            {getSaveStatusIcon('modeOfAction')}
          </div>
        </div>
        <>
          <RichTextField
            value={localData.modeOfAction || ''}
            onChange={(html) => {
              handleTextFieldChange('modeOfAction', html);
            }}
            placeholder={lang('devicePurpose.statement.modeOfActionPlaceholder')}
            disabled={isLoading}
            minHeight="80px"
          />
          {(() => {
            const s = fieldSuggestions.find(fs => fs.field_key === 'intended_purpose_data.modeOfAction');
            return s ? (
              <PendingFieldSuggestion
                fieldLabel={s.field_label}
                suggestedValue={s.suggested_value}
                onAccept={() => {
                  handleTextFieldChange('modeOfAction', s.suggested_value);
                  onAcceptFieldSuggestion?.(s, s.suggested_value);
                }}
                onReject={() => onRejectFieldSuggestion?.(s.id)}
              />
            ) : null;
          })()}
        </>
      </div>

      {/* Value Proposition */}
      <div id="genesis-value-proposition" ref={valuePropositionRef} className={`space-y-2 ${isInGenesisFlow ? `p-3 rounded-lg transition-colors ${hasFieldContent('valueProposition') ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}`}>
        <div className="flex items-center justify-between">
          <Label htmlFor="valueProposition" className={`text-sm font-medium flex items-center gap-3 ${isInInvestorFlow ? 'text-indigo-600' : ''}`}>
            {lang('devicePurpose.statement.valuePropositionLabel')}
            {isInInvestorFlow && <InvestorVisibleBadge />}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">{lang('devicePurpose.statement.valuePropositionTooltip')}</p>
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
                    disabled={isAiLoading('value_proposition') || isAiButtonDisabled('value_proposition') || !companyId}
                    onClick={() => openAiExplainerDialog('value_proposition')}
                  >
                    {isAiLoading('value_proposition') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{lang('devicePurpose.aiSuggestion')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex items-center gap-2">
            {companyId && productId && fieldExclusion ? (
              <InheritanceExclusionPopover
                companyId={companyId}
                currentProductId={productId}
                itemId="valueProposition"
                exclusionScope={fieldExclusion.getExclusionScope('valueProposition')}
                onScopeChange={createValueMatchScopeChange('valueProposition', intendedPurposeData?.valueProposition)}
                defaultCurrentDeviceOnly
                familyProductIds={familyProductIds}
                summaryText={getMatchSummary('valueProposition', intendedPurposeData?.valueProposition)}
                valueMatchingProductIds={getMatchingProductIds('valueProposition', intendedPurposeData?.valueProposition)}
              />
            ) : null}
            {getSaveStatusIcon('valueProposition')}
          </div>
        </div>
        <>
          <RichTextField
            value={localData.valueProposition || ''}
            onChange={(html) => {
              handleTextFieldChange('valueProposition', html);
            }}
            placeholder={lang('devicePurpose.statement.valuePropositionPlaceholder')}
            disabled={isLoading}
            minHeight="80px"
          />
          {!isFieldPFMode?.('valueProposition') && (
            <AIFieldButton
              fieldType="value_proposition"
              currentValue={localData.valueProposition || ''}
              suggestions={aiSuggestions}
              onAcceptSuggestion={(suggestion) => {
                handleTextFieldChange('valueProposition', suggestion);
                onAcceptAISuggestion?.('value_proposition', suggestion);
              }}
              className="mt-2"
            />
           )}
          {(() => {
            const s = fieldSuggestions.find(fs => fs.field_key === 'intended_purpose_data.valueProposition');
            return s ? (
              <PendingFieldSuggestion
                fieldLabel={s.field_label}
                suggestedValue={s.suggested_value}
                onAccept={() => {
                  handleTextFieldChange('valueProposition', s.suggested_value);
                  onAcceptFieldSuggestion?.(s, s.suggested_value);
                }}
                onReject={() => onRejectFieldSuggestion?.(s.id)}
              />
            ) : null;
          })()}
        </>
      </div>

      {/* Clinical Benefits */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            {lang('devicePurpose.safety.clinicalBenefitsLabel')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">{lang('devicePurpose.safety.clinicalBenefitsTooltip')}</p>
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
                    disabled={isAiLoading('clinical_benefits') || isAiButtonDisabled('clinical_benefits') || !companyId}
                    onClick={() => openAiExplainerDialog('clinical_benefits')}
                  >
                    {isAiLoading('clinical_benefits') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{lang('devicePurpose.aiSuggestion')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex items-center gap-2">
            {companyId && productId && fieldExclusion ? (
              <InheritanceExclusionPopover
                companyId={companyId}
                currentProductId={productId}
                itemId="clinicalBenefits"
                exclusionScope={fieldExclusion.getExclusionScope('clinicalBenefits')}
                onScopeChange={createValueMatchScopeChange('clinicalBenefits', clinicalBenefits)}
                defaultCurrentDeviceOnly
                familyProductIds={familyProductIds}
                summaryText={getMatchSummary('clinicalBenefits', clinicalBenefits)}
                valueMatchingProductIds={getMatchingProductIds('clinicalBenefits', clinicalBenefits)}
              />
            ) : null}
            {getSaveStatusIcon('clinicalBenefits' as any)}
          </div>
        </div>
        <>
          <div className="flex gap-2">
            <Input
              placeholder={lang('devicePurpose.safety.addBenefit')}
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddBenefit();
                }
              }}
              disabled={isLoading}
            />
            <Button
              onClick={handleAddBenefit}
              disabled={!newBenefit.trim() || isLoading}
              variant="secondary"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {clinicalBenefits.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No clinical benefits defined yet.</p>
          ) : (
            <div className="space-y-2">
              {clinicalBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 flex-shrink-0">{index + 1}.</span>
                  <Input
                    value={benefit}
                    placeholder="e.g. Improved diagnostic accuracy"
                    disabled={disabled || isLoading}
                    onChange={(e) => {
                      const updated = [...clinicalBenefits];
                      updated[index] = e.target.value;
                      onClinicalBenefitsChange?.(updated);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    disabled={disabled || isLoading}
                    onClick={() => handleRemoveBenefit(index)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      </div>

      {/* Clinical Benefits Multi-Select Suggestions Dialog */}
      <Dialog open={cbSuggestDialogOpen} onOpenChange={setCbSuggestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              AI Suggested Clinical Benefits
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                id="cb-select-all"
                checked={selectedCbSuggestions.size === cbSuggestions.length && cbSuggestions.length > 0}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCbSuggestions(new Set(cbSuggestions.map((_, i) => i)));
                  } else {
                    setSelectedCbSuggestions(new Set());
                  }
                }}
              />
              <Label htmlFor="cb-select-all" className="text-sm font-medium cursor-pointer">
                Select All
              </Label>
            </div>
            {cbSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-2">
                <Checkbox
                  id={`cb-suggestion-${index}`}
                  checked={selectedCbSuggestions.has(index)}
                  onCheckedChange={(checked) => {
                    setSelectedCbSuggestions(prev => {
                      const next = new Set(prev);
                      if (checked) { next.add(index); } else { next.delete(index); }
                      return next;
                    });
                  }}
                />
                <Label htmlFor={`cb-suggestion-${index}`} className="text-sm cursor-pointer leading-snug">
                  {suggestion}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCbSuggestDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={selectedCbSuggestions.size === 0}
              onClick={() => {
                const selected = cbSuggestions.filter((_, i) => selectedCbSuggestions.has(i));
                const updated = [...clinicalBenefits, ...selected];
                onClinicalBenefitsChange?.(updated);
                setCbSuggestDialogOpen(false);
                toast.success(`Added ${selected.length} clinical benefit${selected.length > 1 ? 's' : ''}`);
              }}
            >
              Add Selected ({selectedCbSuggestions.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AIExplainerDialog
        open={explainerDialogField !== null}
        onOpenChange={(open) => !open && setExplainerDialogField(null)}
        onConfirm={handleAiGenerationConfirm}
        isLoading={explainerDialogField ? isAiLoading(explainerDialogField) : false}
        fieldName={explainerDialogField ? AI_FIELD_CONFIGS[explainerDialogField].name : ''}
        fieldDescription={explainerDialogField ? AI_FIELD_CONFIGS[explainerDialogField].description : undefined}
        productId={productId || ''}
        companyId={companyId}
      />

      {/* AI Suggestion Review Dialog */}
      <AISuggestionReviewDialog
        open={pendingSuggestion !== null}
        onOpenChange={(open) => !open && setPendingSuggestion(null)}
        fieldLabel={pendingSuggestion?.fieldLabel || ''}
        originalContent={pendingSuggestion?.original || ''}
        suggestedContent={pendingSuggestion?.suggested || ''}
        onAccept={(content) => {
          if (pendingSuggestion) {
            handleTextFieldChange(pendingSuggestion.localKey, content);
            onAcceptAISuggestion?.(pendingSuggestion.fieldKey, content);
          }
          setPendingSuggestion(null);
        }}
        onReject={() => setPendingSuggestion(null)}
      />

    </div>
  );
}