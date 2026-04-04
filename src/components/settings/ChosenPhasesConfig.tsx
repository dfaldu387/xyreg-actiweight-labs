
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { GripVertical, X, Plus } from 'lucide-react';

interface Phase {
  id: string;
  name: string;
  position: number;
}

interface ChosenPhasesConfigProps {
  companyId: string;
  onUpdate?: () => void;
}

export function ChosenPhasesConfig({ companyId, onUpdate }: ChosenPhasesConfigProps) {
  const [chosenPhases, setChosenPhases] = useState<Phase[]>([]);
  const [availablePhases, setAvailablePhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    loadPhases();
  }, [companyId]);

  const loadPhases = async () => {
    setIsLoading(true);
    try {
      // Load chosen phases - FIXED: Use company_phases
      const { data: chosen, error: chosenError } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(id, name)
        `)
        .eq('company_id', companyId)
        .order('position');

      if (chosenError) throw chosenError;

      const chosenList = (chosen || []).map(item => ({
        id: (item.company_phases as any).id,
        name: (item.company_phases as any).name,
        position: item.position
      }));

      setChosenPhases(chosenList);

      // Load all available phases for this company
      const { data: allPhases, error: allError } = await supabase
        .from('company_phases')
        .select('id, name, position')
        .eq('company_id', companyId)
        .order('position');

      if (allError) throw allError;

      // Filter out already chosen phases
      const chosenIds = new Set(chosenList.map(p => p.id));
      const available = (allPhases || []).filter(phase => !chosenIds.has(phase.id));
      setAvailablePhases(available);

    } catch (error) {
      console.error('Error loading phases:', error);
      toast.error('Failed to load phases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || isReordering) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;

    setIsReordering(true);
    
    try {
      // Optimistically update UI
      const items = Array.from(chosenPhases);
      const [reorderedItem] = items.splice(sourceIndex, 1);
      items.splice(destinationIndex, 0, reorderedItem);
      
      // Update positions in the reordered array
      const reorderedPhases = items.map((phase, index) => ({
        ...phase,
        position: index
      }));
      
      setChosenPhases(reorderedPhases);

      // Use the new safe reordering function
      const phaseIds = reorderedPhases.map(phase => phase.id);
      const { data: success, error } = await supabase.rpc('safe_reorder_company_phases', {
        target_company_id: companyId,
        phase_ids: phaseIds
      });

      if (error || !success) {
        throw new Error(error?.message || 'Failed to reorder phases');
      }

      toast.success('Phase order updated successfully');
      onUpdate?.();
    } catch (error) {
      console.error('Error reordering phases:', error);
      toast.error('Failed to update phase order');
      // Revert changes on error
      await loadPhases();
    } finally {
      setIsReordering(false);
    }
  };

  const addPhase = async (phaseId: string) => {
    try {
      const nextPosition = chosenPhases.length;

      const { error } = await supabase
        .from('company_chosen_phases')
        .insert({
          company_id: companyId,
          phase_id: phaseId,
          position: nextPosition
        });

      if (error) throw error;

      toast.success('Phase added');
      loadPhases();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding phase:', error);
      toast.error('Failed to add phase');
    }
  };

  const removePhase = async (phaseId: string) => {
    try {
      const { error } = await supabase
        .from('company_chosen_phases')
        .delete()
        .eq('company_id', companyId)
        .eq('phase_id', phaseId);

      if (error) throw error;

      toast.success('Phase removed');
      loadPhases();
      onUpdate?.();
    } catch (error) {
      console.error('Error removing phase:', error);
      toast.error('Failed to remove phase');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Phases ({chosenPhases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="chosen-phases">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {chosenPhases.map((phase, index) => (
                    <Draggable key={phase.id} draggableId={phase.id} index={index} isDragDisabled={isReordering}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 p-3 bg-muted rounded-lg transition-colors ${
                            snapshot.isDragging ? 'bg-muted/80 shadow-lg' : ''
                          } ${isReordering ? 'opacity-50' : ''}`}
                        >
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="flex-1">{phase.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removePhase(phase.id)}
                            disabled={isReordering}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {isReordering && (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      Updating phase order...
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      {availablePhases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Non-Active Phases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availablePhases.map((phase) => (
                <div key={phase.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <span>{phase.name}</span>
                  <Button
                    size="sm"
                    onClick={() => addPhase(phase.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
