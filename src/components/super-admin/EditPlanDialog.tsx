import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X, GripVertical } from "lucide-react";
import { SubscriptionPlan } from "@/hooks/useSubscriptionPlans";
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

interface EditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  plan: SubscriptionPlan | null;
}

interface SortableFeatureItemProps {
  id: string;
  index: number;
  feature: string;
  onFeatureChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

function SortableFeatureItem({ 
  id, 
  index, 
  feature, 
  onFeatureChange, 
  onRemove, 
  canRemove 
}: SortableFeatureItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex gap-2 items-center"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        value={feature}
        onChange={(e) => onFeatureChange(index, e.target.value)}
        placeholder="e.g. Up to 50 users"
        className="flex-1"
      />
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function EditPlanDialog({ open, onOpenChange, onSuccess, plan }: EditPlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [features, setFeatures] = useState<string[]>([""]);
  const [isFeatured, setIsFeatured] = useState(false);

  // Generate stable IDs for sortable items
  const [featureIds, setFeatureIds] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setDescription(plan.description || "");
      setPrice(plan.price.toString());
      const planFeatures = plan.features.length > 0 ? plan.features : [""];
      setFeatures(planFeatures);
      setFeatureIds(planFeatures.map((_, i) => `feature-${Date.now()}-${i}`));
      setIsFeatured(plan.is_featured);
    }
  }, [plan]);

  const handleAddFeature = () => {
    setFeatures([...features, ""]);
    setFeatureIds([...featureIds, `feature-${Date.now()}-${features.length}`]);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
    setFeatureIds(featureIds.filter((_, i) => i !== index));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = featureIds.indexOf(active.id as string);
      const newIndex = featureIds.indexOf(over.id as string);

      setFeatures(arrayMove(features, oldIndex, newIndex));
      setFeatureIds(arrayMove(featureIds, oldIndex, newIndex));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    
    setLoading(true);

    try {
      const filteredFeatures = features.filter(f => f.trim() !== "");
      
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          name,
          description,
          price: parseFloat(price),
          features: filteredFeatures,
          is_featured: isFeatured,
          updated_at: new Date().toISOString(),
        })
        .eq('id', plan.id);

      if (error) throw error;

      toast.success("Plan updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating plan:", error);
      toast.error(error.message || "Failed to update plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Subscription Plan</DialogTitle>
          <DialogDescription>
            Update the plan details. Note: This only updates the database. Stripe product/price won't be modified.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Professional"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the plan"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Monthly Price (EUR) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="29.99"
              required
            />
            <p className="text-xs text-muted-foreground">
              Price is stored in EUR (base currency)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Features</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddFeature}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Feature
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Drag to reorder features
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={featureIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {features.map((feature, index) => (
                    <SortableFeatureItem
                      key={featureIds[index]}
                      id={featureIds[index]}
                      index={index}
                      feature={feature}
                      onFeatureChange={handleFeatureChange}
                      onRemove={handleRemoveFeature}
                      canRemove={features.length > 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="featured">Mark as Featured</Label>
              <p className="text-sm text-muted-foreground">
                Featured plans will be highlighted to users
              </p>
            </div>
            <Switch
              id="featured"
              checked={isFeatured}
              onCheckedChange={setIsFeatured}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
