import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { AffectedProduct } from '@/types/affectedProducts';
import { supabase } from '@/integrations/supabase/client';
import { Plus, X, TrendingDown, Target } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  status: string;
}

interface CannibalizationSettingsProps {
  companyId: string;
  currentProductId: string;
  affectedProducts: AffectedProduct[];
  portfolioSynergies: number;
  onAffectedProductsChange: (products: AffectedProduct[]) => void;
  onPortfolioSynergiesChange: (synergies: number) => void;
}

export function CannibalizationSettings({
  companyId,
  currentProductId,
  affectedProducts,
  portfolioSynergies,
  onAffectedProductsChange,
  onPortfolioSynergiesChange
}: CannibalizationSettingsProps) {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAvailableProducts();
  }, [companyId, currentProductId]);

  const loadAvailableProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, status')
        .eq('company_id', companyId)
        .neq('id', currentProductId)
        .eq('is_archived', false)
        .order('name');

      if (error) {
        console.error('Error loading products:', error);
        return;
      }

      setAvailableProducts(data || []);
    } catch (error) {
      console.error('Error in loadAvailableProducts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addAffectedProduct = () => {
    const newProduct: AffectedProduct = {
      productId: '',
      productName: '',
      monthsToReachRoof: 12,
      totalCannibalizationPercentage: 10
    };

    onAffectedProductsChange([...affectedProducts, newProduct]);
  };

  const updateAffectedProduct = (index: number, updates: Partial<AffectedProduct>) => {
    const updated = affectedProducts.map((product, i) => 
      i === index ? { ...product, ...updates } : product
    );
    onAffectedProductsChange(updated);
  };

  const removeAffectedProduct = (index: number) => {
    const updated = affectedProducts.filter((_, i) => i !== index);
    onAffectedProductsChange(updated);
  };

  const handleProductSelection = (index: number, productId: string) => {
    const selectedProduct = availableProducts.find(p => p.id === productId);
    if (selectedProduct) {
      updateAffectedProduct(index, {
        productId: selectedProduct.id,
        productName: selectedProduct.name
      });
    }
  };

  const getAvailableProductsForSelection = (currentIndex: number) => {
    const selectedIds = affectedProducts
      .map((p, i) => i !== currentIndex ? p.productId : '')
      .filter(Boolean);
    
    return availableProducts.filter(p => !selectedIds.includes(p.id));
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading available products...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Synergies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Portfolio Synergies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Cross-selling Opportunities (%)</Label>
            <div className="space-y-2">
              <Slider
                value={[portfolioSynergies]}
                onValueChange={(value) => onPortfolioSynergiesChange(value[0])}
                max={50}
                min={0}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className="font-medium">{portfolioSynergies}%</span>
                <span>50%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Additional revenue from cross-selling opportunities with existing products
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Affected Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Products Affected by Cannibalization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {affectedProducts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No cannibalization impacts configured</p>
              <p className="text-xs">Add products that will lose market share to this new product</p>
            </div>
          ) : (
            <div className="space-y-4">
              {affectedProducts.map((product, index) => (
                <Card key={index} className="border-l-4 border-l-warning">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Product {index + 1}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAffectedProduct(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Select Product</Label>
                          <Select
                            value={product.productId}
                            onValueChange={(value) => handleProductSelection(index, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose product..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableProductsForSelection(index).map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{p.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {p.status}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Timeline to Peak Impact (months)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="60"
                            value={product.monthsToReachRoof}
                            onChange={(e) => updateAffectedProduct(index, {
                              monthsToReachRoof: Number(e.target.value)
                            })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Maximum Cannibalization Impact (%)</Label>
                        <div className="space-y-2">
                          <Slider
                            value={[product.totalCannibalizationPercentage]}
                            onValueChange={(value) => updateAffectedProduct(index, {
                              totalCannibalizationPercentage: value[0]
                            })}
                            max={100}
                            min={0}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span className="font-medium">
                              {product.totalCannibalizationPercentage}%
                            </span>
                            <span>100%</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Maximum percentage of this product's revenue that will be lost
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            onClick={addAffectedProduct}
            className="w-full gap-2"
            disabled={availableProducts.length === 0 || affectedProducts.length >= availableProducts.length}
          >
            <Plus className="h-4 w-4" />
            Add Affected Product
          </Button>

          {availableProducts.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">
              No other products available for cannibalization analysis
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}