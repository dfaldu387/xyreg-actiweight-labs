
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Wrench, RefreshCw } from "lucide-react";
import { UnmappedProduct } from "@/hooks/useCompanyProductPhases";

interface EnhancedUnmappedProductColumnProps {
  unmappedProducts: UnmappedProduct[];
  onRepairProduct: (productId: string) => Promise<void>;
  onRepairAll: () => Promise<void>;
  loading?: boolean;
}

export function EnhancedUnmappedProductColumn({ 
  unmappedProducts, 
  onRepairProduct, 
  onRepairAll,
  loading = false
}: EnhancedUnmappedProductColumnProps) {
  if (unmappedProducts.length === 0) {
    return null; // Don't show the column if there are no unmapped products
  }

  const handleRepairProduct = async (productId: string) => {
    try {
      await onRepairProduct(productId);
    } catch (error) {
      console.error('Failed to repair product:', error);
    }
  };

  const handleRepairAll = async () => {
    try {
      await onRepairAll();
    } catch (error) {
      console.error('Failed to repair all products:', error);
    }
  };

  return (
    <div className="min-w-[320px] w-[360px] max-w-[90vw] flex-shrink-0">
      <Card className="h-full bg-gradient-to-b from-amber-50/50 to-orange-100/30 border-amber-200/60 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-amber-200/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-amber-800 tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Needs Repair
            </CardTitle>
            <Badge variant="destructive" className="bg-amber-200/60 text-amber-800 font-medium px-2.5 py-1">
              {unmappedProducts.length}
            </Badge>
          </div>
          <p className="text-sm text-amber-700 mt-1 leading-relaxed">
            Products with phase assignment issues
          </p>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Repair Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRepairAll}
                disabled={loading}
                className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Wrench className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Repair All
              </Button>
            </div>

            {/* Products List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {unmappedProducts.map((product) => (
                <div key={product.id} className="relative">
                  {/* Product Card */}
                  <Card className="p-3 bg-white border border-amber-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </Card>
                  
                  {/* Issue Description */}
                  <div className="mt-2 p-2 bg-amber-100/60 border border-amber-200 rounded text-xs text-amber-700">
                    <div className="font-medium">Issue:</div>
                    <div>{product.issue || 'Unknown issue'}</div>
                  </div>
                  
                  {/* Individual Repair Button */}
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRepairProduct(product.id)}
                      disabled={loading}
                      className="w-full text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <Wrench className="h-3 w-3 mr-1" />
                      Repair This Product
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Help Text */}
            <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <div className="font-medium mb-1">How to fix:</div>
              <ul className="space-y-1">
                <li>• Click "Repair All" to fix all products at once</li>
                <li>• Or repair individual products using their repair buttons</li>
                <li>• Products will be assigned to the first available phase</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
