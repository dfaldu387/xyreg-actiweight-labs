import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { DistributionPattern } from '@/types/siblingGroup';

interface Product {
  id: string;
  name: string;
  trade_name?: string;
  percentage: number;
  position: number;
  assignmentId: string;
}

interface EditGroupDistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  distributionPattern: DistributionPattern;
  products: Product[];
  totalPercentage: number;
}

export function EditGroupDistributionDialog({
  open,
  onOpenChange,
  groupId,
  groupName,
  distributionPattern: initialPattern,
  products: initialProducts,
  totalPercentage,
}: EditGroupDistributionDialogProps) {
  const [distributionMethod, setDistributionMethod] = useState<DistributionPattern>(initialPattern);
  const [products, setProducts] = useState<Product[]>([]);
  const [customPercentages, setCustomPercentages] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && initialProducts.length > 0) {
      const sorted = [...initialProducts].sort((a, b) => a.position - b.position);
      setProducts(sorted);
      setDistributionMethod(initialPattern);
      
      // Initialize custom percentages from products
      const initial: Record<string, number> = {};
      sorted.forEach(p => {
        initial[p.assignmentId] = p.percentage;
      });
      setCustomPercentages(initial);
    }
  }, [open]); // Only run when dialog opens/closes, not when props change

  const calculateDistribution = (method: DistributionPattern, productsList: Product[]) => {
    const newPercentages: Record<string, number> = {};
    
    switch (method) {
      case 'even':
        const evenValue = 100 / productsList.length;
        productsList.forEach(p => {
          newPercentages[p.assignmentId] = Math.round(evenValue * 100) / 100;
        });
        // Adjust for rounding to ensure total is 100
        const evenTotal = Object.values(newPercentages).reduce((sum, val) => sum + val, 0);
        if (evenTotal !== 100 && productsList.length > 0) {
          newPercentages[productsList[0].assignmentId] += 100 - evenTotal;
        }
        break;
        
      case 'gaussian_curve':
        // Create a bell curve distribution
        const n = productsList.length;
        if (n === 1) {
          newPercentages[productsList[0].assignmentId] = 100;
        } else {
          const values: number[] = [];
          const mean = (n - 1) / 2;
          const stdDev = n / 4;
          
          for (let i = 0; i < n; i++) {
            const gaussianValue = Math.exp(-Math.pow(i - mean, 2) / (2 * Math.pow(stdDev, 2)));
            values.push(gaussianValue);
          }
          
          const sum = values.reduce((a, b) => a + b, 0);
          productsList.forEach((p, i) => {
            newPercentages[p.assignmentId] = Math.round((values[i] / sum) * 100 * 100) / 100;
          });
          
          // Adjust for rounding
          const gaussTotal = Object.values(newPercentages).reduce((sum, val) => sum + val, 0);
          if (gaussTotal !== 100 && productsList.length > 0) {
            const maxIndex = values.indexOf(Math.max(...values));
            newPercentages[productsList[maxIndex].assignmentId] += 100 - gaussTotal;
          }
        }
        break;
        
      case 'empirical_data':
        // Keep current custom percentages
        productsList.forEach(p => {
          newPercentages[p.assignmentId] = customPercentages[p.assignmentId] ?? p.percentage ?? 0;
        });
        break;
    }
    
    return newPercentages;
  };

  const handleDistributionChange = (method: DistributionPattern) => {
    setDistributionMethod(method);
    const newPercentages = calculateDistribution(method, products);
    setCustomPercentages(newPercentages);
  };

  const handlePercentageChange = (assignmentId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCustomPercentages(prev => ({
      ...prev,
      [assignmentId]: Math.max(0, Math.min(100, numValue)),
    }));
  };

  const handleSliderChange = (assignmentId: string, values: number[]) => {
    setCustomPercentages(prev => ({
      ...prev,
      [assignmentId]: values[0],
    }));
  };

  const handleAutoBalance = () => {
    const total = Object.values(customPercentages).reduce((sum, val) => sum + val, 0);
    if (total === 0) return;
    
    const factor = 100 / total;
    const balanced: Record<string, number> = {};
    let runningTotal = 0;
    
    products.forEach((p, i) => {
      if (i < products.length - 1) {
        balanced[p.assignmentId] = Math.round(customPercentages[p.assignmentId] * factor * 100) / 100;
        runningTotal += balanced[p.assignmentId];
      } else {
        balanced[p.assignmentId] = Math.round((100 - runningTotal) * 100) / 100;
      }
    });
    
    setCustomPercentages(balanced);
  };

  const handleSave = async () => {
    const total = Object.values(customPercentages).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 100) > 0.01) {
      toast.error(`Total percentage must equal 100% (currently ${total.toFixed(2)}%)`);
      return;
    }

    setIsSaving(true);
    try {
      // Update group distribution pattern
      const { error: groupError } = await supabase
        .from('product_sibling_groups')
        .update({ distribution_pattern: distributionMethod })
        .eq('id', groupId);

      if (groupError) throw groupError;

      // Update each product assignment percentage
      const updates = products.map(product => 
        supabase
          .from('product_sibling_assignments')
          .update({ percentage: customPercentages[product.assignmentId] })
          .eq('id', product.assignmentId)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;

      toast.success('Distribution updated successfully');
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['bundle-members'] });
      queryClient.invalidateQueries({ queryKey: ['company-sibling-groups-for-bundle'] });
      queryClient.invalidateQueries({ queryKey: ['bundle-details'] });
      
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to update distribution', {
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentTotal = Object.values(customPercentages).reduce((sum, val) => sum + val, 0);
  const isValid = Math.abs(currentTotal - 100) < 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Distribution: {groupName}</DialogTitle>
          <DialogDescription>
            Configure how variants are distributed within this sibling group
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Distribution Pattern Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Distribution Method</Label>
            <RadioGroup 
              value={distributionMethod} 
              onValueChange={(v) => handleDistributionChange(v as DistributionPattern)} 
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="empirical_data" id="empirical" />
                <Label htmlFor="empirical" className="font-normal cursor-pointer">
                  Fixed Percentages - Manually define percentage for each variant
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="even" id="even" />
                <Label htmlFor="even" className="font-normal cursor-pointer">
                  Equal Distribution - Split evenly across all variants
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gaussian_curve" id="gaussian" />
                <Label htmlFor="gaussian" className="font-normal cursor-pointer">
                  Gaussian Distribution - Bell curve distribution (most sales in middle variants)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Products with Percentages */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Variant Percentages</Label>
              {distributionMethod === 'empirical_data' && !isValid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoBalance}
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Auto-Balance
                </Button>
              )}
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate flex-1">
                        {product.trade_name || product.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={customPercentages[product.assignmentId] || 0}
                          onChange={(e) => handlePercentageChange(product.assignmentId, e.target.value)}
                          disabled={distributionMethod !== 'empirical_data'}
                          className="w-20 text-right"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    
                    {distributionMethod === 'empirical_data' && (
                      <Slider
                        value={[customPercentages[product.assignmentId] || 0]}
                        onValueChange={(values) => handleSliderChange(product.assignmentId, values)}
                        max={100}
                        step={0.1}
                        className="w-full"
                      />
                    )}
                    
                    <Progress value={customPercentages[product.assignmentId] || 0} className="h-2" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Total Validation */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Total Distribution</span>
              <span className={`text-sm font-semibold ${isValid ? 'text-green-600' : 'text-amber-600'}`}>
                {currentTotal.toFixed(2)}%
              </span>
            </div>
            <Progress value={currentTotal} className="h-2 mt-2" />
          </div>

          {!isValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Percentages must sum to exactly 100%. Current total: {currentTotal.toFixed(2)}%
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!isValid || isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Distribution'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
