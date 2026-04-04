import { supabase } from '@/integrations/supabase/client';

export interface PlanLimits {
  mvp: number;
  basic: number;
  pro: number;
  enterprise: number;
}

export interface ProductLimitCheck {
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxAllowed: number;
  planName: string;
}

// Plan limits as specified by the user
export const PLAN_PRODUCT_LIMITS: PlanLimits = {
  mvp: 1,
  basic: 2,
  pro: 5,
  enterprise: 10
};

export class ProductLimitService {
  /**
   * Get the plan name from subscription plan data
   */
  private async getPlanNameFromSubscription(subscription: any): Promise<string> {
    if (!subscription?.product_id) return 'MVP';
    
    try {
      // Try to get plan name from database first
      const { data: plan, error } = await supabase
        .from('subscription_plans')
        .select('name')
        .eq('stripe_product_id', subscription.product_id)
        .single();

      if (!error && plan) {
        return plan.name;
      }
    } catch (error) {
      console.warn('Error fetching plan name from database:', error);
    }
    
    // Fallback to hardcoded mapping with actual Stripe product IDs
    const planMapping: Record<string, string> = {
      'prod_TCkYqOai1Z4KLZ': 'MVP (Core Build)',  // MVP
      'prod_TD7zwn4dtDsSXv': 'Basic Plan',        // Basic
      'prod_TCkYOHKTrItTzT': 'Pro Plan',          // Pro
      'prod_TCkZxsavnrL4oH': 'Enterprise Plan',   // Enterprise
      // Legacy mappings (in case old IDs are still in use)
      'prod_mvp_core_build': 'MVP (Core Build)',
      'prod_basic_plan': 'Basic Plan',
      'prod_pro_plan': 'Pro Plan',
      'prod_enterprise_plan': 'Enterprise Plan'
    };
    
    return planMapping[subscription.product_id] || 'MVP (Core Build)';
  }

  /**
   * Get the plan key from subscription plan data
   */
  private async getPlanKeyFromSubscription(subscription: any): Promise<keyof PlanLimits> {
    if (!subscription?.product_id) return 'mvp';
    
    try {
      // Try to get plan key from database first
      const { data: plan, error } = await supabase
        .from('subscription_plans')
        .select('name')
        .eq('stripe_product_id', subscription.product_id)
        .single();

      if (!error && plan) {
        // Map plan names to keys
        const nameToKey: Record<string, keyof PlanLimits> = {
          'MVP (Core Build)': 'mvp',
          'Basic Plan': 'basic',
          'Pro Plan': 'pro',
          'Enterprise Plan': 'enterprise'
        };
        return nameToKey[plan.name] || 'mvp';
      }
    } catch (error) {
      console.warn('Error fetching plan key from database:', error);
    }
    
    // Fallback to hardcoded mapping with actual Stripe product IDs
    const planMapping: Record<string, keyof PlanLimits> = {
      'prod_TCkYqOai1Z4KLZ': 'mvp',  // MVP
      'prod_TD7zwn4dtDsSXv': 'basic', // Basic
      'prod_TCkYOHKTrItTzT': 'pro',   // Pro
      'prod_TCkZxsavnrL4oH': 'enterprise', // Enterprise
      // Legacy mappings (in case old IDs are still in use)
      'prod_mvp_core_build': 'mvp',
      'prod_basic_plan': 'basic',
      'prod_pro_plan': 'pro',
      'prod_enterprise_plan': 'enterprise'
    };
    
    return planMapping[subscription.product_id] || 'mvp';
  }

