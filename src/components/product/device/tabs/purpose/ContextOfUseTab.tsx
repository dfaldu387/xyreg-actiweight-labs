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
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { ContextWarningToast, getMissingFieldsWithNavigation, getContextSources } from '../../ai-assistant/ContextWarningToast';
import { InheritanceExclusionPopover } from '@/components/shared/InheritanceExclusionPopover';

import { Json } from '@/integrations/supabase/types';
import { RichTextField } from '@/components/shared/RichTextField';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
                    onClick={async () => {
                      if (!onAcceptAISuggestion || !companyId || isAiLoading?.('target_population')) return;

                      // Check for minimum context - BLOCK if insufficient
                      const validation = hasMinimumContext(deviceContext);
                      if (!validation.valid) {
                        const missingFieldsWithNav = getMissingFieldsWithNavigation(validation.missingFields);
                        toast.error(
                          <ContextWarningToast missingFields={missingFieldsWithNav} />,
                          { duration: 8000 }
                        );
                        return; // BLOCK generation
                      }

                      // Show what context we're using
                      const sources = getContextSources(deviceContext);
                      if (sources.length > 0) {
                        toast.info(`Getting context from: ${sources.join(', ')}...`, { duration: 2000 });
                      }

                      setAiLoading?.('target_population', true);
                      try {
                        const currentPopulation = localData.targetPopulation || [];
                        const availableOptions = predefinedPatients.filter(option => 
                          option !== 'Other' && !currentPopulation.includes(option)
                        );

                        if (availableOptions.length === 0) {
                          setAiLoading?.('target_population', false);
                          return;
                        }

                        const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                          productName || 'Current Medical Device',
                          'Intended Patient Population (On Whom)',
                          `Select the most appropriate patient population from these predefined options: ${availableOptions.join(', ')}. Choose the option that best matches the device's intended use.`,
                          currentPopulation.join(', '),
                          'target_population',
                          companyId,
                          `Select exactly one option from this list: ${availableOptions.join(', ')}. Return only the exact text from the list.`,
                          deviceContext
                        );

                        if (response.success && response.suggestions?.[0]) {
                          const suggestion = response.suggestions[0].suggestion.trim();
                          
                          // Find the best match from predefined options
                          const matchedOption = availableOptions.find(option => 
                            option.toLowerCase().includes(suggestion.toLowerCase()) ||
                            suggestion.toLowerCase().includes(option.toLowerCase())
                          );
                          
                          if (matchedOption) {
                            handleImmediateFieldChange('targetPopulation', [...currentPopulation, matchedOption]);
                          }
                        }
                      } catch (error) {
                        console.error('AI suggestion error:', error);
                      } finally {
                        setAiLoading?.('target_population', false);
                      }
                    }}
                  >
                    {isAiLoading?.('target_population') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{lang('devicePurpose.aiSuggestion')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex items-center gap-2">
            {belongsToFamily && companyId && productId && fieldExclusion ? (
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
                    onClick={async () => {
                      if (!onAcceptAISuggestion || !companyId || isAiLoading?.('intended_user')) return;

                      setAiLoading?.('intended_user', true);
                      try {
                        const availableOptions = predefinedUsers.filter(option => 
                          option !== 'Other' && !intendedUsers.includes(option)
                        );

                        if (availableOptions.length === 0) {
                          setAiLoading?.('intended_user', false);
                          return;
                        }

                        const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                          productName || 'Current Medical Device',
                          'Intended User (By Whom)',
                          `Select the most appropriate user type from these predefined options: ${availableOptions.join(', ')}. Choose who will operate the device.`,
                          intendedUsers.join(', '),
                          'intended_user',
                          companyId,
                          `Select exactly one option from this list: ${availableOptions.join(', ')}. Return only the exact text from the list.`
                        );

                        if (response.success && response.suggestions?.[0]) {
                          const suggestion = response.suggestions[0].suggestion.trim();
                          
                          // Find the best match from predefined options
                          const matchedOption = availableOptions.find(option => 
                            option.toLowerCase().includes(suggestion.toLowerCase()) ||
                            suggestion.toLowerCase().includes(option.toLowerCase())
                          );
                          
                          if (matchedOption) {
                            onIntendedUsersChange?.([...intendedUsers, matchedOption]);
                          }
                        }
                      } catch (error) {
                        console.error('AI suggestion error:', error);
                      } finally {
                        setAiLoading?.('intended_user', false);
                      }
                    }}
                  >
                    {isAiLoading?.('intended_user') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{lang('devicePurpose.aiSuggestion')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex items-center gap-2">
            {belongsToFamily && companyId && productId && fieldExclusion ? (
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
                    onClick={async () => {
                      if (!onAcceptAISuggestion || !companyId || isAiLoading?.('duration_of_use')) return;

                      setAiLoading?.('duration_of_use', true);
                      try {
                        const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                          productName || 'Current Medical Device',
                          'Duration of Use (How Long)',
                          `Select the most appropriate MDR-compliant duration from: Transient (less than 60 minutes), Short-Term (60 minutes to 30 days), Long-Term (more than 30 days). These definitions are from EU MDR 2017/745 Annex VIII.`,
                          localData.durationOfUse || '',
                          'duration_of_use',
                          companyId,
                          `Select exactly one option from this list: transient, short_term, long_term. Return only the exact value from the list.`
                        );

                        if (response.success && response.suggestions?.[0]) {
                          const suggestion = response.suggestions[0].suggestion.trim().toLowerCase();
                          
                          // Find the best match from predefined options
                          const matchedOption = durationOptions.find(option => 
                            option.value === suggestion ||
                            option.value.includes(suggestion) ||
                            suggestion.includes(option.value)
                          );
                          
                          if (matchedOption) {
                            handleImmediateFieldChange('durationOfUse', matchedOption.value);
                          }
                        }
                      } catch (error) {
                        console.error('AI suggestion error:', error);
                      } finally {
                        setAiLoading?.('duration_of_use', false);
                      }
                    }}
                  >
                    {isAiLoading?.('duration_of_use') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{lang('devicePurpose.aiSuggestion')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex items-center gap-2">
            {belongsToFamily && companyId && productId && fieldExclusion ? (
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
                    onClick={async () => {
                      if (!onAcceptAISuggestion || !companyId || isAiLoading?.('use_environment')) return;

                      setAiLoading?.('use_environment', true);
                      try {
                        const currentEnvironment = localData.useEnvironment || [];
                        const availableOptions = predefinedEnvironments.filter(option => 
                          option !== 'Other' && !currentEnvironment.includes(option)
                        );

                        if (availableOptions.length === 0) {
                          setAiLoading?.('use_environment', false);
                          return;
                        }

                        const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                          productName || 'Current Medical Device',
                          'Environment of Use (The Where)',
                          `Select the most appropriate environment from these predefined options: ${availableOptions.join(', ')}. Choose where the device will be used.`,
                          currentEnvironment.join(', '),
                          'use_environment',
                          companyId,
                          `Select exactly one option from this list: ${availableOptions.join(', ')}. Return only the exact text from the list.`
                        );

                        if (response.success && response.suggestions?.[0]) {
                          const suggestion = response.suggestions[0].suggestion.trim();
                          
                          // Find the best match from predefined options
                          const matchedOption = availableOptions.find(option => 
                            option.toLowerCase().includes(suggestion.toLowerCase()) ||
                            suggestion.toLowerCase().includes(option.toLowerCase())
                          );
                          
                          if (matchedOption) {
                            handleImmediateFieldChange('useEnvironment', [...currentEnvironment, matchedOption]);
                          }
                        }
                      } catch (error) {
                        console.error('AI suggestion error:', error);
                      } finally {
                        setAiLoading?.('use_environment', false);
                      }
                    }}
                  >
                    {isAiLoading?.('use_environment') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{lang('devicePurpose.aiSuggestion')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex items-center gap-2">
            {belongsToFamily && companyId && productId && fieldExclusion ? (
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
                    onClick={async () => {
                      if (!onAcceptAISuggestion || !companyId || isAiLoading?.('use_trigger')) return;

                      setAiLoading?.('use_trigger', true);
                      try {
                        const currentTriggers = localData.useTrigger || [];
                        const availableOptions = predefinedTriggers.filter(option => 
                          option !== 'Other' && !currentTriggers.includes(option)
                        );

                        if (availableOptions.length === 0) {
                          setAiLoading?.('use_trigger', false);
                          return;
                        }

                        const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                          productName || 'Current Medical Device',
                          'Trigger for Use (The When)',
                          `Select the most appropriate trigger from these predefined options: ${availableOptions.join(', ')}. Choose what event or condition initiates the device use.`,
                          currentTriggers.join(', '),
                          'use_trigger',
                          companyId,
                          `Select exactly one option from this list: ${availableOptions.join(', ')}. Return only the exact text from the list.`
                        );

                        if (response.success && response.suggestions?.[0]) {
                          const suggestion = response.suggestions[0].suggestion.trim();
                          
                          // Find the best match from predefined options
                          const matchedOption = availableOptions.find(option => 
                            option.toLowerCase().includes(suggestion.toLowerCase()) ||
                            suggestion.toLowerCase().includes(option.toLowerCase())
                          );
                          
                          if (matchedOption) {
                            handleImmediateFieldChange('useTrigger', [...currentTriggers, matchedOption]);
                          }
                        }
                      } catch (error) {
                        console.error('AI suggestion error:', error);
                      } finally {
                        setAiLoading?.('use_trigger', false);
                      }
                    }}
                  >
                    {isAiLoading?.('use_trigger') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{lang('devicePurpose.aiSuggestion')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex items-center gap-2">
            {belongsToFamily && companyId && productId && fieldExclusion ? (
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

    {/* Governance Edit Warning Dialog */}
    <GovernanceEditConfirmDialog
      open={govDialog}
      onOpenChange={setGovDialog}
      onConfirm={govConfirm}
      sectionLabel={govFieldLabel}
    />
    </>
  );
}
