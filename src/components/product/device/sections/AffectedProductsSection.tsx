
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, AlertTriangle, TrendingUp } from "lucide-react";
import { AffectedProduct } from "@/types/affectedProducts";
import { AffectedProductNPVService, AffectedProductNPVData } from "@/services/affectedProductNPVService";
import { AffectedProductNPVNotification } from "./AffectedProductNPVNotification";
import { toast } from 'sonner';

interface AffectedProductsSectionProps {
  availableProducts: Array<{ id: string; name: string }>;
  affectedProducts: AffectedProduct[];
  onAffectedProductsChange: (products: AffectedProduct[]) => void;
  currency: { symbol: string; name: string };
  isLoading?: boolean;
}

export function AffectedProductsSection({
  availableProducts,
  affectedProducts,
  onAffectedProductsChange,
  currency,
  isLoading = false
}: AffectedProductsSectionProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [npvService] = useState(() => new AffectedProductNPVService());
  const [recentlyCreatedNPV, setRecentlyCreatedNPV] = useState<AffectedProductNPVData[]>([]);

  const addAffectedProduct = async () => {
    if (!selectedProductId) return;
    
    const selectedProduct = availableProducts.find(p => p.id === selectedProductId);
    if (!selectedProduct) return;

    // Check if product is already added
    if (affectedProducts.some(p => p.productId === selectedProductId)) return;

    const newAffectedProduct: AffectedProduct = {
      productId: selectedProductId,
      productName: selectedProduct.name,
      monthsToReachRoof: 6, // Default 6 months to reach maximum impact
      totalCannibalizationPercentage: 20 // Default 20% maximum impact
    };

    // Update the affected products list
    const updatedProducts = [...affectedProducts, newAffectedProduct];
    onAffectedProductsChange(updatedProducts);

    // Create automatic NPV analysis for the affected product
    try {
      const npvData = await npvService.createAffectedProductNPVAnalysis(
        'current-product-id', // This should be passed as prop in real implementation
        newAffectedProduct,
        'EU', // Default to EU market, could be made configurable
        50000 // Default baseline revenue, could be calculated from historical data
      );

      if (npvData) {
        setRecentlyCreatedNPV(prev => [...prev, npvData]);
        toast.success(`Automatic NPV analysis created for ${selectedProduct.name}`);
      }
    } catch (error) {
      console.error('Error creating automatic NPV analysis:', error);
      toast.error('Failed to create automatic NPV analysis');
    }

    setSelectedProductId("");
  };

  const removeAffectedProduct = (productId: string) => {
    onAffectedProductsChange(affectedProducts.filter(p => p.productId !== productId));
    
    // Remove from recently created NPV list if exists
    setRecentlyCreatedNPV(prev => prev.filter(npv => npv.productId !== productId));
  };

  const updateAffectedProduct = (productId: string, field: keyof AffectedProduct, value: number) => {
    onAffectedProductsChange(
      affectedProducts.map(p => 
        p.productId === productId 
          ? { ...p, [field]: Math.max(0, value) }
          : p
      )
    );
  };

  const totalMaxImpact = affectedProducts.reduce((sum, p) => sum + p.totalCannibalizationPercentage, 0);
  const availableProductsForSelection = availableProducts.filter(
    p => !affectedProducts.some(ap => ap.productId === p.id)
  );

  // Helper function to calculate progressive impact preview
  const getProgressiveImpactPreview = (product: AffectedProduct) => {
    const preview = [];
    for (let month = 1; month <= Math.min(product.monthsToReachRoof + 2, 12); month++) {
      const impact = month <= product.monthsToReachRoof 
        ? (month / product.monthsToReachRoof) * product.totalCannibalizationPercentage
        : product.totalCannibalizationPercentage;
      preview.push({ month, impact: Math.round(impact * 10) / 10 });
    }
    return preview;
  };

  const handleViewNPVDetails = (productId: string) => {
    // In a real implementation, this would navigate to the affected product's NPV analysis page
    toast.info('Navigate to affected product NPV analysis page');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Affected Products (Progressive Cannibalization)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-700 mb-2">
            Select existing products that will gradually lose sales due to this new product launch.
          </p>
          <p className="text-xs text-orange-600">
            Define how many months it takes to reach maximum impact and the total cannibalization percentage.
            Automatic NPV analyses will be created to track revenue losses.
          </p>
        </div>

        {/* Show notifications for recently created NPV analyses */}
        {recentlyCreatedNPV.map((npvData) => (
          <AffectedProductNPVNotification
            key={npvData.productId}
            productName={npvData.productName}
            marketCode={npvData.marketCode}
            npvImpact={npvData.npvResults.npv}
            currency={currency.symbol}
            onViewDetails={() => handleViewNPVDetails(npvData.productId)}
          />
        ))}

        {/* Add New Affected Product */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Select 
              value={selectedProductId} 
              onValueChange={setSelectedProductId}
              disabled={isLoading || availableProductsForSelection.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product to add..." />
              </SelectTrigger>
              <SelectContent>
                {availableProductsForSelection.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={addAffectedProduct}
            disabled={!selectedProductId || isLoading}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Affected Products List */}
        {affectedProducts.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Affected Products</h4>
            
            {affectedProducts.map((affectedProduct) => {
              const progressivePreview = getProgressiveImpactPreview(affectedProduct);
              
              return (
                <div key={affectedProduct.productId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900">{affectedProduct.productName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAffectedProduct(affectedProduct.productId)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Progressive Cannibalization Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="space-y-2">
                      <Label htmlFor={`months-${affectedProduct.productId}`} className="text-sm">
                        Months to Reach Maximum Impact:
                      </Label>
                      <Select
                        value={affectedProduct.monthsToReachRoof.toString()}
                        onValueChange={(value) => updateAffectedProduct(
                          affectedProduct.productId, 
                          'monthsToReachRoof', 
                          parseInt(value)
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => i + 1).map(month => (
                            <SelectItem key={month} value={month.toString()}>
                              {month} month{month > 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`max-impact-${affectedProduct.productId}`} className="text-sm">
                        Maximum Cannibalization (%):
                      </Label>
                      <div className="flex items-center gap-1">
                        <Input
                          id={`max-impact-${affectedProduct.productId}`}
                          type="number"
                          value={affectedProduct.totalCannibalizationPercentage}
                          onChange={(e) => updateAffectedProduct(
                            affectedProduct.productId, 
                            'totalCannibalizationPercentage', 
                            parseFloat(e.target.value) || 0
                          )}
                          min="0"
                          max="100"
                          step="0.1"
                          className="w-24"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Progressive Impact Preview */}
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Progressive Impact Preview:</span>
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 text-xs">
                      {progressivePreview.map(({ month, impact }) => (
                        <div key={month} className="text-center">
                          <div className="text-gray-600">M{month}</div>
                          <div className="font-medium text-gray-900">{impact}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Total Maximum Cannibalization Impact:
                </span>
                <span className={`text-sm font-semibold ${totalMaxImpact > 50 ? 'text-red-600' : totalMaxImpact > 25 ? 'text-orange-600' : 'text-gray-900'}`}>
                  {totalMaxImpact.toFixed(1)}%
                </span>
              </div>
              {totalMaxImpact > 50 && (
                <p className="text-xs text-red-600 mt-1">
                  High maximum cannibalization impact detected - consider market differentiation strategies.
                </p>
              )}
              <p className="text-xs text-gray-600 mt-1">
                This is the combined maximum impact once all products reach their roof values. 
                Automatic NPV analyses track individual product losses.
              </p>
            </div>
          </div>
        )}

        {availableProductsForSelection.length === 0 && affectedProducts.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No other products available in this company.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
