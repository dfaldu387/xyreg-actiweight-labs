import { useProductPhases } from '@/hooks/useProductPhases';
import { useState, useEffect } from 'react';
import { BudgetIntegrationService, PhaseBudgetData } from '@/services/enhanced-rnpv/budgetIntegrationService';

/**
 * Hook to integrate real project timeline with rNPV calculations
 * Uses the actual phases from the milestones/phases system with real budget data
 */
export function useRealProjectTimeline(productId: string, companyId: string) {
  const { phases, isLoading } = useProductPhases(productId, companyId);
  const [phaseBudgets, setPhaseBudgets] = useState<PhaseBudgetData[]>([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);

  // Load real budget data from milestones
  useEffect(() => {
    if (!productId) return;

    const loadBudgets = async () => {
      setBudgetsLoading(true);
      try {
        const budgets = await BudgetIntegrationService.loadRealPhaseBudgets(productId);
        setPhaseBudgets(budgets);
      } catch (error) {
        console.error('[useRealProjectTimeline] Error loading budgets:', error);
        setPhaseBudgets([]);
      } finally {
        setBudgetsLoading(false);
      }
    };

    loadBudgets();

    // Subscribe to budget changes
    const unsubscribe = BudgetIntegrationService.subscribeToBudgetChanges(productId, () => {
      console.log('[useRealProjectTimeline] Budget changed, reloading');
      loadBudgets();
    });

    return unsubscribe;
  }, [productId]);

  // Process phases for rNPV calculation with real budget data
  const processTimelineForRNPV = () => {
    if (!phases || phases.length === 0) {
      return null;
    }

    // Find project boundaries
    const phasesWithDates = phases.filter(p => p.start_date && p.end_date);
    const projectStartDate = phasesWithDates.length > 0 
      ? new Date(Math.min(...phasesWithDates.map(p => new Date(p.start_date!).getTime())))
      : null;

    // Merge phases with budget data
    const phasesWithCosts = phases.map(phase => {
      // Find matching budget data
      const budgetData = phaseBudgets.find(b => b.phaseId === phase.id);
      
      if (budgetData) {
        // Use real budget data from milestones
        return {
          ...phase,
          totalCost: budgetData.totalBudget,
          actualCost: budgetData.totalActual,
          preLaunchCosts: budgetData.preLaunchCost,
          postLaunchCosts: budgetData.postLaunchCost,
          isContinuous: budgetData.isContinuous,
          dataSource: budgetData.dataSource,
          lastUpdated: budgetData.lastUpdated
        };
      }
      
      // Fallback to zero if no budget data
      return {
        ...phase,
        totalCost: 0,
        actualCost: 0,
        preLaunchCosts: 0,
        postLaunchCosts: 0,
        isContinuous: phase.is_continuous_process || false,
        dataSource: 'estimated' as const,
        lastUpdated: new Date()
      };
    });

    const continuousPhases = phasesWithCosts.filter(p => p.isContinuous);
    const discretePhases = phasesWithCosts.filter(p => !p.isContinuous);
    
    const totalInvestment = phasesWithCosts.reduce((sum, p) => sum + p.totalCost, 0);
    const totalPreLaunchInvestment = phasesWithCosts.reduce((sum, p) => sum + p.preLaunchCosts, 0);
    const totalPostLaunchInvestment = phasesWithCosts.reduce((sum, p) => sum + p.postLaunchCosts, 0);
    const phasesWithRealBudgets = phasesWithCosts.filter(p => p.dataSource === 'real').length;

    console.log('[useRealProjectTimeline] Timeline processed:', {
      totalInvestment,
      preLaunch: totalPreLaunchInvestment,
      postLaunch: totalPostLaunchInvestment,
      realBudgets: phasesWithRealBudgets,
      totalPhases: phases.length
    });

    return {
      projectStartDate,
      phases: phasesWithCosts,
      continuousPhases,
      discretePhases,
      totalPhasesCount: phases.length,
      phasesWithDatesCount: phasesWithDates.length,
      totalInvestment,
      totalPreLaunchInvestment,
      totalPostLaunchInvestment,
      phasesWithRealBudgets
    };
  };

  return {
    phases,
    phaseBudgets,
    isLoading: isLoading || budgetsLoading,
    timelineData: processTimelineForRNPV(),
    hasValidTimeline: phases && phases.length > 0,
    hasRealBudgets: phaseBudgets.some(b => b.dataSource === 'real')
  };
}