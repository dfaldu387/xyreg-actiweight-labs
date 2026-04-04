import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useSubscriptionContext } from '@/context/SubscriptionContext';

/**
 * Genesis Plan Restrictions:
 * - 1 device only
 * - 1 market only
 * - Free tier (no payment required)
 */
export interface GenesisRestrictions {
  maxDevices: number;
  maxMarkets: number;
  isFree: boolean;
}

export interface UseGenesisRestrictionsReturn {
  /** Whether the user is on Genesis plan */
  isGenesis: boolean;
  /** Loading state while checking plan */
  isLoading: boolean;
  /** Genesis plan restrictions */
  restrictions: GenesisRestrictions;
  /** Check if a feature is locked for Genesis users */
  isLocked: (feature: 'device_types' | 'markets' | 'multiple_devices') => boolean;
  /** The user's selected plan from signup */
  selectedPlan: string | null;
  /** Current device count for the company */
  currentDeviceCount: number;
  /** Whether device limit is reached */
  deviceLimitReached: boolean;
  /** Refresh the device count */
  refreshDeviceCount: () => Promise<void>;
}

const GENESIS_RESTRICTIONS: GenesisRestrictions = {
  maxDevices: 1,
  maxMarkets: 1,
  isFree: true,
};

const DEFAULT_RESTRICTIONS: GenesisRestrictions = {
  maxDevices: Infinity,
  maxMarkets: Infinity,
  isFree: false,
};

/**
 * Hook to check if the current user is on a Genesis plan and get restrictions.
 *
 * Uses SubscriptionContext (already loaded at app startup) for instant plan detection
 * — no flash of unlocked state.
 *
 * Genesis is part of CoreOS with restrictions:
 * - 1 device only
 * - 1 market only
 * - Free tier
 *
 * @example
 * ```tsx
 * const { isGenesis, restrictions, isLocked } = useGenesisRestrictions();
 *
 * // Check if user is on Genesis
 * if (isGenesis) {
 *   // Show Genesis-specific UI
 * }
 *
 * // Check market limit
 * if (restrictions.maxMarkets === 1) {
 *   // Show single select instead of multi-select
 * }
 *
 * // Check if a feature is locked
 * if (isLocked('device_types')) {
 *   // Only allow "New Device" type
 * }
 * ```
 */
export function useGenesisRestrictions(companyId?: string): UseGenesisRestrictionsReturn {
  const { user } = useAuth();
  const { planName, isSubscriptionLoading } = useSubscriptionContext();
  const [currentDeviceCount, setCurrentDeviceCount] = useState(0);

  // Derive Genesis status from SubscriptionContext (already loaded at app startup)
  const isGenesis = useMemo(() => {
    if (isSubscriptionLoading) return false;
    if (!planName) return true; // Default to Genesis when no plan found (matches AppLayout behavior)
    return planName.toLowerCase() === 'genesis';
  }, [planName, isSubscriptionLoading]);

  const selectedPlan = planName || null;
  const isLoading = isSubscriptionLoading;

  // Resolve company ID for device count query
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const effectiveCompanyId = companyId || userCompanyId;

  // Get company ID from user_company_access if not provided
  useEffect(() => {
    if (companyId) {
      setUserCompanyId(companyId);
      return;
    }

    if (!user?.id) return;

    const fetchCompanyId = async () => {
      try {
        const { data, error } = await supabase
          .from('user_company_access')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .single();

        if (!error && data) {
          setUserCompanyId(data.company_id);
        }
      } catch (err) {
        console.error('[useGenesisRestrictions] Error fetching company ID:', err);
      }
    };

    fetchCompanyId();
  }, [user?.id, companyId]);

  // Fetch device count for company
  const refreshDeviceCount = useCallback(async () => {
    if (!effectiveCompanyId) return;

    try {
      const { count, error } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', effectiveCompanyId)
        .eq('is_archived', false);

      if (!error && count !== null) {
        setCurrentDeviceCount(count);
      }
    } catch (err) {
      console.error('[useGenesisRestrictions] Error fetching device count:', err);
    }
  }, [effectiveCompanyId]);

  // Fetch device count when company ID is available
  useEffect(() => {
    if (effectiveCompanyId) {
      refreshDeviceCount();
    }
  }, [effectiveCompanyId, refreshDeviceCount]);

  const restrictions = useMemo(() => {
    return isGenesis ? GENESIS_RESTRICTIONS : DEFAULT_RESTRICTIONS;
  }, [isGenesis]);

  const deviceLimitReached = useMemo(() => {
    if (!isGenesis) return false;
    return currentDeviceCount >= GENESIS_RESTRICTIONS.maxDevices;
  }, [isGenesis, currentDeviceCount]);

  const isLocked = (feature: 'device_types' | 'markets' | 'multiple_devices'): boolean => {
    if (!isGenesis) return false;

    switch (feature) {
      case 'device_types':
        // Only "New Device" allowed, others locked
        return true;
      case 'markets':
        // Only 1 market allowed
        return true;
      case 'multiple_devices':
        // Only 1 device allowed
        return true;
      default:
        return false;
    }
  };

  return {
    isGenesis,
    isLoading,
    restrictions,
    isLocked,
    selectedPlan,
    currentDeviceCount,
    deviceLimitReached,
    refreshDeviceCount,
  };
}

/**
 * Helper to check if a device type is allowed for Genesis users
 */
export function isDeviceTypeAllowedForGenesis(deviceType: string): boolean {
  // Genesis only allows 'new_product' device type
  return deviceType === 'new_product';
}

/**
 * Get the maximum number of markets allowed based on plan
 */
export function getMaxMarketsForPlan(isGenesis: boolean): number {
  return isGenesis ? GENESIS_RESTRICTIONS.maxMarkets : Infinity;
}

/**
 * Get the maximum number of devices allowed based on plan
 */
export function getMaxDevicesForPlan(isGenesis: boolean): number {
  return isGenesis ? GENESIS_RESTRICTIONS.maxDevices : Infinity;
}
