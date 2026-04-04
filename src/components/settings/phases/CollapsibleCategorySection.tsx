import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, CheckSquare, Square } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ConsolidatedPhase, PhaseCategory } from "@/services/consolidatedPhaseService";
import { ComplianceSection } from "@/services/complianceSectionService";
import { DraggablePhaseRow } from "./DraggablePhaseRow";

// Droppable sub-section header — phases can be dragged onto it to join the sub-section
interface CollapsibleCategorySectionProps {
  category: PhaseCategory;
  phases: ConsolidatedPhase[];
  allPhases: ConsolidatedPhase[];
  companyId: string;
  subSections?: ComplianceSection[];
  onEdit: (phase: ConsolidatedPhase) => void;
  onDelete: (phaseId: string, phaseName: string) => Promise<boolean>;
  onRemove: (phaseId: string, phaseName: string) => Promise<boolean>;
  onManageDocuments: (phaseId: string, phaseName: string) => void;
  onManageDependencies: (phase: ConsolidatedPhase) => void;
  onToggleStatus?: (phaseId: string, isActive: boolean) => Promise<boolean>;
  onReorderPhases?: (phaseIds: string[]) => Promise<boolean>;
  onMovePhaseToSubSection?: (phaseId: string, subSectionId: string | null) => Promise<boolean>;
  isSelectionMode?: boolean;
  selectedPhaseIds?: string[];
  onPhaseSelectionChange?: (phaseId: string, selected: boolean) => void;
  showDependencies?: boolean;
  isInActiveSection?: boolean;
  forceExpand?: boolean;
  onShowPhaseHelp?: (phase: ConsolidatedPhase) => void;
  isCategoryDraggable?: boolean;
}

