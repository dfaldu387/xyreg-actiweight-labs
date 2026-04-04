import React from "react";
import { EnhancedPhaseFormDialog } from "./EnhancedPhaseFormDialog";
import { BulkDocumentImportDialog } from "../BulkDocumentImportDialog";
import { PhaseCleanupDialog } from "./PhaseCleanupDialog";
import { DocumentTransferDialog } from "./DocumentTransferDialog";
import { Phase, PhaseCategory } from "./ConsolidatedPhaseDataService";

interface PhaseManagementDialogsProps {
  companyId: string | null;
  formOpen: boolean;
  setFormOpen: (open: boolean) => void;
  editingPhase: Phase | null;
  setEditingPhase: (phase: Phase | null) => void;
  categories: PhaseCategory[];
  onFormSuccess: () => Promise<void>;
  importDialogOpen: boolean;
  setImportDialogOpen: (open: boolean) => void;
  cleanupDialogOpen: boolean;
  setCleanupDialogOpen: (open: boolean) => void;
  transferDialogOpen: boolean;
  setTransferDialogOpen: (open: boolean) => void;
  onCleanupComplete: () => void;
  loadData: () => Promise<void>;
}

export function PhaseManagementDialogs({
  companyId,
  formOpen,
  setFormOpen,
  editingPhase,
  setEditingPhase,
  categories,
  onFormSuccess,
  importDialogOpen,
  setImportDialogOpen,
  cleanupDialogOpen,
  setCleanupDialogOpen,
  transferDialogOpen,
  setTransferDialogOpen,
  onCleanupComplete,
  loadData
}: PhaseManagementDialogsProps) {
  if (!companyId) return null;

  return (
    <>
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
        onSuccess={onFormSuccess}
        companyId={companyId}
      />

      {/* Bulk Document Import Dialog */}
      <BulkDocumentImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        companyId={companyId}
        onImportComplete={loadData}
      />

      {/* Phase Cleanup Dialog */}
      <PhaseCleanupDialog
        open={cleanupDialogOpen}
        onOpenChange={setCleanupDialogOpen}
        companyId={companyId}
        onCleanupComplete={onCleanupComplete}
      />

      {/* Document Transfer Dialog */}
      <DocumentTransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        companyId={companyId}
        onTransferComplete={onCleanupComplete}
      />
    </>
  );
}
