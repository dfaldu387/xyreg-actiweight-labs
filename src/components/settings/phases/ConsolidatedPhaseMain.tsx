
import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, Plus, RefreshCw, Link, CheckSquare, ArrowRight, ArrowLeft } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ConsolidatedPhase, PhaseCategory } from "@/services/consolidatedPhaseService";
import { CollapsibleCategorySection } from "./CollapsibleCategorySection";
import { PhaseRow } from "./PhaseRow";
import { useTranslation } from "@/hooks/useTranslation";
import { useComplianceSections } from "@/hooks/useComplianceSections";

import { useDependencyData } from "./DependencyVisualizer";

// No Phase name constant - should match noPhaseService.ts
const NO_PHASE_NAME = "No Phase";

interface ConsolidatedPhaseMainProps {
  activePhases: ConsolidatedPhase[];
  availablePhases: ConsolidatedPhase[];
  categories: PhaseCategory[];
  loading: boolean;
  loadingError: string | null;
  companyId: string;
  onAddPhase: () => void;
  onAddExistingPhase: (phaseId: string, phaseName: string) => Promise<boolean>;
  onEditPhase: (phase: ConsolidatedPhase) => void;
  onDeletePhase: (phaseId: string, phaseName: string) => Promise<boolean>;
  onRemovePhase: (phaseId: string, phaseName: string) => Promise<boolean>;
  onManageDocuments: (phaseId: string, phaseName: string) => void;
  onManageDependencies: (phase: ConsolidatedPhase) => void;
  onTogglePhaseStatus?: (phaseId: string, isActive: boolean) => Promise<boolean>;
  onReorderPhases?: (phaseIds: string[]) => Promise<boolean>;
  onReorderCategories?: (categoryIds: string[]) => Promise<boolean>;
  onMovePhaseToSubSection?: (phaseId: string, subSectionId: string | null) => Promise<boolean>;
  onRetry: () => void;
  isSelectionMode?: boolean;
  selectedPhaseIds?: string[];
  onPhaseSelectionChange?: (phaseId: string, selected: boolean) => void;
  onToggleSelectionMode?: () => void;
  onAddAllPhases?: () => Promise<void>;
  onShowPhaseHelp?: (phase: ConsolidatedPhase) => void;
  refreshKey?: number;
}

