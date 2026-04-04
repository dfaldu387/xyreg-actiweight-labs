import { supabase } from '@/integrations/supabase/client';
import { PlanKey, SUBSCRIPTION_PLANS, getPlanByProductId } from '@/types/subscription';

export interface SubscriptionStatus {
  canAccess: boolean;
  currentPlan: PlanKey | null;
  isActive: boolean;
  isExpired: boolean;
  isTrialing: boolean;
  trialDaysLeft: number;
  isGracePeriod: boolean;
  gracePeriodDaysLeft: number;
}

// Feature access mapping per plan
const PLAN_FEATURES: Record<PlanKey, string[]> = {
  business_connect: [
    'basic_documents',
    'product_management',
    'investor_share',
  ],
  starter: [
    'basic_documents',
    'product_management',
    'basic_reports',
  ],
  professional: [
    'basic_documents',
    'product_management',
    'basic_reports',
    'advanced_compliance',
    'unlimited_products',
    'priority_support',
    'advanced_reports',
    'team_collaboration',
  ],
  enterprise: [
    'basic_documents',
    'product_management',
    'basic_reports',
    'advanced_compliance',
    'unlimited_products',
    'priority_support',
    'advanced_reports',
    'team_collaboration',
    'custom_integrations',
    'dedicated_support',
    'audit_logs',
    'sso',
    'api_access',
  ],
};

// Product limits per plan
const PLAN_LIMITS: Record<PlanKey, { products: number; companies: number }> = {
  business_connect: { products: 1, companies: 1 },
  starter: { products: 5, companies: 1 },
  professional: { products: -1, companies: 5 }, // -1 = unlimited
  enterprise: { products: -1, companies: -1 },
};

class PlanServiceClass {
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    try {
      // Query user_subscriptions table which stores subscription data
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // No subscription found - return default trial status
        return this.getDefaultStatus();
      }

      const now = new Date();
      const subscriptionEnd = data.current_period_end ? new Date(data.current_period_end) : null;
      const trialEnd = data.trial_end ? new Date(data.trial_end) : null;

      // Determine current plan from product_id
      const currentPlan = data.product_id ? getPlanByProductId(data.product_id) : null;

      // Check if in trial period
      const isTrialing = trialEnd ? now < trialEnd && data.status === 'trialing' : false;
      const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

      // Check if subscription is expired
      const isExpired = subscriptionEnd ? now > subscriptionEnd && !isTrialing : false;

      // Grace period (7 days after expiration)
      const gracePeriodEnd = subscriptionEnd ? new Date(subscriptionEnd.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
      const isGracePeriod = isExpired && gracePeriodEnd ? now < gracePeriodEnd : false;
      const gracePeriodDaysLeft = isGracePeriod && gracePeriodEnd
        ? Math.max(0, Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      // Active if status is 'active' and not expired
      const isActive = data.status === 'active' && !isExpired;

      // Can access if subscribed, trialing, or in grace period
      const canAccess = (isActive || isTrialing || isGracePeriod);

      return {
        canAccess,
        currentPlan,
        isActive,
        isExpired,
        isTrialing,
        trialDaysLeft,
        isGracePeriod,
        gracePeriodDaysLeft,
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return this.getDefaultStatus();
    }
  }

  private getDefaultStatus(): SubscriptionStatus {
    return {
      canAccess: true, // Allow access by default (for development/free tier)
      currentPlan: 'starter',
      isActive: false,
      isExpired: false,
      isTrialing: true,
      trialDaysLeft: 30,
      isGracePeriod: false,
      gracePeriodDaysLeft: 0,
    };
  }

  canAccessFeature(plan: PlanKey | null, feature: string): boolean {
    if (!plan) return false;
    const planFeatures = PLAN_FEATURES[plan] || [];
    return planFeatures.includes(feature);
  }

  async canCreateProduct(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const status = await this.getSubscriptionStatus(userId);

      if (!status.canAccess) {
        return { allowed: false, reason: 'Subscription expired or inactive' };
      }

      const plan = status.currentPlan;
      if (!plan) {
        return { allowed: false, reason: 'No active subscription' };
      }

      const limit = PLAN_LIMITS[plan].products;
      if (limit === -1) {
        return { allowed: true }; // Unlimited
      }

      // Count existing products
      const { count, error } = await (supabase
        .from('products')
        .select('id', { count: 'exact', head: true }) as any)
        .eq('created_by', userId);

      if (error) {
        console.error('Error counting products:', error);
        return { allowed: true }; // Allow on error
      }

      if ((count || 0) >= limit) {
        return {
          allowed: false,
          reason: `You have reached the limit of ${limit} products for your ${SUBSCRIPTION_PLANS[plan].name} plan. Upgrade to create more.`
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking product creation:', error);
      return { allowed: true }; // Allow on error
    }
  }

  async canAddCompany(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const status = await this.getSubscriptionStatus(userId);

      if (!status.canAccess) {
        return { allowed: false, reason: 'Subscription expired or inactive' };
      }

      const plan = status.currentPlan;
      if (!plan) {
        return { allowed: false, reason: 'No active subscription' };
      }

      const limit = PLAN_LIMITS[plan].companies;
      if (limit === -1) {
        return { allowed: true }; // Unlimited
      }

      // Count existing companies for this user
      const { count, error } = await (supabase
        .from('companies')
        .select('id', { count: 'exact', head: true }) as any)
        .eq('created_by', userId);

      if (error) {
        console.error('Error counting companies:', error);
        return { allowed: true }; // Allow on error
      }

      if ((count || 0) >= limit) {
        return {
          allowed: false,
          reason: `You have reached the limit of ${limit} companies for your ${SUBSCRIPTION_PLANS[plan].name} plan. Upgrade to add more.`
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking company creation:', error);
      return { allowed: true }; // Allow on error
    }
  }
}

export const planService = new PlanServiceClass();
