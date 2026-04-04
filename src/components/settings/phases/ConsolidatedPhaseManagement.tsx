
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PhaseStatistics } from "./PhaseStatistics";
import { ConsolidatedPhaseMain } from "./ConsolidatedPhaseMain";
import { EnhancedPhaseFormDialog } from "./EnhancedPhaseFormDialog";
import { PhaseEditFormDialog } from "./PhaseEditFormDialog";
import { PhaseDependencyDialog } from "./PhaseDependencyDialog";
import { DependencyCreationPanel } from "./DependencyCreationPanel";
import { PhaseDocumentsHelpDialog } from "./PhaseDocumentsHelpDialog";
import { useConsolidatedPhases } from "@/hooks/useConsolidatedPhases";
import { supabase } from "@/integrations/supabase/client";

import { ConsolidatedPhase } from "@/services/consolidatedPhaseService";
import { toast } from "sonner";

interface ConsolidatedPhaseManagementProps {
  companyId: string;
  refreshKey?: number;
}

export function ConsolidatedPhaseManagement({ companyId, refreshKey }: ConsolidatedPhaseManagementProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<ConsolidatedPhase | null>(null);
  const [dependencyDialogOpen, setDependencyDialogOpen] = useState(false);
  const [dependencyPhase, setDependencyPhase] = useState<ConsolidatedPhase | null>(null);
  
  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhaseIds, setSelectedPhaseIds] = useState<string[]>([]);
  const [showDependencyPanel, setShowDependencyPanel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phaseHelpDialogOpen, setPhaseHelpDialogOpen] = useState(false);
  const [phaseHelpPhase, setPhaseHelpPhase] = useState<ConsolidatedPhase | null>(null);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);

  const {
    activePhases,
    availablePhases,
    categories,
    loading,
    error,
    loadData,
    refreshCategories,
    addPhaseToActive,
    removePhaseFromActive,
    reorderPhases,
    reorderCategories,
    createPhase,
    updatePhase,
    deletePhase
  } = useConsolidatedPhases(companyId);

  // Refresh data when refreshKey changes (triggered by parent component)
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const handleEditPhase = (phase: ConsolidatedPhase) => {
    setEditingPhase(phase);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    
    setFormOpen(false);
    setEditingPhase(null);
  };

  // Removed manual reordering - phases now ordered by dependencies

  const handleManageDocuments = (phaseId: string, phaseName: string) => {

  };

  const handleShowPhaseHelp = (phase: ConsolidatedPhase) => {
    setPhaseHelpPhase(phase);
    setPhaseHelpDialogOpen(true);
  };

  const handleManageDependencies = (phase: ConsolidatedPhase) => {
    
    setDependencyPhase(phase);
    setDependencyDialogOpen(true);
  };

  const handleTogglePhaseStatus = async (phaseId: string, shouldBeActive: boolean) => {
    try {
      if (shouldBeActive) {
        return await addPhaseToActive(phaseId, 'Phase');
      } else {
        return await removePhaseFromActive(phaseId, 'Phase');
      }
    } catch (error) {
      console.error('Error toggling phase status:', error);
      return false;
    }
  };

  const handleMovePhaseToSubSection = async (phaseId: string, subSectionId: string | null) => {
    try {
      // No-op for now — multi-section drag not supported
      return;
      return true;
    } catch (error) {
      console.error('Error moving phase to sub-section:', error);
      return false;
    }
  };

  // Selection mode handlers
  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedPhaseIds([]);
    setShowDependencyPanel(false);
  };

  const handlePhaseSelectionChange = (phaseId: string, selected: boolean) => {
    setSelectedPhaseIds(prev => {
      const newSelection = selected 
        ? [...prev, phaseId]
        : prev.filter(id => id !== phaseId);
      
      // Show dependency panel when exactly 2 phases are selected
      setShowDependencyPanel(newSelection.length === 2);
      
      return newSelection;
    });
  };

  const handleDependencyCreated = async () => {
    await loadData();
    setSelectedPhaseIds([]);
    setShowDependencyPanel(false);
    // Keep selection mode active - don't exit automatically
  };

  // Convert ConsolidatedPhase to Phase format for legacy components
  const convertToLegacyPhase = (phase: ConsolidatedPhase) => ({
    id: phase.id,
    name: phase.name,
    description: phase.description,
    position: phase.position,
    company_id: phase.company_id,
    category_id: phase.category_id,
    is_active: phase.is_active,
    is_predefined_core_phase: phase.is_predefined_core_phase ?? false,
    is_deletable: phase.is_deletable ?? true,
    is_custom: phase.is_custom ?? false,
    duration_days: phase.duration_days ?? 14,
    start_date: phase.start_date,
    category: phase.category,
    sub_section_id: phase.sub_section_id,
    compliance_section_ids: phase.compliance_section_ids || []  // Legacy field, sections now use phase_id
  });

  // Convert legacy Phase to ConsolidatedPhase
  const convertFromLegacyPhase = (phase: any): ConsolidatedPhase => ({
    id: phase.id,
    name: phase.name,
    description: phase.description,
    position: phase.position,
    company_id: phase.company_id,
    category_id: phase.category_id,
    is_active: phase.is_active ?? true,
    is_predefined_core_phase: phase.is_predefined_core_phase,
    is_deletable: phase.is_deletable,
    is_custom: phase.is_custom,
    
    category: phase.category
  });

  
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
    <div className="space-y-6" data-tour="phase-list">
      {/* Phase Statistics */}
      <PhaseStatistics
        activePhases={activePhases.map(convertToLegacyPhase)}
        availablePhases={availablePhases.map(convertToLegacyPhase)}
        categories={categories}
      />

      {/* Dependency Creation Panel */}
      {showDependencyPanel && selectedPhaseIds.length === 2 && (
        <div className="fixed bottom-6 right-6 z-50 w-96">
          <DependencyCreationPanel
            selectedPhases={activePhases.filter(p => selectedPhaseIds.includes(p.id))}
            companyId={companyId}
            onClose={() => {
              setShowDependencyPanel(false);
              setSelectedPhaseIds([]);
            }}
            onSuccess={handleDependencyCreated}
          />
        </div>
      )}

      {/* Main Phase Management */}
      <div data-tour="phase-list">
        <ConsolidatedPhaseMain
          activePhases={activePhases}
          availablePhases={availablePhases}
          categories={categories}
          loading={loading}
          loadingError={error}
          companyId={companyId}
          refreshKey={(refreshKey || 0) + localRefreshKey}
        onAddPhase={() => {
          setEditingPhase(null);
          setFormOpen(true);
        }}
        onAddExistingPhase={addPhaseToActive}
        onEditPhase={handleEditPhase}
        onDeletePhase={deletePhase}
        onRemovePhase={removePhaseFromActive}
        onManageDocuments={handleManageDocuments}
        onManageDependencies={handleManageDependencies}
        onTogglePhaseStatus={handleTogglePhaseStatus}
        onReorderPhases={reorderPhases}
        onReorderCategories={reorderCategories}
        onMovePhaseToSubSection={handleMovePhaseToSubSection}
        onRetry={loadData}
        isSelectionMode={isSelectionMode}
        selectedPhaseIds={selectedPhaseIds}
        onPhaseSelectionChange={handlePhaseSelectionChange}
        onToggleSelectionMode={handleToggleSelectionMode}
        onShowPhaseHelp={handleShowPhaseHelp}
      />
      </div>

      {/* Simplified Dialogs - Only Add/Edit */}
      {editingPhase && (
        <PhaseEditFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            
            setFormOpen(open);
            if (!open) {
              setEditingPhase(null);
            }
          }}
          phase={convertToLegacyPhase(editingPhase)}
          activePhases={activePhases.map(convertToLegacyPhase)}
          categories={categories}
          onSubmit={async (phaseId: string, updates) => {
            setIsSubmitting(true);
            try {
              // Convert updates to match ConsolidatedPhase format
              const consolidatedUpdates: any = {
                name: updates.name,
                description: updates.description,
                category_id: updates.categoryId,
                duration_days: updates.duration_days,
                is_continuous_process: false // Always linear now
              };

              await updatePhase(phaseId, consolidatedUpdates);

              // Update section links via phase_id on compliance_document_sections
              if (updates.sectionIds) {
                // Clear old sections linked to this phase
                await (supabase as any).from('compliance_document_sections')
                  .update({ phase_id: null })
                  .eq('phase_id', phaseId);
                // Set new sections
                for (const sectionId of updates.sectionIds) {
                  await (supabase as any).from('compliance_document_sections')
                    .update({ phase_id: phaseId })
                    .eq('id', sectionId);
                }
              }

              // Refresh sections cache so UI updates
              setLocalRefreshKey(prev => prev + 1);
              return true;
            } catch (error) {
              console.error('Error updating phase:', error);
              toast.error('Failed to update phase');
              return false;
            } finally {
              setIsSubmitting(false);
            }
          }}
          isSubmitting={isSubmitting}
          companyId={companyId}
          onCategoriesRefresh={() => { refreshCategories(); }}
        />
      )}
      
      {!editingPhase && formOpen && (
        <EnhancedPhaseFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          phase={null}
          categories={categories}
          onSuccess={() => { loadData(true); setLocalRefreshKey(prev => prev + 1); }}
          onCategoriesRefresh={refreshCategories}
          companyId={companyId}
        />
      )}

      {/* Dependency Management Dialog */}
      {dependencyPhase && (
        <PhaseDependencyDialog
          open={dependencyDialogOpen}
          onOpenChange={setDependencyDialogOpen}
          phase={dependencyPhase}
          availablePhases={activePhases}
          companyId={companyId}
          onDataChange={() => {
            loadData();
            setDependencyDialogOpen(false);
          }}
        />
      )}

      {/* Phase Documents Help Dialog - only for custom phases */}
      {phaseHelpPhase && (
        <PhaseDocumentsHelpDialog
          open={phaseHelpDialogOpen}
          onOpenChange={setPhaseHelpDialogOpen}
          phase={phaseHelpPhase}
          companyId={companyId}
        />
      )}
    </div>
  );
}
