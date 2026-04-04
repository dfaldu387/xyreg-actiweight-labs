
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { TabHeader } from "./TabHeader";
import { AISuggestionButton } from "./ai-assistant/AISuggestionButton";
import { FieldSuggestion } from "@/services/productDefinitionAIService";

interface IntendedPurposeSectionProps {
  intendedUse?: string;
  onIntendedUseChange: (value: string) => void;
  isLoading?: boolean;
  // New props for extended purpose information
  intendedFunction?: string;
  onIntendedFunctionChange?: (value: string) => void;
  modeOfAction?: string;
  onModeOfActionChange?: (value: string) => void;
  intendedPatientPopulation?: string;
  onIntendedPatientPopulationChange?: (value: string) => void;
  intendedUser?: string;
  onIntendedUserChange?: (value: string) => void;
  durationOfUse?: string;
  onDurationOfUseChange?: (value: string) => void;
  environmentOfUse?: string;
  onEnvironmentOfUseChange?: (value: string) => void;
  contraindications?: string;
  onContraindicationsChange?: (value: string) => void;
  warningsPrecautions?: string;
  onWarningsPrecautionsChange?: (value: string) => void;
  clinicalBenefits?: string;
  onClinicalBenefitsChange?: (value: string) => void;
  // AI suggestions props
  aiSuggestions?: FieldSuggestion[];
  onAcceptAISuggestion?: (fieldType: string, suggestion: string) => void;
}

const DURATION_OPTIONS = [
  { value: 'transient', label: 'Transient: Less than 60 minutes', description: 'Normally intended for continuous use for less than 60 minutes (EU MDR Annex VIII)' },
  { value: 'short_term', label: 'Short-Term: 60 minutes to 30 days', description: 'Normally intended for continuous use for between 60 minutes and 30 days (EU MDR Annex VIII)' },
  { value: 'long_term', label: 'Long-Term: More than 30 days', description: 'Normally intended for continuous use for more than 30 days (EU MDR Annex VIII)' }
];

const ENVIRONMENT_OPTIONS = [
  "Hospital/Clinical setting",
  "Home use",
  "Emergency/Ambulance",
  "Laboratory",
  "Point-of-care",
  "Self-testing"
];

