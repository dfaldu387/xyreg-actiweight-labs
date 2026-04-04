
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductForSelection } from "@/types/project";

interface LineExtensionSectionProps {
  companyId: string;
  form: UseFormReturn<any>;
  availableProducts: ProductForSelection[];
  isLoading: boolean;
}

export function LineExtensionSection({ 
  companyId, 
  form, 
  availableProducts, 
  isLoading 
}: LineExtensionSectionProps) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="parent_product">Select Parent Product</Label>
        <Select onValueChange={(value) => form.setValue("parent_product_id", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a parent product" />
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
