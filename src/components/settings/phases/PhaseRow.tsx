import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { 
  Edit, 
  Trash2, 
  Minus, 
  FileText, 
  Link,
  Clock,
  MoreHorizontal,
  Plus
} from "lucide-react";
import { ConsolidatedPhase } from "@/services/consolidatedPhaseService";
import { usePhaseDependencies } from "@/hooks/usePhaseDependencies";
import { useConsolidatedPhases } from "@/hooks/useConsolidatedPhases";

interface PhaseRowProps {
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
}

export function PhaseRow({
  phase,
  index,
  totalPhases,
  companyId,
  onEdit,
  onDelete,
  onRemove,
  onManageDocuments,
  onManageDependencies,
  onToggleStatus
}: PhaseRowProps) {
  const [showActions, setShowActions] = useState(false);
  
  // PhaseRow should ONLY display data, never calculate
  // All calculations are done by PhaseSchedulingService
  const startDay = phase.calculated_start_day ?? 0;
  
  console.log(`[PhaseRow] Phase "${phase.name}": displaying calculated start day = ${startDay}`);
  
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

  console.log(`[PhaseRow] Displaying phase "${phase.name}" with calculated start day: ${startDay}`);

  return (
    <div className="group flex items-center border-b border-border/40 py-3 px-4 hover:bg-muted/50 transition-colors">
      {/* Left section: phase info - flexible width */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        
        {/* Phase Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h4 className="font-medium text-sm truncate cursor-default">{phase.name}</h4>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-md">
                  <p className="font-medium">{phase.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {phase.category && (
              <Badge variant="outline" className="text-xs shrink-0">
                {phase.category.name}
              </Badge>
            )}
          </div>
          {phase.description && (
            <p className="text-xs text-muted-foreground truncate">
              {phase.description}
            </p>
          )}
        </div>
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

        {/* Dependencies column - fixed width to maintain alignment */}
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
        
        {/* Actions - fixed width */}
        <div className="w-8 flex justify-center">
          <Popover open={showActions} onOpenChange={setShowActions}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="end">
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Phase
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onManageDependencies}>
                  <Link className="h-4 w-4 mr-2" />
                  Dependencies
                </Button>
                {onToggleStatus && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start" 
                    onClick={() => onToggleStatus(phase.id, !phase.is_active)}
                  >
                    {phase.is_active ? (
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
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onRemove}>
                  <Minus className="h-4 w-4 mr-2" />
                  Remove
                </Button>
                {phase.is_deletable && (
                  <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={onDelete}>
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