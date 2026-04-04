import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

// Types
export interface NewPricingPlan {
  id: string;
  name: string;
  display_name: string;
  subtitle: string | null;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
  is_free: boolean;
  is_active: boolean;
  included_devices: number;
  included_module_slots: number;
  included_ai_credits: number;
  menu_access: Record<string, boolean>;
  features: Array<{ name: string; included: boolean; phase?: string }>;
  restrictions: string[];
}

export interface NewPricingSignup {
  id: string;
  email: string;
  name: string;
  company_name: string | null;
  phone: string | null;
  selected_plan: string;
  message: string | null;
  status: 'pending' | 'contacted' | 'converted' | 'expired' | 'rejected';
  user_id: string | null;
  company_id: string | null;
  converted_at: string | null;
  created_at: string;
}

export interface NewPricingCompanyPlan {
  id: string;
  company_id: string;
  plan_id: string;
  status: 'active' | 'trial' | 'cancelled' | 'expired' | 'pending';
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  extra_devices: number | null;
  extra_module_slots: number | null;
  ai_booster_packs: number | null;
  monthly_total: number | null;
  metadata: Record<string, unknown> | null;
}

export interface AssignPlanOptions {
  companyId: string;
  planName: string;
  userId?: string;
  status?: 'active' | 'trial';
  trialEndsAt?: string;
  expiresAt?: string;  // Subscription expiration date
  extraDevices?: number;
  extraModuleSlots?: number;
  aiBoosterPacks?: number;
  monthlyTotal?: number;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  // Power Packs
  selectedPacks?: string[];  // ['build', 'ops', 'monitor']
  isGrowthSuite?: boolean;   // true if all 3 packs bundled
  // Specialist Modules
  specialistModules?: {
    predicateFinder?: boolean;
    ipPatent?: boolean;
  };
  // Individual modules (à la carte)
  selectedModules?: string[];
  // Investor add-ons
  kpiWatchtowerCount?: number;
  ddRoomCount?: number;
}

/**
 * New Pricing Service - Database operations for the new pricing system
 */
