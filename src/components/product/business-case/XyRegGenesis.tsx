import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SaveStatusIndicator } from "@/components/ui/save-status-indicator";
import { Loader2, ArrowRight, BookOpen, Plus, Send, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlobalHelpSidebar } from "@/components/help/GlobalHelpSidebar";
import { useAutoSave } from "@/hooks/useAutoSave";
import { DraftStorage } from "@/utils/draftStorage";
import { BlueprintCollaborationService } from "@/services/blueprintCollaborationService";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedProductCreationDialog } from "@/components/product/EnhancedProductCreationDialog";
import { useProductCreationContext } from "@/hooks/useProductCreationContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { InvestorShareCard } from '@/components/investor-share/InvestorShareCard';
import { MarketplaceShareCard } from '@/components/investor-share/MarketplaceShareCard';
import { EnhancedPitchBuilder } from './pitch-builder/EnhancedPitchBuilder';
import { 
  PHASE_1_STEPS, 
  PHASE_2_STEPS, 
  PHASE_5_INVESTOR_STEPS,
  ALL_INVESTOR_STEPS,
  TOTAL_INVESTOR_STEPS,
  StepConfig,
} from './blueprintStepMapping';
import { useViabilityFunnelProgress } from '@/hooks/useViabilityFunnelProgress';
import {
  GenesisProgressHeader,
} from './genesis';
import { XyregGenesisWelcome } from '@/components/investor-share/XyregGenesisWelcome';

interface XyRegGenesisData {
  stepNotes: Record<number, string>;
  stepFiles: Record<number, { name: string; path: string; uploadedAt?: string } | null>;
}

interface XyRegGenesisProps {
  disabled?: boolean;
}

