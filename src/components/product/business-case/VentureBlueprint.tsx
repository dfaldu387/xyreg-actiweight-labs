import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SaveStatusIndicator } from "@/components/ui/save-status-indicator";
import { ChevronDown, ChevronUp, Loader2, Send, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAutoSave } from "@/hooks/useAutoSave";
import { DraftStorage } from "@/utils/draftStorage";
import { BlueprintCollaborationService } from "@/services/blueprintCollaborationService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InvestorShareDialog } from "@/components/company/InvestorShareDialog";
import { InvestorShareCard } from '@/components/investor-share/InvestorShareCard';
import { MarketplaceShareCard } from '@/components/investor-share/MarketplaceShareCard';
import { EnhancedPitchBuilder } from './pitch-builder/EnhancedPitchBuilder';
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
  BlueprintLaunchView,
  BlueprintSidebar,
  BlueprintStepDetailView,
  BlueprintIntroBanner,
  BlueprintMarketplaceIntro,
} from './genesis';
import { GENESIS_SECTIONS } from '@/config/genesisSections';
import { Button } from '@/components/ui/button';
import {
  INVESTOR_ESSENTIAL_COMPLETION_KEYS,
  INVESTOR_ESSENTIAL_TOTAL,
  BLUEPRINT_TRACK_PARAM,
} from '@/config/investorEssentialKeys';
import { Star } from 'lucide-react';


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
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [stepFiles, setStepFiles] = useState<Record<number, { name: string; path: string; uploadedAt?: string } | null>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isViabilityExpanded, setIsViabilityExpanded] = useState(true);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isInvestorDialogOpen, setIsInvestorDialogOpen] = useState(false);
  const [isMarketplaceDialogOpen, setIsMarketplaceDialogOpen] = useState(false);
  

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

    // Special case: legacy combined Intended Use + Value Proposition step
    if (completionKey === 'intended_use_and_value') {
      return Boolean(completionData.hasIntendedUse && completionData.hasValueProposition);
    }

    const keyToCompletionField: Record<string, keyof typeof completionData> = {
      // Phase 1: Opportunity & Definition
      'device_name': 'hasDeviceName',
      'device_type': 'hasDeviceType',
      'trl_assessment': 'hasTRL',
      'system_architecture': 'hasSystemArchitecture',
      'intended_use': 'hasIntendedUse',
      'device_description': 'hasDescription',
      'device_media': 'hasMedia',
      'target_markets': 'hasTargetMarkets',
      'regulatory_pathway': 'hasRegulatoryPathway',
      'competition': 'hasCompetitor',
      'economic_buyer': 'hasBuyerProfile',
      'strategic_partners': 'hasStrategicPartners',
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
      'revenue_forecast': 'hasRevenueForecast',
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

  // Completion map for the launch view (Gap-Analysis-style flat list).
  const completionMap: Record<string, boolean> = React.useMemo(() => {
    const map: Record<string, boolean> = {};
    GENESIS_SECTIONS.forEach((sec) =>
      sec.subSteps.forEach((sub) => {
        if (sub.completionKey) {
          map[sub.completionKey] = getModuleCompletion(sub.completionKey);
        }
      }),
    );
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completionData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedStepId = searchParams.get('step');
  const isDetailMode = Boolean(selectedStepId);

  // Investor-essential completion (derived) — gates share actions.
  const investorEssentialCompleted = Array.from(
    INVESTOR_ESSENTIAL_COMPLETION_KEYS,
  ).filter((k) => Boolean(completionMap[k])).length;
  const investorEssentialRemaining =
    INVESTOR_ESSENTIAL_TOTAL - investorEssentialCompleted;
  const investorReady = investorEssentialRemaining <= 0;

  const handleShareGuard = (open: () => void) => {
    if (!investorReady) {
      const next = new URLSearchParams(searchParams);
      next.set(BLUEPRINT_TRACK_PARAM, 'investor');
      next.delete('step');
      setSearchParams(next, { replace: false });
      toast({
        title: 'Investor essentials incomplete',
        description: `${investorEssentialRemaining} investor-essential step${investorEssentialRemaining === 1 ? '' : 's'} remaining. Switched to the Investor Essentials track.`,
      });
      return;
    }
    open();
  };

  return (
    <div className="space-y-6">
      {/* Right-rail sidebar — mirrors Gap Analysis pattern */}
      <BlueprintSidebar completion={completionMap} disabled={disabled} />

      {isDetailMode ? (
        /* DETAIL MODE — Gap-Analysis-style: editor renders in main column */
        <>
          <div className="flex justify-end">
            <SaveStatusIndicator
              status={saveStatus}
              hasUnsavedChanges={hasUnsavedChanges}
              className="text-xs"
            />
          </div>
          <BlueprintStepDetailView
            completion={completionMap}
            selectedStepId={selectedStepId!}
            disabled={disabled}
          />
        </>
      ) : (
        /* LANDING MODE — intro, progress, pitch builder, section list */
        <>
          <BlueprintIntroBanner />

          <BlueprintLaunchView
            completion={completionMap}
            disabled={disabled}
            headerActions={
              <div className="flex items-center gap-2">
                <SaveStatusIndicator
                  status={saveStatus}
                  hasUnsavedChanges={hasUnsavedChanges}
                  className="text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShareGuard(() => setIsInvestorDialogOpen(true))}
                  disabled={disabled}
                  title={
                    investorReady
                      ? undefined
                      : `${investorEssentialRemaining} investor-essential step${investorEssentialRemaining === 1 ? '' : 's'} remaining`
                  }
                  className={!investorReady ? 'opacity-70' : undefined}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Share with Investor
                  {!investorReady && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-amber-600">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {investorEssentialCompleted}/{INVESTOR_ESSENTIAL_TOTAL}
                    </span>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShareGuard(() => setIsMarketplaceDialogOpen(true))}
                  disabled={disabled}
                  title={
                    investorReady
                      ? undefined
                      : `${investorEssentialRemaining} investor-essential step${investorEssentialRemaining === 1 ? '' : 's'} remaining`
                  }
                  className={!investorReady ? 'opacity-70' : undefined}
                >
                  <Globe className="h-3.5 w-3.5 mr-1.5" />
                  Marketplace
                </Button>
              </div>
            }
            onSelectStep={(stepId) => {
              const next = new URLSearchParams(searchParams);
              if (stepId) {
                next.set('step', stepId);
              } else {
                next.delete('step');
              }
              if (!next.get('tab')) next.set('tab', 'venture-blueprint');
              setSearchParams(next, { replace: false });
            }}
          />

          <Collapsible defaultOpen={false}>
            <Card className="border-dashed">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                  <CardTitle className="text-sm font-medium">
                    Pitch & Investor Sharing
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <BlueprintMarketplaceIntro />
                  <EnhancedPitchBuilder variant="card" />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

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
        </>
      )}

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

      {/* Share with Investor Dialog (Genesis parity) */}
      {companyId && (
        <Dialog open={isInvestorDialogOpen} onOpenChange={setIsInvestorDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-indigo-600" />
                Share with Investor
              </DialogTitle>
              <DialogDescription>
                Configure what investors can view in your shared link.
              </DialogDescription>
            </DialogHeader>
            <InvestorShareCard
              companyId={companyId}
              companyName={companyData?.name || 'Company'}
              productId={productId}
              variant="dialog"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Share on Marketplace Dialog (Genesis parity) */}
      {companyId && (
        <Dialog open={isMarketplaceDialogOpen} onOpenChange={setIsMarketplaceDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-600" />
                Share on Marketplace
              </DialogTitle>
              <DialogDescription>
                Publish a public marketplace listing for this venture.
              </DialogDescription>
            </DialogHeader>
            <MarketplaceShareCard
              companyId={companyId}
              companyName={companyData?.name || 'Company'}
              productId={productId}
              variant="dialog"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
