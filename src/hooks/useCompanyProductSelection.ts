
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCompanyProductsForSelection } from '@/services/projectCreationService.tsx';
import { ProductForSelection } from '@/types/project';

export function useCompanyProductSelection(companyId: string) {
  const {
    data: products = [],
    isLoading,
    error,
    refetch
  } = useQuery<ProductForSelection[], Error>({
    queryKey: ['company-products-selection', companyId],
    queryFn: async () => {
      const result = await getCompanyProductsForSelection(companyId);
      return result;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      console.error('[useCompanyProductSelection] Query failed:', { failureCount, error });
      return failureCount < 3; // Retry up to 3 times
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Log success/error using useEffect instead of deprecated callbacks
  useEffect(() => {
    if (error) {
      console.error('[useCompanyProductSelection] Query error:', error);
    }
  }, [error]);

  useEffect(() => {
    // Products loaded successfully
  }, [products, companyId]);

  return {
    products,
    isLoading,
    error,
    refetch
  };
}
