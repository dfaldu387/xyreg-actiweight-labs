import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useVariationDimensions } from "@/hooks/useVariationDimensions";
import { updateProductVariantTags, ProductWithFamily } from "@/services/productFamilyService";
import { toast } from "sonner";
import { Tags, Save } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: ProductWithFamily[];
  companyId: string;
  onUpdate?: () => void;
}

export function BulkVariantTagEditor({ isOpen, onClose, products, companyId, onUpdate }: Props) {
  const { dimensions, optionsByDimension, loading } = useVariationDimensions(companyId);
  const [tags, setTags] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const activeDimensions = dimensions.filter(d => d.is_active);

  const handleTagChange = (dimensionName: string, optionName: string) => {
    if (optionName === "__none__") {
      setTags(prev => {
        const newTags = { ...prev };
        delete newTags[dimensionName];
        return newTags;
      });
    } else {
      setTags(prev => ({
        ...prev,
        [dimensionName]: optionName
      }));
    }
  };

  const handleSave = async () => {
    if (products.length === 0) {
      toast.error("No products selected");
      return;
    }

    if (Object.keys(tags).length === 0) {
      toast.error("Please select at least one tag");
      return;
    }

    setIsSaving(true);
    try {
      const promises = products.map(product => {
        // Merge with existing tags instead of replacing
        const existingTags = product.variant_tags || {};
        const mergedTags = { ...existingTags, ...tags };
        return updateProductVariantTags(product.id, mergedTags);
      });
      await Promise.all(promises);
      
      toast.success(`Updated ${products.length} products`);
      setTags({});
      onUpdate?.();
      onClose();
    } catch {
      toast.error("Failed to update variant tags");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Bulk Tag Products
          </DialogTitle>
          <DialogDescription>
            Select products and assign variant tags to multiple products at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Products Summary */}
          <div className="space-y-2">
            <Label className="text-base">Selected Products ({products.length})</Label>
            <div className="border rounded-lg p-3 max-h-32 overflow-y-auto bg-accent/20">
              <div className="text-sm space-y-1">
                {products.map(product => (
                  <div key={product.id} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="font-medium">{product.name}</span>
                    {(product as any).trade_name && (
                      <span className="text-xs text-muted-foreground">
                        ({(product as any).trade_name})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tag Selection */}
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading dimensions...</div>
          ) : activeDimensions.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No variant dimensions defined. Add dimensions in Settings → Product Portfolio Structure.
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-base">Assign Tags</Label>
              <div className="grid gap-4">
                {activeDimensions.map(dimension => {
                  const options = optionsByDimension[dimension.id] || [];
                  const activeOptions = options.filter(o => o.is_active);
                  const currentValue = tags[dimension.name];

                  return (
                    <div key={dimension.id} className="grid gap-2">
                      <Label htmlFor={`bulk-tag-${dimension.id}`}>{dimension.name}</Label>
                      <Select
                        value={currentValue || ""}
                        onValueChange={(value) => handleTagChange(dimension.name, value)}
                      >
                        <SelectTrigger id={`bulk-tag-${dimension.id}`}>
                          <SelectValue placeholder={`Select ${dimension.name.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            <span className="text-muted-foreground">Not specified</span>
                          </SelectItem>
                          {activeOptions.map(option => (
                            <SelectItem key={option.id} value={option.name}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : `Apply to ${products.length} Products`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