export const newPricingService = {
  /**
   * Get all active pricing plans
   */
  async getAllPlans(): Promise<NewPricingPlan[]> {
    const { data, error } = await supabase
      .from('new_pricing_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[newPricingService.getAllPlans] Error:', error);
      throw error;
    }

    return data as unknown as NewPricingPlan[];
  },

  /**
   * Get a plan by name
   */
  async getPlanByName(planName: string): Promise<NewPricingPlan | null> {
    const { data, error } = await supabase
      .from('new_pricing_plans')
      .select('*')
      .eq('name', planName)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('[newPricingService.getPlanByName] Error:', error);
      throw error;
    }

    return data as unknown as NewPricingPlan;
  },

  /**
   * Get a plan by ID
   */
  async getPlanById(planId: string): Promise<NewPricingPlan | null> {
    const { data, error } = await supabase
      .from('new_pricing_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[newPricingService.getPlanById] Error:', error);
      throw error;
    }

    return data as unknown as NewPricingPlan;
  },

  /**
   * Create a new signup from pricing page
   */
  async createSignup(data: {
    email: string;
    name: string;
    company_name?: string;
    phone?: string;
    selected_plan: string;
    message?: string;
  }): Promise<NewPricingSignup> {
    const { data: signup, error } = await supabase
      .from('new_pricing_signups')
      .insert({
        email: data.email,
        name: data.name,
        company_name: data.company_name || null,
        phone: data.phone || null,
        selected_plan: data.selected_plan,
        message: data.message || null,
        status: 'pending',
        metadata: {
          source: 'pricing_page',
          submitted_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      console.error('[newPricingService.createSignup] Error:', error);
      throw error;
    }

    return signup as NewPricingSignup;
  },

  /**
   * Get signup by ID
   */
  async getSignupById(signupId: string): Promise<NewPricingSignup | null> {
    const { data, error } = await supabase
      .from('new_pricing_signups')
      .select('*')
      .eq('id', signupId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[newPricingService.getSignupById] Error:', error);
      throw error;
    }

    return data as NewPricingSignup;
  },

  /**
   * Update signup status after account creation
   */
  async convertSignup(signupId: string, userId: string, companyId: string): Promise<void> {
    const { error } = await supabase
      .from('new_pricing_signups')
      .update({
        status: 'converted',
        user_id: userId,
        company_id: companyId,
        converted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', signupId);

    if (error) {
      console.error('[newPricingService.convertSignup] Error:', error);
      throw error;
    }
  },

  /**
   * Get company's current plan (active or trial)
   */
  async getCompanyPlan(companyId: string): Promise<(NewPricingCompanyPlan & { plan: NewPricingPlan }) | null> {
    const { data, error } = await supabase
      .from('new_pricing_company_plans')
      .select(`
        *,
        plan:new_pricing_plans(*)
      `)
      .eq('company_id', companyId)
      .in('status', ['active', 'trial', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[newPricingService.getCompanyPlan] Error:', error);
      throw error;
    }

    return data as unknown as (NewPricingCompanyPlan & { plan: NewPricingPlan });
  },

  /**
   * Assign a plan to a company (simple version for backward compatibility)
   */
  async assignPlanToCompany(
    companyId: string,
    planName: string,
    userId?: string
  ): Promise<void> {
    return this.assignPlanToCompanyWithOptions({
      companyId,
      planName,
      userId
    });
  },

  /**
   * Assign a plan to a company with full options (including Stripe details and add-ons)
   */
  async assignPlanToCompanyWithOptions(options: AssignPlanOptions): Promise<void> {
    const {
      companyId,
      planName,
      userId,
      status = 'active',
      trialEndsAt,
      expiresAt,
      extraDevices,
      extraModuleSlots,
      aiBoosterPacks,
      monthlyTotal,
      stripeSubscriptionId,
      stripeCustomerId,
      // Add-on options
      selectedPacks,
      isGrowthSuite,
      specialistModules,
      selectedModules,
      kpiWatchtowerCount,
      ddRoomCount,
    } = options;

    // Get the plan
    const plan = await this.getPlanByName(planName);
    if (!plan) {
      throw new Error(`Plan not found: ${planName}`);
    }

    // Calculate expiration date (default: 1 month from now for monthly subscriptions)
    const calculatedExpiresAt = expiresAt || (() => {
      const expires = new Date();
      expires.setMonth(expires.getMonth() + 1);
      return expires.toISOString();
    })();

    // Build metadata object with all add-on details
    const metadata: Record<string, Json> = {};
    if (stripeSubscriptionId) metadata.stripe_subscription_id = stripeSubscriptionId;
    if (stripeCustomerId) metadata.stripe_customer_id = stripeCustomerId;

    // Add-on metadata
    if (selectedPacks && selectedPacks.length > 0) {
      metadata.selected_packs = selectedPacks;
      metadata.packs_expires_at = calculatedExpiresAt; // Packs expire with subscription
    }
    if (isGrowthSuite) {
      metadata.is_growth_suite = true;
    }
    if (specialistModules) {
      if (specialistModules.predicateFinder) {
        metadata.predicate_finder_active = true;
        metadata.predicate_finder_expires_at = calculatedExpiresAt;
      }
      if (specialistModules.ipPatent) {
        metadata.ip_patent_active = true;
        metadata.ip_patent_expires_at = calculatedExpiresAt;
      }
    }
    if (selectedModules && selectedModules.length > 0) {
      metadata.selected_modules = selectedModules;
      metadata.modules_expires_at = calculatedExpiresAt;
    }
    if (kpiWatchtowerCount && kpiWatchtowerCount > 0) {
      metadata.kpi_watchtower_count = kpiWatchtowerCount;
      metadata.kpi_watchtower_expires_at = calculatedExpiresAt;
    }
    if (ddRoomCount && ddRoomCount > 0) {
      metadata.dd_room_count = ddRoomCount;
      metadata.dd_room_expires_at = calculatedExpiresAt;
    }

    console.log('[newPricingService] Assigning plan with add-ons:', {
      planName, selectedPacks, isGrowthSuite, specialistModules, extraDevices, aiBoosterPacks
    });

    // Check for existing plan
    const { data: existing } = await supabase
      .from('new_pricing_company_plans')
      .select('id, plan_id')
      .eq('company_id', companyId)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('new_pricing_company_plans')
        .update({
          plan_id: plan.id,
          status: status,
          expires_at: calculatedExpiresAt,
          trial_ends_at: trialEndsAt || null,
          extra_devices: extraDevices || null,
          extra_module_slots: extraModuleSlots || null,
          ai_booster_packs: aiBoosterPacks || null,
          monthly_total: monthlyTotal || null,
          metadata: Object.keys(metadata).length > 0 ? metadata : null,
          updated_at: new Date().toISOString()
        })
        .eq('company_id', companyId);

      if (error) {
        console.error('[newPricingService.assignPlanToCompanyWithOptions] Update error:', error);
        throw error;
      }

      // Record history
      await supabase.from('new_pricing_plan_history').insert({
        company_id: companyId,
        old_plan_id: existing.plan_id,
        new_plan_id: plan.id,
        changed_by: userId || null,
        change_reason: 'Plan updated',
        metadata: metadata
      });
    } else {
      // Insert new
      const { error } = await supabase
        .from('new_pricing_company_plans')
        .insert({
          company_id: companyId,
          plan_id: plan.id,
          status: status,
          started_at: new Date().toISOString(),
          expires_at: calculatedExpiresAt,
          trial_ends_at: trialEndsAt || null,
          extra_devices: extraDevices || null,
          extra_module_slots: extraModuleSlots || null,
          ai_booster_packs: aiBoosterPacks || null,
          monthly_total: monthlyTotal || null,
          metadata: Object.keys(metadata).length > 0 ? metadata : null
        });

      if (error) {
        console.error('[newPricingService.assignPlanToCompanyWithOptions] Insert error:', error);
        throw error;
      }

      // Record history
      await supabase.from('new_pricing_plan_history').insert({
        company_id: companyId,
        old_plan_id: null,
        new_plan_id: plan.id,
        changed_by: userId || null,
        change_reason: 'Initial plan assignment',
        metadata: metadata
      });
    }

    console.log('[newPricingService.assignPlanToCompanyWithOptions] Assigned plan:', planName, 'to company:', companyId, 'with options:', options);
  },

  /**
   * Check if a menu item is enabled for a plan
   */
  isMenuEnabledForPlan(plan: NewPricingPlan | null, menuKey: string): boolean {
    if (!plan?.menu_access) {
      return true; // No restrictions defined
    }

    const value = plan.menu_access[menuKey];

    // If not defined, default to false for Genesis, true for others
    if (value === undefined) {
      return plan.name !== 'genesis';
    }

    return value === true;
  },

  /**
   * Get Genesis plan menu access (for restricting menus during signup)
   */
  async getGenesisMenuAccess(): Promise<Record<string, boolean>> {
    const plan = await this.getPlanByName('genesis');
    return plan?.menu_access || {};
  }
};

export default newPricingService;
