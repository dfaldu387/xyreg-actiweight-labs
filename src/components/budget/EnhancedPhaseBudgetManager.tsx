import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, DollarSign, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PhaseBudgetService, PhaseBudgetItem } from '@/services/phaseBudgetService';
import { TimelineBudgetForm } from './TimelineBudgetForm';
import { TimelineBudgetCalculator } from '@/services/timelineBudgetCalculator';
import { usePhaseTimeline } from '@/hooks/usePhaseTimeline';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface EnhancedPhaseBudgetManagerProps {
  phaseId: string;
  phaseName: string;
  productId: string;
  companyId: string;
}

export function EnhancedPhaseBudgetManager({ 
  phaseId, 
  phaseName, 
  productId, 
  companyId 
}: EnhancedPhaseBudgetManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const timeline = usePhaseTimeline(productId);

  const { data: budgetItems, refetch } = useQuery({
    queryKey: ['phase-budget-items', phaseId],
    queryFn: () => PhaseBudgetService.getBudgetItemsByPhase(phaseId),
  });

  const handleCreateItem = async (data: any) => {
    setIsCreating(true);
    try {
      await PhaseBudgetService.createBudgetItem(data);
      toast.success('Budget item created successfully');
      setShowAddForm(false);
      refetch();
    } catch {
      toast.error('Failed to create budget item');
    } finally {
      setIsCreating(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    const symbol = currency === 'EUR' ? '€' : '$';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getTimingBadgeVariant = (timingType: string) => {
    switch (timingType) {
      case 'pre_launch': return 'secondary';
      case 'post_launch': return 'outline';
      case 'both': return 'default';
      case 'milestone': return 'destructive';
      default: return 'secondary';
    }
  };

  const currentPhase = timeline?.phases.find(p => p.id === phaseId);
  const isPreLaunch = currentPhase?.is_pre_launch ?? true;
  const phaseDurationMonths = currentPhase?.durationMonths ?? 1;

  // Calculate timeline-based totals
  const timelineCalculation = budgetItems ? 
    TimelineBudgetCalculator.calculateTimelineCosts(
      budgetItems,
      phaseDurationMonths,
      isPreLaunch,
      timeline?.launchDate,
      currentPhase?.startDate,
      currentPhase?.endDate
    ) : null;

  if (showAddForm) {
    return (
      <TimelineBudgetForm
        phaseId={phaseId}
        phaseName={phaseName}
        onSubmit={handleCreateItem}
        onCancel={() => setShowAddForm(false)}
        isLoading={isCreating}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Management - {phaseName}
          </div>
          <Button onClick={() => setShowAddForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {timelineCalculation && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/10 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(timelineCalculation.preLaunchCosts)}
              </div>
              <div className="text-sm text-muted-foreground">Pre-Launch Costs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {formatCurrency(timelineCalculation.postLaunchCosts)}
              </div>
              <div className="text-sm text-muted-foreground">Post-Launch Costs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(timelineCalculation.totalCosts)}
              </div>
              <div className="text-sm text-muted-foreground">Total Costs</div>
            </div>
          </div>
        )}

        {budgetItems && budgetItems.length > 0 ? (
          <div className="space-y-3">
            {budgetItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{item.item_name}</h4>
                      <Badge variant={getTimingBadgeVariant(item.timing_type)}>
                        {item.timing_type.replace('_', '-')}
                      </Badge>
                      <Badge variant="outline">
                        {item.frequency}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Primary Cost: </span>
                        <span className="font-medium">
                          {formatCurrency(item.cost, item.currency)}
                          {item.frequency !== 'one_time' && ` / ${item.frequency.slice(0, -2)}`}
                        </span>
                      </div>
                      
                      {item.timing_type === 'both' && item.post_launch_cost && (
                        <div>
                          <span className="text-muted-foreground">Post-Launch: </span>
                          <span className="font-medium">
                            {formatCurrency(item.post_launch_cost, item.currency)}
                            {item.frequency !== 'one_time' && ` / ${item.frequency.slice(0, -2)}`}
                          </span>
                        </div>
                      )}
                      
                      {item.actual_cost !== null && (
                        <div>
                          <span className="text-muted-foreground">Actual: </span>
                          <span className={`font-medium ${
                            item.actual_cost > item.cost ? 'text-destructive' : 'text-green-600'
                          }`}>
                            {formatCurrency(item.actual_cost, item.currency)}
                          </span>
                        </div>
                      )}
                      
                      {(item.active_start_date || item.active_end_date) && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {item.active_start_date && new Date(item.active_start_date).toLocaleDateString()}
                            {item.active_start_date && item.active_end_date && ' - '}
                            {item.active_end_date && new Date(item.active_end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {timelineCalculation && timelineCalculation.breakdown[item.id] && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          Timeline Impact: 
                          {timelineCalculation.breakdown[item.id].preLaunchCost > 0 && (
                            <span className="ml-1">
                              Pre: {formatCurrency(timelineCalculation.breakdown[item.id].preLaunchCost)}
                            </span>
                          )}
                          {timelineCalculation.breakdown[item.id].postLaunchCost > 0 && (
                            <span className="ml-1">
                              Post: {formatCurrency(timelineCalculation.breakdown[item.id].postLaunchCost)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No budget items defined for this phase</p>
            <p className="text-sm">Add timeline-based budget items to track costs accurately</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}