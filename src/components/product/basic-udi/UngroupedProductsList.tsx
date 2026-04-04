import React from "react";
import { AlertCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProductWithBasicUDI } from "@/hooks/useProductsByBasicUDI";

interface UngroupedProductsListProps {
  products: ProductWithBasicUDI[];
  basicUdiDi: string;
  companyId: string;
  onCreateGroup: () => void;
}

export function UngroupedProductsList({ 
  products, 
  basicUdiDi, 
  companyId,
  onCreateGroup 
}: UngroupedProductsListProps) {
  if (products.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">
              Ungrouped Products ({products.length})
            </CardTitle>
          </div>
          <Button onClick={onCreateGroup} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add to Group
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {products.map((product) => (
            <div 
              key={product.id}
              className="flex items-center justify-between p-3 rounded-lg bg-background border"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{product.name}</div>
                {product.trade_name && (
                  <div className="text-sm text-muted-foreground truncate">
                    {product.trade_name}
                  </div>
                )}
                {product.udi_di && (
                  <div className="text-xs text-muted-foreground font-mono mt-1">
                    {product.udi_di}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                {product.status && (
                  <Badge variant="outline" className="text-xs">
                    {product.status}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-amber-100/50 border border-amber-200">
          <p className="text-sm text-amber-900">
            These products share the same Basic UDI-DI but aren't assigned to any sibling group yet. 
            Create a group to organize variants and define their distribution.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
