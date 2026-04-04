import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRevenueProjections } from '@/hooks/useFeasibilityPortfolio';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RevenueProjectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string;
  portfolioProductId: string;
  productName: string;
  targetMarkets: string[];
}

export function RevenueProjectionsDialog({ open, onOpenChange, portfolioId, portfolioProductId, productName, targetMarkets }: RevenueProjectionsDialogProps) {
  const { data: projections } = useRevenueProjections(portfolioId, portfolioProductId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    target_market: '',
    year_from_launch: '',
    unit_price_worst: '',
    unit_price_likely: '',
    unit_price_best: '',
    cogs_worst: '',
    cogs_likely: '',
    cogs_best: '',
    units_worst: '',
    units_likely: '',
    units_best: '',
    currency: 'USD',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Calculate revenues from units × price
      const worstRevenue = data.units_worst && data.unit_price_worst 
        ? parseFloat(data.units_worst) * parseFloat(data.unit_price_worst) 
        : null;
      const likelyRevenue = data.units_likely && data.unit_price_likely
        ? parseFloat(data.units_likely) * parseFloat(data.unit_price_likely)
        : null;
      const bestRevenue = data.units_best && data.unit_price_best
        ? parseFloat(data.units_best) * parseFloat(data.unit_price_best)
        : null;

      const { error } = await supabase.from('feasibility_revenue_projections').insert({
        portfolio_id: portfolioId,
        portfolio_product_id: portfolioProductId,
        target_market: data.target_market,
        year_from_launch: parseInt(data.year_from_launch),
        worst_case_revenue: worstRevenue,
        likely_case_revenue: likelyRevenue,
        best_case_revenue: bestRevenue,
        unit_price_worst: data.unit_price_worst ? parseFloat(data.unit_price_worst) : null,
        unit_price_likely: data.unit_price_likely ? parseFloat(data.unit_price_likely) : null,
        unit_price_best: data.unit_price_best ? parseFloat(data.unit_price_best) : null,
        cogs_worst: data.cogs_worst ? parseFloat(data.cogs_worst) : null,
        cogs_likely: data.cogs_likely ? parseFloat(data.cogs_likely) : null,
        cogs_best: data.cogs_best ? parseFloat(data.cogs_best) : null,
        units_worst: data.units_worst ? parseFloat(data.units_worst) : null,
        units_likely: data.units_likely ? parseFloat(data.units_likely) : null,
        units_best: data.units_best ? parseFloat(data.units_best) : null,
        currency: data.currency,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-projections'] });
      setFormData({
        target_market: '',
        year_from_launch: '',
        unit_price_worst: '',
        unit_price_likely: '',
        unit_price_best: '',
        cogs_worst: '',
        cogs_likely: '',
        cogs_best: '',
        units_worst: '',
        units_likely: '',
        units_best: '',
        currency: 'USD',
      });
      toast({ title: 'Success', description: 'Revenue projection added' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: `Failed to add projection: ${error.message}`, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feasibility_revenue_projections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-projections'] });
      toast({ title: 'Success', description: 'Projection deleted' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.target_market || !formData.year_from_launch) {
      toast({ title: 'Validation Error', description: 'Market and year are required', variant: 'destructive' });
      return;
    }
    createMutation.mutate(formData);
  };

  const totalRevenue = {
    worst: projections?.reduce((sum, p) => sum + (p.worst_case_revenue || 0), 0) || 0,
    likely: projections?.reduce((sum, p) => sum + (p.likely_case_revenue || 0), 0) || 0,
    best: projections?.reduce((sum, p) => sum + (p.best_case_revenue || 0), 0) || 0,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revenue Projections: {productName}</DialogTitle>
          <DialogDescription>
            Define revenue forecasts by market and year with scenario planning
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning if no markets */}
          {targetMarkets.length === 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                No target markets defined for this bundle. Please define target markets in the bundle settings first.
              </p>
            </div>
          )}

          {/* Summary */}
          {targetMarkets.length > 0 && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Worst Case</div>
                <div className="text-2xl font-bold">${(totalRevenue.worst / 1000).toFixed(0)}k</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Likely Case</div>
                <div className="text-2xl font-bold">${(totalRevenue.likely / 1000).toFixed(0)}k</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Best Case</div>
                <div className="text-2xl font-bold">${(totalRevenue.best / 1000).toFixed(0)}k</div>
              </div>
            </div>
          )}

          {/* Existing Projections */}
          {projections && projections.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Market</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>COGS</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projections.map((proj) => {
                    const projData = proj as any; // Temporary until types regenerate
                    const units = projData.units_likely || projData.units_worst || projData.units_best || 0;
                    const price = projData.unit_price_likely || projData.unit_price_worst || projData.unit_price_best || 0;
                    const cogs = projData.cogs_likely || projData.cogs_worst || projData.cogs_best || 0;
                    const revenue = proj.likely_case_revenue || proj.worst_case_revenue || proj.best_case_revenue || 0;
                    const margin = price > 0 ? ((price - cogs) / price * 100).toFixed(1) : 0;
                    
                    return (
                      <TableRow key={proj.id}>
                        <TableCell className="font-medium">{proj.target_market}</TableCell>
                        <TableCell>Year {proj.year_from_launch}</TableCell>
                        <TableCell>{units?.toLocaleString() || '-'}</TableCell>
                        <TableCell>${price?.toLocaleString() || '-'}</TableCell>
                        <TableCell>${cogs?.toLocaleString() || '-'}</TableCell>
                        <TableCell>${revenue?.toLocaleString() || '-'}</TableCell>
                        <TableCell>{margin}%</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(proj.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Add New Projection Form */}
          {targetMarkets.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
              <h3 className="font-semibold">Add New Revenue Projection</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="market">Target Market *</Label>
                  <Select
                    value={formData.target_market}
                    onValueChange={(value) => setFormData({ ...formData, target_market: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target market" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {targetMarkets.map((market) => (
                        <SelectItem key={market} value={market}>
                          {market}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year from Launch *</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1"
                    value={formData.year_from_launch}
                    onChange={(e) => setFormData({ ...formData, year_from_launch: e.target.value })}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Worst Case Scenario</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="units_worst">Units Sold</Label>
                    <Input
                      id="units_worst"
                      type="number"
                      value={formData.units_worst}
                      onChange={(e) => setFormData({ ...formData, units_worst: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_worst">Unit Price ($)</Label>
                    <Input
                      id="price_worst"
                      type="number"
                      step="0.01"
                      value={formData.unit_price_worst}
                      onChange={(e) => setFormData({ ...formData, unit_price_worst: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cogs_worst">COGS per Unit ($)</Label>
                    <Input
                      id="cogs_worst"
                      type="number"
                      step="0.01"
                      value={formData.cogs_worst}
                      onChange={(e) => setFormData({ ...formData, cogs_worst: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Likely Case Scenario</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="units_likely">Units Sold</Label>
                    <Input
                      id="units_likely"
                      type="number"
                      value={formData.units_likely}
                      onChange={(e) => setFormData({ ...formData, units_likely: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_likely">Unit Price ($)</Label>
                    <Input
                      id="price_likely"
                      type="number"
                      step="0.01"
                      value={formData.unit_price_likely}
                      onChange={(e) => setFormData({ ...formData, unit_price_likely: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cogs_likely">COGS per Unit ($)</Label>
                    <Input
                      id="cogs_likely"
                      type="number"
                      step="0.01"
                      value={formData.cogs_likely}
                      onChange={(e) => setFormData({ ...formData, cogs_likely: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Best Case Scenario</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="units_best">Units Sold</Label>
                    <Input
                      id="units_best"
                      type="number"
                      value={formData.units_best}
                      onChange={(e) => setFormData({ ...formData, units_best: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_best">Unit Price ($)</Label>
                    <Input
                      id="price_best"
                      type="number"
                      step="0.01"
                      value={formData.unit_price_best}
                      onChange={(e) => setFormData({ ...formData, unit_price_best: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cogs_best">COGS per Unit ($)</Label>
                    <Input
                      id="cogs_best"
                      type="number"
                      step="0.01"
                      value={formData.cogs_best}
                      onChange={(e) => setFormData({ ...formData, cogs_best: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={createMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Add Revenue Projection
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
