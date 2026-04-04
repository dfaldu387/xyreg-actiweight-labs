import { useSubscriptionContext } from '@/context/SubscriptionContext';

// Re-export types from subscription for backward compatibility
export type { SubscriptionStatus, PlanKey } from '@/types/subscription';
export { getPlanByProductId, FREE_PLAN_PRODUCT_ID } from '@/types/subscription';

/**
 * Hook to get user subscription status from the cached SubscriptionContext.
 * This replaces direct database queries with cached data.
 *
 * @returns Subscription data with same interface as before
 */
export function useSubscription() {
  const context = useSubscriptionContext();

  return {
    subscription: context.subscription,
    currentPlan: context.currentPlan,
    isLoading: context.isSubscriptionLoading,
    trialInfo: context.trialInfo,
    isGracePeriod: context.isGracePeriod,
    gracePeriodDaysLeft: context.gracePeriodDaysLeft,
    refreshSubscription: context.refreshSubscription,
  };
}
