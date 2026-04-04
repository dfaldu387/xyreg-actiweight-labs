
import { useState } from "react";
import { DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { ConsolidatedPhaseDataService, Phase } from "@/components/settings/phases/ConsolidatedPhaseDataService";
import { usePhaseReordering } from "./usePhaseReordering";

interface UsePhaseManagementOperationsProps {
  companyId: string | null;
  activePhases: Phase[];
  availablePhases: Phase[];
  setActivePhases: (phases: Phase[]) => void;
  loadData: () => Promise<void>;
}

export function usePhaseManagementOperations({
  companyId,
  activePhases,
  availablePhases,
  setActivePhases,
  loadData
}: UsePhaseManagementOperationsProps) {
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const { isReordering, reorderPhases, movePhase } = usePhaseReordering();

  const handleAddExistingPhase = async (phaseId: string) => {
    if (!companyId || isOperationInProgress) return;
    
    setIsOperationInProgress(true);
    try {
      await ConsolidatedPhaseDataService.addPhaseToActive(companyId, phaseId);
      await loadData();
      toast.success("Phase added successfully");
    } catch (error) {
      console.error('Error adding phase:', error);
      toast.error("Failed to add phase");
    } finally {
      setIsOperationInProgress(false);
    }
  };

  const handleRemovePhase = async (phaseId: string, phaseName: string) => {
    if (!companyId || isOperationInProgress) return;
    
    setIsOperationInProgress(true);
    try {
      await ConsolidatedPhaseDataService.removePhaseFromActive(companyId, phaseId);
      await loadData();
      toast.success("Phase removed successfully");
    } catch (error) {
      console.error('Error removing phase:', error);
      toast.error("Failed to remove phase");
    } finally {
      setIsOperationInProgress(false);
    }
  };

  const handleMovePhase = async (fromIndex: number, toIndex: number) => {
    if (!companyId || isOperationInProgress || fromIndex < 0 || fromIndex >= activePhases.length) return;
    if (toIndex < 0 || toIndex >= activePhases.length) return;

    setIsOperationInProgress(true);
    try {
      const currentPhases = activePhases.map(phase => ({ id: phase.id, position: phase.position }));
      
      // Create new order by moving the phase
      const newOrder = [...currentPhases];
      const [movedPhase] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, movedPhase);
      
      const phaseIds = newOrder.map(phase => phase.id);
      const result = await reorderPhases(companyId, phaseIds);
      
      if (result.success) {
        await loadData();
        toast.success("Phase moved successfully");
      } else {
        toast.error(result.error || "Failed to move phase");
      }
    } catch (error) {
      console.error('Error moving phase:', error);
      toast.error("Failed to move phase");
    } finally {
      setIsOperationInProgress(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!companyId || isOperationInProgress || isReordering) return;
    
    const { destination, source } = result;
    
    if (!destination || destination.index === source.index) return;

    setIsOperationInProgress(true);
    try {
      const newPhases = [...activePhases];
      const [movedPhase] = newPhases.splice(source.index, 1);
      newPhases.splice(destination.index, 0, movedPhase);

      // Update positions and optimistically update UI
      const reorderedPhases = newPhases.map((phase, index) => ({
        ...phase,
        position: index
      }));

      setActivePhases(reorderedPhases);
      
      // Use the improved reordering hook
      const phaseIds = reorderedPhases.map(phase => phase.id);
      const result = await reorderPhases(companyId, phaseIds);
      
      if (result.success) {
        toast.success("Phases reordered successfully");
      } else {
        toast.error(result.error || "Failed to reorder phases");
        await loadData(); // Reload on error to reset state
      }
    } catch (error) {
      console.error('Error reordering phases:', error);
      toast.error("Failed to reorder phases");
      await loadData(); // Reload on error to reset state
    } finally {
      setIsOperationInProgress(false);
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!companyId || isOperationInProgress) return;
    
    setIsOperationInProgress(true);
    try {
      // For now, we only remove from active phases since ConsolidatedPhaseDataService
      // doesn't support deleting company phases
      await ConsolidatedPhaseDataService.removePhaseFromActive(companyId, phaseId);
      await loadData();
      toast.success("Phase removed successfully");
    } catch (error) {
      console.error('Error deleting phase:', error);
      toast.error("Failed to delete phase");
    } finally {
      setIsOperationInProgress(false);
    }
  };

  const handleManageDocuments = async (phaseId: string, phaseName: string) => {
    // This would open a document management dialog
    console.log('Manage documents for phase:', phaseId);
    toast.info("Document management not yet implemented");
  };

  return {
    handleAddExistingPhase,
    handleRemovePhase,
    handleMovePhase,
    handleDragEnd,
    handleDeletePhase,
    handleManageDocuments,
    isOperationInProgress: isOperationInProgress || isReordering
  };
}