export function XyRegGenesis({ disabled = false }: XyRegGenesisProps) {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [stepFiles, setStepFiles] = useState<Record<number, { name: string; path: string; uploadedAt?: string } | null>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInvestorDialogOpen, setIsInvestorDialogOpen] = useState(false);
  const [isMarketplaceDialogOpen, setIsMarketplaceDialogOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showCreateDeviceDialog, setShowCreateDeviceDialog] = useState(false);
  
  const { handleProductCreated } = useProductCreationContext();
  const { lang } = useTranslation();

  // Get module completion status from funnel progress
  const { readinessChecklist, completionData } = useViabilityFunnelProgress(productId || '', companyId || '');
  
  
  const getModuleCompletion = (completionKey: string): boolean => {
    // Special case: user_profile requires BOTH targetPopulation AND useEnvironment
    if (completionKey === 'user_profile') {
      return Boolean(completionData?.hasTargetPopulation && completionData?.hasUseEnvironment);
    }

    // Special case: market_sizing requires ALL three values (TAM, SAM, SOM)
    if (completionKey === 'market_sizing') {
      return Boolean(completionData?.hasTAM && completionData?.hasSAM && completionData?.hasSOM);
    }

    // Special case: intended_use_and_value requires BOTH hasIntendedUse AND hasValueProposition
    if (completionKey === 'intended_use_and_value') {
      return Boolean(completionData?.hasIntendedUse && completionData?.hasValueProposition);
    }

    // Map completion keys directly to completionData fields
    const keyToCompletionField: Record<string, keyof typeof completionData> = {
      'device_name': 'hasDeviceName',
      'device_type': 'hasDeviceType',
      'system_architecture': 'hasSystemArchitecture',
      'trl_assessment': 'hasTRL',
      'intended_use': 'hasIntendedUse',
      'device_description': 'hasDescription',
      'device_media': 'hasMedia',
      'target_markets': 'hasTargetMarkets',
      'economic_buyer': 'hasBuyerProfile',
      'strategic_partners': 'hasStrategicPartners',
      'value_proposition': 'hasValueProposition',
      'competition': 'hasCompetitor',
      'business_canvas': 'canvasSectionsFilled',
      'team_profile': 'hasTeamMembers',
      'essential_gates': 'hasTimelineConfirmed',
      'clinical_evidence': 'hasEvidenceContent',
      'reimbursement': 'hasReimbursementData',
      'gtm_strategy': 'hasGtmStrategy',
      'use_of_proceeds': 'hasUseOfProceeds',
      'manufacturing': 'hasManufacturing',
      'risk_analysis': 'hasRisks',
      'regulatory_pathway': 'hasRegulatoryPathway',
      'ip_strategy': 'hasIPStrategy',
      'health_economics': 'hasHealthEconomics',
      'revenue_forecast': 'hasRevenueForecast',
      'exit_strategy': 'hasExitStrategy',
    };

    const field = keyToCompletionField[completionKey];
    if (field && completionData) {
      const value = completionData[field];
      // Handle numeric fields like canvasSectionsFilled (complete if >= 3)
      if (typeof value === 'number') {
        return value >= 3;
      }
      return Boolean(value);
    }
    return false;
  };

  // Count completed modules per phase
  const getPhaseCompletedCount = (steps: StepConfig[]) => 
    steps.filter(step => getModuleCompletion(step.completionKey)).length;

  const phase1Completed = getPhaseCompletedCount(PHASE_1_STEPS);
  const phase2Completed = getPhaseCompletedCount(PHASE_2_STEPS);
  const phase5Completed = getPhaseCompletedCount(PHASE_5_INVESTOR_STEPS);
  const totalCompleted = phase1Completed + phase2Completed + phase5Completed;
  const isAllCompleted = totalCompleted === TOTAL_INVESTOR_STEPS;

  // Find next incomplete step
  const findNextStep = (): StepConfig | undefined => {
    return ALL_INVESTOR_STEPS.find(step => !getModuleCompletion(step.completionKey));
  };
  const nextStep = findNextStep();


  // Auto-save functionality
  const { saveStatus, hasUnsavedChanges } = useAutoSave({
    data: { stepNotes, stepFiles },
    onSave: async (data: XyRegGenesisData) => {
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
        DraftStorage.saveDraft(productId, 'xyreg-genesis', data);
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
          const draftData = DraftStorage.loadDraft<XyRegGenesisData>(productId, 'xyreg-genesis');
          if (draftData) {
            const stringNotes: Record<string, string> = {};
            Object.entries(draftData.stepNotes || {}).forEach(([key, value]) => {
              stringNotes[key] = value;
            });
            setStepNotes(stringNotes);
            setStepFiles(draftData.stepFiles || {});
          }
        }
      } catch {
        // Error loading genesis data
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [productId]);

  const handleShareInvestor = () => {
    setIsInvestorDialogOpen(true);
  };

  const handleShareMarketplace = () => {
    setIsMarketplaceDialogOpen(true);
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
    navigate(`/app/product/${productId}/${nextStep.route}${separator}returnTo=genesis`);
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const onProductCreated = (newProductId: string, newProjectId?: string) => {
    handleProductCreated(newProductId, newProjectId);
    setShowCreateDeviceDialog(false);
    navigate(`/app/product/${newProductId}/business-case?tab=genesis`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Action Button Row */}
      <div className="flex justify-end">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => setShowCreateDeviceDialog(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {lang('genesis.createNewDevice')}
        </Button>
      </div>

      {/* Welcome Section */}
      <XyregGenesisWelcome />

      {/* Learn How Genesis Works Button */}
      <Card className="border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-medium text-sm">{lang('genesis.newToGenesis')}</p>
                <p className="text-xs text-muted-foreground">{lang('genesis.learnHowProcess')}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsHelpOpen(true)}
              className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {lang('genesis.howGenesisWorks')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Sidebar */}
      <GlobalHelpSidebar open={isHelpOpen} onOpenChange={setIsHelpOpen} />

      {/* Progress Header */}
      <GenesisProgressHeader
        completedCount={totalCompleted}
        totalCount={TOTAL_INVESTOR_STEPS}
        nextStepTitle={nextStep?.title}
        onShareInvestor={handleShareInvestor}
        onShareMarketplace={handleShareMarketplace}
        onNextStep={handleNextStep}
        title={lang('genesis.title')}
        subtitle={lang('genesis.subtitle')}
      />



      {/* Save Status */}
      <div className="flex justify-end">
        <SaveStatusIndicator 
          status={saveStatus}
          hasUnsavedChanges={hasUnsavedChanges}
          className="text-xs"
        />
      </div>


      {/* Enhanced Pitch Builder - Embedded */}
      <EnhancedPitchBuilder variant="card" />


      {/* Share with Investor Dialog */}
      {companyId && (
        <Dialog open={isInvestorDialogOpen} onOpenChange={setIsInvestorDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-indigo-600" />
                {lang('genesis.shareWithInvestor')}
              </DialogTitle>
              <DialogDescription>
                {lang('genesis.shareWithInvestorDesc')}
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

      {/* Share on Marketplace Dialog */}
      {companyId && (
        <Dialog open={isMarketplaceDialogOpen} onOpenChange={setIsMarketplaceDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-600" />
                {lang('genesis.shareOnMarketplace')}
              </DialogTitle>
              <DialogDescription>
                {lang('genesis.shareOnMarketplaceDesc')}
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

      {/* Create Device Dialog */}
      {companyId && (
        <EnhancedProductCreationDialog
          open={showCreateDeviceDialog}
          onOpenChange={setShowCreateDeviceDialog}
          companyId={companyId}
          onProductCreated={onProductCreated}
        />
      )}
    </div>
  );
}
