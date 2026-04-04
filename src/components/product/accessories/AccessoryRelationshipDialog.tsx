import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateProductAccessoryRelationship } from "@/hooks/useProductRelationships";
import { toast } from "sonner";
import { EnhancedProductSelector } from "../relationships/EnhancedProductSelector";

interface AccessoryRelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  mainProductId?: string;
}

export function AccessoryRelationshipDialog({
  open,
  onOpenChange,
  companyId,
  mainProductId,
}: AccessoryRelationshipDialogProps) {
  const [selectedMainProduct, setSelectedMainProduct] = useState<string>(mainProductId || "");
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([]);
  const [selectedAccessoryGroupIds, setSelectedAccessoryGroupIds] = useState<string[]>([]);
  const [relationshipType, setRelationshipType] = useState<"component" | "accessory" | "consumable" | "required" | "optional" | "replacement_part">("component");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPeriod, setRecurringPeriod] = useState<string>("monthly");
  const [initialMultiplier, setInitialMultiplier] = useState<number>(1);
  const [recurringMultiplier, setRecurringMultiplier] = useState<number>(1);
  const [lifecycleDurationMonths, setLifecycleDurationMonths] = useState<number>(12);
  const [revenueAttribution, setRevenueAttribution] = useState<number>(100);

  const createMutation = useCreateProductAccessoryRelationship();

  const handleSubmit = async () => {
    if (!selectedMainProduct || (selectedAccessoryIds.length === 0 && selectedAccessoryGroupIds.length === 0)) {
      toast.error("Please select main product and at least one accessory or group");
      return;
    }

    try {
      // Create relationships for all selected accessories
      const relationshipPromises = selectedAccessoryIds.map(accessoryId => 
        createMutation.mutateAsync({
          company_id: companyId,
          main_product_id: selectedMainProduct,
          accessory_product_id: accessoryId,
          relationship_type: relationshipType,
          revenue_attribution_percentage: revenueAttribution,
          typical_quantity: 1,
          is_required: false,
          initial_multiplier: initialMultiplier,
          recurring_multiplier: isRecurring ? recurringMultiplier : 0,
          recurring_period: isRecurring ? recurringPeriod : "",
          lifecycle_duration_months: lifecycleDurationMonths,
          seasonality_factors: {},
          has_variant_distribution: false,
          distribution_method: 'equal_distribution',
        })
      );

      await Promise.all(relationshipPromises);

      toast.success(`Created ${selectedAccessoryIds.length} accessory relationship(s)`);
      onOpenChange(false);
      // Reset form
      setSelectedAccessoryIds([]);
      setSelectedAccessoryGroupIds([]);
      setIsRecurring(false);
      setRecurringPeriod("monthly");
      setInitialMultiplier(1);
      setRecurringMultiplier(1);
      setLifecycleDurationMonths(12);
      setRevenueAttribution(100);
    } catch (error) {
      console.error("Error creating relationship:", error);
      toast.error("Failed to create relationships");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Accessory Relationship</DialogTitle>
          <DialogDescription>
            Define how accessories are purchased with the main product. You can select individual products or entire sibling groups.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Main Product</Label>
            <EnhancedProductSelector
              companyId={companyId}
              selectedProductIds={selectedMainProduct ? [selectedMainProduct] : []}
              onSelectionChange={(productIds) => setSelectedMainProduct(productIds[0] || "")}
              label="Select main product"
              allowGroupSelection={false}
            />
          </div>

          <div className="space-y-2">
            <EnhancedProductSelector
              companyId={companyId}
              selectedProductIds={selectedAccessoryIds}
              selectedGroupIds={selectedAccessoryGroupIds}
              onSelectionChange={(productIds, groupIds) => {
                setSelectedAccessoryIds(productIds);
                setSelectedAccessoryGroupIds(groupIds || []);
              }}
              excludeProductId={selectedMainProduct}
              label="Select accessories or accessory groups"
              allowGroupSelection={true}
            />
          </div>

          <div className="space-y-2">
            <Label>Relationship Type</Label>
            <Select value={relationshipType} onValueChange={(v: any) => setRelationshipType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="component">Component</SelectItem>
                <SelectItem value="accessory">Accessory</SelectItem>
                <SelectItem value="consumable">Consumable</SelectItem>
                <SelectItem value="required">Required</SelectItem>
                <SelectItem value="optional">Optional</SelectItem>
                <SelectItem value="replacement_part">Replacement Part</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Initial Purchase Multiplier</Label>
            <Input
              type="number"
              value={initialMultiplier}
              onChange={(e) => setInitialMultiplier(Number(e.target.value))}
              placeholder="1"
              min="0"
              step="0.1"
            />
            <p className="text-xs text-muted-foreground">
              How many units are purchased initially (e.g., 1 cable per device)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isRecurring">This is a recurring purchase</Label>
          </div>

          {isRecurring && (
            <>
              <div className="space-y-2">
                <Label>Recurring Period</Label>
                <Select value={recurringPeriod} onValueChange={setRecurringPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Recurring Multiplier</Label>
                <Input
                  type="number"
                  value={recurringMultiplier}
                  onChange={(e) => setRecurringMultiplier(Number(e.target.value))}
                  placeholder="1"
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  How many units per {recurringPeriod} period (e.g., 1 belt per month)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Lifecycle Duration (months)</Label>
                <Input
                  type="number"
                  value={lifecycleDurationMonths}
                  onChange={(e) => setLifecycleDurationMonths(Number(e.target.value))}
                  placeholder="12"
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  How long will this recurring purchase continue
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Revenue Attribution (%)</Label>
            <Input
              type="number"
              value={revenueAttribution}
              onChange={(e) => setRevenueAttribution(Number(e.target.value))}
              placeholder="100"
              min="0"
              max="100"
            />
            <p className="text-xs text-muted-foreground">
              What percentage of accessory revenue to attribute to main product
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Relationship"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
