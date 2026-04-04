import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SaveStatusIndicator } from "@/components/ui/save-status-indicator";
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useAutoSave } from "@/hooks/useAutoSave";
import { DraftStorage } from "@/utils/draftStorage";
import { BlueprintCollaborationService } from "@/services/blueprintCollaborationService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InvestorShareDialog } from "@/components/company/InvestorShareDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  PHASE_1_STEPS, 
  PHASE_2_STEPS, 
  PHASE_3_STEPS,
  PHASE_4_STEPS,
  PHASE_5_FULL_STEPS,
  PHASE_6_STEPS,
  ALL_DEVELOPMENT_STEPS,
  TOTAL_DEVELOPMENT_STEPS,
  StepConfig
} from './blueprintStepMapping';
import { useViabilityFunnelProgress } from '@/hooks/useViabilityFunnelProgress';
import { useCalculatedViabilityScore } from '@/hooks/useCalculatedViabilityScore';
import { ViabilityScoreDashboard } from './viability/ViabilityScoreDashboard';
import { 
  GenesisProgressHeader, 
  GenesisPhaseTimeline, 
  GenesisStepRow, 
  GenesisPhaseSection 
} from './genesis';


interface VentureBlueprintData {
  stepNotes: Record<number, string>;
  stepFiles: Record<number, { name: string; path: string; uploadedAt?: string } | null>;
}

interface VentureBlueprintProps {
  disabled?: boolean;
}

