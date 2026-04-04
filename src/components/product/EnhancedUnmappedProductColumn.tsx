
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Wrench, WrenchIcon, CheckCircle, Loader2 } from "lucide-react";
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
  const [repairingProducts, setRepairingProducts] = useState<Set<string>>(new Set());
  const [repairingAll, setRepairingAll] = useState(false);

  const handleRepairProduct = async (productId: string) => {
    setRepairingProducts(prev => new Set(prev).add(productId));
    try {
      await onRepairProduct(productId);
    } finally {
      setRepairingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleRepairAll = async () => {
    setRepairingAll(true);
    try {
      await onRepairAll();
    } finally {
      setRepairingAll(false);
    }
  };

  if (unmappedProducts.length === 0) {
    return (
      <Card className="w-80 bg-green-50 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            All Devices Healthy
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            All devices have valid phase assignments
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-green-700">
            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-medium">No repairs needed</p>
            <p className="text-xs text-muted-foreground">
              All devices are properly assigned to lifecycle phases
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 bg-red-50 border-red-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            Needs Repair
          </CardTitle>
          <Badge variant="destructive">{unmappedProducts.length}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Products with phase inconsistencies
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Repair All Button */}
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleRepairAll}
          disabled={loading || repairingAll}
          className="w-full"
        >
          {repairingAll ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Repairing All...
            </>
          ) : (
            <>
              <Wrench className="h-4 w-4 mr-2" />
              Repair All Devices
            </>
          )}
        </Button>

        {/* Progress indicator during bulk repair */}
        {repairingAll && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">
                Repairing {unmappedProducts.length} device...
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Assigning products to first active phase
            </p>
          </div>
        )}

        {/* Individual Product Issues */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {unmappedProducts.map((product) => {
            const isRepairing = repairingProducts.has(product.id);
            
            return (
              <div
                key={product.id}
                className="p-3 bg-white border border-red-200 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {product.name}
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      {product.issue}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRepairProduct(product.id)}
                  disabled={loading || isRepairing || repairingAll}
                  className="w-full mt-2 text-xs"
                >
                  {isRepairing ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Repairing...
                    </>
                  ) : (
                    <>
                      <WrenchIcon className="h-3 w-3 mr-1" />
                      Repair
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          {unmappedProducts.length} product{unmappedProducts.length !== 1 ? 's' : ''} need{unmappedProducts.length === 1 ? 's' : ''} attention
        </div>

        {/* Help Text */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
          <p className="text-xs text-amber-800">
            <strong>Repair process:</strong> Products will be assigned to the first active phase for this company.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
