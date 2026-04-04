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
import { toast } from "sonner";

interface ProductVariantSplitterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseProductId: string;
  basicUdiDi: string;
  companyId: string;
  baseProductName: string;
}

export function ProductVariantSplitterDialog({
  open,
  onOpenChange,
  baseProductId,
  basicUdiDi,
  companyId,
  baseProductName,
}: ProductVariantSplitterDialogProps) {
  const queryClient = useQueryClient();
  const [variantCount, setVariantCount] = useState<number>(5);
  const [namingTemplate, setNamingTemplate] = useState<string>("{base} - Size {n}");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (variantCount < 2 || variantCount > 50) {
      toast.error("Please enter a variant count between 2 and 50");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create variant products
      const variantProducts = Array.from({ length: variantCount }, (_, i) => {
        const variantName = namingTemplate
          .replace("{base}", baseProductName)
          .replace("{n}", String(i + 1));
        
        return {
          company_id: companyId,
          name: variantName,
          basic_udi_di: basicUdiDi,
          status: "Planning",
          is_archived: false,
        };
      });

      const { data: createdProducts, error: productsError } = await supabase
        .from("products")
        .insert(variantProducts)
        .select();

      if (productsError) throw productsError;

      // Create a sibling group for these variants
      const { data: group, error: groupError } = await supabase
        .from("product_sibling_groups")
        .insert({
          company_id: companyId,
          basic_udi_di: basicUdiDi,
          name: `${baseProductName} - Variants`,
          description: `Auto-generated from splitting ${baseProductName}`,
          distribution_pattern: "even",
          total_percentage: 100,
          position: 0,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Create assignments
      const evenPercentage = 100 / variantCount;
      const assignments = createdProducts.map((product, index) => ({
        sibling_group_id: group.id,
        product_id: product.id,
        percentage: evenPercentage,
        position: index,
      }));

      const { error: assignmentsError } = await supabase
        .from("product_sibling_assignments")
        .insert(assignments);

      if (assignmentsError) throw assignmentsError;

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["company-basic-udi-groups", companyId] });
      queryClient.invalidateQueries({ queryKey: ["products-by-basic-udi", companyId] });

      toast.success(`Created ${variantCount} product variants and grouped them`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error splitting product into variants:", error);
      toast.error("Failed to create product variants");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Split Product into Variants</DialogTitle>
          <DialogDescription>
            Create multiple product variants from "{baseProductName}" that share the same Basic UDI-DI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="variant-count">Number of Variants</Label>
            <Input
              id="variant-count"
              type="number"
              min={2}
              max={50}
              value={variantCount}
              onChange={(e) => setVariantCount(parseInt(e.target.value) || 2)}
            />
            <p className="text-xs text-muted-foreground">
              Enter a number between 2 and 50
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="naming-template">Naming Template</Label>
            <Input
              id="naming-template"
              value={namingTemplate}
              onChange={(e) => setNamingTemplate(e.target.value)}
              placeholder="{base} - Size {n}"
            />
            <p className="text-xs text-muted-foreground">
              Use {"{base}"} for the base product name and {"{n}"} for the variant number
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="font-medium text-sm">Preview:</div>
            <div className="text-sm text-muted-foreground space-y-1">
              {Array.from({ length: Math.min(3, variantCount) }, (_, i) => (
                <div key={i}>
                  • {namingTemplate.replace("{base}", baseProductName).replace("{n}", String(i + 1))}
                </div>
              ))}
              {variantCount > 3 && (
                <div className="text-xs italic">
                  ... and {variantCount - 3} more
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : `Create ${variantCount} Variants`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
