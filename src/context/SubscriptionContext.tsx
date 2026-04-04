import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { SubscriptionStatus, getPlanByProductId, PlanKey, FREE_PLAN_PRODUCT_ID } from '@/types/subscription';
import { isMenuItemEnabled, getMenuAccessKey } from '@/constants/menuAccessKeys';

// Re-export the SubscriptionPlan interface for use by consumers
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  stripe_product_id: string;
  stripe_price_id: string;
  price: number;
  currency: string;
  interval: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  features: string[];
  menu_access: Record<string, boolean | string> | null;
  master_emails?: string[];
  created_at: string;
  updated_at: string;
}

interface TrialInfo {
  daysLeft: number;
  isTrialing: boolean;
}

interface SubscriptionContextType {
  // User's subscription
  subscription: SubscriptionStatus | null;
  currentPlan: PlanKey | null;
  isSubscriptionLoading: boolean;

  // Trial and grace period info
  trialInfo: TrialInfo | null;
  isGracePeriod: boolean;
  gracePeriodDaysLeft: number;

  // Subscription expiry
  isSubscriptionExpired: boolean;

  // All plans (cached)
  plans: SubscriptionPlan[];
  restoredPlans: SubscriptionPlan[];
  isPlansLoading: boolean;

  // Master access check (cached)
  isMasterPlanUser: boolean;

  // Menu access helpers (derived from current plan)
  menuAccess: Record<string, boolean | string> | null;
  featureLimits: Record<string, number> | null;
  planName: string | null;

  // Helper functions
  isMenuEnabled: (menuItemId: string, moduleId?: string) => boolean;
  isMenuAccessKeyEnabled: (menuAccessKey: string) => boolean;
  getFeatureLimit: (menuAccessKey: string) => number | null;

  // Refresh functions
  refreshSubscription: () => Promise<void>;
  refreshPlans: () => Promise<void>;

  // Stats helper
  getStats: () => { total: number; active: number; featured: number };
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { user } = useAuth();

  // Get company from URL (for URL-aware plan fetching)
  const { companyName: urlCompanyName, productId: urlProductId } = useParams<{ companyName: string; productId: string }>();
  const location = useLocation();

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanKey | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [isGracePeriod, setIsGracePeriod] = useState(false);
  const [gracePeriodDaysLeft, setGracePeriodDaysLeft] = useState(0);
  const [directPlanName, setDirectPlanName] = useState<string | null>(null);

  // Plans state
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [restoredPlans, setRestoredPlans] = useState<SubscriptionPlan[]>([]);
  const [isPlansLoading, setIsPlansLoading] = useState(true);

  // New pricing system menu access (takes precedence)
  const [newPricingMenuAccess, setNewPricingMenuAccess] = useState<Record<string, boolean | string> | null>(null);

