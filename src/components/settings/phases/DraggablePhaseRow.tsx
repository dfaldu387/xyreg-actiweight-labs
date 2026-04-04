import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Edit,
  Trash2,
  Minus,
  FileText,
  Link,
  Clock,
  MoreHorizontal,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { ConsolidatedPhase } from "@/services/consolidatedPhaseService";
import { usePhaseDependencies } from "@/hooks/usePhaseDependencies";
import { useState, useEffect } from "react";

// Default system phase names from companyInitializationService.ts
// These phases are created during company initialization and should NOT show the help icon
const DEFAULT_PHASE_NAMES = new Set([
  "Concept & Feasibility",
  "Project Initiation & Planning",
  "Requirements & Design Inputs",
  "Design & Development (Output)",
  "Verification & Validation (V&V)",
  "Finalization & Transfer",
  "Regulatory Submission & Approval",
  "Launch & Post-Launch",
  "Risk Management",
  "Technical Documentation",
  "Supplier Management",
  "Post-Market Surveillance",
  "No Phase",
]);

interface DraggablePhaseRowProps {
  phase: ConsolidatedPhase;
  index: number;
  totalPhases: number;
  companyId: string;
  onEdit: () => void;
  onDelete: () => void;
  onRemove: () => void;
  onManageDocuments: () => void;
  onManageDependencies: () => void;
  onToggleStatus?: (phaseId: string, isActive: boolean) => Promise<boolean>;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (phaseId: string, selected: boolean) => void;
  showDependencies?: boolean;
  isInActiveSection?: boolean;
  onShowPhaseHelp?: (phase: ConsolidatedPhase) => void;
  subSectionName?: string;
  hasSectionExpander?: boolean;
  isSectionExpanded?: boolean;
  onToggleSectionExpand?: () => void;
}

