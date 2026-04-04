import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, Download, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { hazardsService } from "@/services/hazardsService";
import { traceabilityService } from "@/services/traceabilityService";
import { ComprehensiveHazardTraceabilityTable } from "./ComprehensiveHazardTraceabilityTable";
import { AddHazardDialog } from "./AddHazardDialog";
import { AddHazardWithAIDialog } from "./AddHazardWithAIDialog";
import { EditHazardDialog } from "./EditHazardDialog";
import { HazardAISuggestionsDialog } from "./HazardAISuggestionsDialog";
import { CreateHazardInput, Hazard, SeverityLevel, ProbabilityLevel, MitigationType } from "./types";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { HazardAIService, HazardSuggestion } from "@/services/hazardAIService";
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog";
import { ExcelExportService } from "@/utils/excelExport";
import { useProductDetails } from "@/hooks/useProductDetails";
import { useGenesisRestrictions } from "@/hooks/useGenesisRestrictions";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useBaselineLockError, isBaselineLockError } from "@/hooks/useBaselineLockError";
import { BaselineLockDialog } from "@/components/change-control/BaselineLockDialog";
import { useVariantInheritance } from "@/hooks/useVariantInheritance";
import { useInheritanceExclusion } from "@/hooks/useInheritanceExclusion";
import { mirrorScopeToFamilyProducts } from "@/hooks/useAutoSyncScope";

interface RiskManagementModuleProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
  isInGenesisFlow?: boolean;
  isStepComplete?: boolean;
}

