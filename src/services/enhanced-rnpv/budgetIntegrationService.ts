import { supabase } from "@/integrations/supabase/client";
import { DevelopmentPhase } from './interfaces';

export interface PhaseBudgetData {
  phaseId: string;
  phaseName: string;
  totalBudget: number;
  totalActual: number;
  postLaunchCost: number;
  preLaunchCost: number;
  isContinuous: boolean;
  dataSource: 'real' | 'estimated';
  lastUpdated: Date;
  startDate?: string;
  endDate?: string;
  likelihoodOfSuccess: number; // LoS: Likelihood of Success (renamed from LoA)
  status: string; // Phase completion status: 'Completed', 'In Progress', 'Not Started'
}

/**
 * Calculate cumulative LoS from phases, with completed phases treated as 100%
 * This reflects the "risk retired" concept - once a phase is done, its probability is certainty
 */
export function calculateCumulativeLoS(phases: PhaseBudgetData[]): {
  cumulativeLoS: number;
  completedCount: number;
  remainingCount: number;
  allCompleted: boolean;
} {
  if (!phases || phases.length === 0) {
    return { cumulativeLoS: 100, completedCount: 0, remainingCount: 0, allCompleted: true };
  }

  let completedCount = 0;
  let remainingCount = 0;

  const cumulativeLoS = phases.reduce((cumulative, phase) => {
    // Completed phases = 100% (risk retired)
    const isCompleted = phase.status === 'Completed';
    if (isCompleted) {
      completedCount++;
    } else {
      remainingCount++;
    }
    
    const effectiveLoS = isCompleted ? 100 : (phase.likelihoodOfSuccess || 100);
    return cumulative * (effectiveLoS / 100);
  }, 1) * 100;

  return {
    cumulativeLoS,
    completedCount,
    remainingCount,
    allCompleted: remainingCount === 0
  };
}

export interface ProductPhaseBudgetSummary {
  totalBudget: number;
  totalActual: number;
  totalPreLaunch: number;
  totalPostLaunch: number;
  phaseBreakdown: PhaseBudgetData[];
  lastUpdated: Date;
}

