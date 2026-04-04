import { useSubscriptionContext } from '@/context/SubscriptionContext';

interface UsePlanMenuAccessReturn {
  /** The raw menu_access object from the subscription plan (supports boolean and string values) */
  menuAccess: Record<string, boolean | string> | null;
  /** Feature limits for restricted features (e.g., max target markets) */
  featureLimits: Record<string, number> | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Check if a menu item is enabled by its SidebarConfig ID */
  isMenuEnabled: (menuItemId: string, moduleId?: string) => boolean;
  /** Check if a menu item is enabled by its menu_access key */
  isMenuAccessKeyEnabled: (menuAccessKey: string) => boolean;
  /** Get the feature limit for a specific menu_access key (returns null if no limit) */
  getFeatureLimit: (menuAccessKey: string) => number | null;
  /** The current plan name */
  planName: string | null;
  /** Whether the current user has master plan access (bypasses all restrictions) */
  isMasterPlanUser: boolean;
}

/**
 * Hook to fetch and check menu access based on the user's subscription plan.
 *
 * This hook now uses the centralized SubscriptionContext for all data,
 * eliminating duplicate API calls across the application.
 *
 * Usage:
 * ```tsx
 * const { isMenuEnabled, isLoading, planName } = usePlanMenuAccess();
 *
 * // Check by SidebarConfig menu item ID
 * const isDashboardEnabled = isMenuEnabled('company-dashboard', 'portfolio');
 *
 * // Check by menu_access key directly
 * const isCommercialEnabled = isMenuAccessKeyEnabled('portfolio.commercial');
 * ```
 */
export function usePlanMenuAccess(): UsePlanMenuAccessReturn {
  const context = useSubscriptionContext();

  return {
    menuAccess: context.menuAccess,
    featureLimits: context.featureLimits,
    isLoading: context.isSubscriptionLoading || context.isPlansLoading,
    error: null,
    isMenuEnabled: context.isMenuEnabled,
    isMenuAccessKeyEnabled: context.isMenuAccessKeyEnabled,
    getFeatureLimit: context.getFeatureLimit,
    planName: context.planName,
    isMasterPlanUser: context.isMasterPlanUser,
  };
}

/**
 * Get the upgrade message for a disabled menu item
 */
export function getUpgradeMessage(planName: string | null): string {
  if (!planName) {
    return 'Upgrade your plan to access this feature';
  }
  return `This feature is not available on the ${planName} plan. Upgrade to access it.`;
}
