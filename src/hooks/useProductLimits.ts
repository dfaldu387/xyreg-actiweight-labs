import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { productLimitService, ProductLimitCheck } from '@/services/productLimitService';

export function useProductLimits() {
  const { user } = useAuth();
  const [limitCheck, setLimitCheck] = useState<ProductLimitCheck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [planInfo, setPlanInfo] = useState<{
    planName: string;
    maxProducts: number;
    currentCount: number;
    companyId?: string;
  } | null>(null);

  const checkProductLimit = async (companyId: string) => {
    if (!user) return null;

    setIsLoading(true);
    try {
      const result = await productLimitService.canCreateProduct(companyId, user.id);
      setLimitCheck(result);
      return result;
    } catch (error) {
      console.error('Error checking product limit:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlanInfo = async () => {
    if (!user) return;

    try {
      const info = await productLimitService.getPlanInfo(user.id);
      setPlanInfo(info);
    } catch (error) {
      console.error('Error loading plan info:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadPlanInfo();
    }
  }, [user]);

  return {
    limitCheck,
    isLoading,
    planInfo,
    checkProductLimit,
    loadPlanInfo,
    canCreateProduct: limitCheck?.allowed ?? false,
    limitReason: limitCheck?.reason
  };
}
