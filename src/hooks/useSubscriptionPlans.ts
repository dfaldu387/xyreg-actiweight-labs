import { useSubscriptionContext, SubscriptionPlan } from '@/context/SubscriptionContext';

// Re-export the SubscriptionPlan interface for backward compatibility
export type { SubscriptionPlan };

/**
 * Hook to get subscription plans from the cached SubscriptionContext.
 * This replaces direct database queries with cached data.
 *
 * @returns Plans data and helper functions with same interface as before
 */
export function useSubscriptionPlans() {
  const { plans, restoredPlans, isPlansLoading, refreshPlans, getStats } = useSubscriptionContext();

  return {
    plans,
    restoredPlans,
    isLoading: isPlansLoading,
    isRestoredLoading: isPlansLoading,
    error: null as string | null,
    refreshPlans,
    getStats,
  };
}
