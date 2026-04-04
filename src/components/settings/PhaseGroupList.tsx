
/// <reference types="@hello-pangea/dnd" />

import { Button } from "@/components/ui/button";
import { PhaseGroup } from "@/types/client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Edit2, Trash2, GripVertical } from "lucide-react";

interface PhaseGroupListProps {
  groups: PhaseGroup[];
  onReorder: (groups: PhaseGroup[]) => void;
  onEdit: (group: PhaseGroup) => void;
  onDelete: (groupId: string) => void;
}

export function PhaseGroupList({ groups, onReorder, onEdit, onDelete }: PhaseGroupListProps) {
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(groups);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onReorder(items.map((item, index) => ({ ...item, position: index })));
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="phase-groups">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
            {groups.map((group, index) => (
              <Draggable key={group.id} draggableId={group.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="flex items-center justify-between p-3 bg-background border rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <div {...provided.dragHandleProps} className="cursor-grab">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span>{group.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(group)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {group.is_deletable !== false && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(group.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