  // Subscription expiry tracking
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);

  // Master email state
  const [masterEmails, setMasterEmails] = useState<string[]>([]);
  const [isMasterPlanUser, setIsMasterPlanUser] = useState(false);

  // Track initial load
  const hasInitiallyLoadedSubscription = useRef(false);
  const hasLoadedPlans = useRef(false);

  // Load all subscription plans (active and inactive) in ONE query
  const loadPlans = useCallback(async () => {
    if (hasLoadedPlans.current) {
      return; // Already loaded
    }

    try {
      setIsPlansLoading(true);

      // Single query to get ALL plans (both active and inactive)
      const { data, error: fetchError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order')
        .order('price');

      if (fetchError) throw fetchError;

      // Type and split the data
      const typedData = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features as string[] : [],
        menu_access: plan.menu_access as Record<string, boolean | string> | null,
        master_emails: plan.master_emails as string[] | undefined
      })) as SubscriptionPlan[];

      // Split into active and inactive (restored)
      const activePlans = typedData.filter(p => p.is_active);
      const inactivePlans = typedData.filter(p => !p.is_active);

      setPlans(activePlans);
      setRestoredPlans(inactivePlans);

      // Extract master_emails from subscription_plans first
      let foundMasterEmails: string[] = [];
      const planWithMasterEmails = typedData.find(p => p.master_emails && p.master_emails.length > 0);
      if (planWithMasterEmails?.master_emails) {
        foundMasterEmails = planWithMasterEmails.master_emails.map(e => e.toLowerCase());
      }

      // new_pricing_plans does not have master_emails — skip fallback

      if (foundMasterEmails.length > 0) {
        setMasterEmails(foundMasterEmails);
      }

      hasLoadedPlans.current = true;
      // console.log('[SubscriptionContext] Plans loaded:', {
      //   active: activePlans.length,
      //   inactive: inactivePlans.length,
      //   masterEmails: planWithMasterEmails?.master_emails?.length || 0
      // });
    } catch (err) {
      console.error('[SubscriptionContext] Error loading plans:', err);
    } finally {
      setIsPlansLoading(false);
    }
  }, []);

  // Cache user ID to avoid recreating callback when user object reference changes
  const userId = user?.id;
  const userCreatedAt = user?.created_at;

  // Check user's subscription
  const checkSubscription = useCallback(async (isBackgroundRefresh = false) => {
    if (!userId) {
      setSubscription(null);
      setCurrentPlan(null);
      setTrialInfo(null);
      setIsGracePeriod(false);
      setGracePeriodDaysLeft(0);
      setDirectPlanName(null);
      setNewPricingMenuAccess(null);
      setIsSubscriptionExpired(false);
      setIsSubscriptionLoading(false);
      return;
    }

    try {
      // Only set loading state on initial load, NOT on background refreshes
      if (!isBackgroundRefresh && !hasInitiallyLoadedSubscription.current) {
        setIsSubscriptionLoading(true);
      }

      // Get subscription from user_subscriptions table
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      if (subData) {
        const now = new Date();
        const trialEnd = subData.trial_end ? new Date(subData.trial_end) : null;
        const periodEnd = subData.current_period_end ? new Date(subData.current_period_end) : null;

        // Check if this is a free plan (no period end, status active, product_id matches free plan)
        const isFreePlan = subData.product_id === FREE_PLAN_PRODUCT_ID ||
                          (subData.status === 'active' && !periodEnd && !trialEnd);

        const isTrialing = subData.status === 'trialing' && trialEnd && trialEnd > now;
        const isActive = subData.status === 'active' && (isFreePlan || (periodEnd && periodEnd > now));

        let daysLeft = 0;
        if (isTrialing && trialEnd) {
          daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }

        setTrialInfo({ daysLeft, isTrialing: isTrialing && !isFreePlan });
        setIsGracePeriod(false);
        setGracePeriodDaysLeft(0);

        setSubscription({
          subscribed: isActive || isTrialing || isFreePlan,
          product_id: subData.product_id || undefined,
          subscription_end: periodEnd?.toISOString(),
          trial_end: trialEnd?.toISOString(),
          status: subData.status,
        });

        if (subData.product_id) {
          const plan = getPlanByProductId(subData.product_id);
          setCurrentPlan(plan);
        } else {
          // Default to free plan if no product_id
          setCurrentPlan('business_connect');
        }

        // Priority 1: Check new pricing system (new_pricing_company_plans table)
        // This takes precedence over stripe_subscriptions for accurate plan display
        let foundPlanName: string | null = null;

        // Get the company ID to use for plan lookup
        // Priority: URL company > product's company > user's primary company > any company
        let userCompanyId: string | null = null;

        // 1. Check if company name is in URL
        if (urlCompanyName) {
          const decodedName = decodeURIComponent(urlCompanyName);
          // Check if it's already a UUID
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(decodedName)) {
            userCompanyId = decodedName;
          } else {
            // Resolve company name to ID
            const { data: companyByName } = await supabase
              .from('companies')
              .select('id')
              .eq('name', decodedName)
              .limit(1)
              .single();
            if (companyByName?.id) {
              userCompanyId = companyByName.id;
            }
          }
        }

        // 2. Check if we're on a product route and can get company from product
        if (!userCompanyId && urlProductId && location.pathname.includes('/product/')) {
          const { data: product } = await supabase
            .from('products')
            .select('company_id')
            .eq('id', urlProductId)
            .single();
          if (product?.company_id) {
            userCompanyId = product.company_id;
          }
        }

        // 3. Fallback: Try to get primary company from user_company_access
        if (!userCompanyId) {
          const { data: primaryCompany } = await supabase
            .from('user_company_access')
            .select('company_id')
            .eq('user_id', userId)
            .eq('is_primary', true)
            .limit(1)
            .single();

          if (primaryCompany?.company_id) {
            userCompanyId = primaryCompany.company_id;
          } else {
            // Fallback: get any company the user has access to
            const { data: anyCompany } = await supabase
              .from('user_company_access')
              .select('company_id')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            userCompanyId = anyCompany?.company_id || null;
          }
        }

        if (userCompanyId) {
          // Fetch the company's plan from new pricing system (includes menu_access and expires_at)
          const { data: companyPlan } = await supabase
            .from('new_pricing_company_plans')
            .select(`
              id,
              status,
              expires_at,
              plan:new_pricing_plans(
                name,
                display_name,
                menu_access
              )
            `)
            .eq('company_id', userCompanyId)
            .in('status', ['active', 'trial', 'cancelled'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (companyPlan?.plan) {
            const plan = companyPlan.plan as {
              name: string;
              display_name: string | null;
              menu_access: Record<string, boolean | string> | null;
            };
            // Use display_name if available, otherwise use name
            foundPlanName = plan.display_name || plan.name;

            // Check if subscription has expired based on expires_at date
            const expiresAt = companyPlan.expires_at ? new Date(companyPlan.expires_at) : null;
            const now = new Date();
            const expired = expiresAt !== null && expiresAt < now;
            const companyPlanStatus = companyPlan.status as string;

            if (expired) {
              // Status is cancelled/expired AND past expires_at → lock all menus
              setIsSubscriptionExpired(true);
              if (plan.menu_access) {
                const lockedAccess: Record<string, boolean | string> = {};
                Object.keys(plan.menu_access).forEach((key) => {
                  lockedAccess[key] = false;
                });
                setNewPricingMenuAccess(lockedAccess);
              } else {
                setNewPricingMenuAccess({ _all_locked: false } as Record<string, boolean | string>);
              }
            } else {
              // Not expired
              setIsSubscriptionExpired(false);
              const isGenesisPlan = plan.name === 'genesis' || plan.display_name?.toLowerCase() === 'genesis';
              if (isGenesisPlan && plan.menu_access) {
                setNewPricingMenuAccess(plan.menu_access);
              } else {
                // Non-Genesis plans get full access (null = no restrictions)
                setNewPricingMenuAccess(null);
              }
            }
          } else {
            setNewPricingMenuAccess(null);
            setIsSubscriptionExpired(false);
          }
        } else {
          setNewPricingMenuAccess(null);
          setIsSubscriptionExpired(false);
        }

        setDirectPlanName(foundPlanName);
      } else {
        // No subscription record - check if user is in 30-day grace period
        // Use cached created_at from AuthContext
        const createdAtDate = userCreatedAt
          ? new Date(userCreatedAt)
          : new Date();
        const now = new Date();
        const daysSinceCreation = Math.floor((now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24));
        const gracePeriodDays = 30;

        if (daysSinceCreation < gracePeriodDays) {
          // User is in grace period
          const daysLeftValue = gracePeriodDays - daysSinceCreation;
          setIsGracePeriod(true);
          setGracePeriodDaysLeft(daysLeftValue);
          setSubscription({ subscribed: true }); // Allow access during grace period
        } else {
          // Grace period expired
          setIsGracePeriod(false);
          setGracePeriodDaysLeft(0);
          setSubscription({ subscribed: false });
        }

        setCurrentPlan(null);
        setTrialInfo(null);
        setDirectPlanName(null);
        setNewPricingMenuAccess(null);
        setIsSubscriptionExpired(false);
      }
    } catch (error) {
      console.error('[SubscriptionContext] Error checking subscription:', error);
      setSubscription({ subscribed: false });
      setCurrentPlan(null);
      setTrialInfo(null);
      setIsGracePeriod(false);
      setGracePeriodDaysLeft(0);
      setDirectPlanName(null);
      setNewPricingMenuAccess(null);
      setIsSubscriptionExpired(false);
    } finally {
      if (!isBackgroundRefresh || !hasInitiallyLoadedSubscription.current) {
        setIsSubscriptionLoading(false);
        hasInitiallyLoadedSubscription.current = true;
      }
    }
  }, [userId, userCreatedAt, urlCompanyName, urlProductId, location.pathname]);

  // Check master plan access when user or master emails change
  useEffect(() => {
    const userEmail = user?.email?.toLowerCase();
    if (userEmail && masterEmails.length > 0) {
      const hasMasterAccess = masterEmails.includes(userEmail);
      setIsMasterPlanUser(hasMasterAccess);
      if (hasMasterAccess) {
        // console.log('[SubscriptionContext] User has Master Email access:', userEmail);
      }
    } else {
      setIsMasterPlanUser(false);
    }
  }, [user?.email, masterEmails]);

  // Initial load and background refresh
  useEffect(() => {
    // Load plans once (doesn't depend on user)
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    // Initial subscription check
    checkSubscription(false);

    // Background refresh every 5 minutes (silent)
    const interval = setInterval(() => checkSubscription(true), 300000);

    return () => clearInterval(interval);
  }, [checkSubscription]);

  // Find the matching plan from database by stripe_product_id
  const matchedPlan = useMemo(() => {
    const allPlans = [...plans, ...restoredPlans];
    if (!allPlans.length) {
      return null;
    }

    // If user has a subscription with product_id, match by stripe_product_id
    if (subscription?.product_id) {
      return allPlans.find(p => p.stripe_product_id === subscription.product_id) || null;
    }

    // For grace period users (no subscription), apply "Startup" plan restrictions
    if (isGracePeriod) {
      return allPlans.find(p => p.name === 'Startup') || null;
    }

    return null;
  }, [subscription?.product_id, plans, restoredPlans, isGracePeriod]);

  // Get plan name (for display) - master users always see "Helix OS"
  const planName = useMemo(() => {
    // Master plan users (VIP emails) always get Helix OS
    if (isMasterPlanUser) {
      return 'Helix OS';
    }
    // First priority: use plan_name from new pricing system
    if (directPlanName) {
      return directPlanName;
    }
    if (isGracePeriod) {
      return 'Trial';
    }
    if (matchedPlan) {
      return matchedPlan.name;
    }
    return null;
  }, [directPlanName, matchedPlan, isGracePeriod, isMasterPlanUser]);

  // Get menu access from the plan (excluding _feature_limits)
  // Priority: new pricing system menu_access > subscription_plans menu_access
  const menuAccess = useMemo(() => {
    // Use new pricing system menu_access if available (takes precedence)
    const rawAccess = newPricingMenuAccess || matchedPlan?.menu_access;
    if (!rawAccess) return null;

    // Filter out _feature_limits key, keep boolean and string values
    const filtered: Record<string, boolean | string> = {};
    Object.entries(rawAccess).forEach(([key, value]) => {
      if (key !== '_feature_limits' && (typeof value === 'boolean' || typeof value === 'string')) {
        filtered[key] = value;
      }
    });
    return filtered;
  }, [newPricingMenuAccess, matchedPlan]);

  // Get feature limits from menu_access._feature_limits
  // Priority: new pricing system > subscription_plans
  const featureLimits = useMemo(() => {
    // Use new pricing system first
    if (newPricingMenuAccess) {
      const rawAccess = newPricingMenuAccess as Record<string, unknown>;
      if (rawAccess._feature_limits) {
        const limits = rawAccess._feature_limits as Record<string, number>;
        return typeof limits === 'object' ? limits : null;
      }
    }

    // Fallback to subscription_plans
    const rawAccess = matchedPlan?.menu_access as Record<string, unknown> | undefined;
    if (!rawAccess?._feature_limits) return null;

    const limits = rawAccess._feature_limits as Record<string, number>;
    return typeof limits === 'object' ? limits : null;
  }, [newPricingMenuAccess, matchedPlan]);

  // Helper functions
  const isMenuAccessKeyEnabled = useCallback((menuAccessKey: string): boolean => {
    // Master plan users have access to everything
    if (isMasterPlanUser) return true;
    // If subscription is expired, lock all menus
    if (isSubscriptionExpired) return false;
    return isMenuItemEnabled(menuAccess, menuAccessKey);
  }, [menuAccess, isMasterPlanUser, isSubscriptionExpired]);

  const isMenuEnabled = useCallback((menuItemId: string, moduleId?: string): boolean => {
    // Master plan users have access to everything
    if (isMasterPlanUser) return true;
    // If subscription is expired, lock all menus
    if (isSubscriptionExpired) return false;

    // Get the menu_access key for this menu item
    const menuAccessKey = getMenuAccessKey(menuItemId, moduleId);

    if (!menuAccessKey) {
      // No mapping found, allow by default
      return true;
    }

    return isMenuItemEnabled(menuAccess, menuAccessKey);
  }, [menuAccess, isMasterPlanUser, isSubscriptionExpired]);

  const getFeatureLimit = useCallback((menuAccessKey: string): number | null => {
    if (!featureLimits) return null;
    const limit = featureLimits[menuAccessKey];
    return typeof limit === 'number' ? limit : null;
  }, [featureLimits]);

  const refreshSubscription = useCallback(async () => {
    await checkSubscription(false);
  }, [checkSubscription]);

  const refreshPlans = useCallback(async () => {
    hasLoadedPlans.current = false;
    await loadPlans();
  }, [loadPlans]);

  const getStats = useCallback(() => {
    const total = plans.length;
    const active = plans.filter(p => p.is_active).length;
    const featured = plans.filter(p => p.is_featured).length;
    return { total, active, featured };
  }, [plans]);

  // Memoize context value
  const contextValue = useMemo<SubscriptionContextType>(() => ({
    // Subscription
    subscription,
    currentPlan,
    isSubscriptionLoading,
    trialInfo,
    isGracePeriod,
    gracePeriodDaysLeft,
    isSubscriptionExpired,

    // Plans
    plans,
    restoredPlans,
    isPlansLoading,

    // Master access
    isMasterPlanUser,

    // Menu access
    menuAccess,
    featureLimits,
    planName,

    // Helper functions
    isMenuEnabled,
    isMenuAccessKeyEnabled,
    getFeatureLimit,

    // Refresh functions
    refreshSubscription,
    refreshPlans,

    // Stats
    getStats,
  }), [
    subscription,
    currentPlan,
    isSubscriptionLoading,
    trialInfo,
    isGracePeriod,
    gracePeriodDaysLeft,
    isSubscriptionExpired,
    plans,
    restoredPlans,
    isPlansLoading,
    isMasterPlanUser,
    menuAccess,
    featureLimits,
    planName,
    isMenuEnabled,
    isMenuAccessKeyEnabled,
    getFeatureLimit,
    refreshSubscription,
    refreshPlans,
    getStats,
  ]);

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}
