import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';

// Types for the new pricing system
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
  extra_device_cost: number;
  extra_module_slot_cost: number;
  ai_booster_cost: number;
  ai_booster_credits: number;
  menu_access: Record<string, boolean>;
  features: Array<{ name: string; included: boolean; phase?: string }>;
  restrictions: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NewPricingCompanyPlan {
  id: string;
  company_id: string;
  plan_id: string;
  status: 'active' | 'trial' | 'cancelled' | 'expired' | 'pending';
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  extra_devices: number;
  extra_module_slots: number;
  ai_booster_packs: number;
  monthly_total: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  plan?: NewPricingPlan;
}

interface UseNewPricingPlanReturn {
  /** The current company's plan details */
  companyPlan: NewPricingCompanyPlan | null;
  /** The plan configuration */
  plan: NewPricingPlan | null;
  /** Menu access configuration from the plan */
  menuAccess: Record<string, boolean> | null;
  /** Plan features */
  features: Array<{ name: string; included: boolean; phase?: string }>;
  /** Plan restrictions */
  restrictions: string[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Check if a menu item is enabled */
  isMenuEnabled: (menuKey: string) => boolean;
  /** The current plan name */
  planName: string | null;
  /** Whether the plan is free */
  isFree: boolean;
  /** Whether the plan is Genesis */
  isGenesis: boolean;
  /** Refresh the plan data */
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage the company's pricing plan from the new pricing system.
 *
 * Usage:
 * ```tsx
 * const { plan, isMenuEnabled, isGenesis, planName } = useNewPricingPlan();
 *
 * // Check if a menu is enabled
 * const canAccessDevices = isMenuEnabled('devices');
 *
 * // Check if using Genesis plan
 * if (isGenesis) {
 *   // Show Genesis-specific UI
 * }
 * ```
 */
export function useNewPricingPlan(): UseNewPricingPlanReturn {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  // Use React Query for caching company plan data
  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['new-pricing-company-plan', companyId],
    queryFn: async () => {
      if (!companyId) return { companyPlan: null, plan: null };

      const { data: companyPlanData, error: companyPlanError } = await supabase
        .from('new_pricing_company_plans')
        .select(`
          *,
          plan:new_pricing_plans(*)
        `)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .maybeSingle();

      if (companyPlanError) {
        // No plan found - might be a new company
        if (companyPlanError.code === 'PGRST116') {
          return { companyPlan: null, plan: null };
        }
        throw new Error(companyPlanError.message);
      }

      if (companyPlanData) {
        return {
          companyPlan: companyPlanData as NewPricingCompanyPlan,
          plan: companyPlanData.plan as NewPricingPlan
        };
      }

      return { companyPlan: null, plan: null };
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes - pricing plans rarely change
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });

  const companyPlan = data?.companyPlan ?? null;
  const plan = data?.plan ?? null;
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load pricing plan') : null;

  // Refresh function that invalidates the cache
  const fetchPlan = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['new-pricing-company-plan', companyId] });
  }, [queryClient, companyId]);

  // Get menu access from plan
  const menuAccess = useMemo(() => {
    if (!plan?.menu_access) return null;
    return plan.menu_access as Record<string, boolean>;
  }, [plan]);

  // Get features from plan
  const features = useMemo(() => {
    if (!plan?.features) return [];
    return plan.features as Array<{ name: string; included: boolean; phase?: string }>;
  }, [plan]);

  // Get restrictions from plan
  const restrictions = useMemo(() => {
    if (!plan?.restrictions) return [];
    return plan.restrictions as string[];
  }, [plan]);

  // Check if a menu item is enabled
  const isMenuEnabled = useCallback((menuKey: string): boolean => {
    if (!menuAccess) {
      // No menu access defined - allow all by default
      return true;
    }

    // Check if the key exists in menu_access
    const value = menuAccess[menuKey];

    // If not defined, default to false for Genesis (restrictive) or true for others
    if (value === undefined) {
      return plan?.name !== 'genesis';
    }

    return value === true;
  }, [menuAccess, plan?.name]);

  // Get plan name
  const planName = useMemo(() => {
    return plan?.display_name || plan?.name || null;
  }, [plan]);

  // Check if plan is free
  const isFree = useMemo(() => {
    return plan?.is_free ?? false;
  }, [plan]);

  // Check if plan is Genesis
  const isGenesis = useMemo(() => {
    return plan?.name === 'genesis';
  }, [plan]);

  return {
    companyPlan,
    plan,
    menuAccess,
    features,
    restrictions,
    isLoading,
    error,
    isMenuEnabled,
    planName,
    isFree,
    isGenesis,
    refresh: fetchPlan,
  };
}

/**
 * Hook to fetch all available pricing plans
 */
export function useNewPricingPlans() {
  const { data: plans = [], isLoading, error: queryError } = useQuery({
    queryKey: ['new-pricing-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('new_pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw new Error(error.message);
      return data as NewPricingPlan[];
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes - pricing plans rarely change
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load pricing plans') : null;

  return { plans, isLoading, error };
}

/**
 * Get a specific plan by name
 */
export async function getPlanByName(planName: string): Promise<NewPricingPlan | null> {
  const { data, error } = await supabase
    .from('new_pricing_plans')
    .select('*')
    .eq('name', planName)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as NewPricingPlan;
}

/**
 * Assign a plan to a company
 */
export async function assignPlanToCompany(
  companyId: string,
  planName: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the plan ID
    const plan = await getPlanByName(planName);
    if (!plan) {
      return { success: false, error: `Plan not found: ${planName}` };
    }

    // Check if company already has a plan
    const { data: existingPlan } = await supabase
      .from('new_pricing_company_plans')
      .select('id, plan_id')
      .eq('company_id', companyId)
      .maybeSingle();

    if (existingPlan) {
      // Update existing plan
      const { error: updateError } = await supabase
        .from('new_pricing_company_plans')
        .update({
          plan_id: plan.id,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('company_id', companyId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Record history
      await supabase.from('new_pricing_plan_history').insert({
        company_id: companyId,
        old_plan_id: existingPlan.plan_id,
        new_plan_id: plan.id,
        changed_by: userId || null,
        change_reason: 'Plan updated'
      });
    } else {
      // Insert new plan
      const { error: insertError } = await supabase
        .from('new_pricing_company_plans')
        .insert({
          company_id: companyId,
          plan_id: plan.id,
          status: 'active',
          started_at: new Date().toISOString()
        });

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      // Record history
      await supabase.from('new_pricing_plan_history').insert({
        company_id: companyId,
        old_plan_id: null,
        new_plan_id: plan.id,
        changed_by: userId || null,
        change_reason: 'Initial plan assignment'
      });
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to assign plan' };
  }
}

/**
 * Update signup status after account creation
 */
export async function updateSignupStatus(
  signupId: string,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
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
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to update signup status' };
  }
}