export function DraggablePhaseRow({
  phase,
  index,
  totalPhases,
  companyId,
  onEdit,
  onDelete,
  onRemove,
  onManageDocuments,
  onManageDependencies,
  onToggleStatus,
  isSelectionMode = false,
  isSelected = false,
  onSelectionChange,
  showDependencies = true,
  isInActiveSection = false,
  onShowPhaseHelp,
  subSectionName,
  hasSectionExpander = false,
  isSectionExpanded = false,
  onToggleSectionExpand
}: DraggablePhaseRowProps) {
  const [showActions, setShowActions] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: phase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // PhaseRow should ONLY display data, never calculate
  // All calculations are done by PhaseSchedulingService
  const startDay = phase.calculated_start_day ?? 0;
  
  
  
  // For calculated phases, use calculated duration; otherwise use raw duration
  const duration = phase.is_calculated && phase.calculated_end_day !== undefined && phase.calculated_start_day !== undefined
    ? phase.calculated_end_day - phase.calculated_start_day
    : phase.duration_days;

  // Minimal dependency info for display only
  const [phaseDependencies, setPhaseDependencies] = useState<{ incoming: any[]; outgoing: any[] }>({ incoming: [], outgoing: [] });
  const { getPhaseDependencies } = usePhaseDependencies(companyId);

  useEffect(() => {
    const fetchDependencies = async () => {
      const deps = await getPhaseDependencies(phase.id);
      if (deps.success) {
        setPhaseDependencies(deps);
      }
    };
    if (phase.id) {
      fetchDependencies();
    }
  }, [phase.id, getPhaseDependencies]);

  const incomingDeps = phaseDependencies.incoming || [];
  const outgoingDeps = phaseDependencies.outgoing || [];
  const totalDeps = incomingDeps.length + outgoingDeps.length;

  

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group flex items-center border-b border-border/40 min-h-[56px] py-3 px-4 transition-colors ${
        isDragging ? 'opacity-50 z-50' : ''
      } ${
        isSelected ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50'
      }`}
    >
      {/* Selection Checkbox - only in selection mode */}
      {isSelectionMode && (
        <div className="w-6 flex-shrink-0 mr-3 pt-0.5 flex justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectionChange?.(phase.id, !!checked)}
            className="h-4 w-4"
          />
        </div>
      )}

      {/* Phase Title column: FIXED 340px width, draggable by name */}
      <div className="w-[340px] flex-shrink-0 pr-4 flex items-center gap-1">
        {hasSectionExpander ? (
          <button
            type="button"
            className="flex-shrink-0 p-2 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSectionExpand?.();
            }}
          >
            {isSectionExpanded ? (
              <ChevronDown className="h-4 w-4 text-foreground/60" />
            ) : (
              <ChevronRight className="h-4 w-4 text-foreground/60" />
            )}
          </button>
        ) : (
          <div className="w-8 flex-shrink-0" />
        )}
        <div
          className="flex-1 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <h4 className="font-medium text-sm leading-snug whitespace-normal break-words">
            {phase.name}
          </h4>
        </div>
        {/* Help icon - only shown for custom (non-predefined) phases */}
        {!DEFAULT_PHASE_NAMES.has(phase.name) && onShowPhaseHelp && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowPhaseHelp(phase);
                  }}
                  className="flex-shrink-0 mt-0.5"
                >
                  <FileText className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>View phase documents & add documents</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Description column: starts at the same left position for every row, clamp to 3 lines */}
      <div className="flex-1 min-w-0 pr-4 pt-0.5">
        {phase.description ? (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {phase.description}
          </p>
        ) : (
          <span className="text-xs text-muted-foreground/50 italic">No description</span>
        )}
      </div>

      {/* Fixed right section with consistent spacing */}
      <div className="flex items-center gap-4">
        {/* Calculated Start Day column - fixed width, read-only */}
        <div className="text-center w-24">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            <Clock className="h-3 w-3 inline mr-1" />
            Start Day
          </div>
          <div className="text-sm text-blue-600">
            {startDay !== null && startDay !== undefined ? `Day ${startDay}` : 'Day 0'}
          </div>
        </div>
        
        {/* Duration column - fixed width */}
        <div className="text-center w-20">
          <div className="text-xs font-medium text-muted-foreground mb-1">Duration</div>
          <div className="text-sm">
            {duration !== null && duration !== undefined && duration > 0 ? `${duration} days` : '-'}
          </div>
        </div>

        {/* Dependencies column - fixed width, only show for active phases */}
        {showDependencies && (
          <div className="w-16 flex justify-center">
            {totalDeps > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onManageDependencies}
                className="text-xs h-6 px-2"
              >
                <Link className="h-3 w-3 mr-1" />
                {totalDeps} dep{totalDeps !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        )}
        
        {/* Actions - fixed width */}
        <div className="w-8 flex justify-center">
          <Popover open={showActions} onOpenChange={(open) => !isToggling && setShowActions(open)}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                disabled={isToggling}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="end">
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="w-full justify-start" disabled={isToggling} onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Phase
                </Button>
                {showDependencies && (
                  <Button variant="ghost" size="sm" className="w-full justify-start" disabled={isToggling} onClick={onManageDependencies}>
                    <Link className="h-4 w-4 mr-2" />
                    Dependencies
                  </Button>
                )}
                {onToggleStatus && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start" 
                    disabled={isToggling}
                    onClick={async () => {
                      setIsToggling(true);
                      try {
                        await onToggleStatus(phase.id, !isInActiveSection);
                      } finally {
                        setIsToggling(false);
                      }
                    }}
                  >
                    {isToggling ? (
                      <>
                        <LoadingSpinner className="h-4 w-4 mr-2" />
                        {isInActiveSection ? "Making Available..." : "Making Active..."}
                      </>
                    ) : isInActiveSection ? (
                      <>
                        <Minus className="h-4 w-4 mr-2" />
                        Make Non-Active
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Make Active
                      </>
                    )}
                  </Button>
                )}
                <div className="border-t my-1" />
                <Button variant="ghost" size="sm" className="w-full justify-start" disabled={isToggling} onClick={onRemove}>
                  <Minus className="h-4 w-4 mr-2" />
                  Remove
                </Button>
                {phase.is_deletable && (
                  <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" disabled={isToggling} onClick={onDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}