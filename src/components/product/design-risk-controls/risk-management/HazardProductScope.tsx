import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyDeviceCategories } from "@/hooks/useCompanyDeviceCategories";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Layers, Monitor } from "lucide-react";

export interface HazardProductScopeData {
  categoryNames: string[];
  productIds: string[];
}

interface HazardProductScopeProps {
  companyId: string;
  currentProductId: string;
  value: HazardProductScopeData;
  onChange: (data: HazardProductScopeData) => void;
}

export function HazardProductScope({
  companyId,
  currentProductId,
  value,
  onChange,
}: HazardProductScopeProps) {
  // Fetch products with device_category directly
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["company-products-with-category", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, device_category")
        .eq("company_id", companyId)
        .eq("is_archived", false)
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string; device_category: string | null }[];
    },
    enabled: !!companyId,
  });
  const { categories, loading: categoriesLoading } = useCompanyDeviceCategories(companyId);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Initialize selected category from value
  useEffect(() => {
    if (value.categoryNames.length > 0 && !selectedCategory) {
      setSelectedCategory(value.categoryNames[0]);
    }
  }, [value.categoryNames]);

  // Auto-select all products on first load when only the current product is selected (new hazard default)
  // Mirrors the Document CI pattern: all devices are included by default
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  useEffect(() => {
    if (
      !hasAutoSelected &&
      products.length > 0 &&
      value.productIds.length <= 1 &&
      value.categoryNames.length === 0
    ) {
      setHasAutoSelected(true);
      onChange({
        categoryNames: [],
        productIds: products.map((p) => p.id),
      });
    }
  }, [products, hasAutoSelected]);

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => p.device_category === selectedCategory);
  }, [products, selectedCategory]);

  // When category changes, auto-select all devices in that category
  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategory(categoryName);
    
    if (categoryName === "__none__") {
      // Clear category filter, keep existing product selections
      onChange({ categoryNames: [], productIds: value.productIds });
      setSelectedCategory("");
      return;
    }

    const productsInCategory = products
      .filter((p) => p.device_category === categoryName)
      .map((p) => p.id);

    // Merge: keep current product + category products
    const merged = Array.from(new Set([
      ...value.productIds,
      ...productsInCategory,
    ]));

    onChange({
      categoryNames: [categoryName],
      productIds: merged,
    });
  };

  const handleProductToggle = (productId: string, checked: boolean) => {
    const updated = checked
      ? [...value.productIds, productId]
      : value.productIds.filter((id) => id !== productId);
    onChange({ ...value, productIds: updated });
  };

  const isLoading = productsLoading || categoriesLoading;

  // Sort: current product first, then alphabetical
  const sortedProducts = useMemo(() => {
    const list = selectedCategory ? filteredProducts : products;
    return [...list].sort((a, b) => {
      if (a.id === currentProductId) return -1;
      if (b.id === currentProductId) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredProducts, products, currentProductId, selectedCategory]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Product Applicability</h4>
        {value.productIds.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {value.productIds.length} device{value.productIds.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Which products does this hazard apply to?
      </p>

      {/* Category filter */}
      <div className="space-y-1.5">
        <Label className="text-xs">Filter by Device Category</Label>
        <Select
          value={selectedCategory || "__none__"}
          onValueChange={handleCategoryChange}
          disabled={isLoading}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Device checkboxes */}
      <div className="space-y-1.5">
        <Label className="text-xs">Applicable Devices</Label>
        <div className="max-h-[180px] overflow-y-auto border rounded-md p-2 space-y-1">
          {isLoading ? (
            <p className="text-xs text-muted-foreground py-2 text-center">Loading devices...</p>
          ) : sortedProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">No devices found</p>
          ) : (
            sortedProducts.map((product) => (
              <label
                key={product.id}
                className="flex items-center gap-2 py-1 px-1 rounded hover:bg-accent/50 cursor-pointer text-xs"
              >
                <Checkbox
                  checked={value.productIds.includes(product.id)}
                  onCheckedChange={(checked) =>
                    handleProductToggle(product.id, !!checked)
                  }
                />
                <Monitor className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">
                  {product.name}
                  {product.id === currentProductId && (
                    <span className="text-muted-foreground ml-1">(current)</span>
                  )}
                </span>
                {product.device_category && (
                  <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
                    {product.device_category}
                  </Badge>
                )}
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
