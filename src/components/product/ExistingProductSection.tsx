
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductForSelection } from "@/types/project";

interface ExistingProductSectionProps {
  companyId: string;
  form: UseFormReturn<any>;
  availableProducts: ProductForSelection[];
  isLoading: boolean;
}

export function ExistingProductSection({ 
  companyId, 
  form, 
  availableProducts, 
  isLoading 
}: ExistingProductSectionProps) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="selected_product">Select Product for Upgrade</Label>
        <Select onValueChange={(value) => form.setValue("selected_product_id", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a product to upgrade" />
          </SelectTrigger>
          <SelectContent>
            {availableProducts.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
