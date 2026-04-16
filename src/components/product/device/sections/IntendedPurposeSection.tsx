import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X, HelpCircle, Check, Clock, ChevronDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { debounce } from '@/utils/debounce';
import { CircularProgress } from '@/components/common/CircularProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AIFieldButton } from '../ai-assistant/AIFieldButton';
import { FieldSuggestion, productDefinitionAIService } from '@/services/productDefinitionAIService';
import { GovernanceBookmark } from "@/components/ui/GovernanceBookmark";
import type { GovernanceStatus } from "@/services/fieldGovernanceService";
import CompactScopeToggle from '../../shared/CompactScopeToggle';

// Utility function to normalize array fields
const normalizeArrayField = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    // Handle empty strings
    if (value.trim() === '') return [];
    // Try to parse as JSON array first
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      // If not JSON, treat as single string value
      return [value];
    }
  }
  return [];
};

interface IntendedPurposeData {
  clinicalPurpose?: string;
  indications?: string;
  targetPopulation?: string[];
  userProfile?: string;
  useEnvironment?: string[];
  durationOfUse?: string;
  modeOfAction?: string;
  principles_of_operation?: string;
  warnings?: string[];
}

interface UserInstructions {
  how_to_use?: string;
  charging?: string;
  maintenance?: string;
}

interface IntendedPurposeSectionProps {
  intendedUse?: string;
  intendedPurposeData?: IntendedPurposeData;
  contraindications?: string[];
  intendedUsers?: string[];
  clinicalBenefits?: string[];
  userInstructions?: UserInstructions;
  onIntendedUseChange?: (value: string) => void;
  onIntendedPurposeDataChange?: (value: IntendedPurposeData) => void;
  onContraindicationsChange?: (value: string[]) => void;
  onIntendedUsersChange?: (value: string[]) => void;
  onClinicalBenefitsChange?: (value: string[]) => void;
  onUserInstructionsChange?: (value: UserInstructions) => void;
  isLoading?: boolean;
  progress?: number;
  // AI suggestions props
  aiSuggestions?: FieldSuggestion[];
  onAcceptAISuggestion?: (fieldType: string, suggestion: string) => void;
  companyId?: string;
  productName?: string;
  // Per-field scope props
  hasModel?: boolean;
  fieldScopes?: Record<string, 'individual' | 'product_family'>;
  onFieldScopeChange?: (fieldKey: string, scope: 'individual' | 'product_family') => void;
  governanceStatus?: GovernanceStatus | null;
  governanceDesignReviewId?: string | null;
  governanceVerdictComment?: string | null;
  governanceApprovedAt?: string | null;
  productId?: string;
}

