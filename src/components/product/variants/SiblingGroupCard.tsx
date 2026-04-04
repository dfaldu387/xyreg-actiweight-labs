import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical, Pencil, Check, X } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DistributionPattern } from "@/types/siblingGroup";
import { toast } from "sonner";
import { useUpdateSiblingAssignment, useUpdateSiblingGroup } from "@/hooks/useSiblingGroups";

export interface SiblingInGroup {
  assignmentId: string;
  productId: string;
  name: string;
  tradeName?: string | null;
  percentage: number;
  position: number;
}

export interface SiblingGroupCardProps {
  groupId: string;
  groupName: string;
  groupDescription?: string;
  distributionPattern: DistributionPattern;
  siblings: SiblingInGroup[];
  onDelete: () => void;
  onUpdateDistributionPattern: (pattern: DistributionPattern) => void;
  basicUdiDi?: string;
  companyId?: string;
}

function SortableSiblingItem({
  sibling,
  onPercentageChange,
  onProductClick,
}: {
  sibling: SiblingInGroup;
  onPercentageChange: (percentage: number) => void;
  onProductClick: (productId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sibling.assignmentId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-background border rounded-lg"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div 
          className="font-medium text-sm truncate cursor-pointer hover:text-primary hover:underline transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onProductClick(sibling.productId);
          }}
        >
          {sibling.name}
        </div>
        {sibling.tradeName && (
          <div className="text-xs text-muted-foreground truncate">
            {sibling.tradeName}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor={`dist-${sibling.assignmentId}`} className="text-xs text-muted-foreground whitespace-nowrap">
          Distribution
        </Label>
        <Input
          id={`dist-${sibling.assignmentId}`}
          type="number"
          min="0"
          max="100"
          step="1"
          value={Math.round(sibling.percentage)}
          onChange={(e) => onPercentageChange(parseFloat(e.target.value) || 0)}
          className="w-20 text-right"
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>
    </div>
  );
}

export function SiblingGroupCard({
  groupId,
  groupName,
  groupDescription,
  distributionPattern,
  siblings: initialSiblings,
  onDelete,
  onUpdateDistributionPattern,
  basicUdiDi,
  companyId,
}: SiblingGroupCardProps) {
  const navigate = useNavigate();
  const [siblings, setSiblings] = useState(initialSiblings);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(groupName);
  
  const updateAssignmentMutation = useUpdateSiblingAssignment();
  const updateGroupMutation = useUpdateSiblingGroup();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setSiblings(initialSiblings);
  }, [initialSiblings]);

  const totalPercentage = siblings.reduce((sum, s) => sum + s.percentage, 0);
  const isValid = Math.abs(totalPercentage - 100) < 0.01;

  // Calculate percentages based on distribution pattern
  const calculateDistribution = (pattern: DistributionPattern, count: number): number[] => {
    if (count === 0) return [];
    
    if (pattern === 'even') {
      // Even distribution
      const basePercentage = Math.floor(100 / count);
      const remainder = 100 - (basePercentage * count);
      const percentages = Array(count).fill(basePercentage);
      
      // Distribute remainder to first items
      for (let i = 0; i < remainder; i++) {
        percentages[i]++;
      }
      
      return percentages;
    } else if (pattern === 'gaussian_curve') {
      // Calculate Gaussian/Normal distribution with proper bell curve
      if (count === 1) return [100];
      
      const mean = (count - 1) / 2; // Center of the distribution
      const stdDev = count / 6; // Standard deviation (captures ~99.7% of data)
      
      // Calculate raw gaussian values for each position
      const rawValues = Array.from({ length: count }, (_, i) => {
        const distance = i - mean;
        return Math.exp(-(distance * distance) / (2 * stdDev * stdDev));
      });
      
      // Normalize to sum to 100 and round
      const sum = rawValues.reduce((a, b) => a + b, 0);
      const percentages = rawValues.map(v => Math.round((v / sum) * 100));
      
      // Adjust rounding errors by modifying the peak value
      const total = percentages.reduce((a, b) => a + b, 0);
      if (total !== 100) {
        const peakIndex = Math.floor(mean); // Center index
        percentages[peakIndex] += (100 - total);
      }
      
      return percentages;
    }
    
    // empirical_data - keep current values
    return siblings.map(s => s.percentage);
  };

  const applyDistributionPattern = async (pattern: DistributionPattern) => {
    const percentages = calculateDistribution(pattern, siblings.length);
    
    // Update all siblings with new percentages
    try {
      await Promise.all(
        siblings.map((sibling, index) =>
          updateAssignmentMutation.mutateAsync({
            assignmentId: sibling.assignmentId,
            data: { percentage: percentages[index] },
          })
        )
      );
      toast.success('Distribution pattern applied');
    } catch (error) {
      console.error('Failed to apply distribution pattern:', error);
      toast.error('Failed to apply distribution pattern');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = siblings.findIndex((item) => item.assignmentId === active.id);
      const newIndex = siblings.findIndex((item) => item.assignmentId === over.id);
      const reordered = arrayMove(siblings, oldIndex, newIndex);
      
      // Update local state optimistically
      setSiblings(reordered);
      
      // Update positions in the database - update all items with new positions
      try {
        await Promise.all(
          reordered.map((item, index) => 
            updateAssignmentMutation.mutateAsync({
              assignmentId: item.assignmentId,
              data: { position: index },
            })
          )
        );
      } catch (error) {
        console.error('Failed to update positions:', error);
        toast.error('Failed to update order');
        // Revert to original order on error
        setSiblings(siblings);
      }
    }
  };

  const handlePercentageChange = (assignmentId: string, percentage: number) => {
    setSiblings((prev) =>
      prev.map((s) =>
        s.assignmentId === assignmentId ? { ...s, percentage } : s
      )
    );

    // Update in database
    updateAssignmentMutation.mutate({
      assignmentId,
      data: { percentage },
    });
  };

  const handleSaveName = async () => {
    if (editedName.trim() && basicUdiDi && companyId) {
      await updateGroupMutation.mutateAsync({
        id: groupId,
        basicUdiDi,
        companyId,
        data: { name: editedName.trim() },
      });
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditedName(groupName);
    setIsEditingName(false);
  };

  // Auto-apply distribution when all percentages are 0 (e.g., newly added products)
  useEffect(() => {
    const allZero = siblings.every(s => s.percentage === 0);
    const needsDistribution = allZero && siblings.length > 0 && distributionPattern !== 'empirical_data';
    
    if (needsDistribution) {
      // Apply distribution after a short delay to ensure component is mounted
      const timer = setTimeout(() => {
        applyDistributionPattern(distributionPattern);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [siblings.length, distributionPattern]);

  return (
    <Card className="border-2 group">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Enter group name..."
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSaveName}
                    className="h-7 w-7 p-0 flex-shrink-0"
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="h-7 w-7 p-0 flex-shrink-0"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{groupName}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingName(true)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {groupDescription && (
                <p className="text-sm text-muted-foreground">{groupDescription}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="flex-shrink-0"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          {/* Products list with drag-and-drop */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Variants in this group ({siblings.length})
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  (sizes/configurations)
                </span>
              </div>
              <div className={`text-sm font-medium ${isValid ? 'text-green-600' : 'text-destructive'}`}>
                Total: {Math.round(totalPercentage)}%
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={siblings.map((s) => s.assignmentId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {siblings.map((sibling) => (
                    <SortableSiblingItem
                      key={sibling.assignmentId}
                      sibling={sibling}
                      onPercentageChange={(percentage) =>
                        handlePercentageChange(sibling.assignmentId, percentage)
                      }
                      onProductClick={(productId) =>
                        navigate(`/app/product/${productId}/device-information`)
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {!isValid && (
              <p className="text-xs text-destructive">
                Percentages must total 100%
              </p>
            )}
          </div>

          {/* Distribution pattern */}
          <div className="space-y-2 pt-2 border-t">
            <div className="space-y-1">
              <Label className="text-sm">Distribution Pattern</Label>
              <p className="text-xs text-muted-foreground">
                Choose how to allocate market share percentages across products in this group
              </p>
            </div>
            <Select
              value={distributionPattern}
              onValueChange={(value: DistributionPattern) => {
                onUpdateDistributionPattern(value);
                // Auto-apply percentages for even and gaussian patterns
                if (value === 'even' || value === 'gaussian_curve') {
                  applyDistributionPattern(value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="even">Even Distribution</SelectItem>
                <SelectItem value="gaussian_curve">Normal Curve (Gaussian)</SelectItem>
                <SelectItem value="empirical_data">Custom (Empirical)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}