export function VentureBlueprint({ disabled = false }: VentureBlueprintProps) {
  const { lang } = useTranslation();
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [stepFiles, setStepFiles] = useState<Record<number, { name: string; path: string; uploadedAt?: string } | null>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isViabilityExpanded, setIsViabilityExpanded] = useState(true);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  

  // Get module completion status from funnel progress
  const { readinessChecklist, completionData } = useViabilityFunnelProgress(productId || '', companyId || '');
  
  // Get calculated viability score
  const { scoreResult, isLoading: isScoreLoading } = useCalculatedViabilityScore(productId, companyId || undefined);

  // Map completion keys directly to completionData fields (same approach as XyRegGenesis)
  const getModuleCompletion = (completionKey: string): boolean => {
    if (!completionData) return false;

    // Special case: user_profile requires BOTH targetPopulation AND useEnvironment
    if (completionKey === 'user_profile') {
      return Boolean(completionData.hasTargetPopulation && completionData.hasUseEnvironment);
    }

    // Special case: market_sizing requires ALL three values (TAM, SAM, SOM)
    if (completionKey === 'market_sizing') {
      return Boolean(completionData.hasTAM && completionData.hasSAM && completionData.hasSOM);
    }

    const keyToCompletionField: Record<string, keyof typeof completionData> = {
      // Phase 1: Opportunity & Definition
      'device_name': 'hasDeviceName',
      'system_architecture': 'hasSystemArchitecture',
      'intended_use': 'hasIntendedUse',
      'device_description': 'hasDescription',
      'device_media': 'hasMedia',
      'target_markets': 'hasTargetMarkets',
      'regulatory_pathway': 'hasRegulatoryPathway',
      'competition': 'hasCompetitor',
      'economic_buyer': 'hasBuyerProfile',
      // Phase 2: Feasibility & Planning
      'value_proposition': 'hasValueProposition',
      'health_economics': 'hasHealthEconomics',
      'reimbursement': 'hasReimbursementData',
      'risk_analysis': 'hasRisks',
      'clinical_evidence': 'hasEvidenceContent',
      'ip_strategy': 'hasIPStrategy',
      'essential_gates': 'hasGatesProgress',
      'use_of_proceeds': 'hasUseOfProceeds',
      'team_profile': 'hasTeamMembers',
      // Phase 5: Market Readiness
      'gtm_strategy': 'hasGtmStrategy',
      'manufacturing': 'hasManufacturing',
      'exit_strategy': 'hasExitStrategy',
      // Legacy
      'business_canvas': 'canvasSectionsFilled',
    };

    const field = keyToCompletionField[completionKey];
    if (field) {
      const value = completionData[field];
      // Handle numeric fields like canvasSectionsFilled (complete if >= 3)
      if (typeof value === 'number') {
        return value >= 3;
      }
      return Boolean(value);
    }

    // For phases 3-6 steps that don't have completion tracking yet
    return false;
  };

  // Count completed modules per phase
  const getPhaseCompletedCount = (steps: StepConfig[]) => 
    steps.filter(step => getModuleCompletion(step.completionKey)).length;

  const phase1Completed = getPhaseCompletedCount(PHASE_1_STEPS);
  const phase2Completed = getPhaseCompletedCount(PHASE_2_STEPS);
  const phase3Completed = getPhaseCompletedCount(PHASE_3_STEPS);
  const phase4Completed = getPhaseCompletedCount(PHASE_4_STEPS);
  const phase5Completed = getPhaseCompletedCount(PHASE_5_FULL_STEPS);
  const phase6Completed = getPhaseCompletedCount(PHASE_6_STEPS);
  const totalCompleted = phase1Completed + phase2Completed + phase3Completed + phase4Completed + phase5Completed + phase6Completed;

  // Find next incomplete step
  const findNextStep = (): StepConfig | undefined => {
    return ALL_DEVELOPMENT_STEPS.find(step => !getModuleCompletion(step.completionKey));
  };
  const nextStep = findNextStep();

  // Phase timeline data for all 6 phases
  const phaseData = [
    { id: 1, label: 'Phase 1', stepCount: PHASE_1_STEPS.length, completedCount: phase1Completed },
    { id: 2, label: 'Phase 2', stepCount: PHASE_2_STEPS.length, completedCount: phase2Completed },
    { id: 3, label: 'Phase 3', stepCount: PHASE_3_STEPS.length, completedCount: phase3Completed },
    { id: 4, label: 'Phase 4', stepCount: PHASE_4_STEPS.length, completedCount: phase4Completed },
    { id: 5, label: 'Phase 5', stepCount: PHASE_5_FULL_STEPS.length, completedCount: phase5Completed },
    { id: 6, label: 'Phase 6', stepCount: PHASE_6_STEPS.length, completedCount: phase6Completed },
  ];

  // Auto-save functionality
  const { saveStatus, hasUnsavedChanges } = useAutoSave({
    data: { stepNotes, stepFiles },
    onSave: async (data: VentureBlueprintData) => {
      if (!productId || !companyId) return;
      
      const numericNotes: Record<number, string> = {};
      Object.entries(data.stepNotes).forEach(([key, value]) => {
        numericNotes[parseInt(key) || key as any] = value;
      });
      
      const success = await BlueprintCollaborationService.saveProductBlueprintData(
        productId,
        companyId,
        {
          activityNotes: numericNotes,
          activityFiles: data.stepFiles,
          completedActivities: Array.from(completedSteps),
          activityComments: {}
        }
      );

      if (success) {
        queryClient.invalidateQueries({ queryKey: ['funnel-blueprint', productId] });
        DraftStorage.saveDraft(productId, 'venture-blueprint', data);
      }
    },
    delay: 15000,
    enabled: !!productId && !!companyId
  });

  // Load data on mount
  useEffect(() => {
    if (!productId) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('company_id')
          .eq('id', productId)
          .single();

        if (productError) throw productError;
        if (!product) throw new Error('Device not found');

        setCompanyId(product.company_id);

        const blueprintData = await BlueprintCollaborationService.loadProductBlueprintData(productId);
        
        if (blueprintData) {
          const stringNotes: Record<string, string> = {};
          Object.entries(blueprintData.activityNotes || {}).forEach(([key, value]) => {
            stringNotes[key] = value;
          });
          setStepNotes(stringNotes);
          setStepFiles(blueprintData.activityFiles || {});
          setCompletedSteps(new Set(blueprintData.completedActivities || []));
        } else {
          const draftData = DraftStorage.loadDraft<VentureBlueprintData>(productId, 'venture-blueprint');
          if (draftData) {
            const stringNotes: Record<string, string> = {};
            Object.entries(draftData.stepNotes || {}).forEach(([key, value]) => {
              stringNotes[key] = value;
            });
            setStepNotes(stringNotes);
            setStepFiles(draftData.stepFiles || {});
          }
        }
      } catch (error) {
        console.error('Error loading blueprint data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [productId]);

  const handlePreview = () => {
    setIsShareDialogOpen(true);
    toast({ title: lang('ventureBlueprint.preview'), description: lang('ventureBlueprint.openingPreview') });
  };

  // Fetch company name for the dialog
  const { data: companyData } = useQuery({
    queryKey: ['company-name', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
      return data;
    },
    enabled: !!companyId,
  });

  const handleNextStep = () => {
    if (!nextStep || disabled) return;
    const separator = nextStep.route.includes('?') ? '&' : '?';
    navigate(`/app/product/${productId}/${nextStep.route}${separator}returnTo=venture-blueprint`);
  };

  const scrollToPhase = (phaseId: number) => {
    const element = document.getElementById(`blueprint-phase-${phaseId}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Progress Header */}
      <GenesisProgressHeader
        completedCount={totalCompleted}
        totalCount={TOTAL_DEVELOPMENT_STEPS}
        nextStepTitle={nextStep?.title}
        onShareInvestor={handlePreview}
        onNextStep={handleNextStep}
        title={lang('ventureBlueprint.title')}
        subtitle={lang('ventureBlueprint.subtitle')}
        colorVariant="indigo"
      />

      {/* Phase Timeline - All 6 Phases */}
      <GenesisPhaseTimeline
        phases={phaseData}
        onPhaseClick={scrollToPhase}
        colorVariant="orange"
      />

      {/* Save Status */}
      <div className="flex justify-end">
        <SaveStatusIndicator 
          status={saveStatus}
          hasUnsavedChanges={hasUnsavedChanges}
          className="text-xs"
        />
      </div>

      {/* Phase 1: Opportunity & Definition */}
      <div id="blueprint-phase-1">
        <GenesisPhaseSection
          phaseNumber={1}
          title={lang('ventureBlueprint.phase1Title')}
          goal={lang('ventureBlueprint.phase1Goal')}
          completedCount={phase1Completed}
          totalCount={PHASE_1_STEPS.length}
          colorVariant="orange"
        >
        {PHASE_1_STEPS.map((step) => (
            <GenesisStepRow
              key={step.id}
              stepId={step.id}
              stepNumber={step.stepNumber}
              title={step.title}
              description={step.description}
              route={step.route}
              moduleLabel={step.moduleLabel}
              isComplete={getModuleCompletion(step.completionKey)}
              isNew={step.isNew}
              disabled={disabled}
            />
          ))}
        </GenesisPhaseSection>
      </div>

      {/* Phase 2: Feasibility & Planning */}
      <div id="blueprint-phase-2">
        <GenesisPhaseSection
          phaseNumber={2}
          title={lang('ventureBlueprint.phase2Title')}
          goal={lang('ventureBlueprint.phase2Goal')}
          completedCount={phase2Completed}
          totalCount={PHASE_2_STEPS.length}
          colorVariant="orange"
        >
        {PHASE_2_STEPS.map((step) => (
            <GenesisStepRow
              key={step.id}
              stepId={step.id}
              stepNumber={step.stepNumber}
              title={step.title}
              description={step.description}
              route={step.route}
              moduleLabel={step.moduleLabel}
              isComplete={getModuleCompletion(step.completionKey)}
              isNew={step.isNew}
              disabled={disabled}
            />
          ))}
        </GenesisPhaseSection>
      </div>

      {/* Phase 3: Design & Development */}
      <div id="blueprint-phase-3">
        <GenesisPhaseSection
          phaseNumber={3}
          title={lang('ventureBlueprint.phase3Title')}
          goal={lang('ventureBlueprint.phase3Goal')}
          completedCount={phase3Completed}
          totalCount={PHASE_3_STEPS.length}
          colorVariant="orange"
        >
          {PHASE_3_STEPS.map((step) => (
            <GenesisStepRow
              key={step.id}
              stepId={step.id}
              stepNumber={step.stepNumber}
              title={step.title}
              description={step.description}
              route={step.route}
              moduleLabel={step.moduleLabel}
              isComplete={getModuleCompletion(step.completionKey)}
              isNew={step.isNew}
              disabled={disabled}
            />
          ))}
        </GenesisPhaseSection>
      </div>

      {/* Phase 4: Verification & Validation */}
      <div id="blueprint-phase-4">
        <GenesisPhaseSection
          phaseNumber={4}
          title={lang('ventureBlueprint.phase4Title')}
          goal={lang('ventureBlueprint.phase4Goal')}
          completedCount={phase4Completed}
          totalCount={PHASE_4_STEPS.length}
          colorVariant="orange"
        >
          {PHASE_4_STEPS.map((step) => (
            <GenesisStepRow
              key={step.id}
              stepId={step.id}
              stepNumber={step.stepNumber}
              title={step.title}
              description={step.description}
              route={step.route}
              moduleLabel={step.moduleLabel}
              isComplete={getModuleCompletion(step.completionKey)}
              isNew={step.isNew}
              disabled={disabled}
            />
          ))}
        </GenesisPhaseSection>
      </div>

      {/* Phase 5: Market Readiness & Submission */}
      <div id="blueprint-phase-5">
        <GenesisPhaseSection
          phaseNumber={5}
          title={lang('ventureBlueprint.phase5Title')}
          goal={lang('ventureBlueprint.phase5Goal')}
          completedCount={phase5Completed}
          totalCount={PHASE_5_FULL_STEPS.length}
          colorVariant="orange"
        >
          {PHASE_5_FULL_STEPS.map((step) => (
            <GenesisStepRow
              key={step.id}
              stepId={step.id}
              stepNumber={step.stepNumber}
              title={step.title}
              description={step.description}
              route={step.route}
              moduleLabel={step.moduleLabel}
              isComplete={getModuleCompletion(step.completionKey)}
              isNew={step.isNew}
              disabled={disabled}
            />
          ))}
        </GenesisPhaseSection>
      </div>

      {/* Phase 6: Post-Market & Growth */}
      <div id="blueprint-phase-6">
        <GenesisPhaseSection
          phaseNumber={6}
          title={lang('ventureBlueprint.phase6Title')}
          goal={lang('ventureBlueprint.phase6Goal')}
          completedCount={phase6Completed}
          totalCount={PHASE_6_STEPS.length}
          colorVariant="orange"
        >
          {PHASE_6_STEPS.map((step) => (
            <GenesisStepRow
              key={step.id}
              stepId={step.id}
              stepNumber={step.stepNumber}
              title={step.title}
              description={step.description}
              route={step.route}
              moduleLabel={step.moduleLabel}
              isComplete={getModuleCompletion(step.completionKey)}
              isNew={step.isNew}
              disabled={disabled}
            />
          ))}
        </GenesisPhaseSection>
      </div>

      {/* Viability Score - Compact collapsible */}
      <Collapsible open={isViabilityExpanded} onOpenChange={setIsViabilityExpanded}>
        <Card className="border-dashed">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-sm font-medium">{lang('ventureBlueprint.viabilityScore')}</CardTitle>
                {scoreResult && (
                  <Badge 
                    variant={completedSteps.size === 0 ? 'secondary' : scoreResult.totalScore >= 71 ? 'default' : scoreResult.totalScore >= 41 ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {completedSteps.size === 0 ? '--/100' : `${scoreResult.totalScore}/100`}
                  </Badge>
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <ViabilityScoreDashboard 
                scoreResult={scoreResult} 
                isLoading={isScoreLoading}
                variant="full"
                showNavigation={!disabled}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Investor Share Dialog */}
      {companyId && (
        <InvestorShareDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          companyId={companyId}
          companyName={companyData?.name || 'Company'}
          productId={productId}
        />
      )}
    </div>
  );
}