export function IntendedPurposeSection({
  intendedUse = '',
  intendedPurposeData = {},
  contraindications = [],
  intendedUsers = [],
  clinicalBenefits = [],
  userInstructions = {},
  onIntendedUseChange,
  onIntendedPurposeDataChange,
  onContraindicationsChange,
  onIntendedUsersChange,
  onClinicalBenefitsChange,
  onUserInstructionsChange,
  isLoading = false,
  aiSuggestions = [],
  onAcceptAISuggestion,
  progress = 0,
  companyId = '',
  productName = 'Current Medical Device',
  hasModel = false,
  fieldScopes = {},
  onFieldScopeChange,
  governanceStatus,
  governanceDesignReviewId,
  governanceVerdictComment,
  governanceApprovedAt,
  productId,
}: IntendedPurposeSectionProps) {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const isGapFlow = returnTo === 'gap-analysis';

  // Local state for text fields to prevent constant parent updates
  const [localIntendedPurposeData, setLocalIntendedPurposeData] = useState<IntendedPurposeData>(() => ({
    ...intendedPurposeData,
    targetPopulation: normalizeArrayField(intendedPurposeData.targetPopulation),
    useEnvironment: normalizeArrayField(intendedPurposeData.useEnvironment),
    warnings: normalizeArrayField(intendedPurposeData.warnings),
  }));
  const [newContraindication, setNewContraindication] = useState('');
  const [newWarning, setNewWarning] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [savingStates, setSavingStates] = useState<Set<string>>(new Set());
  const [showOtherUserInput, setShowOtherUserInput] = useState(false);
  const [otherUserText, setOtherUserText] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [showOtherPatientInput, setShowOtherPatientInput] = useState(false);
  const [otherPatientText, setOtherPatientText] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [showOtherEnvironmentInput, setShowOtherEnvironmentInput] = useState(false);
  const [otherEnvironmentText, setOtherEnvironmentText] = useState('');
  const [isEnvironmentDropdownOpen, setIsEnvironmentDropdownOpen] = useState(false);
  const [aiLoadingStates, setAiLoadingStates] = useState<Set<string>>(new Set());
  const [activeUserInstructionTab, setActiveUserInstructionTab] = useState('how_to_use');
  const [activeAiButton, setActiveAiButton] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isInternalUpdateRef = useRef(false);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Predefined user categories
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

  // Predefined patient population categories
  const predefinedPatients = [
    'Adults (18+ years)',
    'Pediatric patients (under 18)',
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

  // Predefined environment categories
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

  // Refs for debounced functions
  const debouncedUpdateRef = useRef<Map<string, ReturnType<typeof debounce>>>(new Map());

  // Helper functions for AI loading states
  const setAiLoading = useCallback((fieldType: string, isLoading: boolean) => {
    setAiLoadingStates(prev => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(fieldType);
        setActiveAiButton(fieldType);
      } else {
        newSet.delete(fieldType);
        setActiveAiButton(currentActive => {
          const shouldClear = currentActive === fieldType;
          return shouldClear ? null : currentActive;
        });
      }
      return newSet;
    });
  }, []);

  const isAiLoading = useCallback((fieldType: string) => {
    return aiLoadingStates.has(fieldType);
  }, [aiLoadingStates]);

  const isAiButtonDisabled = useCallback((fieldType: string) => {
    return activeAiButton !== null && activeAiButton !== fieldType;
  }, [activeAiButton]);

  // Update local state when props change
  useEffect(() => {
    if (!isInternalUpdateRef.current) {
      setLocalIntendedPurposeData({
        ...intendedPurposeData,
        targetPopulation: normalizeArrayField(intendedPurposeData.targetPopulation),
        useEnvironment: normalizeArrayField(intendedPurposeData.useEnvironment),
        warnings: normalizeArrayField(intendedPurposeData.warnings),
      });
    }
    // Reset the flag after processing
    isInternalUpdateRef.current = false;
  }, [intendedPurposeData]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper function to check if a field has meaningful content
  const hasFieldContent = useCallback((field: keyof IntendedPurposeData) => {
    const fieldValue = localIntendedPurposeData[field];
    if (Array.isArray(fieldValue)) {
      return fieldValue.length > 0;
    }
    if (typeof fieldValue === 'string') {
      return fieldValue.trim().length > 0;
    }
    return false;
  }, [localIntendedPurposeData]);

  // Create stable debounced update function with save state tracking
  const createDebouncedUpdate = useCallback((field: keyof IntendedPurposeData) => {
    if (!debouncedUpdateRef.current.has(field)) {
      const debouncedFn = debounce(async (value: any) => {
        if (onIntendedPurposeDataChange) {
          setSavingStates(prev => new Set(prev).add(field));
          try {
            isInternalUpdateRef.current = true;
            
            setLocalIntendedPurposeData(currentLocalState => {
              const updatedData = {
                ...currentLocalState,
                [field]: value
              };
              
              onIntendedPurposeDataChange(updatedData);
              
              return updatedData;
            });
          } catch (error) {
            console.error(`❌ [IntendedPurposeSection] Error saving ${field}:`, error);
          } finally {
            setSavingStates(prev => {
              const newSet = new Set(prev);
              newSet.delete(field);
              return newSet;
            });
          }
        }
      }, 2000);
      debouncedUpdateRef.current.set(field, debouncedFn);
    }
    return debouncedUpdateRef.current.get(field)!;
  }, [onIntendedPurposeDataChange]);

  // Handle text field changes with local state and debounced parent updates
  const handleTextFieldChange = useCallback((field: keyof IntendedPurposeData, value: string) => {

    // Update local state immediately for responsive UI
    setLocalIntendedPurposeData(prev => ({
      ...prev,
      [field]: value
    }));

    // Debounce the parent update
    const debouncedUpdate = createDebouncedUpdate(field);
    debouncedUpdate(value);
  }, [createDebouncedUpdate]);

  // Handle non-text field changes (immediate updates) with save state tracking
  const handleImmediateFieldChange = useCallback(async (field: keyof IntendedPurposeData, value: any) => {
    if (!onIntendedPurposeDataChange) return;

    const existingTimeout = timeoutRefs.current.get(field);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set saving state
    setSavingStates(prev => new Set(prev).add(field));

    isInternalUpdateRef.current = true;

    setLocalIntendedPurposeData(prevData => {
      const updatedData = {
        ...prevData,
        [field]: value
      };
      
      onIntendedPurposeDataChange(updatedData);
      
      return updatedData;
    });

    const timeoutId = setTimeout(() => {
      setSavingStates(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
      timeoutRefs.current.delete(field);
    }, 1000);

    timeoutRefs.current.set(field, timeoutId);
  }, [onIntendedPurposeDataChange]);

  // Handle adding new contraindication
  const handleAddContraindication = useCallback(() => {
    const trimmedValue = newContraindication.trim();
    if (!trimmedValue || !onContraindicationsChange) return;
    if (contraindications.includes(trimmedValue)) {
      setNewContraindication('');
      return;
    }
    onContraindicationsChange([...contraindications, trimmedValue]);
    setNewContraindication('');
  }, [newContraindication, onContraindicationsChange, contraindications]);

  // Handle removing contraindication
  const handleRemoveContraindication = useCallback((index: number) => {
    if (!onContraindicationsChange) return;
    const updated = [...contraindications];
    updated.splice(index, 1);
    onContraindicationsChange(updated);
  }, [onContraindicationsChange, contraindications]);

  // Handle adding new warning
  const handleAddWarning = useCallback(() => {
    const trimmedValue = newWarning.trim();
    if (!trimmedValue) return;
    const warnings = localIntendedPurposeData.warnings || [];
    if (warnings.includes(trimmedValue)) {
      setNewWarning('');
      return;
    }
    const updatedWarnings = [...warnings, trimmedValue];
    handleImmediateFieldChange('warnings', updatedWarnings);
    setNewWarning('');
  }, [newWarning, localIntendedPurposeData.warnings, handleImmediateFieldChange]);

  // Handle removing warning
  const handleRemoveWarning = useCallback((index: number) => {
    const warnings = localIntendedPurposeData.warnings || [];
    const updated = [...warnings];
    updated.splice(index, 1);
    handleImmediateFieldChange('warnings', updated);
  }, [localIntendedPurposeData.warnings, handleImmediateFieldChange]);

  // Handle selecting user from dropdown
  const handleSelectUser = useCallback((selectedUser: string) => {
    if (!onIntendedUsersChange) return;

    if (selectedUser === 'Other') {
      setShowOtherUserInput(true);
      return;
    }

    if (!intendedUsers.includes(selectedUser)) {
      onIntendedUsersChange([...intendedUsers, selectedUser]);
    }
  }, [onIntendedUsersChange, intendedUsers]);

  // Handle adding custom "Other" user
  const handleAddOtherUser = useCallback(() => {
    const trimmedValue = otherUserText.trim();
    if (!trimmedValue || !onIntendedUsersChange) return;
    if (intendedUsers.includes(trimmedValue)) {
      setOtherUserText('');
      setShowOtherUserInput(false);
      return;
    }
    onIntendedUsersChange([...intendedUsers, trimmedValue]);
    setOtherUserText('');
    setShowOtherUserInput(false);
  }, [otherUserText, onIntendedUsersChange, intendedUsers]);

  // Handle removing user
  const handleRemoveUser = useCallback((index: number) => {
    if (!onIntendedUsersChange) return;
    const updated = [...intendedUsers];
    updated.splice(index, 1);
    onIntendedUsersChange(updated);
  }, [onIntendedUsersChange, intendedUsers]);

  // Patient population handlers
  const handleSelectPatient = useCallback((selectedPatient: string) => {
    if (selectedPatient === 'Other') {
      setShowOtherPatientInput(true);
      return;
    }

    const currentPopulation = localIntendedPurposeData.targetPopulation || [];
    if (!currentPopulation.includes(selectedPatient)) {
      handleImmediateFieldChange('targetPopulation', [...currentPopulation, selectedPatient]);
    }
  }, [localIntendedPurposeData.targetPopulation, handleImmediateFieldChange]);

  const handleAddOtherPatient = useCallback(() => {
    const trimmedValue = otherPatientText.trim();
    if (!trimmedValue) return;
    const currentPopulation = localIntendedPurposeData.targetPopulation || [];
    if (currentPopulation.includes(trimmedValue)) {
      setOtherPatientText('');
      setShowOtherPatientInput(false);
      return;
    }
    handleImmediateFieldChange('targetPopulation', [...currentPopulation, trimmedValue]);
    setOtherPatientText('');
    setShowOtherPatientInput(false);
  }, [otherPatientText, localIntendedPurposeData.targetPopulation, handleImmediateFieldChange]);

  const handleRemovePatient = useCallback((index: number) => {
    const currentPopulation = localIntendedPurposeData.targetPopulation || [];
    const updated = [...currentPopulation];
    updated.splice(index, 1);
    handleImmediateFieldChange('targetPopulation', updated);
  }, [localIntendedPurposeData.targetPopulation, handleImmediateFieldChange]);

  // Environment handlers
  const handleSelectEnvironment = useCallback((selectedEnvironment: string) => {
    if (selectedEnvironment === 'Other') {
      setShowOtherEnvironmentInput(true);
      return;
    }

    const currentEnvironment = localIntendedPurposeData.useEnvironment || [];
    if (!currentEnvironment.includes(selectedEnvironment)) {
      handleImmediateFieldChange('useEnvironment', [...currentEnvironment, selectedEnvironment]);
    }
  }, [localIntendedPurposeData.useEnvironment, handleImmediateFieldChange]);

  const handleAddOtherEnvironment = useCallback(() => {
    const trimmedValue = otherEnvironmentText.trim();
    if (!trimmedValue) return;
    const currentEnvironment = localIntendedPurposeData.useEnvironment || [];
    if (currentEnvironment.includes(trimmedValue)) {
      setOtherEnvironmentText('');
      setShowOtherEnvironmentInput(false);
      return;
    }
    handleImmediateFieldChange('useEnvironment', [...currentEnvironment, trimmedValue]);
    setOtherEnvironmentText('');
    setShowOtherEnvironmentInput(false);
  }, [otherEnvironmentText, localIntendedPurposeData.useEnvironment, handleImmediateFieldChange]);

  const handleRemoveEnvironment = useCallback((index: number) => {
    const currentEnvironment = localIntendedPurposeData.useEnvironment || [];
    const updated = [...currentEnvironment];
    updated.splice(index, 1);
    handleImmediateFieldChange('useEnvironment', updated);
  }, [localIntendedPurposeData.useEnvironment, handleImmediateFieldChange]);

  // Handle adding new benefit
  const handleAddBenefit = useCallback(() => {
    const trimmedValue = newBenefit.trim();
    if (!trimmedValue || !onClinicalBenefitsChange) return;
    if (clinicalBenefits.includes(trimmedValue)) {
      setNewBenefit('');
      return;
    }
    onClinicalBenefitsChange([...clinicalBenefits, trimmedValue]);
    setNewBenefit('');
  }, [newBenefit, onClinicalBenefitsChange, clinicalBenefits]);

  // Handle removing benefit
  const handleRemoveBenefit = useCallback((index: number) => {
    if (!onClinicalBenefitsChange) return;
    const updated = [...clinicalBenefits];
    updated.splice(index, 1);
    onClinicalBenefitsChange(updated);
  }, [onClinicalBenefitsChange, clinicalBenefits]);

  // Handle user instruction changes
  const handleInstructionChange = useCallback((field: keyof UserInstructions, value: string) => {
    if (!onUserInstructionsChange) return;
    const updated = {
      ...userInstructions,
      [field]: value
    };
    onUserInstructionsChange(updated);
  }, [onUserInstructionsChange, userInstructions]);

  // Calculate completion for each category
  const calculateCategoryCompletion = useCallback((categoryFields: string[]) => {
    const completedFields = categoryFields.filter(field => {
      if (field === 'contraindications') return contraindications && contraindications.length > 0;
      if (field === 'warnings') return localIntendedPurposeData.warnings && localIntendedPurposeData.warnings.length > 0;
      if (field === 'intendedUsers') return intendedUsers && intendedUsers.length > 0;
      if (field === 'targetPopulation') return localIntendedPurposeData.targetPopulation && localIntendedPurposeData.targetPopulation.length > 0;
      if (field === 'useEnvironment') return localIntendedPurposeData.useEnvironment && localIntendedPurposeData.useEnvironment.length > 0;

      const fieldValue = localIntendedPurposeData[field as keyof IntendedPurposeData];
      return typeof fieldValue === 'string' && fieldValue.trim();
    }).length;
    return Math.round((completedFields / categoryFields.length) * 100);
  }, [localIntendedPurposeData, contraindications, intendedUsers]);

  const statementOfUseCompletion = calculateCategoryCompletion(['clinicalPurpose', 'indications']);
  const contextOfUseCompletion = calculateCategoryCompletion(['targetPopulation', 'intendedUsers', 'durationOfUse', 'useEnvironment']);
  const safetyUsageCompletion = calculateCategoryCompletion(['contraindications', 'warnings']);

  const sectionProgress = Math.round((statementOfUseCompletion * 0.4 + contextOfUseCompletion * 0.35 + safetyUsageCompletion * 0.25));

  // Get save status icon for a field
  const getSaveStatusIcon = (field: string) => {
    const isSaving = savingStates.has(field);
    const hasContent = hasFieldContent(field as keyof IntendedPurposeData);
    
    const statusIcon = isSaving ? (
      <Clock className="h-4 w-4 text-orange-500 animate-pulse" />
    ) : hasContent ? (
      <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
        <Check className="h-4 w-4 text-green-600 font-semibold" />
      </div>
    ) : null;

    return (
      <div className="flex items-center gap-2">
        {hasModel && onFieldScopeChange && (
          <CompactScopeToggle
            scopeView={fieldScopes[field] || 'product_family'}
            onScopeChange={(scope) => onFieldScopeChange(field, scope)}
          />
        )}
        {statusIcon}
      </div>
    );
  };

  // Cleanup debounced functions on unmount
  useEffect(() => {
    return () => {
      debouncedUpdateRef.current.forEach(debouncedFn => {
        if (debouncedFn.cancel) {
          debouncedFn.cancel();
        }
      });
      debouncedUpdateRef.current.clear();

      timeoutRefs.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutRefs.current.clear();
    };
  }, []);

  return (
    <Card>
      <div className="space-y-1">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2" style={{
                marginLeft: '5px'
              }}>
                <h2 className="text-md font-semibold">Device Purpose & Context</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CircularProgress percentage={sectionProgress} size={40} />
                  {/* <span>{sectionProgress}% complete</span>
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{
                width: `${sectionProgress}%`
              }}></div>
            </div> */}
                </div>
              </div>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <GovernanceBookmark
                status={governanceStatus}
                designReviewId={governanceDesignReviewId}
                verdictComment={governanceVerdictComment}
                approvedAt={governanceApprovedAt}
                productId={productId}
                sectionLabel="Device Purpose & Context"
              />
            </div>
          </CardTitle>

        </CardHeader>

        <CardContent className="space-y-4" style={{
          marginTop: '-15px'
        }}>
          <Accordion type="multiple" className="space-y-1">
            {/* Category 1: Statement of Use */}
            <AccordionItem value="statement-of-use" className="border-0 ">
              <AccordionTrigger className="hover:no-underline py-4 px-6 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200  rounded-t-lg">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    1
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-base font-semibold text-slate-800">Statement of Use</h3>
                  </div>
                  <Badge variant="outline" className="bg-slate-50 border-slate-300 text-slate-700 text-xs">
                    {statementOfUseCompletion}% Complete
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t-0 rounded-b-lg p-6 mt-3">
                <div className="space-y-4">
                  {/* Clinical Purpose */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="clinicalPurpose" className="text-sm font-medium flex items-center gap-3">
                        Intended Use (The Why)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80">State the general, high-level medical purpose of the device. This should be a concise summary of why the device exists and what it is meant to achieve in a clinical or user context.</p>
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
                                 disabled={isAiLoading('intended_use') || isAiButtonDisabled('intended_use')}
                                 onClick={async () => {
                                   if (!onAcceptAISuggestion || !companyId || isAiLoading('intended_use')) return;

                                   setAiLoading('intended_use', true);
                                   try {
                                     const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                                       productName || 'Current Medical Device',
                                       'Intended Use (The Why)',
                                       'State the general, high-level medical purpose of the device. This should be a concise summary of why the device exists and what it is meant to achieve in a clinical or user context.',
                                       localIntendedPurposeData.clinicalPurpose || '',
                                       'intended_use',
                                       companyId
                                     );

                                     if (response.success && response.suggestions?.[0]) {
                                       const suggestion = response.suggestions[0].suggestion;
                                       handleTextFieldChange('clinicalPurpose', suggestion);
                                       onAcceptAISuggestion('intended_use', suggestion);
                                     }
                                   } catch (error) {
                                     console.error('AI suggestion error:', error);
                                   } finally {
                                     setAiLoading('intended_use', false);
                                   }
                                 }}
                               >
                                 {isAiLoading('intended_use') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                               </Button>
                            </TooltipTrigger>
                            <TooltipContent>AI Suggestion</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      {getSaveStatusIcon('clinicalPurpose')}
                    </div>
                    <Textarea
                      id="clinicalPurpose"
                      placeholder="Example: To provide an accessible method for individuals to monitor key cardiovascular health indicators and identify potential irregularities for further medical consultation."
                      value={localIntendedPurposeData.clinicalPurpose || ''}
                      onChange={e => handleTextFieldChange('clinicalPurpose', e.target.value)}
                      className="min-h-[80px]"
                      disabled={isLoading}
                    />
                    <AIFieldButton
                      fieldType="intended_use"
                      currentValue={localIntendedPurposeData.clinicalPurpose || ''}
                      suggestions={aiSuggestions}
                      onAcceptSuggestion={(suggestion) => {
                        handleTextFieldChange('clinicalPurpose', suggestion);
                        onAcceptAISuggestion?.('intended_use', suggestion);
                      }}
                      className="mt-2"
                    />
                  </div>

                  {/* Indications */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="indications" className="text-sm font-medium flex items-center gap-2">
                        Intended Function / Indications (The What and for What)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80">Be specific. Describe what the device does (its function) and the specific disease, condition, or patient parameter it is intended to diagnose, treat, monitor, or screen for (its indication).</p>
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
                                 disabled={isAiLoading('intended_function') || isAiButtonDisabled('intended_function')}
                                 onClick={async () => {
                                   if (!onAcceptAISuggestion || !companyId || isAiLoading('intended_function')) return;

                                   setAiLoading('intended_function', true);
                                   try {
                                     const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                                       productName || 'Current Medical Device',
                                       'Intended Function / Indications (The What and for What)',
                                       'Be specific. Describe what the device does (its function) and the specific disease, condition, or patient parameter it is intended to diagnose, treat, monitor, or screen for (its indication).',
                                       localIntendedPurposeData.indications || '',
                                       'intended_function',
                                       companyId
                                     );

                                     if (response.success && response.suggestions?.[0]) {
                                       const suggestion = response.suggestions[0].suggestion;
                                       handleTextFieldChange('indications', suggestion);
                                       onAcceptAISuggestion('intended_function', suggestion);
                                     }
                                   } catch (error) {
                                     console.error('AI suggestion error:', error);
                                   } finally {
                                     setAiLoading('intended_function', false);
                                   }
                                 }}
                               >
                                 {isAiLoading('intended_function') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                               </Button>
                            </TooltipTrigger>
                            <TooltipContent>AI Suggestion</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      {getSaveStatusIcon('indications')}
                    </div>
                    <Textarea
                      id="indications"
                      placeholder="Example: The device functions by capturing a single-lead electrocardiogram (ECG) and analyzing the rhythm for the presence of atrial fibrillation (AFib). It is indicated for use in the detection of potential AFib in adults who have not previously been diagnosed with the condition."
                      value={localIntendedPurposeData.indications || ''}
                      onChange={e => handleTextFieldChange('indications', e.target.value)}
                      className="min-h-[80px]"
                      disabled={isLoading}
                    />
                    <AIFieldButton
                      fieldType="intended_function"
                      currentValue={localIntendedPurposeData.indications || ''}
                      suggestions={aiSuggestions}
                      onAcceptSuggestion={(suggestion) => {
                        handleTextFieldChange('indications', suggestion);
                        onAcceptAISuggestion?.('intended_function', suggestion);
                      }}
                      className="mt-2"
                    />
                  </div>

                  {/* Principles of Operation — MDR Annex II 1.1.d */}
                  <div className={`space-y-2 ${isGapFlow ? `p-3 rounded-lg transition-colors ${localIntendedPurposeData.principles_of_operation?.trim() ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}`} id="principles-of-operation">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="principles_of_operation" className="text-sm font-medium flex items-center gap-2">
                        Principles of Operation
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80">Describe how the device technically achieves its intended function (e.g., electrical stimulation, optical sensing, mechanical compression). Required per MDR Annex II, Section 1.1(d).</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      {getSaveStatusIcon('principles_of_operation')}
                    </div>
                    <Textarea
                      id="principles_of_operation"
                      placeholder="Example: The device operates on the principle of photoplethysmography (PPG), emitting green LED light into the skin and measuring reflected light variations caused by blood volume changes in the microvasculature."
                      value={localIntendedPurposeData.principles_of_operation || ''}
                      onChange={e => handleTextFieldChange('principles_of_operation', e.target.value)}
                      className="min-h-[80px]"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Mode of Action */}
                  <div className={`space-y-2 ${isGapFlow ? `p-3 rounded-lg transition-colors ${localIntendedPurposeData.modeOfAction?.trim() ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}`}>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="modeOfAction" className="text-sm font-medium flex items-center gap-2">
                        Mode of Action (The How)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80">Explain the technical or physiological mechanism by which the device achieves its intended function. This is often required for novel technologies or devices with a complex mechanism.</p>
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
                                 disabled={isAiLoading('modeOfAction') || isAiButtonDisabled('modeOfAction')}
                                 onClick={async () => {
                                   if (!onAcceptAISuggestion || !companyId || isAiLoading('modeOfAction')) return;

                                   setAiLoading('modeOfAction', true);
                                   try {
                                     const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                                       productName || 'Current Medical Device',
                                       'Mode of Action (The How)',
                                       'Explain the technical or physiological mechanism by which the device achieves its intended function. This is often required for novel technologies or devices with a complex mechanism.',
                                       localIntendedPurposeData.modeOfAction || '',
                                       'modeOfAction',
                                       companyId
                                     );

                                     if (response.success && response.suggestions?.[0]) {
                                       const suggestion = response.suggestions[0].suggestion;
                                       handleTextFieldChange('modeOfAction', suggestion);
                                       onAcceptAISuggestion('modeOfAction', suggestion);
                                     }
                                   } catch (error) {
                                     console.error('AI suggestion error:', error);
                                   } finally {
                                     setAiLoading('modeOfAction', false);
                                   }
                                 }}
                               >
                                 {isAiLoading('modeOfAction') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                               </Button>
                            </TooltipTrigger>
                            <TooltipContent>AI Suggestion</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      {getSaveStatusIcon('modeOfAction')}
                    </div>
                    <Textarea
                      id="modeOfAction"
                      placeholder="Example: The device uses photoplethysmography (PPG) to detect blood volume changes in peripheral circulation as a pulse waveform, then applies proprietary algorithms to analyze pulse irregularities characteristic of AFib."
                      value={localIntendedPurposeData.modeOfAction || ''}
                      onChange={e => handleTextFieldChange('modeOfAction', e.target.value)}
                      className="min-h-[80px]"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Category 2: Context of Use */}
            <AccordionItem value="context-of-use" className="border-0 mt-2">
              <AccordionTrigger className="bg-gradient-to-r mt-3 py-4 px-6 from-gray-50 to-gray-100 border border-gray-200 rounded-lg  hover:no-underline hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-150">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    2
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-base font-semibold text-gray-800">Context of Use</h3>
                  </div>
                  <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-700 text-xs">
                    {contextOfUseCompletion}% Complete
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t-0 rounded-b-lg p-6 mt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Target Population */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="targetPopulation" className="text-sm font-medium flex items-center gap-2">
                        Intended Patient Population (On Whom)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80">Define the specific patient population for whom the device is intended. Include relevant demographics, conditions, or exclusions that define your target users.</p>
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
                                disabled={isAiLoading('target_population') || isAiButtonDisabled('target_population')}
                                onClick={async () => {
                                  if (!onAcceptAISuggestion || !companyId || isAiLoading('target_population')) return;

                                  setAiLoading('target_population', true);
                                  try {
                                    const currentPopulation = localIntendedPurposeData.targetPopulation || [];
                                    const availableOptions = predefinedPatients.filter(option => 
                                      option !== 'Other' && !currentPopulation.includes(option)
                                    );

                                    if (availableOptions.length === 0) {
                                      setAiLoading('target_population', false);
                                      return;
                                    }

                                    const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                                      productName || 'Current Medical Device',
                                      'Intended Patient Population (On Whom)',
                                      `Select the most appropriate patient population from these predefined options: ${availableOptions.join(', ')}. Choose the option that best matches the device's intended use.`,
                                      currentPopulation.join(', '),
                                      'target_population',
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
                                        handleImmediateFieldChange('targetPopulation', [...currentPopulation, matchedOption]);
                                      }
                                    }
                                  } catch (error) {
                                    console.error('AI suggestion error:', error);
                                  } finally {
                                    setAiLoading('target_population', false);
                                  }
                                }}
                              >
                                {isAiLoading('target_population') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>AI Suggestion</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      {getSaveStatusIcon('targetPopulation')}
                    </div>
                    {/* Selected Patient Population Display */}
                    <div className="flex flex-wrap gap-2">
                      {(localIntendedPurposeData.targetPopulation || []).map((patient, index) => (
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

                    {/* Patient Population Selection Dropdown */}
                    <Popover open={isPatientDropdownOpen} onOpenChange={setIsPatientDropdownOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                          disabled={isLoading}
                        >
                          <span>Select patient population</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isPatientDropdownOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search patient types..." />
                          <CommandList>
                            <CommandEmpty>No patient type found.</CommandEmpty>
                            <CommandGroup>
                              {predefinedPatients.map((patient) => (
                                <CommandItem
                                  key={patient}
                                  value={patient}
                                  onSelect={() => {
                                    handleSelectPatient(patient);
                                    // Keep dropdown open for multi-selection
                                  }}
                                  disabled={(localIntendedPurposeData.targetPopulation || []).includes(patient) && patient !== 'Other'}
                                  className="cursor-pointer"
                                >
                                  {patient}
                                  {(localIntendedPurposeData.targetPopulation || []).includes(patient) && patient !== 'Other' && (
                                    <span className="ml-2 text-xs text-muted-foreground">(Selected)</span>
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                          {(localIntendedPurposeData.targetPopulation || []).length > 0 && (
                            <div className="border-t p-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleImmediateFieldChange('targetPopulation', []);
                                }}
                                className="w-full"
                              >
                                Clear All
                              </Button>
                            </div>
                          )}
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Other Patient Input */}
                    {showOtherPatientInput && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Specify other patient population"
                          value={otherPatientText}
                          onChange={(e) => setOtherPatientText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddOtherPatient();
                            }
                            if (e.key === 'Escape') {
                              setShowOtherPatientInput(false);
                              setOtherPatientText('');
                            }
                          }}
                          disabled={isLoading}
                        />
                        <Button
                          onClick={handleAddOtherPatient}
                          disabled={!otherPatientText.trim() || isLoading}
                          variant="secondary"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowOtherPatientInput(false);
                            setOtherPatientText('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* User Profile */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="userProfile" className="text-sm font-medium flex items-center gap-2">
                        Intended User (By Whom)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80">Specify who will operate the device. Is it for healthcare professionals, patients themselves, or caregivers? Include any required training or expertise.</p>
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
                                disabled={isAiLoading('intended_user') || isAiButtonDisabled('intended_user')}
                                onClick={async () => {
                                  if (!onAcceptAISuggestion || !companyId || isAiLoading('intended_user')) return;

                                  setAiLoading('intended_user', true);
                                  try {
                                    const availableOptions = predefinedUsers.filter(option => 
                                      option !== 'Other' && !intendedUsers.includes(option)
                                    );

                                    if (availableOptions.length === 0) {
                                      setAiLoading('intended_user', false);
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
                                    setAiLoading('intended_user', false);
                                  }
                                }}
                              >
                                {isAiLoading('intended_user') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>AI Suggestion</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      {getSaveStatusIcon('userProfile')}
                    </div>
                    {/* Selected Users Display */}
                    <div className="flex flex-wrap gap-2">
                      {intendedUsers.map((user, index) => (
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

                    {/* User Selection Dropdown */}
                    <Popover open={isUserDropdownOpen} onOpenChange={setIsUserDropdownOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                          disabled={isLoading}
                        >
                          <span>Select intended users</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search user types..." />
                          <CommandList>
                            <CommandEmpty>No user type found.</CommandEmpty>
                            <CommandGroup>
                              {predefinedUsers.map((user) => (
                                <CommandItem
                                  key={user}
                                  value={user}
                                  onSelect={() => {
                                    handleSelectUser(user);
                                    // Keep dropdown open for multi-selection
                                  }}
                                  disabled={intendedUsers.includes(user) && user !== 'Other'}
                                  className="cursor-pointer"
                                >
                                  {user}
                                  {intendedUsers.includes(user) && user !== 'Other' && (
                                    <span className="ml-2 text-xs text-muted-foreground">(Selected)</span>
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                          {intendedUsers.length > 0 && (
                            <div className="border-t p-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  onIntendedUsersChange?.([]);
                                }}
                                className="w-full"
                              >
                                Clear All
                              </Button>
                            </div>
                          )}
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Other User Input */}
                    {showOtherUserInput && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Specify other user type"
                          value={otherUserText}
                          onChange={(e) => setOtherUserText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddOtherUser();
                            }
                            if (e.key === 'Escape') {
                              setShowOtherUserInput(false);
                              setOtherUserText('');
                            }
                          }}
                          disabled={isLoading}
                        />
                        <Button
                          onClick={handleAddOtherUser}
                          disabled={!otherUserText.trim() || isLoading}
                          variant="secondary"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowOtherUserInput(false);
                            setOtherUserText('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Duration of Use */}
                  <div className="space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="durationOfUse" className="text-sm font-medium flex items-center gap-2">
                        Duration of Use (How Long)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80">Specify how long the device is intended to be used. Is it for single use, short-term monitoring, or long-term therapy?</p>
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
                                disabled={isAiLoading('duration_of_use') || isAiButtonDisabled('duration_of_use')}
                                onClick={async () => {
                                  if (!onAcceptAISuggestion || !companyId || isAiLoading('duration_of_use')) return;

                                  setAiLoading('duration_of_use', true);
                                  try {
                                    const durationOptions = [
                                      'transient',
                                      'short_term', 
                                      'long_term'
                                    ];

                                    const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                                      productName || 'Current Medical Device',
                                      'Duration of Use (How Long)',
                                      `Select the most appropriate duration from these predefined options: Transient (less than 60 minutes), Short term (60 minutes to 30 days), Long term (more than 30 days). Choose based on how long the device is intended to be used.`,
                                      localIntendedPurposeData.durationOfUse || '',
                                      'duration_of_use',
                                      companyId,
                                      `Select exactly one option from this list: transient, short_term, long_term. Return only the exact value from the list.`
                                    );

                                    if (response.success && response.suggestions?.[0]) {
                                      const suggestion = response.suggestions[0].suggestion.trim().toLowerCase();
                                      
                                      // Find the best match from predefined options
                                      const matchedOption = durationOptions.find(option => 
                                        option === suggestion || 
                                        option.includes(suggestion) ||
                                        suggestion.includes(option)
                                      );
                                      
                                      if (matchedOption) {
                                        handleImmediateFieldChange('durationOfUse', matchedOption);
                                      }
                                    }
                                  } catch (error) {
                                    console.error('AI suggestion error:', error);
                                  } finally {
                                    setAiLoading('duration_of_use', false);
                                  }
                                }}
                              >
                                {isAiLoading('duration_of_use') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>AI Suggestion</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      {getSaveStatusIcon('durationOfUse')}
                    </div>
                    <Select
                      value={localIntendedPurposeData.durationOfUse || ''}
                      onValueChange={value => handleImmediateFieldChange('durationOfUse', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration of use" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transient">Transient: Normally intended for continuous use for less than 60 minutes</SelectItem>
                        <SelectItem value="short_term">Short term: Normally intended for continuous use for between 60 minutes and 30 days</SelectItem>
                        <SelectItem value="long_term">Long term: Normally intended for continuous use for more than 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Environment of Use */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="useEnvironment" className="text-sm font-medium flex items-center gap-2">
                        Environment of Use (The Where)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80">Describe where the device will be used. Is it for hospital use, home care, ambulatory settings, or emergency situations?</p>
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
                                disabled={isAiLoading('use_environment') || isAiButtonDisabled('use_environment')}
                                onClick={async () => {
                                  if (!onAcceptAISuggestion || !companyId || isAiLoading('use_environment')) return;

                                  setAiLoading('use_environment', true);
                                  try {
                                    const currentEnvironment = localIntendedPurposeData.useEnvironment || [];
                                    const availableOptions = predefinedEnvironments.filter(option => 
                                      option !== 'Other' && !currentEnvironment.includes(option)
                                    );

                                    if (availableOptions.length === 0) {
                                      setAiLoading('use_environment', false);
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
                                    setAiLoading('use_environment', false);
                                  }
                                }}
                              >
                                {isAiLoading('use_environment') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>AI Suggestion</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      {getSaveStatusIcon('useEnvironment')}
                    </div>
                    {/* Selected Environment Display */}
                    <div className="flex flex-wrap gap-2">
                      {(localIntendedPurposeData.useEnvironment || []).map((environment, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-2 min-h-[2rem]">
                          {environment}
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

                    {/* Environment Selection Dropdown */}
                    <Popover open={isEnvironmentDropdownOpen} onOpenChange={setIsEnvironmentDropdownOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                          disabled={isLoading}
                        >
                          <span>Select environment of use</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isEnvironmentDropdownOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search environments..." />
                          <CommandList>
                            <CommandEmpty>No environment found.</CommandEmpty>
                            <CommandGroup>
                              {predefinedEnvironments.map((environment) => (
                                <CommandItem
                                  key={environment}
                                  value={environment}
                                  onSelect={() => {
                                    handleSelectEnvironment(environment);
                                    // Keep dropdown open for multi-selection
                                  }}
                                  disabled={(localIntendedPurposeData.useEnvironment || []).includes(environment) && environment !== 'Other'}
                                  className="cursor-pointer"
                                >
                                  {environment}
                                  {(localIntendedPurposeData.useEnvironment || []).includes(environment) && environment !== 'Other' && (
                                    <span className="ml-2 text-xs text-muted-foreground">(Selected)</span>
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                          {(localIntendedPurposeData.useEnvironment || []).length > 0 && (
                            <div className="border-t p-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleImmediateFieldChange('useEnvironment', []);
                                }}
                                className="w-full"
                              >
                                Clear All
                              </Button>
                            </div>
                          )}
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Other Environment Input */}
                    {showOtherEnvironmentInput && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Specify other environment"
                          value={otherEnvironmentText}
                          onChange={(e) => setOtherEnvironmentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddOtherEnvironment();
                            }
                            if (e.key === 'Escape') {
                              setShowOtherEnvironmentInput(false);
                              setOtherEnvironmentText('');
                            }
                          }}
                          disabled={isLoading}
                        />
                        <Button
                          onClick={handleAddOtherEnvironment}
                          disabled={!otherEnvironmentText.trim() || isLoading}
                          variant="secondary"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowOtherEnvironmentInput(false);
                            setOtherEnvironmentText('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Category 3: Safety & Usage Information */}
            <AccordionItem value="safety-usage" className="border-0">
              <AccordionTrigger className="bg-gradient-to-r  mt-3 py-4 px-6 from-stone-50 to-stone-100 border border-stone-200 rounded-lg  hover:no-underline hover:bg-gradient-to-r hover:from-stone-100 hover:to-stone-150">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 bg-stone-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    3
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-base font-semibold text-stone-800">Safety & Usage Information</h3>
                  </div>
                  <Badge variant="outline" className="bg-stone-50 border-stone-300 text-stone-700 text-xs">
                    {safetyUsageCompletion}% Complete
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t-0 rounded-b-lg p-6 mt-3">
                <div className="space-y-6">
                  {/* Contraindications */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        Contraindications
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80">List conditions, situations, or patient characteristics where the device should NOT be used due to safety concerns.</p>
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
                                disabled={isAiLoading('contraindications') || isAiButtonDisabled('contraindications')}
                                onClick={async () => {
                                  if (!onAcceptAISuggestion || !companyId || isAiLoading('contraindications')) return;

                                  setAiLoading('contraindications', true);
                                  try {
                                    const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                                      productName || 'Current Medical Device',
                                      'Contraindications',
                                      'List conditions, situations, or patient characteristics where the device should NOT be used due to safety concerns.',
                                      '',
                                      'contraindications',
                                      companyId,
                                      'Provide 1 specific contraindication. Use clear, medical terminology. Focus on safety-critical conditions With maximum 5-8 words. (don\'t use *, "", :, etc.)'
                                    );

                                    if (response.success && response.suggestions?.[0]) {
                                      const suggestion = response.suggestions[0].suggestion;
                                      
                                      const trimmedValue = suggestion
                                        .replace(/^[\d\s•*\-\.:]+\s*/, '')
                                        .replace(/["']/g, '')
                                        .replace(/[^\w\s\-]/g, '')
                                        .trim();
                                      
                                      if (trimmedValue) {
                                        setNewContraindication(trimmedValue);
                                      }
                                    }
                                  } catch (error) {
                                    console.error('AI suggestion error:', error);
                                  } finally {
                                    setAiLoading('contraindications', false);
                                  }
                                }}
                              >
                                {isAiLoading('contraindications') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>AI Suggestion</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add contraindication"
                        value={newContraindication}
                        onChange={e => setNewContraindication(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleAddContraindication()}
                        disabled={isLoading}
                      />
                      <Button onClick={handleAddContraindication} disabled={isLoading || !newContraindication.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="divide-y divide-border rounded-md border">
                      {contraindications.map((item, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                          <span className="flex-1">{index + 1}. {item}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveContraindication(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {contraindications.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground italic">No items added yet</div>
                      )}
                    </div>
                  </div>

                  {/* Warnings & Precautions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        Warnings & Precautions
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80">List important safety warnings and precautions that users should be aware of when using the device.</p>
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
                                disabled={isAiLoading('warnings') || isAiButtonDisabled('warnings')}
                                onClick={async () => {
                                  if (!onAcceptAISuggestion || !companyId || isAiLoading('warnings')) return;

                                  setAiLoading('warnings', true);
                                  try {
                                    const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                                      productName || 'Current Medical Device',
                                      'Warnings & Precautions',
                                      'List important safety warnings and precautions that users should be aware of when using the device.',
                                      '',
                                      'warnings',
                                      companyId,
                                      'Provide 1 specific warning or precaution. Use clear, medical terminology. Focus on safety-critical warnings With maximum 5-8 words. (don\'t use *, "", :, etc.)'
                                    );

                                    if (response.success && response.suggestions?.[0]) {
                                      const suggestion = response.suggestions[0].suggestion;
                                      
                                      const trimmedValue = suggestion
                                        .replace(/^[\d\s•*\-\.:]+\s*/, '')
                                        .replace(/["']/g, '')
                                        .replace(/[^\w\s\-]/g, '')
                                        .trim();
                                      
                                      if (trimmedValue) {
                                        setNewWarning(trimmedValue);
                                      }
                                    }
                                  } catch (error) {
                                    console.error('AI suggestion error:', error);
                                  } finally {
                                    setAiLoading('warnings', false);
                                  }
                                }}
                              >
                                {isAiLoading('warnings') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>AI Suggestion</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      {getSaveStatusIcon('warnings')}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add warning or precaution"
                        value={newWarning}
                        onChange={e => setNewWarning(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleAddWarning()}
                        disabled={isLoading}
                      />
                      <Button onClick={handleAddWarning} disabled={isLoading || !newWarning.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="divide-y divide-border rounded-md border">
                      {(localIntendedPurposeData.warnings || []).map((item, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                          <span className="flex-1">{index + 1}. {item}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveWarning(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {(localIntendedPurposeData.warnings || []).length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground italic">No items added yet</div>
                      )}
                    </div>
                  </div>

                  {/* Clinical Benefits */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        Clinical Benefits - Optional
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80">List the key clinical benefits or outcomes that the device provides to patients or healthcare providers.</p>
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
                                disabled={isAiLoading('clinical_benefits') || isAiButtonDisabled('clinical_benefits')}
                                onClick={async () => {
                                  if (!onAcceptAISuggestion || !companyId || isAiLoading('clinical_benefits')) return;

                                  setAiLoading('clinical_benefits', true);
                                  try {
                                    const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                                      productName || 'Current Medical Device',
                                      'Clinical Benefits',
                                      'List the key clinical benefits or outcomes that the device provides to patients or healthcare providers.',
                                      '',
                                      'clinical_benefits',
                                      companyId,
                                      'Provide 1 specific clinical benefit. Use clear, medical terminology. Focus on patient outcomes With maximum 5-8 words. (don\'t use *, "", :, etc.)'
                                    );

                                    if (response.success && response.suggestions?.[0]) {
                                      const suggestion = response.suggestions[0].suggestion;
                                      
                                      const trimmedValue = suggestion
                                        .replace(/^[\d\s•*\-\.:]+\s*/, '')
                                        .replace(/["']/g, '')
                                        .replace(/[^\w\s\-]/g, '')
                                        .trim();
                                      
                                      if (trimmedValue) {
                                        setNewBenefit(trimmedValue);
                                      }
                                    }
                                  } catch (error) {
                                    console.error('AI suggestion error:', error);
                                  } finally {
                                    setAiLoading('clinical_benefits', false);
                                  }
                                }}
                              >
                                {isAiLoading('clinical_benefits') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>AI Suggestion</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add clinical benefit"
                        value={newBenefit}
                        onChange={e => setNewBenefit(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleAddBenefit()}
                        disabled={isLoading}
                      />
                      <Button onClick={handleAddBenefit} disabled={isLoading || !newBenefit.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="divide-y divide-border rounded-md border">
                      {clinicalBenefits.map((item, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                          <span className="flex-1">{index + 1}. {item}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveBenefit(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {clinicalBenefits.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground italic">No items added yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Additional Sections */}
            <AccordionItem value="additional-info" className="border-0">
              <AccordionTrigger className="bg-gradient-to-r mt-3 py-4 px-6 from-gray-50 to-gray-100 border border-gray-200 rounded-lg  hover:no-underline hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-150">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    +
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-base font-semibold text-gray-900">Additional Information</h3>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t-0 rounded-b-lg p-6 mt-3">
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  {/* User Instructions */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      User Instructions
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                              <Button
                                variant="ghost"
                                size="sm"
                                className='hover:bg-transparent'
                                disabled={isAiLoading(`user_instructions_${activeUserInstructionTab}`) || isAiButtonDisabled(`user_instructions_${activeUserInstructionTab}`)}
                                onClick={async () => {
                                if (!onAcceptAISuggestion || !companyId || isAiLoading(`user_instructions_${activeUserInstructionTab}`)) return;

                                setAiLoading(`user_instructions_${activeUserInstructionTab}`, true);
                                try {
                                  const fieldLabels = {
                                    'how_to_use': 'How to Use',
                                    'charging': 'Charging Instructions',
                                    'maintenance': 'Maintenance Instructions'
                                  };

                                  const fieldDescriptions = {
                                    'how_to_use': 'Describe how to use the device, including step-by-step instructions for proper operation.',
                                    'charging': 'Describe charging instructions, including battery care, charging procedures, and power management.',
                                    'maintenance': 'Describe maintenance instructions, including cleaning, storage, and routine care procedures.'
                                  };

                                  const requirements = {
                                    'how_to_use': 'Provide clear, step-by-step instructions for device operation. Use simple, user-friendly language. Focus on safety and proper usage. (don\'t use *, "", :, etc. but use 1-2 sentences)',
                                    'charging': 'Provide specific charging instructions including battery care, charging procedures, and power management tips. (don\'t use *, "", :, etc. but use 1-2 sentences)',
                                    'maintenance': 'Provide maintenance instructions including cleaning procedures, storage guidelines, and routine care steps. (don\'t use *, "", :, etc. but use 1-2 sentences)'
                                  };

                                  const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                                    productName || 'Current Medical Device',
                                    fieldLabels[activeUserInstructionTab as keyof typeof fieldLabels],
                                    fieldDescriptions[activeUserInstructionTab as keyof typeof fieldDescriptions],
                                    userInstructions[activeUserInstructionTab as keyof UserInstructions] || '',
                                    `user_instructions_${activeUserInstructionTab}`,
                                    companyId,
                                    requirements[activeUserInstructionTab as keyof typeof requirements]
                                  );

                                  if (response.success && response.suggestions?.[0]) {
                                    const suggestion = response.suggestions[0].suggestion;
                                    handleInstructionChange(activeUserInstructionTab as keyof UserInstructions, suggestion);
                                    onAcceptAISuggestion(`user_instructions_${activeUserInstructionTab}`, suggestion);
                                  }
                                } catch (error) {
                                  console.error('AI suggestion error:', error);
                                } finally {
                                  setAiLoading(`user_instructions_${activeUserInstructionTab}`, false);
                                }
                              }}
                            >
                              {isAiLoading(`user_instructions_${activeUserInstructionTab}`) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>AI Suggestion for {activeUserInstructionTab === 'how_to_use' ? 'How to Use' : activeUserInstructionTab === 'charging' ? 'Charging' : 'Maintenance'}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Tabs defaultValue="how_to_use" className="w-full" onValueChange={setActiveUserInstructionTab}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="how_to_use">How to Use</TabsTrigger>
                        <TabsTrigger value="charging">Charging</TabsTrigger>
                        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                      </TabsList>
                      <TabsContent value="how_to_use" className="mt-3">
                        <Textarea
                          placeholder="Describe how to use the device..."
                          value={userInstructions.how_to_use || ''}
                          onChange={e => handleInstructionChange('how_to_use', e.target.value)}
                          className="min-h-[180px]"
                          disabled={isLoading}
                        />
                      </TabsContent>
                      <TabsContent value="charging" className="mt-3">
                        <Textarea
                          placeholder="Describe charging instructions..."
                          value={userInstructions.charging || ''}
                          onChange={e => handleInstructionChange('charging', e.target.value)}
                          className="min-h-[80px]"
                          disabled={isLoading}
                        />
                      </TabsContent>
                      <TabsContent value="maintenance" className="mt-3">
                        <Textarea
                          placeholder="Describe maintenance instructions..."
                          value={userInstructions.maintenance || ''}
                          onChange={e => handleInstructionChange('maintenance', e.target.value)}
                          className="min-h-[80px]"
                          disabled={isLoading}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </div>
    </Card>
  );
}