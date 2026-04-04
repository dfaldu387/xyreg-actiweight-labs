import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { ProductWithBasicUDI } from "@/hooks/useProductsByBasicUDI";
import type { DistributionPattern } from "@/types/siblingGroup";

interface CreateSiblingGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basicUdiDi: string;
  companyId: string;
  availableProducts: ProductWithBasicUDI[];
}

export function CreateSiblingGroupDialog({
  open,
  onOpenChange,
  basicUdiDi,
  companyId,
  availableProducts,
}: CreateSiblingGroupDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [distributionPattern, setDistributionPattern] = useState<DistributionPattern>("even");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductToggle = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (selectedProducts.size === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the sibling group
      const { data: group, error: groupError } = await supabase
        .from("product_sibling_groups")
        .insert({
          company_id: companyId,
          basic_udi_di: basicUdiDi,
          name: name.trim(),
          description: description.trim() || null,
          distribution_pattern: distributionPattern,
          total_percentage: 100,
          position: 0,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Calculate even distribution for initial percentages
      const evenPercentage = 100 / selectedProducts.size;

      // Create assignments for selected products
      const assignments = Array.from(selectedProducts).map((productId, index) => ({
        sibling_group_id: group.id,
        product_id: productId,
        percentage: evenPercentage,
        position: index,
      }));

      const { error: assignmentsError } = await supabase
        .from("product_sibling_assignments")
        .insert(assignments);

      if (assignmentsError) throw assignmentsError;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["company-basic-udi-groups", companyId] });

      toast.success("Sibling group created successfully");
      
      // Reset form
      setName("");
      setDescription("");
      setDistributionPattern("even");
      setSelectedProducts(new Set());
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating sibling group:", error);
      toast.error("Failed to create sibling group");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Sibling Group</DialogTitle>
          <DialogDescription>
            Create a new group to organize product variants that share the same Basic UDI-DI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Single Pack - Standard Sizes"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of this group..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="distribution">Distribution Pattern</Label>
            <Select value={distributionPattern} onValueChange={(v) => setDistributionPattern(v as DistributionPattern)}>
              <SelectTrigger id="distribution">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="even">Even Distribution</SelectItem>
                <SelectItem value="gaussian_curve">Gaussian Curve</SelectItem>
                <SelectItem value="empirical_data">Empirical Data</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {distributionPattern === "even" && "Equal percentage across all variants"}
              {distributionPattern === "gaussian_curve" && "Bell curve distribution with peak at middle variants"}
              {distributionPattern === "empirical_data" && "Manual distribution based on actual data"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Select Products ({selectedProducts.size} selected)</Label>
            <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
              {availableProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No ungrouped products available
                </p>
              ) : (
                availableProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={() => handleProductToggle(product.id)}
                    />
                    <Label
                      htmlFor={`product-${product.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{product.name}</div>
                      {product.trade_name && (
                        <div className="text-sm text-muted-foreground">
                          {product.trade_name}
                        </div>
                      )}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
