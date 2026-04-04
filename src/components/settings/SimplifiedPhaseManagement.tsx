
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PhaseManagementHeader } from "./phases/PhaseManagementHeader";
import { PhaseStatistics } from "./phases/PhaseStatistics";
import { PhaseManagementMain } from "./phases/PhaseManagementMain";
import { PhaseManagementDialogs } from "./phases/PhaseManagementDialogs";
import { usePhaseManagementData } from "@/hooks/usePhaseManagementData";
import { usePhaseManagementOperations } from "@/hooks/usePhaseManagementOperations";
import { useAutoDocumentSync } from "@/hooks/useAutoDocumentSync";
import { Phase } from "@/components/settings/phases/ConsolidatedPhaseDataService";

export function SimplifiedPhaseManagement() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  // Use data management hook
  const {
    companyId,
    activePhases,
    setActivePhases,
    availablePhases,
    categories,
    loading,
    loadingError,
    loadData
  } = usePhaseManagementData();

  // Use auto-sync hook for automatic document synchronization
  const { isSyncing } = useAutoDocumentSync({
    companyId: companyId || '',
    onSyncComplete: () => {
      console.log('[SimplifiedPhaseManagement] Auto-sync completed');
      // Refresh the data when auto-sync completes to ensure UI is up to date
      loadData();
    }
  });

  const {
    handleAddExistingPhase,
    handleRemovePhase,
    handleMovePhase,
    handleDragEnd,
    handleDeletePhase
  } = usePhaseManagementOperations({
    companyId,
    activePhases,
    availablePhases,
    setActivePhases,
    loadData
  });

  const handleEditPhase = (phase: Phase) => {
    setEditingPhase(phase);
    setFormOpen(true);
  };

  const handleFormSuccess = async () => {
    await loadData();
    setFormOpen(false);
    setEditingPhase(null);
  };

  const handleCleanupComplete = () => {
    loadData();
  };

  if (!companyId) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Loading company information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phase Import and Management Header */}
      <PhaseManagementHeader
        onOpenCleanupDialog={() => setCleanupDialogOpen(true)}
        onOpenTransferDialog={() => setTransferDialogOpen(true)}
        onOpenImportDialog={() => setImportDialogOpen(true)}
      />

      {/* Phase Statistics */}
      <PhaseStatistics
        activePhases={activePhases}
        availablePhases={availablePhases}
        categories={categories}
      />

      {/* Main Phase Management */}
      <PhaseManagementMain
        activePhases={activePhases}
        availablePhases={availablePhases}
        categories={categories}
        loading={loading}
        loadingError={loadingError}
        companyId={companyId}
        onAddPhase={() => {
          setEditingPhase(null);
          setFormOpen(true);
        }}
        onAddExistingPhase={handleAddExistingPhase}
        onEditPhase={handleEditPhase}
        onDeletePhase={handleDeletePhase}
        onMovePhase={handleMovePhase}
        onRemovePhase={handleRemovePhase}
        onDragEnd={handleDragEnd}
        onRetry={loadData}
      />

      {/* All Dialogs */}
      <PhaseManagementDialogs
        companyId={companyId}
        formOpen={formOpen}
        setFormOpen={setFormOpen}
        editingPhase={editingPhase}
        setEditingPhase={setEditingPhase}
        categories={categories}
        onFormSuccess={handleFormSuccess}
        importDialogOpen={importDialogOpen}
        setImportDialogOpen={setImportDialogOpen}
        cleanupDialogOpen={cleanupDialogOpen}
        setCleanupDialogOpen={setCleanupDialogOpen}
        transferDialogOpen={transferDialogOpen}
        setTransferDialogOpen={setTransferDialogOpen}
        onCleanupComplete={handleCleanupComplete}
        loadData={loadData}
      />
    </div>
  );
}