export function RiskManagementModule({ productId, companyId, disabled = false, isInGenesisFlow = false, isStepComplete = false }: RiskManagementModuleProps) {
  const { toast } = useToast();
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const { isGenesis } = useGenesisRestrictions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingHazard, setEditingHazard] = useState<Hazard | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [deletingHazard, setDeletingHazard] = useState<Hazard | null>(null);
  const baselineLock = useBaselineLockError();

  // Variant inheritance
  const { isVariant, masterDevice, masterProductData } = useVariantInheritance(productId);
  const {
    scopes: hazardExclusionScopes,
    getExclusionScope,
    setExclusionScope,
    isFullyExcluded: isHazardExcluded,
    getExclusionSummary,
    loaded: exclusionsLoaded,
  } = useInheritanceExclusion(productId, true, 'hazard_exclusion_scopes');

  // Fetch product details for Excel export filename
  const { data: productData } = useProductDetails(productId);
  const belongsToFamily = !!(productData as any)?.basic_udi_di || isVariant;

  // Fetch family product IDs (parent + variants only, not all company devices)
  const familyRootId = masterDevice?.id || productId;
  const { data: familyProducts } = useQuery({
    queryKey: ['family-products-hazard-sync', familyRootId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id')
        .eq('is_archived', false)
        .or(`id.eq.${familyRootId},and(parent_product_id.eq.${familyRootId},parent_relationship_type.eq.variant)`);
      return (data || []) as { id: string }[];
    },
    enabled: !!familyRootId && belongsToFamily,
    staleTime: 30_000,
  });
  const familyProductIds = useMemo(
    () => (familyProducts || []).map(p => p.id),
    [familyProducts]
  );

  // Handle hazard scope change: save scope on current product, mirror to family
  const parentProductId = masterDevice?.id || null;
  const handleHazardScopeChange = useCallback(async (
    hazardId: string,
    newScope: import("@/hooks/useInheritanceExclusion").ItemExclusionScope
  ) => {
    const scopeWithFlag = { ...newScope, isManualGroup: true };
    await setExclusionScope(hazardId, scopeWithFlag);
    if (!companyId || !productId) return;
    await mirrorScopeToFamilyProducts(hazardId, scopeWithFlag, 'hazard_exclusion_scopes', productId, companyId, parentProductId);
  }, [setExclusionScope, companyId, productId, parentProductId]);

  // Shared hazards from other family devices that have scope including this device
  const [sharedHazards, setSharedHazards] = useState<Hazard[]>([]);
  const sharedHazardsLoadedRef = useRef(false);

  const {
    data: localHazards = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["hazards", productId],
    queryFn: () => hazardsService.getHazardsByProduct(productId),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch shared hazards from family devices that include this device in scope
  useEffect(() => {
    if (!productId || !companyId || !exclusionsLoaded || isLoading) {
      if (!sharedHazardsLoadedRef.current) setSharedHazards([]);
      return;
    }

    const loadSharedHazards = async () => {
      // Find hazard IDs where current product is NOT excluded and scope was manually set
      const eligibleHazardIds: string[] = [];
      for (const [hazardId, scope] of Object.entries(hazardExclusionScopes)) {
        if (!scope.isManualGroup) continue;
        const excluded = scope.excludedProductIds || [];
        if (!excluded.includes(productId)) {
          eligibleHazardIds.push(hazardId);
        }
      }

      if (eligibleHazardIds.length === 0) {
        setSharedHazards([]);
        return;
      }

      // Filter out hazards already owned by this product
      const ownHazardIds = new Set(localHazards.map(h => h.id));
      const missingHazardIds = eligibleHazardIds.filter(id => !ownHazardIds.has(id));

      if (missingHazardIds.length === 0) {
        setSharedHazards([]);
        return;
      }

      // Fetch these hazards from the DB
      const { data: fetchedHazards } = await supabase
        .from('hazards')
        .select('*')
        .in('id', missingHazardIds);

      if (!fetchedHazards || fetchedHazards.length === 0) {
        setSharedHazards([]);
        return;
      }

      // Get source product names
      const sourceProductIds = [...new Set(fetchedHazards.map(h => h.product_id).filter(Boolean))];
      const productNameMap = new Map<string, string>();
      if (sourceProductIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .in('id', sourceProductIds);
        (products || []).forEach((p: any) => productNameMap.set(p.id, p.name));
      }

      setSharedHazards(fetchedHazards.map((h: any) => ({
        ...h,
        _isSharedFromDevice: true,
        _sourceProductId: h.product_id,
        _sourceProductName: productNameMap.get(h.product_id) || 'Unknown Device',
      })) as Hazard[]);
      sharedHazardsLoadedRef.current = true;
    };

    loadSharedHazards();
  }, [productId, companyId, exclusionsLoaded, isLoading, hazardExclusionScopes]);

  // Fetch master hazards if this is a variant
  const masterDeviceId = masterDevice?.id;
  const {
    data: masterHazards = [],
  } = useQuery({
    queryKey: ["hazards", masterDeviceId],
    queryFn: () => hazardsService.getHazardsByProduct(masterDeviceId!),
    enabled: isVariant && !!masterDeviceId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Merge local + inherited + shared hazards
  const hazards = useMemo(() => {
    const inherited = (isVariant && masterHazards.length)
      ? masterHazards.map(h => ({
          ...h,
          isInheritedFromMaster: true,
          masterProductName: masterDevice?.name || 'Master',
        }))
      : [];
    // Deduplicate shared hazards (exclude any already in local or inherited)
    const existingIds = new Set([...localHazards.map(h => h.id), ...inherited.map(h => h.id)]);
    const uniqueShared = sharedHazards.filter(h => !existingIds.has(h.id));
    return [...inherited, ...localHazards, ...uniqueShared];
  }, [localHazards, masterHazards, isVariant, masterDevice?.name, sharedHazards]);

  // Handle highlightHazard URL param — open the hazard for editing
  useEffect(() => {
    const highlightId = searchParams.get('highlightHazard');
    if (!highlightId || isLoading || !hazards.length) return;
    
    const hazard = hazards.find(h => h.id === highlightId);
    if (hazard) {
      setEditingHazard(hazard);
    }
    
    // Clean up the param
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('highlightHazard');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, hazards, isLoading]);

  const createHazardMutation = useMutation({
    mutationFn: async ({ input, requirementIds }: { input: CreateHazardInput, requirementIds: string[] }) => {
      const hazard = await hazardsService.createHazard(productId, companyId, input, 'GEN');
      
      // Update traceability links if requirements are selected
      if (requirementIds.length > 0) {
        const { traceabilityService } = await import('@/services/traceabilityService');
        await traceabilityService.updateHazardRequirementLinks(hazard.hazard_id, requirementIds);
      }
      
      return hazard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hazards", productId] });
      queryClient.invalidateQueries({ queryKey: ["requirement-specifications", productId] });
      queryClient.invalidateQueries({ queryKey: ["funnel-hazards", productId] }); // Update Genesis checklist
      queryClient.invalidateQueries({ queryKey: ["hazards", productId, "count"] }); // Update border styling
      toast({
        title: lang('common.success'),
        description: lang('riskManagement.toast.createSuccess'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: lang('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateHazardMutation = useMutation({
    mutationFn: async ({ id, input, hazardId, requirementIds }: { 
      id: string, 
      input: CreateHazardInput, 
      hazardId: string,
      requirementIds: string[] 
    }) => {
      return await hazardsService.updateHazardWithTraceability(id, input, hazardId, requirementIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hazards", productId] });
      queryClient.invalidateQueries({ queryKey: ["requirement-specifications", productId] });
      queryClient.invalidateQueries({ queryKey: ["funnel-hazards", productId] }); // Update Genesis checklist
      queryClient.invalidateQueries({ queryKey: ["hazards", productId, "count"] }); // Update border styling
      setEditingHazard(null);
      toast({
        title: lang('common.success'),
        description: lang('riskManagement.toast.updateSuccess'),
      });
    },
    onError: (error: Error) => {
      if (isBaselineLockError(error) && editingHazard) {
        baselineLock.handleError(error, editingHazard.id, 'hazard', editingHazard.hazard_id || editingHazard.id);
        return;
      }
      toast({
        title: lang('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteHazardMutation = useMutation({
    mutationFn: async (id: string) => {
      return await hazardsService.deleteHazard(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hazards", productId] });
      queryClient.invalidateQueries({ queryKey: ["requirement-specifications", productId] });
      queryClient.invalidateQueries({ queryKey: ["funnel-hazards", productId] }); // Update Genesis checklist
      queryClient.invalidateQueries({ queryKey: ["hazards", productId, "count"] }); // Update border styling
      setDeletingHazard(null);
      toast({
        title: lang('common.success'),
        description: lang('riskManagement.toast.deleteSuccess'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: lang('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddHazard = (input: CreateHazardInput, requirementIds: string[]) => {
    if (disabled) return;
    createHazardMutation.mutate({ input, requirementIds });
  };

  const handleEditHazard = (id: string, input: CreateHazardInput, requirementIds: string[]) => {
    if (disabled) return;
    const hazard = hazards.find(h => h.id === id);
    if (hazard) {
      updateHazardMutation.mutate({ id, input, hazardId: hazard.hazard_id, requirementIds });
    }
  };

  const handleDeleteHazard = (hazard: Hazard) => {
    if (disabled) return;
    setDeletingHazard(hazard);
  };

  const handleConfirmDelete = (reason: string) => {
    if (disabled) return;
    if (deletingHazard) {
      deleteHazardMutation.mutate(deletingHazard.id);
    }
  };

  const handleOpenAIDialog = () => {
    if (disabled) return;
    setShowAIDialog(true);
  };

  const handleAddAIHazards = async (selectedSuggestions: HazardSuggestion[]) => {
    if (disabled) return;
    try {
      // Add selected suggestions as hazards
      for (const suggestion of selectedSuggestions) {
        const hazardInput: CreateHazardInput = {
          description: suggestion.description,
          hazardous_situation: suggestion.hazardous_situation || '',
          potential_harm: suggestion.potential_harm || '',
          foreseeable_sequence_events: suggestion.foreseeable_sequence_events || '',
          category: suggestion.category,
          // Provide default values that KOL can later assess and modify
          initial_severity: 3 as SeverityLevel, // 3 = Serious
          initial_probability: 3 as ProbabilityLevel, // 3 = Occasional  
          initial_risk: 'Medium',
          risk_control_measure: '',
          risk_control_type: undefined,
          mitigation_measure: '', // Legacy field - required for DB compatibility
          mitigation_type: 'Information for Safety' as MitigationType, // Default legacy field
          mitigation_link: '',
          residual_severity: undefined,
          residual_probability: undefined,
          residual_risk: 'Medium', // Default legacy field - required for DB compatibility
          verification_implementation: '',
          verification_effectiveness: '',
          traceability_requirements: suggestion.rationale
        };
        
        await hazardsService.createHazard(productId, companyId, hazardInput, 'GEN');
      }
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['hazards', productId] });
      queryClient.invalidateQueries({ queryKey: ['requirement-specifications', productId] });
      queryClient.invalidateQueries({ queryKey: ['funnel-hazards', productId] });
      queryClient.invalidateQueries({ queryKey: ['hazards', productId, 'count'] });

      setShowAIDialog(false);
      toast({
        title: lang('common.success'),
        description: lang('riskManagement.toast.aiAddSuccess').replace('{count}', String(selectedSuggestions.length)),
      });
    } catch (error) {
      console.error('Error adding AI suggestions:', error);
      toast({
        title: lang('common.error'),
        description: lang('riskManagement.toast.aiAddError'),
        variant: 'destructive',
      });
    }
  };

  const handleDownloadExcel = async () => {
    if (disabled) return;
    try {
      const data = ExcelExportService.formatHazardsForExport(hazards);
      await ExcelExportService.exportToExcel([data], `Hazards_Risk_Management_${productData?.name || 'Product'}`);
      toast({
        title: lang('common.success'),
        description: lang('riskManagement.toast.exportSuccess'),
      });
    } catch (error) {
      console.error('Failed to export hazards:', error);
      toast({
        title: lang('common.error'),
        description: lang('riskManagement.toast.exportError'),
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            {lang('riskManagement.loadError')}: {(error as Error).message}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter out excluded inherited hazards for counts
  const activeHazards = hazards.filter(h => !isHazardExcluded(h.id, productId));

  const totalHazards = activeHazards.length;
  const assessedHazards = activeHazards.filter(h => 
    (h.initial_severity && h.initial_probability) || h.initial_risk
  ).length;
  const verifiedHazards = activeHazards.filter(h => 
    h.verification_effectiveness || h.verification_implementation
  ).length;

  // Completion check: has at least 1 hazard
  const isComplete = totalHazards > 0;

  // Border logic: green if this tab has data, yellow if neither tab has data, no border if only other tab has data
  const getBorderClass = () => {
    if (!isInGenesisFlow) return '';
    if (isComplete) return 'transition-colors border-2 border-emerald-500 bg-emerald-50/30';
    if (!isStepComplete) return 'transition-colors border-2 border-amber-400 bg-amber-50/30'; // Neither tab has data
    return ''; // Other tab has data, no border here
  };

  return (
    <div className="space-y-6">
      <Card className={getBorderClass()}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {lang('riskManagement.title')}
                  <Badge variant="outline" className="text-xs">
                    ISO 14971
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {lang('riskManagement.description')}
                </p>
              </div>
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          onClick={handleDownloadExcel}
                          disabled={disabled || isGenesis || hazards.length === 0}
                        >
                          {isGenesis && <Lock className="h-4 w-4 mr-2" />}
                          {!isGenesis && <Download className="h-4 w-4 mr-2" />}
                          {lang('riskManagement.exportExcel')}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {isGenesis && (
                      <TooltipContent>Upgrade HelixOS to export data</TooltipContent>
                    )}
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          onClick={handleOpenAIDialog}
                          disabled={disabled || isGenesis}
                        >
                          {isGenesis && <Lock className="h-4 w-4 mr-2" />}
                          {!isGenesis && <Sparkles className="h-4 w-4 mr-2" />}
                          {lang('riskManagement.aiSuggestions')}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {isGenesis && (
                      <TooltipContent>Upgrade HelixOS to use AI suggestions</TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <AddHazardDialog
                  onAddHazard={handleAddHazard}
                  isLoading={createHazardMutation.isPending}
                  productId={productId}
                  companyId={companyId}
                  disabled={disabled}
                />
              </div>
            </div>

        {/* Progress Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{totalHazards}</div>
            <div className="text-xs text-blue-600">{lang('riskManagement.summary.totalHazards')}</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-700">{assessedHazards}</div>
            <div className="text-xs text-green-600">{lang('riskManagement.summary.riskAssessed')}</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">{verifiedHazards}</div>
            <div className="text-xs text-purple-600">{lang('riskManagement.summary.verified')}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ComprehensiveHazardTraceabilityTable
          hazards={hazards || []}
          isLoading={isLoading}
          onEditHazard={(hazard) => {
            // Don't open edit for inherited hazards
            if (hazard.isInheritedFromMaster) return;
            setEditingHazard(hazard);
          }}
          onDeleteHazard={handleDeleteHazard}
          disabled={disabled}
          isVariant={isVariant}
          belongsToFamily={belongsToFamily}
          isHazardExcluded={(hazardId) => isHazardExcluded(hazardId, productId)}
          getExclusionScope={getExclusionScope}
          onSetExclusionScope={handleHazardScopeChange}
          getExclusionSummary={getExclusionSummary}
          companyId={companyId}
          currentProductId={productId}
          familyProductIds={familyProductIds.length > 0 ? familyProductIds : undefined}
        />
        
        {editingHazard && (
          <EditHazardDialog
            hazard={editingHazard}
            open={!!editingHazard}
            onOpenChange={(open) => !open && setEditingHazard(null)}
            onEditHazard={handleEditHazard}
            onDeleteHazard={handleDeleteHazard}
            isLoading={updateHazardMutation.isPending}
            productId={productId}
            companyId={companyId}
          />
        )}

        {deletingHazard && (
          <DeleteConfirmationDialog
            open={!!deletingHazard}
            onOpenChange={(open) => !open && setDeletingHazard(null)}
            onConfirm={handleConfirmDelete}
            title={lang('riskManagement.dialog.delete.title')}
            description={lang('riskManagement.dialog.delete.description')}
            itemName={`${deletingHazard.hazard_id} - ${deletingHazard.description}`}
            affectedItems={deletingHazard.linked_requirements ? deletingHazard.linked_requirements.split(',').map(id => `${lang('riskManagement.requirement')} ${id.trim()}`).filter(Boolean) : []}
            isLoading={deleteHazardMutation.isPending}
          />
        )}

        {/* AI Suggestions Dialog */}
        <HazardAISuggestionsDialog
          productId={productId}
          companyId={companyId}
          onAddHazards={handleAddAIHazards}
          open={showAIDialog}
          onOpenChange={setShowAIDialog}
          isLoading={createHazardMutation.isPending}
        />
          </CardContent>
        </Card>
      <BaselineLockDialog
        open={baselineLock.state.open}
        onOpenChange={(open) => !open && baselineLock.close()}
        reviewTitle={baselineLock.state.reviewTitle}
        baselineDate={baselineLock.state.baselineDate}
        objectId={baselineLock.state.objectId}
        objectType={baselineLock.state.objectType}
        objectLabel={baselineLock.state.objectLabel}
        companyId={companyId}
        productId={productId}
      />
    </div>
  );
}