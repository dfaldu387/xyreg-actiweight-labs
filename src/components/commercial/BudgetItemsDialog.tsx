import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompanyPhases } from '@/hooks/useCompanyPhases';
import { PhaseBudgetService } from '@/services/phaseBudgetService';
import { useQuery } from '@tanstack/react-query';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Typical post-launch budget items
const POST_LAUNCH_ITEMS = [
  'Marketing & Promotion',
  'Sales Team',
  'Distribution Costs',
  'Customer Support',
  'Product Training',
  'Post-Market Surveillance',
  'Regulatory Compliance',
  'Quality Monitoring',
  'Field Service',
  'Warranty Costs',
  'Product Updates',
  'Market Research',
  'Other'
];

interface BudgetItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string;
  portfolioProductId: string;
  productName: string;
  companyId: string;
}

export function BudgetItemsDialog({ open, onOpenChange, portfolioId, portfolioProductId, productName, companyId }: BudgetItemsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { phases: rawPhases, isLoading: phasesLoading } = useCompanyPhases(companyId);
  
  // Process phases: rename "Launch & Post-Launch" to "Launch" and add "Post-Launch" option
  const phases = useMemo(() => {
    const processedPhases = (rawPhases || []).map(phase => ({
      ...phase,
      name: phase.name.replace(/Launch & Post-Launch/i, 'Launch')
    }));
    
    // Add virtual "Post-Launch" phase as catch-all for post-launch costs
    processedPhases.push({
      id: 'post-launch-general',
      name: 'Post-Launch',
      description: 'General post-launch costs and activities'
    });
    
    return processedPhases;
  }, [rawPhases]);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    phase_id: '',
    category: '' as 'fixed' | 'variable' | 'other' | '',
    item_name: '',
    description: '',
    cost_worst_case: '',
    cost_likely_case: '',
    cost_best_case: '',
    currency: 'USD',
  });

  // Fetch budget items using the phase_budget_items table
  const { data: budgetItems = [] } = useQuery({
    queryKey: ['feasibility-budget-items', portfolioId],
    queryFn: async () => {
      return await PhaseBudgetService.getFeasibilityBudgetsByPortfolio(portfolioId);
    },
    enabled: !!portfolioId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!data.phase_id || !data.category) {
        throw new Error('Phase and category are required');
      }

      await PhaseBudgetService.createBudgetItem({
        phase_id: data.phase_id,
        category: data.category as 'fixed' | 'variable' | 'other',
        item_name: data.item_name,
        cost: data.cost_likely_case ? parseFloat(data.cost_likely_case) : 0,
        currency: data.currency,
        timing_type: 'both', // Default to both since phase determines the timing
        worst_case_amount: data.cost_worst_case ? parseFloat(data.cost_worst_case) : null,
        likely_case_amount: data.cost_likely_case ? parseFloat(data.cost_likely_case) : null,
        best_case_amount: data.cost_best_case ? parseFloat(data.cost_best_case) : null,
        is_feasibility: true,
        feasibility_portfolio_id: portfolioId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feasibility-budget-items'] });
      setFormData({
        phase_id: '',
        category: '' as 'fixed' | 'variable' | 'other' | '',
        item_name: '',
        description: '',
        cost_worst_case: '',
        cost_likely_case: '',
        cost_best_case: '',
        currency: 'USD',
      });
      toast({ title: 'Success', description: 'Budget item added' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: `Failed to add budget item: ${error.message}`, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await PhaseBudgetService.deleteBudgetItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feasibility-budget-items'] });
      toast({ title: 'Success', description: 'Budget item deleted' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phase_id || !formData.category || !formData.item_name) {
      toast({ title: 'Validation Error', description: 'Phase, category, and item name are required', variant: 'destructive' });
      return;
    }
    createMutation.mutate(formData);
  };

  const totalBudget = {
    worst: PhaseBudgetService.calculateScenarioTotals(budgetItems, 'worst'),
    likely: PhaseBudgetService.calculateScenarioTotals(budgetItems, 'likely'),
    best: PhaseBudgetService.calculateScenarioTotals(budgetItems, 'best'),
  };

  // Group items by phase
  const itemsByPhase = useMemo(() => {
    const grouped = new Map<string, typeof budgetItems>();
    budgetItems.forEach(item => {
      const existing = grouped.get(item.phase_id) || [];
      grouped.set(item.phase_id, [...existing, item]);
    });
    return grouped;
  }, [budgetItems]);

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Budget Planning: {productName}</DialogTitle>
          <DialogDescription>
            Define budget items with three-point estimates (worst/likely/best case scenarios)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Worst Case</div>
              <div className="text-2xl font-bold">${(totalBudget.worst / 1000).toFixed(0)}k</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Likely Case</div>
              <div className="text-2xl font-bold">${(totalBudget.likely / 1000).toFixed(0)}k</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Best Case</div>
              <div className="text-2xl font-bold">${(totalBudget.best / 1000).toFixed(0)}k</div>
            </div>
          </div>

          {/* Budget Items by Phase */}
          {budgetItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Budget Items by Phase</h3>
              {phases.map(phase => {
                const phaseItems = itemsByPhase.get(phase.id) || [];
                if (phaseItems.length === 0) return null;

                const phaseWorst = phaseItems.reduce((sum, item) => sum + (item.worst_case_amount || 0), 0);
                const phaseLikely = phaseItems.reduce((sum, item) => sum + (item.likely_case_amount || 0), 0);
                const phaseBest = phaseItems.reduce((sum, item) => sum + (item.best_case_amount || 0), 0);
                const isExpanded = expandedPhases.has(phase.id);

                return (
                  <Collapsible key={phase.id} open={isExpanded} onOpenChange={() => togglePhase(phase.id)}>
                    <div className="border rounded-lg">
                      <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="font-medium">{phase.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Subtotal: ${phaseWorst.toLocaleString()} / ${phaseLikely.toLocaleString()} / ${phaseBest.toLocaleString()}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Category</TableHead>
                              <TableHead>Item</TableHead>
                              <TableHead>Worst</TableHead>
                              <TableHead>Likely</TableHead>
                              <TableHead>Best</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {phaseItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium capitalize">{item.category}</TableCell>
                                <TableCell>{item.item_name}</TableCell>
                                <TableCell>${item.worst_case_amount?.toLocaleString() || '-'}</TableCell>
                                <TableCell>${item.likely_case_amount?.toLocaleString() || '-'}</TableCell>
                                <TableCell>${item.best_case_amount?.toLocaleString() || '-'}</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteMutation.mutate(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}

          {/* Add New Item Form */}
          <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
            <h3 className="font-semibold">Add New Budget Item</h3>
            
            {phasesLoading ? (
              <p className="text-sm text-muted-foreground">Loading phases...</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phase">Phase *</Label>
                    <Select value={formData.phase_id} onValueChange={(value) => setFormData({ ...formData, phase_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select phase" />
                      </SelectTrigger>
                      <SelectContent>
                        {phases.map((phase) => (
                          <SelectItem key={phase.id} value={phase.id}>{phase.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item_name">Item Name *</Label>
                    {formData.phase_id === 'post-launch-general' ? (
                      <Select value={formData.item_name} onValueChange={(value) => setFormData({ ...formData, item_name: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select typical post-launch item" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {POST_LAUNCH_ITEMS.map((item) => (
                            <SelectItem key={item} value={item}>{item}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="item_name"
                        value={formData.item_name}
                        onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                        placeholder="e.g., Engineering Team"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Cost Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as any })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Additional details..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost_worst">Worst Case ($)</Label>
                    <Input
                      id="cost_worst"
                      type="number"
                      value={formData.cost_worst_case}
                      onChange={(e) => setFormData({ ...formData, cost_worst_case: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost_likely">Likely Case ($) *</Label>
                    <Input
                      id="cost_likely"
                      type="number"
                      value={formData.cost_likely_case}
                      onChange={(e) => setFormData({ ...formData, cost_likely_case: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost_best">Best Case ($)</Label>
                    <Input
                      id="cost_best"
                      type="number"
                      value={formData.cost_best_case}
                      onChange={(e) => setFormData({ ...formData, cost_best_case: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={createMutation.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Budget Item
                </Button>
              </>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
