import React, { useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, GripVertical, Link2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KeyFeature } from '@/utils/keyFeaturesNormalizer';

interface AvailableComponent {
  name: string;
  description: string;
}

interface FeatureComponentLinkerProps {
  features: KeyFeature[];
  components: AvailableComponent[];
  onFeaturesChange: (features: KeyFeature[]) => void;
}

export function FeatureComponentLinker({
  features,
  components,
  onFeaturesChange,
}: FeatureComponentLinkerProps) {
  const onDragEnd = useCallback((result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination || destination.droppableId === 'components-source') return;

    const featureIndex = parseInt(destination.droppableId.replace('feature-', ''), 10);
    const feature = features[featureIndex];
    if (!feature) return;

    const componentName = draggableId.replace('comp-', '');
    const existing = feature.linkedComponentNames || [];
    if (existing.includes(componentName)) return;

    const updated = features.map((f, i) =>
      i === featureIndex
        ? { ...f, linkedComponentNames: [...existing, componentName] }
        : f
    );
    onFeaturesChange(updated);
  }, [features, onFeaturesChange]);

  const handleRemoveLink = useCallback((featureIndex: number, componentName: string) => {
    const updated = features.map((f, i) =>
      i === featureIndex
        ? { ...f, linkedComponentNames: (f.linkedComponentNames || []).filter(n => n !== componentName) }
        : f
    );
    onFeaturesChange(updated);
  }, [features, onFeaturesChange]);

  if (features.length === 0 || components.length === 0) return null;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          Link Components to Features
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Drag components from the left and drop them onto features on the right.
        </p>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-[2fr_1fr] gap-4">
            {/* Left column: features as drop targets */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Features</p>
              <ScrollArea className="h-[320px]">
                <div className="space-y-2 pr-2">
                  {features.map((feature, fIndex) => (
                    <Droppable key={fIndex} droppableId={`feature-${fIndex}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`rounded-md border p-3 transition-colors ${
                            snapshot.isDraggingOver
                              ? 'bg-primary/5 border-primary/50'
                              : 'bg-card border-border'
                          }`}
                        >
                          <div className="text-sm font-medium text-foreground mb-1.5">{feature.name}</div>
                          <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                            {(feature.linkedComponentNames || []).map((compName) => (
                              <Badge
                                key={compName}
                                variant="secondary"
                                className="text-xs flex items-center gap-1 pr-1"
                              >
                                {compName}
                                <button
                                  onClick={() => handleRemoveLink(fIndex, compName)}
                                  className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                            {(feature.linkedComponentNames || []).length === 0 && (
                              <span className="text-xs text-muted-foreground italic">Drop components here</span>
                            )}
                          </div>
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right column: components source */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Components</p>
              <Droppable droppableId="components-source" isDropDisabled>
                {(provided) => (
                  <ScrollArea className="h-[320px]">
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-1.5 pr-2"
                    >
                      {components.map((comp, index) => (
                        <Draggable
                          key={comp.name}
                          draggableId={`comp-${comp.name}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors cursor-grab active:cursor-grabbing ${
                                snapshot.isDragging
                                  ? 'bg-primary/10 border-primary shadow-md'
                                  : 'bg-card hover:bg-muted/50 border-border'
                              }`}
                            >
                              <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium truncate text-foreground">{comp.name}</div>
                                {comp.description && (
                                  <div className="text-xs text-muted-foreground truncate">{comp.description}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </ScrollArea>
                )}
              </Droppable>
            </div>
          </div>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}
