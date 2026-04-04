import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VariantDistribution {
  variant_id: string;
  variant_name: string;
  percentage: number;
}

interface VariantDistributionManagerProps {
  siblingGroupId: string;
  companyId: string;
  distributions: VariantDistribution[];
  onChange: (distributions: VariantDistribution[], method: 'fixed_percentages' | 'conditional_logic' | 'equal_distribution' | 'gaussian') => void;
  distributionMethod?: 'fixed_percentages' | 'conditional_logic' | 'equal_distribution' | 'gaussian';
}

export function VariantDistributionManager({
  siblingGroupId,
  companyId,
  distributions,
  onChange,
  distributionMethod = 'fixed_percentages'
}: VariantDistributionManagerProps) {
  const [method, setMethod] = useState<'fixed_percentages' | 'conditional_logic' | 'equal_distribution' | 'gaussian'>(distributionMethod);
  const [localDistributions, setLocalDistributions] = useState<VariantDistribution[]>(distributions);
  const [loading, setLoading] = useState(true);
  const [siblingProducts, setSiblingProducts] = useState<Array<{ id: string; name: string }>>([]);
  
  // Fetch products in the sibling group (these act as "variants" for distribution)
  useEffect(() => {
    async function fetchSiblingProducts() {
      if (!siblingGroupId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('product_sibling_assignments')
          .select(`
            id,
            product:products (
              id,
              name,
              trade_name
            )
          `)
          .eq('sibling_group_id', siblingGroupId);
        
        if (error) throw error;
        
        const products = (data || [])
          .filter(a => a.product)
          .map(a => ({
            id: a.product.id,
            name: a.product.trade_name || a.product.name
          }));
        
        setSiblingProducts(products);
        
        // Initialize distributions if empty and we have products
        if (products.length > 0 && localDistributions.length === 0) {
          const equalPercentage = 100 / products.length;
          const initial = products.map(p => ({
            variant_id: p.id,
            variant_name: p.name,
            percentage: Number(equalPercentage.toFixed(2))
          }));
          setLocalDistributions(initial);
          onChange(initial, method);
        }
      } catch (error) {
        console.error('Error fetching sibling products:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSiblingProducts();
  }, [siblingGroupId]);

  const totalPercentage = localDistributions.reduce((sum, d) => sum + d.percentage, 0);
  const isValid = Math.abs(totalPercentage - 100) < 0.01;

  const handleMethodChange = (newMethod: 'fixed_percentages' | 'conditional_logic' | 'equal_distribution' | 'gaussian') => {
    setMethod(newMethod);
    
    if (newMethod === 'equal_distribution') {
      const equalPercentage = 100 / localDistributions.length;
      const updated = localDistributions.map(d => ({
        ...d,
        percentage: Number(equalPercentage.toFixed(2))
      }));
      setLocalDistributions(updated);
      onChange(updated, newMethod);
    } else if (newMethod === 'gaussian') {
      // Calculate gaussian (bell curve) distribution
      const n = localDistributions.length;
      if (n === 0) return;
      
      // Generate gaussian weights using normal distribution
      const mean = (n - 1) / 2; // Center of the distribution
      const stdDev = n / 4; // Standard deviation (adjust for spread)
      
      const weights = localDistributions.map((_, index) => {
        // Calculate gaussian probability density
        const x = index;
        const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
        return Math.exp(exponent);
      });
      
      // Normalize weights to sum to 100%
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      const updated = localDistributions.map((d, i) => ({
        ...d,
        percentage: Number(((weights[i] / totalWeight) * 100).toFixed(2))
      }));
      
      setLocalDistributions(updated);
      onChange(updated, newMethod);
    } else {
      onChange(localDistributions, newMethod);
    }
  };

  const handlePercentageChange = (variantId: string, value: string) => {
    const percentage = parseFloat(value) || 0;
    const updated = localDistributions.map(d =>
      d.variant_id === variantId ? { ...d, percentage } : d
    );
    setLocalDistributions(updated);
    onChange(updated, method);
  };

  const handleAutoBalance = () => {
    const equalPercentage = 100 / localDistributions.length;
    const updated = localDistributions.map(d => ({
      ...d,
      percentage: Number(equalPercentage.toFixed(2))
    }));
    setLocalDistributions(updated);
    onChange(updated, method);
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading variants...</div>;
  }

  if (localDistributions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No variants found in this sibling group.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variant Distribution</CardTitle>
        <CardDescription>
          Define how sales are distributed across variants in this group
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Distribution Method</Label>
          <RadioGroup value={method} onValueChange={handleMethodChange} className="mt-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fixed_percentages" id="fixed" />
              <Label htmlFor="fixed" className="font-normal cursor-pointer">
                Fixed Percentages - Manually define percentage for each variant
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="equal_distribution" id="equal" />
              <Label htmlFor="equal" className="font-normal cursor-pointer">
                Equal Distribution - Split evenly across all variants
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="gaussian" id="gaussian" />
              <Label htmlFor="gaussian" className="font-normal cursor-pointer">
                Gaussian Distribution - Bell curve distribution (most sales in middle variants)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="conditional_logic" id="conditional" />
              <Label htmlFor="conditional" className="font-normal cursor-pointer">
                Conditional Logic - Based on parent product characteristics (Advanced)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {method === 'fixed_percentages' && (
          <>
            <div className="space-y-3">
              {localDistributions.map((dist) => (
                <div key={dist.variant_id} className="flex items-center gap-3">
                  <Label className="flex-1 min-w-0">
                    {dist.variant_name}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={dist.percentage}
                      onChange={(e) => handlePercentageChange(dist.variant_id, e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Total:</span>
                <span className={`text-sm font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPercentage.toFixed(2)}%
                </span>
                {isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <button
                type="button"
                onClick={handleAutoBalance}
                className="text-sm text-primary hover:underline"
              >
                Auto-balance
              </button>
            </div>

            {!isValid && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Total percentage must equal 100%. Currently: {totalPercentage.toFixed(2)}%
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {method === 'equal_distribution' && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Each variant will receive {(100 / localDistributions.length).toFixed(2)}% of sales.
            </AlertDescription>
          </Alert>
        )}

        {method === 'conditional_logic' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Conditional logic allows distribution based on parent product characteristics. This feature is coming soon.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
