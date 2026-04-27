import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X, HelpCircle, Check, Clock, ChevronDown, Sparkles, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldSuggestion, productDefinitionAIService, DeviceContext, hasMinimumContext } from '@/services/productDefinitionAIService';
import { AIExplainerDialog } from '@/components/product/ai-assistant/AIExplainerDialog';
import { AISuggestionReviewDialog } from '@/components/product/ai-assistant/AISuggestionReviewDialog';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { ContextWarningToast, getMissingFieldsWithNavigation, getContextSources } from '../../ai-assistant/ContextWarningToast';
import { InheritanceExclusionPopover } from '@/components/shared/InheritanceExclusionPopover';

import { Json } from '@/integrations/supabase/types';
import { RichTextField } from '@/components/shared/RichTextField';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PendingFieldSuggestion } from '@/components/product/device/PendingFieldSuggestion';
import { FileText } from 'lucide-react';
import { useFieldGovernance } from '@/hooks/useFieldGovernance';
import { useMultiFieldGovernanceGuard } from '@/hooks/useMultiFieldGovernanceGuard';
import { GovernanceBookmark } from '@/components/ui/GovernanceBookmark';
import { GovernanceEditConfirmDialog } from '@/components/ui/GovernanceEditConfirmDialog';
import { resolveFieldValue, normalizeScopeValue } from '@/hooks/useAutoSyncScope';
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
  targetPopulation?: string[];
  useEnvironment?: string[];
  durationOfUse?: string;
  useTrigger?: string[];
  targetPopulationDescription?: string;
  intendedUsersDescription?: string;
  useEnvironmentDescription?: string;
  useTriggerDescription?: string;
}

interface ContextOfUseTabProps {
  intendedPurposeData?: IntendedPurposeData;
  intendedUsers?: string[];
  onIntendedPurposeDataChange?: (value: IntendedPurposeData) => void;
  onIntendedUsersChange?: (value: string[]) => void;
  isLoading?: boolean;
  aiSuggestions?: FieldSuggestion[];
  onAcceptAISuggestion?: (fieldType: string, suggestion: string) => void;
  companyId?: string;
  productId?: string;
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
  saveFamilyValue?: (fieldKey: string, fieldValue: Json) => void;
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
  /** Direct access to scope-change-with-propagation for value-matching mode */
  onScopeChangeWithPropagation?: (fieldKey: string, oldScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope, newScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope) => Promise<void>;
  fieldSuggestions?: import('@/hooks/useProductFieldSuggestions').ProductFieldSuggestion[];
  onAcceptFieldSuggestion?: (suggestion: import('@/hooks/useProductFieldSuggestions').ProductFieldSuggestion, newValue: string) => void;
  onRejectFieldSuggestion?: (suggestionId: string) => void;
}

const predefinedUsers = [
  'Healthcare Professionals',
  'Patients',
  'Caregivers',
  'Family Members',
  'Trained Medical Personnel',
  'General Public',
  'Emergency Responders',
  'Home Care Providers',
  'Other'
];

const predefinedPatients = [
  'Neonates (0-28 days)',
  'Infants (29 days - 2 years)',
  'Children (2-11 years)',
  'Adolescents (12-17 years)',
  'Adults (18-64 years)',
  'Elderly patients (65+ years)',
  'Pregnant women',
  'Patients with chronic conditions',
  'Patients with acute conditions',
  'Asymptomatic individuals',
  'High-risk patients',
  'Post-surgical patients',
  'Patients with mobility limitations',
  'Patients with cognitive limitations',
  'Other'
];

const predefinedEnvironments = [
  'Hospital/Clinical setting',
  'Home environment',
  'Ambulatory care setting',
  'Emergency/First aid situations',
  'Long-term care facility',
  'Rehabilitation center',
  'Mobile/Transportation',
  'Outdoor environments',
  'Laboratory setting',
  'Pharmacy',
  'Telehealth/Remote monitoring',
  'Other'
];

const durationOptions = [
  { value: 'transient', label: 'Transient: Less than 60 minutes', description: 'Normally intended for continuous use for less than 60 minutes (EU MDR Annex VIII)' },
  { value: 'short_term', label: 'Short-Term: 60 minutes to 30 days', description: 'Normally intended for continuous use for between 60 minutes and 30 days (EU MDR Annex VIII)' },
  { value: 'long_term', label: 'Long-Term: More than 30 days', description: 'Normally intended for continuous use for more than 30 days (EU MDR Annex VIII)' }
];

const predefinedTriggers = [
  'Patient symptom or complaint',
  'Scheduled procedure or appointment',
  'Diagnostic test result',
  'Emergency response',
  'Routine monitoring or check-up',
  'Physician order or prescription',
  'Self-assessment by patient',
  'Disease progression or flare-up',
  'Post-operative care',
  'Preventive screening',
  'Other'
];