export class BudgetIntegrationService {
  /**
   * Load real phase budgets from milestone data
   */
  static async loadRealPhaseBudgets(productId: string, launchDate?: Date): Promise<PhaseBudgetData[]> {
    try {
      // console.log('[BudgetIntegrationService] Loading real phase budgets for product:', productId);

      // Fetch product launch date if not provided
      if (!launchDate) {
        const { data: product } = await supabase
          .from('products')
          .select('projected_launch_date, actual_launch_date')
          .eq('id', productId)
          .single();
        
        if (product) {
          launchDate = product.actual_launch_date 
            ? new Date(product.actual_launch_date)
            : product.projected_launch_date 
              ? new Date(product.projected_launch_date)
              : undefined;
        }
      }

      // console.log('[BudgetIntegrationService] Using launch date for calculations:', launchDate?.toISOString());

      // Get lifecycle phases with budget items and status
      const { data: phases, error: phasesError } = await supabase
        .from('lifecycle_phases')
        .select('id, name, start_date, end_date, likelihood_of_success, status')
        .eq('product_id', productId)
        .order('position');

      if (phasesError) throw phasesError;

      if (!phases || phases.length === 0) {
        // console.log('[BudgetIntegrationService] No phases found for product');
        return [];
      }

      // console.log(`[BudgetIntegrationService] Found ${phases.length} phases, fetching budget items`);

      // Fetch budget items for each phase
      const phaseBudgets: PhaseBudgetData[] = await Promise.all(
        phases.map(async (phase) => {
          const { data: budgetItems, error: budgetError } = await supabase
            .from('phase_budget_items')
            .select('id, item_name, category, cost, actual_cost, post_launch_cost, timing_type, frequency, active_start_date, active_end_date')
            .eq('phase_id', phase.id);
          
          // console.log(`[BudgetIntegrationService] Phase "${phase.name}" (${phase.id}): Found ${budgetItems?.length || 0} budget items`, budgetItems);

          if (budgetError) {
            return {
              phaseId: phase.id,
              phaseName: phase.name,
              totalBudget: 0,
              totalActual: 0,
              postLaunchCost: 0,
              preLaunchCost: 0,
              isContinuous: this.identifyContinuousPhase(phase.name),
              dataSource: 'estimated' as const,
              lastUpdated: new Date(),
              startDate: phase.start_date || undefined,
              endDate: phase.end_date || undefined,
              likelihoodOfSuccess: phase.likelihood_of_success || 100,
              status: phase.status || 'Not Started'
            };
          }

          const items = budgetItems || [];
          
          // Calculate phase duration in days
          let phaseDurationDays: number | undefined;
          if (phase.start_date && phase.end_date) {
            const startDate = new Date(phase.start_date);
            const endDate = new Date(phase.end_date);
            phaseDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          }
          
          // Calculate totals using the same logic as PhaseBudgetService
          const totalBudget = items.reduce((sum, item) => {
            const cost = Number(item.cost) || 0;
            // Variable costs are multiplied by duration
            if (item.category === 'variable' && phaseDurationDays) {
              return sum + (cost * phaseDurationDays);
            }
            return sum + cost;
          }, 0);
          
          const totalActual = items.reduce((sum, item) => {
            const actualCost = Number(item.actual_cost) || 0;
            // Variable costs are multiplied by duration
            if (item.category === 'variable' && phaseDurationDays) {
              return sum + (actualCost * phaseDurationDays);
            }
            return sum + actualCost;
          }, 0);
          
          // Determine if phase is continuous based on name patterns
          const isContinuous = this.identifyContinuousPhase(phase.name);
          
          // Calculate pre/post launch split using date-based logic
          const { preLaunchCost, postLaunchCost } = this.splitContinuousPhaseCosts(
            totalBudget,
            phase.name,
            isContinuous,
            items,
            phase.start_date,
            phase.end_date,
            launchDate
          );

          // console.log(`[BudgetIntegrationService] Phase "${phase.name}": $${totalBudget} budget, dates: ${phase.start_date} to ${phase.end_date}, pre: $${preLaunchCost.toFixed(2)}, post: $${postLaunchCost.toFixed(2)}`);

          return {
            phaseId: phase.id,
            phaseName: phase.name,
            totalBudget,
            totalActual,
            postLaunchCost,
            preLaunchCost,
            isContinuous,
            dataSource: totalBudget > 0 ? 'real' as const : 'estimated' as const,
            lastUpdated: new Date(),
            startDate: phase.start_date || undefined,
            endDate: phase.end_date || undefined,
            likelihoodOfSuccess: phase.likelihood_of_success || 100,
            status: phase.status || 'Not Started'
          };
        })
      );

      const totalRealBudget = phaseBudgets.reduce((sum, p) => sum + p.totalBudget, 0);
      // console.log(`[BudgetIntegrationService] Total real budget: $${totalRealBudget} across ${phaseBudgets.length} phases`);

      return phaseBudgets;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get summary of product phase budgets for rNPV
   */
  static async getProductPhaseBudgetSummary(productId: string, launchDate?: Date): Promise<ProductPhaseBudgetSummary> {
    try {
      const phaseBreakdown = await this.loadRealPhaseBudgets(productId, launchDate);
      
      const summary: ProductPhaseBudgetSummary = {
        totalBudget: phaseBreakdown.reduce((sum, p) => sum + p.totalBudget, 0),
        totalActual: phaseBreakdown.reduce((sum, p) => sum + p.totalActual, 0),
        totalPreLaunch: phaseBreakdown.reduce((sum, p) => sum + p.preLaunchCost, 0),
        totalPostLaunch: phaseBreakdown.reduce((sum, p) => sum + p.postLaunchCost, 0),
        phaseBreakdown,
        lastUpdated: new Date()
      };

      // console.log('[BudgetIntegrationService] Budget summary:', {
      //   total: summary.totalBudget,
      //   preLaunch: summary.totalPreLaunch,
      //   postLaunch: summary.totalPostLaunch,
      //   phases: phaseBreakdown.length
      // });

      return summary;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Convert real phase budgets to rNPV DevelopmentPhase format
   */
  static async convertToRNPVDevelopmentPhases(
    productId: string,
    projectStartDate?: Date,
    launchDate?: Date
  ): Promise<DevelopmentPhase[]> {
    try {
      const phaseBudgets = await this.loadRealPhaseBudgets(productId, launchDate);
      
      // Calculate start months relative to project start
      const baseDate = projectStartDate || new Date();
      
      const developmentPhases: DevelopmentPhase[] = phaseBudgets.map((budget, index) => {
        const phaseStartDate = budget.startDate ? new Date(budget.startDate) : baseDate;
        const phaseEndDate = budget.endDate ? new Date(budget.endDate) : phaseStartDate;
        
        // Calculate months from project start
        const startMonth = projectStartDate 
          ? Math.max(0, Math.floor((phaseStartDate.getTime() - projectStartDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)))
          : index * 2; // Default 2-month spacing
        
        // Calculate duration in months
        const durationMs = phaseEndDate.getTime() - phaseStartDate.getTime();
        const duration = Math.max(1, Math.ceil(durationMs / (30.44 * 24 * 60 * 60 * 1000)));

        return {
          id: budget.phaseId,
          name: budget.phaseName,
          description: `Real project phase: ${budget.phaseName}`,
          likelihoodOfSuccess: budget.likelihoodOfSuccess,
          duration,
          costs: budget.totalBudget,
          startMonth,
          dependencies: [],
          isMarketAgnostic: true,
          isContinuous: budget.isContinuous,
          preLaunchCosts: budget.preLaunchCost,
          postLaunchCosts: budget.postLaunchCost,
          recurringCostFrequency: budget.isContinuous ? 'yearly' as const : undefined
        };
      });

      // console.log('[BudgetIntegrationService] Converted to rNPV development phases:', developmentPhases.map(p => 
      //   `${p.name}: $${p.costs}, continuous: ${p.isContinuous}`
      // ));

      return developmentPhases;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Identify if a phase is continuous based on name patterns
   */
  private static identifyContinuousPhase(phaseName: string): boolean {
    const nameLower = phaseName.toLowerCase();
    const continuousPatterns = [
      'risk management',
      'post-market surveillance',
      'post market surveillance',
      'supplier management',
      'technical documentation',
      'continuous'
    ];

    return continuousPatterns.some(pattern => nameLower.includes(pattern));
  }

  /**
   * Split continuous phase costs into pre-launch and post-launch using date-based calculation
   */
  private static splitContinuousPhaseCosts(
    totalCost: number,
    phaseName: string,
    isContinuous: boolean,
    budgetItems?: any[],
    phaseStartDate?: string | null,
    phaseEndDate?: string | null,
    launchDate?: Date
  ): { preLaunchCost: number; postLaunchCost: number } {
    
    // DATE-BASED CALCULATION (Primary method)
    // If we have all dates, use actual timeline to calculate the split
    if (phaseStartDate && phaseEndDate && launchDate) {
      const startDate = new Date(phaseStartDate);
      const endDate = new Date(phaseEndDate);
      const launch = new Date(launchDate);
      
      // Validate dates - if end is before start, treat as 100% pre-launch
      if (endDate < startDate) {
        return { preLaunchCost: totalCost, postLaunchCost: 0 };
      }
      
      // Case 1: Phase ends before launch → 100% pre-launch
      if (endDate <= launch) {
        // console.log(`[BudgetIntegrationService] Phase "${phaseName}" ends before launch (${endDate.toISOString().split('T')[0]} <= ${launch.toISOString().split('T')[0]}): 100% pre-launch`);
        return { preLaunchCost: totalCost, postLaunchCost: 0 };
      }
      
      // Case 2: Phase starts after launch → 100% post-launch
      if (startDate >= launch) {
        // console.log(`[BudgetIntegrationService] Phase "${phaseName}" starts after launch (${startDate.toISOString().split('T')[0]} >= ${launch.toISOString().split('T')[0]}): 100% post-launch`);
        return { preLaunchCost: 0, postLaunchCost: totalCost };
      }
      
      // Case 3: Phase spans launch date → proportional split based on days
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysBeforeLaunch = Math.ceil((launch.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysAfterLaunch = totalDays - daysBeforeLaunch;
      
      const preLaunchRatio = daysBeforeLaunch / totalDays;
      const preLaunchCost = totalCost * preLaunchRatio;
      const postLaunchCost = totalCost * (1 - preLaunchRatio);
      
      // console.log(`[BudgetIntegrationService] Phase "${phaseName}" spans launch:`, {
      //   startDate: startDate.toISOString().split('T')[0],
      //   endDate: endDate.toISOString().split('T')[0],
      //   launchDate: launch.toISOString().split('T')[0],
      //   totalDays,
      //   daysBeforeLaunch,
      //   daysAfterLaunch,
      //   preLaunchPercentage: (preLaunchRatio * 100).toFixed(1) + '%',
      //   postLaunchPercentage: ((1 - preLaunchRatio) * 100).toFixed(1) + '%',
      //   preLaunchCost: preLaunchCost.toFixed(2),
      //   postLaunchCost: postLaunchCost.toFixed(2)
      // });
      
      return { preLaunchCost, postLaunchCost };
    }
    
    // FALLBACK: Name-based estimation (when dates are missing)
    
    // Non-continuous phases without dates → assume pre-launch
    if (!isContinuous) {
      return {
        preLaunchCost: totalCost,
        postLaunchCost: 0
      };
    }

    // Check if budget items have explicit post_launch_cost
    if (budgetItems && budgetItems.length > 0) {
      const explicitPostLaunch = budgetItems.reduce(
        (sum, item) => sum + (Number(item.post_launch_cost) || 0), 
        0
      );
      
      if (explicitPostLaunch > 0) {
        return {
          preLaunchCost: totalCost - explicitPostLaunch,
          postLaunchCost: explicitPostLaunch
        };
      }
    }

    // Use default ratios based on phase type (legacy fallback)
    const nameLower = phaseName.toLowerCase();
    let preLaunchRatio = 0.5; // Default 50/50 split

    if (nameLower.includes('risk management')) {
      preLaunchRatio = 0.6; // 60% upfront for risk management
    } else if (nameLower.includes('post-market surveillance') || nameLower.includes('post market surveillance')) {
      preLaunchRatio = 0.2; // 20% upfront for post-market surveillance
    } else if (nameLower.includes('technical documentation')) {
      preLaunchRatio = 0.7; // 70% upfront for technical documentation
    } else if (nameLower.includes('supplier management')) {
      preLaunchRatio = 0.5; // 50% upfront for supplier management
    }

    // console.log(`[BudgetIntegrationService] Using name-based ratio for "${phaseName}": ${(preLaunchRatio * 100).toFixed(0)}% pre-launch`);

    return {
      preLaunchCost: totalCost * preLaunchRatio,
      postLaunchCost: totalCost * (1 - preLaunchRatio)
    };
  }

  /**
   * Subscribe to budget changes for real-time updates
   * Note: Supabase real-time doesn't support subquery filters, so we listen to
   * lifecycle_phases changes for this product as a proxy for budget changes.
   * This will trigger on phase updates which often coincide with budget updates.
   */
  static subscribeToBudgetChanges(
    productId: string,
    callback: (payload: any) => void
  ): () => void {
    // console.log('[BudgetIntegrationService] Setting up real-time subscription for product:', productId);

    const subscription = supabase
      .channel(`budget_changes_${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lifecycle_phases',
          filter: `product_id=eq.${productId}`
        },
        (payload) => {
          // console.log('[BudgetIntegrationService] Phase change detected, triggering budget refresh');
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      // console.log('[BudgetIntegrationService] Unsubscribing from budget changes');
      subscription.unsubscribe();
    };
  }
}
