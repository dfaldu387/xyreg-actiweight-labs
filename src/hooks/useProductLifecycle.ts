import { useState, useEffect } from 'react';
import { ProductLifecycleService, ProductLifecycleInfo, ProductLifecycleState, LaunchStatus } from '@/services/productLifecycleService';

/**
 * Hook for managing product lifecycle information at the company level
 */
export function useCompanyProductLifecycle(companyId: string | null) {
  const [portfolioSummary, setPortfolioSummary] = useState<{
    totalProducts: number;
    developmentProducts: { count: number; products: ProductLifecycleInfo[] };
    launchedProducts: { count: number; products: ProductLifecycleInfo[] };
    unknownProducts: { count: number; products: ProductLifecycleInfo[] };
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setPortfolioSummary(null);
      setLoading(false);
      return;
    }

    const loadPortfolioSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const summary = await ProductLifecycleService.getCompanyPortfolioSummary(companyId);
        setPortfolioSummary(summary);
      } catch (err) {
        console.error('Error loading portfolio summary:', err);
        setError(err instanceof Error ? err.message : 'Failed to load portfolio summary');
      } finally {
        setLoading(false);
      }
    };

    loadPortfolioSummary();
  }, [companyId]);

  const getProductsByState = async (state: ProductLifecycleState) => {
    if (!companyId) return [];
    return await ProductLifecycleService.getProductsByLifecycleState(companyId, state);
  };

  const refetch = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      setError(null);
      const summary = await ProductLifecycleService.getCompanyPortfolioSummary(companyId);
      setPortfolioSummary(summary);
    } catch (err) {
      console.error('Error refetching portfolio summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to refetch portfolio summary');
    } finally {
      setLoading(false);
    }
  };

  return {
    portfolioSummary,
    loading,
    error,
    getProductsByState,
    refetch,
    // Convenience getters
    developmentProducts: portfolioSummary?.developmentProducts.products || [],
    launchedProducts: portfolioSummary?.launchedProducts.products || [],
    unknownProducts: portfolioSummary?.unknownProducts.products || [],
  };
}

/**
 * Hook for managing individual product lifecycle information
 */
export function useProductLifecycle(productId: string | null) {
  const [lifecycleInfo, setLifecycleInfo] = useState<ProductLifecycleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setLifecycleInfo(null);
      setLoading(false);
      return;
    }

    const loadLifecycleInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const info = await ProductLifecycleService.getProductLifecycleInfo(productId);
        setLifecycleInfo(info);
      } catch (err) {
        console.error('Error loading product lifecycle info:', err);
        setError(err instanceof Error ? err.message : 'Failed to load lifecycle info');
      } finally {
        setLoading(false);
      }
    };

    loadLifecycleInfo();
  }, [productId]);

  const shouldUseRNPV = lifecycleInfo?.isReadyForRNPVAnalysis ?? false;
  const shouldUseCommercialTracking = lifecycleInfo?.isReadyForCommercialTracking ?? false;

  const updateLaunchStatus = async (launchStatus: LaunchStatus, actualLaunchDate?: string) => {
    if (!productId) return false;
    
    const success = await ProductLifecycleService.updateProductLaunchStatus(productId, launchStatus, actualLaunchDate);
    if (success) {
      // Refresh the lifecycle info after updating status
      await refetch();
    }
    return success;
  };

  const refetch = async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      setError(null);
      const info = await ProductLifecycleService.getProductLifecycleInfo(productId);
      setLifecycleInfo(info);
    } catch (err) {
      console.error('Error refetching product lifecycle info:', err);
      setError(err instanceof Error ? err.message : 'Failed to refetch lifecycle info');
    } finally {
      setLoading(false);
    }
  };

  return {
    lifecycleInfo,
    loading,
    error,
    shouldUseRNPV,
    shouldUseCommercialTracking,
    updateLaunchStatus,
    refetch
  };
}