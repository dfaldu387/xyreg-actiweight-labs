
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ActivePhasesCard } from "./phases/ActivePhasesCard";
import { AvailablePhasesCard } from "./phases/AvailablePhasesCard";
import { EnhancedPhaseFormDialog } from "./phases/EnhancedPhaseFormDialog";
import { ConsolidatedPhaseDataService, Phase, PhaseCategory } from "./phases/ConsolidatedPhaseDataService";

export function PhaseManagement() {
  const { companyName } = useParams<{ companyName: string }>();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [activePhases, setActivePhases] = useState<Phase[]>([]);
  const [availablePhases, setAvailablePhases] = useState<Phase[]>([]);
  const [categories, setCategories] = useState<PhaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [operationInProgress, setOperationInProgress] = useState<Set<string>>(new Set());

  // Get company ID from company name
  useEffect(() => {
    const getCompanyId = async () => {
      if (!companyName) return;
      
      try {
        const decodedName = decodeURIComponent(companyName);
        const { data: company, error } = await supabase
          .from('companies')
          .select('id')
          .eq('name', decodedName)
          .single();
          
        if (error) throw error;
        if (company) {
          setCompanyId(company.id);
        }
      } catch (error) {
        console.error('Error getting company ID:', error);
        setLoadingError('Failed to load company information');
      }
    };

    getCompanyId();
  }, [companyName]);

  const loadData = useCallback(async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      setLoadingError(null);
      // Clear operation states to prevent conflicts
      setOperationInProgress(new Set());

      console.log(`[PhaseManagement] Loading phase data for company: ${companyId}`);
      
      // Load phases and categories in parallel
      const [phasesResult, categoriesResult] = await Promise.all([
        ConsolidatedPhaseDataService.loadPhases(companyId),
        ConsolidatedPhaseDataService.loadCategories(companyId)
      ]);

      console.log(`[PhaseManagement] Loaded ${phasesResult.activePhases.length} active phases:`, 
        phasesResult.activePhases.map(p => `${p.name} (${p.id})`));
      console.log(`[PhaseManagement] Loaded ${phasesResult.availablePhases.length} available phases:`, 
        phasesResult.availablePhases.map(p => `${p.name} (${p.id})`));

      // Use functional updates to avoid stale state
      setActivePhases(() => phasesResult.activePhases);
      setAvailablePhases(() => phasesResult.availablePhases);
      setCategories(() => categoriesResult);

      console.log('[PhaseManagement] Data loaded successfully');
    } catch (error) {
      console.error('[PhaseManagement] Error loading data:', error);
      setLoadingError(error instanceof Error ? error.message : 'Failed to load phase data');
      toast.error('Failed to load phase data');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  const handleAddExistingPhase = useCallback(async (phaseId: string) => {
    if (!companyId) {
      console.error('[PhaseManagement] No companyId available');
      return;
    }
    
    // Prevent duplicate operations
    if (operationInProgress.has(phaseId)) {
      console.log(`[PhaseManagement] Operation already in progress for phase ${phaseId}`);
      return;
    }

    try {
      // Add to operation in progress using functional update
      setOperationInProgress(prev => new Set(prev).add(phaseId));

      console.log(`[PhaseManagement] Adding phase ${phaseId} to active phases`);
      
      // Validate phase exists and belongs to company
      const phaseToAdd = availablePhases.find(p => p.id === phaseId);
      if (!phaseToAdd) {
        throw new Error('Phase not found in available phases');
      }

      if (phaseToAdd.company_id !== companyId) {
        throw new Error('Phase does not belong to this company');
      }
      
      // Perform database operation
      await ConsolidatedPhaseDataService.addPhaseToActive(companyId, phaseId);
      
      console.log(`[PhaseManagement] Successfully added phase ${phaseId}`);
      
      // Immediately update UI state instead of relying on loadData
      setActivePhases(prev => [...prev, phaseToAdd]);
      setAvailablePhases(prev => prev.filter(p => p.id !== phaseId));
      
      toast.success('Phase added successfully');
      
    } catch (error) {
      console.error(`[PhaseManagement] Error adding phase ${phaseId}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to add phase';
      toast.error(errorMessage);
      
      // Reload data on error to ensure consistency
      await loadData();
    } finally {
      // Remove from operation in progress using functional update
      setOperationInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(phaseId);
        return newSet;
      });
    }
  }, [companyId, availablePhases, loadData]);

  const handleRemovePhase = useCallback(async (phaseId: string, phaseName: string) => {
    if (!companyId) return;
    
    try {
      // Find the phase to remove
      const phaseToRemove = activePhases.find(p => p.id === phaseId);
      if (!phaseToRemove) {
        throw new Error('Phase not found in active phases');
      }
      
      // Call database operation first
      await ConsolidatedPhaseDataService.removePhaseFromActive(companyId, phaseId);
      
      // Immediately update UI state
      setActivePhases(prev => prev.filter(p => p.id !== phaseId));
      setAvailablePhases(prev => [...prev, phaseToRemove]);
      
      toast.success(`Removed "${phaseName}" from active phases`);
    } catch (error) {
      console.error('Error removing phase:', error);
      toast.error('Failed to remove phase');
      
      // Reload data on error to ensure consistency
      await loadData();
    }
  }, [companyId, activePhases, loadData]);

  const handleMovePhase = async (fromIndex: number, toIndex: number) => {
    if (!companyId) return;
    
    if (toIndex < 0 || toIndex >= activePhases.length) return;
    
    try {
      const reorderedPhases = [...activePhases];
      [reorderedPhases[fromIndex], reorderedPhases[toIndex]] = [reorderedPhases[toIndex], reorderedPhases[fromIndex]];
      
      await ConsolidatedPhaseDataService.reorderPhases(companyId, reorderedPhases);
      await loadData();
      toast.success('Phase order updated');
    } catch (error) {
      console.error('Error reordering phases:', error);
      toast.error('Failed to reorder phases');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!companyId || !result.destination) return;
    
    const { source, destination } = result;
    if (source.index === destination.index) return;
    
    try {
      const reorderedPhases = Array.from(activePhases);
      const [removed] = reorderedPhases.splice(source.index, 1);
      reorderedPhases.splice(destination.index, 0, removed);
      
      await ConsolidatedPhaseDataService.reorderPhases(companyId, reorderedPhases);
      await loadData();
      toast.success('Phase order updated');
    } catch (error) {
      console.error('Error reordering phases:', error);
      toast.error('Failed to reorder phases');
    }
  };

  const handleEditPhase = (phase: Phase) => {
    setEditingPhase(phase);
    setFormOpen(true);
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!companyId) return;
    
    try {
      // Use consolidated service which handles proper deletion
      await ConsolidatedPhaseDataService.removePhaseFromActive(companyId, phaseId);
      toast.success('Phase removed successfully');
      await loadData();
    } catch (error) {
      console.error('Error removing phase:', error);
      toast.error('Failed to remove phase');
    }
  };

  const handleFormSuccess = useCallback(async () => {
    await loadData();
    setFormOpen(false);
    setEditingPhase(null);
  }, [loadData]);

  if (!companyId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Loading company information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Phase Management */}
      <div className="flex flex-col lg:flex-row gap-4">
        <AvailablePhasesCard
          phases={availablePhases}
          categories={categories}
          loading={loading}
          onAddPhase={() => {
            setEditingPhase(null);
            setFormOpen(true);
          }}
          onAddExistingPhase={handleAddExistingPhase}
          onAddAllPhases={async (phaseIds) => {
            // Simple implementation - add each phase individually
            for (const phaseId of phaseIds) {
              await handleAddExistingPhase(phaseId);
            }
          }}
          onRetry={loadData}
          loadingError={loadingError}
          operationInProgress={operationInProgress}
        />

        <ActivePhasesCard
          phases={activePhases}
          categories={categories}
          loading={loading}
          loadingError={loadingError}
          onMovePhase={handleMovePhase}
          onRemovePhase={handleRemovePhase}
          onDragEnd={handleDragEnd}
          onRetry={loadData}
        />
      </div>

      {/* Add/Edit Phase Form */}
      <EnhancedPhaseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        phase={editingPhase ? {
          ...editingPhase,
          company_id: companyId,
          is_predefined_core_phase: editingPhase.is_predefined_core_phase ?? false,
          is_deletable: editingPhase.is_deletable ?? true,
          is_custom: editingPhase.is_custom ?? false
        } : null}
        categories={categories}
        onSuccess={handleFormSuccess}
        companyId={companyId}
      />
    </div>
  );
}
