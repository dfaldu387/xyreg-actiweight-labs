
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, X, ArrowUp, ArrowDown, Workflow, ArrowRight } from "lucide-react";
import { Phase, PhaseCategory } from "./ConsolidatedPhaseDataService";

interface ActivePhasesCardProps {
  phases: Phase[];
  categories: PhaseCategory[];
  loading: boolean;
  loadingError: string | null;
  onMovePhase: (fromIndex: number, toIndex: number) => Promise<void>;
  onRemovePhase: (phaseId: string, phaseName: string) => Promise<void>;
  onDragEnd: (result: any) => void;
  onRetry: () => void;
}

export function ActivePhasesCard({
  phases,
  categories,
  loading,
  loadingError,
  onMovePhase,
  onRemovePhase,
  onDragEnd,
  onRetry
}: ActivePhasesCardProps) {
  
  const handleMoveUp = async (index: number) => {
    if (index > 0) {
      await onMovePhase(index, index - 1);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index < phases.length - 1) {
      await onMovePhase(index, index + 1);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Phases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadingError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Phases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <p className="text-destructive mb-4">{loadingError}</p>
            <Button onClick={onRetry} size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Phases ({phases.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="active-phases">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {phases.map((phase, index) => (
                  <Draggable key={phase.id} draggableId={phase.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-3 p-3 bg-muted rounded-lg transition-colors ${
                          snapshot.isDragging ? 'bg-muted/80 shadow-lg' : ''
                        }`}
                      >
                        <div {...provided.dragHandleProps}>
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="flex-1 flex items-center gap-2">
                          {phase.name}
                          <div className="flex gap-1">
                            {phase.category_id && (
                              <Badge variant="outline" className="text-xs font-semibold bg-purple-50 text-purple-700 border-purple-200">
                                {categories.find(cat => cat.id === phase.category_id)?.name || 'Unknown Category'}
                              </Badge>
                            )}
                          </div>
                        </span>
                        
                        {/* Move buttons */}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === phases.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Only show remove button for deletable/custom phases */}
                        {(phase.is_deletable !== false && !phase.is_predefined_core_phase) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemovePhase(phase.id, phase.name)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        {phases.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No active phases configured
          </div>
        )}
      </CardContent>
    </Card>
  );
}
