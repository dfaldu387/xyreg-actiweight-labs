
import React from "react";
import { ActivePhasesCard } from "./ActivePhasesCard";
import { AvailablePhasesCard } from "./AvailablePhasesCard";
import { PhaseInitializationCard } from "./PhaseInitializationCard";
import { Phase, PhaseCategory } from "./ConsolidatedPhaseDataService";

interface PhaseManagementMainProps {
  activePhases: Phase[];
  availablePhases: Phase[];
  categories: PhaseCategory[];
  loading: boolean;
  loadingError: string | null;
  onAddPhase: () => void;
  onAddExistingPhase: (phaseId: string) => void;
  onEditPhase: (phase: Phase) => void;
  onDeletePhase: (phaseId: string) => void;
  onMovePhase: (fromIndex: number, toIndex: number) => Promise<void>;
  onRemovePhase: (phaseId: string, phaseName: string) => Promise<void>;
  onDragEnd: (result: any) => void;
  onRetry: () => void;
  companyId?: string;
}

export function PhaseManagementMain({
  activePhases,
  availablePhases,
  categories,
  loading,
  loadingError,
  onAddPhase,
  onAddExistingPhase,
  onEditPhase,
  onDeletePhase,
  onMovePhase,
  onRemovePhase,
  onDragEnd,
  onRetry,
  companyId
}: PhaseManagementMainProps) {
  
  // Show initialization card if we have serious data issues
  const showInitializationCard = !loading && (
    activePhases.length === 0 || 
    (activePhases.length + availablePhases.length) < 15
  );

  return (
    <div className="space-y-6">
      {/* Phase Initialization Card - shown when data is insufficient */}
      {showInitializationCard && companyId && (
        <PhaseInitializationCard 
          companyId={companyId}
          onInitializationComplete={onRetry}
        />
      )}

      {/* Main Phase Management Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        <AvailablePhasesCard
          phases={availablePhases}
          categories={categories}
          loading={loading}
          loadingError={loadingError}
          onAddPhase={onAddPhase}
          onAddExistingPhase={onAddExistingPhase}
          onAddAllPhases={async (phaseIds) => {
            // Simple implementation - add each phase individually
            for (const phaseId of phaseIds) {
              await onAddExistingPhase(phaseId);
            }
          }}
          onRetry={onRetry}
        />
        
        <ActivePhasesCard
          phases={activePhases}
          categories={categories}
          loading={loading}
          loadingError={loadingError}
          onMovePhase={onMovePhase}
          onRemovePhase={onRemovePhase}
          onDragEnd={onDragEnd}
          onRetry={onRetry}
        />
      </div>
    </div>
  );
}