export function ConsolidatedPhaseMain({
  activePhases,
  availablePhases,
  categories,
  loading,
  loadingError,
  companyId,
  onAddPhase,
  onAddExistingPhase,
  onEditPhase,
  onDeletePhase,
  onRemovePhase,
  onManageDocuments,
  onManageDependencies,
  onTogglePhaseStatus,
  onReorderPhases,
  onReorderCategories,
  onMovePhaseToSubSection,
  onRetry,
  isSelectionMode = false,
  selectedPhaseIds = [],
  onPhaseSelectionChange,
  onToggleSelectionMode,
  onAddAllPhases,
  onShowPhaseHelp,
  refreshKey
}: ConsolidatedPhaseMainProps) {
  const { lang } = useTranslation();
  const { sections: complianceSections, refetch: refreshSections } = useComplianceSections(companyId);

  // Refresh sections when refreshKey changes (triggered by parent after phase edits)
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      refreshSections();
    }
  }, [refreshKey, refreshSections]);

  // Bulk selection state
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [bulkSelectedPhaseIds, setBulkSelectedPhaseIds] = useState<Set<string>>(new Set());
  const [activeBulkMode, setActiveBulkMode] = useState(false);
  const [availableBulkMode, setAvailableBulkMode] = useState(false);

  // Filter out "No Phase" from display - it's a system phase for documents without a specific phase
  const filteredActivePhases = useMemo(() =>
    activePhases.filter(phase => phase.name !== NO_PHASE_NAME),
    [activePhases]
  );

  const filteredAvailablePhases = useMemo(() =>
    availablePhases.filter(phase => phase.name !== NO_PHASE_NAME),
    [availablePhases]
  );

  // Use dependency data to show upstream dependencies - include all phases to resolve names
  const allPhases = [...filteredActivePhases, ...filteredAvailablePhases];
  const { getUpstreamDependencies } = useDependencyData({ phases: allPhases, companyId });

  // DnD sensors for category reordering
  const categorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Group active phases by category with stable category info
  const activeCategoryGroups = useMemo(() => {
    const groups: { categoryId: string; categoryName: string; phases: ConsolidatedPhase[] }[] = [];
    const groupMap = new Map<string, ConsolidatedPhase[]>();
    const categoryMap = new Map<string, { id: string; name: string; position: number }>();

    for (const phase of filteredActivePhases) {
      const catName = phase.category?.name || 'No category';
      const catId = phase.category?.id || 'no_category';
      if (!groupMap.has(catName)) {
        groupMap.set(catName, []);
        categoryMap.set(catName, {
          id: catId,
          name: catName,
          position: phase.category?.position ?? 999
        });
      }
      groupMap.get(catName)!.push(phase);
    }

    for (const [catName, phases] of groupMap) {
      const catInfo = categoryMap.get(catName)!;
      groups.push({ categoryId: catInfo.id, categoryName: catName, phases });
    }

    // Sort by category position
    groups.sort((a, b) => {
      const posA = categoryMap.get(a.categoryName)?.position ?? 999;
      const posB = categoryMap.get(b.categoryName)?.position ?? 999;
      return posA - posB;
    });

    return groups;
  }, [filteredActivePhases]);

  // Group available phases by category
  const availableCategoryGroups = useMemo(() => {
    const groups: { categoryId: string; categoryName: string; phases: ConsolidatedPhase[] }[] = [];
    const groupMap = new Map<string, ConsolidatedPhase[]>();
    const categoryMap = new Map<string, { id: string; name: string; position: number }>();

    for (const phase of filteredAvailablePhases) {
      const catName = phase.category?.name || 'Uncategorized';
      const catId = phase.category?.id || 'uncategorized';
      if (!groupMap.has(catName)) {
        groupMap.set(catName, []);
        categoryMap.set(catName, {
          id: catId,
          name: catName,
          position: phase.category?.position ?? 999
        });
      }
      groupMap.get(catName)!.push(phase);
    }

    for (const [catName, phases] of groupMap) {
      const catInfo = categoryMap.get(catName)!;
      groups.push({ categoryId: catInfo.id, categoryName: catName, phases });
    }

    groups.sort((a, b) => {
      const posA = categoryMap.get(a.categoryName)?.position ?? 999;
      const posB = categoryMap.get(b.categoryName)?.position ?? 999;
      return posA - posB;
    });

    return groups;
  }, [filteredAvailablePhases]);

  const [localActiveCategoryGroups, setLocalActiveCategoryGroups] = useState(activeCategoryGroups);
  React.useEffect(() => {
    setLocalActiveCategoryGroups(activeCategoryGroups);
  }, [activeCategoryGroups]);

  const handleCategoryDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const oldIndex = localActiveCategoryGroups.findIndex(g => g.categoryId === active.id);
    const newIndex = localActiveCategoryGroups.findIndex(g => g.categoryId === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newGroups = arrayMove(localActiveCategoryGroups, oldIndex, newIndex);
      setLocalActiveCategoryGroups(newGroups);

      if (onReorderCategories) {
        const categoryIds = newGroups.map(g => g.categoryId);
        await onReorderCategories(categoryIds);
      }
    }
  };

  // Bulk selection handlers
  const toggleBulkSelection = () => {
    setBulkSelectionMode(!bulkSelectionMode);
    setBulkSelectedPhaseIds(new Set()); // Clear selections when toggling mode
  };

  const handleBulkPhaseSelection = (phaseId: string, selected: boolean) => {
    setBulkSelectedPhaseIds(prev => {
      const newSelection = new Set(prev);
      if (selected) {
        newSelection.add(phaseId);
      } else {
        newSelection.delete(phaseId);
      }
      return newSelection;
    });
  };

  const handleBulkMoveToActive = async () => {
    const phasesToMove = Array.from(bulkSelectedPhaseIds);
    for (const phaseId of phasesToMove) {
      const phase = filteredAvailablePhases.find(p => p.id === phaseId);
      if (phase && onTogglePhaseStatus) {
        await onTogglePhaseStatus(phaseId, true);
      }
    }
    setBulkSelectedPhaseIds(new Set());
  };

  const handleBulkMoveToAvailable = async () => {
    const phasesToMove = Array.from(bulkSelectedPhaseIds);
    for (const phaseId of phasesToMove) {
      const phase = filteredActivePhases.find(p => p.id === phaseId);
      if (phase && onTogglePhaseStatus) {
        await onTogglePhaseStatus(phaseId, false);
      }
    }
    setBulkSelectedPhaseIds(new Set());
  };

  // Count selected phases in each section
  const selectedInActive = Array.from(bulkSelectedPhaseIds).filter(id =>
    filteredActivePhases.some(p => p.id === id)
  ).length;
  const selectedInAvailable = Array.from(bulkSelectedPhaseIds).filter(id =>
    filteredAvailablePhases.some(p => p.id === id)
  ).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center !p-6">
          <LoadingSpinner className="mr-2" />
          {lang('lifecyclePhases.main.loadingPhaseData')}
        </CardContent>
      </Card>
    );
  }

  if (loadingError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">{lang('lifecyclePhases.main.errorLoadingPhases')}</h3>
            <p className="text-muted-foreground">{loadingError}</p>
          </div>
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {lang('lifecyclePhases.main.tryAgain')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Phases */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {lang('lifecyclePhases.main.activeCompanyPhases')}
                <Badge variant="secondary">{filteredActivePhases.length}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {lang('lifecyclePhases.main.activeDescription')}
              </p>
            </div>
            <div className="flex gap-2">
             <Button
                variant={activeBulkMode ? "default" : "outline"}
                onClick={() => {
                  setActiveBulkMode(!activeBulkMode);
                  setAvailableBulkMode(false); // ensure only one bulk mode at a time
                  setBulkSelectedPhaseIds(new Set());
                }}
                disabled={filteredActivePhases.length === 0}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                {activeBulkMode ? lang('lifecyclePhases.main.exitBulkMode') : lang('lifecyclePhases.main.selectPhases')}
              </Button>
              {!activeBulkMode && (
                <>
                  <Button
                    variant={isSelectionMode ? "default" : "outline"}
                    onClick={onToggleSelectionMode}
                    size="sm"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    {isSelectionMode ? lang('lifecyclePhases.main.exitDependencies') : lang('lifecyclePhases.main.manageDependencies')}
                  </Button>
                  {/* <Button onClick={onAddPhase}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Phase
                  </Button> */}
                </>
              )}
            </div>
          </div>

          {/* Bulk Selection Info and Actions */}
          {activeBulkMode && (
            <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-primary">
                <CheckSquare className="h-4 w-4" />
                <span className="font-medium">
                  {bulkSelectedPhaseIds.size} {bulkSelectedPhaseIds.size !== 1 ? lang('lifecyclePhases.main.phasesSelected') : lang('lifecyclePhases.main.phaseSelected')}
                </span>
                {selectedInActive > 0 && (
                  <span className="text-muted-foreground">• {selectedInActive} {lang('lifecyclePhases.main.active')}</span>
                )}
                {selectedInAvailable > 0 && (
                  <span className="text-muted-foreground">• {selectedInAvailable} {lang('lifecyclePhases.main.available')}</span>
                )}
              </div>
              <div className="flex gap-2">
                {selectedInActive > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkMoveToAvailable}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {lang('lifecyclePhases.main.moveToAvailable')}
                  </Button>
                )}
                {bulkSelectedPhaseIds.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBulkSelectedPhaseIds(new Set())}
                  >
                    {lang('lifecyclePhases.main.clearSelection')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Selection Mode Info */}
          {isSelectionMode && !activeBulkMode && (
            <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-primary">
                <Link className="h-4 w-4" />
                <span className="font-medium">
                  {selectedPhaseIds.length} {selectedPhaseIds.length !== 1 ? lang('lifecyclePhases.main.phasesSelected') : lang('lifecyclePhases.main.phaseSelected')}
                </span>
                {selectedPhaseIds.length === 2 && (
                  <span className="text-muted-foreground">• {lang('lifecyclePhases.main.readyToCreateDependency')}</span>
                )}
              </div>
              {selectedPhaseIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectedPhaseIds.forEach(id => onPhaseSelectionChange?.(id, false))}
                >
                  {lang('lifecyclePhases.main.clearSelection')}
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredActivePhases.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{lang('lifecyclePhases.main.noActivePhases')}</p>
              <Button onClick={onAddPhase} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                {lang('lifecyclePhases.main.addFirstPhase')}
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={categorySensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCategoryDragEnd}
            >
              <SortableContext
                items={localActiveCategoryGroups.map(g => g.categoryId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {localActiveCategoryGroups.map((group) => {
                    return (
                    <CollapsibleCategorySection
                      key={group.categoryId}
                      category={{
                        id: group.categoryId,
                        name: group.categoryName,
                        position: 0,
                        company_id: companyId
                      }}
                      phases={[...group.phases].sort((a, b) => a.position - b.position)}
                      allPhases={filteredActivePhases}
                      companyId={companyId}
                      subSections={complianceSections}

                      onEdit={onEditPhase}
                      onDelete={onDeletePhase}
                      onRemove={onRemovePhase}
                      onManageDocuments={onManageDocuments}
                      onManageDependencies={onManageDependencies}
                      onToggleStatus={onTogglePhaseStatus}
                      onReorderPhases={onReorderPhases}
                      onMovePhaseToSubSection={onMovePhaseToSubSection}
                      isSelectionMode={activeBulkMode || isSelectionMode}
                      selectedPhaseIds={activeBulkMode ? Array.from(bulkSelectedPhaseIds) : selectedPhaseIds}
                      onPhaseSelectionChange={activeBulkMode ? handleBulkPhaseSelection : onPhaseSelectionChange}
                      showDependencies={true}
                      isInActiveSection={true}
                      forceExpand={activeBulkMode}
                      onShowPhaseHelp={onShowPhaseHelp}
                      isCategoryDraggable={true}
                    />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Available Phases */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {lang('lifecyclePhases.main.availablePhases')}
                <Badge variant="secondary">{filteredAvailablePhases.length}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {lang('lifecyclePhases.main.availableDescription')}
              </p>
            </div>
            <div className="flex gap-2">
              {!availableBulkMode && (
                <>
                  <Button
                    onClick={() => {
                      setAvailableBulkMode(true);
                      setActiveBulkMode(false); // ensure only one bulk mode at a time
                      setBulkSelectedPhaseIds(new Set()); // Start with nothing selected
                    }}
                    variant="outline"
                    disabled={filteredAvailablePhases.length === 0}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    {lang('lifecyclePhases.main.selectPhases')}
                  </Button>
                  <Button onClick={onAddPhase}>
                    <Plus className="h-4 w-4 mr-2" />
                    {lang('lifecyclePhases.main.createNew')}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Bulk Selection Actions for Available section */}
          {availableBulkMode && (
            <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-primary">
                <CheckSquare className="h-4 w-4" />
                <span className="text-muted-foreground">{lang('lifecyclePhases.main.selectToMoveToActive')}</span>
              </div>
              <div className="flex gap-2">
              {selectedInAvailable > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await handleBulkMoveToActive();
                    setAvailableBulkMode(false); // <-- Exit bulk mode after moving
                    setBulkSelectedPhaseIds(new Set()); // Clear selection
                  }}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {lang('lifecyclePhases.main.moveToActive')}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAvailableBulkMode(false);
                  setBulkSelectedPhaseIds(new Set());
                }}
              >
                {lang('lifecyclePhases.main.clearSelection')}
              </Button>
            </div>
          </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredAvailablePhases.length > 0 ? (
            <div className="space-y-4">
              {availableCategoryGroups.map((group) => {
                return (
                <CollapsibleCategorySection
                  key={group.categoryId}
                  category={{
                    id: group.categoryId,
                    name: group.categoryName,
                    position: 0,
                    company_id: companyId
                  }}
                  phases={[...group.phases].sort((a, b) => a.position - b.position)}
                  allPhases={filteredAvailablePhases}
                  companyId={companyId}
                  subSections={complianceSections}
                  onEdit={onEditPhase}
                  onDelete={onDeletePhase}
                  onRemove={onRemovePhase}
                  onManageDocuments={onManageDocuments}
                  onManageDependencies={onManageDependencies}
                  onToggleStatus={onTogglePhaseStatus}
                  onReorderPhases={onReorderPhases}
                  onMovePhaseToSubSection={onMovePhaseToSubSection}
                  isSelectionMode={availableBulkMode || isSelectionMode}
                  selectedPhaseIds={availableBulkMode ? Array.from(bulkSelectedPhaseIds) : selectedPhaseIds}
                  onPhaseSelectionChange={availableBulkMode ? handleBulkPhaseSelection : onPhaseSelectionChange}
                  showDependencies={false}
                  isInActiveSection={false}
                  forceExpand={availableBulkMode}
                  onShowPhaseHelp={onShowPhaseHelp}
                />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>{lang('lifecyclePhases.main.noAvailablePhases')}</p>
              <p className="text-sm">{lang('lifecyclePhases.main.createToGetStarted')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
