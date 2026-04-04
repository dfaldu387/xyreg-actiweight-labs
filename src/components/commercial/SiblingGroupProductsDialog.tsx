import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUpdateSiblingAssignment } from '@/hooks/useSiblingGroups';
import { toast } from 'sonner';
import { Loader2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Product {
  id: string;
  name: string;
  model_reference?: string;
  trade_name?: string;
}

interface SiblingAssignment {
  id: string;
  product_id: string;
  percentage: number;
  position: number;
  products?: Product;
}

interface SortableProductItemProps {
  assignment: SiblingAssignment;
  index: number;
  product: Product | undefined;
  percentage: number;
  isDisabled: boolean;
  onPercentageChange: (id: string, value: string) => void;
}

function SortableProductItem({ 
  assignment, 
  index, 
  product, 
  percentage,
  isDisabled, 
  onPercentageChange 
}: SortableProductItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: assignment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 border rounded-lg bg-background"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {product?.trade_name || product?.name || 'Unknown Product'}
        </div>
        {product?.model_reference && product.model_reference !== product?.name && (
          <div className="text-xs text-muted-foreground truncate">
            {product.model_reference}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={percentage.toFixed(2)}
          onChange={(e) => onPercentageChange(assignment.id, e.target.value)}
          disabled={isDisabled}
          className="w-24 text-right"
        />
        <span className="text-sm font-medium">%</span>
      </div>
    </div>
  );
}

interface SiblingGroupProductsDialogProps {
  open: boolean;
  onClose: () => void;
  groupData: {
    id: string;
    name: string;
    basic_udi_di?: string;
    distribution_pattern?: string;
    product_sibling_assignments?: SiblingAssignment[];
  } | null;
}

export function SiblingGroupProductsDialog({
  open,
  onClose,
  groupData,
}: SiblingGroupProductsDialogProps) {
  const [distributionMethod, setDistributionMethod] = useState<string>('even');
  const [products, setProducts] = useState<SiblingAssignment[]>([]);
  const [customPercentages, setCustomPercentages] = useState<Record<string, number>>({});
  const updateAssignment = useUpdateSiblingAssignment();
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (open && groupData?.product_sibling_assignments) {
      // Sort assignments by position before setting state
      const assignments = [...groupData.product_sibling_assignments].sort(
        (a, b) => a.position - b.position
      );
      setProducts(assignments);
      
      // Determine current distribution method
      const totalPercentage = assignments.reduce((sum, a) => sum + (a.percentage || 0), 0);
      const evenPercentage = 100 / assignments.length;
      const isEven = assignments.every(a => Math.abs((a.percentage || 0) - evenPercentage) < 0.5);
      
      let method = 'even';
      if (isEven) {
        method = 'even';
      } else {
        method = 'empirical_data';
      }
      
      setDistributionMethod(method);
      
      // Calculate initial percentages based on detected method
      const initialPercentages = calculateDistribution(method, assignments);
      setCustomPercentages(initialPercentages);
    }
  }, [open, groupData]);

  const calculateDistribution = (method: string, productsList: SiblingAssignment[]) => {
    const newPercentages: Record<string, number> = {};
    
    switch (method) {
      case 'even':
        const evenValue = 100 / productsList.length;
        productsList.forEach(p => {
          newPercentages[p.id] = Math.round(evenValue * 100) / 100;
        });
        // Adjust for rounding to ensure total is 100
        const evenTotal = Object.values(newPercentages).reduce((sum, val) => sum + val, 0);
        if (evenTotal !== 100 && productsList.length > 0) {
          newPercentages[productsList[0].id] += 100 - evenTotal;
        }
        break;
        
      case 'gaussian_curve':
        // Create a bell curve distribution
        const n = productsList.length;
        if (n === 1) {
          newPercentages[productsList[0].id] = 100;
        } else {
          const values: number[] = [];
          const mean = (n - 1) / 2;
          const stdDev = n / 4;
          
          for (let i = 0; i < n; i++) {
            const gaussianValue = Math.exp(-Math.pow(i - mean, 2) / (2 * Math.pow(stdDev, 2)));
            values.push(gaussianValue);
          }
          
          const sum = values.reduce((a, b) => a + b, 0);
          productsList.forEach((p, i) => {
            newPercentages[p.id] = Math.round((values[i] / sum) * 100 * 100) / 100;
          });
          
          // Adjust for rounding
          const gaussTotal = Object.values(newPercentages).reduce((sum, val) => sum + val, 0);
          if (gaussTotal !== 100 && productsList.length > 0) {
            const maxIndex = values.indexOf(Math.max(...values));
            newPercentages[productsList[maxIndex].id] += 100 - gaussTotal;
          }
        }
        break;
        
      case 'empirical_data':
        // Keep current percentages or custom values
        productsList.forEach(p => {
          newPercentages[p.id] = customPercentages[p.id] ?? p.percentage ?? 0;
        });
        break;
    }
    
    return newPercentages;
  };

  const handleDistributionChange = (method: string) => {
    setDistributionMethod(method);
    // Always calculate percentages when method changes
    const newPercentages = calculateDistribution(method, products);
    setCustomPercentages(newPercentages);
  };

  const handleCustomPercentageChange = (assignmentId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCustomPercentages(prev => ({
      ...prev,
      [assignmentId]: numValue,
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    // Validate total is 100%
    const total = Object.values(customPercentages).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 100) > 0.01) {
      toast.error(`Total percentage must equal 100% (currently ${total.toFixed(2)}%)`);
      return;
    }

    setIsSaving(true);
    try {
      // Prepare all updates
      const updates: Promise<any>[] = [];

      // Update percentages
      Object.entries(customPercentages).forEach(([assignmentId, percentage]) => {
        updates.push(
          updateAssignment.mutateAsync({
            assignmentId,
            data: { percentage },
          })
        );
      });

      // Update positions based on current order
      products.forEach((assignment, index) => {
        updates.push(
          updateAssignment.mutateAsync({
            assignmentId: assignment.id,
            data: { position: index },
          })
        );
      });

      await Promise.all(updates);
      
      toast.success('Distribution updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update distribution');
    } finally {
      setIsSaving(false);
    }
  };

  const totalPercentage = Object.values(customPercentages).reduce((sum, val) => sum + val, 0);
  const isValid = Math.abs(totalPercentage - 100) < 0.01;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {groupData?.name || 'Sibling Group'} - Products & Distribution
          </DialogTitle>
          {groupData?.basic_udi_di && (
            <p className="text-sm text-muted-foreground">{groupData.basic_udi_di}</p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Distribution Method</Label>
            <RadioGroup 
              value={distributionMethod} 
              onValueChange={handleDistributionChange} 
              className="mt-2 space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="empirical_data" id="empirical" />
                <Label htmlFor="empirical" className="font-normal cursor-pointer">
                  Fixed Percentages - Manually define percentage for each variant
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="even" id="even" />
                <Label htmlFor="even" className="font-normal cursor-pointer">
                  Equal Distribution - Split evenly across all variants
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gaussian_curve" id="gaussian" />
                <Label htmlFor="gaussian" className="font-normal cursor-pointer">
                  Gaussian Distribution - Bell curve distribution (most sales in middle variants)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Products in Group</Label>
              <div className="text-sm">
                Total: <span className={isValid ? 'text-success' : 'text-destructive font-semibold'}>
                  {totalPercentage.toFixed(2)}%
                </span>
              </div>
            </div>
            
            <ScrollArea className="h-[300px] pr-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={products.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {products.map((assignment, index) => (
                      <SortableProductItem
                        key={assignment.id}
                        assignment={assignment}
                        index={index}
                        product={assignment.products}
                        percentage={customPercentages[assignment.id] || 0}
                        isDisabled={distributionMethod !== 'empirical_data'}
                        onPercentageChange={handleCustomPercentageChange}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ScrollArea>
          </div>

          {!isValid && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              Warning: Total percentage must equal 100%. Current total: {totalPercentage.toFixed(2)}%
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Distribution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

