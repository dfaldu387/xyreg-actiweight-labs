import { useMemo } from 'react';
import { Product } from '@/types/client';
import { differenceInDays } from 'date-fns';

interface DashboardMetrics {
  totalPhases: number;
  completedPercentage: number;
  daysToFinish: number;
  daysOverdue: number;
  sparklineData: number[];
}

export function useDeviceDashboardMetrics(
  product: Product | undefined,
  totalPhases: number,
  completedPhases: number,
  overdueCount: number
): DashboardMetrics {
  return useMemo(() => {
    const isLaunched = !!product?.actual_launch_date;

    const completedPercentage = isLaunched
      ? 100
      : totalPhases > 0 
        ? Math.round((completedPhases / totalPhases) * 100) 
        : 0;

    // Calculate days to finish from projected launch date
    const daysToFinish = isLaunched
      ? 0
      : product?.projected_launch_date
        ? Math.max(0, differenceInDays(new Date(product.projected_launch_date), new Date()))
        : 0;

    // Generate sample sparkline data (last 7 days trend)
    // In real implementation, this would come from historical data
    const sparklineData = [65, 70, 68, 75, 80, 85, completedPercentage];

    return {
      totalPhases,
      completedPercentage,
      daysToFinish,
      daysOverdue: overdueCount,
      sparklineData
    };
  }, [product, totalPhases, completedPhases, overdueCount]);
}