  /**
   * Count existing products for a company
   */
  private async getProductCount(companyId: string): Promise<number> {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_archived', false); // Only count non-archived products

    if (error) {
      console.error('Error counting products:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get plan limits from database
   */
  private async getPlanLimits(planKey: keyof PlanLimits): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('plan_features')
        .select('max_products')
        .eq('plan_key', planKey)
        .single();

      if (error || !data) {
        // Fallback to hardcoded limits if database query fails
        return PLAN_PRODUCT_LIMITS[planKey];
      }

      return data.max_products;
    } catch (error) {
      console.error('Error fetching plan limits:', error);
      return PLAN_PRODUCT_LIMITS[planKey];
    }
  }

  /**
   * Check if a user can create a new product based on their plan limits
   */
  async canCreateProduct(companyId: string, userId: string): Promise<ProductLimitCheck> {
    try {
      // Get user's subscription
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subError);
        return {
          allowed: false,
          reason: 'Unable to verify subscription status',
          currentCount: 0,
          maxAllowed: 0,
          planName: 'Unknown'
        };
      }

      // If no subscription, check grace period
      if (!subscription) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.created_at) {
          const userCreatedAt = new Date(authUser.created_at);
          const now = new Date();
          const daysSinceCreation = Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceCreation < 30) {
            // User is in grace period, allow with MVP limits
            const currentCount = await this.getProductCount(companyId);
            const maxAllowed = await this.getPlanLimits('mvp');
            
            return {
              allowed: currentCount < maxAllowed,
              reason: currentCount >= maxAllowed ? 
                `You've reached the maximum of ${maxAllowed} product for your trial period. Please subscribe to create more products.` : 
                undefined,
              currentCount,
              maxAllowed,
              planName: 'Trial (MVP)'
            };
          }
        }
        
        return {
          allowed: true,
          reason: 'No active subscription. Please subscribe to create products.',
          currentCount: 0,
          maxAllowed: 0,
          planName: 'None'
        };
      }

      // Check if subscription is active
      const now = new Date();
      const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null;
      const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null;

      const isTrialing = subscription.status === 'trialing' && trialEnd && trialEnd > now;
      const isActive = subscription.status === 'active' && periodEnd && periodEnd > now;

      if (!isTrialing && !isActive) {
        return {
          allowed: false,
          reason: 'Your subscription has expired. Please renew to create products.',
          currentCount: 0,
          maxAllowed: 0,
          planName: 'Expired'
        };
      }

      // Get plan limits
      const planKey = await this.getPlanKeyFromSubscription(subscription);
      const planName = await this.getPlanNameFromSubscription(subscription);
      const maxAllowed = await this.getPlanLimits(planKey);

      // Debug logging
      console.log('ProductLimitService Debug:', {
        productId: subscription.product_id,
        planKey,
        planName,
        maxAllowed,
        subscriptionStatus: subscription.status
      });

      // Count current products
      const currentCount = await this.getProductCount(companyId);

      // Check if limit is reached
      const allowed = currentCount < maxAllowed;

      return {
        allowed,
        reason: allowed ? undefined : 
          `You've reached the maximum of ${maxAllowed} product${maxAllowed > 1 ? 's' : ''} for your ${planName} plan. Please upgrade to create more products.`,
        currentCount,
        maxAllowed,
        planName
      };

    } catch (error) {
      console.error('Error checking product limits:', error);
      return {
        allowed: false,
        reason: 'Unable to verify product limits',
        currentCount: 0,
        maxAllowed: 0,
        planName: 'Unknown'
      };
    }
  }

  /**
   * Get plan information for display purposes
   */
  async getPlanInfo(userId: string): Promise<{
    planName: string;
    maxProducts: number;
    currentCount: number;
    companyId?: string;
  } | null> {
    try {
      // Get user's subscription
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        return null;
      }

      // Get company ID from user's company access
      const { data: companyAccess, error: companyError } = await supabase
        .from('user_company_access')
        .select('company_id')
        .eq('user_id', userId)
        .single();

      if (companyError || !companyAccess) {
        return null;
      }

      const companyId = companyAccess.company_id;
      const planKey = await this.getPlanKeyFromSubscription(subscription);
      const planName = await this.getPlanNameFromSubscription(subscription);
      const maxProducts = await this.getPlanLimits(planKey);
      const currentCount = await this.getProductCount(companyId);

      return {
        planName,
        maxProducts,
        currentCount,
        companyId
      };
    } catch (error) {
      console.error('Error getting plan info:', error);
      return null;
    }
  }
}

export const productLimitService = new ProductLimitService();