export function ContextOfUseTab({
  intendedPurposeData = {},
  intendedUsers = [],
  onIntendedPurposeDataChange,
  disabled = false,
  onIntendedUsersChange,
  isLoading = false,
  aiSuggestions = [],
  onAcceptAISuggestion,
  companyId,
  productId,
  productName,
  setAiLoading,
  isAiLoading,
  isAiButtonDisabled,
  deviceContext,
  belongsToFamily = false,
  getFieldScope,
  onFieldScopeChange,
  getFamilyValue,
  hasFamilyValue,
  isFieldPFMode,
  onEditFamily,
  saveFamilyValue,
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
}: ContextOfUseTabProps) {
  const { lang } = useTranslation();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share' || returnTo === 'gap-analysis';

  const [localData, setLocalData] = useState<IntendedPurposeData>(() => ({
    ...intendedPurposeData,
    targetPopulation: normalizeArrayField(intendedPurposeData.targetPopulation),
    useEnvironment: normalizeArrayField(intendedPurposeData.useEnvironment),
    useTrigger: normalizeArrayField(intendedPurposeData.useTrigger),
  }));
  const [savingStates, setSavingStates] = useState<Set<string>>(new Set());
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isEnvironmentDropdownOpen, setIsEnvironmentDropdownOpen] = useState(false);
  const [showOtherPatientInput, setShowOtherPatientInput] = useState(false);
  const [otherPatientText, setOtherPatientText] = useState('');
  const [showOtherUserInput, setShowOtherUserInput] = useState(false);
  const [otherUserText, setOtherUserText] = useState('');
  const [showOtherEnvironmentInput, setShowOtherEnvironmentInput] = useState(false);
  const [otherEnvironmentText, setOtherEnvironmentText] = useState('');

  // AI Explainer Dialog state
  type ContextAIField = 'target_population' | 'intended_user' | 'duration_of_use' | 'use_environment' | 'use_trigger';
  const [explainerField, setExplainerField] = useState<ContextAIField | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState<{
    fieldKey: ContextAIField;
    fieldLabel: string;
    original: string;
    suggested: string;
  } | null>(null);

  const CONTEXT_AI_FIELDS: Record<ContextAIField, { name: string; description: string }> = {
    target_population: { name: 'Intended Patient Population', description: 'AI will suggest the most appropriate patient population based on your device information.' },
    intended_user: { name: 'Intended User', description: 'AI will suggest who should use this device based on your device information.' },
    duration_of_use: { name: 'Duration of Use', description: 'AI will suggest the appropriate duration of use classification per EU MDR Annex VIII.' },
    use_environment: { name: 'Environment of Use', description: 'AI will suggest the most appropriate use environment for your device.' },
    use_trigger: { name: 'Trigger for Use', description: 'AI will suggest the most appropriate trigger for use based on your device information.' },
  };

  const handleOpenExplainer = useCallback((fieldKey: ContextAIField) => {
    if (!companyId) return;
    const validation = hasMinimumContext(deviceContext);
    if (!validation.valid) {
      const missingFieldsWithNav = getMissingFieldsWithNavigation(validation.missingFields);
      toast.error(<ContextWarningToast missingFields={missingFieldsWithNav} />, { duration: 8000 });
      return;
    }
    setExplainerField(fieldKey);
  }, [companyId, deviceContext]);

  const handleExplainerConfirm = useCallback(async (additionalInstructions: string = '', outputLanguage: string = 'en') => {
    if (!explainerField || !companyId || !onAcceptAISuggestion) return;
    const fieldKey = explainerField;
    setExplainerField(null);
    setAiLoading?.(fieldKey, true);

    const langSuffix = outputLanguage !== 'en'
      ? `\nGenerate the response in ${outputLanguage === 'de' ? 'German' : outputLanguage === 'fr' ? 'French' : outputLanguage === 'fi' ? 'Finnish' : 'English'}.`
      : '';

    try {
      const currentPopulation = localData.targetPopulation || [];
      const currentUsers = intendedUsers;
      const currentEnvironments = localData.useEnvironment || [];
      const currentTriggers = localData.useTrigger || [];

      let fieldLabel = '';
      let fieldDesc = '';
      let currentValue = '';
      let requirements = '';

      if (fieldKey === 'target_population') {
        const availableOptions = predefinedPatients.filter(o => o !== 'Other' && !currentPopulation.includes(o));
        fieldLabel = 'Intended Patient Population';
        fieldDesc = `Select from: ${availableOptions.join(', ')}`;
        currentValue = currentPopulation.join(', ');
        requirements = `Select exactly one option from this list: ${availableOptions.join(', ')}. Return only the exact text.${langSuffix}`;
        if (additionalInstructions) requirements += `\n${additionalInstructions}`;
      } else if (fieldKey === 'intended_user') {
        const availableOptions = predefinedUsers.filter(o => o !== 'Other' && !currentUsers.includes(o));
        fieldLabel = 'Intended User';
        fieldDesc = `Select from: ${availableOptions.join(', ')}`;
        currentValue = currentUsers.join(', ');
        requirements = `Select exactly one option from this list: ${availableOptions.join(', ')}. Return only the exact text.${langSuffix}`;
        if (additionalInstructions) requirements += `\n${additionalInstructions}`;
      } else if (fieldKey === 'duration_of_use') {
        const options = durationOptions.map(o => o.label);
        fieldLabel = 'Duration of Use';
        fieldDesc = `Select from: ${options.join(', ')}`;
        currentValue = localData.durationOfUse || '';
        requirements = `Select exactly one from: ${options.join(', ')}. Return only the exact label.${langSuffix}`;
        if (additionalInstructions) requirements += `\n${additionalInstructions}`;
      } else if (fieldKey === 'use_environment') {
        const availableOptions = predefinedEnvironments.filter(o => o !== 'Other' && !currentEnvironments.includes(o));
        fieldLabel = 'Environment of Use';
        fieldDesc = `Select from: ${availableOptions.join(', ')}`;
        currentValue = currentEnvironments.join(', ');
        requirements = `Select exactly one option from this list: ${availableOptions.join(', ')}. Return only the exact text.${langSuffix}`;
        if (additionalInstructions) requirements += `\n${additionalInstructions}`;
      } else if (fieldKey === 'use_trigger') {
        const availableOptions = predefinedTriggers.filter(o => o !== 'Other' && !currentTriggers.includes(o));
        fieldLabel = 'Trigger for Use';
        fieldDesc = `Select from: ${availableOptions.join(', ')}`;
        currentValue = currentTriggers.join(', ');
        requirements = `Select exactly one option from this list: ${availableOptions.join(', ')}. Return only the exact text.${langSuffix}`;
        if (additionalInstructions) requirements += `\n${additionalInstructions}`;
      }

      const response = await productDefinitionAIService.generateConciseFieldSuggestion(
        productName || 'Current Medical Device',
        fieldLabel,
        fieldDesc,
        currentValue,
        fieldKey,
        companyId,
        requirements,
        deviceContext
      );

      if (response.success && response.suggestions?.[0]) {
        const suggestion = response.suggestions[0].suggestion.trim();
        setPendingSuggestion({
          fieldKey,
          fieldLabel: CONTEXT_AI_FIELDS[fieldKey].name,
          original: currentValue,
          suggested: suggestion,
        });
      }
    } catch (error: any) {
      console.error('AI suggestion error:', error);
      if (error?.message !== 'NO_CREDITS') {
        toast.error('Failed to generate AI suggestion');
      }
    } finally {
      setAiLoading?.(fieldKey, false);
    }
  }, [explainerField, companyId, localData, intendedUsers, productName, deviceContext, setAiLoading, onAcceptAISuggestion, onIntendedUsersChange]);

  const [isTriggerDropdownOpen, setIsTriggerDropdownOpen] = useState(false);
  const [showOtherTriggerInput, setShowOtherTriggerInput] = useState(false);
  const [otherTriggerText, setOtherTriggerText] = useState('');
  const [showPopulationDesc, setShowPopulationDesc] = useState(() => !!(intendedPurposeData as any).targetPopulationDescription);
  const [showUsersDesc, setShowUsersDesc] = useState(() => !!(intendedPurposeData as any).intendedUsersDescription);
  const [showEnvironmentDesc, setShowEnvironmentDesc] = useState(() => !!(intendedPurposeData as any).useEnvironmentDescription);
  const [showTriggerDesc, setShowTriggerDesc] = useState(() => !!(intendedPurposeData as any).useTriggerDescription);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isInternalUpdateRef = useRef(false);

  // Compute which family products have the same value as the current device for a given field
  const getMatchingProductIds = useCallback((fieldKey: string, currentValue: any): string[] | undefined => {
    if (!familyProducts?.length || !productId) return undefined;
    const currentNormalized = JSON.stringify(normalizeScopeValue(fieldKey, currentValue));
    return familyProducts
      .filter(p => {
        if (p.id === productId) return true; // current device always matches itself
        return JSON.stringify(normalizeScopeValue(fieldKey, resolveFieldValue(p, fieldKey))) === currentNormalized;
      })
      .map(p => p.id);
  }, [familyProducts, productId]);

  // Compute match summary for scope badges (e.g. "2/4" = 2 of 4 devices share same value)
  const getMatchSummary = useCallback((fieldKey: string, currentValue: any) => {
    const matchIds = getMatchingProductIds(fieldKey, currentValue);
    if (!matchIds || !familyProducts?.length) return undefined;
    return `${matchIds.length}/${familyProducts.length}`;
  }, [getMatchingProductIds, familyProducts]);

  // Create scope change handler that uses value-matching as the old scope baseline,
  // so newly checked devices are correctly detected and get the current value propagated.
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

  // Governance data
  const FIELD_LABELS: Record<string, string> = {
    target_population: 'Target Patient Population',
    intended_user: 'Intended User',
    duration_of_use: 'Duration of Use',
    use_environment: 'Use Environment',
  };
  const FIELD_TO_SECTION: Record<string, string> = {
    targetPopulation: 'target_population',
    intendedUser: 'intended_user',
    durationOfUse: 'duration_of_use',
    useEnvironment: 'use_environment',
  };
  const { getSection } = useFieldGovernance(productId);
  const governanceFields = {
    target_population: getSection('target_population')?.status ?? null,
    intended_user: getSection('intended_user')?.status ?? null,
    duration_of_use: getSection('duration_of_use')?.status ?? null,
    use_environment: getSection('use_environment')?.status ?? null,
  };
  const { showDialog: govDialog, activeFieldLabel: govFieldLabel, guardEdit: govGuardEdit, confirmEdit: govConfirm, setShowDialog: setGovDialog } = useMultiFieldGovernanceGuard(productId, governanceFields);

  useEffect(() => {
    if (!isInternalUpdateRef.current) {
      setLocalData({
        ...intendedPurposeData,
        targetPopulation: normalizeArrayField(intendedPurposeData.targetPopulation),
        useEnvironment: normalizeArrayField(intendedPurposeData.useEnvironment),
        useTrigger: normalizeArrayField(intendedPurposeData.useTrigger),
      });
    }
    isInternalUpdateRef.current = false;
  }, [intendedPurposeData]);

  // Resolve display values: use master data when variant field is linked (PF mode)
  const displayPopulation = (isVariant && isFieldPFMode?.('intendedPatientPopulation') && getFamilyValue)
    ? normalizeArrayField(getFamilyValue('targetPopulation'))
    : (localData.targetPopulation || []);

  const displayUsers = (isVariant && isFieldPFMode?.('intendedUsers') && getFamilyValue)
    ? normalizeArrayField(getFamilyValue('intendedUsers'))
    : intendedUsers;

  const displayDuration = (isVariant && isFieldPFMode?.('durationOfUse') && getFamilyValue)
    ? (getFamilyValue('durationOfUse') as string || localData.durationOfUse)
    : localData.durationOfUse;

  const displayEnvironment = (isVariant && isFieldPFMode?.('useEnvironment') && getFamilyValue)
    ? normalizeArrayField(getFamilyValue('useEnvironment'))
    : (localData.useEnvironment || []);

  const displayTriggers = (isVariant && isFieldPFMode?.('useTrigger') && getFamilyValue)
    ? normalizeArrayField(getFamilyValue('useTrigger'))
    : (localData.useTrigger || []);

  const handleImmediateFieldChange = useCallback(async (field: keyof IntendedPurposeData, value: any) => {
    if (!onIntendedPurposeDataChange) return;

    const existingTimeout = timeoutRefs.current.get(field);
    if (existingTimeout) clearTimeout(existingTimeout);

    setSavingStates(prev => new Set(prev).add(field));
    isInternalUpdateRef.current = true;

    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    onIntendedPurposeDataChange(updatedData);

    // Auto-sync scope
    const timeoutId = setTimeout(() => {
      setSavingStates(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
      timeoutRefs.current.delete(field);
    }, 1000);

    timeoutRefs.current.set(field, timeoutId);
  }, [localData, onIntendedPurposeDataChange, autoSyncScope]);

  const getSaveStatusIcon = (field: string) => {
    const isSaving = savingStates.has(field);
    if (isSaving) {
      return <Clock className="h-4 w-4 text-orange-500 animate-pulse" />;
    }
    // Check governance status
    const sectionKey = FIELD_TO_SECTION[field] || field;
    const govRecord = getSection(sectionKey);
    if (govRecord && govRecord.status !== 'draft') {
      return (
        <GovernanceBookmark
          status={govRecord.status}
          designReviewId={govRecord.design_review_id}
          verdictComment={govRecord.verdict_comment}
          approvedAt={govRecord.approved_at}
          productId={productId}
          sectionLabel={FIELD_LABELS[sectionKey] || sectionKey}
        />
      );
    }
    // Always show blue "not yet reviewed" circle
    return <GovernanceBookmark status={null} />;
  };

  // Patient population handlers
  const handleSelectPatient = (selectedPatient: string) => {
    if (selectedPatient === 'Other') {
      setShowOtherPatientInput(true);
      return;
    }
    const currentPopulation = localData.targetPopulation || [];
    if (!currentPopulation.includes(selectedPatient)) {
      handleImmediateFieldChange('targetPopulation', [...currentPopulation, selectedPatient]);
    }
  };

  const handleAddOtherPatient = () => {
    const trimmedValue = otherPatientText.trim();
    if (!trimmedValue) return;
    const currentPopulation = localData.targetPopulation || [];
    if (!currentPopulation.includes(trimmedValue)) {
      handleImmediateFieldChange('targetPopulation', [...currentPopulation, trimmedValue]);
    }
    setOtherPatientText('');
    setShowOtherPatientInput(false);
  };

  const handleRemovePatient = (index: number) => {
    const currentPopulation = localData.targetPopulation || [];
    const updated = [...currentPopulation];
    updated.splice(index, 1);
    handleImmediateFieldChange('targetPopulation', updated);
  };

  // User handlers
  const handleSelectUser = (selectedUser: string) => {
    if (!onIntendedUsersChange) return;
    if (selectedUser === 'Other') {
      setShowOtherUserInput(true);
      return;
    }
    if (!intendedUsers.includes(selectedUser)) {
      const newUsers = [...intendedUsers, selectedUser];
      onIntendedUsersChange(newUsers);
    }
  };

  const handleAddOtherUser = () => {
    const trimmedValue = otherUserText.trim();
    if (!trimmedValue || !onIntendedUsersChange) return;
    if (!intendedUsers.includes(trimmedValue)) {
      const newUsers = [...intendedUsers, trimmedValue];
      onIntendedUsersChange(newUsers);
    }
    setOtherUserText('');
    setShowOtherUserInput(false);
  };

  const handleRemoveUser = (index: number) => {
    if (!onIntendedUsersChange) return;
    const updated = [...intendedUsers];
    updated.splice(index, 1);
    onIntendedUsersChange(updated);
  };

  // Environment handlers
  const handleSelectEnvironment = (selectedEnvironment: string) => {
    if (selectedEnvironment === 'Other') {
      setShowOtherEnvironmentInput(true);
      return;
    }
    const currentEnvironment = localData.useEnvironment || [];
    if (!currentEnvironment.includes(selectedEnvironment)) {
      handleImmediateFieldChange('useEnvironment', [...currentEnvironment, selectedEnvironment]);
    }
  };

  const handleAddOtherEnvironment = () => {
    const trimmedValue = otherEnvironmentText.trim();
    if (!trimmedValue) return;
    const currentEnvironment = localData.useEnvironment || [];
    if (!currentEnvironment.includes(trimmedValue)) {
      handleImmediateFieldChange('useEnvironment', [...currentEnvironment, trimmedValue]);
    }
    setOtherEnvironmentText('');
    setShowOtherEnvironmentInput(false);
  };

  const handleRemoveEnvironment = (index: number) => {
    const currentEnvironment = localData.useEnvironment || [];
    const updated = [...currentEnvironment];
    updated.splice(index, 1);
    handleImmediateFieldChange('useEnvironment', updated);
  };

  // Trigger handlers
  const handleSelectTrigger = (selectedTrigger: string) => {
    if (selectedTrigger === 'Other') {
      setShowOtherTriggerInput(true);
      return;
    }
    const currentTriggers = localData.useTrigger || [];
    if (!currentTriggers.includes(selectedTrigger)) {
      handleImmediateFieldChange('useTrigger', [...currentTriggers, selectedTrigger]);
    }
  };

  const handleAddOtherTrigger = () => {
    const trimmedValue = otherTriggerText.trim();
    if (!trimmedValue) return;
    const currentTriggers = localData.useTrigger || [];
    if (!currentTriggers.includes(trimmedValue)) {
      handleImmediateFieldChange('useTrigger', [...currentTriggers, trimmedValue]);
    }
    setOtherTriggerText('');
    setShowOtherTriggerInput(false);
  };

  const handleRemoveTrigger = (index: number) => {
    const currentTriggers = localData.useTrigger || [];
    const updated = [...currentTriggers];
    updated.splice(index, 1);
    handleImmediateFieldChange('useTrigger', updated);
  };

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    };
  }, []);

  return (
    <>
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${disabled ? 'pointer-events-none' : ''}`}>
      {/* Target Patient Population */}
      <div className={`space-y-2 ${isInGenesisFlow ? `p-3 rounded-lg transition-colors ${(localData.targetPopulation?.length ?? 0) > 0 ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}`}>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            {lang('devicePurpose.context.patientPopulationLabel')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">{lang('devicePurpose.context.patientPopulationTooltip')}</p>
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
                    disabled={isAiLoading?.('target_population') || isAiButtonDisabled?.('target_population') || !setAiLoading || !companyId}
                    onClick={() => handleOpenExplainer('target_population')}
                  >
                    {isAiLoading?.('target_population') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
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
                itemId="intendedPatientPopulation"
                exclusionScope={fieldExclusion.getExclusionScope('intendedPatientPopulation')}
                onScopeChange={createValueMatchScopeChange('intendedPatientPopulation', intendedPurposeData?.targetPopulation)}
                defaultCurrentDeviceOnly
                familyProductIds={familyProductIds}
                summaryText={getMatchSummary('intendedPatientPopulation', intendedPurposeData?.targetPopulation)}
                valueMatchingProductIds={getMatchingProductIds('intendedPatientPopulation', intendedPurposeData?.targetPopulation)}
              />
            ) : null}
            {getSaveStatusIcon('targetPopulation')}
          </div>
        </div>
        
        <Popover open={isPatientDropdownOpen} onOpenChange={setIsPatientDropdownOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between" disabled={isLoading}>
              <span>{lang('devicePurpose.context.selectPatientPopulation')}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isPatientDropdownOpen ? 'rotate-180' : ''}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder={lang('devicePurpose.context.searchPatientTypes')} />
              <CommandList>
                <CommandEmpty>{lang('devicePurpose.context.noPatientTypeFound')}</CommandEmpty>
                <CommandGroup>
                  {predefinedPatients.map((patient) => (
                    <CommandItem
                      key={patient}
                      value={patient}
                      onSelect={() => {
                        handleSelectPatient(patient);
                      }}
                      disabled={displayPopulation.includes(patient) && patient !== 'Other'}
                      className="cursor-pointer"
                    >
                      {patient}
                      {displayPopulation.includes(patient) && patient !== 'Other' && (
                        <span className="ml-2 text-xs text-muted-foreground">{lang('devicePurpose.context.selected')}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="flex flex-wrap gap-2">
          {displayPopulation.map((patient, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-2 min-h-[2rem]">
              {patient}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemovePatient(index)}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        {showOtherPatientInput && (
          <div className="flex gap-2">
            <Input
              placeholder={lang('devicePurpose.context.specifyOtherPatient')}
              value={otherPatientText}
              onChange={(e) => setOtherPatientText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleAddOtherPatient(); }
                if (e.key === 'Escape') { setShowOtherPatientInput(false); setOtherPatientText(''); }
              }}
              disabled={isLoading}
            />
            <Button onClick={handleAddOtherPatient} disabled={!otherPatientText.trim() || isLoading} variant="secondary">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => { setShowOtherPatientInput(false); setOtherPatientText(''); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <Collapsible open={showPopulationDesc} onOpenChange={setShowPopulationDesc}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground h-7 px-2 mt-1">
              <FileText className="h-3 w-3" />
              {showPopulationDesc ? 'Hide description' : 'Add detailed description'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <RichTextField
              value={localData.targetPopulationDescription || ''}
              onChange={(html) => handleImmediateFieldChange('targetPopulationDescription', html)}
              placeholder="Describe the target patient population in detail (e.g., age ranges, conditions, contraindications)..."
              minHeight="100px"
              disabled={disabled || isLoading}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
      <div className={`space-y-2 ${isInGenesisFlow ? `p-3 rounded-lg transition-colors ${(intendedUsers?.length ?? 0) > 0 ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}`}>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            {lang('devicePurpose.context.intendedUserLabel')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">{lang('devicePurpose.context.intendedUserTooltip')}</p>
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
                    disabled={isAiLoading?.('intended_user') || isAiButtonDisabled?.('intended_user') || !setAiLoading || !companyId}
                    onClick={() => handleOpenExplainer('intended_user')}
                  >
                    {isAiLoading?.('intended_user') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
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
                itemId="intendedUsers"
                exclusionScope={fieldExclusion.getExclusionScope('intendedUsers')}
                onScopeChange={createValueMatchScopeChange('intendedUsers', intendedUsers)}
                defaultCurrentDeviceOnly
                familyProductIds={familyProductIds}
                summaryText={getMatchSummary('intendedUsers', intendedUsers)}
                valueMatchingProductIds={getMatchingProductIds('intendedUsers', intendedUsers)}
              />
            ) : null}
            {getSaveStatusIcon('intendedUser')}
          </div>
        </div>
        
        <Popover open={isUserDropdownOpen} onOpenChange={setIsUserDropdownOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between" disabled={isLoading}>
              <span>{lang('devicePurpose.context.selectIntendedUsers')}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder={lang('devicePurpose.context.searchUserTypes')} />
              <CommandList>
                <CommandEmpty>{lang('devicePurpose.context.noUserTypeFound')}</CommandEmpty>
                <CommandGroup>
                  {predefinedUsers.map((user) => (
                    <CommandItem
                      key={user}
                      value={user}
                      onSelect={() => {
                        handleSelectUser(user);
                      }}
                      disabled={displayUsers.includes(user) && user !== 'Other'}
                      className="cursor-pointer"
                    >
                      {user}
                      {displayUsers.includes(user) && user !== 'Other' && (
                        <span className="ml-2 text-xs text-muted-foreground">{lang('devicePurpose.context.selected')}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="flex flex-wrap gap-2">
          {displayUsers.map((user, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-2 min-h-[2rem]">
              {user}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemoveUser(index)}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        {showOtherUserInput && (
          <div className="flex gap-2">
            <Input
              placeholder={lang('devicePurpose.context.specifyOtherUser')}
              value={otherUserText}
              onChange={(e) => setOtherUserText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleAddOtherUser(); }
                if (e.key === 'Escape') { setShowOtherUserInput(false); setOtherUserText(''); }
              }}
              disabled={isLoading}
            />
            <Button onClick={handleAddOtherUser} disabled={!otherUserText.trim() || isLoading} variant="secondary">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => { setShowOtherUserInput(false); setOtherUserText(''); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <Collapsible open={showUsersDesc} onOpenChange={setShowUsersDesc}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground h-7 px-2 mt-1">
              <FileText className="h-3 w-3" />
              {showUsersDesc ? 'Hide description' : 'Add detailed description'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <RichTextField
              value={localData.intendedUsersDescription || ''}
              onChange={(html) => handleImmediateFieldChange('intendedUsersDescription', html)}
              placeholder="Describe the intended users in detail (e.g., required training, qualifications, experience level)..."
              minHeight="100px"
              disabled={disabled || isLoading}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            {lang('devicePurpose.context.durationOfUseLabel')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">{lang('devicePurpose.context.durationOfUseTooltip')}</p>
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
                    disabled={isAiLoading?.('duration_of_use') || isAiButtonDisabled?.('duration_of_use') || !setAiLoading || !companyId}
                    onClick={() => handleOpenExplainer('duration_of_use')}
                  >
                    {isAiLoading?.('duration_of_use') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
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
                itemId="durationOfUse"
                exclusionScope={fieldExclusion.getExclusionScope('durationOfUse')}
                onScopeChange={createValueMatchScopeChange('durationOfUse', intendedPurposeData?.durationOfUse)}
                defaultCurrentDeviceOnly
                familyProductIds={familyProductIds}
                summaryText={getMatchSummary('durationOfUse', intendedPurposeData?.durationOfUse)}
                valueMatchingProductIds={getMatchingProductIds('durationOfUse', intendedPurposeData?.durationOfUse)}
              />
            ) : null}
            {getSaveStatusIcon('durationOfUse')}
          </div>
        </div>
        
        <Select
          value={displayDuration || ''}
          onValueChange={(value) => handleImmediateFieldChange('durationOfUse', value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={lang('devicePurpose.context.selectDurationOfUse')}>
              {displayDuration && durationOptions.find(o => o.value === displayDuration)?.label.split(':')[0]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {durationOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
      </div>

      {/* Environment of Use */}
      <div className={`space-y-2 ${isInGenesisFlow ? `p-3 rounded-lg transition-colors ${(localData.useEnvironment?.length ?? 0) > 0 ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}`}>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            {lang('devicePurpose.context.environmentLabel')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">{lang('devicePurpose.context.environmentTooltip')}</p>
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
                    disabled={isAiLoading?.('use_environment') || isAiButtonDisabled?.('use_environment') || !setAiLoading || !companyId}
                    onClick={() => handleOpenExplainer('use_environment')}
                  >
                    {isAiLoading?.('use_environment') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
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
                itemId="environmentOfUse"
                exclusionScope={fieldExclusion.getExclusionScope('environmentOfUse')}
                onScopeChange={createValueMatchScopeChange('environmentOfUse', intendedPurposeData?.useEnvironment)}
                defaultCurrentDeviceOnly
                familyProductIds={familyProductIds}
                summaryText={getMatchSummary('environmentOfUse', intendedPurposeData?.useEnvironment)}
                valueMatchingProductIds={getMatchingProductIds('environmentOfUse', intendedPurposeData?.useEnvironment)}
              />
            ) : null}
            {getSaveStatusIcon('useEnvironment')}
          </div>
        </div>
        
        <Popover open={isEnvironmentDropdownOpen} onOpenChange={setIsEnvironmentDropdownOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between" disabled={isLoading}>
              <span>{lang('devicePurpose.context.selectEnvironment')}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isEnvironmentDropdownOpen ? 'rotate-180' : ''}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder={lang('devicePurpose.context.searchEnvironments')} />
              <CommandList>
                <CommandEmpty>{lang('devicePurpose.context.noEnvironmentFound')}</CommandEmpty>
                <CommandGroup>
                  {predefinedEnvironments.map((env) => (
                    <CommandItem
                      key={env}
                      value={env}
                      onSelect={() => {
                        handleSelectEnvironment(env);
                      }}
                      disabled={displayEnvironment.includes(env) && env !== 'Other'}
                      className="cursor-pointer"
                    >
                      {env}
                      {displayEnvironment.includes(env) && env !== 'Other' && (
                        <span className="ml-2 text-xs text-muted-foreground">{lang('devicePurpose.context.selected')}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="flex flex-wrap gap-2">
          {displayEnvironment.map((env, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-2 min-h-[2rem]">
              {env}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemoveEnvironment(index)}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        {showOtherEnvironmentInput && (
          <div className="flex gap-2">
            <Input
              placeholder={lang('devicePurpose.context.specifyOtherEnvironment')}
              value={otherEnvironmentText}
              onChange={(e) => setOtherEnvironmentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleAddOtherEnvironment(); }
                if (e.key === 'Escape') { setShowOtherEnvironmentInput(false); setOtherEnvironmentText(''); }
              }}
              disabled={isLoading}
            />
            <Button onClick={handleAddOtherEnvironment} disabled={!otherEnvironmentText.trim() || isLoading} variant="secondary">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => { setShowOtherEnvironmentInput(false); setOtherEnvironmentText(''); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <Collapsible open={showEnvironmentDesc} onOpenChange={setShowEnvironmentDesc}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground h-7 px-2 mt-1">
              <FileText className="h-3 w-3" />
              {showEnvironmentDesc ? 'Hide description' : 'Add detailed description'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <RichTextField
              value={localData.useEnvironmentDescription || ''}
              onChange={(html) => handleImmediateFieldChange('useEnvironmentDescription', html)}
              placeholder="Describe the use environment in detail (e.g., specific clinical settings, environmental conditions, infrastructure requirements)..."
              minHeight="100px"
              disabled={disabled || isLoading}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Trigger for Use */}
      <div className="space-y-2 md:col-span-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            {lang('devicePurpose.context.triggerLabel')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">{lang('devicePurpose.context.triggerTooltip')}</p>
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
                    disabled={isAiLoading?.('use_trigger') || isAiButtonDisabled?.('use_trigger') || !setAiLoading || !companyId}
                    onClick={() => handleOpenExplainer('use_trigger')}
                  >
                    {isAiLoading?.('use_trigger') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
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
                itemId="useTrigger"
                exclusionScope={fieldExclusion.getExclusionScope('useTrigger')}
                onScopeChange={createValueMatchScopeChange('useTrigger', intendedPurposeData?.useTrigger)}
                defaultCurrentDeviceOnly
                familyProductIds={familyProductIds}
                summaryText={getMatchSummary('useTrigger', intendedPurposeData?.useTrigger)}
                valueMatchingProductIds={getMatchingProductIds('useTrigger', intendedPurposeData?.useTrigger)}
              />
            ) : null}
            {getSaveStatusIcon('useTrigger')}
          </div>
        </div>
        
        <Popover open={isTriggerDropdownOpen} onOpenChange={setIsTriggerDropdownOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between" disabled={isLoading}>
              <span>{lang('devicePurpose.context.selectTrigger')}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isTriggerDropdownOpen ? 'rotate-180' : ''}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder={lang('devicePurpose.context.searchTriggers')} />
              <CommandList>
                <CommandEmpty>{lang('devicePurpose.context.noTriggerFound')}</CommandEmpty>
                <CommandGroup>
                  {predefinedTriggers.map((trigger) => (
                    <CommandItem
                      key={trigger}
                      value={trigger}
                      onSelect={() => {
                        handleSelectTrigger(trigger);
                      }}
                      disabled={displayTriggers.includes(trigger) && trigger !== 'Other'}
                      className="cursor-pointer"
                    >
                      {trigger}
                      {displayTriggers.includes(trigger) && trigger !== 'Other' && (
                        <span className="ml-2 text-xs text-muted-foreground">{lang('devicePurpose.context.selected')}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="flex flex-wrap gap-2">
          {displayTriggers.map((trigger, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-2 min-h-[2rem]">
              {trigger}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemoveTrigger(index)}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        {showOtherTriggerInput && (
          <div className="flex gap-2">
            <Input
              placeholder={lang('devicePurpose.context.specifyOtherTrigger')}
              value={otherTriggerText}
              onChange={(e) => setOtherTriggerText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleAddOtherTrigger(); }
                if (e.key === 'Escape') { setShowOtherTriggerInput(false); setOtherTriggerText(''); }
              }}
              disabled={isLoading}
            />
            <Button onClick={handleAddOtherTrigger} disabled={!otherTriggerText.trim() || isLoading} variant="secondary">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => { setShowOtherTriggerInput(false); setOtherTriggerText(''); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <Collapsible open={showTriggerDesc} onOpenChange={setShowTriggerDesc}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground h-7 px-2 mt-1">
              <FileText className="h-3 w-3" />
              {showTriggerDesc ? 'Hide description' : 'Add detailed description'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <RichTextField
              value={localData.useTriggerDescription || ''}
              onChange={(html) => handleImmediateFieldChange('useTriggerDescription', html)}
              placeholder="Describe the triggers for use in detail (e.g., specific clinical scenarios, symptoms, diagnostic criteria)..."
              minHeight="100px"
              disabled={disabled || isLoading}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>

    {/* Document Studio Field Suggestions */}
    {(['intended_purpose_data.targetPopulation', 'intended_purpose_data.userProfile', 'intended_purpose_data.useEnvironment', 'intended_purpose_data.durationOfUse'] as const).map(fieldKey => {
      const s = fieldSuggestions.find(fs => fs.field_key === fieldKey);
      if (!s) return null;
      return (
        <PendingFieldSuggestion
          key={s.id}
          fieldLabel={s.field_label}
          suggestedValue={s.suggested_value}
          onAccept={() => onAcceptFieldSuggestion?.(s, s.suggested_value)}
          onReject={() => onRejectFieldSuggestion?.(s.id)}
        />
      );
    })}

    {/* Governance Edit Warning Dialog */}
    <GovernanceEditConfirmDialog
      open={govDialog}
      onOpenChange={setGovDialog}
      onConfirm={govConfirm}
      sectionLabel={govFieldLabel}
    />

    {/* AI-Assisted Generation Dialog */}
    <AIExplainerDialog
      open={explainerField !== null}
      onOpenChange={(open) => !open && setExplainerField(null)}
      onConfirm={handleExplainerConfirm}
      isLoading={explainerField ? (isAiLoading?.(explainerField) ?? false) : false}
      fieldName={explainerField ? CONTEXT_AI_FIELDS[explainerField].name : ''}
      fieldDescription={explainerField ? CONTEXT_AI_FIELDS[explainerField].description : undefined}
      productId={productId || ''}
      companyId={companyId}
    />

    {/* Review AI Suggestion Dialog */}
    <AISuggestionReviewDialog
      open={pendingSuggestion !== null}
      onOpenChange={(open) => !open && setPendingSuggestion(null)}
      fieldLabel={pendingSuggestion?.fieldLabel || ''}
      originalContent={pendingSuggestion?.original || ''}
      suggestedContent={pendingSuggestion?.suggested || ''}
      onAccept={(content) => {
        if (pendingSuggestion) {
          const fk = pendingSuggestion.fieldKey;
          const suggestion = content.trim();

          if (fk === 'target_population') {
            const currentPopulation = localData.targetPopulation || [];
            const availableOptions = predefinedPatients.filter(o => o !== 'Other' && !currentPopulation.includes(o));
            const match = availableOptions.find(o => o.toLowerCase().includes(suggestion.toLowerCase()) || suggestion.toLowerCase().includes(o.toLowerCase()));
            if (match) handleImmediateFieldChange('targetPopulation', [...currentPopulation, match]);
          } else if (fk === 'intended_user') {
            const availableOptions = predefinedUsers.filter(o => o !== 'Other' && !intendedUsers.includes(o));
            const match = availableOptions.find(o => o.toLowerCase().includes(suggestion.toLowerCase()) || suggestion.toLowerCase().includes(o.toLowerCase()));
            if (match) onIntendedUsersChange?.([...intendedUsers, match]);
          } else if (fk === 'duration_of_use') {
            const match = durationOptions.find(o => suggestion.toLowerCase().includes(o.label.toLowerCase()) || o.label.toLowerCase().includes(suggestion.toLowerCase()) || o.value === suggestion.toLowerCase());
            if (match) handleImmediateFieldChange('durationOfUse', match.value);
          } else if (fk === 'use_environment') {
            const currentEnv = localData.useEnvironment || [];
            const availableOptions = predefinedEnvironments.filter(o => o !== 'Other' && !currentEnv.includes(o));
            const match = availableOptions.find(o => o.toLowerCase().includes(suggestion.toLowerCase()) || suggestion.toLowerCase().includes(o.toLowerCase()));
            if (match) handleImmediateFieldChange('useEnvironment', [...currentEnv, match]);
          } else if (fk === 'use_trigger') {
            const currentTriggers = localData.useTrigger || [];
            const availableOptions = predefinedTriggers.filter(o => o !== 'Other' && !currentTriggers.includes(o));
            const match = availableOptions.find(o => o.toLowerCase().includes(suggestion.toLowerCase()) || suggestion.toLowerCase().includes(o.toLowerCase()));
            if (match) handleImmediateFieldChange('useTrigger', [...currentTriggers, match]);
          }

          onAcceptAISuggestion?.(fk, content);
        }
        setPendingSuggestion(null);
      }}
      onReject={() => setPendingSuggestion(null)}
    />
    </>
  );
}
