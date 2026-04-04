import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PhaseBudgetService, PhaseBudgetItem } from '@/services/phaseBudgetService';
import { supabase } from '@/integrations/supabase/client';
import { Calculator, Clock, DollarSign } from 'lucide-react';

interface PhaseBudgetIntegrationProps {
  productId: string;
  onDevelopmentCostsUpdate: (costs: {
    totalActual: number;
    totalBudgeted: number;
    totalDevelopmentCosts: number;
    phaseBreakdown: { phaseId: string; phaseName: string; actual: number; budgeted: number; }[];
  }) => void;
}

export function PhaseBudgetIntegration({
  productId,
  onDevelopmentCostsUpdate
}: PhaseBudgetIntegrationProps) {
  const [phaseData, setPhaseData] = useState<any[]>([]);
  const [budgetSummary, setBudgetSummary] = useState({
    totalActual: 0,
    totalBudgeted: 0,
    totalDevelopmentCosts: 0,
    phaseBreakdown: [] as { phaseId: string; phaseName: string; actual: number; budgeted: number; }[]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPhaseBudgetData();
  }, [productId]);

  // Helper function to calculate phase duration in days
  const calculatePhaseDuration = (phase: any): number | undefined => {
    // First try to use the duration_days from company_phases
    if (phase.company_phases?.duration_days && phase.company_phases.duration_days > 0) {
      return phase.company_phases.duration_days;
    }
    
    // Fall back to calculating from start_date and end_date
    if (phase.start_date && phase.end_date) {
      const startDate = new Date(phase.start_date);
      const endDate = new Date(phase.end_date);
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : undefined;
    }
    
    return undefined;
  };

  const loadPhaseBudgetData = async () => {
    try {
      setIsLoading(true);

      // Get all phases for this product with duration information
      const { data: phases, error: phasesError } = await supabase
        .from('lifecycle_phases')
        .select(`
          id,
          name,
          status,
          start_date,
          end_date,
          company_phases!inner(
            id,
            name,
            position,
            duration_days
          )
        `)
        .eq('product_id', productId)
        .order('company_phases(position)');

      if (phasesError) {
        console.error('Error loading phases:', phasesError);
        return;
      }

      const phaseDataWithBudgets = await Promise.all(
        (phases || []).map(async (phase) => {
          const budgetItems = await PhaseBudgetService.getBudgetItemsByPhase(phase.id);
          const phaseDurationDays = calculatePhaseDuration(phase);
          
          // Log detailed information for debugging
          const variableItems = budgetItems.filter(item => item.category === 'variable');
          console.log(`[PhaseBudgetIntegration] Phase: ${phase.name}`);
          console.log(`  - Duration: ${phaseDurationDays} days`);
          console.log(`  - Budget items: ${budgetItems.length} (${variableItems.length} variable)`);
          if (variableItems.length > 0) {
            console.log(`  - Variable items:`, variableItems.map(item => `${item.item_name}: $${item.cost}/day`));
          }
          
          const totals = PhaseBudgetService.calculateTotals(budgetItems, phaseDurationDays);
          
          // Log calculated totals for verification
          if (variableItems.length > 0 && phaseDurationDays) {
            console.log(`  - Variable costs: $${totals.variableDaily}/day × ${phaseDurationDays} days = $${totals.variable}`);
          }

          return {
            ...phase,
            budgetItems,
            totals,
            durationDays: phaseDurationDays
          };
        })
      );

      setPhaseData(phaseDataWithBudgets);

      // Calculate overall totals
      const summary = phaseDataWithBudgets.reduce(
        (acc, phase) => {
          acc.totalActual += phase.totals.actualTotal;
          acc.totalBudgeted += phase.totals.total;
          acc.phaseBreakdown.push({
            phaseId: phase.id,
            phaseName: phase.company_phases?.name || phase.name,
            actual: phase.totals.actualTotal,
            budgeted: phase.totals.total
          });
          return acc;
        },
        {
          totalActual: 0,
          totalBudgeted: 0,
          totalDevelopmentCosts: 0,
          phaseBreakdown: [] as { phaseId: string; phaseName: string; actual: number; budgeted: number; }[]
        }
      );

      // Use actual costs when available, fall back to budgeted
      summary.totalDevelopmentCosts = summary.totalActual > 0 ? summary.totalActual : summary.totalBudgeted;

      setBudgetSummary(summary);
      onDevelopmentCostsUpdate(summary);

    } catch (error) {
      console.error('Error loading phase budget data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Development Costs from Phase Budgets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading phase budget data...</div>
        </CardContent>
      </Card>
    );
  }

  const hasActualCosts = budgetSummary.totalActual > 0;
  const completionPercentage = budgetSummary.totalBudgeted > 0 
    ? (budgetSummary.totalActual / budgetSummary.totalBudgeted) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Development Costs from Phase Budgets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Budgeted</span>
            </div>
            <p className="text-lg font-semibold">
              ${budgetSummary.totalBudgeted.toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Actual Spent</span>
            </div>
            <p className="text-lg font-semibold">
              ${budgetSummary.totalActual.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Used in Analysis</span>
              <Badge variant={hasActualCosts ? "default" : "secondary"} className="text-xs">
                {hasActualCosts ? "Actual" : "Budgeted"}
              </Badge>
            </div>
            <p className="text-lg font-semibold">
              ${budgetSummary.totalDevelopmentCosts.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Progress */}
        {budgetSummary.totalBudgeted > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Budget Utilization</span>
              <span>{completionPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={completionPercentage} className="w-full" />
          </div>
        )}

        {/* Phase Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Phase Breakdown</h4>
          <div className="space-y-2">
            {budgetSummary.phaseBreakdown.map((phase) => (
              <div key={phase.phaseId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="text-sm">{phase.phaseName}</span>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    ${(phase.actual > 0 ? phase.actual : phase.budgeted).toLocaleString()}
                  </div>
                  {phase.actual > 0 && phase.budgeted > 0 && phase.actual !== phase.budgeted && (
                    <div className="text-xs text-muted-foreground">
                      Budget: ${phase.budgeted.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {budgetSummary.phaseBreakdown.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No phase budget data available</p>
            <p className="text-xs">Development costs will use default values</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}