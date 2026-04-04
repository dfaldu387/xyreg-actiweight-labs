import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { planService, SubscriptionStatus } from '@/services/plansService';
import { PlanKey } from '@/types/subscription';

export function useFeatureAccess() {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const status = await planService.getSubscriptionStatus(user.id);
        setSubscriptionStatus(status);
      } catch (error) {
        console.error('Error loading subscription status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();
  }, [user?.id]);

  const canAccessFeature = (feature: string): boolean => {
    if (!subscriptionStatus?.canAccess) return false;
    return planService.canAccessFeature(subscriptionStatus.currentPlan, feature);
  };

  const canCreateProduct = async (): Promise<{ allowed: boolean; reason?: string }> => {
    if (!user?.id) return { allowed: false, reason: 'Not authenticated' };
    return planService.canCreateProduct(user.id);
  };

  const canAddCompany = async (): Promise<{ allowed: boolean; reason?: string }> => {
    if (!user?.id) return { allowed: false, reason: 'Not authenticated' };
    return planService.canAddCompany(user.id);
  };

  return {
    subscriptionStatus,
    isLoading,
    canAccessFeature,
    canCreateProduct,
    canAddCompany,
    currentPlan: subscriptionStatus?.currentPlan || null,
    isExpired: subscriptionStatus?.isExpired || false,
    isTrialing: subscriptionStatus?.isTrialing || false,
    trialDaysLeft: subscriptionStatus?.trialDaysLeft || 0,
    isGracePeriod: subscriptionStatus?.isGracePeriod || false,
    gracePeriodDaysLeft: subscriptionStatus?.gracePeriodDaysLeft || 0,
  };
}
