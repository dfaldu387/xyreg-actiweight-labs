import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StripeAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  canceledSubscriptions: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  subscriptionGrowth: Array<{
    period: string;
    subscriptions: number;
    revenue: number;
  }>;
  revenueByPlan: Array<{
    planName: string;
    revenue: number;
    subscriptions: number;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    customerEmail: string;
    createdAt: string;
    description: string;
  }>;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  period?: '7d' | '30d' | '90d' | '1y' | 'custom';
}

export function useStripeAnalytics(filters: AnalyticsFilters = {}) {
  const [analytics, setAnalytics] = useState<StripeAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (newFilters?: AnalyticsFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const queryParams = new URLSearchParams();
      if (newFilters?.startDate) queryParams.append('start_date', newFilters.startDate);
      if (newFilters?.endDate) queryParams.append('end_date', newFilters.endDate);
      if (newFilters?.period) queryParams.append('period', newFilters.period);

      const { data, error } = await supabase.functions.invoke('stripe-analytics', {
        body: {},
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      setAnalytics(data);
    } catch (err: any) {
      console.error('Error fetching Stripe analytics:', err);
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(filters);
  }, [filters.startDate, filters.endDate, filters.period]);

  const refreshAnalytics = () => {
    fetchAnalytics(filters);
  };

  const updateFilters = (newFilters: AnalyticsFilters) => {
    fetchAnalytics(newFilters);
  };

  return {
    analytics,
    isLoading,
    error,
    refreshAnalytics,
    updateFilters,
  };
}