export function CollapsibleCategorySection({
  category,
  phases,
  allPhases,
  companyId,
  subSections = [],
  onEdit,
  onDelete,
  onRemove,
  onManageDocuments,
  onManageDependencies,
  onToggleStatus,
  onReorderPhases,
  onMovePhaseToSubSection,
  isSelectionMode = false,
  selectedPhaseIds = [],
  onPhaseSelectionChange,
  showDependencies = true,
  isInActiveSection = false,
  forceExpand = false,
  onShowPhaseHelp,
  isCategoryDraggable = false
}: CollapsibleCategorySectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled: !isCategoryDraggable });

  const sortableStyle = isCategoryDraggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  } : {};

  const [isExpanded, setIsExpanded] = useState(false);
  const [localPhases, setLocalPhases] = useState(phases);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  // Auto-expand when forceExpand is true (bulk selection mode)
  useEffect(() => {
    if (forceExpand) {
      setIsExpanded(true);
    }
  }, [forceExpand]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activePhase = localPhases.find(p => p.id === activeId);
    if (!activePhase) return;

    // Dropped on another phase — reorder
    const overPhase = localPhases.find(p => p.id === overId);
    if (overPhase) {
      const oldIndex = localPhases.findIndex(p => p.id === activeId);
      const newIndex = localPhases.findIndex(p => p.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newPhases = arrayMove(localPhases, oldIndex, newIndex);
        setLocalPhases(newPhases);

        if (onReorderPhases) {
          const phaseIds = newPhases.map(phase => phase.id);
          await onReorderPhases(phaseIds);
        }
      }
    }
  };

  // Update local phases when props change
  useEffect(() => {
    setLocalPhases(phases);
  }, [phases]);

  const togglePhaseExpand = useCallback((phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  }, []);

  // Get section names for a phase (via phase_id on compliance_document_sections)
  const getSectionNames = useCallback((phase: ConsolidatedPhase): string[] => {
    if (subSections.length === 0) return [];
    // Sections now have phase_id — filter sections that belong to this phase
    const phaseSections = subSections.filter(s => (s as any).phase_id === phase.id);
    if (phaseSections.length > 0) return phaseSections.map(s => s.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    // Fallback: check legacy compliance_section_ids array
    const ids = (phase as any).compliance_section_ids as string[] | undefined;
    if (!ids || ids.length === 0) return [];
    return ids
      .map(id => subSections.find(s => s.id === id)?.name)
      .filter((name): name is string => !!name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [subSections]);

  // Calculate selection state for this category
  const selectedInCategory = phases.filter(p => selectedPhaseIds.includes(p.id)).length;
  const allSelectedInCategory = selectedInCategory === phases.length && phases.length > 0;

  const handleSelectAllInCategory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onPhaseSelectionChange) return;

    const shouldSelect = !allSelectedInCategory;
    phases.forEach(phase => {
      onPhaseSelectionChange(phase.id, shouldSelect);
    });
  };

  if (phases.length === 0) return null;

  const renderPhaseRow = (phase: ConsolidatedPhase) => {
    const globalIndex = allPhases.findIndex(p => p.id === phase.id);
    const sectionNames = getSectionNames(phase);
    const isPhaseExpanded = expandedPhases.has(phase.id);

    return (
      <div key={phase.id}>
        <DraggablePhaseRow
          phase={phase}
          index={globalIndex}
          totalPhases={allPhases.length}
          companyId={companyId}
          onEdit={() => onEdit(phase)}
          onDelete={() => onDelete(phase.id, phase.name)}
          onRemove={() => onRemove(phase.id, phase.name)}
          onManageDocuments={() => onManageDocuments(phase.id, phase.name)}
          onManageDependencies={() => onManageDependencies(phase)}
          onToggleStatus={onToggleStatus}
          isSelectionMode={isSelectionMode}
          isSelected={selectedPhaseIds.includes(phase.id)}
          onSelectionChange={onPhaseSelectionChange}
          showDependencies={showDependencies}
          isInActiveSection={isInActiveSection}
          onShowPhaseHelp={onShowPhaseHelp}
          hasSectionExpander={sectionNames.length > 0}
          isSectionExpanded={isPhaseExpanded}
          onToggleSectionExpand={() => togglePhaseExpand(phase.id)}
        />
        {/* Section names shown indented below the phase when expanded */}
        {sectionNames.length > 0 && isPhaseExpanded && (
          <div className="relative">
            {/* Vertical line aligned below the phase chevron */}
            <div className="absolute left-[2rem] top-0 bottom-2 w-0.5 bg-gray-300 rounded-full" />
            {sectionNames.map((name, idx) => (
              <div key={idx} className="flex items-center gap-2 pl-20 !min-h-[40px] border-b border-border/40 bg-muted/30">
                <span className="w-2 h-2 rounded-full bg-foreground/60 flex-shrink-0 relative z-10" />
                <span className="text-sm text-foreground">{name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={setNodeRef} style={sortableStyle} className="border border-border rounded-lg overflow-hidden">
      {/* Category Header */}
      <div className="flex items-center justify-between p-4 hover:bg-muted/50">
        <button
          type="button"
          className="flex items-center gap-2 font-medium flex-1 text-left"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
          <span
            {...(isCategoryDraggable ? { ...attributes, ...listeners } : {})}
            className={isCategoryDraggable ? "cursor-grab active:cursor-grabbing" : ""}
          >{category.name}</span>
          <Badge variant="secondary" className="ml-2 capitalize">
            {phases.length} phase{phases.length !== 1 ? 's' : ''}
          </Badge>
          {isSelectionMode && selectedInCategory > 0 && (
            <Badge variant="default" className="ml-1">
              {selectedInCategory} selected
            </Badge>
          )}
        </button>

        {/* Select All button - only show in selection mode */}
        {isSelectionMode && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={handleSelectAllInCategory}
          >
            {allSelectedInCategory ? (
              <>
                <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                Deselect All
              </>
            ) : (
              <>
                <Square className="h-3.5 w-3.5 mr-1.5" />
                Select All
              </>
            )}
          </Button>
        )}
      </div>

      {/* Phase Rows */}
      {isExpanded && (
        <div className="relative border-t border-border pl-8">
          {/* Black vertical line for phases */}
          <div className="absolute left-[1.75rem] top-2 bottom-2 w-0.5 bg-gray-200 border border-gray-200 rounded-full" />
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={localPhases.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div>
                {localPhases.map((phase) => renderPhaseRow(phase))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