export function IntendedPurposeSection({
  intendedUse = '',
  onIntendedUseChange,
  intendedFunction = '',
  onIntendedFunctionChange,
  modeOfAction = '',
  onModeOfActionChange,
  intendedPatientPopulation = '',
  onIntendedPatientPopulationChange,
  intendedUser = '',
  onIntendedUserChange,
  durationOfUse = '',
  onDurationOfUseChange,
  environmentOfUse = '',
  onEnvironmentOfUseChange,
  contraindications = '',
  onContraindicationsChange,
  warningsPrecautions = '',
  onWarningsPrecautionsChange,
  clinicalBenefits = '',
  onClinicalBenefitsChange,
  isLoading = false,
  aiSuggestions = [],
  onAcceptAISuggestion
}: IntendedPurposeSectionProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['statement', 'context', 'safety']));

  // Calculate completion percentages for each category
  const statementOfUseCompletion = useMemo(() => {
    let completed = 0;
    let total = 2; // intendedUse and intendedFunction are required
    
    if (intendedUse?.trim()) completed++;
    if (intendedFunction?.trim()) completed++;
    if (modeOfAction?.trim()) completed += 0.5; // Optional field, worth half
    
    return Math.round((completed / (total + 0.5)) * 100);
  }, [intendedUse, intendedFunction, modeOfAction]);

  const contextOfUseCompletion = useMemo(() => {
    let completed = 0;
    const total = 4;
    
    if (intendedPatientPopulation?.trim()) completed++;
    if (intendedUser?.trim()) completed++;
    if (durationOfUse?.trim()) completed++;
    if (environmentOfUse?.trim()) completed++;
    
    return Math.round((completed / total) * 100);
  }, [intendedPatientPopulation, intendedUser, durationOfUse, environmentOfUse]);

  const safetyInfoCompletion = useMemo(() => {
    let completed = 0;
    let total = 1; // contraindications is required
    
    if (contraindications?.trim()) completed++;
    if (warningsPrecautions?.trim()) completed += 0.5; // Optional
    if (clinicalBenefits?.trim()) completed += 0.5; // Optional
    
    return Math.round((completed / (total + 1)) * 100);
  }, [contraindications, warningsPrecautions, clinicalBenefits]);

  // Calculate overall completion
  const overallCompletion = useMemo(() => {
    const weightedScore = (statementOfUseCompletion * 0.4) + (contextOfUseCompletion * 0.35) + (safetyInfoCompletion * 0.25);
    return Math.round(weightedScore);
  }, [statementOfUseCompletion, contextOfUseCompletion, safetyInfoCompletion]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleFieldChange = (value: string, onChange?: (value: string) => void) => {
    if (onChange) {
      onChange(value);
      setSaveStatus('saving');
      setTimeout(() => setSaveStatus('saved'), 1000);
    }
  };

  const renderSaveStatus = () => {
    if (saveStatus === 'saving') {
      return <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />;
    }
    if (saveStatus === 'saved') {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <TabHeader
          title="Device Purpose & Context"
          completionPercentage={overallCompletion}
          isLoading={isLoading}
          saveStatus={saveStatus}
        />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Statement of Use Category */}
        <Collapsible
          open={expandedSections.has('statement')}
          onOpenChange={() => toggleSection('statement')}
        >
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 hover:from-blue-100 hover:to-blue-150 dark:hover:from-blue-900/40 dark:hover:to-blue-800/40 transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div className="text-left">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">Statement of Use</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">The Why, What, and How</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                  {statementOfUseCompletion}%
                </Badge>
                {expandedSections.has('statement') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-4">
            <div className="grid gap-4 pl-11">
              <div>
                <Label htmlFor="intended-use" className="text-sm font-medium">
                  Intended Use (The Why) <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="intended-use"
                  value={intendedUse}
                  onChange={(e) => handleFieldChange(e.target.value, onIntendedUseChange)}
                  placeholder="Describe the clinical purpose and intended use of this medical device..."
                  className="mt-2 min-h-[100px]"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Define the medical condition, disease, or clinical purpose the device addresses.
                </p>
                <AISuggestionButton
                  fieldType="intended_use"
                  currentValue={intendedUse}
                  suggestions={aiSuggestions}
                  onAcceptSuggestion={(suggestion) => onAcceptAISuggestion?.('intended_use', suggestion)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="intended-function" className="text-sm font-medium">
                  Intended Function/Indications (The What and for What) <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="intended-function"
                  value={intendedFunction}
                  onChange={(e) => handleFieldChange(e.target.value, onIntendedFunctionChange)}
                  placeholder="Describe the specific function and clinical indications..."
                  className="mt-2 min-h-[80px]"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Key regulatory field describing specific functions and clinical indications.
                </p>
                <AISuggestionButton
                  fieldType="intended_function"
                  currentValue={intendedFunction}
                  suggestions={aiSuggestions}
                  onAcceptSuggestion={(suggestion) => onAcceptAISuggestion?.('intended_function', suggestion)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="mode-of-action" className="text-sm font-medium">
                  Mode of Action (The How)
                </Label>
                <Textarea
                  id="mode-of-action"
                  value={modeOfAction}
                  onChange={(e) => handleFieldChange(e.target.value, onModeOfActionChange)}
                  placeholder="Describe how the device achieves its intended function..."
                  className="mt-2 min-h-[80px]"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Explain the mechanism by which the device works.
                </p>
                <AISuggestionButton
                  fieldType="mode_of_action"
                  currentValue={modeOfAction}
                  suggestions={aiSuggestions}
                  onAcceptSuggestion={(suggestion) => onAcceptAISuggestion?.('mode_of_action', suggestion)}
                  className="mt-2"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Context of Use Category */}
        <Collapsible
          open={expandedSections.has('context')}
          onOpenChange={() => toggleSection('context')}
        >
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 hover:from-green-100 hover:to-green-150 dark:hover:from-green-900/40 dark:hover:to-green-800/40 transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div className="text-left">
                  <h4 className="font-semibold text-green-900 dark:text-green-100">Context of Use</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">On Whom, By Whom, How Long, Where</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                  {contextOfUseCompletion}%
                </Badge>
                {expandedSections.has('context') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-2 pl-11">
              <div>
                <Label htmlFor="patient-population" className="text-sm font-medium">
                  Intended Patient Population (On Whom) <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="patient-population"
                  value={intendedPatientPopulation}
                  onChange={(e) => handleFieldChange(e.target.value, onIntendedPatientPopulationChange)}
                  placeholder="Define the target patient population..."
                  className="mt-2 min-h-[80px]"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Age groups, medical conditions, anatomical sites, etc.
                </p>
                <AISuggestionButton
                  fieldType="patient_population"
                  currentValue={intendedPatientPopulation}
                  suggestions={aiSuggestions}
                  onAcceptSuggestion={(suggestion) => onAcceptAISuggestion?.('patient_population', suggestion)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="intended-user" className="text-sm font-medium">
                  Intended User (By Whom) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="intended-user"
                  value={intendedUser}
                  onChange={(e) => handleFieldChange(e.target.value, onIntendedUserChange)}
                  placeholder="e.g., Healthcare professionals, Patients, Trained operators"
                  className="mt-2"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Who will operate or use the device?
                </p>
                <AISuggestionButton
                  fieldType="intended_user"
                  currentValue={intendedUser}
                  suggestions={aiSuggestions}
                  onAcceptSuggestion={(suggestion) => onAcceptAISuggestion?.('intended_user', suggestion)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="duration-of-use" className="text-sm font-medium">
                  Duration of Use (How Long) <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={durationOfUse} 
                  onValueChange={(value) => handleFieldChange(value, onDurationOfUseChange)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select duration of use" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  MDR-compliant duration of continuous use - critical for device classification.
                </p>
              </div>

              <div>
                <Label htmlFor="environment-of-use" className="text-sm font-medium">
                  Environment of Use (Where) <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={environmentOfUse} 
                  onValueChange={(value) => handleFieldChange(value, onEnvironmentOfUseChange)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENVIRONMENT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Where will the device be used?
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Safety & Usage Information Category */}
        <Collapsible
          open={expandedSections.has('safety')}
          onOpenChange={() => toggleSection('safety')}
        >
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 hover:from-orange-100 hover:to-orange-150 dark:hover:from-orange-900/40 dark:hover:to-orange-800/40 transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div className="text-left">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100">Safety & Usage Information</h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">Critical safety and benefit information</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">
                  {safetyInfoCompletion}%
                </Badge>
                {expandedSections.has('safety') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-4">
            <div className="grid gap-4 pl-11">
              <div>
                <Label htmlFor="contraindications" className="text-sm font-medium">
                  Contraindications <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="contraindications"
                  value={contraindications}
                  onChange={(e) => handleFieldChange(e.target.value, onContraindicationsChange)}
                  placeholder="List conditions or situations where the device should not be used..."
                  className="mt-2 min-h-[80px]"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Critical safety information about when NOT to use the device.
                </p>
                <AISuggestionButton
                  fieldType="contraindications"
                  currentValue={contraindications}
                  suggestions={aiSuggestions}
                  onAcceptSuggestion={(suggestion) => onAcceptAISuggestion?.('contraindications', suggestion)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="warnings-precautions" className="text-sm font-medium">
                  Warnings & Precautions
                </Label>
                <Textarea
                  id="warnings-precautions"
                  value={warningsPrecautions}
                  onChange={(e) => handleFieldChange(e.target.value, onWarningsPrecautionsChange)}
                  placeholder="Describe important warnings and precautions for safe use..."
                  className="mt-2 min-h-[80px]"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Additional safety warnings and precautions for proper use.
                </p>
              </div>

              <div>
                <Label htmlFor="clinical-benefits" className="text-sm font-medium">
                  Clinical Benefits
                </Label>
                <Textarea
                  id="clinical-benefits"
                  value={clinicalBenefits}
                  onChange={(e) => handleFieldChange(e.target.value, onClinicalBenefitsChange)}
                  placeholder="Describe the clinical benefits and positive outcomes..."
                  className="mt-2 min-h-[80px]"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Expected beneficial outcomes and clinical advantages.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
