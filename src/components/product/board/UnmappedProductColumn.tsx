
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { ProductCard } from "./ProductCard";

interface UnmappedProduct {
  id: string;
  name: string;
  status: "On Track" | "At Risk" | "Needs Attention";
  progress: number;
  description?: string;
  class?: string;
  image?: string;
  issue: string;
}

interface UnmappedProductColumnProps {
  unmappedProducts: UnmappedProduct[];
  onRepairProduct: (productId: string) => void;
  onRepairAll: () => void;
  onProductClick: (productId: string) => void;
}

export function UnmappedProductColumn({
  unmappedProducts,
  onRepairProduct,
  onRepairAll,
  onProductClick
}: UnmappedProductColumnProps) {
  const handleRepairProduct = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onRepairProduct(productId);
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50 min-h-[400px]">
      <CardHeader className="pb-3 border-b bg-white/50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-lg text-yellow-800">
              Products Need Phase Assignment
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="border-yellow-300">
              {unmappedProducts.length}
            </Badge>
            <Button
              onClick={onRepairAll}
              variant="outline"
              size="sm"
              className="border-yellow-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Repair All
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        {unmappedProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-sm">All products are properly assigned</div>
          </div>
        ) : (
          unmappedProducts.map((product) => (
            <div key={product.id} className="space-y-2">
              <div className="p-3 bg-white rounded border border-yellow-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{product.name}</h4>
                    <p className="text-xs text-red-600 mt-1">{product.issue}</p>
                  </div>
                  <Button
                    onClick={(e) => handleRepairProduct(e, product.id)}
                    variant="outline"
                    size="sm"
                    className="border-yellow-300"
                  >
                    Repair
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
